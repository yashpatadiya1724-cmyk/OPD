import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
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
import AuthModal from './components/AuthModal';

function AppContent() {
  const { isAuthModalOpen, closeAuthModal, authModalRole, currentUser } = useAuth();

  const [currentRole, setCurrentRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (['hospitals', 'patient', 'doctor', 'pharmacy', 'reception', 'tv', 'admin', 'history', 'account'].includes(roleParam)) {
        return roleParam;
      }
    }
    return 'hospitals'; // Default landing on Zomato Hospital Discovery
  });

  const [activeHospital, setActiveHospital] = useState({
    id: 'citycare-central',
    name: 'CityCare Central Hospital'
  });

  // Doctor view sub-tab
  const [doctorSubView, setDoctorSubView] = useState('console'); // 'console' | 'kyc'
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);

  useEffect(() => {
    // Update document title dynamically based on active view
    const titles = {
      hospitals: 'Discover Top Hospitals & OPD Queues | MediQ Marketplace',
      patient: 'Patient OPD Live Token & Slot Tracker | MediQ',
      history: 'My OPD Visit & Booking History | MediQ',
      account: 'My Account & Clinical Profile | MediQ',
      doctor: 'Doctor Consultation Console & KYC Portal | MediQ',
      pharmacy: 'Hospital Pharmacy Dispense Counter & Prices | MediQ',
      reception: 'Hospital Reception Queue Desk | MediQ',
      tv: 'Waiting-Room Live Token TV Display | MediQ',
      admin: 'Hospital & Super Admin Portal | MediQ'
    };
    document.title = titles[currentRole] || 'MediQ — The OPD Marketplace';
  }, [currentRole]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole}
        activeHospital={activeHospital}
      />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
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

        {/* VIEW 6: PHARMACY CONSOLE & COMPARISON (Section 7.10 & 7.11) */}
        {currentRole === 'pharmacy' && <PharmacyConsole />}

        {/* VIEW 7: RECEPTION */}
        {currentRole === 'reception' && <ReceptionDashboard />}

        {/* VIEW 8: WAITING TV */}
        {currentRole === 'tv' && <PublicDisplay />}

        {/* VIEW 9: ADMIN ANALYTICS & KYC APPROVALS */}
        {currentRole === 'admin' && <AdminAnalytics />}
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

      <footer style={{
        textAlign: 'center',
        padding: '1.25rem',
        fontSize: '0.8rem',
        color: '#64748b',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        fontWeight: 700
      }}>
        MediQ Marketplace &bull; Multi-Hospital OPD Discovery, Booking &amp; Live Queue Platform &bull; Powered by Google Firebase &amp; Cloud Functions
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
