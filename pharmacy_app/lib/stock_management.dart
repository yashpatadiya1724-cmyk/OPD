import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

// ============================================================
// STOCK MANAGEMENT MODULE — MediQ v5 (F23)
// Blinkit-style pharmacy inventory management with:
// - Real-time Firestore inventory view
// - Stock In (purchase/receiving) with batch tracking
// - Stock Out (sale/disposal) with reason codes
// - Low stock & expiry alerts
// - Search & filter
// ============================================================

class StockManagementTab extends StatefulWidget {
  final String pharmacyId;

  const StockManagementTab({super.key, required this.pharmacyId});

  @override
  State<StockManagementTab> createState() => _StockManagementTabState();
}

class _StockManagementTabState extends State<StockManagementTab> {
  String _searchQuery = '';
  String _filterCategory = 'all';
  String _sortBy = 'name'; // name, stock, expiry

  final List<String> _categories = [
    'all', 'analgesic', 'antibiotic', 'gastro', 'antihistamine',
    'cardiovascular', 'diabetes', 'respiratory', 'supplement',
    'topical', 'neuro', 'ophthalmic',
  ];

  Color _getStockStatusColor(String status) {
    switch (status) {
      case 'in_stock': return const Color(0xFF10B981);
      case 'low_stock': return const Color(0xFFD97706);
      case 'out_of_stock': return const Color(0xFFEF4444);
      default: return const Color(0xFF64748B);
    }
  }

