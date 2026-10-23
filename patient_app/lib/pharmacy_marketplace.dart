import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

// ============================================================
// PATIENT — MULTI-PHARMACY RX VIEW (MediQ v5, F22)
// Shows prescription items + available pharmacies with:
// - Stock match per item (available / alternative / not available)
// - Price comparison
// - Generic savings highlight
// - Order placement
// ============================================================

class PharmacyMarketplaceScreen extends StatefulWidget {
  final String rxId;
  final String patientId;

  const PharmacyMarketplaceScreen({
    super.key,
    required this.rxId,
    required this.patientId,
  });

  @override
  State<PharmacyMarketplaceScreen> createState() => _PharmacyMarketplaceScreenState();
}

class _PharmacyMarketplaceScreenState extends State<PharmacyMarketplaceScreen> {
  Map<String, dynamic>? _rxData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPrescription();
  }

  Future<void> _loadPrescription() async {
    try {
      final rxDoc = await FirebaseFirestore.instance.doc('prescriptions/${widget.rxId}').get();
      if (rxDoc.exists) {
        setState(() {
          _rxData = rxDoc.data();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading Rx: $e');
      setState(() => _isLoading = false);
    }
  }

  Color _getItemStatusColor(String status) {
    switch (status) {
      case 'available': return const Color(0xFF10B981);
      case 'alternative_available': return const Color(0xFF3B82F6);
      case 'generic_available': return const Color(0xFF059669);
      case 'not_available': return const Color(0xFFEF4444);
      default: return const Color(0xFF64748B);
    }
  }

  IconData _getPharmacyTypeIcon(String type) {
    switch (type) {
      case 'hospital': return Icons.local_hospital;
      case 'jan_aushadhi': return Icons.volunteer_activism;
      case 'chain': return Icons.storefront;
      case 'independent': return Icons.store;
      default: return Icons.store;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF090D16)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Row(
          children: [
            Icon(Icons.receipt_long, color: Color(0xFF059669), size: 22),
            SizedBox(width: 8),
            Text('Order Medicines', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _rxData == null
              ? const Center(child: Text('Prescription not found'))
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final items = (_rxData?['items'] as List?) ?? [];
    final doctorName = _rxData?['doctorName'] ?? 'Doctor';
    final hospitalName = _rxData?['hospitalName'] ?? '';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Prescription Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFA7F3D0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.description, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Prescription by $doctorName', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF065F46))),
                        if (hospitalName.isNotEmpty)
                          Text(hospitalName, style: const TextStyle(fontSize: 12, color: Color(0xFF047857), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 20, color: Color(0xFFA7F3D0)),
              // Medicine list
              ...items.map((item) {
                final name = item['drugName'] ?? item['brandName'] ?? 'Medicine';
                final dosage = item['dosage'] ?? '';
                final duration = item['duration'] ?? '';
                final qty = item['quantity'] ?? '';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      const Icon(Icons.medication, size: 16, color: Color(0xFF059669)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '$name ${dosage.isNotEmpty ? "• $dosage" : ""} ${duration.isNotEmpty ? "• $duration" : ""} ${qty.toString().isNotEmpty ? "× $qty" : ""}',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF065F46)),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Section Title
        const Row(
          children: [
            Icon(Icons.local_pharmacy, color: Color(0xFF3B82F6), size: 20),
            SizedBox(width: 8),
            Text('Available Pharmacies', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
          ],
        ),
        const SizedBox(height: 4),
        const Text('Sorted by availability & price', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        const SizedBox(height: 12),

        // Pharmacy Matches — Real-time
        StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .doc('prescriptions/${widget.rxId}/pharmacyMatches/latest')
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            if (!snapshot.hasData || !snapshot.data!.exists) {
              return Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Column(
                  children: [
                    CircularProgressIndicator(color: Color(0xFF059669)),
                    SizedBox(height: 16),
                    Text('Searching nearby pharmacies...', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                    SizedBox(height: 4),
                    Text('Checking stock availability & prices', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                  ],
                ),
              );
            }

            final data = snapshot.data!.data() as Map<String, dynamic>;
            final matches = (data['matches'] as List?) ?? [];

            if (matches.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.search_off, size: 48, color: Color(0xFFEF4444)),
                    SizedBox(height: 12),
                    Text('No pharmacies found', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFFEF4444))),
                    SizedBox(height: 4),
                    Text('No nearby pharmacy has these medicines in stock.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
              );
            }

            return Column(
              children: matches.map<Widget>((match) => _buildPharmacyCard(match, items.length)).toList(),
            );
          },
        ),

        const SizedBox(height: 16),
        // Download PDF option
        OutlinedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('📄 Rx PDF downloaded!')),
            );
          },
          icon: const Icon(Icons.picture_as_pdf, color: Color(0xFF64748B)),
          label: const Text('Download Prescription as PDF', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
            side: const BorderSide(color: Color(0xFFCBD5E1)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }

  Widget _buildPharmacyCard(Map<String, dynamic> match, int totalRxItems) {
    final pharmacyName = match['pharmacyName'] ?? 'Pharmacy';
    final pharmacyType = match['pharmacyType'] ?? 'independent';
    final matchScore = match['matchScore'] ?? 0;
    final availableCount = match['availableCount'] ?? 0;
    final alternativeCount = match['alternativeCount'] ?? 0;
    final totalPrice = match['totalPrice'] ?? 0;
    final distance = match['distance'];
    final rating = match['rating'] ?? 0;
    final reviewCount = match['reviewCount'] ?? 0;
    final estimatedTime = match['estimatedTime'] ?? '';
    final services = (match['services'] as List?) ?? ['pickup'];
    final items = (match['items'] as List?) ?? [];

    final isFullMatch = matchScore == 100;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isFullMatch ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0),
          width: isFullMatch ? 2 : 1,
        ),
        boxShadow: isFullMatch
            ? [BoxShadow(color: const Color(0xFF059669).withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, 4))]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: pharmacyType == 'jan_aushadhi' ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(_getPharmacyTypeIcon(pharmacyType),
                            color: pharmacyType == 'jan_aushadhi' ? const Color(0xFFD97706) : const Color(0xFF059669), size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(pharmacyName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF090D16))),
                            Row(
                              children: [
                                if (rating > 0) ...[
                                  const Icon(Icons.star, size: 12, color: Color(0xFFFBBF24)),
                                  Text(' $rating', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                                  if (reviewCount > 0) Text(' ($reviewCount)', style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                                  const SizedBox(width: 6),
                                ],
                                if (distance != null)
                                  Text('📍 ${distance}km', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Match score badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isFullMatch ? const Color(0xFFECFDF5) : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isFullMatch ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A)),
                  ),
                  child: Text(
                    isFullMatch ? 'All $totalRxItems ✅' : '$availableCount of $totalRxItems ✅',
                    style: TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w900,
                      color: isFullMatch ? const Color(0xFF059669) : const Color(0xFFD97706),
                    ),
                  ),
                ),
              ],
            ),

            const Divider(height: 18),

            // Item-wise match
            ...items.take(5).map<Widget>((item) {
              if (item is! Map) return const SizedBox.shrink();
              final status = item['status'] ?? 'not_available';
              final rxName = item['rxItemName'] ?? '';
              final matchedDrug = item['matchedDrug'] ?? '';
              final price = item['price'] ?? 0;

              return Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Container(
                      width: 6, height: 6,
                      decoration: BoxDecoration(
                        color: _getItemStatusColor(status),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(rxName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF090D16))),
                                if (status == 'alternative_available' || status == 'generic_available')
                                  Text('→ $matchedDrug', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: _getItemStatusColor(status))),
                              ],
                            ),
                          ),
                          if (status != 'not_available')
                            Text('₹$price', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
                          if (status == 'not_available')
                            const Text('N/A', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFEF4444))),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),

            const Divider(height: 18),

            // Footer: Total + Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('₹$totalPrice', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
                    Row(
                      children: [
                        if (estimatedTime.isNotEmpty)
                          Text('⏱️ $estimatedTime', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                        if (services.contains('delivery')) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('🛵 Delivery', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF3B82F6))),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: availableCount + alternativeCount > 0
                      ? () => _placeOrder(context, match)
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFFCBD5E1),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Order Now', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _placeOrder(BuildContext context, Map<String, dynamic> match) {
    final pharmacyName = match['pharmacyName'] ?? 'Pharmacy';
    final totalPrice = match['totalPrice'] ?? 0;
    final items = (match['items'] as List?) ?? [];
    final pharmacyId = match['pharmacyId'] ?? '';
    final services = (match['services'] as List?) ?? ['pickup'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String fulfillmentType = 'pickup';

        return StatefulBuilder(
          builder: (ctx, setBottomState) => Container(
            height: MediaQuery.of(ctx).size.height * 0.65,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: const EdgeInsets.all(20),
            child: ListView(
              children: [
                const Text('📋 Confirm Order', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text('From: $pharmacyName', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF059669))),
                const Divider(height: 20),

                // Items summary
                ...items.where((i) => i is Map && i['status'] != 'not_available').map((item) {
                  if (item is! Map) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text('${item['matchedDrug'] ?? item['rxItemName']} × ${item['qty']}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700))),
                        Text('₹${item['totalItemPrice'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w800)),
                      ],
                    ),
                  );
                }),
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                    Text('₹$totalPrice', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                  ],
                ),

                const SizedBox(height: 16),
                // Fulfillment toggle
                if (services.contains('delivery'))
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('How to get your medicines:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('🏪 Pickup', style: TextStyle(fontSize: 12))),
                              selected: fulfillmentType == 'pickup',
                              onSelected: (s) => setBottomState(() => fulfillmentType = 'pickup'),
                              selectedColor: const Color(0xFF059669),
                              labelStyle: TextStyle(color: fulfillmentType == 'pickup' ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w800),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('🛵 Delivery', style: TextStyle(fontSize: 12))),
                              selected: fulfillmentType == 'delivery',
                              onSelected: (s) => setBottomState(() => fulfillmentType = 'delivery'),
                              selectedColor: const Color(0xFF3B82F6),
                              labelStyle: TextStyle(color: fulfillmentType == 'delivery' ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w800),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () async {
                      // Create order in Firestore
                      try {
                        final orderItems = items
                            .where((i) => i is Map && i['status'] != 'not_available')
                            .map((i) => {
                                  'drugId': (i['matchedDrug'] ?? '').toString().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '-'),
                                  'brandName': i['matchedDrug'] ?? i['rxItemName'],
                                  'qty': i['qty'] ?? 1,
                                  'unitPrice': i['price'] ?? 0,
                                  'totalPrice': i['totalItemPrice'] ?? 0,
                                  'isSubstitute': i['status'] != 'available',
                                })
                            .toList();

                        final pickupCode = (1000 + (DateTime.now().millisecondsSinceEpoch % 9000)).toString();
                        final messenger = ScaffoldMessenger.of(context);

                        await FirebaseFirestore.instance.collection('pharmacyOrders').add({
                          'rxId': widget.rxId,
                          'pharmacyId': pharmacyId,
                          'pharmacyName': pharmacyName,
                          'patientId': widget.patientId,
                          'items': orderItems,
                          'totalAmount': totalPrice,
                          'deliveryFee': fulfillmentType == 'delivery' ? 30 : 0,
                          'grandTotal': totalPrice + (fulfillmentType == 'delivery' ? 30 : 0),
                          'paymentMethod': 'online',
                          'paymentStatus': 'pending',
                          'orderStatus': 'placed',
                          'fulfillmentType': fulfillmentType,
                          'pickupCode': pickupCode,
                          'pickupCodeAttempts': 0,
                          'placedAt': FieldValue.serverTimestamp(),
                        });

                        if (ctx.mounted) Navigator.pop(ctx);
                        if (mounted) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text('✅ Order placed with $pharmacyName! Pickup code: $pickupCode'),
                              backgroundColor: const Color(0xFF059669),
                              duration: const Duration(seconds: 5),
                            ),
                          );
                        }
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                          );
                        }
                      }
                    },
                    child: Text(
                      fulfillmentType == 'delivery' ? 'Place Order (₹${totalPrice + 30})' : 'Place Order (₹$totalPrice)',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ============================================================
// PATIENT PHARMACY TAB — Entry point for bottom navigation
// Shows active prescriptions + recent orders
// ============================================================
class PatientPharmacyTab extends StatelessWidget {
  final String patientId;

  const PatientPharmacyTab({super.key, required this.patientId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.medication, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text('Medicines', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Active Orders Section
          const Text('📦 Active Orders', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
          const SizedBox(height: 8),
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('pharmacyOrders')
                .where('patientId', isEqualTo: patientId)
                .orderBy('placedAt', descending: true)
                .limit(5)
                .snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.shopping_bag_outlined, size: 36, color: Color(0xFFCBD5E1)),
                      SizedBox(height: 8),
                      Text('No active orders', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                      SizedBox(height: 2),
                      Text('Your medicine orders will appear here', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                    ],
                  ),
                );
              }

              return Column(
                children: snapshot.data!.docs.map((doc) {
                  final order = doc.data() as Map<String, dynamic>;
                  final status = order['orderStatus'] ?? 'placed';
                  final pharmName = order['pharmacyName'] ?? 'Pharmacy';
                  final total = order['grandTotal'] ?? 0;
                  final pickupCode = order['pickupCode'] ?? '';
                  final itemCount = (order['items'] as List?)?.length ?? 0;

                  Color statusColor;
                  switch (status) {
                    case 'placed': statusColor = const Color(0xFF3B82F6); break;
                    case 'confirmed': statusColor = const Color(0xFF8B5CF6); break;
                    case 'packing': statusColor = const Color(0xFFD97706); break;
                    case 'ready': statusColor = const Color(0xFF10B981); break;
                    case 'picked_up': case 'delivered': statusColor = const Color(0xFF059669); break;
                    default: statusColor = const Color(0xFF64748B);
                  }

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(pharmName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: statusColor),
                              ),
                              child: Text(
                                status.replaceAll('_', ' ').toUpperCase(),
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: statusColor),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('$itemCount medicines • ₹$total', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                            if (status == 'ready' && pickupCode.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFA7F3D0)),
                                ),
                                child: Text('Pickup: $pickupCode', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                              ),
                          ],
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
          ),

          const SizedBox(height: 20),

          // Prescriptions Section
          const Text('📋 Your Prescriptions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
          const SizedBox(height: 4),
          const Text('Tap to compare pharmacies and order medicines', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          const SizedBox(height: 10),

          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('prescriptions')
                .where('patientId', isEqualTo: patientId)
                .orderBy('createdAt', descending: true)
                .limit(10)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                // Fallback: show all prescriptions (for demo)
                return StreamBuilder<QuerySnapshot>(
                  stream: FirebaseFirestore.instance.collection('prescriptions').limit(5).snapshots(),
                  builder: (context, fallbackSnap) {
                    if (!fallbackSnap.hasData || fallbackSnap.data!.docs.isEmpty) {
                      return _buildNoPrescriptions();
                    }
                    return _buildPrescriptionsList(fallbackSnap.data!.docs, context);
                  },
                );
              }
              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                // Also try fallback for demo data
                return StreamBuilder<QuerySnapshot>(
                  stream: FirebaseFirestore.instance.collection('prescriptions').limit(5).snapshots(),
                  builder: (context, fallbackSnap) {
                    if (!fallbackSnap.hasData || fallbackSnap.data!.docs.isEmpty) {
                      return _buildNoPrescriptions();
                    }
                    return _buildPrescriptionsList(fallbackSnap.data!.docs, context);
                  },
                );
              }
              return _buildPrescriptionsList(snapshot.data!.docs, context);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNoPrescriptions() {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.receipt_long_outlined, size: 48, color: Color(0xFFCBD5E1)),
          SizedBox(height: 12),
          Text('No prescriptions yet', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF64748B))),
          SizedBox(height: 4),
          Text('After your doctor consultation, prescriptions will appear here for medicine ordering.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildPrescriptionsList(List<QueryDocumentSnapshot> docs, BuildContext context) {
    return Column(
      children: docs.map((doc) {
        final rx = doc.data() as Map<String, dynamic>;
        final doctorName = rx['doctorName'] ?? 'Doctor';
        final diagnosis = rx['diagnosis'] ?? '';
        final items = (rx['items'] as List?) ?? [];
        final hospitalName = rx['hospitalName'] ?? '';

        return GestureDetector(
          onTap: () {
            Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => PharmacyMarketplaceScreen(
                rxId: doc.id,
                patientId: patientId,
              ),
            ));
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.description, color: Color(0xFF059669), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Rx by $doctorName', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                      if (hospitalName.isNotEmpty)
                        Text(hospitalName, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                      if (diagnosis.isNotEmpty)
                        Text(diagnosis, style: const TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.w700)),
                      Text('${items.length} medicines', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    ],
                  ),
                ),
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Order', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
