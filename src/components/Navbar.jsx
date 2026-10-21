import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  LogIn,
  ShieldCheck,
  Pill
} from 'lucide-react';
import { seedDemoData, subscribePendingDoctors, subscribeUserHistory } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentRole, setCurrentRole, activeHospital }) {
  const { currentUser, openAuthModal } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeedSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('opd_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opd_theme', theme);
  }, [theme]);

  // Close mobile drawer when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [currentRole]);

  // Pending doctor registrations badge
  useEffect(() => {
    const unsub = subscribePendingDoctors((pendingDocs) => {
      setPendingCount(pendingDocs.length);
    });
    return () => unsub();
  }, []);

  // History count
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

  const handleNavClick = (id) => {
    setCurrentRole(id);
    setMenuOpen(false);
  };

  return (
    <header
      ref={drawerRef}
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--card-shadow)'
      }}
    >
      {/* ── Main Navbar Row ── */}
      <div
        className="navbar-inner"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          position: 'relative'
        }}
      >
        {/* ── Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
            flexShrink: 0
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                Medi<span style={{ color: '#0284c7' }}>Q</span>
              </h1>
              <span className="badge badge-in-progress" style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}>
                <span className="pulse-dot" style={{ background: '#10b981' }}></span> Live
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0.05rem 0 0', whiteSpace: 'nowrap' }}>
              OPD Discovery &amp; Live Queue
            </p>
          </div>
        </div>

        {/* ── Desktop Navigation ── */}
        <nav
          className="desktop-nav"
          style={{
            alignItems: 'center',
            background: 'var(--bg-inner)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: '0.25rem',
            overflowX: 'auto',
            flex: 1,
            maxWidth: '780px'
          }}
        >
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
                  gap: '0.4rem',
                  padding: '0.48rem 0.85rem',
                  borderRadius: '9px',
                  fontSize: '0.83rem',
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
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '0.08rem 0.35rem',
                    borderRadius: '1rem',
                    marginLeft: '0.15rem'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div
          className="navbar-actions"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}
        >
          {/* Active Hospital Chip */}
          {activeHospital && (
            <button
              onClick={() => setCurrentRole('hospitals')}
              style={{
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                padding: '0.35rem 0.65rem',
                borderRadius: '2rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#1e40af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                flexShrink: 0
              }}
              title="Click to switch hospital"
            >
              <span>🏥</span>
              <span
                className="hospital-chip-label"
                style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {activeHospital.name}
              </span>
              <span style={{ color: '#0284c7', fontSize: '0.68rem' }}>[Change]</span>
            </button>
          )}

          {/* Google Sign In / Account */}
          {currentUser ? (
            <button
              onClick={() => setCurrentRole('account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.65rem 0.3rem 0.35rem',
                borderRadius: '2rem',
                border: '1.5px solid #cbd5e1',
                background: currentRole === 'account' ? '#e0f2fe' : 'var(--bg-surface)',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s'
              }}
              title="Open My Account"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 900,
                flexShrink: 0
              }}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div className="action-label" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.displayName?.split(' ')[0] || 'Account'}
                </div>
                <div className="action-label" style={{ fontSize: '0.62rem', color: '#0284c7', fontWeight: 800, textTransform: 'capitalize' }}>
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
                gap: '0.4rem',
                padding: '0.42rem 0.75rem',
                borderRadius: '2rem',
                border: '1.5px solid #cbd5e1',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                flexShrink: 0
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span className="action-label">Sign In</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '0.42rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 800 }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? (
              <><Moon size={14} color="#0284c7" /><span className="action-label">Dark</span></>
            ) : (
              <><Sun size={14} color="#f59e0b" /><span className="action-label">Light</span></>
            )}
          </button>

          {/* Seed Data */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn btn-secondary"
            style={{
              padding: '0.42rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              borderColor: seeded ? 'var(--accent-emerald)' : 'var(--border-subtle)',
              color: seeded ? 'var(--accent-emerald)' : 'var(--text-secondary)'
            }}
            title="Populate doctors, tokens, reviews and history"
          >
            {seeded ? (
              <><CheckCircle2 size={14} color="#10b981" /><span className="action-label">Ready!</span></>
            ) : (
              <><Sparkles size={14} color="var(--accent-cyan)" /><span className="action-label">{seeding ? '...' : 'Seed'}</span></>
            )}
          </button>

          {/* ── Hamburger (mobile only) ── */}
          <button
            className={`nav-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="nav-hamburger-bar" />
            <span className="nav-hamburger-bar" />
            <span className="nav-hamburger-bar" />
          </button>
        </div>
      </div>

      {/* ── Mobile Nav Drawer ── */}
      <div className={`mobile-nav-drawer${menuOpen ? ' open' : ''}`}>
        {/* Section label */}
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 900,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0.25rem 0.5rem 0.1rem'
        }}>
          Navigate
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRole === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item${isActive ? ' active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.3rem 0' }} />

        {/* Quick actions inside drawer */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem 0.25rem 0.5rem' }}>
          <button
            onClick={() => { openAuthModal(currentRole); setMenuOpen(false); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              background: 'var(--bg-inner)',
              color: 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <LogIn size={14} />
            Login / Switch
          </button>
          <button
            onClick={() => toggleTheme()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--bg-inner)',
              color: 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? <Moon size={14} color="#0284c7" /> : <Sun size={14} color="#f59e0b" />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>
    </header>
  );
}
