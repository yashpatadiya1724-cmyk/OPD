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
  Activity
} from 'lucide-react';
import { subscribeDoctorList, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { playChime, speakAnnouncement } from '../utils/audio';

export default function PublicDisplay() {
  const [doctors, setDoctors] = useState([]);
  const [doctorQueues, setDoctorQueues] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prevServingRef = useRef({});

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
        gap: '1rem'
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
              Public OPD Waiting-Room Display
            </h2>
            <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Live Consultation Call Board &amp; Doctor Room Locations
            </p>
          </div>
        </div>

        {/* Display Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`btn ${audioEnabled ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.88rem', fontWeight: 800 }}
          >
            {audioEnabled ? (
              <>
                <Volume2 size={18} /> Audio Chimes Active
              </>
            ) : (
              <>
                <VolumeX size={18} /> Enable Voice Chime
              </>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 0.95rem', fontSize: '0.88rem' }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Doctor Queues Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        flex: 1
      }}>
        {doctors.map(doc => {
          const q = doctorQueues[doc.id] || [];
          const activeToken = q.find(t => t.status === 'in-progress');
          const nextTokens = q.filter(t => t.status === 'waiting').slice(0, 3);

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
                boxShadow: 'var(--card-shadow)'
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
                    <span className="badge badge-skipped">Queue Paused</span>
                  ) : (
                    <span className="badge badge-in-progress">
                      <span className="pulse-dot" style={{ background: '#10b981' }}></span> Active
                    </span>
                  )}
                </div>

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
                        {doc.roomNumber || 'Room 101'}
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
                  background: 'var(--bg-inner)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  margin: '0.5rem 0 1.25rem'
                }}>
                  <div style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 900
                  }}>
                    Now Serving
                  </div>

                  {activeToken ? (
                    <>
                      <div style={{
                        fontSize: '5.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                        margin: '0.35rem 0',
                        color: '#0284c7'
                      }}>
                        #{activeToken.tokenNumber}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {activeToken.patientName}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>—</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Waiting for Next Patient</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Next in Line Preview */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem'
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    Next In Line
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {q.filter(t => t.status === 'waiting').length} Waiting
                  </span>
                </div>

                {nextTokens.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                    No upcoming waiting tokens
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {nextTokens.map((nt, idx) => (
                      <div
                        key={nt.id}
                        style={{
                          flex: 1,
                          background: idx === 0 ? 'var(--badge-next-bg)' : 'var(--bg-inner)',
                          border: idx === 0 ? '1px solid var(--badge-next-border)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.55rem',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: idx === 0 ? '#92400e' : 'var(--text-primary)'
                        }}>
                          #{nt.tokenNumber}
                        </div>
                        <div style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {nt.patientName}
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
    </div>
  );
}
