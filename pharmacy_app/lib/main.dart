import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'firebase_options.dart';
import 'stock_management.dart';
import 'pharmacy_orders.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }
  runApp(const PharmacyApp());
}

class PharmacyApp extends StatefulWidget {
  const PharmacyApp({super.key});

  @override
  State<PharmacyApp> createState() => _PharmacyAppState();
}

class _PharmacyAppState extends State<PharmacyApp> {
  String _selectedPharmacyId = 'pharm-hospital';
  String _selectedPharmacyName = 'CityCare Hospital Pharmacy';

  @override
  void initState() {
    super.initState();
    _loadPharmacyProfile();
  }

  Future<void> _loadPharmacyProfile() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _selectedPharmacyId = prefs.getString('pharm_id') ?? 'pharm-hospital';
      _selectedPharmacyName = prefs.getString('pharm_name') ?? 'CityCare Hospital Pharmacy';
    });
  }

  Future<void> _setPharmacy(String id, String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pharm_id', id);
    await prefs.setString('pharm_name', name);
    setState(() {
      _selectedPharmacyId = id;
      _selectedPharmacyName = name;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediQ Pharmacy & Hospital Console',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669),
          brightness: Brightness.light,
          primary: const Color(0xFF059669),
          surface: const Color(0xFFFFFFFF),
        ),
        cardTheme: CardThemeData(
          color: const Color(0xFFFFFFFF),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFFFFFF),
          elevation: 0,
          scrolledUnderElevation: 1,
          iconTheme: IconThemeData(color: Color(0xFF090D16)),
          titleTextStyle: TextStyle(
            color: Color(0xFF090D16),
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        useMaterial3: true,
      ),
      home: PharmacyRootShell(
        pharmacyId: _selectedPharmacyId,
        pharmacyName: _selectedPharmacyName,
        onSelectPharmacy: _setPharmacy,
      ),
    );
  }
}

class PharmacyRootShell extends StatefulWidget {
  final String pharmacyId;
  final String pharmacyName;
  final Function(String, String) onSelectPharmacy;

  const PharmacyRootShell({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.onSelectPharmacy,
  });

  @override
  State<PharmacyRootShell> createState() => _PharmacyRootShellState();
}