  String _getStockStatusLabel(String status) {
    switch (status) {
      case 'in_stock': return 'IN STOCK';
      case 'low_stock': return 'LOW STOCK ⚠️';
      case 'out_of_stock': return 'OUT OF STOCK 🔴';
      default: return status.toUpperCase();
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'analgesic': return Icons.healing;
      case 'antibiotic': return Icons.medication;
      case 'gastro': return Icons.restaurant;
      case 'antihistamine': return Icons.air;
      case 'cardiovascular': return Icons.favorite;
      case 'diabetes': return Icons.bloodtype;
      case 'respiratory': return Icons.air;
      case 'supplement': return Icons.emoji_food_beverage;
      case 'topical': return Icons.front_hand;
      case 'neuro': return Icons.psychology;
      case 'ophthalmic': return Icons.visibility;
      default: return Icons.medication_outlined;
    }
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
                color: const Color(0xFF059669),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.inventory_2, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text('Stock Management', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: const Text('LIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle, color: Color(0xFF059669), size: 28),
            onPressed: () => _showStockInDialog(context),
            tooltip: 'Stock In',
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('pharmacies')
            .doc(widget.pharmacyId)
            .collection('inventory')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          var items = snapshot.data!.docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            return {'id': doc.id, ...data};
          }).toList();

          // Apply search
          if (_searchQuery.isNotEmpty) {
            items = items.where((item) {
              final name = (item['brandName'] ?? '').toString().toLowerCase();
              final salt = (item['saltComposition'] ?? '').toString().toLowerCase();
              final q = _searchQuery.toLowerCase();
              return name.contains(q) || salt.contains(q);
            }).toList();
          }

          // Apply category filter
          if (_filterCategory != 'all') {
            items = items.where((item) => item['category'] == _filterCategory).toList();
          }

          // Sort
          items.sort((a, b) {
            switch (_sortBy) {
              case 'stock':
                return (a['availableQty'] ?? 0).compareTo(b['availableQty'] ?? 0);
              case 'expiry':
                final aExp = _getEarliestExpiry(a['batches']);
                final bExp = _getEarliestExpiry(b['batches']);
                return aExp.compareTo(bExp);
              default:
                return (a['brandName'] ?? '').toString().compareTo((b['brandName'] ?? '').toString());
            }
          });

          // Stats
          final totalItems = snapshot.data!.docs.length;
          final lowStockCount = snapshot.data!.docs.where((d) {
            final data = d.data() as Map<String, dynamic>;
            return (data['stockStatus'] ?? '') == 'low_stock';
          }).length;
          final outOfStockCount = snapshot.data!.docs.where((d) {
            final data = d.data() as Map<String, dynamic>;
            return (data['availableQty'] ?? 0) <= 0;
          }).length;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Stats Dashboard
              Row(
                children: [
                  _buildStatCard('Total Items', '$totalItems', const Color(0xFF3B82F6), Icons.medication),
                  const SizedBox(width: 8),
                  _buildStatCard('Low Stock', '$lowStockCount', const Color(0xFFD97706), Icons.warning_amber),
                  const SizedBox(width: 8),
                  _buildStatCard('Out of Stock', '$outOfStockCount', const Color(0xFFEF4444), Icons.cancel),
                ],
              ),
              const SizedBox(height: 12),

              // Search Bar
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Search by drug name or salt composition...',
                  hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF059669)),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),
              const SizedBox(height: 10),

              // Category Filter & Sort
              Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _categories.map((cat) {
                          final isSel = _filterCategory == cat;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ChoiceChip(
                              label: Text(cat == 'all' ? 'ALL' : cat.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isSel ? Colors.white : const Color(0xFF334155))),
                              selected: isSel,
                              onSelected: (s) => setState(() => _filterCategory = cat),
                              selectedColor: const Color(0xFF059669),
                              backgroundColor: Colors.white,
                              side: BorderSide(color: isSel ? Colors.transparent : const Color(0xFFCBD5E1)),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.sort, color: Color(0xFF64748B)),
                    onSelected: (val) => setState(() => _sortBy = val),
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(value: 'name', child: Text('Sort by Name')),
                      const PopupMenuItem(value: 'stock', child: Text('Sort by Stock (low first)')),
                      const PopupMenuItem(value: 'expiry', child: Text('Sort by Expiry (soon first)')),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Quick Actions
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showStockInDialog(context),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Stock In', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showStockOutDialog(context, null),
                      icon: const Icon(Icons.remove, size: 18),
                      label: const Text('Stock Out', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              if (items.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFFCBD5E1)),
                        SizedBox(height: 12),
                        Text('No inventory items found.', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                        SizedBox(height: 4),
                        Text('Tap "Stock In" to add medicines.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                      ],
                    ),
                  ),
                ),

              // Inventory Items
              ...items.map((item) => _buildInventoryCard(item, context)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color.withValues(alpha: 0.7))),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryCard(Map<String, dynamic> item, BuildContext context) {
    final brandName = item['brandName'] ?? 'Unknown';
    final salt = item['saltComposition'] ?? '';
    final strength = item['strength'] ?? '';
    final form = item['form'] ?? '';
    final availableQty = item['availableQty'] ?? 0;
    final mrp = item['mrp'] ?? 0;
    final sellingPrice = item['sellingPrice'] ?? 0;
    final stockStatus = item['stockStatus'] ?? (availableQty > 20 ? 'in_stock' : (availableQty > 0 ? 'low_stock' : 'out_of_stock'));
    final category = item['category'] ?? 'general';
    final schedule = item['scheduleType'] ?? 'OTC';
    final batches = item['batches'] as List? ?? [];
    final earliestExpiry = _getEarliestExpiry(batches);
    final reorderLevel = item['reorderLevel'] ?? 20;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(_getCategoryIcon(category), color: const Color(0xFF059669), size: 18),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(brandName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF090D16))),
                            Text('$salt • $strength • $form', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _getStockStatusColor(stockStatus).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _getStockStatusColor(stockStatus)),
                  ),
                  child: Text(
                    _getStockStatusLabel(stockStatus),
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: _getStockStatusColor(stockStatus)),
                  ),
                ),
              ],
            ),
            const Divider(height: 18),

            // Details Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Stock Qty
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Stock', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8))),
                    Text(
                      '$availableQty units',
                      style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w900,
                        color: availableQty <= reorderLevel ? const Color(0xFFEF4444) : const Color(0xFF090D16),
                      ),
                    ),
                  ],
                ),
                // MRP & Selling Price
                Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text('MRP ₹$mrp', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8), decoration: TextDecoration.lineThrough)),
                    Text('₹$sellingPrice', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                  ],
                ),
                // Expiry
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Earliest Expiry', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8))),
                    Text(
                      earliestExpiry.isEmpty ? 'N/A' : earliestExpiry,
                      style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w800,
                        color: _isExpiringSoon(earliestExpiry) ? const Color(0xFFEF4444) : const Color(0xFF090D16),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Schedule & Batch info
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: schedule == 'H1' ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Schedule $schedule',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: schedule == 'H1' ? const Color(0xFFEF4444) : const Color(0xFF64748B)),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${batches.length} batch${batches.length != 1 ? "es" : ""}',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8)),
                    ),
                    if (availableQty <= reorderLevel && availableQty > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('REORDER', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFFD97706))),
                      ),
                    ],
                  ],
                ),
                // Quick Actions
                Row(
                  children: [
                    InkWell(
                      onTap: () => _showStockInDialogForDrug(context, item),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Text('+ IN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                      ),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: () => _showStockOutDialog(context, item),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: const Text('- OUT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFFEF4444))),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getEarliestExpiry(dynamic batches) {
    if (batches == null || batches is! List || batches.isEmpty) return '';
    String earliest = '9999-12-31';
    for (final batch in batches) {
      if (batch is Map && batch['expiryDate'] != null) {
        final exp = batch['expiryDate'].toString();
        if (exp.compareTo(earliest) < 0) earliest = exp;
      }
    }
    if (earliest == '9999-12-31') return '';
    try {
      final date = DateTime.parse(earliest);
      return DateFormat('MMM yyyy').format(date);
    } catch (_) {
      return earliest;
    }
  }

  bool _isExpiringSoon(String expiryStr) {
    if (expiryStr.isEmpty) return false;
    try {
      final date = DateFormat('MMM yyyy').parse(expiryStr);
      return date.isBefore(DateTime.now().add(const Duration(days: 90)));
    } catch (_) {
      return false;
    }
  }

  // ============================================================
  // STOCK IN DIALOG
  // ============================================================
  void _showStockInDialog(BuildContext context) {
    _showStockInDialogForDrug(context, null);
  }

  void _showStockInDialogForDrug(BuildContext context, Map<String, dynamic>? existingDrug) {
    final nameCtrl = TextEditingController(text: existingDrug?['brandName'] ?? '');
    final saltCtrl = TextEditingController(text: existingDrug?['saltComposition'] ?? '');
    final strengthCtrl = TextEditingController(text: existingDrug?['strength'] ?? '');
    final formCtrl = TextEditingController(text: existingDrug?['form'] ?? 'tab');
    final qtyCtrl = TextEditingController();
    final batchCtrl = TextEditingController();
    final expiryCtrl = TextEditingController();
    final purchasePriceCtrl = TextEditingController();
    final mrpCtrl = TextEditingController(text: existingDrug?['mrp']?.toString() ?? '');
    final sellingPriceCtrl = TextEditingController(text: existingDrug?['sellingPrice']?.toString() ?? '');
    final supplierCtrl = TextEditingController();
    final invoiceCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: ListView(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('📦 Stock In — Add Inventory', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Drug / Brand Name *', prefixIcon: Icon(Icons.medication))),
            const SizedBox(height: 10),
            TextField(controller: saltCtrl, decoration: const InputDecoration(labelText: 'Salt Composition', prefixIcon: Icon(Icons.science))),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: strengthCtrl, decoration: const InputDecoration(labelText: 'Strength (e.g. 500mg)'))),
                const SizedBox(width: 10),
                Expanded(child: TextField(controller: formCtrl, decoration: const InputDecoration(labelText: 'Form (tab/cap/syrup)'))),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: qtyCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Quantity *', prefixIcon: Icon(Icons.add_box)))),
                const SizedBox(width: 10),
                Expanded(child: TextField(controller: batchCtrl, decoration: const InputDecoration(labelText: 'Batch No.'))),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: expiryCtrl,
              decoration: const InputDecoration(labelText: 'Expiry Date (YYYY-MM-DD)', prefixIcon: Icon(Icons.calendar_today)),
              readOnly: true,
              onTap: () async {
                final date = await showDatePicker(
                  context: ctx,
                  initialDate: DateTime.now().add(const Duration(days: 365)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
                );
                if (date != null) {
                  expiryCtrl.text = DateFormat('yyyy-MM-dd').format(date);
                }
              },
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: purchasePriceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Purchase Price (₹)', prefixText: '₹ '))),
                const SizedBox(width: 10),
                Expanded(child: TextField(controller: mrpCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'MRP (₹)', prefixText: '₹ '))),
              ],
            ),
            const SizedBox(height: 10),
            TextField(controller: sellingPriceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Selling Price (₹)', prefixText: '₹ ')),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: supplierCtrl, decoration: const InputDecoration(labelText: 'Supplier'))),
                const SizedBox(width: 10),
                Expanded(child: TextField(controller: invoiceCtrl, decoration: const InputDecoration(labelText: 'Invoice No.'))),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.add_circle),
                label: const Text('Add to Inventory', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || qtyCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Drug name and quantity are required.')),
                    );
                    return;
                  }

                  final drugId = existingDrug?['id'] ??
                      '${nameCtrl.text.trim()}-${strengthCtrl.text.trim()}-${formCtrl.text.trim()}'
                          .toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '-').replaceAll(RegExp(r'-+'), '-');

                  final qty = int.tryParse(qtyCtrl.text.trim()) ?? 0;
                  if (qty <= 0) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Quantity must be greater than 0.')),
                    );
                    return;
                  }

                  final inventoryRef = FirebaseFirestore.instance
                      .collection('pharmacies')
                      .doc(widget.pharmacyId)
                      .collection('inventory')
                      .doc(drugId);

                  final newBatch = {
                    'batchNo': batchCtrl.text.trim().isNotEmpty ? batchCtrl.text.trim() : 'BATCH-${DateTime.now().millisecondsSinceEpoch}',
                    'qty': qty,
                    'expiryDate': expiryCtrl.text.trim().isNotEmpty ? expiryCtrl.text.trim() : null,
                    'purchasePrice': double.tryParse(purchasePriceCtrl.text.trim()) ?? 0,
                    'receivedDate': DateTime.now().toIso8601String(),
                    'invoiceNo': invoiceCtrl.text.trim().isNotEmpty ? invoiceCtrl.text.trim() : null,
                    'supplier': supplierCtrl.text.trim().isNotEmpty ? supplierCtrl.text.trim() : null,
                  };

                  try {
                    final docSnap = await inventoryRef.get();
                    if (docSnap.exists) {
                      final existing = docSnap.data()!;
                      final batches = List<Map<String, dynamic>>.from(existing['batches'] ?? []);
                      batches.add(newBatch);

                      await inventoryRef.update({
                        'availableQty': (existing['availableQty'] ?? 0) + qty,
                        'batches': batches,
                        'mrp': double.tryParse(mrpCtrl.text.trim()) ?? existing['mrp'] ?? 0,
                        'sellingPrice': double.tryParse(sellingPriceCtrl.text.trim()) ?? existing['sellingPrice'] ?? 0,
                        'lastUpdated': FieldValue.serverTimestamp(),
                      });
                    } else {
                      await inventoryRef.set({
                        'drugId': drugId,
                        'brandName': nameCtrl.text.trim(),
                        'saltComposition': saltCtrl.text.trim(),
                        'strength': strengthCtrl.text.trim(),
                        'form': formCtrl.text.trim(),
                        'category': 'general',
                        'scheduleType': 'OTC',
                        'availableQty': qty,
                        'batches': [newBatch],
                        'mrp': double.tryParse(mrpCtrl.text.trim()) ?? 0,
                        'sellingPrice': double.tryParse(sellingPriceCtrl.text.trim()) ?? 0,
                        'reorderLevel': 20,
                        'isActive': true,
                        'stockStatus': 'in_stock',
                        'lastUpdated': FieldValue.serverTimestamp(),
                        'createdAt': FieldValue.serverTimestamp(),
                      });
                    }

                    // Audit entry
                    await FirebaseFirestore.instance
                        .collection('pharmacies')
                        .doc(widget.pharmacyId)
                        .collection('stockTransactions')
                        .add({
                      'drugId': drugId,
                      'brandName': nameCtrl.text.trim(),
                      'type': 'stock_in',
                      'reason': 'purchase',
                      'qty': qty,
                      'batchNo': newBatch['batchNo'],
                      'invoiceNo': newBatch['invoiceNo'],
                      'supplier': newBatch['supplier'],
                      'actor': 'pharmacy_staff',
                      'timestamp': FieldValue.serverTimestamp(),
                    });

                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('✅ ${nameCtrl.text.trim()} — $qty units added!'),
                          backgroundColor: const Color(0xFF059669),
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
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // STOCK OUT DIALOG
  // ============================================================
  void _showStockOutDialog(BuildContext context, Map<String, dynamic>? drug) {
    final drugNameCtrl = TextEditingController(text: drug?['brandName'] ?? '');
    final qtyCtrl = TextEditingController();
    String selectedReason = 'manual_sale';
    final notesCtrl = TextEditingController();
    String? selectedDrugId = drug?['id'];

    final reasons = [
      {'value': 'manual_sale', 'label': '💰 Manual Sale (walk-in)'},
      {'value': 'expired', 'label': '⏰ Expired'},
      {'value': 'damaged', 'label': '💔 Damaged'},
      {'value': 'returned', 'label': '↩️ Returned to Distributor'},
      {'value': 'transferred', 'label': '🔄 Transfer to Branch'},
      {'value': 'sample', 'label': '🧪 Doctor Sample'},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => Container(
          height: MediaQuery.of(ctx).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: ListView(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('📤 Stock Out — Remove Inventory', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const Divider(),
              const SizedBox(height: 8),

              if (drug == null)
                TextField(
                  controller: drugNameCtrl,
                  decoration: const InputDecoration(labelText: 'Drug Name *', prefixIcon: Icon(Icons.medication)),
                ),
              if (drug != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.medication, color: Color(0xFF059669)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(drug['brandName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                            Text('Available: ${drug['availableQty']} units', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 12),
              TextField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Quantity to Remove *', prefixIcon: Icon(Icons.remove_circle)),
              ),
              const SizedBox(height: 12),

              const Text('Reason:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: reasons.map((r) {
                  final isSelected = selectedReason == r['value'];
                  return ChoiceChip(
                    label: Text(r['label']!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: isSelected ? Colors.white : const Color(0xFF334155))),
                    selected: isSelected,
                    onSelected: (s) => setDialogState(() => selectedReason = r['value']!),
                    selectedColor: const Color(0xFFEF4444),
                    backgroundColor: Colors.white,
                    side: BorderSide(color: isSelected ? Colors.transparent : const Color(0xFFCBD5E1)),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)')),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.remove_circle),
                  label: const Text('Remove Stock', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    final qty = int.tryParse(qtyCtrl.text.trim()) ?? 0;
                    if (qty <= 0) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Enter valid quantity.')));
                      return;
                    }

                    final drugId = selectedDrugId ??
                        drugNameCtrl.text.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '-');

                    if (drugId.isEmpty) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Select a drug.')));
                      return;
                    }

                    final inventoryRef = FirebaseFirestore.instance
                        .collection('pharmacies')
                        .doc(widget.pharmacyId)
                        .collection('inventory')
                        .doc(drugId);

                    try {
                      await FirebaseFirestore.instance.runTransaction((tx) async {
                        final doc = await tx.get(inventoryRef);
                        if (!doc.exists) throw Exception('Drug not found in inventory');

                        final data = doc.data()!;
                        final currentQty = data['availableQty'] ?? 0;
                        if (currentQty < qty) throw Exception('Insufficient stock: have $currentQty, need $qty');

                        // FEFO deduction from batches
                        final batches = List<Map<String, dynamic>>.from(data['batches'] ?? []);
                        batches.sort((a, b) {
                          final aExp = a['expiryDate']?.toString() ?? '9999';
                          final bExp = b['expiryDate']?.toString() ?? '9999';
                          return aExp.compareTo(bExp);
                        });

                        int remaining = qty;
                        for (int i = 0; i < batches.length && remaining > 0; i++) {
                          final batchQty = (batches[i]['qty'] ?? 0) as int;
                          final deduct = remaining < batchQty ? remaining : batchQty;
                          batches[i]['qty'] = batchQty - deduct;
                          remaining -= deduct;
                        }
                        batches.removeWhere((b) => (b['qty'] ?? 0) <= 0);

                        tx.update(inventoryRef, {
                          'availableQty': currentQty - qty,
                          'batches': batches,
                          'lastUpdated': FieldValue.serverTimestamp(),
                        });
                      });

                      // Audit entry
                      await FirebaseFirestore.instance
                          .collection('pharmacies')
                          .doc(widget.pharmacyId)
                          .collection('stockTransactions')
                          .add({
                        'drugId': drugId,
                        'brandName': drug?['brandName'] ?? drugNameCtrl.text.trim(),
                        'type': 'stock_out',
                        'reason': selectedReason,
                        'qty': qty,
                        'notes': notesCtrl.text.trim(),
                        'actor': 'pharmacy_staff',
                        'timestamp': FieldValue.serverTimestamp(),
                      });

                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('✅ $qty units removed (${selectedReason.replaceAll('_', ' ')})'),
                            backgroundColor: const Color(0xFFD97706),
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
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
