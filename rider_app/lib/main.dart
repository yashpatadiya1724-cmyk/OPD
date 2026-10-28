import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
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
          surface: const Color(0xFFFFFFFF),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        cardTheme: CardThemeData(
          color: const Color(0xFFFFFFFF),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
          ),
          margin: EdgeInsets.zero,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
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

class _RiderHomeScreenState extends State<RiderHomeScreen> with TickerProviderStateMixin {
  late TabController _tabController;

  // Duty Shift State
  bool _isOnline = true;
  final String _riderName = 'Vikram Rathore';
  final String _riderId = 'GJ-RDR-402';
  final String _vehicle = 'Ather 450X EV';
  final int _evBattery = 88;
  double _coldBagTemp = 4.45;

  // Location Permission & Telemetry
  bool _locationGranted = false;
  String _currentGpsCoord = '23.0721° N, 72.5165° E';
  final String _currentArea = 'Sola Science City, Ahmedabad';

  // Earnings & stats
  int _todayEarnings = 850;
  int _completedTrips = 8;
  final double _rating = 4.96;

  // Active Mission State
  bool _hasActiveMission = true;
  String _activeOrderId = 'MEDIQ-SLOT-8821';
  String _customerName = 'Ravi Kumar Patel';
  String _customerPhone = '+91 98251 04921';
  String _deliveryAddress = 'B-402, Shivalik Residency, Near Sola Bridge, Ahmedabad';
  final String _pickupSource = 'Jan Aushadhi Dark-Store #3';
  String _slotLabel = '⚡ 15-Min Express';
  int _collectAmount = 224;
  String _correctOtp = '7391';
  String _enteredOtp = '';
  String _missionStatus = 'OUT_FOR_DELIVERY';
  double _distanceRemainingKm = 0.9;
  int _etaMinutes = 4;
  double _routeProgress = 0.42; // 0.0 at pharmacy, 1.0 at customer

  // Map Controls
  double _mapZoom = 1.0;
  bool _isSatelliteMode = false;
  int _currentSpeedKmh = 34;

  // Timers & Animations
  Timer? _telemetryTimer;
  late AnimationController _pulseController;