class _PharmacyRootShellState extends State<PharmacyRootShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      PharmacyLiveQueueTab(
        pharmacyId: widget.pharmacyId,
        pharmacyName: widget.pharmacyName,
      ),
      StockManagementTab(
        pharmacyId: widget.pharmacyId,
      ),
      PharmacyOrdersTab(
        pharmacyId: widget.pharmacyId,
      ),
      JanAushadhiInventoryTab(
        pharmacyId: widget.pharmacyId,
      ),
      StaffFrontDeskTab(
        pharmacyId: widget.pharmacyId,
      ),
      PharmacySettingsTab(
        pharmacyId: widget.pharmacyId,
        pharmacyName: widget.pharmacyName,
        onSelectPharmacy: widget.onSelectPharmacy,
      ),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1.5)),
          color: Color(0xFFFFFFFF),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
          backgroundColor: const Color(0xFFFFFFFF),
          indicatorColor: const Color(0xFFD1FAE5),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF059669)),
              label: 'Rx Queue',
            ),
            NavigationDestination(
              icon: Icon(Icons.inventory_2_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.inventory_2, color: Color(0xFF059669)),
              label: 'Stock',
            ),
            NavigationDestination(
              icon: Icon(Icons.shopping_bag_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.shopping_bag, color: Color(0xFF3B82F6)),
              label: 'Orders',
            ),
            NavigationDestination(
              icon: Icon(Icons.medication_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.medication, color: Color(0xFF059669)),
              label: 'Jan Aushadhi',
            ),
            NavigationDestination(
              icon: Icon(Icons.desk_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.desk, color: Color(0xFF059669)),
              label: 'Front Desk',
            ),
            NavigationDestination(
              icon: Icon(Icons.tune_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.tune, color: Color(0xFF059669)),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 1: LIVE PRESCRIPTION DISPENSE QUEUE (6 STATES)
// -------------------------------------------------------------
class PharmacyLiveQueueTab extends StatefulWidget {
  final String pharmacyId;
  final String pharmacyName;

  const PharmacyLiveQueueTab({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
  });

  @override
  State<PharmacyLiveQueueTab> createState() => _PharmacyLiveQueueTabState();
}

class _PharmacyLiveQueueTabState extends State<PharmacyLiveQueueTab> {
  String _filterState = 'all';
  String _searchQuery = '';

  final List<String> _statePills = [
    'all',
    'received',
    'packing',
    'ready',
    'dispensed',
  ];

  Color _getStateColor(String st) {
    switch (st.toLowerCase()) {
      case 'received':
        return const Color(0xFF3B82F6);
      case 'packing':
        return const Color(0xFFD97706);
      case 'ready':
        return const Color(0xFF10B981);
      case 'dispensed':
        return const Color(0xFF059669);
      case 'partial':
        return const Color(0xFF8B5CF6);
      case 'out-of-stock':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  Future<void> _updateDispenseState(String docId, String tokenId, String newState) async {
    try {
      // 1. Update in doctor's tokens subcollection
      if (docId.isNotEmpty && tokenId.isNotEmpty) {
        final updateData = <String, dynamic>{
          'pharmacyStatus': newState,
          'pharmacyUpdatedAt': FieldValue.serverTimestamp(),
        };
        if (newState == 'dispensed') {
          updateData['status'] = 'dispensed';
          updateData['dispensedAt'] = FieldValue.serverTimestamp();
        }
        await FirebaseFirestore.instance
            .collection('doctors')
            .doc(docId)
            .collection('tokens')
            .doc(tokenId)
            .update(updateData);
      }

      // 2. Also update in history
      final histDoc = await FirebaseFirestore.instance.collection('history').doc('hist-$tokenId').get();
      if (histDoc.exists) {
        await histDoc.reference.update({
          'pharmacyStatus': newState,
          if (newState == 'dispensed') 'status': 'dispensed',
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ State updated to "${newState.toUpperCase()}" in real-time Firebase!'),
            backgroundColor: _getStateColor(newState),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error updating dispense state: $e');
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
              child: const Icon(Icons.local_pharmacy, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'MediQ Pharmacy',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: const Text(
                'LIVE RX',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
              ),
            ),
          ],
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collectionGroup('tokens').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error loading tokens: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final allDocs = snapshot.data!.docs;
          // Filter tokens that have prescribed medicines or are completed/dispensed
          final rxTokens = allDocs.map((d) {
            final data = d.data() as Map<String, dynamic>;
            final parentDocId = d.reference.parent.parent?.id ?? '';
            return {
              'id': d.id,
              'parentId': parentDocId,
              ...data,
            };
          }).where((t) {
            final hasMeds = t['prescribedMedicines'] != null &&
                (t['prescribedMedicines'] is List && (t['prescribedMedicines'] as List).isNotEmpty ||
                    t['prescribedMedicines'].toString().length > 2);
            final hasPhToken = t['pharmacyTokenCode'] != null;
            final isRxStatus = ['completed', 'dispensed', 'in-progress'].contains(t['status']) ||
                t['pharmacyStatus'] != null;
            return hasMeds || hasPhToken || isRxStatus;
          }).toList();

          // Sort by creation time (most recent first)
          rxTokens.sort((a, b) {
            final tA = a['createdAt'];
            final tB = b['createdAt'];
            if (tA is Timestamp && tB is Timestamp) {
              return tB.compareTo(tA);
            }
            return 0;
          });

          // Apply state & search filter
          final filtered = rxTokens.where((t) {
            final phState = (t['pharmacyStatus'] ?? 'received').toString().toLowerCase();
            final patName = (t['patientName'] ?? '').toString().toLowerCase();
            final phCode = (t['pharmacyTokenCode'] ?? '').toString().toLowerCase();
            final tokCode = (t['tokenCode'] ?? '').toString().toLowerCase();

            final matchesState = _filterState == 'all' || phState == _filterState;
            final matchesSearch = _searchQuery.isEmpty ||
                patName.contains(_searchQuery) ||
                phCode.contains(_searchQuery) ||
                tokCode.contains(_searchQuery);

            return matchesState && matchesSearch;
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Counter Header Info Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.storefront, color: Color(0xFF059669), size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.pharmacyName,
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF065F46)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Active Counter • ${filtered.length} Orders in View • Zero-Queue Dispense Active',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF047857)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Search Bar
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Search patient name, token (e.g. PH-01, DMEH-04)...',
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

              // 6 Dispense State Filters
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _statePills.map((st) {
                    final isSel = _filterState == st;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(st.toUpperCase()),
                        selected: isSel,
                        onSelected: (s) => setState(() => _filterState = st),
                        selectedColor: _getStateColor(st),
                        labelStyle: TextStyle(
                          color: isSel ? Colors.white : const Color(0xFF334155),
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                        ),
                        backgroundColor: Colors.white,
                        side: BorderSide(color: isSel ? Colors.transparent : const Color(0xFFCBD5E1)),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),

              if (filtered.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFFCBD5E1)),
                        SizedBox(height: 12),
                        Text('No active prescriptions found matching filter.', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ),

              ...filtered.map((t) {
                final patName = t['patientName'] ?? 'Patient';
                final phone = t['phoneNumber'] ?? 'N/A';
                final docName = t['doctorName'] ?? 'Attending Doctor';
                final tokDisplay = t['pharmacyTokenCode'] ?? t['tokenCode'] ?? '#${t['tokenNumber']}';
                final currentState = (t['pharmacyStatus'] ?? (t['status'] == 'completed' ? 'ready' : 'received')).toString().toLowerCase();
                final meds = t['prescribedMedicines'];

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFA7F3D0)),
                                  ),
                                  child: Text(
                                    tokDisplay,
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF059669)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  patName,
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _getStateColor(currentState).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: _getStateColor(currentState)),
                              ),
                              child: Text(
                                currentState.toUpperCase(),
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: _getStateColor(currentState)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('Phone: $phone • Prescribed by $docName', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                        const Divider(height: 18),

                        // Medicines List
                        const Text('Prescribed Line Items:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF475569))),
                        const SizedBox(height: 4),
                        if (meds is List)
                          ...meds.map((m) => Padding(
                                padding: const EdgeInsets.only(bottom: 2),
                                child: Row(
                                  children: [
                                    const Icon(Icons.check_circle_outline, color: Color(0xFF059669), size: 14),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        m.toString(),
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                                      ),
                                    ),
                                  ],
                                ),
                              ))
                        else
                          Text(
                            meds?.toString() ?? 'Paracetamol 650mg, Cetirizine 10mg, Pantoprazole 40mg',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                          ),

                        const SizedBox(height: 12),

                        // Action Buttons: 6 States
                        const Text('Update Dispense State (Live Sync):', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                        const SizedBox(height: 6),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: ['received', 'packing', 'ready', 'dispensed'].map((st) {
                              final isCurrent = currentState == st;
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: ElevatedButton(
                                  onPressed: isCurrent
                                      ? null
                                      : () => _updateDispenseState(t['parentId'] ?? '', t['id'] ?? '', st),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isCurrent ? const Color(0xFFCBD5E1) : _getStateColor(st),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    elevation: 0,
                                  ),
                                  child: Text(
                                    st.toUpperCase(),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 2: PRD SECTION 6.8 JAN AUSHADHI INVENTORY & GENERIC SAVINGS
// -------------------------------------------------------------
class JanAushadhiInventoryTab extends StatefulWidget {
  final String pharmacyId;

  const JanAushadhiInventoryTab({super.key, required this.pharmacyId});

  @override
  State<JanAushadhiInventoryTab> createState() => _JanAushadhiInventoryTabState();
}

class _JanAushadhiInventoryTabState extends State<JanAushadhiInventoryTab> {
  String _searchQuery = '';

  final List<Map<String, dynamic>> _catalog = [
    {
      'name': 'Paracetamol 650mg (Dolo)',
      'genericName': 'Paracetamol 650mg (Jan Aushadhi)',
      'brandedPrice': 35,
      'genericPrice': 11,
      'stock': 1200,
      'shelf': 'Shelf A-12',
    },
    {
      'name': 'Amoxicillin 500mg (Novamox)',
      'genericName': 'Amoxicillin 500mg (Jan Aushadhi)',
      'brandedPrice': 110,
      'genericPrice': 32,
      'stock': 450,
      'shelf': 'Shelf B-04',
    },
    {
      'name': 'Cetirizine 10mg (Cetzine)',
      'genericName': 'Cetirizine 10mg (Jan Aushadhi)',
      'brandedPrice': 28,
      'genericPrice': 8,
      'stock': 800,
      'shelf': 'Shelf A-08',
    },
    {
      'name': 'Pantoprazole 40mg (Pan 40)',
      'genericName': 'Pantoprazole 40mg (Jan Aushadhi)',
      'brandedPrice': 95,
      'genericPrice': 24,
      'stock': 650,
      'shelf': 'Shelf C-02',
    },
    {
      'name': 'Azithromycin 500mg (Azithral)',
      'genericName': 'Azithromycin 500mg (Jan Aushadhi)',
      'brandedPrice': 140,
      'genericPrice': 45,
      'stock': 300,
      'shelf': 'Shelf B-11',
    },
    {
      'name': 'Cough Syrup 100ml (Ascoril)',
      'genericName': 'Dextromethorphan HBr 100ml',
      'brandedPrice': 125,
      'genericPrice': 38,
      'stock': 180,
      'shelf': 'Shelf D-05',
    },
    {
      'name': 'Metformin 500mg (Glycomet)',
      'genericName': 'Metformin 500mg (Jan Aushadhi)',
      'brandedPrice': 42,
      'genericPrice': 14,
      'stock': 1500,
      'shelf': 'Shelf E-01',
    },
    {
      'name': 'Atorvastatin 10mg (Atorlip)',
      'genericName': 'Atorvastatin 10mg (Jan Aushadhi)',
      'brandedPrice': 85,
      'genericPrice': 22,
      'stock': 500,
      'shelf': 'Shelf E-09',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _catalog.where((m) {
      final q = _searchQuery.toLowerCase();
      return m['name'].toString().toLowerCase().contains(q) ||
          m['genericName'].toString().toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Jan Aushadhi Generic Substitutes'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFEF3C7), Color(0xFFFFFBEB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: const Row(
              children: [
                Icon(Icons.savings, color: Color(0xFFD97706), size: 28),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Up to 75% Generic Savings Active',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF92400E)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Pradhan Mantri Bhartiya Janaushadhi Pariyojana verified medicine catalog with line-item stock levels.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF78350F), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            decoration: InputDecoration(
              hintText: 'Search medicine name or generic molecule...',
              prefixIcon: const Icon(Icons.search, color: Color(0xFF059669)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            ),
          ),
          const SizedBox(height: 12),

          ...filtered.map((item) {
            final bPrice = item['brandedPrice'] as int;
            final gPrice = item['genericPrice'] as int;
            final savings = (((bPrice - gPrice) / bPrice) * 100).round();

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            item['name'] as String,
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF090D16)),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF86EFAC)),
                          ),
                          child: Text(
                            'SAVE $savings%',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Generic Molecule: ${item['genericName']}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF059669)),
                    ),
                    const Divider(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Branded: ₹$bPrice', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), decoration: TextDecoration.lineThrough)),
                            Text('Jan Aushadhi: ₹$gPrice', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('${item['shelf']}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                            Text('Stock: ${item['stock']} units', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF090D16))),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 3: FRONT DESK / RECEPTIONIST TRIAGE & WALK-IN ISSUANCE
// -------------------------------------------------------------
class StaffFrontDeskTab extends StatefulWidget {
  final String pharmacyId;

  const StaffFrontDeskTab({super.key, required this.pharmacyId});

  @override
  State<StaffFrontDeskTab> createState() => _StaffFrontDeskTabState();
}

class _StaffFrontDeskTabState extends State<StaffFrontDeskTab> {
  final _patNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController(text: 'Routine OPD Consultation');
  String _selectedLane = 'normal';
  String _selectedDoctorId = 'dr-mehta';
  bool _isIssuing = false;

  Future<void> _issueWalkInSlip() async {
    final name = _patNameCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter patient name and phone number.')),
      );
      return;
    }

    setState(() => _isIssuing = true);
    final todayKey = DateTime.now().toString().split(' ')[0];
    final tokenColRef = FirebaseFirestore.instance
        .collection('doctors')
        .doc(_selectedDoctorId)
        .collection('tokens');

    final counterRef = FirebaseFirestore.instance
        .collection('doctors')
        .doc(_selectedDoctorId)
        .collection('counters')
        .doc(todayKey);

    try {
      int nextToken = 1;
      final newDocRef = tokenColRef.doc();
      final laneWeight = _selectedLane == 'emergency' ? 1000 : (_selectedLane == 'senior' ? 50 : 0);

      await FirebaseFirestore.instance.runTransaction((tx) async {
        final snap = await tx.get(counterRef);
        final current = snap.exists ? (snap.data()?['lastToken'] ?? 0) : 0;
        nextToken = current + 1;
        final docCode = _selectedDoctorId.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').toUpperCase().padRight(3, 'X').substring(0, 3);
        final tokenDisplayCode = 'D$docCode-${nextToken.toString().padLeft(2, '0')}';

        tx.set(counterRef, {'lastToken': nextToken, 'dateKey': todayKey}, SetOptions(merge: true));
        tx.set(newDocRef, {
          'tokenNumber': nextToken,
          'tokenCode': tokenDisplayCode,
          'patientName': name,
          'phoneNumber': phone,
          'reason': _reasonCtrl.text.trim(),
          'doctorId': _selectedDoctorId,
          'status': 'waiting',
          'lane': _selectedLane,
          'laneWeight': laneWeight,
          'priorityScore': laneWeight,
          'skipCount': 0,
          'secondMissNoShow': false,
          'date': todayKey,
          'createdAt': FieldValue.serverTimestamp(),
          'bookingMode': 'walkin',
          'addedBy': 'pharmacy_staff_desk',
        });
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Walk-in token #$nextToken generated & added to live queue!'),
            backgroundColor: const Color(0xFF059669),
          ),
        );
        _patNameCtrl.clear();
        _phoneCtrl.clear();
      }
    } catch (e) {
      debugPrint('Error creating walk-in: $e');
    } finally {
      setState(() => _isIssuing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff & Front Desk Walk-In'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Issue Walk-In OPD Slip', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextField(controller: _patNameCtrl, decoration: const InputDecoration(labelText: 'Patient Full Name *')),
                  const SizedBox(height: 10),
                  TextField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Mobile Phone *')),
                  const SizedBox(height: 10),
                  TextField(controller: _reasonCtrl, decoration: const InputDecoration(labelText: 'Clinical Reason')),
                  const SizedBox(height: 14),

                  const Text('Priority Lane Triage:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('👤 Normal', style: TextStyle(fontSize: 11))),
                          selected: _selectedLane == 'normal',
                          onSelected: (s) => setState(() => _selectedLane = 'normal'),
                          selectedColor: const Color(0xFF0284C7),
                          labelStyle: TextStyle(color: _selectedLane == 'normal' ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('🧓 Priority (+50)', style: TextStyle(fontSize: 11))),
                          selected: _selectedLane == 'senior',
                          onSelected: (s) => setState(() => _selectedLane = 'senior'),
                          selectedColor: const Color(0xFFD97706),
                          labelStyle: TextStyle(color: _selectedLane == 'senior' ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('🚨 Emergency', style: TextStyle(fontSize: 11))),
                          selected: _selectedLane == 'emergency',
                          onSelected: (s) => setState(() => _selectedLane = 'emergency'),
                          selectedColor: const Color(0xFFE11D48),
                          labelStyle: TextStyle(color: _selectedLane == 'emergency' ? Colors.white : const Color(0xFF334155), fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isIssuing ? null : _issueWalkInSlip,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text(_isIssuing ? 'Issuing...' : 'Print & Add to Queue', style: const TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 4: PHARMACY COUNTER PROFILE & SETTINGS
// -------------------------------------------------------------
class PharmacySettingsTab extends StatelessWidget {
  final String pharmacyId;
  final String pharmacyName;
  final Function(String, String) onSelectPharmacy;

  const PharmacySettingsTab({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.onSelectPharmacy,
  });

  @override
  Widget build(BuildContext context) {
    final counters = [
      {'id': 'pharm-hospital', 'name': 'CityCare Hospital In-House Pharmacy', 'type': 'Hospital Counter'},
      {'id': 'pharm-janaushadhi', 'name': 'Pradhan Mantri Jan Aushadhi Kendra #102', 'type': 'Generic Outlet'},
      {'id': 'pharm-apollo', 'name': 'Apollo Pharmacy 24/7 Partner Counter', 'type': 'Partner Retail'},
      {'id': 'pharm-medplus', 'name': 'MedPlus Pharmacy & Wellness Desk', 'type': 'Partner Retail'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pharmacy Counter Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.cloud_done, color: Color(0xFF059669), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Firebase Status: Connected',
                      style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669), fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text('Project: smart-opd-queue-tracker.firebaseapp.com', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                const Text('Real-time Firestore sync & Cloud Functions v2 active.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ],
            ),
          ),
          const SizedBox(height: 16),

          const Text('Switch Active Counter Profile:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),

          ...counters.map((c) {
            final isChosen = c['id'] == pharmacyId;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              color: isChosen ? const Color(0xFFECFDF5) : Colors.white,
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: isChosen ? const Color(0xFF059669) : const Color(0xFFF1F5F9),
                  child: Icon(Icons.store, color: isChosen ? Colors.white : const Color(0xFF64748B)),
                ),
                title: Text(c['name'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                subtitle: Text(c['type'] as String, style: const TextStyle(fontSize: 11)),
                trailing: isChosen
                    ? const Icon(Icons.check_circle, color: Color(0xFF059669))
                    : OutlinedButton(
                        onPressed: () => onSelectPharmacy(c['id'] as String, c['name'] as String),
                        child: const Text('Select', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                      ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
