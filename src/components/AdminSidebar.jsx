import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Clock, 
  Stethoscope, 
  Pill, 
  ClipboardList, 
  Tv, 
  BarChart3, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle,
  HelpCircle,
  ExternalLink,
  Scan,
  Plane,
  Bike,
  FileText
} from 'lucide-react';
import { seedDemoData, subscribePendingDoctors, subscribeUserHistory } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar({ 
  currentRole, 
  setCurrentRole, 
  isCollapsed, 
  setIsCollapsed,
  onCloseMobileDrawer,
  isMobileDrawer = false 
}) {
  const { currentUser, logout, openAuthModal } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeedSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const unsub = subscribePendingDoctors((pendingDocs) => {
      setPendingCount(pendingDocs.length);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeUserHistory((items) => {
      setHistoryCount(items.length);
    });
    return () => unsub();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error('Seeding error:', err);
      alert('Failed to seed demo data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const navGroups = [
    {
      group: 'CLINICAL OPERATIONS',
      items: [
        { id: 'hospitals', label: 'Hospital Directory', icon: Building2 },
        { id: 'patient', label: 'Patient Queue & Tokens', icon: User },
        { id: 'history', label: 'My Visit History', icon: Clock, badge: historyCount },
        { id: 'doctor', label: 'Doctor Console', icon: Stethoscope },
      ]
    },
    {
      group: 'FACILITY OPERATIONS',
      items: [
        { id: 'pharmacy', label: 'Pharmacy & Dispense', icon: Pill },
        { id: 'reception', label: 'Reception Queue Desk', icon: ClipboardList },
        { id: 'tv', label: 'Waiting Room TV Display', icon: Tv },
      ]
    },
    {
      group: 'POSTER INNOVATIONS (LIVE)',
      items: [
        { id: 'ocr', label: 'Prescription OCR (AI)', icon: Scan, badge: 'AI VISION' },
        { id: 'abdm', label: 'ABDM & ABHA Locker', icon: ShieldCheck, badge: 'ABHA' },
        { id: 'fulfillment', label: 'Scheduled Rider Delivery', icon: Bike, badge: 'HOME RIDER' },
      ]
    },
    {
      group: 'PROJECT EXHIBITION (SOCCA-12)',
      items: [
        { id: 'overview', label: 'Poster & Methodology', icon: Sparkles, badge: 'SOCCA-12' },
      ]
    },
    {
      group: 'GOVERNANCE & LEDGER',
      items: [
        { id: 'admin', label: 'Analytics & KYC Approval', icon: BarChart3, badge: pendingCount },
        { id: 'super_admin', label: 'Super Admin Console', icon: Activity },
        { id: 'account', label: 'My Clinical Profile', icon: ShieldCheck },
      ]
    }
  ];

  const handleItemClick = (id) => {
    setCurrentRole(id);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const sidebarWidth = isCollapsed && !isMobileDrawer ? '78px' : '265px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        background: 'linear-gradient(180deg, #0F1117 0%, #161922 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: isMobileDrawer ? 'relative' : 'sticky',
        top: 0,
        zIndex: 100,
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* ── Brand Header (Pribite-Style) ── */}
      <div style={{
        padding: isCollapsed && !isMobileDrawer ? '1.25rem 0.75rem' : '1.25rem 1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isMobileDrawer ? 'center' : 'space-between',
        gap: '0.75rem'
      }}>
        <div 
          onClick={() => handleItemClick('hospitals')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
            position: 'relative'
          }}>
            <Activity size={22} />
            <span style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10B981',
              border: '2px solid #0F1117'
            }} />
          </div>

          {(!isCollapsed || isMobileDrawer) && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  Medi<span style={{ color: '#38BDF8' }}>Q</span>
                </span>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  background: 'rgba(212, 175, 55, 0.18)',
                  color: '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  PRO
                </span>
              </div>
              <p style={{ fontSize: '0.68rem', color: '#38BDF8', margin: 0, fontWeight: 800 }}>
                SOCCA - 12 &bull; Silver Oak Univ
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {!isMobileDrawer && (
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94A3B8',
              width: '28px',
              height: '28px',
              display: isCollapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── Scrollable Navigation Items ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: isCollapsed && !isMobileDrawer ? '1rem 0.5rem' : '1rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {(!isCollapsed || isMobileDrawer) && (
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                color: '#64748B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0 0.5rem 0.45rem',
              }}>
                {group.group}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentRole === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isCollapsed && !isMobileDrawer ? '0.7rem 0' : '0.65rem 0.85rem',
                      justifyContent: isCollapsed && !isMobileDrawer ? 'center' : 'flex-start',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: isActive 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.28) 0%, rgba(2, 132, 199, 0.12) 100%)' 
                        : 'transparent',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      fontWeight: isActive ? 900 : 700,
                      fontSize: '0.86rem',
                      position: 'relative',
                      textAlign: 'left',
                      boxShadow: isActive ? 'inset 3px 0 0 #0284C7' : 'none'
                    }}
                    title={item.label}
                  >
                    <Icon 
                      size={18} 
                      color={isActive ? '#38BDF8' : '#94A3B8'} 
                      style={{ flexShrink: 0 }} 
                    />
                    {(!isCollapsed || isMobileDrawer) && (
                      <span style={{ 
                        flex: 1, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {item.label}
                      </span>
                    )}
                    {item.badge && (!isCollapsed || isMobileDrawer) && (
                      <span style={{
                        background: typeof item.badge === 'number' ? '#D4AF37' : 'rgba(56, 189, 248, 0.2)',
                        color: typeof item.badge === 'number' ? '#0F1117' : '#38BDF8',
                        border: typeof item.badge === 'number' ? 'none' : '1px solid rgba(56, 189, 248, 0.4)',
                        fontSize: '0.64rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '1rem',
                        marginLeft: 'auto',
                        letterSpacing: '0.04em'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Actions (Pribite-Style) ── */}
      <div style={{
        padding: isCollapsed && !isMobileDrawer ? '0.75rem 0.5rem' : '0.85rem 1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* Seed Demo Data Button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed && !isMobileDrawer ? 'center' : 'flex-start',
            gap: '0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: '9px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            background: 'rgba(212, 175, 55, 0.08)',
            color: '#F3CF6D',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Seed Live Firebase Demo Data"
        >
          {seeded ? (
            <CheckCircle2 size={16} color="#10B981" />
          ) : (
            <Sparkles size={16} color="#D4AF37" />
          )}
          {(!isCollapsed || isMobileDrawer) && (
            <span>{seeding ? 'Seeding...' : seeded ? 'Data Ready!' : 'Seed Live Demo Data'}</span>
          )}
        </button>

        {/* User Profile / Auth State */}
        {currentUser ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed && !isMobileDrawer ? 'center' : 'space-between',
            padding: '0.45rem 0.6rem',
            borderRadius: '9px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '0.5rem'
          }}>
            <div 
              onClick={() => handleItemClick('account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                overflow: 'hidden',
                flex: 1
              }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                borderRadius: '50%',
                background: '#0284C7',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 900
              }}>
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
              </div>
              {(!isCollapsed || isMobileDrawer) && (
                <div style={{ overflow: 'hidden', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {currentUser.displayName || 'Administrator'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'capitalize' }}>
                    {currentUser.role || 'Super Admin'}
                  </div>
                </div>
              )}
            </div>

            {(!isCollapsed || isMobileDrawer) && (
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal(currentRole)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed && !isMobileDrawer ? 'center' : 'flex-start',
              gap: '0.6rem',
              padding: '0.55rem 0.75rem',
              borderRadius: '9px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Activity size={16} color="#38BDF8" />
            {(!isCollapsed || isMobileDrawer) && <span>Sign In / Register</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
