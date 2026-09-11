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
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }
  runApp(const DoctorApp());
}

class DoctorApp extends StatefulWidget {
  const DoctorApp({super.key});

  @override
  State<DoctorApp> createState() => _DoctorAppState();
}

class _DoctorAppState extends State<DoctorApp> {
  bool _isLoggedIn = false;
  bool _isLoading = true;
  String _selectedDoctorId = 'dr-mehta';
  Map<String, dynamic> _currentDoctor = {
    'id': 'dr-mehta',
    'name': 'Dr. Rajesh Mehta',
    'email': 'dr.mehta@citycare.com',
    'department': 'General Medicine',
    'councilRegistration': 'MCI-48291-DL',
    'status': 'approved',
    'roomNumber': 'Room 102',
    'floorWing': 'Ground Floor, OPD Wing A',
    'consultationFee': 500
  };

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final loggedIn = prefs.getBool('doc_is_logged_in') ?? false;
    final docId = prefs.getString('doc_id') ?? 'dr-mehta';
    final docName = prefs.getString('doc_name') ?? 'Dr. Rajesh Mehta';
    final docDept = prefs.getString('doc_dept') ?? 'General Medicine';

    setState(() {
      _isLoggedIn = loggedIn;
      _selectedDoctorId = docId;
      _currentDoctor['id'] = docId;
      _currentDoctor['name'] = docName;
      _currentDoctor['department'] = docDept;
      _isLoading = false;
    });
  }

  Future<void> _handleLogin(Map<String, dynamic> doctor) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('doc_is_logged_in', true);
    await prefs.setString('doc_id', doctor['id'] ?? 'dr-mehta');
    await prefs.setString('doc_name', doctor['name'] ?? 'Doctor');
    await prefs.setString('doc_dept', doctor['department'] ?? 'General Medicine');

    // Save doctor profile to live Firebase Firestore
    try {
      final docId = doctor['id'] ?? (doctor['email'] as String? ?? 'dr_mehta').replaceAll('.', '_');
      await FirebaseFirestore.instance.collection('doctors').doc(docId).set({
        'id': docId,
        'name': doctor['name'] ?? 'Doctor',
        'email': doctor['email'] ?? 'doctor@citycare.com',
        'department': doctor['department'] ?? 'General Medicine',
        'councilRegistration': doctor['councilRegistration'] ?? 'MCI-REG-PENDING',
        'status': doctor['status'] ?? 'approved',
        'roomNumber': doctor['roomNumber'] ?? 'Room 101',
        'floorWing': doctor['floorWing'] ?? 'Ground Floor, OPD Wing A',
        'consultationFee': doctor['consultationFee'] ?? 500,
        'lastLoginAt': FieldValue.serverTimestamp(),
        'platform': 'android_doctor_app',
      }, SetOptions(merge: true));
    } catch (e) {
      debugPrint('Firestore doctor sync error: $e');
    }

    setState(() {
      _currentDoctor = doctor;
      _selectedDoctorId = doctor['id'] ?? 'dr-mehta';
      _isLoggedIn = true;
    });
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('doc_is_logged_in', false);
    setState(() {
      _isLoggedIn = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediQ Doctor Console & KYC Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFFFFFF),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0D9488),
          brightness: Brightness.light,
          primary: const Color(0xFF0D9488),
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
              ? DoctorRootShell(
                  doctorId: _selectedDoctorId,
                  currentDoctor: _currentDoctor,
                  onLogout: _handleLogout,
                  onSelectDoctor: (id) => setState(() => _selectedDoctorId = id),
                )
              : DoctorLoginScreen(
                  onLogin: _handleLogin,
                )),
    );
  }
}

typedef MediQDoctorApp = DoctorApp;

// -------------------------------------------------------------
// DEDICATED FULL-SCREEN DOCTOR LOGIN PAGE
// -------------------------------------------------------------
class DoctorLoginScreen extends StatefulWidget {
  final Function(Map<String, dynamic>) onLogin;

  const DoctorLoginScreen({super.key, required this.onLogin});

  @override
  State<DoctorLoginScreen> createState() => _DoctorLoginScreenState();
}

