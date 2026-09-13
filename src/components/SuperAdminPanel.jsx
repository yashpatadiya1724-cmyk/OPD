import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Activity, 
  Users, 
  Search,
  Filter,
  Plus,
  Trash2,
  Stethoscope,
  MapPin,
  Clock,
  Phone,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import { 
  subscribeHospitals, 
  subscribeDoctorList, 
  subscribeReviews, 
  subscribeAppointments,
  onboardHospital,
  deleteHospital,
  addDoctorDirectly,
  seedDemoData,
  db 
} from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function SuperAdminPanel() {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [allTokens, setAllTokens] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'hospitals' | 'reviews' | 'payouts'
  const [searchHospQuery, setSearchHospQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Onboard Hospital Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [hospForm, setHospForm] = useState({
    name: '',
    tagline: 'Premier Multi-Speciality Healthcare & Emergency Centre',
    address: 'Ring Road, Sector 12, New Delhi',
    city: 'New Delhi',
    distance: '2.5 km',
    avgWaitMinutes: 15,
    rating: 4.8,
    reviewsCount: 120,
    specialties: 'General Medicine, Pediatrics & Child Health, Orthopedics, Cardiology',
    timing: '24x7 Emergency | OPD: 8:30 AM - 6:30 PM',
    features: 'Live Token Tracker, Digital Prescription, Express Pharmacy, Zero-Wait OPD',
    contactPhone: '011-28905566',
    commissionRate: 10,
    licenseNumber: 'NABH-DL-2026-99',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
  });

  // Manage Doctors under Hospital Modal State
  const [manageHospitalDoctors, setManageHospitalDoctors] = useState(null);
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'General Medicine',
    qualification: 'MBBS, MD',
    councilRegistration: 'MCI-88129-DL',
    experienceYears: 10,
    roomNumber: 'Room 101',
    floorWing: 'Ground Floor, OPD Wing A',
    timingSlot: '09:00 AM - 01:30 PM',
    avgConsultationMinutes: 12,
    consultationFee: 500,
    bio: 'Dedicated medical clinician providing compassionate OPD care.'
  });

  useEffect(() => {
    const unsubHosp = subscribeHospitals(setHospitals);
    const unsubDocs = subscribeDoctorList(setDoctors);
    const unsubRev = subscribeReviews(setReviews);
    const unsubApt = subscribeAppointments(setAppointments);

    return () => {
      unsubHosp();
      unsubDocs();
      unsubRev();
      unsubApt();
    };
  }, []);

  useEffect(() => {
    if (doctors.length === 0) return;
    const unsubs = doctors.map(doc => {
      const colRef = collection(db, 'doctors', doc.id, 'tokens');
      return onSnapshot(colRef, (snap) => {
        const tokens = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllTokens(prev => ({ ...prev, [doc.id]: tokens }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [doctors]);

  // Aggregate Metrics Across All Hospitals
  let totalMarketplaceTokens = 0;
  let totalServedPatients = 0;
  Object.values(allTokens).forEach(tList => {
    totalMarketplaceTokens += tList.length;
    totalServedPatients += tList.filter(t => t.status === 'completed').length;
  });

  const totalBookings = totalMarketplaceTokens + appointments.length;
  const estimatedAverageFee = 600;
  const platformGMV = (totalServedPatients + appointments.length) * estimatedAverageFee;
  const platformCommissionRevenue = Math.round(platformGMV * 0.10); // 10% take-rate
  const hospitalNetPayouts = platformGMV - platformCommissionRevenue;

  const handleOnboardHospital = async (e) => {
    e.preventDefault();
    if (!hospForm.name.trim()) {
      alert('Please enter Hospital Name');
      return;
    }

    setActionLoading(true);
    try {
      const created = await onboardHospital({
        ...hospForm,
        name: hospForm.name.trim()
      });
      setFeedback({
        type: 'success',
        message: `✓ Successfully Onboarded "${created.name}" to MediQ Network!`
      });
      setShowOnboardModal(false);
      setHospForm({
        name: '',
        tagline: 'Premier Multi-Speciality Healthcare & Emergency Centre',
        address: 'Ring Road, Sector 12, New Delhi',
        city: 'New Delhi',
        distance: '2.5 km',
        avgWaitMinutes: 15,
        rating: 4.8,
        reviewsCount: 120,
        specialties: 'General Medicine, Pediatrics & Child Health, Orthopedics, Cardiology',
        timing: '24x7 Emergency | OPD: 8:30 AM - 6:30 PM',
        features: 'Live Token Tracker, Digital Prescription, Express Pharmacy, Zero-Wait OPD',
        contactPhone: '011-28905566',
        commissionRate: 10,
        licenseNumber: 'NABH-DL-2026-99',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
      });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to onboard hospital: ' + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHospital = async (hospId, hospName) => {
    if (!window.confirm(`Are you sure you want to remove "${hospName}" from MediQ?`)) return;
    try {
      await deleteHospital(hospId);
      setFeedback({ type: 'success', message: `✓ Removed "${hospName}".` });
      if (manageHospitalDoctors?.id === hospId) setManageHospitalDoctors(null);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to remove hospital.' });
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.name.trim() || !manageHospitalDoctors) {
      alert('Please enter Doctor Name');
      return;
    }

    setActionLoading(true);
    try {
      await addDoctorDirectly({
        ...docForm,
        name: docForm.name.trim(),
        hospitalId: manageHospitalDoctors.id,
        hospitalName: manageHospitalDoctors.name,
        status: 'approved'
      });
      setFeedback({
        type: 'success',
        message: `✓ Successfully added ${docForm.name} under ${manageHospitalDoctors.name}!`
      });
      setShowAddDoctorForm(false);
      setDocForm({
        name: '',
        email: '',
        phone: '',
        department: 'General Medicine',
        qualification: 'MBBS, MD',
        councilRegistration: `MCI-${Math.floor(10000 + Math.random() * 90000)}-DL`,
        experienceYears: 10,
        roomNumber: 'Room 101',
        floorWing: 'Ground Floor, OPD Wing A',
        timingSlot: '09:00 AM - 01:30 PM',
        avgConsultationMinutes: 12,
        consultationFee: 500,
        bio: 'Dedicated medical clinician providing compassionate OPD care.'
      });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to add doctor: ' + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReSeedEcosystem = async () => {
    if (!window.confirm('Re-seed all 4 Demo Hospitals with full unique doctor rosters and live tokens?')) return;
    setActionLoading(true);
    try {
      await seedDemoData();
      setFeedback({ type: 'success', message: '✓ Successfully seeded all hospitals & doctors with distinct rosters!' });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to re-seed demo data.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => {
    const q = searchHospQuery.toLowerCase();
    return !q || h.name.toLowerCase().includes(q) || (h.address && h.address.toLowerCase().includes(q));
  });

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '1rem 0 3rem' }}>
      
      {/* Super Admin Top Header */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #090d16 0%, #334155 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.75rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
          }}>
            🌐
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              <span>✓</span> MediQ Platform Operator Console
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#090d16', margin: '0 0 0.2rem' }}>
              Super Admin / Marketplace Overview
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 700, margin: 0 }}>
              Multi-hospital network governance, hospital onboarding, distinct clinician rosters &amp; commission payouts
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '0.55rem',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'overview' ? '#090d16' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#475569'
            }}
          >
            📊 GMV &amp; Network Health
          </button>
          <button
            onClick={() => setActiveTab('hospitals')}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '0.55rem',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'hospitals' ? '#090d16' : 'transparent',
              color: activeTab === 'hospitals' ? '#ffffff' : '#475569'
            }}
          >
            🏥 Onboarded Hospitals ({hospitals.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '0.55rem',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'reviews' ? '#090d16' : 'transparent',
              color: activeTab === 'reviews' ? '#ffffff' : '#475569'
            }}
          >
            ⭐ Verified Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {feedback.message && (
        <div style={{
          background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1.5px solid ${feedback.type === 'success' ? '#16a34a' : '#ef4444'}`,
          color: feedback.type === 'success' ? '#166534' : '#991b1b',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          fontWeight: 800,
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div>
          {/* Top 4 KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.35rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>
                  Platform GMV (Gross)
                </span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.45rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 900 }}>
                  ₹ INR
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#090d16', letterSpacing: '-0.02em' }}>
                ₹{platformGMV.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 800, marginTop: '0.35rem' }}>
                ↑ 14.8% from yesterday across {hospitals.length} partner hospitals
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.35rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>
                  MediQ Take-Rate (10%)
                </span>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.45rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 900 }}>
                  NET COMMISSION
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0284c7', letterSpacing: '-0.02em' }}>
                ₹{platformCommissionRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '0.35rem' }}>
                Automated ABDM / UPI split escrow
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.35rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Consultations
                </span>
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.45rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 900 }}>
                  TOKENS + SLOTS
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#090d16', letterSpacing: '-0.02em' }}>
                {totalBookings}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '0.35rem' }}>
                {totalServedPatients} completed • {totalMarketplaceTokens - totalServedPatients} in queue
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.35rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>
                  Active Clinicians
                </span>
                <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.2rem 0.45rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 900 }}>
                  VERIFIED
                </span>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.02em' }}>
                {doctors.filter(d => d.status === 'approved' || !d.status).length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '0.35rem' }}>
                {doctors.filter(d => d.status === 'pending').length} pending KYC verification
              </div>
            </div>

          </div>

          {/* Quick Actions Bar */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#090d16' }}>
                Hospital Ecosystem Quick Operations
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Onboard new medical centers, assign doctors to distinct hospitals, or refresh all demo queues.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowOnboardModal(true)}
                style={{
                  background: '#090d16',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.6rem',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(9, 13, 22, 0.15)'
                }}
              >
                <Plus size={16} />
                <span>+ Onboard New Hospital</span>
              </button>
              <button
                onClick={handleReSeedEcosystem}
                disabled={actionLoading}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '0.65rem 1.1rem',
                  borderRadius: '0.6rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <RefreshCw size={15} />
                <span>↺ Re-Seed All Hospital Doctors</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITALS DIRECTORY */}
      {activeTab === 'hospitals' && (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#090d16', margin: '0 0 0.25rem' }}>
                Onboarded Hospital Network &amp; Dedicated Clinician Rosters ({hospitals.length})
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                Each hospital maintains its own verified clinician team, OPD schedule, and location.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '0.6rem', border: '1px solid #cbd5e1' }}>
                <Search size={16} color="#64748b" style={{ marginRight: '0.4rem' }} />
                <input
                  type="text"
                  placeholder="Search hospital..."
                  value={searchHospQuery}
                  onChange={(e) => setSearchHospQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>

              <button
                onClick={() => setShowOnboardModal(true)}
                style={{
                  background: '#090d16',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '0.6rem',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} />
                <span>+ Onboard Hospital</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {filteredHospitals.map(h => {
              const hospDoctors = doctors.filter(d => d.hospitalId === h.id);
              const approvedHospDoctors = hospDoctors.filter(d => d.status === 'approved' || !d.status);

              return (
                <div 
                  key={h.id} 
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 900, color: '#090d16', fontSize: '1.15rem' }}>{h.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <MapPin size={13} /> {h.address}
                        </div>
                      </div>
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                        LIVE
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, margin: '0.35rem 0 0.85rem', lineHeight: 1.4 }}>
                      {h.tagline || 'Leading Multi-Speciality Healthcare & Research Facility'}
                    </p>

                    {/* Hospital Info Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      <span style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
                        ⭐ {h.rating || 4.8} ({h.reviewsCount || 100}+ reviews)
                      </span>
                      <span style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#0284c7' }}>
                        ⏱ ~{h.avgWaitMinutes || 15}m Avg Wait
                      </span>
                      <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, color: '#047857' }}>
                        10% Comm.
                      </span>
                    </div>

                    {/* Specialties Pills */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Specialities:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {(Array.isArray(h.specialties) ? h.specialties : ['General Medicine', 'Pediatrics']).slice(0, 3).map((s, idx) => (
                          <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => setManageHospitalDoctors(h)}
                      style={{
                        flex: 1,
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '0.5rem',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Stethoscope size={15} />
                      <span>👨‍⚕️ Clinicians ({approvedHospDoctors.length})</span>
                    </button>

                    <button
                      onClick={() => handleDeleteHospital(h.id, h.name)}
                      title="Remove Hospital"
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED REVIEWS */}
      {activeTab === 'reviews' && (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#090d16', margin: '0 0 1rem' }}>
            Verified Post-Visit Patient Reviews (MediQ PRD Section 9.10)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {reviews.map(rev => (
              <div key={rev.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 900, color: '#090d16' }}>{rev.patientName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                      Consulted with <strong style={{ color: '#0284c7' }}>{rev.doctorName}</strong>
                    </div>
                  </div>
                  <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontWeight: 900, fontSize: '0.85rem' }}>
                    ★ {rev.rating}.0
                  </div>
                </div>
                <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: '#334155', fontWeight: 600, lineHeight: 1.45 }}>
                  "{rev.comment}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>
                  <span>🏥 {rev.hospitalName}</span>
                  <span style={{ color: '#059669' }}>✓ Verified Patient Visit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ONBOARD NEW HOSPITAL */}
      {showOnboardModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 13, 22, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '1.25rem',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase' }}>
                  HOSPITAL NETWORK EXPANSION
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#090d16', margin: '0.2rem 0 0' }}>
                  🏥 Onboard New Hospital Facility
                </h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardHospital}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Max Super Speciality, Fortis, AIIMS"
                    value={hospForm.name}
                    onChange={(e) => setHospForm({ ...hospForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Tagline &amp; Speciality Highlights
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Premier Trauma, Multi-Speciality &amp; Robotic Surgery Centre"
                    value={hospForm.tagline}
                    onChange={(e) => setHospForm({ ...hospForm, tagline: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                      City / Sector
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={hospForm.city}
                      onChange={(e) => setHospForm({ ...hospForm, city: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                      Distance
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.8 km"
                      value={hospForm.distance}
                      onChange={(e) => setHospForm({ ...hospForm, distance: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Full Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 4, Ring Road, Sector 14, New Delhi"
                    value={hospForm.address}
                    onChange={(e) => setHospForm({ ...hospForm, address: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Specialties (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="General Medicine, Pediatrics, Orthopedics, Cardiology, Dermatology"
                    value={hospForm.specialties}
                    onChange={(e) => setHospForm({ ...hospForm, specialties: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                      NABH / State License #
                    </label>
                    <input
                      type="text"
                      placeholder="NABH-DL-2026-09"
                      value={hospForm.licenseNumber}
                      onChange={(e) => setHospForm({ ...hospForm, licenseNumber: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="011-28901234"
                      value={hospForm.contactPhone}
                      onChange={(e) => setHospForm({ ...hospForm, contactPhone: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    background: '#090d16',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.9rem',
                    borderRadius: '0.65rem',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(9, 13, 22, 0.2)'
                  }}
                >
                  {actionLoading ? 'Onboarding Hospital...' : '✓ Complete Hospital Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE DOCTORS UNDER HOSPITAL */}
      {manageHospitalDoctors && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 13, 22, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '1.25rem',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase' }}>
                  HOSPITAL CLINICIAN ROSTER
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#090d16', margin: '0.2rem 0' }}>
                  👨‍⚕️ Doctors at {manageHospitalDoctors.name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  {manageHospitalDoctors.address}
                </p>
              </div>
              <button
                onClick={() => { setManageHospitalDoctors(null); setShowAddDoctorForm(false); }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {/* Existing Doctors List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#090d16' }}>
                  Assigned Clinicians ({doctors.filter(d => d.hospitalId === manageHospitalDoctors.id).length})
                </span>
                <button
                  onClick={() => setShowAddDoctorForm(!showAddDoctorForm)}
                  style={{
                    background: showAddDoctorForm ? '#f1f5f9' : '#090d16',
                    color: showAddDoctorForm ? '#090d16' : '#ffffff',
                    border: 'none',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {showAddDoctorForm ? '✕ Cancel' : '+ Add New Clinician'}
                </button>
              </div>

              {/* Add Doctor Form (Toggleable) */}
              {showAddDoctorForm && (
                <form onSubmit={handleAddDoctorSubmit} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 900, color: '#090d16' }}>
                    + Register Doctor under {manageHospitalDoctors.name}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>Doctor Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Full Name"
                        value={docForm.name}
                        onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>Department / Speciality</label>
                      <input
                        type="text"
                        placeholder="General Medicine, Pediatrics, etc."
                        value={docForm.department}
                        onChange={(e) => setDocForm({ ...docForm, department: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>MCI Council Reg. (KYC)</label>
                      <input
                        type="text"
                        placeholder="MCI-12345-DL"
                        value={docForm.councilRegistration}
                        onChange={(e) => setDocForm({ ...docForm, councilRegistration: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>OPD Room &amp; Floor</label>
                      <input
                        type="text"
                        placeholder="Room 102 (OPD Wing A)"
                        value={docForm.roomNumber}
                        onChange={(e) => setDocForm({ ...docForm, roomNumber: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>OPD Timings</label>
                      <input
                        type="text"
                        placeholder="09:00 AM - 01:30 PM"
                        value={docForm.timingSlot}
                        onChange={(e) => setDocForm({ ...docForm, timingSlot: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>Consult Fee (₹)</label>
                      <input
                        type="number"
                        placeholder="600"
                        value={docForm.consultationFee}
                        onChange={(e) => setDocForm({ ...docForm, consultationFee: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    ✓ Add Clinician to Hospital Roster
                  </button>
                </form>
              )}

              {/* Doctors List under this hospital */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {doctors
                  .filter(d => d.hospitalId === manageHospitalDoctors.id)
                  .map(doc => (
                    <div 
                      key={doc.id}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '0.75rem',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, color: '#090d16', fontSize: '0.95rem' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                          {doc.department} • {doc.qualification}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800, marginTop: '0.2rem' }}>
                          📍 {doc.roomNumber} ({doc.timingSlot})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
                          ₹{doc.consultationFee || 500}
                        </div>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '1rem',
                          background: doc.status === 'approved' ? '#dcfce7' : '#ffedd5',
                          color: doc.status === 'approved' ? '#15803d' : '#c2410c'
                        }}>
                          {doc.status ? doc.status.toUpperCase() : 'APPROVED'}
                        </span>
                      </div>
                    </div>
                  ))}

                {doctors.filter(d => d.hospitalId === manageHospitalDoctors.id).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontWeight: 600 }}>
                    No doctors assigned to this facility yet. Click "+ Add New Clinician" to register doctors.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
