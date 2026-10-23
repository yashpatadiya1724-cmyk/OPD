import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase init fallback: $e');
  }

  runApp(const MediQRiderApp());
}

class MediQRiderApp extends StatelessWidget {
  const MediQRiderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediQ Rider Terminal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669),
          primary: const Color(0xFF059669),
          secondary: const Color(0xFF0284C7),
          surface: const Color(0xFFF8FAFC),
        ),
        scaffoldBackgroundColor: const Color(0xFFF1F5F9),
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      home: const RiderHomeScreen(),
    );
  }
}

class RiderHomeScreen extends StatefulWidget {
  const RiderHomeScreen({super.key});

  @override
  State<RiderHomeScreen> createState() => _RiderHomeScreenState();
}

class _RiderHomeScreenState extends State<RiderHomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Duty Shift State
  bool _isOnline = true;
  String _riderName = 'Vikram Rathore';
  String _riderId = 'GJ-RDR-402';
  String _vehicle = 'Ather 450X High-Speed EV';
  int _evBattery = 88;
  double _coldBagTemp = 4.4;

  // Earnings & stats
  int _todayEarnings = 850;
  int _completedTrips = 8;
  double _rating = 4.96;

  // Active Mission State
  bool _hasActiveMission = true;
  String _activeOrderId = 'MEDIQ-SLOT-8821';
  String _customerName = 'Ravi Kumar Patel';
  String _customerPhone = '+91 98251 04921';
  String _deliveryAddress = 'B-402, Shivalik Residency, Near Sola Bridge, Ahmedabad';
  String _pickupSource = 'Pradhan Mantri Jan Aushadhi Kendra (Dark-Store Hub #3)';
  String _slotLabel = '⚡ 15-Min Express Delivery';
  int _collectAmount = 224;
  String _correctOtp = '7391';
  String _enteredOtp = '';
  String _missionStatus = 'OUT_FOR_DELIVERY'; // 'ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'
  double _distanceRemainingKm = 0.9;
  int _etaMinutes = 7;

  // Telemetry simulation timer
  Timer? _telemetryTimer;

  // Available orders queue
  List<Map<String, dynamic>> _availableOrders = [
    {
      'id': 'MEDIQ-SLOT-9142',
      'customer': 'Priya Shah',
      'phone': '+91 98791 22819',
      'address': 'Plot 18, Sun City, Drive-In Road, Ahmedabad',
      'slot': '🌅 Morning Slot (08:00 AM – 10:00 AM)',
      'medicines': ['Pantoprazole 40mg', 'Cetirizine 10mg'],
      'coldChain': false,
      'amount': 123,
      'payout': 45,
      'distance': '1.8 km',
    },
    {
      'id': 'MEDIQ-SLOT-9143',
      'customer': 'Anil Deshmukh',
      'phone': '+91 98980 44920',
      'address': 'Flat 101, Galaxy Tower, SG Highway, Ahmedabad',
      'slot': '🌆 Evening Slot (05:00 PM – 07:00 PM)',
      'medicines': ['Augmentin 625mg', 'Dolo 650mg'],
      'coldChain': false,
      'amount': 165,
      'payout': 50,
      'distance': '2.4 km',
    },
    {
      'id': 'MEDIQ-SLOT-9144',
      'customer': 'Kiran Varma',
      'phone': '+91 99042 11840',
      'address': 'B-12, Shilp Aaron, Sindhu Bhavan Marg',
      'slot': '⚡ Express Delivery (Immediate)',
      'medicines': ['Insulin Glargine 100IU (Keep at 2-8°C)', 'Syringes 31G'],
      'coldChain': true,
      'amount': 340,
      'payout': 65,
      'distance': '1.2 km',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _startTelemetryLoop();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _telemetryTimer?.cancel();
    super.dispose();
  }

  void _startTelemetryLoop() {
    _telemetryTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!_hasActiveMission || !_isOnline) return;
      if (mounted) {
        setState(() {
          // Micro variations in cold bag temperature (2-8 C is safe)
          _coldBagTemp = 4.3 + (DateTime.now().second % 5) * 0.05;
          if (_distanceRemainingKm > 0.2) {
            _distanceRemainingKm = (_distanceRemainingKm - 0.05).clamp(0.1, 5.0);
            _etaMinutes = (_distanceRemainingKm * 6).ceil().clamp(1, 15);
          }
        });
      }
    });
  }

  void _verifyDoorstepOtp() {
    if (_enteredOtp.trim() == _correctOtp) {
      HapticFeedback.heavyImpact();
      setState(() {
        _missionStatus = 'DELIVERED';
        _hasActiveMission = false;
        _todayEarnings += 50;
        _completedTrips += 1;
      });

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 48),
              ),
              const SizedBox(height: 16),
              const Text(
                'Doorstep Delivery Verified!',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'OTP #$_correctOtp validated successfully.\nCustomer: $_customerName',
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cash / UPI to Collect:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    Text(
                      '₹$_collectAmount',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF059669)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✓ ₹50 Rider payout added to today\'s settlement!'),
                        backgroundColor: Color(0xFF059669),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Confirm & Ready for Next Drop', style: TextStyle(fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      HapticFeedback.vibrate();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Invalid Doorstep OTP. Ask customer for the 4-digit code (Hint: $_correctOtp)'),
          backgroundColor: const Color(0xFFE11D48),
        ),
      );
    }
  }

  void _acceptOrder(Map<String, dynamic> order) {
    setState(() {
      _hasActiveMission = true;
      _activeOrderId = order['id'];
      _customerName = order['customer'];
      _customerPhone = order['phone'];
      _deliveryAddress = order['address'];
      _slotLabel = order['slot'];
      _collectAmount = order['amount'];
      _correctOtp = '8821';
      _enteredOtp = '';
      _missionStatus = 'OUT_FOR_DELIVERY';
      _distanceRemainingKm = 1.4;
      _etaMinutes = 11;
      _availableOrders.removeWhere((o) => o['id'] == order['id']);
      _tabController.animateTo(0);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🛵 Accepted order for $_customerName! En route to customer.'),
        backgroundColor: const Color(0xFF059669),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.two_wheeler_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  _riderName,
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF059669),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    _riderId,
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              '$_vehicle • 🔋 $_evBattery% EV Charge',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                      // Duty Shift Toggle
                      GestureDetector(
                        onTap: () {
                          setState(() => _isOnline = !_isOnline);
                          HapticFeedback.mediumImpact();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _isOnline ? const Color(0xFF059669) : const Color(0xFF475569),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              if (_isOnline)
                                BoxShadow(
                                  color: const Color(0xFF059669).withOpacity(0.4),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: _isOnline ? Colors.white : const Color(0xFF94A3B8),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _isOnline ? 'ON DUTY' : 'OFFLINE',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Metric Pills Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildHeaderStat('Earnings', '₹$_todayEarnings', Icons.currency_rupee_rounded, const Color(0xFF34D399)),
                      _buildHeaderStat('Drops', '$_completedTrips Done', Icons.check_circle_outline, const Color(0xFF38BDF8)),
                      _buildHeaderStat('Rating', '$_rating ⭐', Icons.star_rounded, const Color(0xFFFBBF24)),
                      _buildHeaderStat('Cold Bag', '$_coldBagTemp°C', Icons.ac_unit_rounded, const Color(0xFFA78BFA)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF059669),
              unselectedLabelColor: const Color(0xFF64748B),
              indicatorColor: const Color(0xFF059669),
              indicatorWeight: 3,
              labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
              tabs: [
                Tab(
                  icon: const Icon(Icons.navigation_rounded, size: 18),
                  text: _hasActiveMission ? 'Active Drop (1)' : 'Active Drop',
                ),
                Tab(
                  icon: const Icon(Icons.local_shipping_outlined, size: 18),
                  text: 'Hub Pool (${_availableOrders.length})',
                ),
                Tab(
                  icon: const Icon(Icons.account_balance_wallet_outlined, size: 18),
                  text: 'Settlements',
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildActiveMissionTab(),
                _buildAvailableOrdersTab(),
                _buildSettlementsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderStat(String label, String val, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.w700)),
            Text(val, style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900)),
          ],
        ),
      ],
    );
  }

  // TAB 1: ACTIVE MISSION SCREEN
  Widget _buildActiveMissionTab() {
    if (!_hasActiveMission) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.two_wheeler_rounded, size: 56, color: Color(0xFF059669)),
              ),
              const SizedBox(height: 16),
              const Text(
                'No Active Drop Assigned',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              const Text(
                'You are currently online. Check the Hub Pool tab to accept a dark-store pharmacy delivery or wait for dispatch assignment.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () => _tabController.animateTo(1),
                icon: const Icon(Icons.inventory_2_outlined, size: 18),
                label: const Text('View Available Hub Drops', style: TextStyle(fontWeight: FontWeight.w800)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Mission Status Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF047857)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withOpacity(0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.electric_moped_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '$_slotLabel • $_missionStatus',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'En Route to $_customerName',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Colors.white),
                      ),
                      Text(
                        'Order #$_activeOrderId • ETA: $_etaMinutes mins (${_distanceRemainingKm.toStringAsFixed(1)} km)',
                        style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.9)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Cold-Chain Sensor Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.ac_unit_rounded, color: Color(0xFF0284C7), size: 18),
                        SizedBox(width: 6),
                        Text(
                          'Insulated Cold-Chain Bag',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        '● 2–8°C OPTIMAL (SAFE)',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: Color(0xFF166534)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildSensorTile('Bag Temp', '$_coldBagTemp °C', Icons.thermostat_rounded, const Color(0xFF0284C7)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildSensorTile('Speed', '34 km/h', Icons.speed_rounded, const Color(0xFF059669)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildSensorTile('EV Battery', '$_evBattery%', Icons.battery_charging_full_rounded, const Color(0xFFD97706)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Destination & Customer Info Card
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Delivery Destination',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A)),
                    ),
                    Text(
                      'To Collect: ₹$_collectAmount',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF059669)),
                    ),
                  ],
                ),
                const Divider(height: 20, color: Color(0xFFF1F5F9)),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on_rounded, color: Color(0xFFE11D48), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_customerName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                          const SizedBox(height: 2),
                          Text(_deliveryAddress, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          const SizedBox(height: 6),
                          Text('Pickup from: $_pickupSource', style: const TextStyle(fontSize: 11, color: Color(0xFF0284C7), fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Action Buttons for Navigation & Call
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('📍 Opening Google Maps navigation route...'),
                              backgroundColor: Color(0xFF0284C7),
                            ),
                          );
                        },
                        icon: const Icon(Icons.directions_rounded, size: 18),
                        label: const Text('Navigate (Maps)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0284C7),
                          side: const BorderSide(color: Color(0xFF0284C7)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('📞 Calling customer: $_customerPhone'),
                              backgroundColor: const Color(0xFF059669),
                            ),
                          );
                        },
                        icon: const Icon(Icons.phone_rounded, size: 18),
                        label: const Text('Call Customer', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Doorstep OTP Verification Form
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF059669), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.key_rounded, color: Color(0xFF059669), size: 18),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Doorstep Delivery OTP Verification',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Ask the patient for their secret 4-digit OTP shown in their MediQ app before handing over the medicine package.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 12),
                TextField(
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 12,
                    color: Color(0xFF0F172A),
                  ),
                  decoration: InputDecoration(
                    hintText: '----',
                    counterText: '',
                    hintStyle: const TextStyle(letterSpacing: 12, color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF059669), width: 2),
                    ),
                  ),
                  onChanged: (val) {
                    setState(() => _enteredOtp = val);
                  },
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _enteredOtp.length == 4 ? _verifyDoorstepOtp : null,
                    icon: const Icon(Icons.check_circle_rounded, size: 20),
                    label: const Text('Verify OTP & Complete Delivery', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFFCBD5E1),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSensorTile(String title, String val, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 14),
              const SizedBox(width: 4),
              Text(title, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 4),
          Text(val, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }

  // TAB 2: AVAILABLE ORDERS IN DARK-STORE POOL
  Widget _buildAvailableOrdersTab() {
    if (_availableOrders.isEmpty) {
      return const Center(
        child: Text(
          'No available orders at hub right now.\nCheck back in a few minutes.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _availableOrders.length,
      itemBuilder: (ctx, idx) {
        final order = _availableOrders[idx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: order['coldChain'] ? const Color(0xFFE0F2FE) : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        order['slot'],
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: order['coldChain'] ? const Color(0xFF0369A1) : const Color(0xFF92400E),
                        ),
                      ),
                    ),
                    Text(
                      'Rider Payout: +₹${order['payout']}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF059669)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  order['customer'],
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A)),
                ),
                Text(
                  '${order['address']} • ${order['distance']}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: (order['medicines'] as List<String>).map((m) {
                    return Chip(
                      label: Text(m, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      backgroundColor: const Color(0xFFF1F5F9),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _acceptOrder(order),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: const Text('Accept Delivery Drop', style: TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // TAB 3: SETTLEMENTS & TRIP HISTORY
  Widget _buildSettlementsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TODAY\'S EARNINGS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('₹$_todayEarnings', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Base Fare: ₹35 / drop', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 11)),
                    Text('Cold-Bag Bonus: +₹15', style: TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.w800)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          const Text('Weekly Ledger Summary', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
          const SizedBox(height: 10),
          _buildLedgerRow('Monday (12 Drops)', '₹1,240', 'Settled'),
          _buildLedgerRow('Tuesday (10 Drops)', '₹1,020', 'Settled'),
          _buildLedgerRow('Wednesday (14 Drops)', '₹1,450', 'Settled'),
          _buildLedgerRow('Thursday (11 Drops)', '₹1,180', 'Settled'),
          _buildLedgerRow('Today (In Progress)', '₹$_todayEarnings', 'Pending Tonight'),
        ],
      ),
    );
  }

  Widget _buildLedgerRow(String date, String amount, String status) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(date, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF0F172A))),
          Row(
            children: [
              Text(amount, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF059669))),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: status == 'Settled' ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: status == 'Settled' ? const Color(0xFF166534) : const Color(0xFF92400E),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
