import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

// ============================================================
// PATIENT — ZOMATO-STYLE HOSPITAL DISCOVERY (MediQ v5, F20-F21)
// Full Zomato-inspired hospital & doctor discovery:
// - Hospital cards with rating, specialities, distance
// - Department drill-down
// - Doctor profiles with reviews
// - Quick book / OPD token
// ============================================================

class HospitalDiscoveryScreen extends StatefulWidget {
  final String? patientId;

  const HospitalDiscoveryScreen({super.key, this.patientId});

  @override
  State<HospitalDiscoveryScreen> createState() => _HospitalDiscoveryScreenState();
}

class _HospitalDiscoveryScreenState extends State<HospitalDiscoveryScreen> {
  String _searchQuery = '';
  String _selectedFilter = 'all';
  final List<String> _filters = ['all', 'hospital', 'clinic', 'jan_aushadhi'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // Zomato-style gradient app bar
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: const Color(0xFF059669),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF059669), Color(0xFF047857), Color(0xFF065F46)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.location_on, color: Colors.white, size: 18),
                                    SizedBox(width: 4),
                                    Text('Andheri West, Mumbai', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
                                    Icon(Icons.keyboard_arrow_down, color: Colors.white70, size: 20),
                                  ],
                                ),
                                SizedBox(height: 2),
                                Text('Find hospitals & book instantly', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: Colors.white24,
                                  radius: 18,
                                  child: Icon(Icons.notifications_outlined, color: Colors.white, size: 20),
                                ),
                                const SizedBox(width: 8),
                                CircleAvatar(
                                  backgroundColor: Colors.white24,
                                  radius: 18,
                                  child: Icon(Icons.person_outline, color: Colors.white, size: 20),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        // Search bar
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: TextField(
                            onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
                            decoration: const InputDecoration(
                              hintText: 'Search hospitals, doctors, specialities...',
                              hintStyle: TextStyle(fontSize: 14, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                              prefixIcon: Icon(Icons.search, color: Color(0xFF059669)),
                              suffixIcon: Icon(Icons.tune, color: Color(0xFF94A3B8)),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Quick Category Cards
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Quick Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 90,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildQuickAction('🏥', 'Hospitals', const Color(0xFFECFDF5), const Color(0xFF059669)),
                        _buildQuickAction('👨‍⚕️', 'Doctors', const Color(0xFFEFF6FF), const Color(0xFF3B82F6)),
                        _buildQuickAction('🏪', 'Pharmacy', const Color(0xFFFEF3C7), const Color(0xFFD97706)),
                        _buildQuickAction('🚑', 'Emergency', const Color(0xFFFEE2E2), const Color(0xFFEF4444)),
                        _buildQuickAction('🧪', 'Lab Tests', const Color(0xFFF3E8FF), const Color(0xFF8B5CF6)),
                        _buildQuickAction('📋', 'My Records', const Color(0xFFF1F5F9), const Color(0xFF64748B)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Speciality Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('All', 'all'),
                        _buildFilterChip('Hospitals', 'hospital'),
                        _buildFilterChip('Clinics', 'clinic'),
                        _buildFilterChip('Top Rated', 'top_rated'),
                        _buildFilterChip('Near Me', 'near_me'),
                        _buildFilterChip('Open Now', 'open_now'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Hospital List — Real-time from Firestore
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('hospitals')
                  .where('isActive', isEqualTo: true)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return SliverToBoxAdapter(child: Center(child: Text('Error: ${snapshot.error}')));
                }
                if (!snapshot.hasData) {
                  return const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator()));
                }

                var hospitals = snapshot.data!.docs.map((doc) {
                  final data = doc.data() as Map<String, dynamic>;
                  return {'id': doc.id, ...data};
                }).toList();

                // Search filter
                if (_searchQuery.isNotEmpty) {
                  hospitals = hospitals.where((h) {
                    final name = (h['name'] ?? '').toString().toLowerCase();
                    final specialities = (h['specialities'] as List?)?.join(' ').toLowerCase() ?? '';
                    final address = (h['address'] ?? '').toString().toLowerCase();
                    return name.contains(_searchQuery) || specialities.contains(_searchQuery) || address.contains(_searchQuery);
                  }).toList();
                }

                // Sort by rating
                hospitals.sort((a, b) => ((b['rating'] ?? 0) as num).compareTo((a['rating'] ?? 0) as num));

                if (hospitals.isEmpty) {
                  return SliverToBoxAdapter(
                    child: _buildEmptyState(),
                  );
                }

                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, index) {
                      if (index < hospitals.length) {
                        return _buildHospitalCard(hospitals[index], context);
                      }
                      return null;
                    },
                    childCount: hospitals.length,
                  ),
                );
              },
            ),
          ),

          // Seed data hint
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: _buildSeedDataHint(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(String emoji, String label, Color bgColor, Color textColor) {
    return Container(
      width: 80,
      margin: const EdgeInsets.only(right: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: textColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 26)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColor)),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSel = _selectedFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: isSel ? Colors.white : const Color(0xFF334155))),
        selected: isSel,
        onSelected: (s) => setState(() => _selectedFilter = value),
        selectedColor: const Color(0xFF059669),
        backgroundColor: Colors.white,
        side: BorderSide(color: isSel ? Colors.transparent : const Color(0xFFCBD5E1)),
      ),
    );
  }

  Widget _buildHospitalCard(Map<String, dynamic> hospital, BuildContext context) {
    final name = hospital['name'] ?? 'Hospital';
    final address = hospital['address'] ?? '';
    final rating = hospital['rating'] ?? 0;
    final reviewCount = hospital['reviewCount'] ?? 0;
    final specialities = (hospital['specialities'] as List?) ?? [];
    final type = hospital['type'] ?? 'hospital';
    final isOpen = hospital['isOpen'] ?? true;
    final consultFee = hospital['consultFee'] ?? 500;
    final waitTime = hospital['avgWaitTime'] ?? '15 min';
    final photos = (hospital['photos'] as List?) ?? [];
    final hospitalId = hospital['id'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image / Gradient Header
          Container(
            height: 100,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              gradient: LinearGradient(
                colors: type == 'hospital'
                    ? [const Color(0xFF059669), const Color(0xFF047857)]
                    : [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: 16, top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, color: Colors.white, size: 14),
                        const SizedBox(width: 2),
                        Text('$rating', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                        if (reviewCount > 0) Text(' ($reviewCount)', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 10)),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 16, bottom: 12,
                  child: Row(
                    children: [
                      const Icon(Icons.local_hospital, color: Colors.white, size: 28),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                          Text(address.length > 40 ? '${address.substring(0, 40)}...' : address,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 11, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ],
                  ),
                ),
                if (isOpen)
                  Positioned(
                    left: 16, top: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('OPEN NOW', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                    ),
                  ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Specialities
                if (specialities.isNotEmpty)
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: specialities.take(4).map<Widget>((s) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(s.toString(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                        )).toList(),
                  ),
                if (specialities.isNotEmpty) const SizedBox(height: 10),

                // Stats row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildInfoPill(Icons.access_time, '$waitTime wait', const Color(0xFF3B82F6)),
                    _buildInfoPill(Icons.currency_rupee, '₹$consultFee consult', const Color(0xFF059669)),
                    _buildInfoPill(Icons.location_on, '1.2 km', const Color(0xFF64748B)),
                  ],
                ),
                const SizedBox(height: 12),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _showHospitalDetail(context, hospital),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: const Text('View Departments', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Quick booking for $name coming soon!')),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: Color(0xFF059669)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Quick Book', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF059669))),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoPill(IconData icon, String text, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(40),
      child: const Column(
        children: [
          Icon(Icons.local_hospital_outlined, size: 56, color: Color(0xFFCBD5E1)),
          SizedBox(height: 14),
          Text('No hospitals found', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF64748B))),
          SizedBox(height: 4),
          Text('Try different search terms or run the seed script.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }

  Widget _buildSeedDataHint() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: const Row(
        children: [
          Icon(Icons.lightbulb, color: Color(0xFFD97706)),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Run "node seedDrugMaster.js" from the functions/ directory to populate demo hospitals and pharmacies.',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF92400E)),
            ),
          ),
        ],
      ),
    );
  }

  // Hospital Detail → Department → Doctors drill-down
  void _showHospitalDetail(BuildContext context, Map<String, dynamic> hospital) {
    final hospitalId = hospital['id'] ?? '';
    final name = hospital['name'] ?? 'Hospital';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Drag handle
            Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              width: 40, height: 4,
              decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
                        const Text('Departments & Doctors', style: TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const Divider(),

            // Departments list
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('hospitals')
                    .doc(hospitalId)
                    .collection('departments')
                    .snapshots(),
                builder: (context, deptSnap) {
                  if (!deptSnap.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final departments = deptSnap.data!.docs.map((doc) {
                    final data = doc.data() as Map<String, dynamic>;
                    return {'id': doc.id, ...data};
                  }).toList();

                  if (departments.isEmpty) {
                    // Show doctors directly if no departments
                    return _buildDoctorsList(hospitalId);
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: departments.length,
                    itemBuilder: (ctx, index) {
                      final dept = departments[index];
                      return _buildDepartmentCard(dept, hospitalId, context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDepartmentCard(Map<String, dynamic> dept, String hospitalId, BuildContext context) {
    final deptName = dept['name'] ?? 'Department';
    final doctorCount = dept['doctorCount'] ?? 0;
    final description = dept['description'] ?? '';
    final icon = dept['icon'] ?? '🏥';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(14),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(icon, style: const TextStyle(fontSize: 22)),
        ),
        title: Text(deptName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (description.isNotEmpty)
              Text(description, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)), maxLines: 2),
            const SizedBox(height: 4),
            Text('$doctorCount doctors available', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF059669)),
        onTap: () {
          // Navigate to doctors in this department
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opening $deptName doctors...'), backgroundColor: const Color(0xFF059669)),
          );
        },
      ),
    );
  }

  Widget _buildDoctorsList(String hospitalId) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('doctors')
          .where('hospitalId', isEqualTo: hospitalId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final doctors = snapshot.data!.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          return {'id': doc.id, ...data};
        }).toList();

        if (doctors.isEmpty) {
          return const Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.person_search, size: 48, color: Color(0xFFCBD5E1)),
                SizedBox(height: 12),
                Text('No doctors registered yet.', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: doctors.length,
          itemBuilder: (ctx, index) => _buildDoctorCard(doctors[index]),
        );
      },
    );
  }

  Widget _buildDoctorCard(Map<String, dynamic> doctor) {
    final name = doctor['name'] ?? doctor['doctorName'] ?? 'Dr.';
    final speciality = doctor['speciality'] ?? '';
    final rating = doctor['rating'] ?? 0;
    final experience = doctor['experience'] ?? '';
    final fee = doctor['consultFee'] ?? 500;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: const Color(0xFFECFDF5),
            child: Text(name.substring(0, 1).toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF059669))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                if (speciality.isNotEmpty)
                  Text(speciality, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                Row(
                  children: [
                    if (rating > 0) ...[
                      const Icon(Icons.star, size: 12, color: Color(0xFFFBBF24)),
                      Text(' $rating', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                      const SizedBox(width: 8),
                    ],
                    if (experience.toString().isNotEmpty)
                      Text('$experience exp', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('₹$fee', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF059669))),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('Book', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
