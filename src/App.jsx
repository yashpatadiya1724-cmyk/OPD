import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './routes/RouterContext.jsx';
import { ROUTES } from './routes/routeConstants.js';
import RouteGuard from './routes/RouteGuard.jsx';
import RouteRenderer from './routes/RouteRenderer.jsx';
import AdminSidebar from './components/AdminSidebar';
import AdminTopBar from './components/AdminTopBar';
import BlinkitFulfillmentModal from './components/BlinkitFulfillmentModal';
import AuthModal from './components/AuthModal';
import PublicDisplay from './components/PublicDisplay';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isAuthModalOpen, closeAuthModal, authModalRole, currentUser } = useAuth();
  const { currentRoute, currentRouteId, navigate } = useRouter();

  const [activeHospital, setActiveHospital] = useState({
    id: 'citycare-central',
    name: 'CityCare Central Hospital',
  });

  const [doctorSubView, setDoctorSubView] = useState('console');
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showDirectFulfillmentModal, setShowDirectFulfillmentModal] = useState(false);
  const [activeFulfillmentOrder, setActiveFulfillmentOrder] = useState(null);

  // Handle login success callback
  const handleLoginSuccess = (user, role) => {
    const roleRouteMap = {
      doctor: ROUTES.DOCTOR,
      reception: ROUTES.RECEPTION,
      pharmacy: ROUTES.PHARMACY,
      admin: ROUTES.ADMIN,
      super_admin: ROUTES.SUPER_ADMIN,
      senior: ROUTES.PATIENT,
      patient: ROUTES.PATIENT,
      rider: ROUTES.RIDER,
    };
    navigate(roleRouteMap[role] || ROUTES.HOSPITALS);
  };

  // Surface 5 (Waiting Room TV) zero-login standalone mode
  if (currentRouteId === ROUTES.TV) {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16' }}>
        <PublicDisplay onExit={() => navigate(ROUTES.HOSPITALS)} />
      </div>
    );
  }

  return (
    <RouteGuard
      route={currentRoute}
      currentUser={currentUser}
      onLoginSuccess={handleLoginSuccess}
      onNavigateHome={() => navigate(ROUTES.HOSPITALS)}
    >
      <div className="mediq-app-container">
        {/* Desktop Sidebar (Pribite Executive Style) */}
        <div className="mediq-sidebar-desktop">
          <AdminSidebar
            currentRole={currentRouteId}
            setCurrentRole={navigate}
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
                currentRole={currentRouteId}
                setCurrentRole={navigate}
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
            currentRole={currentRouteId}
            setCurrentRole={navigate}
            activeHospital={activeHospital}
            onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          />

          <main className="mediq-main-content">
            <RouteRenderer
              activeHospital={activeHospital}
              setActiveHospital={setActiveHospital}
              doctorSubView={doctorSubView}
              setDoctorSubView={setDoctorSubView}
              loggedInDoctor={loggedInDoctor}
              setLoggedInDoctor={setLoggedInDoctor}
              onOrderFulfillment={(orderData) => {
                setActiveFulfillmentOrder(orderData);
                setShowDirectFulfillmentModal(true);
              }}
            />
          </main>

          {/* Global Auth Modal */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={closeAuthModal}
            initialRole={authModalRole}
            onLoginSuccess={(user, role) => {
              if (role) navigate(role);
            }}
          />

          {/* Global Scheduled EV Rider Fulfillment Modal */}
          <BlinkitFulfillmentModal
            isOpen={showDirectFulfillmentModal}
            onClose={() => setShowDirectFulfillmentModal(false)}
            initialMedicines={activeFulfillmentOrder?.medicines || ['Human Actrapid Insulin 40IU', 'Paracetamol 650mg', 'Amoxicillin 500mg']}
            initialMode={activeFulfillmentOrder?.mode || 'express_rider'}
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
    </RouteGuard>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
