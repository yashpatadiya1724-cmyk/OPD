import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  FileText, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Printer,
  X
} from 'lucide-react';
import { subscribeUserHistory, submitReview } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function HistoryView({ onBookNewToken }) {
  const { currentUser } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'completed' | 'active' | 'slot'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal for digital OPD slip receipt
  const [selectedSlip, setSelectedSlip] = useState(null);

  // Review modal from history
  const [reviewingItem, setReviewingItem] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeUserHistory((items) => {
      setHistoryItems(items);
    });
    return () => unsub();
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingItem) return;
    try {
      setReviewSubmitting(true);
      await submitReview({
        hospitalId: reviewingItem.hospitalId || 'citycare-central',
        hospitalName: reviewingItem.hospitalName || 'CityCare Central Hospital',
        doctorId: reviewingItem.doctorId || 'dr-mehta',
        doctorName: reviewingItem.doctorName || 'Dr. Rajesh Mehta',
        patientName: currentUser?.displayName || reviewingItem.patientName || 'Verified Patient',
        rating: Number(ratingVal),
        comment: reviewText.trim() || 'Great consultation with very little wait time.'
      });

      // Update local history item
      setHistoryItems(prev => prev.map(item => {
        if (item.id === reviewingItem.id) {
          return { ...item, rating: Number(ratingVal), reviewText };
        }
        return item;
      }));

      setReviewingItem(null);
      setReviewText('');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review: ' + err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filter items
  const filteredItems = historyItems.filter(item => {
    const matchesSearch = 
      (item.doctorName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.hospitalName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.reason?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.department?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'completed') return item.status === 'completed';
    if (filterTab === 'active') return item.status === 'waiting' || item.status === 'in-progress';
    if (filterTab === 'slot') return item.bookingMode === 'slot';
    return true;
  });

  const completedCount = historyItems.filter(i => i.status === 'completed').length;
  const activeCount = historyItems.filter(i => i.status === 'waiting' || i.status === 'in-progress').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header & Metrics */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#f0f9ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={24} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#090d16', letterSpacing: '-0.02em' }}>
                  OPD Visit &amp; Token History
                </h1>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                  Live records of all consultations, digital tokens, prepaid appointments &amp; doctor reviews
                </p>
              </div>
            </div>
          </div>

          {onBookNewToken && (
            <button
              onClick={onBookNewToken}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>+ Book New OPD Token</span>
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Visits Logged</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#090d16', marginTop: '0.2rem' }}>
              {historyItems.length} Visits
            </div>
          </div>

          <div style={{ background: '#ecfdf5', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Completed Consultations</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
              {completedCount}
            </div>
          </div>

          <div style={{ background: '#eff6ff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Active In-Queue Tokens</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', marginTop: '0.2rem' }}>
              {activeCount}
            </div>
          </div>

          <div style={{ background: '#fffbeb', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <span style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Average OPD Wait</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706', marginTop: '0.2rem' }}>
              11 Minutes
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by doctor, hospital, symptom, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          background: '#f8fafc',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: 'All Records' },
            { id: 'completed', label: 'Completed' },
            { id: 'active', label: 'Active In-Queue' },
            { id: 'slot', label: 'Pre-paid Slots' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: filterTab === tab.id ? '#0284c7' : 'transparent',
                color: filterTab === tab.id ? '#ffffff' : '#64748b',
                boxShadow: filterTab === tab.id ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items Cards */}
      {filteredItems.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px dashed #cbd5e1',
          padding: '3rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Clock size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#090d16', fontSize: '1.2rem', fontWeight: 800 }}>
            No Visit Records Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
            {searchQuery ? 'No visits matched your search query.' : 'Your OPD visits, booked tokens, and slots will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredItems.map(item => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in-progress';
            const isWaiting = item.status === 'waiting';

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.15s'
                }}
              >
                {/* Card Top Row: Token / Slot & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      color: '#1d4ed8',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      fontWeight: 900
                    }}>
                      {item.bookingMode === 'slot' ? `📅 Slot: ${item.slotTime || '11:30 AM'}` : `Token #${String(item.tokenNumber).padStart(2, '0')}`}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                      <Calendar size={15} />
                      <span>{item.date || 'Today'}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isCompleted && (
                      <span style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '2rem',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>Consultation Completed</span>
                      </span>
                    )}

                    {isInProgress && (
                      <span style={{
                        background: '#fffbeb',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '2rem',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span className="pulse-dot" style={{ background: '#f59e0b' }}></span>
                        <span>Now Inside Doctor Room</span>
                      </span>
                    )}

                    {isWaiting && (
                      <span style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '2rem',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <Clock size={14} />
                        <span>Waiting in Queue</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Hospital, Doctor, Room */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Doctor &amp; Specialty</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#090d16', marginTop: '0.15rem' }}>
                      {item.doctorName || 'Senior Consultant'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                      {item.department || 'General Medicine'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Hospital &amp; Room Location</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#090d16', marginTop: '0.15rem' }}>
                      {item.hospitalName || 'CityCare Central Hospital'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 800 }}>
                      📍 {item.roomNumber || 'Room 102'} {item.floorWing ? `• ${item.floorWing}` : ''}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Consultation Fee</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#090d16', marginTop: '0.15rem' }}>
                      ₹{item.consultationFee || 500}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800 }}>
                      ✓ Paid via MediQ FastTrack
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {item.reason && (
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    <span style={{ fontWeight: 800, color: '#090d16' }}>Chief Complaint: </span>
                    <span>"{item.reason}"</span>
                  </div>
                )}

                {/* Review section if completed */}
                {isCompleted && item.rating && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', gap: '0.15rem' }}>
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} size={15} color="#f59e0b" fill="#f59e0b" />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                        Your Verified Review ({item.rating}/5)
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', fontStyle: 'italic' }}>
                      "{item.reviewText || 'Excellent consultation experience with minimum waiting.'}"
                    </p>
                  </div>
                )}

                {/* Card Bottom Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '0.85rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                    Recorded ID: <span style={{ fontFamily: 'monospace' }}>{item.id}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Rate Consultation Button if completed and not yet rated */}
                    {isCompleted && !item.rating && (
                      <button
                        onClick={() => {
                          setReviewingItem(item);
                          setRatingVal(5);
                          setReviewText('');
                        }}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #f59e0b',
                          background: '#fffbeb',
                          color: '#b45309',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Star size={14} fill="#f59e0b" />
                        <span>Rate Consultation</span>
                      </button>
                    )}

                    {/* View Digital OPD Slip */}
                    <button
                      onClick={() => setSelectedSlip(item)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#090d16',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Receipt size={14} />
                      <span>Digital OPD Slip</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: DIGITAL OPD SLIP */}
      {selectedSlip && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '2px solid #e2e8f0',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedSlip(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            {/* Slip Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#090d16' }}>
                {selectedSlip.hospitalName || 'CityCare Central Hospital'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                OFFICIAL OUTPATIENT CONSULTATION SLIP
              </div>
              <div style={{
                display: 'inline-block',
                margin: '0.75rem auto 0',
                background: '#eff6ff',
                color: '#1d4ed8',
                padding: '0.4rem 1.25rem',
                borderRadius: '8px',
                fontSize: '1.3rem',
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}>
                {selectedSlip.bookingMode === 'slot' ? `SLOT: ${selectedSlip.slotTime}` : `TOKEN #${String(selectedSlip.tokenNumber).padStart(2, '0')}`}
              </div>
            </div>

            {/* Slip Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Patient Name:</span>
                <span style={{ fontWeight: 800, color: '#090d16' }}>{selectedSlip.patientName || currentUser?.displayName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Phone Number:</span>
                <span style={{ fontWeight: 700, color: '#090d16' }}>{selectedSlip.phoneNumber || '9876543210'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Doctor:</span>
                <span style={{ fontWeight: 800, color: '#090d16' }}>{selectedSlip.doctorName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Department:</span>
                <span style={{ fontWeight: 700, color: '#090d16' }}>{selectedSlip.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>OPD Room:</span>
                <span style={{ fontWeight: 800, color: '#0284c7' }}>{selectedSlip.roomNumber || 'Room 102'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Consultation Fee:</span>
                <span style={{ fontWeight: 900, color: '#10b981' }}>₹{selectedSlip.consultationFee} (PAID)</span>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center'
            }}>
              Valid for OPD visit on {selectedSlip.date || 'today'}. Show this digital slip upon room entry.
            </div>

            <button
              onClick={() => window.print()}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '10px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <Printer size={16} />
              <span>Print OPD Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: RATE CONSULTATION */}
      {reviewingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '2px solid #e2e8f0',
            position: 'relative'
          }}>
            <button
              onClick={() => setReviewingItem(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.3rem', fontWeight: 900, color: '#090d16' }}>
              Rate Your Consultation
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
              With {reviewingItem.doctorName} at {reviewingItem.hospitalName}
            </p>

            <form onSubmit={handleReviewSubmit}>
              {/* Star Picker */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.35rem',
                      transform: ratingVal >= star ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Star
                      size={32}
                      color="#f59e0b"
                      fill={ratingVal >= star ? "#f59e0b" : "none"}
                    />
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                  Your Experience Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details about doctor advice, queue waiting time, and clinic staff..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#f59e0b',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                {reviewSubmitting ? 'Posting Review...' : 'Submit Verified Rating'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
