import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'firebase_options.dart';

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
  runApp(const PatientApp());
}

class PatientApp extends StatefulWidget {
  const PatientApp({super.key});

  @override
  State<PatientApp> createState() => _PatientAppState();
}

class _PatientAppState extends State<PatientApp> {
  bool _isLoggedIn = false;
  bool _isLoading = true;
  Map<String, dynamic> _currentUser = {
    'displayName': 'Riya Sharma',
    'email': 'riya.sharma@gmail.com',
    'phoneNumber': '9876543210',
    'role': 'patient',
    'isGoogle': true,
    'bloodGroup': 'B+',
    'emergencyContact': '9876500000',
    'abdmId': 'ABDM-91-8273-4410'
  };

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final loggedIn = prefs.getBool('is_logged_in') ?? false;
    final name = prefs.getString('user_name');
    final email = prefs.getString('user_email');
    final phone = prefs.getString('user_phone');
    final isGoogle = prefs.getBool('is_google') ?? true;

    setState(() {
      _isLoggedIn = loggedIn;
      if (name != null) _currentUser['displayName'] = name;
      if (email != null) _currentUser['email'] = email;
      if (phone != null) _currentUser['phoneNumber'] = phone;
      _currentUser['isGoogle'] = isGoogle;
      _isLoading = false;
    });
  }

  Future<void> _handleLogin(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_logged_in', true);
    await prefs.setString('user_name', user['displayName'] ?? 'User');
    await prefs.setString('user_email', user['email'] ?? 'user@gmail.com');
    await prefs.setString('user_phone', user['phoneNumber'] ?? '9876543210');
    await prefs.setBool('is_google', user['isGoogle'] == true);

    // Save profile to live Firebase Firestore
    try {
      final docId = (user['email'] as String? ?? 'user_${DateTime.now().millisecondsSinceEpoch}').replaceAll('.', '_');
      await FirebaseFirestore.instance.collection('users').doc(docId).set({
        'displayName': user['displayName'] ?? 'User',
        'email': user['email'] ?? 'user@gmail.com',
        'phoneNumber': user['phoneNumber'] ?? '9876543210',
        'role': 'patient',
        'isGoogle': user['isGoogle'] == true,
        'bloodGroup': user['bloodGroup'] ?? 'B+',
        'emergencyContact': user['emergencyContact'] ?? '9876500000',
        'abdmId': user['abdmId'] ?? 'ABDM-91-8273-4410',
        'lastLoginAt': FieldValue.serverTimestamp(),
        'platform': 'android_flutter_app',
      }, SetOptions(merge: true));
    } catch (e) {
      debugPrint('Firestore user sync error: $e');
    }

    setState(() {
      _currentUser = user;
      _isLoggedIn = true;
    });
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_logged_in', false);
    setState(() {
      _isLoggedIn = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediQ — OPD Marketplace & Live Queue',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFFFFFF),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          brightness: Brightness.light,
          primary: const Color(0xFF0284C7),
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
      home: _isLoading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : (_isLoggedIn
              ? MainNavigationShell(
                  currentUser: _currentUser,
                  onLogout: _handleLogout,
                  onUpdateUser: (u) => setState(() => _currentUser = u),
                )
              : PatientLoginScreen(
                  onLogin: _handleLogin,
                )),
    );
  }
}

typedef MediQPatientApp = PatientApp;

// -------------------------------------------------------------
// DEDICATED FULL-SCREEN PATIENT LOGIN PAGE
// -------------------------------------------------------------
class PatientLoginScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onLogin;

  const PatientLoginScreen({super.key, required this.onLogin});

  @override
  State<PatientLoginScreen> createState() => _PatientLoginScreenState();
}

class _PatientLoginScreenState extends State<PatientLoginScreen> {
  bool _isRegister = false;
  final _nameController = TextEditingController(text: 'Riya Sharma');
  final _emailController = TextEditingController(text: 'riya.sharma@gmail.com');
  final _passwordController = TextEditingController(text: 'password123');
  final _phoneController = TextEditingController(text: '9876543210');
  bool _loading = false;

  void _showGoogleAccountPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Image.network(
                  'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
                  width: 24,
                  height: 24,
                  errorBuilder: (_, __, ___) => const Icon(Icons.account_circle, color: Color(0xFF4285F4)),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Sign in with Google',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Choose a verified Google account to continue to MediQ',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
            const Divider(height: 24),

            // Account 1
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF0284C7),
                child: Text('R', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
              ),
              title: const Text('Riya Sharma', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('riya.sharma@gmail.com', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                widget.onLogin({
                  'displayName': 'Riya Sharma',
                  'email': 'riya.sharma@gmail.com',
                  'phoneNumber': '9876543210',
                  'role': 'patient',
                  'isGoogle': true,
                  'bloodGroup': 'B+',
                  'emergencyContact': '9876500000',
                  'abdmId': 'ABDM-91-8273-4410'
                });
              },
            ),
            const Divider(height: 1),

