import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  CheckCircle2, 
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
  BellRing,
  Plus,
  Printer,
  FileText,
  DollarSign,
  Layers,
  Filter,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import { 
  subscribePharmacyTokens, 
  updatePharmacyTokenStatus,
  createPharmacyToken,
  getPharmacyPriceComparison
} from '../firebase';
import { playChime } from '../utils/audio';

export default function PharmacyConsole() {
  const [tokens, setTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'comparison' | 'simulator'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'preparing' | 'ready' | 'dispensed'
  const [selectedCounter, setSelectedCounter] = useState('Counter 1 (Main Atrium)');
  const [isProcessing, setIsProcessing] = useState(false);

  // Walk-in Rx Modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinPatientName, setWalkinPatientName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinDoctor, setWalkinDoctor] = useState('Dr. Rajesh Mehta (General Medicine)');
  const [walkinMedsText, setWalkinMedsText] = useState('Paracetamol 650mg, Cetirizine 10mg');
  const [walkinPharmacy, setWalkinPharmacy] = useState('pharm-hospital');

  // Print Receipt Modal
  const [receiptToken, setReceiptToken] = useState(null);

  // Price Simulator state
  const [simMedsText, setSimMedsText] = useState('Paracetamol 650mg, Amoxicillin 500mg, Pantoprazole 40mg');

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
    const matchesSearch = 
      (t.tokenCode && t.tokenCode.toLowerCase().includes(query)) ||
      (t.patientName && t.patientName.toLowerCase().includes(query)) ||
      (t.phoneNumber && t.phoneNumber.includes(query)) ||
      (t.pharmacyName && t.pharmacyName.toLowerCase().includes(query)) ||
      (t.medicines && t.medicines.some(m => m.toLowerCase().includes(query)));

    const matchesPharmacy = 
      selectedPharmacyFilter === 'all' || 
      t.pharmacyId === selectedPharmacyFilter ||
      (selectedPharmacyFilter === 'pharm-hospital' && (!t.pharmacyId || t.pharmacyId === 'pharm-hospital'));

    const matchesStatus = 
      selectedStatusFilter === 'all' || 
      t.status === selectedStatusFilter;

    return matchesSearch && matchesPharmacy && matchesStatus;
  });

  const handleCallReady = async (token) => {
    try {
      setIsProcessing(true);
      playChime();
      // Optimistic UI state update
      setTokens(prev => prev.map(t => t.id === token.id ? { ...t, status: 'ready', counterNumber: selectedCounter } : t));
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
      // Optimistic UI state update
      setTokens(prev => prev.map(t => t.id === token.id ? { ...t, status: 'dispensed', counterNumber: selectedCounter } : t));
      await updatePharmacyTokenStatus(token.id, 'dispensed', selectedCounter);
    } catch (err) {
      console.error('Error dispensing pharmacy token:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateWalkinOrder = async (e) => {
    e.preventDefault();
    if (!walkinPatientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    const medList = walkinMedsText.split(',').map(m => m.trim()).filter(Boolean);
    if (medList.length === 0) {
      alert('Please enter at least one medicine');
      return;
    }

    try {
      setIsProcessing(true);
      playChime();
      const comparisons = getPharmacyPriceComparison(medList);
      const chosenPharm = comparisons.find(p => p.id === walkinPharmacy) || comparisons[0];

      await createPharmacyToken({
        patientName: walkinPatientName.trim(),
        phoneNumber: walkinPhone.trim(),
        doctorId: 'walkin-direct',
        doctorName: walkinDoctor,
        linkedDoctorTokenId: `walkin-${Date.now()}`,
        medicines: medList,
        hospitalId: 'citycare-central',
        hospitalName: 'CityCare Central Hospital',
        pharmacyId: chosenPharm.id,
        pharmacyName: chosenPharm.name,
        pharmacyType: chosenPharm.type,
        pharmacyAddress: chosenPharm.address,
        pharmacyDistance: chosenPharm.distanceText,
        totalEstimatedPrice: chosenPharm.totalPrice
      });

      setShowWalkinModal(false);
      setWalkinPatientName('');
      setWalkinPhone('');
      setWalkinMedsText('Paracetamol 650mg, Cetirizine 10mg');
    } catch (err) {
      console.error('Error creating walk-in token:', err);
      alert('Failed to create walk-in order: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const simMedsList = simMedsText.split(',').map(m => m.trim()).filter(Boolean);
  const simComparisons = getPharmacyPriceComparison(simMedsList);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.75rem 2rem', marginBottom: '1.75rem', borderLeft: '6px solid #059669', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)'
            }}>
              <Pill size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Pharmacy Dispense Counter &amp; Intelligence Console
                </h1>
                <span style={{
                  background: '#dcfce7',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '1rem',
                  border: '1px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }}></span>
                  REALTIME DISPENSE STREAM
                </span>
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Sections 7.10 &amp; 7.11 • Automatic doctor prescription handoff, zero-wait auto packing, and city-wide generic medicine price intelligence.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setShowWalkinModal(true)}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
              }}
            >
              <Plus size={18} />
              <span>+ Walk-in Rx Order</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <Building2 size={16} color="#475569" style={{ marginRight: '0.4rem' }} />
              <select
                value={selectedCounter}
                onChange={(e) => setSelectedCounter(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', cursor: 'pointer' }}
              >
                <option value="Counter 1 (Main Atrium)">Counter 1 (Main Atrium)</option>
                <option value="Counter 2 (Express Fast-Track)">Counter 2 (Express Fast-Track)</option>
                <option value="Counter 3 (Generic Jan Aushadhi)">Counter 3 (Generic Jan Aushadhi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Counters Metric Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div 
            onClick={() => setSelectedStatusFilter('preparing')}
            style={{ 
              padding: '1rem 1.25rem', 
              background: selectedStatusFilter === 'preparing' ? '#e0f2fe' : '#f8fafc', 
              borderRadius: '14px', 
              border: selectedStatusFilter === 'preparing' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 900, textTransform: 'uppercase' }}>Preparing in Queue</div>
              <Clock size={16} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', marginTop: '0.2rem' }}>{preparingTokens.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pharmacist packing meds</div>
          </div>

          <div 
            onClick={() => setSelectedStatusFilter('ready')}
            style={{ 
              padding: '1rem 1.25rem', 
              background: selectedStatusFilter === 'ready' ? '#fef3c7' : '#f8fafc', 
              borderRadius: '14px', 
              border: selectedStatusFilter === 'ready' ? '2px solid #d97706' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 900, textTransform: 'uppercase' }}>Ready for Pickup</div>
              <BellRing size={16} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '0.2rem' }}>{readyTokens.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Packed at counter for patient</div>
          </div>

          <div 
            onClick={() => setSelectedStatusFilter('dispensed')}
            style={{ 
              padding: '1rem 1.25rem', 
              background: selectedStatusFilter === 'dispensed' ? '#dcfce7' : '#f8fafc', 
              borderRadius: '14px', 
              border: selectedStatusFilter === 'dispensed' ? '2px solid #059669' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 900, textTransform: 'uppercase' }}>Dispensed Today</div>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>{dispensedTokens.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Prescriptions handed over</div>
          </div>

          <div 
            onClick={() => { setSelectedStatusFilter('all'); setSelectedPharmacyFilter('all'); }}
            style={{ 
              padding: '1rem 1.25rem', 
              background: selectedStatusFilter === 'all' ? '#f1f5f9' : '#ffffff', 
              borderRadius: '14px', 
              border: selectedStatusFilter === 'all' ? '2px solid #475569' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase' }}>Total Orders Active</div>
              <Layers size={16} color="#475569" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>{tokens.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Click to view all tokens</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: activeTab === 'queue' ? '2px solid #059669' : '1px solid #cbd5e1',
            background: activeTab === 'queue' ? '#059669' : '#fff',
            color: activeTab === 'queue' ? '#fff' : '#334155',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Pill size={18} />
          <span>Live Dispense Counter Queue ({tokens.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: activeTab === 'comparison' ? '2px solid #059669' : '1px solid #cbd5e1',
            background: activeTab === 'comparison' ? '#059669' : '#fff',
            color: activeTab === 'comparison' ? '#fff' : '#334155',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <TrendingUp size={18} />
          <span>Section 7.11 Price &amp; Distance Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: activeTab === 'simulator' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
            background: activeTab === 'simulator' ? '#7c3aed' : '#fff',
            color: activeTab === 'simulator' ? '#fff' : '#334155',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={18} />
          <span>Medicine Cost &amp; Generic Savings Calculator</span>
        </button>
      </div>

      {/* TAB 1: Live Dispense Queue */}
      {activeTab === 'queue' && (
        <div>
          
          {/* Pharmacy Filter Pills & Search */}
          <div style={{
            background: '#ffffff',
            padding: '1rem',
            borderRadius: '14px',
            border: '1.5px solid #e2e8f0',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 320px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search token code (PH-01, JA-01), patient name, phone, medicine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.4rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, color: '#475569' }}
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Pharmacy Filter Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginRight: '0.25rem' }}>
                🏥 Filter Pharmacy:
              </span>

              {[
                { id: 'all', label: 'All Partner Counters' },
                { id: 'pharm-hospital', label: '🏥 CityCare In-House (PH)', color: '#0284c7' },
                { id: 'pharm-janaushadhi', label: '🟢 Jan Aushadhi Generic (JA)', color: '#7c3aed' },
                { id: 'pharm-apollo', label: '🏪 Apollo 24/7 (AP)', color: '#0369a1' },
                { id: 'pharm-medplus', label: '💊 MedPlus (MP)', color: '#059669' },
              ].map((phFilter) => {
                const isSelected = selectedPharmacyFilter === phFilter.id;
                return (
                  <button
                    key={phFilter.id}
                    onClick={() => setSelectedPharmacyFilter(phFilter.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #059669' : '1px solid #e2e8f0',
                      background: isSelected ? '#dcfce7' : '#f8fafc',
                      color: isSelected ? '#166534' : '#334155'
                    }}
                  >
                    {phFilter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredTokens.length === 0 ? (
            <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <Pill size={52} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900, color: 'var(--text-main)', fontSize: '1.25rem' }}>
                No Matching Pharmacy Tokens Found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                When doctors mark patient visits as completed, prescribed medicines automatically stream here to the chosen dispense counter in real time!
              </p>
              <button
                onClick={() => setShowWalkinModal(true)}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                + Create Walk-in Prescription Order
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.35rem' }}>
              {filteredTokens.map((item) => {
                const isReady = item.status === 'ready';
                const isDispensed = item.status === 'dispensed';
                const isPreparing = item.status === 'preparing';

                const prefixColor = item.prefix === 'JA' ? '#7c3aed' : (item.prefix === 'AP' ? '#0369a1' : (item.prefix === 'MP' ? '#059669' : '#0284c7'));
                const prefixBg = item.prefix === 'JA' ? '#f5f3ff' : (item.prefix === 'AP' ? '#eff6ff' : (item.prefix === 'MP' ? '#ecfdf5' : '#f0f9ff'));

                return (
                  <div 
                    key={item.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '1.35rem',
                      borderTop: `4px solid ${isDispensed ? '#059669' : (isReady ? '#d97706' : '#0284c7')}`,
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08)'
                    }}
                  >
                    <div>
                      {/* Top Row: Token Code, Destination Pharmacy, and Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '12px',
                            background: prefixBg,
                            color: prefixColor,
                            fontWeight: 900,
                            fontSize: '1.35rem',
                            letterSpacing: '-0.5px',
                            border: `1.5px solid ${prefixColor}40`
                          }}>
                            {item.tokenCode || `PH-0${item.tokenNumber || 1}`}
                          </div>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#090d16' }}>
                              {item.patientName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span>👨‍⚕️</span> {item.doctorName || 'Attending Doctor'}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '1rem',
                          background: isDispensed ? '#dcfce7' : (isReady ? '#fef3c7' : '#e0f2fe'),
                          color: isDispensed ? '#166534' : (isReady ? '#92400e' : '#0369a1'),
                          border: `1px solid ${isDispensed ? '#86efac' : (isReady ? '#fde68a' : '#bae6fd')}`
                        }}>
                          {isDispensed ? '✓ DISPENSED' : (isReady ? '🔔 READY AT COUNTER' : '⏳ PREPARING')}
                        </span>
                      </div>

                      {/* Destination Pharmacy Tag */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        marginBottom: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>🏥</span> {item.pharmacyName || 'CityCare In-House Pharmacy'}
                        </div>
                        {item.isAutoPacked && (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 900, background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                            ⚡ Zero-Wait Pack
                          </span>
                        )}
                      </div>

                      {/* Prescribed Medicines Box */}
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                            Prescribed Medicines ({item.medicines?.length || 0}):
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                            Est. ₹{item.totalEstimatedPrice || ((item.medicines?.length || 1) * 60)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {item.medicines && item.medicines.map((med, i) => (
                            <span 
                              key={i}
                              style={{
                                background: '#fff',
                                border: '1px solid #cbd5e1',
                                padding: '0.25rem 0.55rem',
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
                    </div>

                    {/* Action Bar & Receipt Print */}
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {isPreparing && (
                          <button
                            onClick={() => handleCallReady(item)}
                            disabled={isProcessing}
                            style={{
                              flex: 1,
                              padding: '0.65rem',
                              background: '#d97706',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              fontSize: '0.85rem',
                              boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)'
                            }}
                          >
                            <BellRing size={16} />
                            <span>Mark Packed &amp; Call</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleMarkDispensed(item)}
                            disabled={isProcessing}
                            style={{
                              flex: 1,
                              padding: '0.65rem',
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              fontSize: '0.85rem',
                              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
                            }}
                          >
                            <PackageCheck size={16} />
                            <span>Handover &amp; Mark Dispensed</span>
                          </button>
                        )}

                        {isDispensed && (
                          <div style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem', color: '#059669', fontWeight: 900, padding: '0.5rem', background: '#dcfce7', borderRadius: '8px' }}>
                            ✓ Dispensed at {item.counterNumber || 'Counter 1'}
                          </div>
                        )}

                        <button
                          onClick={() => setReceiptToken(item)}
                          title="Print Digital Rx Receipt"
                          style={{
                            padding: '0.65rem 0.85rem',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Printer size={16} />
                        </button>
                      </div>

                      {item.phoneNumber && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>📞 Patient Phone: {item.phoneNumber}</span>
                          <a href={`tel:${item.phoneNumber}`} style={{ color: '#0284c7', fontWeight: 800, textDecoration: 'none' }}>
                            Call Patient
                          </a>
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
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <TrendingUp size={24} color="#059669" />
              <h3 style={{ margin: 0, fontWeight: 900, color: 'var(--text-main)', fontSize: '1.35rem' }}>
                Section 7.11 • Multi-Pharmacy Price &amp; Distance Intelligence
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Live prescription cost benchmark across on-site hospital counters, commercial retail chains, and government generic Jan Aushadhi Kendras.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 900, color: '#475569' }}>PHARMACY</th>
                  <th style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 900, color: '#475569' }}>TOKEN PREFIX</th>
                  <th style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 900, color: '#475569' }}>DISTANCE &amp; ETA</th>
                  <th style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 900, color: '#475569' }}>AVAILABILITY</th>
                  <th style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 900, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 900, color: '#475569' }}>VALUE BENCHMARK</th>
                </tr>
              </thead>
              <tbody>
                {getPharmacyPriceComparison(['Paracetamol 650mg', 'Cetirizine 10mg', 'Pantoprazole 40mg']).map((pharm) => (
                  <tr key={pharm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1rem' }}>{pharm.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{pharm.address}</div>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{
                        background: `${pharm.badgeColor}15`,
                        color: pharm.badgeColor,
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        border: `1px solid ${pharm.badgeColor}30`
                      }}>
                        {pharm.tokenPrefix}-XX
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{pharm.distanceText}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {pharm.travelTimeMinutes === 0 ? '0m walk (Ground Floor)' : `~${pharm.travelTimeMinutes} mins travel`}
                      </div>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                        ● 100% In Stock
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a' }}>
                        ₹{pharm.totalPrice}
                      </div>
                      {pharm.savings && (
                        <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 900 }}>
                          {pharm.savings}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{
                        background: `${pharm.badgeColor}15`,
                        color: pharm.badgeColor,
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        padding: '0.3rem 0.75rem',
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

      {/* TAB 3: Medicine Cost & Generic Savings Calculator */}
      {activeTab === 'simulator' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <Sparkles size={24} color="#7c3aed" />
              <h3 style={{ margin: 0, fontWeight: 900, color: 'var(--text-main)', fontSize: '1.35rem' }}>
                Interactive Medicine Cost &amp; Savings Calculator
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Add or remove prescribed medicines to compare real-time costs and see exact rupee savings for patients.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 900, color: '#090d16', marginBottom: '0.5rem' }}>
              Prescribed Medicines to Estimate:
            </label>
            <input
              type="text"
              value={simMedsText}
              onChange={(e) => setSimMedsText(e.target.value)}
              placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg, Cetirizine 10mg..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.95rem',
                fontWeight: 700,
                outline: 'none',
                background: '#fff'
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
              {['Paracetamol 650mg', 'Amoxicillin 500mg', 'Cetirizine 10mg', 'Pantoprazole 40mg', 'Azithromycin 500mg', 'Cough Syrup 100ml', 'Vitamin C & Zinc'].map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => {
                    if (!simMedsText.includes(med)) {
                      setSimMedsText(prev => prev.trim() ? `${prev.trim()}, ${med}` : med);
                    }
                  }}
                  style={{
                    background: simMedsText.includes(med) ? '#e0f2fe' : '#ffffff',
                    border: simMedsText.includes(med) ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    color: simMedsText.includes(med) ? '#0284c7' : '#334155',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  + {med}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {simComparisons.map((ph) => (
              <div 
                key={ph.id}
                style={{
                  background: ph.id === 'pharm-janaushadhi' ? '#f5f3ff' : '#ffffff',
                  border: ph.id === 'pharm-janaushadhi' ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: ph.id === 'pharm-janaushadhi' ? '0 10px 25px rgba(124, 58, 237, 0.15)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      background: ph.badgeColor,
                      color: '#fff',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px'
                    }}>
                      {ph.badge}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#64748b' }}>
                      Token: {ph.tokenPrefix}-XX
                    </span>
                  </div>

                  <h4 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 900, color: '#090d16' }}>
                    {ph.name}
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    📍 {ph.distanceText} • {ph.address}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>TOTAL ESTIMATE</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#090d16' }}>
                      ₹{ph.totalPrice}
                    </div>
                  </div>
                  {ph.savings && (
                    <div style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 900, color: '#7c3aed' }}>
                      🎉 {ph.savings}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WALK-IN RX ORDER MODAL */}
      {showWalkinModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowWalkinModal(false)}
        >
          <div 
            className="glass-card"
            style={{
              background: '#fff',
              maxWidth: '540px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Create Walk-in Rx Order</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>For physical prescription brought to pharmacy counter</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWalkinModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWalkinOrder}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.35rem' }}>Patient Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={walkinPatientName}
                  onChange={(e) => setWalkinPatientName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.35rem' }}>Patient Phone Number</label>
                <input 
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.35rem' }}>Prescribed Medicines (comma separated) *</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="e.g. Paracetamol 650mg, Cetirizine 10mg, Pantoprazole 40mg"
                  value={walkinMedsText}
                  onChange={(e) => setWalkinMedsText(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.35rem' }}>Target Dispense Pharmacy</label>
                <select
                  value={walkinPharmacy}
                  onChange={(e) => setWalkinPharmacy(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                >
                  <option value="pharm-hospital">🏥 CityCare In-House Pharmacy (PH)</option>
                  <option value="pharm-janaushadhi">🟢 Pradhan Mantri Jan Aushadhi Kendra (JA - 70% Generic)</option>
                  <option value="pharm-apollo">🏪 Apollo Pharmacy 24/7 (AP)</option>
                  <option value="pharm-medplus">💊 MedPlus Pharmacy (MP)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                >
                  {isProcessing ? 'Creating...' : 'Dispatch Rx Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {receiptToken && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setReceiptToken(null)}
        >
          <div 
            style={{
              background: '#fff',
              maxWidth: '420px',
              width: '100%',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              fontFamily: 'monospace'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>🏥 MEDIQ HEALTH PHARMACY</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{receiptToken.pharmacyName || 'CityCare In-House Pharmacy'}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{receiptToken.pharmacyAddress || 'Ground Floor Atrium, Sector 14'}</div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>TOKEN:</span>
                <strong style={{ fontSize: '1.1rem' }}>{receiptToken.tokenCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>PATIENT:</span>
                <strong>{receiptToken.patientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>DOCTOR:</span>
                <span>{receiptToken.doctorName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>STATUS:</span>
                <strong>{receiptToken.status?.toUpperCase()}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '0.75rem 0', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 900, fontSize: '0.8rem', marginBottom: '0.4rem' }}>PRESCRIBED MEDICINES:</div>
              {receiptToken.medicines && receiptToken.medicines.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span>{i + 1}. {m}</span>
                  <span>₹60.00</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.5rem' }}>
              <span>TOTAL ESTIMATED:</span>
              <span>₹{receiptToken.totalEstimatedPrice || ((receiptToken.medicines?.length || 1) * 60)}.00</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Printer size={16} />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setReceiptToken(null)}
                style={{
                  padding: '0.65rem 1rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
