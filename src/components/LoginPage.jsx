import React, { useState } from 'react';
import {
  Activity, User, Stethoscope, ClipboardList, ShieldCheck,
  Mail, Lock, Phone, Sparkles, CheckCircle2, AlertCircle,
  FileCheck2, ArrowRight, Building2, Clock, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 'patient',     label: 'Patient',     icon: User,          color: '#0284c7', bg: '#e0f2fe', desc: 'Book tokens/slots & track live' },
  { id: 'doctor',      label: 'Doctor',      icon: Stethoscope,   color: '#0d9488', bg: '#ccfbf1', desc: 'Call queue, prescribe & dispatch' },
  { id: 'reception',   label: 'Front Desk',  icon: ClipboardList, color: '#d97706', bg: '#fef3c7', desc: 'Walk-ins, triage & token slips' },
  { id: 'pharmacy',    label: 'Pharmacy',    icon: Sparkles,      color: '#7c3aed', bg: '#ede9fe', desc: 'Counter dispense & inventory' },
  { id: 'admin',       label: 'Hospital',    icon: ShieldCheck,   color: '#059669', bg: '#dcfce7', desc: 'Operations & KYC workbench' },
  { id: 'super_admin', label: 'Platform',    icon: Building2,     color: '#4338ca', bg: '#e0e7ff', desc: 'GMV, settlements & onboarding' }
];

const DEMO_PROFILES = [
  { key: 'patient',     name: 'Riya Sharma',      sub: 'Patient · Normal Lane',       avatar: '👤', color: '#e0f2fe', border: '#0284c7' },
  { key: 'senior',      name: 'Ramesh Kumar (68)',sub: 'Senior Patient · Priority',   avatar: '👴', color: '#fef3c7', border: '#f59e0b' },
  { key: 'doctor',      name: 'Dr. Rajesh Mehta', sub: 'Doctor · KYC Verified',       avatar: '👨‍⚕️', color: '#ccfbf1', border: '#0d9488' },
  { key: 'reception',   name: 'Kavita Patil',     sub: 'Front Desk · Triage Desk',    avatar: '🏢', color: '#fef3c7', border: '#d97706' },
  { key: 'pharmacy',    name: 'Suresh Gupta',     sub: 'Pharmacy · Main Counter',     avatar: '💊', color: '#ede9fe', border: '#7c3aed' },
  { key: 'admin',       name: 'Admin Anil',       sub: 'Superintendent · Analytics',  avatar: '📊', color: '#dcfce7', border: '#059669' },
  { key: 'super_admin', name: 'Sunita Rao',       sub: 'Platform Super Admin',        avatar: '🛡️', color: '#e0e7ff', border: '#4338ca' }
];

