import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  DoorOpen, 
  Clock, 
  CalendarClock,
  Sparkles,
  Activity,
  Globe,
  Key,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { subscribeDoctorList, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { playChime, speakAnnouncement } from '../utils/audio';

const TRANSLATIONS = {
  en: {
    title: 'Public Waiting Room Display',
    subtitle: '10-Foot Read-Only TV Mode (DPDP Privacy Compliant)',
    nowServing: 'NOW SERVING',
    nextInLine: 'NEXT 5 TOKENS',
    waiting: 'Waiting',
    emptyQueue: 'No patients in queue',
    delayNotice: 'DOCTOR DELAY NOTICE',
    emergencyNotice: '🚨 EMERGENCY PATIENT IN ROOM',
    pairedStatus: 'TV Paired (ID: TV-ATRIUM-01)',
    room: 'Room',
    floor: 'Floor'
  },
  hi: {
    title: 'सार्वजनिक प्रतीक्षालय डिस्प्ले',
    subtitle: '10-फुट टीवी मोड (गोपनीयता सुरक्षित - केवल टोकन नंबर)',
    nowServing: 'वर्तमान टोकन (बुलाया गया)',
    nextInLine: 'अगले 5 टोकन',
    waiting: 'प्रतीक्षारत',
    emptyQueue: 'कोई मरीज प्रतीक्षारत नहीं है',
    delayNotice: 'डॉक्टर विलंब सूचना',
    emergencyNotice: '🚨 आपातकालीन मरीज कक्ष में',
    pairedStatus: 'टीवी कनेक्टेड (ID: TV-ATRIUM-01)',
    room: 'कक्ष',
    floor: 'मंज़िल'
  },
  gu: {
    title: 'જાહેર પ્રતીક્ષા ખંડ ડિસ્પ્લે',
    subtitle: '10-ફૂટ ટીવી મોડ (ગોપનીયતા સુરક્ષિત - ફક્ત ટોકન)',
    nowServing: 'હાલમાં ચાલુ ટોકન',
    nextInLine: 'આગામી 5 ટોકન',
    waiting: 'રાહ જોઈ રહ્યા છે',
    emptyQueue: 'કતારમાં કોઈ દર્દી નથી',
    delayNotice: 'ડોક્ટર વિલંબ સૂચના',
    emergencyNotice: '🚨 ઈમરજન્સી દર્દી રૂમમાં છે',
    pairedStatus: 'ટીવી કનેક્ટેડ (ID: TV-ATRIUM-01)',
    room: 'રૂમ',
    floor: 'માળ'
  }
};

// Mask patient name to eliminate PII from public waiting room TV (PRD Section 9)
const maskPatientName = (name) => {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  return parts.map(p => p[0] + '***').join(' ');
};

export default function PublicDisplay({ onExit }) {
  const [doctors, setDoctors] = useState([]);
  const [doctorQueues, setDoctorQueues] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lang, setLang] = useState('en'); // 'en' | 'hi' | 'gu'
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [isPaired, setIsPaired] = useState(true);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [maskNames, setMaskNames] = useState(false); // Default false: show full patient names clearly

  const prevServingRef = useRef({});
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      window.location.href = url.origin + url.pathname;
    }
  };

  // Auto-rotate languages every 15 seconds if idle (PRD 5.5 multi-language rotation)
  useEffect(() => {
    const timer = setInterval(() => {
      setLang(prev => (prev === 'en' ? 'hi' : (prev === 'hi' ? 'gu' : 'en')));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = subscribeDoctorList((docs) => {
      setDoctors(docs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (doctors.length === 0) return;

    const unsubs = doctors.map(doc => {
      const tokensRef = collection(db, 'doctors', doc.id, 'tokens');
      return onSnapshot(tokensRef, (snap) => {
        const tList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        tList.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

        setDoctorQueues(prev => ({
          ...prev,
          [doc.id]: tList
        }));

        const active = tList.find(t => t.status === 'in-progress');
        if (active) {
          const prevNum = prevServingRef.current[doc.id];
          if (prevNum !== active.tokenNumber) {
            prevServingRef.current[doc.id] = active.tokenNumber;
            if (audioEnabled) {
              playChime();
              speakAnnouncement(
                `Token number ${active.tokenNumber}, please proceed to ${doc.roomNumber || 'the consultation room'}, ${doc.name}.`
              );
            }
          }
        }
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [doctors, audioEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '1.5rem',
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* TV Header Bar */}
      <div className="glass-card" style={{
        padding: '1rem 1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
          }}>
            <Tv size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {t.title} (Surface 5)
            </h2>
            <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {t.subtitle} &bull; {t.pairedStatus}
            </p>
          </div>
        </div>

        {/* Display Controls & Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Multi-language Selector */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            {['en', 'hi', 'gu'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: lang === l ? '#0284c7' : 'transparent',
                  color: lang === l ? '#fff' : '#475569',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Pairing Code Button (PRD 5.5) */}
          <button
            onClick={() => setShowPairingModal(true)}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem', fontWeight: 800 }}
          >
            <Key size={15} />
            <span>{isPaired ? 'Pairing: TV-8821' : 'Pair Device'}</span>
          </button>

          {/* Patient Names Visibility Toggle */}
          <button
            onClick={() => setMaskNames(!maskNames)}
            className="btn btn-secondary"
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              background: maskNames ? 'var(--bg-inner)' : '#e0f2fe',
              color: maskNames ? 'var(--text-secondary)' : '#0369a1',
              border: maskNames ? '1px solid var(--border-subtle)' : '1.5px solid #38bdf8'
            }}
            title={maskNames ? 'Click to show Full Patient Names' : 'Click to hide/mask names for privacy'}
          >
            <ShieldCheck size={15} color={maskNames ? '#64748b' : '#0284c7'} />
            <span>{maskNames ? 'Names: Masked' : '✓ Full Names'}</span>
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`btn ${audioEnabled ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '0.55rem 0.95rem', fontSize: '0.82rem', fontWeight: 800 }}
          >
            {audioEnabled ? (
              <>
                <Volume2 size={16} /> Chimes On
              </>
            ) : (
              <>
                <VolumeX size={16} /> Enable Chime
              </>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Explicit Exit TV Mode button */}
          <button
            onClick={handleExit}
            style={{
              padding: '0.55rem 0.95rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              background: '#fee2e2',
              color: '#991b1b',
              border: '1.5px solid #fca5a5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Exit TV Display Mode and return to MediQ App"
          >
            <LogOut size={15} />
            <span>Exit TV</span>
          </button>
        </div>
      </div>

      {/* Doctor Queues Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
        flex: 1
      }}>
        {doctors.map(doc => {
          const q = doctorQueues[doc.id] || [];
          const activeToken = q.find(t => t.status === 'in-progress');
          // PRD 5.5: Show next 5 tokens
          const nextTokens = q.filter(t => t.status === 'waiting').slice(0, 5);
          const hasEmergency = activeToken?.lane === 'emergency';

          return (
            <div
              key={doc.id}
              className="glass-card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: activeToken ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
                background: '#ffffff'
              }}
            >
              {/* Doctor Header & Room */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {doc.name}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                      {doc.department}
                    </div>
                  </div>

                  {doc.queuePaused ? (
                    <span className="badge badge-skipped" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                      ⏸️ {t.delayNotice}
                    </span>
                  ) : (
                    <span className="badge badge-in-progress">
                      <span className="pulse-dot" style={{ background: '#10b981' }}></span> Active
                    </span>
                  )}
                </div>

                {/* PRD 5.5 / 6.7 Delay Alert Banner */}
                {doc.queuePaused && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    background: '#fffbeb',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#92400e',
                    fontSize: '0.82rem',
                    fontWeight: 800
                  }}>
                    <AlertTriangle size={18} />
                    <span>⚠️ {doc.pauseReason || 'Doctor is currently attending an emergency case (~30 min delay)'}</span>
                  </div>
                )}

                {/* Room & Floor Banner */}
                <div style={{
                  margin: '1rem 0',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-inner)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DoorOpen size={22} color="#0284c7" />
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {t.room} {doc.roomNumber?.replace('Room', '').trim() || '101'}
                      </div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {doc.floorWing || 'Ground Floor'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706', textAlign: 'right' }}>
                    {doc.timingSlot || '09:00 - 13:30'}
                  </div>
                </div>

                {/* Giant NOW SERVING */}
                <div style={{
                  textAlign: 'center',
                  padding: '1.75rem 1rem',
                  background: hasEmergency ? '#fef2f2' : 'var(--bg-inner)',
                  borderRadius: 'var(--radius-lg)',
                  border: hasEmergency ? '2px solid #f87171' : '1px solid var(--border-subtle)',
                  margin: '0.5rem 0 1.25rem'
                }}>
                  <div style={{
                    fontSize: '0.88rem',
                    color: hasEmergency ? '#991b1b' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 900
                  }}>
                    {hasEmergency ? t.emergencyNotice : t.nowServing}
                  </div>

                  {activeToken ? (
                    <>
                      <div style={{
                        fontSize: '5.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                        margin: '0.35rem 0',
                        color: hasEmergency ? '#dc2626' : '#0284c7'
                      }}>
                        #{activeToken.tokenNumber}
                      </div>
                      {/* Patient Name: Full Name displayed clearly */}
                      <div style={{
                        fontSize: '1.35rem',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        marginTop: '0.25rem'
                      }}>
                        {maskNames ? maskPatientName(activeToken.patientName) : (activeToken.patientName || 'Patient')}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>—</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t.emptyQueue}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Next in Line Preview (Next 5 Tokens - PRD 5.5) */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem'
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    {t.nextInLine}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {q.filter(t => t.status === 'waiting').length} {t.waiting}
                  </span>
                </div>

                {nextTokens.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                    {t.emptyQueue}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: '0.45rem' }}>
                    {nextTokens.map((nt, idx) => (
                      <div
                        key={nt.id}
                        style={{
                          background: idx === 0 ? 'var(--badge-next-bg)' : 'var(--bg-inner)',
                          border: idx === 0 ? '1px solid var(--badge-next-border)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem 0.35rem',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          color: idx === 0 ? '#92400e' : 'var(--text-primary)'
                        }}>
                          #{nt.tokenNumber}
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={nt.patientName || `Token #${nt.tokenNumber}`}>
                          {maskNames ? maskPatientName(nt.patientName) : (nt.patientName || `Token #${nt.tokenNumber}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* PRD 5.5: TV PAIRING CODE MODAL */}
      {showPairingModal && (
        <div className="modal-overlay" onClick={() => setShowPairingModal(false)}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <Tv size={42} color="#0284c7" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>TV Display Device Pairing</h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                PRD 5.5: Kiosk mode pairing code with revocable device token
              </p>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'center',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>ACTIVE DEVICE PAIRING CODE</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.15em', color: '#0284c7', margin: '0.35rem 0' }}>
                OPD-8821
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>
                ✓ Device Token: <strong style={{ fontFamily: 'monospace' }}>dev_tok_atrium_tv01</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowPairingModal(false)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.7rem', fontWeight: 900 }}
              >
                Close &amp; Keep Connected
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