  // Available orders queue
  final List<Map<String, dynamic>> _availableOrders = [
    {
      'id': 'MEDIQ-SLOT-9142',
      'customer': 'Priya Shah',
      'phone': '+91 98791 22819',
      'address': 'Plot 18, Sun City, Drive-In Road, Ahmedabad',
      'slot': '🌅 Morning Slot',
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
      'slot': '🌆 Evening Slot',
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
      'slot': '⚡ Express Delivery',
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
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _loadLocationPermission();
    _startTelemetryLoop();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pulseController.dispose();
    _telemetryTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadLocationPermission() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final granted = prefs.getBool('rider_location_granted') ?? false;
      if (mounted) {
        setState(() => _locationGranted = granted);
      }
      if (!granted && mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _promptLocationPermission(isAuto: true);
        });
      }
    } catch (_) {}
  }

  Future<void> _saveLocationPermission(bool granted) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('rider_location_granted', granted);
    } catch (_) {}
    if (mounted) {
      setState(() => _locationGranted = granted);
    }
  }

  void _promptLocationPermission({bool isAuto = false}) {
    showDialog(
      context: context,
      barrierDismissible: !isAuto,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        contentPadding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.location_on_rounded, color: Color(0xFF059669), size: 24),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Location Permission',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Allow MediQ Rider to access your device location for live route navigation, high-speed dispatch, and customer arrival ETAs.',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined, size: 16, color: Color(0xFF0284C7)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Your GPS location is only shared during active duty for medicine transit tracking.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _saveLocationPermission(false);
            },
            child: const Text('Not Now', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _saveLocationPermission(true);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('✓ Location permission granted. Real-time GPS navigation active!'),
                  backgroundColor: Color(0xFF059669),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Allow & OK', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  void _startTelemetryLoop() {
    _telemetryTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!_hasActiveMission || !_isOnline) return;
      if (mounted) {
        setState(() {
          _coldBagTemp = 4.40 + (DateTime.now().second % 7) * 0.02;
          if (_distanceRemainingKm > 0.1) {
            _distanceRemainingKm = math.max(0.05, _distanceRemainingKm - 0.03);
            _etaMinutes = math.max(1, (_distanceRemainingKm * 4).ceil());
            _routeProgress = math.min(0.98, _routeProgress + 0.025);
            _currentSpeedKmh = 28 + (DateTime.now().second % 12);
            _currentGpsCoord = '23.07${(20 + _routeProgress * 15).toInt()}° N, 72.51${(60 + _routeProgress * 20).toInt()}° E';
          } else {
            _currentSpeedKmh = 0;
            _missionStatus = 'ARRIVED';
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
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 42),
              ),
              const SizedBox(height: 14),
              const Text(
                'Doorstep Delivery Verified!',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'OTP #$_correctOtp validated successfully.\nCustomer: $_customerName',
                style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cash / UPI Collected:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                    Text(
                      '₹$_collectAmount',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Color(0xFF059669)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✓ ₹50 Rider payout added to today\'s settlement!'),
                        backgroundColor: Color(0xFF059669),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Confirm & Ready for Next Drop', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
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
          content: Text('❌ Invalid Doorstep OTP. Ask customer for 4-digit code (Hint: $_correctOtp)'),
          backgroundColor: const Color(0xFFE11D48),
          behavior: SnackBarBehavior.floating,
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
      _etaMinutes = 6;
      _routeProgress = 0.15;
      _availableOrders.removeWhere((o) => o['id'] == order['id']);
      _tabController.animateTo(0);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Drop #${order['id']} accepted! Route plotted on map.'),
        backgroundColor: const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(108),
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
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Row 1: Profile & Duty Toggle
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.two_wheeler_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    _riderName,
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF059669),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    _riderId,
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              '$_vehicle • 🔋 $_evBattery% EV',
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                              style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Duty Shift Toggle
                      GestureDetector(
                        onTap: () {
                          setState(() => _isOnline = !_isOnline);
                          HapticFeedback.mediumImpact();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _isOnline ? const Color(0xFF059669) : const Color(0xFF475569),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              if (_isOnline)
                                BoxShadow(
                                  color: const Color(0xFF059669).withValues(alpha: 0.4),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: _isOnline ? Colors.white : const Color(0xFF94A3B8),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _isOnline ? 'ON DUTY' : 'OFFLINE',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 9.5),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Row 2: Metric Stat Badges (Zero Overflow Guarantee)
                  Row(
                    children: [
                      Expanded(child: _buildHeaderStat('Earnings', '₹$_todayEarnings', Icons.currency_rupee_rounded, const Color(0xFF34D399))),
                      const SizedBox(width: 4),
                      Expanded(child: _buildHeaderStat('Drops', '$_completedTrips Done', Icons.check_circle_outline, const Color(0xFF38BDF8))),
                      const SizedBox(width: 4),
                      Expanded(child: _buildHeaderStat('Rating', '$_rating ⭐', Icons.star_rounded, const Color(0xFFFBBF24))),
                      const SizedBox(width: 4),
                      Expanded(child: _buildHeaderStat('Cold Bag', '${_coldBagTemp.toStringAsFixed(1)}°C', Icons.ac_unit_rounded, const Color(0xFFA78BFA))),
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
          // Location Permission Status Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            color: _locationGranted ? const Color(0xFFECFDF5) : const Color(0xFFFEF3C7),
            child: Row(
              children: [
                Icon(
                  _locationGranted ? Icons.location_on_rounded : Icons.location_off_rounded,
                  size: 14,
                  color: _locationGranted ? const Color(0xFF059669) : const Color(0xFFD97706),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _locationGranted
                        ? 'GPS Active • $_currentGpsCoord • $_currentArea'
                        : 'Location permission needed for live in-app GPS navigation.',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: _locationGranted ? const Color(0xFF065F46) : const Color(0xFF92400E),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: () => _promptLocationPermission(isAuto: false),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _locationGranted ? const Color(0xFF059669) : const Color(0xFFD97706),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _locationGranted ? 'GPS OK' : 'Enable GPS',
                      style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Main Tabs
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 12),
            const SizedBox(width: 3),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label, style: const TextStyle(fontSize: 8, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                Text(val, style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w800)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // TAB 1: ACTIVE MISSION SCREEN WITH INTEGRATED MAP
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
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.two_wheeler_rounded, size: 52, color: Color(0xFF059669)),
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
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Mission Status Banner (Zero Overflow)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF047857)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withValues(alpha: 0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.electric_moped_rounded, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '$_slotLabel • $_missionStatus',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 9.5),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'En Route to $_customerName',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5, color: Colors.white),
                      ),
                      Text(
                        'Order #$_activeOrderId • ETA: $_etaMinutes mins (${_distanceRemainingKm.toStringAsFixed(1)} km)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 10.5, color: Colors.white.withValues(alpha: 0.9)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 2. INTEGRATED IN-APP NAVIGATION MAP WIDGET
          _buildInAppNavigationMap(),
          const SizedBox(height: 14),

          // 3. Cold-Chain Sensor Card (Zero Overflow)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.ac_unit_rounded, color: Color(0xFF0284C7), size: 16),
                    const SizedBox(width: 6),
                    const Expanded(
                      child: Text(
                        'Insulated Cold-Chain Bag',
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12.5, color: Color(0xFF0F172A)),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        '● 2–8°C SAFE',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 9.5, color: Color(0xFF166534)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildSensorTile('Bag Temp', '${_coldBagTemp.toStringAsFixed(2)} °C', Icons.thermostat_rounded, const Color(0xFF0284C7)),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _buildSensorTile('Speed', '$_currentSpeedKmh km/h', Icons.speed_rounded, const Color(0xFF059669)),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _buildSensorTile('EV Battery', '$_evBattery%', Icons.battery_charging_full_rounded, const Color(0xFFD97706)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 4. Destination & Customer Info Card
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
                    const Flexible(
                      child: Text(
                        'Delivery Destination',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5, color: Color(0xFF0F172A)),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Collect: ₹$_collectAmount',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5, color: Color(0xFF059669)),
                    ),
                  ],
                ),
                const Divider(height: 18, color: Color(0xFFF1F5F9)),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on_rounded, color: Color(0xFFE11D48), size: 18),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_customerName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                          const SizedBox(height: 2),
                          Text(_deliveryAddress, style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Text('Pickup: $_pickupSource', style: const TextStyle(fontSize: 10.5, color: Color(0xFF0284C7), fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Action Buttons for Navigation & Call
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('📍 In-app live map centered. External Google Maps ready!'),
                              backgroundColor: Color(0xFF0284C7),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        icon: const Icon(Icons.directions_rounded, size: 16),
                        label: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text('Maps Route', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5)),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0284C7),
                          side: const BorderSide(color: Color(0xFF0284C7)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
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
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        icon: const Icon(Icons.phone_rounded, size: 16),
                        label: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text('Call Customer', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11.5)),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 5. Doorstep OTP Verification Form
          Container(
            padding: const EdgeInsets.all(14),
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
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.key_rounded, color: Color(0xFF059669), size: 16),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Doorstep Delivery OTP Verification',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5, color: Color(0xFF0F172A)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Ask the patient for their secret 4-digit OTP shown in their MediQ app before handing over the medicine package.',
                  style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 10),
                TextField(
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 10,
                    color: Color(0xFF0F172A),
                  ),
                  decoration: InputDecoration(
                    hintText: '----',
                    counterText: '',
                    hintStyle: const TextStyle(letterSpacing: 10, color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
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
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _enteredOtp.length == 4 ? _verifyDoorstepOtp : null,
                    icon: const Icon(Icons.check_circle_rounded, size: 18),
                    label: const FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text('Verify OTP & Complete Delivery', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFFCBD5E1),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
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

  // INTEGRATED IN-APP NAVIGATION MAP CONTAINER
  Widget _buildInAppNavigationMap() {
    return Container(
      height: 250,
      decoration: BoxDecoration(
        color: _isSatelliteMode ? const Color(0xFF0B132B) : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Custom Painted Vector Route Map
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return CustomPaint(
                    painter: _NavigationMapPainter(
                      progress: _routeProgress,
                      pulseVal: _pulseController.value,
                      zoom: _mapZoom,
                      isSatellite: _isSatelliteMode,
                    ),
                  );
                },
              ),
            ),

            // Top Turn-by-Turn Guidance Bar
            Positioned(
              top: 10,
              left: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.turn_right_rounded, color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _distanceRemainingKm <= 0.1
                                ? 'Arrived at Shivalik Residency!'
                                : 'In 200m, Turn Right onto Sola Rd',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11),
                          ),
                          Text(
                            'Toward B-402, Shivalik • ${_distanceRemainingKm.toStringAsFixed(1)} km left ($_etaMinutes min)',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w600, fontSize: 9.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Right Map Controls (Zoom, Re-center, Mode)
            Positioned(
              bottom: 10,
              right: 10,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildMapCircleBtn(
                    icon: Icons.add,
                    onTap: () {
                      if (_mapZoom < 1.6) {
                        setState(() => _mapZoom += 0.2);
                      }
                    },
                  ),
                  const SizedBox(height: 6),
                  _buildMapCircleBtn(
                    icon: Icons.remove,
                    onTap: () {
                      if (_mapZoom > 0.8) {
                        setState(() => _mapZoom -= 0.2);
                      }
                    },
                  ),
                  const SizedBox(height: 6),
                  _buildMapCircleBtn(
                    icon: Icons.my_location_rounded,
                    color: const Color(0xFF059669),
                    onTap: () {
                      setState(() => _mapZoom = 1.0);
                      HapticFeedback.lightImpact();
                    },
                  ),
                ],
              ),
            ),

            // Bottom Left Telemetry & Mode Overlay
            Positioned(
              bottom: 10,
              left: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.75),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF34D399),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '$_currentSpeedKmh km/h • GPS Active',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 9.5),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() => _isSatelliteMode = !_isSatelliteMode),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _isSatelliteMode ? 'Street' : 'Satellite',
                          style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w700, fontSize: 8.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapCircleBtn({required IconData icon, required VoidCallback onTap, Color? color}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color ?? const Color(0xFF0F172A).withValues(alpha: 0.9),
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFF475569)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 4,
            ),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
    );
  }

  Widget _buildSensorTile(String title, String val, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
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
              Icon(icon, color: color, size: 12),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: const TextStyle(fontSize: 9.5, color: Color(0xFF64748B), fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(val, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
          ),
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
      padding: const EdgeInsets.all(14),
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
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: order['coldChain'] ? const Color(0xFFE0F2FE) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          order['slot'],
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w900,
                            color: order['coldChain'] ? const Color(0xFF0369A1) : const Color(0xFF92400E),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Rider Payout: +₹${order['payout']}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12.5, color: Color(0xFF059669)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  order['customer'],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5, color: Color(0xFF0F172A)),
                ),
                Text(
                  '${order['address']} • ${order['distance']}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: (order['medicines'] as List<String>).map((m) {
                    return Chip(
                      label: Text(m, style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700)),
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      backgroundColor: const Color(0xFFF1F5F9),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 10),
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
                    child: const Text('Accept Delivery Drop', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12.5)),
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
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
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
                const Text('TODAY\'S EARNINGS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('₹$_todayEarnings', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Base Fare: ₹35 / drop', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 10.5)),
                    Text('Cold-Bag Bonus: +₹15', style: TextStyle(color: Color(0xFF34D399), fontSize: 10.5, fontWeight: FontWeight.w800)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          const Text('Weekly Ledger Summary', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5)),
          const SizedBox(height: 8),
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
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(date, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: Color(0xFF0F172A))),
          Row(
            children: [
              Text(amount, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF059669))),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: status == 'Settled' ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 8.5,
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

