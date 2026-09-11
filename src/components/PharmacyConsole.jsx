import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Search, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  PackageCheck,
  AlertCircle,
  Phone,
  Building2,
  BellRing
} from 'lucide-react';
import { 
  subscribePharmacyTokens, 
  updatePharmacyTokenStatus,
  getPharmacyPriceComparison
} from '../firebase';
import { playChime } from '../utils/audio';

export default function PharmacyConsole() {
  const [tokens, setTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'comparison'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounter, setSelectedCounter] = useState('Counter 1');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = subscribePharmacyTokens((list) => {
      setTokens(list);
    });
    return () => unsub();
  }, []);

  const preparingTokens = tokens.filter(t => t.status === 'preparing');
  const readyTokens = tokens.filter(t => t.status === 'ready');
  const dispensedTokens = tokens.filter(t => t.status === 'dispensed');

  const filteredTokens = tokens.filter(t => {
    const query = searchTerm.toLowerCase();
    return (
      (t.tokenCode && t.tokenCode.toLowerCase().includes(query)) ||
      (t.patientName && t.patientName.toLowerCase().includes(query)) ||
      (t.phoneNumber && t.phoneNumber.includes(query)) ||
      (t.medicines && t.medicines.some(m => m.toLowerCase().includes(query)))
    );
  });

  const handleCallReady = async (token) => {
    try {
      setIsProcessing(true);
      playChime();
      await updatePharmacyTokenStatus(token.id, 'ready', selectedCounter);
    } catch (err) {
      console.error('Error updating pharmacy token:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkDispensed = async (token) => {
    try {
      setIsProcessing(true);
      await updatePharmacyTokenStatus(token.id, 'dispensed', selectedCounter);
    } catch (err) {
      console.error('Error dispensing pharmacy token:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const comparisonPharmacies = getPharmacyPriceComparison();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '5px solid #059669' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
            }}>
              <Pill size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Hospital Pharmacy Counter Console
                </h1>
                <span style={{
                  background: '#dcfce7',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '1rem',
                  border: '1px solid #86efac'
                }}>
                  ● LIVE HANDOFF ACTIVE
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Section 7.10 & 7.11 • Real-time prescription receipt from Doctor OPDs, live dispensing & city-wide medicine price comparison.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Dispense Station:</label>
            <select
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
              className="input-field"
              style={{ padding: '0.45rem 0.85rem', fontWeight: 900, fontSize: '0.9rem' }}
            >
              <option value="Counter 1">Counter 1 (Main Atrium)</option>
              <option value="Counter 2">Counter 2 (Express Fast-Track)</option>
              <option value="Counter 3">Counter 3 (Specialty & Generic)</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Preparing Prescriptions</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7' }}>{preparingTokens.length}</div>
          </div>
          <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Ready for Pickup</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706' }}>{readyTokens.length}</div>
          </div>
          <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Dispensed Today</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>{dispensedTokens.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('queue')}
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: activeTab === 'queue' ? '2px solid #059669' : '1px solid #cbd5e1',
            background: activeTab === 'queue' ? '#059669' : '#fff',
            color: activeTab === 'queue' ? '#fff' : '#334155',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Pill size={18} />
          <span>Live Dispense Queue ({tokens.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: activeTab === 'comparison' ? '2px solid #059669' : '1px solid #cbd5e1',
            background: activeTab === 'comparison' ? '#059669' : '#fff',
            color: activeTab === 'comparison' ? '#fff' : '#334155',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <TrendingUp size={18} />
          <span>Section 7.11 Price & Distance Intelligence</span>
        </button>
      </div>

      {/* TAB 1: Live Dispense Queue */}
      {activeTab === 'queue' && (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Token (PH-01), Patient name, Phone, or Medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '38px', borderRadius: '12px' }}
            />
          </div>

          {filteredTokens.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Pill size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--text-main)' }}>No Active Pharmacy Tokens</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                When doctors mark consultations as complete on the Doctor Console, prescribed medicines will automatically stream here in real time!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
              {filteredTokens.map((item) => {
                const isReady = item.status === 'ready';
                const isDispensed = item.status === 'dispensed';
                const isPreparing = item.status === 'preparing';

                return (
                  <div 
                    key={item.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '1.25rem',
                      borderLeft: `4px solid ${isDispensed ? '#059669' : (isReady ? '#d97706' : '#0284c7')}`,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          background: isReady ? '#fef3c7' : (isDispensed ? '#dcfce7' : '#e0f2fe'),
                          color: isReady ? '#92400e' : (isDispensed ? '#166534' : '#0369a1'),
                          fontWeight: 900,
                          fontSize: '1.25rem',
                          letterSpacing: '-0.5px'
                        }}>
                          {item.tokenCode || `PH-0${item.tokenNumber || 1}`}
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-main)' }}>
                            {item.patientName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Dr: {item.doctorName || 'Attending Physician'}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '1rem',
                        background: isDispensed ? '#dcfce7' : (isReady ? '#fef3c7' : '#e0f2fe'),
                        color: isDispensed ? '#166534' : (isReady ? '#92400e' : '#0369a1'),
                        border: `1px solid ${isDispensed ? '#86efac' : (isReady ? '#fde68a' : '#bae6fd')}`
                      }}>
                        {isDispensed ? '✓ DISPENSED' : (isReady ? '🔔 READY AT COUNTER' : '⏳ PREPARING')}
                      </span>
                    </div>

                    {/* Prescribed Medicines Box */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Prescribed Medicines ({item.medicines?.length || 0}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {item.medicines && item.medicines.map((med, i) => (
                          <span 
                            key={i}
                            style={{
                              background: '#fff',
                              border: '1px solid #cbd5e1',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#0f172a'
                            }}
                          >
                            💊 {med}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isPreparing && (
                        <button
                          onClick={() => handleCallReady(item)}
                          disabled={isProcessing}
                          style={{
                            flex: 1,
                            padding: '0.6rem',
                            background: '#d97706',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <BellRing size={16} />
                          <span>Call for Pickup ({selectedCounter})</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          onClick={() => handleMarkDispensed(item)}
                          disabled={isProcessing}
                          style={{
                            flex: 1,
                            padding: '0.6rem',
                            background: '#059669',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <PackageCheck size={16} />
                          <span>Mark Dispensed / Paid</span>
                        </button>
                      )}

                      {isDispensed && (
                        <div style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: '#059669', fontWeight: 900, padding: '0.4rem' }}>
                          ✓ Patient received medicines at {item.counterNumber || 'Counter 1'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Section 7.11 Price & Distance Intelligence Catalog */}
      {activeTab === 'comparison' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--text-main)', fontSize: '1.2rem' }}>
              Section 7.11 • Pharmacy Price & Distance Comparison Engine
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Benchmarking patient prescription costs across hospital in-house pharmacy, branded retail chains, and government generic centers.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>PHARMACY</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>DISTANCE & ETA</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>STOCK</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>BENCHMARK</th>
                </tr>
              </thead>
              <tbody>
                {comparisonPharmacies.map((pharm) => (
                  <tr key={pharm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '0.95rem' }}>{pharm.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{pharm.address}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{pharm.distanceKm === 0 ? 'On-Site / 0 km' : `${pharm.distanceKm} km`}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {pharm.travelTimeMinutes === 0 ? 'Instant Atrium pickup' : `~${pharm.travelTimeMinutes} mins travel`}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        ● 100% In Stock
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>
                        ₹{pharm.totalPrice}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: `${pharm.badgeColor}15`,
                        color: pharm.badgeColor,
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        border: `1px solid ${pharm.badgeColor}40`
                      }}>
                        {pharm.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
