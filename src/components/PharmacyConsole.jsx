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
  X,
  Plane,
  Bike,
  Box,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { 
  subscribePharmacyTokens, 
  updatePharmacyTokenStatus,
  createPharmacyToken,
  getPharmacyPriceComparison,
  checkMedicineStock,
  MEDICINE_INVENTORY
} from '../firebase';
import { playChime } from '../utils/audio';

export default function PharmacyConsole() {
  const [tokens, setTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'comparison' | 'simulator' | 'inventory' | 'dispatch'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'preparing' | 'ready' | 'dispensed'
  const [selectedCounter, setSelectedCounter] = useState('Counter 1 (Main Atrium)');
  const [isProcessing, setIsProcessing] = useState(false);

  // Micro-Dark Store Inventory State (PRD v5 F23)
  const [inventoryList, setInventoryList] = useState([
    { id: 'med-pcm-650', name: 'Paracetamol 650mg (Dolo)', genericName: 'Paracetamol 650mg IP', category: 'Antipyretic / Analgesic', batchNo: 'BT-9821', expiryDate: '2027-08', inHouseStock: 450, janAushadhiStock: 1200, mrp: 35, costPrice: 22, unit: 'Strips (15 Tabs)' },
    { id: 'med-amox-500', name: 'Amoxicillin 500mg (Novamox)', genericName: 'Amoxicillin 500mg', category: 'Antibiotic', batchNo: 'AM-4029', expiryDate: '2026-12', inHouseStock: 180, janAushadhiStock: 450, mrp: 110, costPrice: 72, unit: 'Strips (10 Caps)' },
    { id: 'med-cet-10', name: 'Cetirizine 10mg (Cetzine)', genericName: 'Cetirizine 10mg', category: 'Antihistamine / Allergy', batchNo: 'CZ-1102', expiryDate: '2027-04', inHouseStock: 300, janAushadhiStock: 800, mrp: 28, costPrice: 15, unit: 'Strips (10 Tabs)' },
    { id: 'med-panto-40', name: 'Pantoprazole 40mg (Pan 40)', genericName: 'Pantoprazole 40mg', category: 'Antacid / PPI', batchNo: 'PT-8832', expiryDate: '2026-11', inHouseStock: 220, janAushadhiStock: 650, mrp: 95, costPrice: 58, unit: 'Strips (10 Tabs)' },
    { id: 'med-azithro-500', name: 'Azithromycin 500mg (Azithral)', genericName: 'Azithromycin 500mg', category: 'Macrolide Antibiotic', batchNo: 'AZ-7721', expiryDate: '2026-10-31', inHouseStock: 42, janAushadhiStock: 300, mrp: 140, costPrice: 90, unit: 'Strips (3 Tabs)', expiringSoon: true },
    { id: 'med-insulin-r', name: 'Human Actrapid Insulin 40IU/ml', genericName: 'Regular Human Insulin IP', category: 'Cold-Chain Biological (2-8°C)', batchNo: 'IN-3390', expiryDate: '2027-02', inHouseStock: 65, janAushadhiStock: 120, mrp: 175, costPrice: 130, unit: 'Vial (10ml)', isColdChain: true },
    { id: 'med-antivenom', name: 'Polyvalent Snake Antivenom 10ml', genericName: 'Equine Snake Venom Antiserum', category: 'Emergency Biological (Cold Chain)', batchNo: 'AV-0012', expiryDate: '2027-09', inHouseStock: 18, janAushadhiStock: 25, mrp: 600, costPrice: 480, unit: 'Vial', isColdChain: true, lowStock: true }
  ]);

  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInForm, setStockInForm] = useState({
    name: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Potassium Clavulanate',
    category: 'Antibiotic',
    batchNo: 'AG-9912',
    expiryDate: '2027-10',
    quantity: 100,
    mrp: 220,
    costPrice: 145,
    unit: 'Strips (10 Tabs)'
  });

  // Hyperlocal Scheduled Dispatch Orders (Scheduled EV Rider Fleet Station)
  const [dispatchOrders, setDispatchOrders] = useState([
    {
      id: 'disp-01',
      patientName: 'Ravi Kumar Patel',
      address: 'B-402, Shivalik Residency, Near Sola',
      medicines: ['Human Actrapid Insulin 40IU', 'Paracetamol 650mg'],
      mode: 'bike',
      slot: '⚡ Express (15 Mins)',
      riderName: 'Vikram Rathore (Ather 450X EV)',
      riderPhone: '+91 98251 04921',
      doorstepOtp: '7391',
      status: 'ON_ROUTE',
      bagTemp: '4.5°C Verified',
      etaMinutes: 6,
      totalAmount: 224,
      placedAt: '4 mins ago'
    },
    {
      id: 'disp-02',
      patientName: 'Priya Shah',
      address: 'Plot 18, Sun City, Drive-In Road',
      medicines: ['Pan 40', 'Cetzine 10mg'],
      mode: 'bike',
      slot: '🌅 Morning Slot (08:00 AM – 10:00 AM)',
      riderName: 'Rahul M. Sharma (Ola S1 Pro)',
      riderPhone: '+91 98791 22819',
      doorstepOtp: '4820',
      status: 'PACKING',
      bagTemp: '4.2°C Verified',
      etaMinutes: 9,
      totalAmount: 123,
      placedAt: '1 min ago'
    },
    {
      id: 'disp-03',
      patientName: 'Anil Deshmukh',
      address: 'Flat 101, Galaxy Tower, SG Highway',
      medicines: ['Augmentin 625mg', 'Dolo 650mg'],
      mode: 'bike',
      slot: '🌆 Evening Slot (05:00 PM – 07:00 PM)',
      riderName: 'Amit K. Patel (TVS iQube)',
      riderPhone: '+91 98980 44920',
      doorstepOtp: '9152',
      status: 'SCHEDULED',
      bagTemp: '5.0°C Verified',
      etaMinutes: 35,
      totalAmount: 165,
      placedAt: '10 mins ago'
    }
  ]);

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

        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: activeTab === 'inventory' ? '2px solid #0284c7' : '1px solid #cbd5e1',
            background: activeTab === 'inventory' ? '#0284c7' : '#fff',
            color: activeTab === 'inventory' ? '#fff' : '#334155',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Box size={18} />
          <span>Dark Store Inventory ({inventoryList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: '12px',
            border: activeTab === 'dispatch' ? '2px solid #059669' : '1px solid #cbd5e1',
            background: activeTab === 'dispatch' ? '#059669' : '#fff',
            color: activeTab === 'dispatch' ? '#fff' : '#334155',
            fontWeight: 900,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Bike size={18} />
          <span>Scheduled Rider &amp; Dispatch ({dispatchOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: Live Dispense Queue */}
      {activeTab === 'queue' && (
        <div>
          
          {/* Pharmacy Filter Pills & Search */}
          <div style={{
            background: 'var(--bg-surface)',
            padding: '1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
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
                      background: 'var(--bg-surface)',
                      boxShadow: 'var(--card-shadow)'
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
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCallReady(item);
                            }}
                            style={{
                              flex: 1,
                              padding: '0.7rem',
                              background: '#d97706',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              fontSize: '0.88rem',
                              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                            }}
                          >
                            <BellRing size={18} />
                            <span>🔔 Call for Pickup ({selectedCounter.split(' ')[0]})</span>
                          </button>
                        )}

                        {isReady && (
                          <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMarkDispensed(item);
                              }}
                              style={{
                                flex: 1,
                                padding: '0.7rem',
                                background: '#059669',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.45rem',
                                fontSize: '0.88rem',
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                              }}
                            >
                              <PackageCheck size={18} />
                              <span>📦 Mark Dispensed / Paid</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRevertPreparing(item);
                              }}
                              title="Revert to Preparing"
                              style={{
                                padding: '0.7rem 0.8rem',
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              ↩ Revert
                            </button>
                          </div>
                        )}

                        {isDispensed && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
                            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#059669', fontWeight: 900, padding: '0.55rem', background: '#dcfce7', borderRadius: '8px' }}>
                              ✓ Dispensed at {item.counterNumber || 'Counter 1'}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRevertPreparing(item);
                              }}
                              style={{
                                padding: '0.55rem 0.8rem',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                color: '#475569',
                                cursor: 'pointer'
                              }}
                            >
                              ↺ Reopen
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setReceiptToken(item);
                          }}
                          title="Print Digital Rx Receipt"
                          style={{
                            padding: '0.7rem 0.9rem',
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
                          <Printer size={18} />
                        </button>
                      </div>

                      {item.phoneNumber && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                          <span>📞 Patient: {item.phoneNumber}</span>
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

      {/* TAB 4: Micro-Dark Store Inventory & Batch Stock-In (PRD v5 Module B / F23) */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Inventory Top Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem'
          }}>
            <div className="glass-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>TOTAL INVENTORY SKUs</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0284c7', margin: '0.2rem 0' }}>
                {inventoryList.length} Items
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                Central Master Formulary Synced
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>JAN AUSHADHI GENERIC RATIO</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669', margin: '0.2rem 0' }}>
                70.9%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                Average Out-of-Pocket Savings
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>COLD-CHAIN BIOLOGICALS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7c3aed', margin: '0.2rem 0' }}>
                2 Active Lots
              </div>
              <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700 }}>
                Insulin &amp; Antivenom (2–8°C)
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>EXPIRING &amp; LOW STOCK ALERTS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#e11d48', margin: '0.2rem 0' }}>
                2 Lots Flagged
              </div>
              <span style={{ fontSize: '0.75rem', color: '#e11d48', fontWeight: 700 }}>
                Action required within 30 days
              </span>
            </div>
          </div>

          {/* Inventory Table Container */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  Micro-Dark Store Inventory &amp; Batch Ledger
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Real-time stock across hospital counter, Jan Aushadhi generic reserves, and retail dark-stores.
                </p>
              </div>

              <button
                onClick={() => setShowStockInModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Plus size={18} />
                <span>+ Stock-In New Batch (F23)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Medicine Brand &amp; Salt</th>
                    <th style={{ padding: '0.75rem' }}>Batch &amp; Expiry</th>
                    <th style={{ padding: '0.75rem' }}>In-House Counter</th>
                    <th style={{ padding: '0.75rem' }}>Jan Aushadhi Generic</th>
                    <th style={{ padding: '0.75rem' }}>MRP / Cost</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Quick Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.genericName}</div>
                        <span style={{
                          fontSize: '0.68rem',
                          background: item.isColdChain ? 'rgba(124, 58, 237, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                          color: item.isColdChain ? '#7c3aed' : '#0284c7',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                          display: 'inline-block',
                          marginTop: '3px'
                        }}>
                          {item.category}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 800, color: '#334155', fontFamily: 'monospace' }}>{item.batchNo}</div>
                        <div style={{ fontSize: '0.78rem', color: item.expiringSoon ? '#e11d48' : '#64748b', fontWeight: item.expiringSoon ? 900 : 600 }}>
                          Exp: {item.expiryDate} {item.expiringSoon && '⚠️ EXPIRING SOON'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: item.lowStock ? '#e11d48' : '#0f172a' }}>
                          {item.inHouseStock} {item.unit.split(' ')[0]}
                        </div>
                        {item.lowStock && (
                          <span style={{ fontSize: '0.68rem', color: '#e11d48', fontWeight: 900 }}>
                            ● BUFFER LOW (&lt;50)
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                          {item.janAushadhiStock} {item.unit.split(' ')[0]}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>
                          PMBJP Stock Verified
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a' }}>₹{item.mrp}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Cost: ₹{item.costPrice}</div>
                      </td>

                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => {
                              setInventoryList(prev => prev.map(i => i.id === item.id ? { ...i, inHouseStock: i.inHouseStock + 10 } : i));
                            }}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              fontWeight: 900,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            +10 In
                          </button>
                          <button
                            onClick={() => {
                              setInventoryList(prev => prev.map(i => i.id === item.id ? { ...i, inHouseStock: Math.max(0, i.inHouseStock - 1) } : i));
                            }}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fca5a5',
                              color: '#b91c1c',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              fontWeight: 900,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            -1 Dispense
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: Scheduled Rider & EV Fleet Dispatch Station (PRD v5 Module B / Poster Item 3) */}
      {activeTab === 'dispatch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Bike size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    Hyperlocal Dark-Store &amp; Scheduled EV Rider Station
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    Live management of outgoing 15-minute EV bike deliveries and temperature-controlled cold-chain rider dispatches.
                  </p>
                </div>
              </div>

              <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900 }}>
                ● DISPATCH ENGINE ONLINE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dispatchOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: order.status === 'ON_ROUTE' ? '2px solid #059669' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        🛵
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                        {order.patientName} &bull; Order #{order.id}
                      </strong>
                      <span style={{
                        background: order.status === 'ON_ROUTE' ? '#dbeafe' : order.status === 'PACKING' ? '#fef3c7' : order.status === 'DELIVERED' ? '#dcfce7' : '#ede9fe',
                        color: order.status === 'ON_ROUTE' ? '#1d4ed8' : order.status === 'PACKING' ? '#92400e' : order.status === 'DELIVERED' ? '#166534' : '#6b21a8',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px'
                      }}>
                        {order.status === 'ON_ROUTE' ? '🛵 RIDER ON ROUTE' : order.status === 'PACKING' ? '📦 PHARMACIST PACKING' : order.status === 'DELIVERED' ? '✓ DELIVERED' : '⏰ SCHEDULED SLOT'}
                      </span>
                      {order.slot && (
                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#0369a1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                          {order.slot}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                      📍 {order.address} &bull; Placed: {order.placedAt}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '6px', flexWrap: 'wrap' }}>
                      {order.medicines.map((m, idx) => (
                        <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                          💊 {m}
                        </span>
                      ))}
                    </div>

                    <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#059669', fontWeight: 800 }}>
                      🛵 Assigned Rider: <strong>{order.riderName}</strong> &bull; ❄️ Cold-Bag: {order.bagTemp || '4.5°C Verified'} &bull; 🔒 Doorstep OTP: <span style={{ background: '#0f172a', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>{order.doorstepOtp || '7391'}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>TOTAL AMOUNT</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                        ₹{order.totalAmount}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                        ETA: ~{order.etaMinutes} mins
                      </span>
                    </div>

                    {order.status === 'PACKING' ? (
                      <button
                        onClick={() => {
                          setDispatchOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'ON_ROUTE' } : o));
                          playChime();
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.65rem 1.15rem',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Handover to Rider
                      </button>
                    ) : order.status === 'ON_ROUTE' ? (
                      <button
                        onClick={() => {
                          setDispatchOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'DELIVERED', etaMinutes: 0 } : o));
                        }}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.65rem 1.15rem',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        Verify OTP &amp; Mark Delivered ✓
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 900, background: '#dcfce7', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
                        ✓ Order Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* STOCK-IN BATCH MODAL (F23) */}
      {showStockInModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowStockInModal(false)}
        >
          <div
            className="glass-card"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              color: 'var(--text-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Box size={22} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                  Stock-In New Batch (PRD v5 F23)
                </h3>
              </div>
              <button onClick={() => setShowStockInModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newEntry = {
                  id: `med-${Date.now()}`,
                  name: stockInForm.name,
                  genericName: stockInForm.genericName,
                  category: stockInForm.category,
                  batchNo: stockInForm.batchNo,
                  expiryDate: stockInForm.expiryDate,
                  inHouseStock: parseInt(stockInForm.quantity) || 50,
                  janAushadhiStock: 150,
                  mrp: parseFloat(stockInForm.mrp) || 100,
                  costPrice: parseFloat(stockInForm.costPrice) || 60,
                  unit: stockInForm.unit
                };
                setInventoryList(prev => [newEntry, ...prev]);
                setShowStockInModal(false);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Medicine Brand Name:
                </label>
                <input
                  type="text"
                  value={stockInForm.name}
                  onChange={(e) => setStockInForm(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Active Salt / Generic Composition:
                </label>
                <input
                  type="text"
                  value={stockInForm.genericName}
                  onChange={(e) => setStockInForm(f => ({ ...f, genericName: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Batch Number:
                  </label>
                  <input
                    type="text"
                    value={stockInForm.batchNo}
                    onChange={(e) => setStockInForm(f => ({ ...f, batchNo: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Expiry Date (YYYY-MM):
                  </label>
                  <input
                    type="text"
                    value={stockInForm.expiryDate}
                    onChange={(e) => setStockInForm(f => ({ ...f, expiryDate: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Quantity:
                  </label>
                  <input
                    type="number"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm(f => ({ ...f, quantity: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    MRP (₹):
                  </label>
                  <input
                    type="number"
                    value={stockInForm.mrp}
                    onChange={(e) => setStockInForm(f => ({ ...f, mrp: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Cost (₹):
                  </label>
                  <input
                    type="number"
                    value={stockInForm.costPrice}
                    onChange={(e) => setStockInForm(f => ({ ...f, costPrice: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Commit Batch to Micro-Inventory (ACID Ledger)
              </button>
            </form>
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
