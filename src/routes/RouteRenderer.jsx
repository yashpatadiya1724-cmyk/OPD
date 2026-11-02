import React, { lazy, Suspense } from 'react';
import { useRouter } from './RouterContext.jsx';
import { ROUTES } from './routeConstants.js';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import NotFoundView from './NotFoundView.jsx';

// ── Lazy-loaded Route Components for Code-Splitting (Ponytail Senior Architecture) ──
const HospitalDirectory = lazy(() => import('../components/HospitalDirectory.jsx'));
const PatientView = lazy(() => import('../components/PatientView.jsx'));
const HistoryView = lazy(() => import('../components/HistoryView.jsx'));
const AccountView = lazy(() => import('../components/AccountView.jsx'));
const DoctorDashboard = lazy(() => import('../components/DoctorDashboard.jsx'));
const DoctorAuthKYC = lazy(() => import('../components/DoctorAuthKYC.jsx'));
const ReceptionDashboard = lazy(() => import('../components/ReceptionDashboard.jsx'));
const PublicDisplay = lazy(() => import('../components/PublicDisplay.jsx'));
const AdminAnalytics = lazy(() => import('../components/AdminAnalytics.jsx'));
const PharmacyConsole = lazy(() => import('../components/PharmacyConsole.jsx'));
const SuperAdminPanel = lazy(() => import('../components/SuperAdminPanel.jsx'));
const ProjectShowcase = lazy(() => import('../components/ProjectShowcase.jsx'));
const PrescriptionOCRView = lazy(() => import('../components/PrescriptionOCRView.jsx'));
const ABDMHealthLockerView = lazy(() => import('../components/ABDMHealthLockerView.jsx'));
const ScheduledRiderDeliveryView = lazy(() => import('../components/ScheduledRiderDeliveryView.jsx'));

/**
 * Lightweight, zero-dependency pulsing skeleton loader during route lazy fetch.
 */
function ViewSkeletonLoader({ title = 'MediQ Surface' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      gap: '1.25rem',
      color: 'var(--text-secondary, #64748B)',
      textAlign: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        border: '3.5px solid rgba(2, 132, 199, 0.15)',
        borderTopColor: '#0284C7',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
      <div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary, #0F172A)' }}>
          Loading {title}...
        </p>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94A3B8)' }}>
          MediQ Smart OPD Network &bull; SOCCA-12
        </span>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * RouteRenderer Component
 * Dynamically resolves and renders the active surface component based on the central route registry.
 * Employs native React.lazy() code-splitting and ErrorBoundary fault isolation.
 */
export default function RouteRenderer({
  activeHospital,
  setActiveHospital,
  doctorSubView,
  setDoctorSubView,
  loggedInDoctor,
  setLoggedInDoctor,
  onOrderFulfillment,
}) {
  const { currentRouteId, navigate } = useRouter();

  const renderActiveView = () => {
    switch (currentRouteId) {
      // 1. Hospital Directory
      case ROUTES.HOSPITALS:
        return (
          <HospitalDirectory
            activeHospitalId={activeHospital?.id}
            onSelectHospital={(hosp) => {
              setActiveHospital(hosp);
              navigate(ROUTES.PATIENT);
            }}
            onNavigateToRole={(role) => navigate(role)}
          />
        );

      // 2. Patient Live Queue
      case ROUTES.PATIENT:
        return (
          <PatientView
            activeHospital={activeHospital}
            onSwitchToHospitals={() => navigate(ROUTES.HOSPITALS)}
          />
        );

      // 3. Visit History & Slips
      case ROUTES.HISTORY:
        return (
          <HistoryView
            onBookNewToken={() => navigate(ROUTES.PATIENT)}
          />
        );

      // 4. Clinical Account & Profile
      case ROUTES.ACCOUNT:
        return (
          <AccountView
            onNavigateToHistory={() => navigate(ROUTES.HISTORY)}
            onNavigateToRole={(role) => navigate(role)}
          />
        );

      // 5. Doctor Console & KYC Auth
      case ROUTES.DOCTOR:
        return (
          <div>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '1rem 1.5rem 0',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
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
                  boxShadow: doctorSubView === 'console' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
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
                  boxShadow: doctorSubView === 'kyc' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
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
        );

      // 6. Pharmacy Console
      case ROUTES.PHARMACY:
        return <PharmacyConsole />;

      // 7. Reception Desk
      case ROUTES.RECEPTION:
        return <ReceptionDashboard />;

      // 8. Public TV Display
      case ROUTES.TV:
        return <PublicDisplay onExit={() => navigate(ROUTES.HOSPITALS)} />;

      // 9. Hospital Admin Analytics
      case ROUTES.ADMIN:
        return <AdminAnalytics />;

      // 10. Platform Super Admin
      case ROUTES.SUPER_ADMIN:
        return <SuperAdminPanel />;

      // 11. Project Exhibition (SOCCA-12)
      case ROUTES.OVERVIEW:
        return <ProjectShowcase onNavigateToRole={(role) => navigate(role)} />;

      // 12. Prescription OCR AI
      case ROUTES.OCR:
        return (
          <PrescriptionOCRView
            onOrderFulfillment={(orderData) => {
              if (onOrderFulfillment) onOrderFulfillment(orderData);
            }}
            onOpenAbdmLocker={() => navigate(ROUTES.ABDM)}
          />
        );

      // 13. ABDM & ABHA Locker
      case ROUTES.ABDM:
        return <ABDMHealthLockerView />;

      // 14. Scheduled Rider Delivery & EV Fleet
      case ROUTES.FULFILLMENT:
        return (
          <ScheduledRiderDeliveryView
            defaultTab="patient_order"
            onBackToDirectory={() => navigate(ROUTES.HOSPITALS)}
          />
        );

      // 15. Rider Console
      case ROUTES.RIDER:
        return (
          <ScheduledRiderDeliveryView
            defaultTab="rider_terminal"
            onBackToDirectory={() => navigate(ROUTES.HOSPITALS)}
          />
        );

      // 404 Not Found fallback
      default:
        return (
          <NotFoundView
            requestedPath={currentRouteId}
            onNavigateHome={() => navigate(ROUTES.HOSPITALS)}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<ViewSkeletonLoader />}>
        {renderActiveView()}
      </Suspense>
    </ErrorBoundary>
  );
}
