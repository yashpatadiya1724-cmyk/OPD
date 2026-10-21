import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminSidebar from './components/AdminSidebar';
import AdminTopBar from './components/AdminTopBar';
import HospitalDirectory from './components/HospitalDirectory';
import PatientView from './components/PatientView';
import HistoryView from './components/HistoryView';
import AccountView from './components/AccountView';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorAuthKYC from './components/DoctorAuthKYC';
import ReceptionDashboard from './components/ReceptionDashboard';
import PublicDisplay from './components/PublicDisplay';
import AdminAnalytics from './components/AdminAnalytics';
import PharmacyConsole from './components/PharmacyConsole';
import SuperAdminPanel from './components/SuperAdminPanel';
import ProjectShowcase from './components/ProjectShowcase';
import PrescriptionOCRView from './components/PrescriptionOCRView';
import ABDMHealthLockerView from './components/ABDMHealthLockerView';
import BlinkitFulfillmentModal from './components/BlinkitFulfillmentModal';
import AuthModal from './components/AuthModal';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isAuthModalOpen, closeAuthModal, authModalRole, currentUser } = useAuth();

  const [currentRole, setCurrentRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (['hospitals', 'patient', 'doctor', 'pharmacy', 'reception', 'tv', 'admin', 'super_admin', 'history', 'account', 'overview', 'ocr', 'abdm', 'fulfillment'].includes(roleParam)) {
        return roleParam;
      }
    }
    return 'hospitals';
  });

  const [activeHospital, setActiveHospital] = useState({
    id: 'citycare-central',
    name: 'CityCare Central Hospital'
  });

  const [doctorSubView, setDoctorSubView] = useState('console');
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showDirectFulfillmentModal, setShowDirectFulfillmentModal] = useState(false);
  const [activeFulfillmentOrder, setActiveFulfillmentOrder] = useState(null);

  // Hook 1: Synchronize document title — MUST be called at top level before any early return!
  useEffect(() => {
    const titles = {
      overview: 'MediQ – Smart OPD Queue & Pharmacy Fulfilment System | Project SOCCA-12',
      hospitals: 'Discover Top Hospitals & OPD Queues | MediQ Marketplace',
      patient: 'Patient OPD Live Token & Slot Tracker | MediQ',
      history: 'My OPD Visit & Booking History | MediQ',
      account: 'My Account & Clinical Profile | MediQ',
      doctor: 'Doctor Consultation Console & KYC Portal | MediQ',
      pharmacy: 'Hospital Pharmacy Dispense Counter & Prices | MediQ',
      reception: 'Hospital Reception Queue Desk | MediQ',
      tv: 'Waiting-Room Live Token TV Display | MediQ',
      admin: 'Hospital Console & Analytics | MediQ',
      super_admin: 'Platform Super Admin & Settlement Ledger | MediQ',
      ocr: 'Handwritten Prescription OCR & AI Vision | MediQ',
      abdm: 'Ayushman Bharat ABHA Card & Health Locker | MediQ',
      fulfillment: 'Blinkit Dark-Store & Drone Dispatch | MediQ'
    };
    if (typeof document !== 'undefined') {
      document.title = titles[currentRole] || 'MediQ – Smart OPD Queue & Pharmacy Fulfilment System';
    }
  }, [currentRole]);

  // Handle login from LoginPage — route cleanly to appropriate view
  const handleLoginSuccess = (user, role) => {
    if (role === 'doctor') {
      setCurrentRole('doctor');
    } else if (role === 'reception') {
      setCurrentRole('reception');
    } else if (role === 'pharmacy') {
      setCurrentRole('pharmacy');
    } else if (role === 'admin') {
      setCurrentRole('admin');
    } else if (role === 'super_admin') {
      setCurrentRole('super_admin');
    } else if (role === 'senior' || role === 'patient') {
      setCurrentRole('patient');
    } else {
      setCurrentRole('hospitals');
    }
  };

  // Surface 5 (Waiting Room TV) must work with zero login ("TV, bina login" requirement)
  if (currentRole === 'tv') {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16' }}>
        <PublicDisplay onExit={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('role');
            window.history.replaceState({}, '', url.pathname);
          }
          setCurrentRole('hospitals');
        }} />
      </div>
    );
  }

  // Show Login Page if no user is signed in and not accessing public TV
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="mediq-app-container">
      {/* Desktop Sidebar (Pribite Executive Style) */}
      <div className="mediq-sidebar-desktop">
        <AdminSidebar 
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      </div>

      {/* Mobile Drawer (Pribite-Style Overlay) */}
      {mobileDrawerOpen && (
        <div 
          className="mediq-drawer-overlay"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div 
            className="mediq-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar 
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
              isCollapsed={false}
              setIsCollapsed={() => {}}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              isMobileDrawer={true}
            />
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="mediq-main-layout">
        <AdminTopBar 
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          activeHospital={activeHospital}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="mediq-main-content">
        {/* VIEW 1: ZOMATO-STYLE HOSPITAL DIRECTORY */}
        {currentRole === 'hospitals' && (
          <HospitalDirectory 
            activeHospitalId={activeHospital?.id}
            onSelectHospital={(hosp) => {
              setActiveHospital(hosp);
              setCurrentRole('patient');
            }}
          />
        )}

        {/* VIEW 2: PATIENT VIEW */}
        {currentRole === 'patient' && (
          <PatientView 
            activeHospital={activeHospital}
            onSwitchToHospitals={() => setCurrentRole('hospitals')}
          />
        )}

        {/* VIEW 3: OPD HISTORY & DIGITAL SLIPS */}
        {currentRole === 'history' && (
          <HistoryView 
            onBookNewToken={() => setCurrentRole('patient')}
          />
        )}

        {/* VIEW 4: USER ACCOUNT & PROFILE */}
        {currentRole === 'account' && (
          <AccountView 
            onNavigateToHistory={() => setCurrentRole('history')}
            onNavigateToRole={(role) => setCurrentRole(role)}
          />
        )}

        {/* VIEW 5: DOCTOR CONSOLE & KYC AUTH */}
        {currentRole === 'doctor' && (
          <div>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setDoctorSubView('console')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.6rem',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: doctorSubView === 'console' ? '#0284c7' : '#f1f5f9',
                  color: doctorSubView === 'console' ? '#ffffff' : '#475569',
                  boxShadow: doctorSubView === 'console' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                }}
              >
                👨‍⚕️ Consultation Console (Call Next / Move Room)
              </button>
              <button
                onClick={() => setDoctorSubView('kyc')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.6rem',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  background: doctorSubView === 'kyc' ? '#0284c7' : '#f1f5f9',
                  color: doctorSubView === 'kyc' ? '#ffffff' : '#475569',
                  boxShadow: doctorSubView === 'kyc' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                }}
              >
                📝 Register Doctor &amp; Medical Council KYC
              </button>
            </div>

            {doctorSubView === 'console' ? (
              <DoctorDashboard />
            ) : (
              <DoctorAuthKYC 
                onDoctorLogin={(doc) => {
                  setLoggedInDoctor(doc);
                  setDoctorSubView('console');
                }}
                currentLoggedInDoctor={loggedInDoctor}
                onLogout={() => setLoggedInDoctor(null)}
              />
            )}
          </div>
        )}

        {/* VIEW 6: PHARMACY CONSOLE */}
        {currentRole === 'pharmacy' && <PharmacyConsole />}

        {/* VIEW 7: RECEPTION (FRONT DESK) */}
        {currentRole === 'reception' && <ReceptionDashboard />}

        {/* VIEW 8: WAITING TV DISPLAY */}
        {currentRole === 'tv' && <PublicDisplay />}

        {/* VIEW 9: HOSPITAL ADMIN ANALYTICS */}
        {currentRole === 'admin' && <AdminAnalytics />}

        {/* VIEW 10: PLATFORM SUPER ADMIN (SURFACE 7) */}
        {currentRole === 'super_admin' && <SuperAdminPanel />}

        {/* VIEW 11: PROJECT SHOWCASE & POSTER METHODOLOGY (SOCCA-12) */}
        {currentRole === 'overview' && (
          <ProjectShowcase onNavigateToRole={(role) => setCurrentRole(role)} />
        )}

        {/* VIEW 12: HANDWRITTEN PRESCRIPTION OCR & AI DIGITIZER (POSTER ITEM 2) */}
        {currentRole === 'ocr' && (
          <PrescriptionOCRView 
            onOrderFulfillment={(orderData) => {
              setActiveFulfillmentOrder(orderData);
              setShowDirectFulfillmentModal(true);
            }}
            onOpenAbdmLocker={() => setCurrentRole('abdm')}
          />
        )}

        {/* VIEW 13: AYUSHMAN BHARAT ABHA & HEALTH LOCKER (POSTER ITEM 1) */}
        {currentRole === 'abdm' && (
          <ABDMHealthLockerView />
        )}

        {/* VIEW 14: BLINKIT MICRO-FULFILLMENT & DRONE DISPATCH (POSTER ITEM 3) */}
        {currentRole === 'fulfillment' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)'
              }}>
                <span style={{ fontSize: '2rem' }}>🚁</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Blinkit Dark-Store &amp; Autonomous Drone Dispatch Hub
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '640px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Instant hyper-local delivery for prescription orders in 10 minutes or emergency cold-chain aerial drop for insulin and vaccines with ACID stock deductions.
              </p>
              <button
                onClick={() => setShowDirectFulfillmentModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(5, 150, 105, 0.4)'
                }}
              >
                Launch Live Drone &amp; Dark-Store Dispatch Tracker
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialRole={authModalRole}
        onLoginSuccess={(user, role) => {
          if (role) setCurrentRole(role);
        }}
      />

      {/* Global Blinkit & Drone Delivery Modal */}
      <BlinkitFulfillmentModal
        isOpen={showDirectFulfillmentModal}
        onClose={() => setShowDirectFulfillmentModal(false)}
        initialMedicines={activeFulfillmentOrder?.medicines || ['Human Actrapid Insulin 40IU', 'Paracetamol 650mg', 'Amoxicillin 500mg']}
        initialMode={activeFulfillmentOrder?.mode || 'drone'}
        doctorName={activeFulfillmentOrder?.doctorName || 'Dr. Rajesh Mehta'}
        patientName={currentUser?.displayName || 'Ravi Kumar Patel'}
      />

        <footer style={{
          textAlign: 'center',
          padding: '1.25rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          fontWeight: 700
        }}>
          MediQ – Smart OPD Queue &amp; Pharmacy Fulfilment System &bull; Project Code: SOCCA - 12 &bull; Silver Oak University (NAAC A+) &bull; Yash Patadiya, Riya Dhariwal, Prajapati Riddhi &bull; Mentor: prof. Yash Khatri
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
