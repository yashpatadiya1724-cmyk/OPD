import React from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  ExternalLink,
  Search,
  Bell,
  Activity,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RAZORPAY_CONFIG } from '../firebase';

export default function AdminTopBar({ 
  currentRole, 
  setCurrentRole, 
  activeHospital, 
  onOpenMobileDrawer 
}) {
  const { currentUser } = useAuth();

  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('opd_theme') || 'light';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opd_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const roleTitles = {
    hospitals: { section: 'Marketplace', title: 'Hospitals & Clinic Directory' },
    patient: { section: 'Clinical Operations', title: 'Patient Live Queue & Token Booking' },
    history: { section: 'Patient Records', title: 'My OPD Visits & Digital Prescriptions' },
    doctor: { section: 'Clinical Console', title: 'Doctor Consultation & Triage Room' },
    pharmacy: { section: 'Facility Operations', title: 'Hospital Pharmacy & Generic Substitution' },
    reception: { section: 'Front Desk', title: 'Reception Desk & Walk-in Token Issue' },
    tv: { section: 'Waiting Area', title: 'Waiting Room Live TV Display' },
    admin: { section: 'Governance', title: 'Hospital Analytics & Doctor KYC Approvals' },
    super_admin: { section: 'Platform Admin', title: 'Super Admin Console & Multi-Hospital Ledgers' },
    account: { section: 'Profile & Security', title: 'My Clinical Account & ABDM Profile' },
    overview: { section: 'Project Exhibition', title: 'MediQ Poster & 5-Step Methodology (SOCCA-12)' },
    ocr: { section: 'AI Vision & Diagnostics', title: 'Handwritten Prescription OCR & Generic Optimizer' },
    abdm: { section: 'National Health Mission', title: 'Ayushman Bharat ABHA Card & Health Locker' },
    fulfillment: { section: 'Doorstep Fulfillment', title: 'Scheduled Rider Delivery & EV Fleet Tracking' },
    rider: { section: 'Rider Operations', title: 'MediQ Rider Console & Doorstep OTP Terminal' }
  };

  const currentInfo = roleTitles[currentRole] || { section: 'MediQ', title: 'Healthcare Management' };

  return (
    <header style={{
      height: '68px',
      background: 'var(--header-bg)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      gap: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      {/* ── Left: Mobile Hamburger & Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileDrawer}
          className="admin-mobile-menu-btn"
          style={{
            background: 'var(--bg-inner)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9px',
            color: 'var(--text-primary)',
            padding: '0.45rem',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Title */}
        <div style={{ minWidth: 0 }}>
          <div style={{ 
            fontSize: '0.68rem', 
            fontWeight: 800, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em' 
          }}>
            {currentInfo.section}
          </div>
          <h2 style={{ 
            fontSize: '1.05rem', 
            fontWeight: 900, 
            color: 'var(--text-primary)', 
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentInfo.title}
          </h2>
        </div>
      </div>

      {/* ── Right: Status Badges, Hospital Selector & Theme ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        
        {/* Active Hospital Pill */}
        {activeHospital && (
          <button
            onClick={() => setCurrentRole('hospitals')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.75rem',
              borderRadius: '2rem',
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1.5px solid rgba(2, 132, 199, 0.35)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Active Hospital (Click to switch)"
          >
            <Building2 size={14} color="#0284C7" />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeHospital.name}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#0284C7' }}>[Switch]</span>
          </button>
        )}

        {/* SOCCA-12 Official Project Poster Shortcut */}
        <button
          onClick={() => setCurrentRole('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '2rem',
            background: currentRole === 'overview' ? '#0284c7' : 'rgba(2, 132, 199, 0.1)',
            border: '1.5px solid #0284c7',
            color: currentRole === 'overview' ? '#ffffff' : '#0284c7',
            fontSize: '0.72rem',
            fontWeight: 900,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="View Official Project Poster & Research (SOCCA-12)"
        >
          <Sparkles size={13} />
          <span>SOCCA-12 Poster</span>
        </button>

        {/* Live Firebase Sync Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.65rem',
          borderRadius: '2rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#059669',
          fontSize: '0.72rem',
          fontWeight: 800
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 6px #10B981'
          }} />
          <span className="hide-on-mobile">Live Firebase</span>
        </div>

        {/* Razorpay Test Key Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '2rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            color: '#B45309',
            fontSize: '0.72rem',
            fontWeight: 800
          }}
          title={`Razorpay Test Key: ${RAZORPAY_CONFIG.keyId}`}
        >
          <CreditCard size={13} color="#D4AF37" />
          <span className="hide-on-mobile">Razorpay Active</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-inner)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
        >
          {theme === 'light' ? <Moon size={16} color="#0284C7" /> : <Sun size={16} color="#F59E0B" />}
        </button>

        {/* User Profile Pill */}
        {currentUser && (
          <button
            onClick={() => setCurrentRole('account')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.28rem 0.65rem 0.28rem 0.35rem',
              borderRadius: '2rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              cursor: 'pointer'
            }}
            title="My Clinical Account"
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#0284C7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 900
            }}>
              {currentUser.displayName?.charAt(0) || 'U'}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }} className="hide-on-mobile">
              {currentUser.displayName?.split(' ')[0] || 'User'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