// CUSTOM PAINTER FOR INTERACTIVE IN-APP NAVIGATION MAP
class _NavigationMapPainter extends CustomPainter {
  final double progress;
  final double pulseVal;
  final double zoom;
  final bool isSatellite;

  _NavigationMapPainter({
    required this.progress,
    required this.pulseVal,
    required this.zoom,
    required this.isSatellite,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // Apply zoom transformation around center
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.scale(zoom);
    canvas.translate(-center.dx, -center.dy);

    final bgPaint = Paint()..color = isSatellite ? const Color(0xFF0B192C) : const Color(0xFF0F172A);
    canvas.drawRect(Offset.zero & size, bgPaint);

    // Draw City Block outlines & greenery
    final blockPaint = Paint()
      ..color = isSatellite ? const Color(0xFF1E3E62).withValues(alpha: 0.25) : const Color(0xFF1E293B).withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;

    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(20, 30, size.width * 0.35, 60), const Radius.circular(8)), blockPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.45, 25, size.width * 0.48, 70), const Radius.circular(8)), blockPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(20, 160, size.width * 0.4, 70), const Radius.circular(8)), blockPaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(size.width * 0.52, 170, size.width * 0.42, 65), const Radius.circular(8)), blockPaint);

    // Draw Major Roads
    final roadPaint = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 18
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final roadCenterLine = Paint()
      ..color = const Color(0xFF475569)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    // Road 1: SG Highway (Horizontal arterial)
    final p1 = Offset(10, size.height * 0.46);
    final p2 = Offset(size.width - 10, size.height * 0.46);
    canvas.drawLine(p1, p2, roadPaint);
    canvas.drawLine(p1, p2, roadCenterLine);

    // Road 2: Sola Cross Road (Vertical)
    final p3 = Offset(size.width * 0.38, 15);
    final p4 = Offset(size.width * 0.38, size.height - 15);
    canvas.drawLine(p3, p4, roadPaint);
    canvas.drawLine(p3, p4, roadCenterLine);

    // Road 3: Science City Marg (Connecting diagonal)
    final p5 = Offset(size.width * 0.38, size.height * 0.46);
    final p6 = Offset(size.width * 0.85, size.height * 0.78);
    canvas.drawLine(p5, p6, roadPaint);
    canvas.drawLine(p5, p6, roadCenterLine);

    // Active Delivery Route Polyline
    final startPt = Offset(size.width * 0.15, size.height * 0.46); // Jan Aushadhi Hub
    final turnPt = Offset(size.width * 0.38, size.height * 0.46);  // Sola Junction
    final endPt = Offset(size.width * 0.82, size.height * 0.76);   // Shivalik Residency

    final routeGlow = Paint()
      ..color = const Color(0xFF059669).withValues(alpha: 0.3)
      ..strokeWidth = 14
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final routePaint = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final routePath = Path()
      ..moveTo(startPt.dx, startPt.dy)
      ..lineTo(turnPt.dx, turnPt.dy)
      ..lineTo(endPt.dx, endPt.dy);

    canvas.drawPath(routePath, routeGlow);
    canvas.drawPath(routePath, routePaint);

    // Pickup Point Pin (Jan Aushadhi Hub)
    final pickupPaint = Paint()..color = const Color(0xFF0284C7);
    canvas.drawCircle(startPt, 10, pickupPaint);
    canvas.drawCircle(startPt, 6, Paint()..color = Colors.white);
    _drawText(canvas, '🏥 Dark-Store Hub #3', Offset(startPt.dx - 40, startPt.dy - 24), const Color(0xFF38BDF8));

    // Customer Destination Pin (Shivalik Residency)
    final dropPaint = Paint()..color = const Color(0xFFE11D48);
    canvas.drawCircle(endPt, 11, dropPaint);
    canvas.drawCircle(endPt, 7, Paint()..color = Colors.white);
    _drawText(canvas, '📍 Ravi Kumar Patel', Offset(endPt.dx - 45, endPt.dy + 14), const Color(0xFFFDA4AF));

    // Calculate Current Rider Position along the route
    Offset riderPos;
    if (progress <= 0.4) {
      final subT = progress / 0.4;
      riderPos = Offset.lerp(startPt, turnPt, subT)!;
    } else {
      final subT = (progress - 0.4) / 0.6;
      riderPos = Offset.lerp(turnPt, endPt, subT)!;
    }

    // Animated GPS Pulse Ring around Rider
    final pulseRadius = 14.0 + pulseVal * 8.0;
    final pulseAlpha = (1.0 - pulseVal) * 0.6;
    final pulsePaint = Paint()
      ..color = const Color(0xFF34D399).withValues(alpha: pulseAlpha)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(riderPos, pulseRadius, pulsePaint);

    // Rider Marker (High-Speed EV Scooter Circle)
    final riderBg = Paint()..color = const Color(0xFF059669);
    canvas.drawCircle(riderPos, 12, riderBg);
    canvas.drawCircle(riderPos, 4, Paint()..color = Colors.white);

    // Street Names
    _drawText(canvas, 'SG HIGHWAY', Offset(size.width * 0.12, size.height * 0.46 + 12), const Color(0xFF64748B));
    _drawText(canvas, 'SOLA SCIENCE CITY RD', Offset(size.width * 0.46, size.height * 0.62), const Color(0xFF64748B));

    canvas.restore();
  }

  void _drawText(Canvas canvas, String text, Offset offset, Color color) {
    final textSpan = TextSpan(
      text: text,
      style: TextStyle(color: color, fontSize: 8.5, fontWeight: FontWeight.w800),
    );
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant _NavigationMapPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.pulseVal != pulseVal ||
        oldDelegate.zoom != zoom ||
        oldDelegate.isSatellite != isSatellite;
  }
}
