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
  AlertCircle
} from 'lucide-react';
import { 
  subscribeDoctorList, 
  subscribeDoctorTokens, 
  generateToken, 
  updateTokenStatus 
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
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);
  const [walkinSuccess, setWalkinSuccess] = useState(null);

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
      tList.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
      setTokens(tList);
    });
    return () => unsub();
  }, [selectedDocId]);

  const activeDoctor = doctors.find(d => d.id === selectedDocId);

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
        addedBy: 'reception'
      });

      playChime();
      setWalkinSuccess({
        tokenNumber: res.tokenNumber,
        patientName: walkinName.trim()
      });

      setWalkinName('');
      setWalkinPhone('');
      setWalkinReason('');

      setTimeout(() => {
        setWalkinSuccess(null);
        setShowAddModal(false);
      }, 2500);
    } catch (err) {
      alert('Failed to register walk-in patient: ' + err.message);
    } finally {
      setIsSubmittingWalkin(false);
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
              Reception &amp; Triage Control Desk
            </h2>
            <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Monitor queues across all OPD rooms &amp; register walk-in patients
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ padding: '0.8rem 1.35rem', fontSize: '1rem', fontWeight: 900 }}
        >
          <UserPlus size={20} />
          <span>Add Walk-In Patient</span>
        </button>
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
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
                  <th style={{ padding: '0.85rem 1rem' }}>Patient Name</th>
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
                      <td style={{ padding: '0.95rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {t.patientName}
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
                        <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                          {t.status === 'waiting' && (
                            <button
                              onClick={async () => {
                                playChime();
                                await updateTokenStatus(selectedDocId, t.id, 'in-progress');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800 }}
                            >
                              Call Now
                            </button>
                          )}
                          {t.status === 'in-progress' && (
                            <button
                              onClick={async () => {
                                await updateTokenStatus(selectedDocId, t.id, 'completed');
                              }}
                              className="btn btn-success"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800 }}
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
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800 }}
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

      {/* ADD WALK-IN MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={22} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>Register Walk-in Patient</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {walkinSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle size={52} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>Token Issued Successfully!</h4>
                <div style={{ fontSize: '4.2rem', fontWeight: 900, color: '#0284c7', margin: '0.5rem 0' }}>
                  #{walkinSuccess.tokenNumber}
                </div>
                <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                  Assigned to <strong style={{ color: 'var(--text-primary)' }}>{walkinSuccess.patientName}</strong>
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
                    Reason for Consultation (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Cough, dressing change"
                    value={walkinReason}
                    onChange={(e) => setWalkinReason(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.85rem' }}>
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
                    {isSubmittingWalkin ? 'Issuing...' : 'Issue Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
