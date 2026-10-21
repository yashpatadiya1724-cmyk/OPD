import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  PlusCircle, 
  UserPlus, 
  Users, 
  DoorOpen, 
  Clock, 
  CheckCircle, 
  SkipForward, 
  Phone, 
  CalendarClock, 
  X,
  Sparkles,
  AlertCircle,
  Printer,
  CreditCard,
  AlertTriangle,
  QrCode,
  ShieldAlert,
  Volume2,
  DollarSign
} from 'lucide-react';
import { 
  subscribeDoctorList, 
  subscribeDoctorTokens, 
  generateToken, 
  updateTokenStatus,
  logAuditEvent,
  recordTransaction,
  pauseDoctorQueue,
  sortQueueByPriority
} from '../firebase';
import { playChime } from '../utils/audio';

export default function ReceptionDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [tokens, setTokens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Walk-in Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinDocId, setWalkinDocId] = useState('');
  const [walkinReason, setWalkinReason] = useState('');
  const [walkinLane, setWalkinLane] = useState('normal'); // 'normal' | 'senior' | 'pregnant' | 'disabled' | 'emergency'
  const [collectPaymentNow, setCollectPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'cash'
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);
  const [walkinSuccess, setWalkinSuccess] = useState(null);

  // Thermal Slip Modal State (PRD 5.3)
  const [slipToken, setSlipToken] = useState(null);

  // Queue Override Modal State (PRD 5.3 + 6.2 + 9)
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideToken, setOverrideToken] = useState(null);
  const [overrideReason, setOverrideReason] = useState('Acute severe distress / vitals unstable');
  const [overrideNewLane, setOverrideNewLane] = useState('emergency');
  const [isOverriding, setIsOverriding] = useState(false);

  // Doctor Delay Broadcast State (PRD 5.3 + 6.7)
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [delayReason, setDelayReason] = useState('Doctor held up in emergency ward rounds');

  useEffect(() => {
    const unsub = subscribeDoctorList((docs) => {
      setDoctors(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
        setWalkinDocId(docs[0].id);
      }
    });
    return () => unsub();
  }, [selectedDocId]);

  useEffect(() => {
    if (!selectedDocId) return;
    const unsub = subscribeDoctorTokens(selectedDocId, (tList) => {
      const sorted = sortQueueByPriority(tList);
      setTokens(sorted);
    });
    return () => unsub();
  }, [selectedDocId]);

  const activeDoctor = doctors.find(d => d.id === selectedDocId);

  // PRD 6.1: Walk-in Cap Calculation
  const dailyCap = activeDoctor?.dailyCap || 50;
  const reservedForSlots = activeDoctor?.reservedForSlots || 15;
  const walkInCap = Math.max(0, dailyCap - reservedForSlots);
  const todayWalkinsCount = tokens.filter(t => t.type !== 'slot').length;
  const isCapReached = todayWalkinsCount >= walkInCap;

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = 
      (t.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.phoneNumber || '').includes(searchTerm) ||
      String(t.tokenNumber || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const waitingCount = tokens.filter(t => t.status === 'waiting').length;
  const inProgressToken = tokens.find(t => t.status === 'in-progress');
  const completedCount = tokens.filter(t => t.status === 'completed').length;

  const handleAddWalkin = async (e) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim() || !walkinDocId) return;

    try {
      setIsSubmittingWalkin(true);
      const res = await generateToken(walkinDocId, {
        patientName: walkinName.trim(),
        phoneNumber: walkinPhone.trim(),
        reason: walkinReason.trim(),
        lane: walkinLane,
        addedBy: 'reception_desk'
      });

      // Record transaction if payment collected at desk
      if (collectPaymentNow) {
        await recordTransaction({
          type: 'walkin_convenience_fee',
          amount: 50,
          tokenNumber: res.tokenNumber,
          patientName: walkinName.trim(),
          doctorId: walkinDocId,
          hospitalId: activeDoctor?.hospitalId || 'citycare-central',
          paymentMethod: paymentMethod,
          collectedBy: 'Receptionist Kavita',
          status: 'paid'
        });
      }

      playChime();
      setWalkinSuccess({
        tokenNumber: res.tokenNumber,
        patientName: walkinName.trim(),
        lane: walkinLane,
        doctorName: activeDoctor?.name || 'Doctor',
        roomNumber: activeDoctor?.roomNumber || 'Room 101',
        paymentCollected: collectPaymentNow
      });

      setWalkinName('');
      setWalkinPhone('');
      setWalkinReason('');
      setWalkinLane('normal');

    } catch (err) {
      alert('Failed to register walk-in patient: ' + err.message);
    } finally {
      setIsSubmittingWalkin(false);
    }
  };

  const handleConfirmOverride = async () => {
    if (!selectedDocId || !overrideToken) return;
    try {
      setIsOverriding(true);
      const beforeState = { ...overrideToken };

      // Update token status/lane to priority/emergency
      await updateTokenStatus(selectedDocId, overrideToken.id, 'waiting', {
        lane: overrideNewLane,
        priorityOverrideReason: overrideReason,
        overrideAt: new Date().toISOString()
      });

      // Immutable Audit Log (PRD 5.3 + 9)
      await logAuditEvent({
        actor: 'Receptionist Kavita (Front Desk)',
        action: 'QUEUE_PRIORITY_OVERRIDE',
        targetId: overrideToken.id,
        before: { lane: beforeState.lane, tokenNumber: beforeState.tokenNumber },
        after: { lane: overrideNewLane, tokenNumber: beforeState.tokenNumber },
        reason: overrideReason
      });

      alert(`Queue override logged in immutable audit log. Token #${overrideToken.tokenNumber} priority elevated.`);
      setShowOverrideModal(false);
      setOverrideToken(null);
    } catch (err) {
      console.error(err);
      alert('Override failed: ' + err.message);
    } finally {
      setIsOverriding(false);
    }
  };

  const handleBroadcastDelay = async () => {
    if (!activeDoctor) return;
    try {
      await pauseDoctorQueue(activeDoctor.id, {
        paused: true,
        reason: delayReason,
        delayMinutes: Number(delayMinutes) || 30
      });
      alert(`Delay announcement broadcast to all patient screens & waiting room TVs for ${activeDoctor.name}.`);
      setShowDelayModal(false);
    } catch (e) {
      alert('Failed to broadcast delay: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Top Header */}
      <div className="glass-card" style={{
        padding: '1.25rem 1.75rem',
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
            <ClipboardList size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Reception &amp; Triage Control Desk (Surface 3)
            </h2>
            <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Walk-in ticketing, triage lanes, thermal slip print, desk payment &amp; queue override
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDelayModal(true)}
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.15rem', fontSize: '0.92rem', fontWeight: 800, borderColor: '#f59e0b', color: '#b45309' }}
          >
            <Volume2 size={18} />
            <span>Broadcast Delay</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.35rem', fontSize: '1rem', fontWeight: 900 }}
          >
            <UserPlus size={20} />
            <span>Add Walk-In Patient</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT DOCTOR ROSTER */}
        <div className="glass-card" style={{ padding: '1.35rem' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            OPD Doctor Roster
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {doctors.map(d => {
              const isSelected = d.id === selectedDocId;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDocId(d.id)}
                  style={{
                    padding: '1.1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--badge-comp-bg)' : 'var(--bg-inner)',
                    border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {d.name}
                    </h4>
                    {d.queuePaused ? (
                      <span className="badge badge-skipped" style={{ fontSize: '0.65rem' }}>Paused</span>
                    ) : (
                      <span className="badge badge-in-progress" style={{ fontSize: '0.65rem' }}>Active</span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                    {d.department}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.65rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <DoorOpen size={14} color="#0284c7" /> {d.roomNumber || 'Room 101'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d97706' }}>
                      <CalendarClock size={14} /> {d.timingSlot?.split('-')[0]?.trim()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT QUEUE TABLE */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          
          {/* Selected Doctor Summary */}
          {activeDoctor && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>{activeDoctor.name}</h3>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {activeDoctor.department} &bull; <strong style={{ color: 'var(--accent-cyan)' }}>{activeDoctor.roomNumber}</strong> ({activeDoctor.floorWing})
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.85rem' }}>
                  <div style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-inner)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Waiting</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#d97706' }}>{waitingCount}</div>
                  </div>
                  <div style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-inner)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Serving</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0284c7' }}>
                      {inProgressToken ? `#${inProgressToken.tokenNumber}` : 'None'}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-inner)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Completed</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>{completedCount}</div>
                  </div>
                </div>
              </div>

              {/* PRD 6.1 Walk-in Cap Banner */}
              <div style={{
                background: isCapReached ? '#fef2f2' : '#f0fdf4',
                border: isCapReached ? '1px solid #f87171' : '1px solid #86efac',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: isCapReached ? '#991b1b' : '#166534'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>
                    <strong>Walk-in Quota:</strong> {todayWalkinsCount} / {walkInCap} issued today (Daily Cap: {dailyCap}, Reserved for Online Slots: {reservedForSlots})
                  </span>
                </div>
                {isCapReached && (
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    CAP REACHED
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Search & Status Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search patient by name, phone, or token #..."
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="input-field"
              style={{ width: 'auto', minWidth: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {/* Queue Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Token</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Patient &amp; Triage Lane</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Phone</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      No patient tokens match current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.95rem 1rem', fontWeight: 900, fontSize: '1.25rem', color: '#0284c7' }}>
                        #{t.tokenNumber}
                      </td>
                      <td style={{ padding: '0.95rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {t.patientName}
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                          {t.lane === 'emergency' && (
                            <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                              🚨 Emergency (Lane 1000)
                            </span>
                          )}
                          {t.lane === 'senior' && (
                            <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                              👴 Senior (Lane 50)
                            </span>
                          )}
                          {t.lane === 'pregnant' && (
                            <span style={{ background: '#fce7f3', color: '#9d174d', border: '1px solid #fbcfe8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                              🤰 Priority (Lane 50)
                            </span>
                          )}
                          {t.lane === 'disabled' && (
                            <span style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                              ♿ Priority (Lane 50)
                            </span>
                          )}
                          {t.type === 'slot' && (
                            <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                              📅 Slot ({t.slotTime || 'Online'})
                            </span>
                          )}
                        </div>
                        {t.priorityOverrideReason && (
                          <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700, marginTop: '2px' }}>
                            ⚡ Override: {t.priorityOverrideReason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.95rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {t.phoneNumber}
                      </td>
                      <td style={{ padding: '0.95rem 1rem', fontWeight: 600, color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.reason || '—'}
                      </td>
                      <td style={{ padding: '0.95rem 1rem' }}>
                        {t.status === 'in-progress' && <span className="badge badge-in-progress">Serving</span>}
                        {t.status === 'waiting' && <span className="badge badge-waiting">Waiting</span>}
                        {t.status === 'completed' && <span className="badge badge-completed">Done</span>}
                        {t.status === 'skipped' && <span className="badge badge-skipped">Skipped</span>}
                      </td>
                      <td style={{ padding: '0.95rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          
                          {/* Thermal Print Slip Button */}
                          <button
                            onClick={() => setSlipToken(t)}
                            title="Print Thermal Slip & QR Code"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}
                          >
                            <Printer size={13} />
                            <span>Slip</span>
                          </button>

                          {/* Queue Override Button */}
                          {t.status === 'waiting' && (
                            <button
                              onClick={() => {
                                setOverrideToken(t);
                                setShowOverrideModal(true);
                              }}
                              title="Triage / Emergency Queue Override with Audit Log"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, borderColor: '#f87171', color: '#b91c1c' }}
                            >
                              <ShieldAlert size={13} />
                              <span>Override</span>
                            </button>
                          )}

                          {t.status === 'waiting' && (
                            <button
                              onClick={async () => {
                                playChime();
                                await updateTokenStatus(selectedDocId, t.id, 'in-progress');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                              Call
                            </button>
                          )}
                          {t.status === 'in-progress' && (
                            <button
                              onClick={async () => {
                                await updateTokenStatus(selectedDocId, t.id, 'completed');
                              }}
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                              Complete
                            </button>
                          )}
                          {t.status !== 'completed' && t.status !== 'skipped' && (
                            <button
                              onClick={async () => {
                                await updateTokenStatus(selectedDocId, t.id, 'skipped');
                              }}
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* ADD WALK-IN MODAL WITH TRIAGE & PAYMENT */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={22} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>Register Walk-in &amp; Triage</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {walkinSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <CheckCircle size={52} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>Token Issued Successfully!</h4>
                <div style={{ fontSize: '4.2rem', fontWeight: 900, color: '#0284c7', margin: '0.5rem 0' }}>
                  #{walkinSuccess.tokenNumber}
                </div>
                <p style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Assigned to <strong style={{ color: 'var(--text-primary)' }}>{walkinSuccess.patientName}</strong> &bull; {walkinSuccess.lane.toUpperCase()} Lane
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const tData = {
                      tokenNumber: walkinSuccess.tokenNumber,
                      patientName: walkinSuccess.patientName,
                      lane: walkinSuccess.lane,
                      doctorName: walkinSuccess.doctorName,
                      roomNumber: walkinSuccess.roomNumber,
                      createdAt: new Date().toISOString()
                    };
                    setShowAddModal(false);
                    setWalkinSuccess(null);
                    setSlipToken(tData);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', fontWeight: 900, width: '100%' }}
                >
                  <Printer size={18} />
                  <span>Print Thermal Token Slip &amp; QR</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Ramesh Chandra"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. 9812345678"
                    maxLength={10}
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                {/* Triage Lane Selection (PRD 5.3 + 6.2) */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Triage Priority Lane *
                  </label>
                  <select
                    className="input-field"
                    value={walkinLane}
                    onChange={(e) => setWalkinLane(e.target.value)}
                    required
                  >
                    <option value="normal">Normal Lane (FIFO Weight 0)</option>
                    <option value="emergency">🚨 Emergency / Critical (Priority Weight 1000)</option>
                    <option value="senior">👴 Senior Citizen (Priority Weight 50)</option>
                    <option value="pregnant">🤰 Pregnant / Infant (Priority Weight 50)</option>
                    <option value="disabled">♿ Differently Abled (Priority Weight 50)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Doctor / Department *
                  </label>
                  <select
                    className="input-field"
                    value={walkinDocId}
                    onChange={(e) => setWalkinDocId(e.target.value)}
                    required
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.department} ({d.roomNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                    Chief Complaint / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. High fever, chest discomfort"
                    value={walkinReason}
                    onChange={(e) => setWalkinReason(e.target.value)}
                  />
                </div>

                {/* Desk Payment Collection (PRD 5.3 + 6.9) */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={collectPaymentNow}
                        onChange={e => setCollectPaymentNow(e.target.checked)}
                      />
                      <span>Collect Registration Fee at Desk (₹50)</span>
                    </label>
                    <span style={{ fontWeight: 900, color: '#059669', fontSize: '0.9rem' }}>₹50</span>
                  </div>

                  {collectPaymentNow && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="deskPay"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                        />
                        <span>UPI QR</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="deskPay"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                        />
                        <span>Cash</span>
                      </label>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingWalkin}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {isSubmittingWalkin ? 'Issuing...' : 'Issue Token Slip'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* THERMAL TOKEN SLIP PRINT PREVIEW MODAL (PRD 5.3) */}
      {slipToken && (
        <div className="modal-overlay" onClick={() => setSlipToken(null)}>
          <div className="glass-card" style={{
            maxWidth: '380px',
            width: '100%',
            background: '#ffffff',
            padding: '2rem 1.5rem',
            borderRadius: '16px',
            fontFamily: 'monospace',
            color: '#1e293b',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #94a3b8', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em' }}>CityCare Central Hospital</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OPD SMART QUEUE TOKEN SLIP</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date: {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}</div>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>TOKEN NUMBER</div>
              <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: '#0284c7', margin: '0.4rem 0' }}>
                #{slipToken.tokenNumber}
              </div>
              <div style={{
                display: 'inline-block',
                background: slipToken.lane === 'emergency' ? '#fee2e2' : '#f1f5f9',
                color: slipToken.lane === 'emergency' ? '#991b1b' : '#334155',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontWeight: 900
              }}>
                LANE: {(slipToken.lane || 'NORMAL').toUpperCase()}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '0.75rem 0', margin: '1rem 0', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <div><strong>Patient:</strong> {slipToken.patientName}</div>
              <div><strong>Doctor:</strong> {slipToken.doctorName || activeDoctor?.name}</div>
              <div><strong>Cabin:</strong> {slipToken.roomNumber || activeDoctor?.roomNumber} ({activeDoctor?.floorWing})</div>
              <div><strong>Fee:</strong> Paid (₹50)</div>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              {/* Simulated QR Code */}
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 0.5rem',
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc'
              }}>
                <QrCode size={80} color="#0f172a" />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Scan at Waiting Room TV to track ETA</div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setSlipToken(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', fontWeight: 900 }}
              >
                <Printer size={15} />
                <span>Print Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUEUE OVERRIDE MODAL (PRD 5.3 + 9 IMMUTABLE AUDIT LOG) */}
      {showOverrideModal && overrideToken && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Queue Override — Token #{overrideToken.tokenNumber}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700 }}>
                  Mandatory reason required; logged to immutable audit trail
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Elevate to Lane:
              </label>
              <select
                className="input-field"
                value={overrideNewLane}
                onChange={e => setOverrideNewLane(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="emergency">🚨 Emergency Lane (Score 1000 — Jumps to Front)</option>
                <option value="senior">👴 Senior Citizen Lane (Score 50)</option>
                <option value="pregnant">🤰 Priority Lane (Score 50)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Mandatory Clinical / Front-Desk Reason:
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="State medical justification for queue jumping..."
                required
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 800 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                disabled={isOverriding || !overrideReason.trim()}
                className="btn btn-danger"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 900 }}
              >
                {isOverriding ? 'Logging...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST DELAY MODAL (PRD 5.3 + 6.7) */}
      {showDelayModal && activeDoctor && (
        <div className="modal-overlay" onClick={() => setShowDelayModal(false)}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Broadcast Delay for {activeDoctor.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700 }}>
                  Updates Waiting TV display &amp; pushes notifications to all patient phones
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Delay Duration:
              </label>
              <select
                className="input-field"
                value={delayMinutes}
                onChange={e => setDelayMinutes(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value={15}>15 Minutes Delay</option>
                <option value={30}>30 Minutes Delay ("Dr. running 30 min late")</option>
                <option value={45}>45 Minutes Delay</option>
                <option value={60}>60 Minutes Delay (Extended hold)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Broadcast Announcement Message:
              </label>
              <input
                type="text"
                className="input-field"
                value={delayReason}
                onChange={e => setDelayReason(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDelayModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 800 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcastDelay}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 900, background: '#d97706', borderColor: '#b45309' }}
              >
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