class _DoctorLoginScreenState extends State<DoctorLoginScreen> {
  final _emailController = TextEditingController(text: 'dr.mehta@citycare.com');
  final _passwordController = TextEditingController(text: 'password123');
  final _mciController = TextEditingController(text: 'MCI-48291-DL');
  bool _loading = false;

  void _showGoogleDoctorPicker() {
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
                  'Sign in with Google (Clinician)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Select your verified medical council Google account',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
            const Divider(height: 24),

            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF0D9488),
                child: Icon(Icons.medical_services, color: Colors.white, size: 20),
              ),
              title: const Text('Dr. Rajesh Mehta', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('dr.mehta@citycare.com (MCI Approved)', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                widget.onLogin({
                  'id': 'dr-mehta',
                  'name': 'Dr. Rajesh Mehta',
                  'email': 'dr.mehta@citycare.com',
                  'department': 'General Medicine',
                  'councilRegistration': 'MCI-48291-DL',
                  'status': 'approved',
                  'roomNumber': 'Room 102',
                  'floorWing': 'Ground Floor, OPD Wing A',
                  'consultationFee': 500
                });
              },
            ),
            const Divider(height: 1),

            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFF0284C7),
                child: Icon(Icons.child_care, color: Colors.white, size: 20),
              ),
              title: const Text('Dr. Sarah Sharma', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('dr.sharma@citycare.com (Pediatrics)', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                widget.onLogin({
                  'id': 'dr-sharma',
                  'name': 'Dr. Sarah Sharma',
                  'email': 'dr.sharma@citycare.com',
                  'department': 'Pediatrics & Child Health',
                  'councilRegistration': 'MCI-52194-MH',
                  'status': 'approved',
                  'roomNumber': 'Room 205',
                  'floorWing': '1st Floor, Maternal & Child Wing',
                  'consultationFee': 600
                });
              },
            ),
            const Divider(height: 1),

            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFE11D48),
                child: Icon(Icons.favorite, color: Colors.white, size: 20),
              ),
              title: const Text('Dr. Priya Nair', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('dr.nair@citycare.com (Cardiology)', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                widget.onLogin({
                  'id': 'dr-nair',
                  'name': 'Dr. Priya Nair',
                  'email': 'dr.nair@citycare.com',
                  'department': 'Cardiology & Chest Clinic',
                  'councilRegistration': 'MCI-61029-KL',
                  'status': 'approved',
                  'roomNumber': 'Room 401',
                  'floorWing': '3rd Floor, Heart Center',
                  'consultationFee': 900
                });
              },
            ),
            const Divider(height: 1),

            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFE0F2FE),
                child: Icon(Icons.add, color: Color(0xFF0D9488), size: 22),
              ),
              title: const Text('Add your Doctor Google account', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              subtitle: const Text('Sign in with any custom Doctor Gmail ID', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                _showCustomDoctorGoogleDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomDoctorGoogleDialog() {
    final customNameController = TextEditingController(text: 'Dr. Yash Patel');
    final customEmailController = TextEditingController(text: 'dr.yashpatel@citycare.com');
    final customDeptController = TextEditingController(text: 'General Medicine & OPD');
    final customMciController = TextEditingController(text: 'MCI-99881-DL');

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
              'Doctor Google Login',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your official Doctor credentials to sync with OPD Queue Console:',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: customNameController,
              decoration: InputDecoration(
                labelText: 'Doctor Name (with Dr. prefix)',
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
                labelText: 'Doctor Google Email ID (Gmail)',
                prefixIcon: const Icon(Icons.email, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: customDeptController,
              decoration: InputDecoration(
                labelText: 'Specialty / Department',
                prefixIcon: const Icon(Icons.medical_services, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: customMciController,
              decoration: InputDecoration(
                labelText: 'MCI / State Medical Reg. Number',
                prefixIcon: const Icon(Icons.badge, size: 20),
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
              final docId = 'dr-${customNameController.text.trim().toLowerCase().replaceAll('dr.', '').replaceAll('dr', '').trim().replaceAll(' ', '_')}';
              widget.onLogin({
                'id': docId.isEmpty ? 'dr-custom' : docId,
                'name': customNameController.text.trim().isEmpty ? 'Dr. Physician' : customNameController.text.trim(),
                'email': customEmailController.text.trim().isEmpty ? 'doctor@citycare.com' : customEmailController.text.trim(),
                'department': customDeptController.text.trim().isEmpty ? 'General Medicine' : customDeptController.text.trim(),
                'councilRegistration': customMciController.text.trim().isEmpty ? 'MCI-APPROVED' : customMciController.text.trim(),
                'status': 'approved',
                'roomNumber': 'Room 105',
                'floorWing': 'Ground Floor, OPD Wing A',
                'consultationFee': 500,
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFF0D9488),
                  content: Row(
                    children: [
                      const Icon(Icons.verified, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Logged in as ${customNameController.text.trim()} (Firebase Synced)',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0D9488),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Continue to Console', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  void _submitEmailLogin() {
    setState(() => _loading = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      widget.onLogin({
        'id': 'dr-mehta',
        'name': 'Dr. Rajesh Mehta',
        'email': _emailController.text.trim(),
        'department': 'General Medicine',
        'councilRegistration': _mciController.text.trim(),
        'status': 'approved',
        'roomNumber': 'Room 102',
        'floorWing': 'Ground Floor, OPD Wing A',
        'consultationFee': 500
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
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0D9488).withOpacity(0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.medical_services, color: Colors.white, size: 36),
                    ),
                    const SizedBox(height: 12),
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'MediQ ',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                          ),
                          TextSpan(
                            text: 'Doctor',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF0D9488)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Doctor Consultation Console & Medical Council KYC Desk',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              const Text(
                'Clinician Portal Sign In',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
              ),
              const SizedBox(height: 6),
              const Text(
                'Log in with your Medical Council credentials to manage outpatient queues and patient triage',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 24),

              // CONTINUE WITH GOOGLE BUTTON
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _showGoogleDoctorPicker,
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
                        'Continue with Google (Doctor)',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Row(
                children: const [
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR WITH MCI CREDENTIALS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8))),
                  ),
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                ],
              ),
              const SizedBox(height: 20),

              const Text('Medical Council Registration No.', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _mciController,
                decoration: InputDecoration(
                  hintText: 'e.g. MCI-48291-DL',
                  prefixIcon: const Icon(Icons.badge_outlined, color: Color(0xFF64748B)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 14),

              const Text('Doctor Email Address', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  hintText: 'dr.mehta@citycare.com',
                  prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF64748B)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 14),

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

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submitEmailLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0D9488),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    _loading ? 'Verifying Credentials...' : 'Sign In to Doctor Console',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                  ),
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
// MAIN DOCTOR ROOT SHELL
// -------------------------------------------------------------
class DoctorRootShell extends StatefulWidget {
  final String doctorId;
  final Map<String, dynamic> currentDoctor;
  final VoidCallback onLogout;
  final Function(String) onSelectDoctor;

  const DoctorRootShell({
    super.key,
    required this.doctorId,
    required this.currentDoctor,
    required this.onLogout,
    required this.onSelectDoctor,
  });

  @override
  State<DoctorRootShell> createState() => _DoctorRootShellState();
}

class _DoctorRootShellState extends State<DoctorRootShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      DoctorConsoleTab(
        doctorId: widget.doctorId,
        onSelectDoctor: widget.onSelectDoctor,
      ),
      DoctorKYCAccountTab(
        doctorId: widget.doctorId,
        currentDoctor: widget.currentDoctor,
        onLogout: widget.onLogout,
        onSelectDoctor: widget.onSelectDoctor,
      ),
    ];

    return Scaffold(
      body: tabs[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1.5)),
          color: Color(0xFFFFFFFF),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
          backgroundColor: const Color(0xFFFFFFFF),
          indicatorColor: const Color(0xFFCCFBF1),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.meeting_room_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.meeting_room, color: Color(0xFF0D9488)),
              label: 'OPD Queue Console',
            ),
            NavigationDestination(
              icon: Icon(Icons.verified_user_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.verified_user, color: Color(0xFF0D9488)),
              label: 'Doctor KYC & Profile',
            ),
          ],
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 1: DOCTOR CONSULTATION CONSOLE
// -------------------------------------------------------------
class DoctorConsoleTab extends StatefulWidget {
  final String doctorId;
  final Function(String) onSelectDoctor;

  const DoctorConsoleTab({
    super.key,
    required this.doctorId,
    required this.onSelectDoctor,
  });

  @override
  State<DoctorConsoleTab> createState() => _DoctorConsoleTabState();
}

class _DoctorConsoleTabState extends State<DoctorConsoleTab> {
  Timer? _timer;
  int _elapsedSeconds = 0;
  String? _activeTokenId;

  final _roomController = TextEditingController();
  final _wingController = TextEditingController();

  @override
  void dispose() {
    _timer?.cancel();
    _roomController.dispose();
    _wingController.dispose();
    super.dispose();
  }

  void _startTimer(String tokenId) {
    if (_activeTokenId != tokenId) {
      _activeTokenId = tokenId;
      _elapsedSeconds = 0;
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (mounted) setState(() => _elapsedSeconds++);
      });
    }
  }

  void _stopTimer() {
    _timer?.cancel();
    _activeTokenId = null;
    _elapsedSeconds = 0;
  }

  String _formatTimer(int secs) {
    final m = secs ~/ 60;
    final s = secs % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void _showRoomChangeDialog(Map<String, dynamic> docData) {
    _roomController.text = docData['roomNumber'] ?? 'Room 102';
    _wingController.text = docData['floorWing'] ?? 'Ground Floor, OPD Wing A';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Relocate OPD Consultation Room', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _roomController,
              decoration: const InputDecoration(labelText: 'Room Number (e.g. Room 204)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _wingController,
              decoration: const InputDecoration(labelText: 'Floor & Wing Location'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await FirebaseFirestore.instance.collection('doctors').doc(widget.doctorId).update({
                'roomNumber': _roomController.text.trim(),
                'floorWing': _wingController.text.trim(),
                'locationUpdatedAt': FieldValue.serverTimestamp(),
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('✓ Room updated! Patients notified in real time.')),
              );
            },
            child: const Text('Update & Notify Patients'),
          ),
        ],
      ),
    );
  }

  void _showCompleteConsultationDialog(Map<String, dynamic> token, Map<String, dynamic> docData) {
    final medController = TextEditingController(text: 'Paracetamol 650mg, Cetirizine 10mg, Pantoprazole 40mg');
    bool sendPharmacy = true;
    String selectedPharm = 'pharm-hospital';

    final pharmacyCatalog = [
      {
        'id': 'pharm-hospital',
        'name': 'CityCare In-House Pharmacy',
        'dist': '0 km (Inside Hospital)',
        'prefix': 'PH',
        'priceUnit': 60,
        'badge': 'FASTEST (ON-SITE)',
        'color': const Color(0xFF0284C7),
      },
      {
        'id': 'pharm-janaushadhi',
        'name': 'Jan Aushadhi Generic Kendra',
        'dist': '0.8 km (4 min drive)',
        'prefix': 'JA',
        'priceUnit': 18,
        'badge': 'GENERIC 70% OFF',
        'color': const Color(0xFF7C3AED),
      },
      {
        'id': 'pharm-apollo',
        'name': 'Apollo Pharmacy — 24/7',
        'dist': '0.4 km (2 min drive)',
        'prefix': 'AP',
        'priceUnit': 65,
        'badge': '24/7 OPEN',
        'color': const Color(0xFF0369A1),
      },
      {
        'id': 'pharm-medplus',
        'name': 'MedPlus Pharmacy & Wellness',
        'dist': '1.1 km (6 min drive)',
        'prefix': 'MP',
        'priceUnit': 52,
        'badge': '15% OFF',
        'color': const Color(0xFF059669),
      },
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final medList = medController.text
              .split(',')
              .map((m) => m.trim())
              .where((m) => m.isNotEmpty)
              .toList();
          final medCount = medList.isEmpty ? 1 : medList.length;

          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Row(
              children: const [
                Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 24),
                SizedBox(width: 8),
                Text('Complete Consultation', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              ],
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Token #${token['tokenNumber']} • ${token['patientName']}',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Prescribed Medicines:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                        Text('${medList.length} items', style: const TextStyle(fontSize: 11, color: Color(0xFF0284C7), fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    TextField(
                      controller: medController,
                      maxLines: 2,
                      onChanged: (_) => setDialogState(() {}),
                      decoration: InputDecoration(
                        hintText: 'e.g. Paracetamol 650mg, Azithromycin 500mg...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.all(10),
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Quick add chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          'Paracetamol 650mg',
                          'Amoxicillin 500mg',
                          'Cetirizine 10mg',
                          'Pantoprazole 40mg',
                          'Azithromycin 500mg',
                          'Cough Syrup 100ml'
                        ].map((mName) {
                          final isIncluded = medController.text.contains(mName);
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ActionChip(
                              label: Text('+ $mName', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: isIncluded ? const Color(0xFF0369A1) : const Color(0xFF334155))),
                              backgroundColor: isIncluded ? const Color(0xFFE0F2FE) : const Color(0xFFF1F5F9),
                              onPressed: () {
                                if (!isIncluded) {
                                  setDialogState(() {
                                    final cur = medController.text.trim();
                                    medController.text = cur.isEmpty ? mName : '$cur, $mName';
                                  });
                                }
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Section 7.11: Live Nearby Pharmacy Price & Distance Comparison
                    const Text('Select Target Pharmacy (Live Price Analysis):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 6),
                    ...pharmacyCatalog.map((ph) {
                      final isSelected = selectedPharm == ph['id'];
                      final totalPrice = (ph['priceUnit'] as int) * medCount;
                      final prefix = ph['prefix'] as String;

                      return GestureDetector(
                        onTap: () => setDialogState(() => selectedPharm = ph['id'] as String),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFF0F9FF) : const Color(0xFFFFFFFF),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Radio<String>(
                                    value: ph['id'] as String,
                                    groupValue: selectedPharm,
                                    activeColor: const Color(0xFF0284C7),
                                    onChanged: (v) => setDialogState(() => selectedPharm = v ?? 'pharm-hospital'),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(ph['name'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                                      Text('📍 ${ph['dist']}', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                    ],
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('₹$totalPrice', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF0F172A))),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: (ph['color'] as Color).withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text('Token: $prefix-XX', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: ph['color'] as Color)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),

                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                      ),
                      child: Row(
                        children: [
                          Checkbox(
                            value: sendPharmacy,
                            activeColor: const Color(0xFF16A34A),
                            onChanged: (v) => setDialogState(() => sendPharmacy = v ?? true),
                          ),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('⚡ Auto Pharmacy Token & Instant Pack', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFF166534))),
                                Text('If 0 queue, automatically marks Packed & Ready for Pickup', style: TextStyle(fontSize: 10, color: Color(0xFF15803D))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  final chosen = pharmacyCatalog.firstWhere((p) => p['id'] == selectedPharm, orElse: () => pharmacyCatalog[0]);
                  final prefix = chosen['prefix'] as String;

                  String? phCode;
                  String initialPhStatus = 'ready'; // Zero queue auto-pack default

                  if (sendPharmacy && medList.isNotEmpty) {
                    final todayKey = DateTime.now().toString().split(' ')[0];
                    final phRef = FirebaseFirestore.instance.collection('pharmacy_tokens').doc();
                    final randNum = (DateTime.now().second % 15) + 1;
                    phCode = '$prefix-${randNum.toString().padLeft(2, '0')}';

                    await phRef.set({
                      'id': phRef.id,
                      'tokenCode': phCode,
                      'prefix': prefix,
                      'patientName': token['patientName'] ?? 'Patient',
                      'phoneNumber': token['phoneNumber'] ?? '',
                      'doctorId': widget.doctorId,
                      'doctorName': docData['name'] ?? 'Doctor',
                      'linkedDoctorTokenId': token['id'],
                      'medicines': medList,
                      'pharmacyId': chosen['id'],
                      'pharmacyName': chosen['name'],
                      'status': initialPhStatus,
                      'counterNumber': 'Counter 1 (Pickup Ready)',
                      'isAutoPacked': true,
                      'date': todayKey,
                      'totalEstimatedPrice': (chosen['priceUnit'] as int) * medCount,
                      'createdAt': FieldValue.serverTimestamp(),
                    });
                  }

                  await FirebaseFirestore.instance
                      .collection('doctors')
                      .doc(widget.doctorId)
                      .collection('tokens')
                      .doc(token['id'])
                      .update({
                    'status': 'completed',
                    'prescribedMedicines': medList,
                    'pharmacyTokenCode': phCode,
                    'pharmacyName': chosen['name'],
                    'pharmacyStatus': initialPhStatus,
                    'completedAt': FieldValue.serverTimestamp(),
                  });

                  _stopTimer();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: const Color(0xFF16A34A),
                        content: Text('✓ Consultation complete! Token $phCode dispatched to ${chosen['name']}. (Auto-Packed & Ready)'),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Complete & Dispatch', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Doctor OPD Console'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('doctors').snapshots(),
        builder: (context, docListSnap) {
          final doctors = (docListSnap.data?.docs ?? [])
              .map((d) => {'id': d.id, ...d.data() as Map<String, dynamic>})
              .toList();

          return StreamBuilder<DocumentSnapshot>(
            stream: FirebaseFirestore.instance.collection('doctors').doc(widget.doctorId).snapshots(),
            builder: (context, currentDocSnap) {
              final docData = currentDocSnap.data?.data() as Map<String, dynamic>? ?? {};
              final isApproved = (docData['status'] ?? 'approved') == 'approved';
              final roomNum = docData['roomNumber'] ?? 'Room 102';
              final floorWing = docData['floorWing'] ?? 'Ground Floor';

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text('Active Doctor Profile', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: widget.doctorId,
                        isExpanded: true,
                        items: doctors.map((d) {
                          final status = d['status'] ?? 'approved';
                          return DropdownMenuItem<String>(
                            value: d['id'] as String,
                            child: Text('${d['name']} (${d['department']}) [${status.toUpperCase()}]'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) widget.onSelectDoctor(val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (!isApproved)
                    Card(
                      color: const Color(0xFFFEF2F2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Color(0xFFFECACA), width: 1.5),
                      ),
                      child: const Padding(
                        padding: EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Icon(Icons.shield_outlined, color: Color(0xFFDC2626), size: 36),
                            SizedBox(height: 8),
                            Text(
                              'Medical Council KYC Pending',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF991B1B)),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Your credentials (MCI Registration) are currently under verification by Hospital Administration. Queue calling is locked.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: Color(0xFF7F1D1D), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),

                  if (isApproved) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.meeting_room, color: Color(0xFF0D9488), size: 18),
                                    const SizedBox(width: 6),
                                    Text(
                                      roomNum,
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(floorWing, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                              ],
                            ),
                            OutlinedButton.icon(
                              onPressed: () => _showRoomChangeDialog(docData),
                              icon: const Icon(Icons.edit_location_alt, size: 15),
                              label: const Text('Change Room', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('doctors')
                          .doc(widget.doctorId)
                          .collection('tokens')
                          .snapshots(),
                      builder: (context, tokenSnap) {
                        final tokens = (tokenSnap.data?.docs ?? []).map((t) {
                          return {'id': t.id, ...t.data() as Map<String, dynamic>};
                        }).toList();

                        final inProgressToken = tokens.firstWhere((t) => t['status'] == 'in-progress', orElse: () => {});
                        final waitingTokens = tokens.where((t) => t['status'] == 'waiting').toList();

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (inProgressToken.isNotEmpty) ...[
                              Builder(builder: (ctx) {
                                _startTimer(inProgressToken['id']);
                                return Card(
                                  color: const Color(0xFFF0FDF4),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: const BorderSide(color: Color(0xFFBBF7D0), width: 1.5),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              'NOW SERVING: TOKEN #${inProgressToken['tokenNumber']}',
                                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                                            ),
                                            Text(
                                              _formatTimer(_elapsedSeconds),
                                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), fontFamily: 'monospace'),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'Patient: ${inProgressToken['patientName']} (${inProgressToken['phoneNumber']})',
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                        ),
                                        const SizedBox(height: 12),
                                        SizedBox(
                                          width: double.infinity,
                                          child: ElevatedButton(
                                            onPressed: () => _showCompleteConsultationDialog(inProgressToken, docData),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF16A34A),
                                              foregroundColor: Colors.white,
                                            ),
                                            child: const Text('Mark Consultation Complete (Prescribe & Handoff)', style: TextStyle(fontWeight: FontWeight.w900)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                              const SizedBox(height: 16),
                            ],

                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Waiting Queue (${waitingTokens.length} Patients)',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF090D16)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            if (waitingTokens.isEmpty)
                              const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(24),
                                  child: Text('No waiting patients in queue.'),
                                ),
                              ),

                            ...waitingTokens.map((w) {
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: const Color(0xFFEFF6FF),
                                    child: Text('#${w['tokenNumber']}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0284C7))),
                                  ),
                                  title: Text(w['patientName'] ?? 'Patient', style: const TextStyle(fontWeight: FontWeight.w800)),
                                  subtitle: Text(w['reason'] ?? 'Routine consultation'),
                                  trailing: ElevatedButton(
                                    onPressed: () async {
                                      await FirebaseFirestore.instance
                                          .collection('doctors')
                                          .doc(widget.doctorId)
                                          .collection('tokens')
                                          .doc(w['id'])
                                          .update({'status': 'in-progress', 'calledAt': FieldValue.serverTimestamp()});
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0D9488),
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text('Call Next', style: TextStyle(fontWeight: FontWeight.w900)),
                                  ),
                                ),
                              );
                            }),
                          ],
                        );
                      },
                    ),
                  ],
                ],
              );
            },
          );
        },
      ),
    );
  }
}

// -------------------------------------------------------------
// TAB 2: DOCTOR KYC & ACCOUNT PROFILE
// -------------------------------------------------------------
class DoctorKYCAccountTab extends StatelessWidget {
  final String doctorId;
  final Map<String, dynamic> currentDoctor;
  final VoidCallback onLogout;
  final Function(String) onSelectDoctor;

  const DoctorKYCAccountTab({
    super.key,
    required this.doctorId,
    required this.currentDoctor,
    required this.onLogout,
    required this.onSelectDoctor,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clinician Credentials & KYC'),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('doctors').doc(doctorId).snapshots(),
        builder: (context, snapshot) {
          final docData = snapshot.data?.data() as Map<String, dynamic>? ?? currentDoctor;
          final name = docData['name'] ?? 'Dr. Rajesh Mehta';
          final mci = docData['councilRegistration'] ?? 'MCI-48291-DL';
          final dept = docData['department'] ?? 'General Medicine';
          final status = docData['status'] ?? 'approved';
          final isApproved = status == 'approved';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 30,
                        backgroundColor: Color(0xFF0D9488),
                        child: Icon(Icons.medical_services, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                            Text(dept, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: isApproved ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: isApproved ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA)),
                              ),
                              child: Text(
                                isApproved ? '✓ KYC APPROVED' : '⚠ KYC PENDING REVIEW',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: isApproved ? const Color(0xFF059669) : const Color(0xFFDC2626),
                                ),
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
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.badge, color: Color(0xFF0D9488)),
                      title: const Text('Medical Council Registration', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                      subtitle: Text(mci, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, fontFamily: 'monospace')),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.school, color: Color(0xFF0284C7)),
                      title: const Text('Qualifications', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                      subtitle: Text(docData['qualification'] ?? 'MBBS, MD', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.currency_rupee, color: Color(0xFF16A34A)),
                      title: const Text('Consultation Fee', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF64748B))),
                      subtitle: Text('₹${docData['consultationFee'] ?? 500}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onLogout,
                  icon: const Icon(Icons.logout, color: Color(0xFFDC2626)),
                  label: const Text('Sign Out from Doctor Console', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFDC2626))),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFFFECACA), width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