            // Account 2
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF10B981),
                child: Text('Y', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
              ),
              title: const Text('Yash Patel (Google)', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('yash.patel.google@gmail.com', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                widget.onLogin({
                  'displayName': 'Yash Patel',
                  'email': 'yash.patel.google@gmail.com',
                  'phoneNumber': '9812345678',
                  'role': 'patient',
                  'isGoogle': true,
                  'bloodGroup': 'O+',
                  'emergencyContact': '9812300000',
                  'abdmId': 'ABDM-91-9988-7766'
                });
              },
            ),
            const Divider(height: 1),

            // Account 3: Custom Google Account Dialog
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFE0F2FE),
                child: Icon(Icons.add, color: Color(0xFF0284C7), size: 22),
              ),
              title: const Text('Add your Google account', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('Sign in with any custom Gmail ID', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                _showCustomGoogleDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomGoogleDialog() {
    final customNameController = TextEditingController(text: 'Yash Patel');
    final customEmailController = TextEditingController(text: 'yashpatel@gmail.com');
    final customPhoneController = TextEditingController(text: '9876543210');

    showDialog(
      context: context,
      builder: (dlgCtx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Image.network(
              'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
              width: 24,
              height: 24,
              errorBuilder: (_, __, ___) => const Icon(Icons.account_circle, color: Color(0xFF4285F4)),
            ),
            const SizedBox(width: 10),
            const Text(
              'Google Sign In',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your Google account credentials to link with MediQ OPD profile:',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: customNameController,
              decoration: InputDecoration(
                labelText: 'Full Name',
                prefixIcon: const Icon(Icons.person, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: customEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Google Email ID (Gmail)',
                prefixIcon: const Icon(Icons.email, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: customPhoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone Number (for SMS token alerts)',
                prefixIcon: const Icon(Icons.phone, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dlgCtx),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dlgCtx);
              widget.onLogin({
                'displayName': customNameController.text.trim().isEmpty ? 'Google User' : customNameController.text.trim(),
                'email': customEmailController.text.trim().isEmpty ? 'user.google@gmail.com' : customEmailController.text.trim(),
                'phoneNumber': customPhoneController.text.trim().isEmpty ? '9876543210' : customPhoneController.text.trim(),
                'role': 'patient',
                'isGoogle': true,
                'bloodGroup': 'B+',
                'emergencyContact': '9876500000',
                'abdmId': 'ABDM-91-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}-${(1000 + DateTime.now().second * 7)}',
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFF059669),
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Signed in as ${customNameController.text.trim()} (Firebase Synced)',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  void _submitEmailAuth() {
    setState(() => _loading = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      widget.onLogin({
        'displayName': _nameController.text.trim().isEmpty ? 'Patient User' : _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phoneNumber': _phoneController.text.trim().isEmpty ? '9876543210' : _phoneController.text.trim(),
        'role': 'patient',
        'isGoogle': false,
        'bloodGroup': 'O+',
        'emergencyContact': '9876500000',
        'abdmId': 'ABDM-91-5544-3322'
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              // Brand Logo & Header
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0284C7).withOpacity(0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.health_and_safety, color: Colors.white, size: 36),
                    ),
                    const SizedBox(height: 12),
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Medi',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF090D16), letterSpacing: -0.5),
                          ),
                          TextSpan(
                            text: 'Q',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF0284C7), letterSpacing: -0.5),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Patient OPD Marketplace & Live Queue Tracker',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Title
              Text(
                _isRegister ? 'Create Patient Account' : 'Sign in to Your Account',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
              ),
              const SizedBox(height: 6),
              Text(
                _isRegister
                    ? 'Register with your phone number for digital OPD tokens and live SMS alerts'
                    : 'Track your live token position, book time slots & view medical history',
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 24),

              // PRIMARY BUTTON: "CONTINUE WITH GOOGLE"
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _showGoogleAccountPicker,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF090D16),
                    elevation: 0,
                    side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Image.network(
                        'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
                        width: 22,
                        height: 22,
                        errorBuilder: (_, __, ___) => const Icon(Icons.g_mobiledata, size: 28, color: Color(0xFF4285F4)),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Continue with Google',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Divider
              Row(
                children: const [
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR WITH EMAIL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8))),
                  ),
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                ],
              ),
              const SizedBox(height: 20),

              // Registration Name
              if (_isRegister) ...[
                const Text('Full Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    hintText: 'e.g. Riya Sharma',
                    prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF64748B)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 14),

                const Text('Phone Number (10 Digits)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    hintText: 'e.g. 9876543210',
                    prefixIcon: const Icon(Icons.phone_outlined, color: Color(0xFF64748B)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // Email
              const Text('Email Address', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  hintText: 'name@example.com',
                  prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF64748B)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 14),

              // Password
              const Text('Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: '••••••••',
                  prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF64748B)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 22),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submitEmailAuth,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    _loading ? 'Signing In...' : (_isRegister ? 'Create MediQ Account' : 'Sign In to Patient Portal'),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Toggle Sign In / Register
              Center(
                child: TextButton(
                  onPressed: () => setState(() => _isRegister = !_isRegister),
                  child: Text(
                    _isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create One Now",
                    style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0284C7)),
                  ),
                ),
              ),

              const SizedBox(height: 10),
              // Quick Guest Skip Button
              Center(
                child: TextButton.icon(
                  onPressed: () {
                    widget.onLogin({
                      'displayName': 'Guest Patient',
                      'email': 'guest@mediq.health',
                      'phoneNumber': '9876543210',
                      'role': 'patient',
                      'isGoogle': false,
                      'bloodGroup': 'B+',
                      'emergencyContact': '9876500000',
                      'abdmId': 'ABDM-91-8273-4410'
                    });
                  },
                  icon: const Icon(Icons.arrow_forward, size: 16, color: Color(0xFF64748B)),
                  label: const Text('Explore OPD Queues as Guest', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// MAIN 4-TAB NAVIGATION SHELL
// -------------------------------------------------------------
class MainNavigationShell extends StatefulWidget {
  final Map<String, dynamic> currentUser;
  final VoidCallback onLogout;
  final Function(Map<String, dynamic>) onUpdateUser;

  const MainNavigationShell({
    super.key,
    required this.currentUser,
    required this.onLogout,
    required this.onUpdateUser,
  });

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  String _selectedHospitalId = 'citycare-central';
  String _selectedHospitalName = 'CityCare Central Hospital';

  void _switchTab(int index) {
    setState(() => _currentIndex = index);
  }

  void _onSelectHospital(String id, String name) {
    setState(() {
      _selectedHospitalId = id;
      _selectedHospitalName = name;
      _currentIndex = 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HospitalDiscoveryTab(
        onSelectHospital: _onSelectHospital,
      ),
      PatientBookingLiveTab(
        currentUser: widget.currentUser,
        selectedHospitalId: _selectedHospitalId,
        selectedHospitalName: _selectedHospitalName,
      ),
      OPDHistoryTab(
        currentUser: widget.currentUser,
      ),
      AccountProfileTab(
        currentUser: widget.currentUser,
        onUpdateUser: widget.onUpdateUser,
        onLogout: widget.onLogout,
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
          onDestinationSelected: _switchTab,
          backgroundColor: const Color(0xFFFFFFFF),
          indicatorColor: const Color(0xFFE0F2FE),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.local_hospital_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.local_hospital, color: Color(0xFF0284C7)),
              label: 'Hospitals',
            ),
            NavigationDestination(
              icon: Icon(Icons.confirmation_number_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.confirmation_number, color: Color(0xFF0284C7)),
              label: 'Live Queue',
            ),
            NavigationDestination(
              icon: Icon(Icons.history_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.history, color: Color(0xFF0284C7)),
              label: 'History',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.person, color: Color(0xFF0284C7)),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 1: HOSPITAL DISCOVERY & SYMPTOM SEARCH (Zomato for Healthcare)
// -------------------------------------------------------------
class HospitalDiscoveryTab extends StatefulWidget {
  final Function(String id, String name) onSelectHospital;

  const HospitalDiscoveryTab({super.key, required this.onSelectHospital});

  @override
  State<HospitalDiscoveryTab> createState() => _HospitalDiscoveryTabState();
}

class _HospitalDiscoveryTabState extends State<HospitalDiscoveryTab> {
  String _searchQuery = '';
  String _selectedSymptom = 'All';

  final List<String> _symptomPills = [
    'All',
    'Fever / Cold',
    'Chest Pain',
    'Skin Rash',
    'Knee Joint Pain',
    'Pediatrics / Child',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF0284C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.health_and_safety, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'MediQ',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
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
                'LIVE OPD',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
              ),
            ),
          ],
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('hospitals').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final hospitals = snapshot.data!.docs;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Symptom Search Bar
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Search symptom (e.g. fever, chest pain, rash)...',
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF0284C7)),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Symptom Quick Filter Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _symptomPills.map((symptom) {
                    final isSelected = _selectedSymptom == symptom;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(symptom),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() => _selectedSymptom = selected ? symptom : 'All');
                        },
                        selectedColor: const Color(0xFF0284C7),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF334155),
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                        backgroundColor: const Color(0xFFF1F5F9),
                        side: BorderSide.none,
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              // Filtered Hospitals List (Zomato-Style Symptom Discovery)
              ...hospitals.where((hDoc) {
                final h = hDoc.data() as Map<String, dynamic>;
                final name = (h['name'] ?? '').toString().toLowerCase();
                final tagline = (h['tagline'] ?? '').toString().toLowerCase();
                final specialties = (h['specialties'] as List<dynamic>? ?? []).map((s) => s.toString().toLowerCase()).toList();

                bool matches = _searchQuery.isEmpty ||
                    name.contains(_searchQuery) ||
                    tagline.contains(_searchQuery) ||
                    specialties.any((s) => s.contains(_searchQuery));

                if (!matches && _searchQuery.isNotEmpty) {
                  if (_searchQuery.contains('fever') || _searchQuery.contains('cold')) {
                    matches = specialties.any((s) => s.contains('medicine') || s.contains('pediatric'));
                  } else if (_searchQuery.contains('chest') || _searchQuery.contains('heart')) {
                    matches = specialties.any((s) => s.contains('cardiology'));
                  } else if (_searchQuery.contains('knee') || _searchQuery.contains('bone') || _searchQuery.contains('joint')) {
                    matches = specialties.any((s) => s.contains('orthopedic'));
                  } else if (_searchQuery.contains('skin') || _searchQuery.contains('rash')) {
                    matches = specialties.any((s) => s.contains('dermatology'));
                  }
                }

                if (_selectedSymptom != 'All') {
                  if (_selectedSymptom.contains('Fever')) {
                    return specialties.any((s) => s.contains('medicine') || s.contains('pediatric'));
                  } else if (_selectedSymptom.contains('Chest')) {
                    return specialties.any((s) => s.contains('cardiology'));
                  } else if (_selectedSymptom.contains('Skin')) {
                    return specialties.any((s) => s.contains('dermatology'));
                  } else if (_selectedSymptom.contains('Knee')) {
                    return specialties.any((s) => s.contains('orthopedic'));
                  } else if (_selectedSymptom.contains('Pediatrics')) {
                    return specialties.any((s) => s.contains('pediatric'));
                  }
                }

                return matches;
              }).map((hDoc) {
                final h = hDoc.data() as Map<String, dynamic>;
                final name = h['name'] ?? 'Hospital';
                final tagline = h['tagline'] ?? 'Multi-Speciality Hospital';
                final rating = h['rating'] ?? 4.8;
                final waitMin = h['avgWaitMinutes'] ?? 12;

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF090D16),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    tagline,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF64748B),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.star, color: Color(0xFFD97706), size: 14),
                                  const SizedBox(width: 3),
                                  Text(
                                    '$rating',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12,
                                      color: Color(0xFF92400E),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFBFDBFE)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.timer_outlined, size: 13, color: Color(0xFF1D4ED8)),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Avg Wait: $waitMin mins',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF1D4ED8),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '📍 ${h['distance'] ?? '1.2 km'} away',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () => widget.onSelectHospital(hDoc.id, name),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0284C7),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text(
                              'View Doctors & Book Token',
                              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                            ),
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
// TAB 2: PATIENT BOOKING & LIVE TRACKING TAB
// -------------------------------------------------------------
class PatientBookingLiveTab extends StatefulWidget {
  final Map<String, dynamic> currentUser;
  final String selectedHospitalId;
  final String selectedHospitalName;

  const PatientBookingLiveTab({
    super.key,
    required this.currentUser,
    required this.selectedHospitalId,
    required this.selectedHospitalName,
  });

  @override
  State<PatientBookingLiveTab> createState() => _PatientBookingLiveTabState();
}

class _PatientBookingLiveTabState extends State<PatientBookingLiveTab> {
  String? _activeDoctorId;
  String? _activeTokenId;
  int? _activeTokenNumber;
  String? _activePatientName;
  String? _selectedDoctorId;
  String _entryMode = 'walkin';
  final String _selectedSlot = '10:30 AM - 10:45 AM';

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;

  int _ratingVal = 5;
  final _reviewController = TextEditingController();
  bool _reviewSubmitted = false;

  @override
  void initState() {
    super.initState();
    _loadSavedToken();
    _nameController.text = widget.currentUser['displayName'] ?? '';
    _phoneController.text = widget.currentUser['phoneNumber'] ?? '';
  }

  Future<void> _loadSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _activeDoctorId = prefs.getString('active_doc_id');
      _activeTokenId = prefs.getString('active_token_id');
      _activeTokenNumber = prefs.getInt('active_token_num');
      _activePatientName = prefs.getString('active_pat_name');
    });
  }

  Future<void> _saveActiveToken(String docId, String tokId, int tokNum, String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('active_doc_id', docId);
    await prefs.setString('active_token_id', tokId);
    await prefs.setInt('active_token_num', tokNum);
    await prefs.setString('active_pat_name', name);
    setState(() {
      _activeDoctorId = docId;
      _activeTokenId = tokId;
      _activeTokenNumber = tokNum;
      _activePatientName = name;
    });
  }

  Future<void> _clearActiveToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('active_doc_id');
    await prefs.remove('active_token_id');
    await prefs.remove('active_token_num');
    await prefs.remove('active_pat_name');
    setState(() {
      _activeDoctorId = null;
      _activeTokenId = null;
      _activeTokenNumber = null;
      _activePatientName = null;
      _reviewSubmitted = false;
    });
  }

  Future<void> _issueToken() async {
    if (_selectedDoctorId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an approved doctor.')),
      );
      return;
    }

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter patient name and phone number.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final todayKey = DateTime.now().toString().split(' ')[0];
    final tokenColRef = FirebaseFirestore.instance
        .collection('doctors')
        .doc(_selectedDoctorId)
        .collection('tokens');

    int nextToken = 1;
    final newDocRef = tokenColRef.doc();

    try {
      final counterRef = FirebaseFirestore.instance
          .collection('doctors')
          .doc(_selectedDoctorId)
          .collection('counters')
          .doc(todayKey);

      await FirebaseFirestore.instance.runTransaction((tx) async {
        final snap = await tx.get(counterRef);
        final current = snap.exists ? (snap.data()?['lastToken'] ?? 0) : 0;
        nextToken = current + 1;
        tx.set(counterRef, {'lastToken': nextToken, 'dateKey': todayKey}, SetOptions(merge: true));
        tx.set(newDocRef, {
          'tokenNumber': nextToken,
          'patientName': name,
          'phoneNumber': phone,
          'reason': _reasonController.text.trim(),
          'doctorId': _selectedDoctorId,
          'status': 'waiting',
          'date': todayKey,
          'createdAt': FieldValue.serverTimestamp(),
          'bookingMode': _entryMode,
          'slotTime': _entryMode == 'slot' ? _selectedSlot : null,
        });
      }).timeout(const Duration(seconds: 4));
    } catch (e) {
      // Graceful offline fallback: write document directly so offline cache queues it
      nextToken = (DateTime.now().minute % 30) + 1;
      try {
        await newDocRef.set({
          'tokenNumber': nextToken,
          'patientName': name,
          'phoneNumber': phone,
          'reason': _reasonController.text.trim(),
          'doctorId': _selectedDoctorId,
          'status': 'waiting',
          'date': todayKey,
          'createdAt': FieldValue.serverTimestamp(),
          'bookingMode': _entryMode,
          'slotTime': _entryMode == 'slot' ? _selectedSlot : null,
        }, SetOptions(merge: true));
      } catch (innerErr) {
        debugPrint('Offline queue write: $innerErr');
      }
    }

    try {
      // Save to global history
      await FirebaseFirestore.instance.collection('history').doc('hist-${newDocRef.id}').set({
        'id': 'hist-${newDocRef.id}',
        'tokenNumber': nextToken,
        'patientName': name,
        'phoneNumber': phone,
        'doctorId': _selectedDoctorId,
        'hospitalId': widget.selectedHospitalId,
        'hospitalName': widget.selectedHospitalName,
        'reason': _reasonController.text.trim().isEmpty ? 'OPD Consultation' : _reasonController.text.trim(),
        'status': 'waiting',
        'bookingMode': _entryMode,
        'slotTime': _entryMode == 'slot' ? _selectedSlot : null,
        'consultationFee': 500,
        'date': todayKey,
        'timestamp': DateTime.now().toIso8601String(),
      }, SetOptions(merge: true));

      await _saveActiveToken(_selectedDoctorId!, newDocRef.id, nextToken, name);
    } catch (e) {
      await _saveActiveToken(_selectedDoctorId!, newDocRef.id, nextToken, name);
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _submitReview(String docName) async {
    try {
      await FirebaseFirestore.instance.collection('reviews').add({
        'hospitalId': widget.selectedHospitalId,
        'hospitalName': widget.selectedHospitalName,
        'doctorId': _activeDoctorId,
        'doctorName': docName,
        'patientName': _activePatientName ?? 'Patient',
        'rating': _ratingVal,
        'comment': _reviewController.text.trim().isEmpty ? 'Great consultation!' : _reviewController.text.trim(),
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (_activeTokenId != null) {
        await FirebaseFirestore.instance.collection('history').doc('hist-$_activeTokenId').set({
          'rating': _ratingVal,
          'reviewText': _reviewController.text.trim(),
        }, SetOptions(merge: true));
      }

      setState(() => _reviewSubmitted = true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit review: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_activeDoctorId != null && _activeTokenId != null) {
      return StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('doctors')
            .doc(_activeDoctorId)
            .collection('tokens')
            .doc(_activeTokenId)
            .snapshots(),
        builder: (context, tokenSnap) {
          return StreamBuilder<DocumentSnapshot>(
            stream: FirebaseFirestore.instance
                .collection('doctors')
                .doc(_activeDoctorId)
                .snapshots(),
            builder: (context, docSnap) {
              final docData = docSnap.data?.data() as Map<String, dynamic>? ?? {};
              final tokenData = tokenSnap.data?.data() as Map<String, dynamic>? ?? {};
              final status = tokenData['status'] ?? 'waiting';
              final roomNumber = docData['roomNumber'] ?? 'Room 102';
              final floorWing = docData['floorWing'] ?? 'General OPD Block';
              final docName = docData['name'] ?? 'Doctor';

              final isCompleted = status == 'completed';
              final isInProgress = status == 'in-progress';

              return Scaffold(
                appBar: AppBar(
                  title: const Text('Live OPD Tracker'),
                  actions: [
                    TextButton(
                      onPressed: _clearActiveToken,
                      child: const Text('Leave Queue', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
                body: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // SECTION 7.9: SMART LEAVE-NOW ENGINE ALERT BANNER
                    if (!isInProgress && !isCompleted)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFEF3C7), Color(0xFFFFFBEB)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withOpacity(0.15),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.directions_car, color: Colors.white, size: 24),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '🚗 LEAVE NOW FOR HOSPITAL!',
                                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF92400E)),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Live Traffic ETA: ~12 mins • Leave home now to walk right into consultation!',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFB45309)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD97706),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text('DEPART', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10)),
                            ),
                          ],
                        ),
                      ),

                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Text(
                              isInProgress ? '🎉 YOU ARE NOW CALLED!' : (isCompleted ? '✓ CONSULTATION COMPLETED' : 'WAITING IN LIVE QUEUE'),
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: isInProgress ? const Color(0xFFD97706) : (isCompleted ? const Color(0xFF059669) : const Color(0xFF0284C7)),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0F9FF),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFBAE6FD)),
                              ),
                              child: Text(
                                '#${(_activeTokenNumber ?? 1).toString().padLeft(2, '0')}',
                                style: const TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0369A1),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Patient: $_activePatientName',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF090D16)),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.meeting_room, color: Color(0xFF0284C7)),
                                const SizedBox(width: 8),
                                Text(
                                  '$roomNumber • $floorWing',
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Doctor: $docName (${docData['department'] ?? 'General'})',
                              style: const TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // SECTION 7.10: AUTO PHARMACY TOKEN DISPENSE CARD
                    if (isCompleted) ...[
                      Card(
                        color: const Color(0xFFF0FDF4),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFF86EFAC), width: 1.5),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
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
                                    child: const Icon(Icons.medication, color: Colors.white, size: 20),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'SECTION 7.10 • PHARMACY TOKEN HANDOFF',
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF15803D)),
                                        ),
                                        Text(
                                          tokenData['pharmacyName'] ?? 'CityCare In-House Pharmacy',
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF064E3B)),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: (tokenData['pharmacyStatus'] ?? 'ready') == 'ready'
                                          ? const Color(0xFFDCFCE7)
                                          : const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: (tokenData['pharmacyStatus'] ?? 'ready') == 'ready'
                                            ? const Color(0xFF86EFAC)
                                            : const Color(0xFFFDE68A),
                                      ),
                                    ),
                                    child: Text(
                                      (tokenData['pharmacyStatus'] ?? 'ready') == 'ready'
                                          ? '● PACKED & READY'
                                          : '⏳ PREPARING',
                                      style: TextStyle(
                                        color: (tokenData['pharmacyStatus'] ?? 'ready') == 'ready'
                                            ? const Color(0xFF166534)
                                            : const Color(0xFF92400E),
                                        fontWeight: FontWeight.w900,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('PHARMACY TOKEN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                                      Text(
                                        tokenData['pharmacyTokenCode'] ?? 'PH-01',
                                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
                                      ),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: const [
                                      Text('DISPENSE LOCATION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                                      Text('Counter 1 (Express Pickup)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                                    ],
                                  ),
                                ],
                              ),
                              if (tokenData['prescribedMedicines'] != null && (tokenData['prescribedMedicines'] as List).isNotEmpty) ...[
                                const Divider(height: 20, color: Color(0xFFBBF7D0)),
                                const Text('Prescribed Medicines in Package:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF166534))),
                                const SizedBox(height: 6),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 4,
                                  children: (tokenData['prescribedMedicines'] as List).map((m) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: const Color(0xFF86EFAC)),
                                      ),
                                      child: Text(m.toString(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF064E3B))),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // SECTION 7.11: PHARMACY PRICE & DISTANCE COMPARISON
                      Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: const [
                                  Icon(Icons.trending_up, color: Color(0xFF059669), size: 18),
                                  SizedBox(width: 8),
                                  Text(
                                    'Section 7.11 • Nearby Pharmacy Price Comparison',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              ...[
                                {
                                  'name': 'CityCare Hospital Pharmacy',
                                  'dist': '0 km (Ground Floor)',
                                  'price': '₹180',
                                  'token': 'PH-XX',
                                  'badge': 'FASTEST ON-SITE',
                                  'color': const Color(0xFF0284C7)
                                },
                                {
                                  'name': 'Jan Aushadhi Generic Kendra',
                                  'dist': '0.8 km (4 min drive)',
                                  'price': '₹54',
                                  'token': 'JA-XX',
                                  'badge': 'GENERIC 70% OFF',
                                  'color': const Color(0xFF7C3AED)
                                },
                                {
                                  'name': 'Apollo Pharmacy 24/7',
                                  'dist': '0.4 km (2 min drive)',
                                  'price': '₹195',
                                  'token': 'AP-XX',
                                  'badge': '24/7 OPEN',
                                  'color': const Color(0xFF0369A1)
                                },
                                {
                                  'name': 'MedPlus Pharmacy & Wellness',
                                  'dist': '1.1 km (6 min drive)',
                                  'price': '₹155',
                                  'token': 'MP-XX',
                                  'badge': '15% OFF',
                                  'color': const Color(0xFF059669)
                                },
                              ].map((ph) {
                                final isChosen = (tokenData['pharmacyName'] ?? '').toString().contains(ph['name'] as String) ||
                                    ((tokenData['pharmacyName'] == null) && ph['token'] == 'PH-XX');

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: isChosen ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: isChosen ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                                      width: isChosen ? 1.8 : 1.0,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(ph['name'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                                              if (isChosen) ...[
                                                const SizedBox(width: 4),
                                                const Icon(Icons.check_circle, size: 13, color: Color(0xFF16A34A)),
                                              ],
                                            ],
                                          ),
                                          Text('📍 ${ph['dist']}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(ph['price'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F172A))),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: (ph['color'] as Color).withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(ph['badge'] as String, style: TextStyle(color: ph['color'] as Color, fontWeight: FontWeight.w900, fontSize: 9)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (isCompleted)
                      Card(
                        color: const Color(0xFFFFFBEB),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFFFDE68A), width: 1.5),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: _reviewSubmitted
                              ? const Center(
                                  child: Text(
                                    '✓ Thank you for rating your consultation!',
                                    style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF92400E)),
                                  ),
                                )
                              : Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'How was your OPD Consultation?',
                                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF92400E)),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [1, 2, 3, 4, 5].map((s) {
                                        return IconButton(
                                          icon: Icon(
                                            Icons.star,
                                            color: _ratingVal >= s ? const Color(0xFFD97706) : const Color(0xFFCBD5E1),
                                            size: 32,
                                          ),
                                          onPressed: () => setState(() => _ratingVal = s),
                                        );
                                      }).toList(),
                                    ),
                                    TextField(
                                      controller: _reviewController,
                                      decoration: const InputDecoration(
                                        hintText: 'Share your feedback with the clinic...',
                                        filled: true,
                                        fillColor: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton(
                                        onPressed: () => _submitReview(docName),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFFD97706),
                                          foregroundColor: Colors.white,
                                        ),
                                        child: const Text('Submit 5-Star Rating', style: TextStyle(fontWeight: FontWeight.w900)),
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                  ],
                ),
              );
            },
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Book OPD Token • ${widget.selectedHospitalName}'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('doctors').snapshots(),
        builder: (context, snapshot) {
          final doctors = (snapshot.data?.docs ?? [])
              .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
              .where((d) => d['status'] == 'approved' || d['status'] == null)
              .toList();

          if (_selectedDoctorId == null && doctors.isNotEmpty) {
            _selectedDoctorId = doctors.first['id'] as String;
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('⚡ Instant Walk-In')),
                      selected: _entryMode == 'walkin',
                      onSelected: (s) => setState(() => _entryMode = 'walkin'),
                      selectedColor: const Color(0xFF0284C7),
                      labelStyle: TextStyle(
                        color: _entryMode == 'walkin' ? Colors.white : const Color(0xFF334155),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('📅 Book OPD Slot')),
                      selected: _entryMode == 'slot',
                      onSelected: (s) => setState(() => _entryMode = 'slot'),
                      selectedColor: const Color(0xFF0284C7),
                      labelStyle: TextStyle(
                        color: _entryMode == 'slot' ? Colors.white : const Color(0xFF334155),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              const Text('Select Specialist Doctor', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedDoctorId,
                    isExpanded: true,
                    items: doctors.map((d) {
                      return DropdownMenuItem<String>(
                        value: d['id'] as String,
                        child: Text('${d['name']} (${d['department']}) - ₹${d['consultationFee'] ?? 500}'),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedDoctorId = val),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              const Text('Patient Full Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  hintText: 'e.g. Riya Sharma',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),

              const Text('Phone Number (10 Digits)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  hintText: 'e.g. 9876543210',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),

              const Text('Chief Complaint / Reason (Optional)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _reasonController,
                decoration: InputDecoration(
                  hintText: 'e.g. Fever, Cough for 2 days...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _issueToken,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    _isSubmitting ? 'Generating...' : 'Confirm & Issue Digital Token',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 3: OPD VISIT & TOKEN HISTORY TAB
// -------------------------------------------------------------
class OPDHistoryTab extends StatelessWidget {
  final Map<String, dynamic> currentUser;

  const OPDHistoryTab({super.key, required this.currentUser});

  void _showDigitalSlip(BuildContext context, Map<String, dynamic> item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              item['hospitalName'] ?? 'CityCare Central Hospital',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const Text('DIGITAL OPD PRESCRIPTION SLIP', style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
            const Divider(height: 24),
            Text(
              'TOKEN #${item['tokenNumber'] ?? 1}',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF0284C7)),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Doctor:'),
                Text(item['doctorName'] ?? 'Dr. Rajesh Mehta', style: const TextStyle(fontWeight: FontWeight.w800)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Consultation Fee:'),
                Text('₹${item['consultationFee'] ?? 500} (PAID)', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669))),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close Slip'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My OPD Visit History'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('history').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final docs = snapshot.data!.docs;
          if (docs.isEmpty) {
            return const Center(child: Text('No past visit history recorded.'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final item = docs[index].data() as Map<String, dynamic>;
              final isCompleted = item['status'] == 'completed';

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
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFBFDBFE)),
                            ),
                            child: Text(
                              'Token #${item['tokenNumber'] ?? 1}',
                              style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1D4ED8)),
                            ),
                          ),
                          Text(
                            item['date'] ?? 'Today',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item['doctorName'] ?? 'Senior Consultant',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                      ),
                      Text(
                        item['hospitalName'] ?? 'CityCare Central Hospital',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isCompleted ? '✓ Completed' : 'In Queue',
                            style: TextStyle(
                              color: isCompleted ? const Color(0xFF059669) : const Color(0xFF0284C7),
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                            ),
                          ),
                          TextButton(
                            onPressed: () => _showDigitalSlip(context, item),
                            child: const Text('Digital Slip >', style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 4: MY ACCOUNT & PROFILE MANAGEMENT
// -------------------------------------------------------------
class AccountProfileTab extends StatelessWidget {
  final Map<String, dynamic> currentUser;
  final Function(Map<String, dynamic>) onUpdateUser;
  final VoidCallback onLogout;

  const AccountProfileTab({
    super.key,
    required this.currentUser,
    required this.onUpdateUser,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Account & Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: const Color(0xFF0284C7),
                    child: Text(
                      currentUser['displayName']?.substring(0, 1) ?? 'R',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentUser['displayName'] ?? 'Riya Sharma',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                        ),
                        Text(
                          currentUser['email'] ?? 'riya.sharma@gmail.com',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFBBF7D0)),
                          ),
                          child: const Text(
                            'Google Account Linked',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          Card(
            child: ListTile(
              leading: const Icon(Icons.verified_user, color: Color(0xFF059669)),
              title: const Text('ABDM Health ID', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: Text(currentUser['abdmId'] ?? 'ABDM-91-8273-4410', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w800)),
              trailing: const Icon(Icons.check_circle, color: Color(0xFF059669), size: 18),
            ),
          ),
          const SizedBox(height: 12),

          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.bloodtype, color: Color(0xFFDC2626)),
                  title: const Text('Blood Group', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  trailing: Text(currentUser['bloodGroup'] ?? 'B+', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFDC2626), fontSize: 15)),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.emergency, color: Color(0xFFD97706)),
                  title: const Text('Emergency Contact', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  subtitle: Text(currentUser['emergencyContact'] ?? '9876500000', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Log out Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onLogout,
              icon: const Icon(Icons.logout, color: Color(0xFFDC2626)),
              label: const Text('Sign Out / Switch Account', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFDC2626))),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: Color(0xFFFECACA), width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
