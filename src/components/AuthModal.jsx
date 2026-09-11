import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  User, 
  Stethoscope, 
  ClipboardList, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

export default function AuthModal({ initialRole = 'patient', isOpen, onClose, onLoginSuccess }) {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    switchDemoAccount 
  } = useAuth();

  const [activeRole, setActiveRole] = useState(initialRole || 'patient');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const roleMeta = {
    patient: {
      title: 'Patient Portal Login',
      subtitle: 'Track your live token position, book time slots & view OPD visit history',
      icon: User,
      color: '#0284c7',
      bgLight: '#f0f9ff'
    },
    doctor: {
      title: 'Doctor Consultation Desk',
      subtitle: 'Call waiting patients, update room allocation & verify Medical Council KYC',
      icon: Stethoscope,
      color: '#0d9488',
      bgLight: '#f0fdfa'
    },
    reception: {
      title: 'Hospital Reception & Triage',
      subtitle: 'Allocate walk-in tokens, manage multi-doctor queues & print slips',
      icon: ClipboardList,
      color: '#d97706',
      bgLight: '#fffbeb'
    },
    admin: {
      title: 'Hospital & Super Admin',
      subtitle: 'Marketplace GMV, 10% take-rate, doctor KYC credential approvals & SLAs',
      icon: ShieldCheck,
      color: '#4f46e5',
      bgLight: '#eef2ff'
    }
  };

  const currentMeta = roleMeta[activeRole];
  const CurrentIcon = currentMeta.icon;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await loginWithGoogle(activeRole);
      if (onLoginSuccess) onLoginSuccess(user, activeRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'signin') {
        const user = await loginWithEmail(email, password, activeRole);
        if (onLoginSuccess) onLoginSuccess(user, activeRole);
      } else {
        const user = await registerWithEmail({
          displayName,
          email,
          password,
          phoneNumber,
          role: activeRole,
          extraData: activeRole === 'doctor' ? {
            councilRegistration: medicalCouncil || 'MCI-PENDING-KYC',
            department: specialty,
            kycStatus: 'pending'
          } : {}
        });
        if (onLoginSuccess) onLoginSuccess(user, activeRole);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (roleKey) => {
    const user = switchDemoAccount(roleKey);
    if (onLoginSuccess) onLoginSuccess(user, roleKey);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{
          padding: '2rem 2rem 1.25rem',
          borderBottom: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: currentMeta.bgLight,
            color: currentMeta.color,
            marginBottom: '0.85rem'
          }}>
            <CurrentIcon size={30} />
          </div>
          <h2 style={{
            margin: '0 0 0.35rem',
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#090d16',
            letterSpacing: '-0.02em'
          }}>
            {currentMeta.title}
          </h2>
          <p style={{
            margin: 0,
            fontSize: '0.88rem',
            color: '#64748b',
            lineHeight: 1.4,
            fontWeight: 600
          }}>
            {currentMeta.subtitle}
          </p>

          {/* Role Switcher Pills */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            background: '#f8fafc',
            padding: '0.35rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginTop: '1.25rem',
            overflowX: 'auto'
          }}>
            {[
              { id: 'patient', label: 'Patient', icon: User },
              { id: 'doctor', label: 'Doctor', icon: Stethoscope },
              { id: 'reception', label: 'Reception', icon: ClipboardList },
              { id: 'admin', label: 'Admin', icon: ShieldCheck }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeRole === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveRole(tab.id);
                    setError(null);
                  }}
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#090d16' : '#64748b',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 2rem 2rem' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#991b1b',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* PRIMARY ACTION: "CONTINUE WITH GOOGLE" */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              padding: '0.85rem 1.25rem',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.2s',
              marginBottom: '1.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
            }}
          >
            {/* Google Multicolored SVG Logo */}
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google as {activeRole.toUpperCase()}</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.25rem 0',
            color: '#94a3b8'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Or with Email &amp; Password
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Verma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {authMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                  Phone Number (for SMS &amp; Queue Alerts)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* If Doctor registering, prompt for Medical Council KYC */}
            {authMode === 'register' && activeRole === 'doctor' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Medical Council Registration Number (KYC ID)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileCheck2 size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. MCI-58291-DL"
                      value={medicalCouncil}
                      onChange={(e) => setMedicalCouncil(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Specialty / Department
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff'
                    }}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics & Child Health">Pediatrics &amp; Child Health</option>
                    <option value="Orthopedics & Joint Care">Orthopedics &amp; Joint Care</option>
                    <option value="Cardiology & Chest Clinic">Cardiology &amp; Chest Clinic</option>
                    <option value="Dermatology & Skin Clinic">Dermatology &amp; Skin Clinic</option>
                    <option value="Neurology & Brain Sciences">Neurology &amp; Brain Sciences</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: currentMeta.color,
                color: '#ffffff',
                fontSize: '0.98rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${currentMeta.color}40`,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Processing...' : (authMode === 'signin' ? `Sign In to ${currentMeta.title}` : 'Create MediQ Account')}
            </button>
          </form>

          {/* Toggle between Sign In & Register */}
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
            {authMode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentMeta.color,
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Create One Now
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentMeta.color,
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* QUICK ONE-TAP DEMO ACCOUNTS */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#090d16',
              marginBottom: '0.65rem'
            }}>
              <Sparkles size={15} color="#0284c7" />
              <span>Instant One-Tap Demo Profiles (No Typing Needed):</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('patient')}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#090d16' }}>👤 Riya Sharma</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Patient (Live Tracker)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('doctor')}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdfa'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#090d16' }}>👨‍⚕️ Dr. Rajesh Mehta</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Doctor (KYC Verified)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('reception')}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#090d16' }}>🏢 Anil Deshpande</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reception Desk</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#eef2ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#090d16' }}>🛡️ Sunita Rao</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Super Admin &amp; GMV</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
