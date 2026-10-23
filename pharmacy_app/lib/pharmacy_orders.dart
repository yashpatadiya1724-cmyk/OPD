import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

// ============================================================
// PHARMACY ORDERS MODULE — MediQ v5 (F25)
// Blinkit-style incoming prescription orders:
// - Real-time order feed from patients
// - Order lifecycle: placed → confirmed → packing → ready → picked_up/delivered
// - Pickup code verification
// - Order details with Rx items
// ============================================================

class PharmacyOrdersTab extends StatefulWidget {
  final String pharmacyId;

  const PharmacyOrdersTab({super.key, required this.pharmacyId});

  @override
  State<PharmacyOrdersTab> createState() => _PharmacyOrdersTabState();
}

class _PharmacyOrdersTabState extends State<PharmacyOrdersTab> {
  String _filterStatus = 'all';

  final List<String> _statusFilters = [
    'all', 'placed', 'confirmed', 'packing', 'ready', 'picked_up', 'delivered',
  ];

  Color _getStatusColor(String status) {
    switch (status) {
      case 'placed': return const Color(0xFF3B82F6);
      case 'confirmed': return const Color(0xFF8B5CF6);
      case 'packing': return const Color(0xFFD97706);
      case 'ready': return const Color(0xFF10B981);
      case 'picked_up': return const Color(0xFF059669);
      case 'delivered': return const Color(0xFF059669);
      case 'out_for_delivery': return const Color(0xFF06B6D4);
      case 'cancelled': return const Color(0xFFEF4444);
      case 'partial': return const Color(0xFFD97706);
      default: return const Color(0xFF64748B);
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'placed': return Icons.receipt_long;
      case 'confirmed': return Icons.check_circle;
      case 'packing': return Icons.inventory_2;
      case 'ready': return Icons.done_all;
      case 'picked_up': return Icons.shopping_bag;
      case 'delivered': return Icons.local_shipping;
      case 'out_for_delivery': return Icons.delivery_dining;
      case 'cancelled': return Icons.cancel;
      default: return Icons.circle;
    }
  }

  Future<void> _updateOrderStatus(String orderId, String newStatus, {String? reason}) async {
    try {
      final validTransitions = {
        'placed': ['confirmed', 'cancelled'],
        'confirmed': ['packing', 'cancelled'],
        'packing': ['ready', 'partial'],
        'partial': ['ready', 'cancelled'],
        'ready': ['out_for_delivery', 'picked_up'],
        'out_for_delivery': ['delivered'],
      };

      final orderRef = FirebaseFirestore.instance.collection('pharmacyOrders').doc(orderId);
      final orderDoc = await orderRef.get();
      if (!orderDoc.exists) return;

      final currentStatus = orderDoc.data()?['orderStatus'] ?? '';
      final allowed = validTransitions[currentStatus] ?? [];

      if (!allowed.contains(newStatus)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Cannot move from "$currentStatus" to "$newStatus"'), backgroundColor: Colors.red),
          );
        }
        return;
      }

      final updateData = <String, dynamic>{
        'orderStatus': newStatus,
        '${newStatus}At': FieldValue.serverTimestamp(),
      };

      if (newStatus == 'cancelled') {
        updateData['cancelReason'] = reason ?? 'Cancelled by pharmacy';
        // Release stock for cancelled orders
        final items = orderDoc.data()?['items'] as List? ?? [];
        for (final item in items) {
          if (item is Map) {
            final drugId = item['drugId'];
            if (drugId != null) {
              final invRef = FirebaseFirestore.instance
                  .collection('pharmacies')
                  .doc(widget.pharmacyId)
                  .collection('inventory')
                  .doc(drugId);
              await invRef.update({
                'availableQty': FieldValue.increment(item['qty'] ?? 0),
                'lastUpdated': FieldValue.serverTimestamp(),
              });
            }
          }
        }
      }

