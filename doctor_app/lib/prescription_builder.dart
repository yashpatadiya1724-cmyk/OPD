import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

// ============================================================
// DOCTOR — PRESCRIPTION BUILDER (MediQ v5, F23)
// E-Prescription creation with:
// - Drug search from drugMaster collection
// - Dosage, frequency, duration, quantity
// - Auto-trigger pharmacy matching on save
// - Saves to prescriptions/ collection
// ============================================================

class PrescriptionBuilder extends StatefulWidget {
  final String doctorId;
  final String doctorName;
  final String hospitalId;
  final String hospitalName;
  final String patientId;
  final String patientName;
  final String? diagnosis;

  const PrescriptionBuilder({
    super.key,
    required this.doctorId,
    required this.doctorName,
    required this.hospitalId,
    required this.hospitalName,
    required this.patientId,
    required this.patientName,
    this.diagnosis,
  });

  @override
  State<PrescriptionBuilder> createState() => _PrescriptionBuilderState();
}

class _PrescriptionBuilderState extends State<PrescriptionBuilder> {
  final _diagnosisCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final List<Map<String, dynamic>> _items = [];
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.diagnosis != null) {
      _diagnosisCtrl.text = widget.diagnosis!;
    }
  }

  @override
  void dispose() {
    _diagnosisCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _addMedicine() {
    final nameCtrl = TextEditingController();
    final saltCtrl = TextEditingController();
    final strengthCtrl = TextEditingController();
    final dosageCtrl = TextEditingController(text: '1 BD');
    final durationCtrl = TextEditingController(text: '5 days');
    final qtyCtrl = TextEditingController(text: '10');
    String form = 'tab';
    List<Map<String, dynamic>> searchResults = [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setBS) => Container(
          height: MediaQuery.of(ctx).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: ListView(
            children: [
              const Text('💊 Add Medicine', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
              const SizedBox(height: 16),

              // Drug Search
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Search Medicine (Brand / Generic)',
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF059669)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onChanged: (val) async {
                  if (val.length < 2) {
                    setBS(() => searchResults = []);
                    return;
                  }
                  try {
                    final snap = await FirebaseFirestore.instance
                        .collection('drugMaster')
                        .orderBy('brandName')
                        .startAt([val.toUpperCase()])
                        .endAt(['${val.toUpperCase()}\uf8ff'])
                        .limit(8)
                        .get();

                    final results = snap.docs.map((d) {
                      final data = d.data();
                      return {'id': d.id, ...data};
                    }).toList();

                    // Also search by salt name
                    final saltSnap = await FirebaseFirestore.instance
                        .collection('drugMaster')
                        .orderBy('salt')
                        .startAt([val])
                        .endAt(['$val\uf8ff'])
                        .limit(5)
                        .get();

                    final saltResults = saltSnap.docs.map((d) {
                      final data = d.data();
                      return {'id': d.id, ...data};
                    }).toList();

                    // Merge unique
                    final seen = <String>{};
                    final merged = <Map<String, dynamic>>[];
                    for (final r in [...results, ...saltResults]) {
                      if (seen.add(r['id'] as String)) {
                        merged.add(r);
                      }
                    }

                    setBS(() => searchResults = merged);
                  } catch (e) {
                    debugPrint('Drug search error: $e');
                  }
                },
              ),

              // Search Results
              if (searchResults.isNotEmpty)
                Container(
                  constraints: const BoxConstraints(maxHeight: 180),
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: searchResults.length,
                    itemBuilder: (_, i) {
                      final drug = searchResults[i];
                      return ListTile(
                        dense: true,
                        leading: const Icon(Icons.medication, size: 18, color: Color(0xFF059669)),
                        title: Text(
                          '${drug['brandName'] ?? drug['id']}',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                        subtitle: Text(
                          '${drug['salt'] ?? ''} ${drug['strength'] ?? ''} | ₹${drug['mrp'] ?? ''}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                        onTap: () {
                          nameCtrl.text = drug['brandName'] ?? drug['id'] ?? '';
                          saltCtrl.text = drug['salt'] ?? '';
                          strengthCtrl.text = drug['strength'] ?? '';
                          setBS(() => searchResults = []);
                        },
                      );
                    },
                  ),
                ),

              const SizedBox(height: 12),

              // Salt & Strength
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: saltCtrl,
                      decoration: InputDecoration(
                        labelText: 'Salt / Generic',
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: strengthCtrl,
                      decoration: InputDecoration(
                        labelText: 'Strength',
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Form Type
              Row(
                children: [
                  const Text('Form: ', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(width: 8),
                  ...['tab', 'cap', 'syrup', 'inj', 'cream', 'drops'].map((f) => Padding(
                        padding: const EdgeInsets.only(right: 4),
                        child: ChoiceChip(
                          label: Text(f.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: form == f ? Colors.white : const Color(0xFF475569))),
                          selected: form == f,
                          selectedColor: const Color(0xFF059669),
                          onSelected: (s) => setBS(() => form = f),
                        ),
                      )),
                ],
              ),
              const SizedBox(height: 12),

              // Dosage, Duration, Quantity
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: dosageCtrl,
                      decoration: InputDecoration(
                        labelText: 'Dosage',
                        hintText: '1 BD',
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: durationCtrl,
                      decoration: InputDecoration(
                        labelText: 'Duration',
                        hintText: '5 days',
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: qtyCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Qty',
                        hintText: '10',
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Quick dosage buttons
              const Text('Quick Dosage:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: ['1 OD', '1 BD', '1 TDS', '1 QID', '1 HS', 'SOS', '1 AC', '1 PC'].map((d) => InkWell(
                      onTap: () => setBS(() => dosageCtrl.text = d),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: dosageCtrl.text == d ? const Color(0xFF059669) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(d, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: dosageCtrl.text == d ? Colors.white : const Color(0xFF475569))),
                      ),
                    )).toList(),
              ),

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.add),
                  label: const Text('Add to Prescription', style: TextStyle(fontWeight: FontWeight.w900)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    if (nameCtrl.text.isEmpty) return;
                    setState(() {
                      _items.add({
                        'drugName': nameCtrl.text.trim(),
                        'salt': saltCtrl.text.trim(),
                        'strength': strengthCtrl.text.trim(),
                        'form': form,
                        'dosage': dosageCtrl.text.trim(),
                        'duration': durationCtrl.text.trim(),
                        'quantity': int.tryParse(qtyCtrl.text) ?? 1,
                      });
                    });
                    Navigator.pop(ctx);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _savePrescription() async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add at least one medicine!'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final rxRef = await FirebaseFirestore.instance.collection('prescriptions').add({
        'doctorId': widget.doctorId,
        'doctorName': widget.doctorName,
        'hospitalId': widget.hospitalId,
        'hospitalName': widget.hospitalName,
        'patientId': widget.patientId,
        'patientName': widget.patientName,
        'diagnosis': _diagnosisCtrl.text.trim(),
        'notes': _notesCtrl.text.trim(),
        'items': _items,
        'status': 'active',
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Prescription saved! Rx ID: ${rxRef.id.substring(0, 8).toUpperCase()}'),
            backgroundColor: const Color(0xFF059669),
            duration: const Duration(seconds: 4),
          ),
        );
        Navigator.pop(context, rxRef.id);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF090D16)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Row(
          children: [
            Icon(Icons.description, color: Color(0xFF059669), size: 22),
            SizedBox(width: 8),
            Text('Write Prescription', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16))),
          ],
        ),
        actions: [
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            TextButton.icon(
              icon: const Icon(Icons.save, color: Color(0xFF059669)),
              label: const Text('Save Rx', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669))),
              onPressed: _savePrescription,
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Patient & Doctor Info
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)]),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFA7F3D0)),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.person, size: 16, color: Color(0xFF059669)),
                        const SizedBox(width: 6),
                        Text('Patient: ${widget.patientName}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF065F46))),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.medical_services, size: 16, color: Color(0xFF059669)),
                        const SizedBox(width: 6),
                        Text('Dr. ${widget.doctorName} • ${widget.hospitalName}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF047857))),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Diagnosis
          TextField(
            controller: _diagnosisCtrl,
            decoration: InputDecoration(
              labelText: 'Diagnosis',
              hintText: 'e.g. Upper Respiratory Tract Infection',
              labelStyle: const TextStyle(fontWeight: FontWeight.w800),
              prefixIcon: const Icon(Icons.medical_information, color: Color(0xFF059669)),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 14),

          // Medicine List
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('💊 Medicines (${_items.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              ElevatedButton.icon(
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Medicine', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _addMedicine,
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_items.isEmpty)
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Column(
                children: [
                  Icon(Icons.medication_outlined, size: 40, color: Color(0xFFCBD5E1)),
                  SizedBox(height: 8),
                  Text('No medicines added yet', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                  Text('Tap "Add Medicine" to search and add drugs', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                ],
              ),
            ),

          ..._items.asMap().entries.map((entry) {
            final i = entry.key;
            final item = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 28, height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12))),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['drugName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                        Text(
                          '${item['salt'] ?? ''} ${item['strength'] ?? ''} (${item['form']}) • ${item['dosage']} • ${item['duration']} • Qty: ${item['quantity']}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Color(0xFFEF4444), size: 18),
                    onPressed: () => setState(() => _items.removeAt(i)),
                  ),
                ],
              ),
            );
          }),

          const SizedBox(height: 14),

          // Notes
          TextField(
            controller: _notesCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Additional Notes (optional)',
              hintText: 'Special instructions, diet advice, follow-up...',
              labelStyle: const TextStyle(fontWeight: FontWeight.w800),
              prefixIcon: const Icon(Icons.notes, color: Color(0xFF64748B)),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 20),

          // Save Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.save),
              label: Text(
                _isSaving ? 'Saving...' : 'Save & Send Prescription',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFFCBD5E1),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _isSaving ? null : _savePrescription,
            ),
          ),

          const SizedBox(height: 8),
          const Text(
            '💡 Prescription will be sent to the patient\'s app where they can compare pharmacy prices and order medicines.',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