export default function LoginPage({ onLoginSuccess }) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, switchDemoAccount } = useAuth();

  const [activeRole, setActiveRole] = useState('patient');
  const [authMode, setAuthMode]   = useState('signin'); // 'signin' | 'register'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const role = ROLES.find(r => r.id === activeRole) || ROLES[0];

  const handleGoogle = async () => {
    try { setLoading(true); setError(null);
      const user = await loginWithGoogle(activeRole);
      onLoginSuccess(user, activeRole);
    } catch (e) { setError(e.message || 'Google Sign-In failed'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      let user;
      if (authMode === 'signin') {
        user = await loginWithEmail(email, password, activeRole);
      } else {
        user = await registerWithEmail({ displayName, email, password, phoneNumber, role: activeRole,
          extraData: activeRole === 'doctor' ? { councilRegistration: medicalCouncil || 'MCI-PENDING', department: specialty, kycStatus: 'pending' } : {}
        });
      }
      onLoginSuccess(user, activeRole);
    } catch (e) { setError(e.message || 'Authentication error'); }
    finally { setLoading(false); }
  };

  const handleDemo = (key) => {
    const user = switchDemoAccount(key);
    onLoginSuccess(user, key);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0',
      fontFamily: 'var(--font-sans)'
    }}>

      {/* ── Hero Banner ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 45%, #06b6d4 100%)',
        padding: '2.5rem 1.5rem 3.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
          <div style={{
            width:'52px', height:'52px', borderRadius:'14px',
            background:'rgba(255,255,255,0.18)',
            backdropFilter:'blur(8px)',
            border:'1.5px solid rgba(255,255,255,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <Activity size={28} color="#ffffff" />
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'2rem', fontWeight:900, color:'#ffffff', letterSpacing:'-0.04em', lineHeight:1 }}>
              Medi<span style={{ color:'#bae6fd' }}>Q</span>
            </div>
            <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.9)', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Project Code: SOCCA - 12
            </div>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '1rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fef08a' }}>SILVER OAK UNIVERSITY (NAAC A+)</span>
          <span style={{ fontSize: '0.75rem', color: '#ffffff' }}>&bull;</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff' }}>BCA (SOCCA)</span>
        </div>

        <h1 style={{ color:'#ffffff', fontSize:'1.45rem', fontWeight:900, margin:'0 0 0.5rem', letterSpacing:'-0.02em' }}>
          Smart OPD Queue &amp; Pharmacy Fulfilment System
        </h1>
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'0.85rem', margin:'0 auto 0.75rem', maxWidth:'420px', fontWeight:600, lineHeight:1.5 }}>
          Yash Patadiya &bull; Riya Dhariwal &bull; Prajapati Riddhi &bull; Mentor: prof. Yash Khatri
        </p>

        {/* Stats strip */}
        <div style={{
          display:'flex', justifyContent:'center', gap:'0.75rem',
          marginTop:'1rem', flexWrap:'wrap'
        }}>
          {[['⚡','-84% OPD Wait'],['💊','-89% Rx Latency'],['💰','70.9% Generic Save'],['🛡️','Zero Negative-Stock']].map(([icon, text]) => (
            <div key={text} style={{
              background:'rgba(255,255,255,0.15)',
              backdropFilter:'blur(6px)',
              borderRadius:'2rem',
              padding:'0.3rem 0.75rem',
              color:'#ffffff',
              fontSize:'0.74rem',
              fontWeight:800,
              display:'flex', alignItems:'center', gap:'0.35rem',
              border:'1px solid rgba(255,255,255,0.2)'
            }}>
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Login Card ── */}
      <div style={{
        width:'100%', maxWidth:'480px',
        margin:'-1.5rem auto 2rem',
        padding:'0 1rem',
        position:'relative', zIndex:10
      }}>
        <div style={{
          background:'var(--bg-surface)',
          borderRadius:'var(--radius-xl)',
          boxShadow:'0 20px 60px -10px rgba(0,0,0,0.18)',
          border:'1px solid var(--border-subtle)',
          overflow:'hidden'
        }}>

          {/* Role Tabs */}
          <div style={{ padding:'1.25rem 1.25rem 0' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:900, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>
              I am a...
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.4rem' }}>
              {ROLES.map(r => {
                const Icon = r.icon;
                const active = activeRole === r.id;
                return (
                  <button key={r.id} onClick={() => { setActiveRole(r.id); setError(null); }}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem',
                      padding:'0.6rem 0.3rem',
                      borderRadius:'12px',
                      border: active ? `2px solid ${r.color}` : '1.5px solid var(--border-subtle)',
                      background: active ? r.bg : 'var(--bg-inner)',
                      cursor:'pointer',
                      transition:'all 0.18s',
                    }}
                  >
                    <Icon size={18} color={active ? r.color : 'var(--text-muted)'} />
                    <span style={{ fontSize:'0.7rem', fontWeight:900, color: active ? r.color : 'var(--text-muted)' }}>
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Body */}
          <div style={{ padding:'1.25rem' }}>

            {/* Error */}
            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', padding:'0.65rem 0.85rem', borderRadius:'10px', display:'flex', alignItems:'center', gap:'0.5rem', color:'#991b1b', fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>
                <AlertCircle size={16} /><span>{error}</span>
              </div>
            )}

            {/* Google Button */}
            <button onClick={handleGoogle} disabled={loading} type="button"
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem',
                padding:'0.8rem 1rem',
                background:'var(--bg-surface)',
                border:'1.5px solid var(--border-subtle)',
                borderRadius:'12px',
                fontSize:'0.92rem', fontWeight:800, color:'var(--text-primary)',
                cursor:'pointer',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                transition:'all 0.18s',
                marginBottom:'1rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              {loading ? 'Signing in...' : `Continue with Google as ${role.label}`}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'0.75rem 0', color:'var(--text-muted)' }}>
              <div style={{ flex:1, height:'1px', background:'var(--border-subtle)' }}/>
              <span style={{ fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>or with email</span>
              <div style={{ flex:1, height:'1px', background:'var(--border-subtle)' }}/>
            </div>

            {/* Auth Mode Toggle */}
            <div style={{ display:'flex', background:'var(--bg-inner)', borderRadius:'10px', padding:'0.3rem', marginBottom:'1rem', border:'1px solid var(--border-subtle)' }}>
              {['signin','register'].map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setError(null); }} type="button"
                  style={{
                    flex:1, padding:'0.45rem', borderRadius:'7px', border:'none',
                    fontSize:'0.8rem', fontWeight:900, cursor:'pointer',
                    background: authMode===m ? 'var(--bg-surface)' : 'transparent',
                    color: authMode===m ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: authMode===m ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                    transition:'all 0.15s'
                  }}
                >
                  {m==='signin' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {authMode==='register' && (
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.3rem' }}>Full Name</label>
                  <div style={{ position:'relative' }}>
                    <User size={16} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                    <input type="text" required placeholder="e.g. Rohan Verma" value={displayName} onChange={e=>setDisplayName(e.target.value)}
                      className="input-field" style={{ paddingLeft:'2.25rem' }} />
                  </div>
                </div>
              )}

              {authMode==='register' && (
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.3rem' }}>Phone Number</label>
                  <div style={{ position:'relative' }}>
                    <Phone size={16} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                    <input type="tel" required placeholder="9876543210" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)}
                      className="input-field" style={{ paddingLeft:'2.25rem' }} />
                  </div>
                </div>
              )}

              {authMode==='register' && activeRole==='doctor' && (
                <>
                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.3rem' }}>Medical Council Reg. No.</label>
                    <div style={{ position:'relative' }}>
                      <FileCheck2 size={16} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                      <input type="text" required placeholder="MCI-58291-DL" value={medicalCouncil} onChange={e=>setMedicalCouncil(e.target.value)}
                        className="input-field" style={{ paddingLeft:'2.25rem' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.3rem' }}>Specialty</label>
                    <select value={specialty} onChange={e=>setSpecialty(e.target.value)} className="input-field">
                      {['General Medicine','Pediatrics & Child Health','Orthopedics & Joint Care','Cardiology & Chest Clinic','Dermatology & Skin Clinic','Neurology & Brain Sciences'].map(s=>(
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.3rem' }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <Mail size={16} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input type="email" required placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)}
                    className="input-field" style={{ paddingLeft:'2.25rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.3rem' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={16} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input type="password" required placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
                    className="input-field" style={{ paddingLeft:'2.25rem' }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  padding:'0.8rem',
                  borderRadius:'12px',
                  border:'none',
                  background:`linear-gradient(135deg, ${role.color} 0%, ${role.color}cc 100%)`,
                  color:'#ffffff',
                  fontSize:'0.92rem',
                  fontWeight:900,
                  cursor:'pointer',
                  boxShadow:`0 4px 16px ${role.color}40`,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                  transition:'all 0.2s'
                }}
              >
                {loading ? 'Processing...' : (authMode==='signin' ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </div>

          {/* ── Demo Quick Login ── */}
          <div style={{
            padding:'1rem 1.25rem 1.5rem',
            borderTop:'1px solid var(--border-subtle)',
            background:'var(--bg-inner)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.75rem' }}>
              <Sparkles size={14} color="#0284c7" />
              <span style={{ fontSize:'0.72rem', fontWeight:900, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Try Demo — One Tap, No Typing
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.5rem' }}>
              {DEMO_PROFILES.map(p => (
                <button key={p.key} onClick={() => handleDemo(p.key)} type="button"
                  className="pinterest-card"
                  style={{
                    padding:'0.65rem 0.8rem',
                    borderRadius:'14px',
                    border:`1.5px solid ${p.border}50`,
                    background: p.color,
                    textAlign:'left',
                    cursor:'pointer',
                    transition:'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    display:'flex', alignItems:'center', gap:'0.6rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <span style={{ fontSize:'1.25rem' }}>{p.avatar}</span>
                  <div>
                    <div style={{ fontSize:'0.82rem', fontWeight:900, color:'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:700 }}>{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'1rem', fontWeight:600 }}>
          By continuing, you agree to MediQ's Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}
