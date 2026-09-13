import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  Stethoscope, 
  Tv, 
  BarChart3, 
  ClipboardList, 
  Sparkles,
  CheckCircle2, 
  Sun, 
  Moon, 
  Building2, 
  ShieldAlert,
  Clock,
  LogIn,
  ShieldCheck,
  Pill
} from 'lucide-react';
import { seedDemoData, subscribePendingDoctors, subscribeUserHistory } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentRole, setCurrentRole, activeHospital }) {
  const { currentUser, openAuthModal, logout } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeedSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  // Theme state: default to 'light' as requested by user
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('opd_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opd_theme', theme);
  }, [theme]);

  // Subscribe to pending doctor registrations for badge counter
  useEffect(() => {
    const unsub = subscribePendingDoctors((pendingDocs) => {
      setPendingCount(pendingDocs.length);
    });
    return () => unsub();
  }, []);

  // Subscribe to history count
  useEffect(() => {
    const unsub = subscribeUserHistory((items) => {
      setHistoryCount(items.length);
    });
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error('Seeding error:', err);
      alert('Failed to seed demo data. Check Firebase connectivity: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const navItems = [
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'patient', label: 'Patient View', icon: User },
    { id: 'history', label: 'OPD History', icon: Clock, badge: historyCount },
    { id: 'doctor', label: 'Doctor Portal', icon: Stethoscope },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'reception', label: 'Reception Desk', icon: ClipboardList },
    { id: 'tv', label: 'Waiting TV', icon: Tv },
    { id: 'admin', label: 'Admin & Approvals', icon: BarChart3, badge: pendingCount },
    { id: 'account', label: 'My Account', icon: ShieldCheck }
  ];

  return (
    <header style={{
      background: 'var(--header-bg)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--card-shadow)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
          }}>
            <Activity size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                Medi<span style={{ color: '#0284c7' }}>Q</span>
              </h1>
              <span className="badge badge-in-progress" style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}>
                <span className="pulse-dot" style={{ background: '#10b981' }}></span> Live Marketplace
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
              The Multi-Hospital OPD Discovery &amp; Live Queue Platform
            </p>
          </div>
        </div>

        {/* Role Navigation Switcher */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-inner)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          gap: '0.3rem',
          overflowX: 'auto'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRole === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentRole(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '1rem',
                    marginLeft: '0.2rem'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action: Active Hospital + Google Sign In / Account + Theme + Seed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          {activeHospital && (
            <button
              onClick={() => setCurrentRole('hospitals')}
              style={{
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                padding: '0.4rem 0.75rem',
                borderRadius: '2rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#1e40af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Click to switch hospital"
            >
              <span>🏥</span>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeHospital.name}
              </span>
              <span style={{ color: '#0284c7', fontSize: '0.7rem' }}>[Change]</span>
            </button>
          )}

          {/* USER ACCOUNT / GOOGLE AUTH BUTTON */}
          {currentUser ? (
            <button
              onClick={() => setCurrentRole('account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem 0.35rem 0.45rem',
                borderRadius: '2rem',
                border: '1.5px solid #cbd5e1',
                background: currentRole === 'account' ? '#e0f2fe' : '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s'
              }}
              title="Open My Account"
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#090d16', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.displayName?.split(' ')[0] || 'Account'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 800, textTransform: 'capitalize' }}>
                  {currentUser.role}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal(currentRole)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '2rem',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#090d16',
                fontSize: '0.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign In</span>
            </button>
          )}

          {/* Quick Login / Switch Role Modal Trigger */}
          <button
            onClick={() => openAuthModal(currentRole)}
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
            title="Switch User / Continue with Google"
          >
            <LogIn size={13} />
            <span>Login / Switch</span>
          </button>
          
          {/* THEME TOGGLE (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 800
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? (
              <>
                <Moon size={15} color="#0284c7" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={15} color="#f59e0b" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* DEMO SEEDER BUTTON */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderColor: seeded ? 'var(--accent-emerald)' : 'var(--border-subtle)',
              color: seeded ? 'var(--accent-emerald)' : 'var(--text-secondary)'
            }}
            title="Populate doctors, tokens, reviews and history"
          >
            {seeded ? (
              <>
                <CheckCircle2 size={15} color="#10b981" />
                <span>Ready!</span>
              </>
            ) : (
              <>
                <Sparkles size={15} color="var(--accent-cyan)" />
                <span>{seeding ? '...' : 'Seed Data'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