      await orderRef.update(updateData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Order updated to ${newStatus.replaceAll('_', ' ').toUpperCase()}'),
            backgroundColor: _getStatusColor(newStatus),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showPickupVerifyDialog(BuildContext context, String orderId, String pickupCode) {
    final codeCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.qr_code, color: Color(0xFF059669)),
            SizedBox(width: 8),
            Text('Verify Pickup Code', style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the 4-digit code shown on patient\'s app:', style: TextStyle(fontSize: 13)),
            const SizedBox(height: 16),
            TextField(
              controller: codeCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 4,
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 12),
              decoration: InputDecoration(
                counterText: '',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                hintText: '• • • •',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              if (codeCtrl.text.trim() == pickupCode) {
                Navigator.pop(ctx);
                await _updateOrderStatus(orderId, 'picked_up');
              } else {
                // Increment attempts
                await FirebaseFirestore.instance
                    .collection('pharmacyOrders')
                    .doc(orderId)
                    .update({
                  'pickupCodeAttempts': FieldValue.increment(1),
                });

                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('❌ Wrong code! Try again.'), backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: const Text('Verify', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shopping_bag, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text('Orders', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('pharmacyOrders')
            .where('pharmacyId', isEqualTo: widget.pharmacyId)
            .orderBy('placedAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          var orders = snapshot.data!.docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            return {'id': doc.id, ...data};
          }).toList();

          if (_filterStatus != 'all') {
            orders = orders.where((o) => o['orderStatus'] == _filterStatus).toList();
          }

          // Stats
          final pendingCount = snapshot.data!.docs.where((d) {
            final s = (d.data() as Map)['orderStatus'];
            return s == 'placed' || s == 'confirmed' || s == 'packing';
          }).length;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Pending Orders Alert
              if (pendingCount > 0)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFEFF6FF), Color(0xFFDBEAFE)]),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF93C5FD)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active, color: Color(0xFF3B82F6)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          '$pendingCount order${pendingCount > 1 ? 's' : ''} need attention!',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF1D4ED8)),
                        ),
                      ),
                    ],
                  ),
                ),

              // Status Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _statusFilters.map((st) {
                    final isSel = _filterStatus == st;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(
                          st == 'all' ? 'ALL' : st.replaceAll('_', ' ').toUpperCase(),
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isSel ? Colors.white : const Color(0xFF334155)),
                        ),
                        selected: isSel,
                        onSelected: (s) => setState(() => _filterStatus = st),
                        selectedColor: st == 'all' ? const Color(0xFF3B82F6) : _getStatusColor(st),
                        backgroundColor: Colors.white,
                        side: BorderSide(color: isSel ? Colors.transparent : const Color(0xFFCBD5E1)),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),

              if (orders.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.shopping_bag_outlined, size: 48, color: Color(0xFFCBD5E1)),
                        SizedBox(height: 12),
                        Text('No orders found.', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ),

              // Order Cards
              ...orders.map((order) => _buildOrderCard(order, context)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order, BuildContext context) {
    final orderId = order['id'] ?? '';
    final status = order['orderStatus'] ?? 'placed';
    final items = order['items'] as List? ?? [];
    final grandTotal = order['grandTotal'] ?? 0;
    final fulfillment = order['fulfillmentType'] ?? 'pickup';
    final pickupCode = order['pickupCode'] ?? '';
    final placedAt = order['placedAt'] as Timestamp?;
    final patientId = order['patientId'] ?? 'Unknown';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(_getStatusIcon(status), color: _getStatusColor(status), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      '#${orderId.substring(0, 8).toUpperCase()}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _getStatusColor(status)),
                  ),
                  child: Text(
                    status.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: _getStatusColor(status)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Time & Type
            Row(
              children: [
                Icon(
                  fulfillment == 'delivery' ? Icons.delivery_dining : Icons.store,
                  size: 14, color: const Color(0xFF64748B),
                ),
                const SizedBox(width: 4),
                Text(
                  '${fulfillment == "delivery" ? "Delivery" : "Pickup"} • ${placedAt != null ? DateFormat('dd MMM, hh:mm a').format(placedAt.toDate()) : ""}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                ),
              ],
            ),
            const Divider(height: 16),

            // Items
            ...items.take(3).map((item) {
              if (item is! Map) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.medication, size: 14, color: Color(0xFF059669)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '${item['brandName'] ?? 'Medicine'} × ${item['qty']}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text('₹${item['totalPrice'] ?? 0}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  ],
                ),
              );
            }),
            if (items.length > 3)
              Text('+${items.length - 3} more items', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),

            const Divider(height: 16),

            // Total & Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total: ₹$grandTotal', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
                // Action buttons based on status
                Row(
                  children: _getActionButtons(orderId, status, pickupCode, context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _getActionButtons(String orderId, String status, String pickupCode, BuildContext context) {
    switch (status) {
      case 'placed':
        return [
          _actionButton('Accept', const Color(0xFF059669), () => _updateOrderStatus(orderId, 'confirmed')),
          const SizedBox(width: 6),
          _actionButton('Reject', const Color(0xFFEF4444), () => _updateOrderStatus(orderId, 'cancelled', reason: 'Rejected by pharmacy')),
        ];
      case 'confirmed':
        return [
          _actionButton('Start Packing', const Color(0xFFD97706), () => _updateOrderStatus(orderId, 'packing')),
        ];
      case 'packing':
        return [
          _actionButton('Mark Ready', const Color(0xFF10B981), () => _updateOrderStatus(orderId, 'ready')),
        ];
      case 'ready':
        return [
          _actionButton('Verify Pickup', const Color(0xFF059669), () => _showPickupVerifyDialog(context, orderId, pickupCode)),
        ];
      default:
        return [];
    }
  }

  Widget _actionButton(String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white)),
      ),
    );
  }
}
