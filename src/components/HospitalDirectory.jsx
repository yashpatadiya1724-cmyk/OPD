import React, { useState, useEffect } from 'react';
import { 
  subscribeHospitals, 
  subscribeDoctorList, 
  SYMPTOM_MAP,
  onboardHospital,
  addDoctorDirectly
} from '../firebase';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  Sparkles, 
  Star,
  X,
  Phone
} from 'lucide-react';

export default function HospitalDirectory({ onSelectHospital, activeHospitalId }) {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [filterWait, setFilterWait] = useState(false);
  const [modalHospital, setModalHospital] = useState(null);
  
  // Hospital Onboarding Modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Onboard form state
  const [hospForm, setHospForm] = useState({
    name: '',
    tagline: 'Premier Multi-Speciality Healthcare & Trauma Centre',
    address: 'Ring Road, Sector 15, New Delhi',
    city: 'New Delhi',
    distance: '2.0 km',
    avgWaitMinutes: 12,
    rating: 4.9,
    reviewsCount: 150,
    specialties: 'General Medicine, Pediatrics & Child Health, Orthopedics, Cardiology',
    timing: '24x7 Emergency | OPD: 8:00 AM - 6:00 PM',
    features: 'Live Token Tracker, Digital Prescription, Express Pharmacy, Instant Room Alert',
    contactPhone: '011-28905566',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    // Optional Initial Doctor
    doctorName: '',
    doctorDept: 'General Medicine',
    doctorFee: 500,
    doctorRoom: 'Room 101'
  });

  // Add Doctor to specific hospital modal state
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [newDocForm, setNewDocForm] = useState({
    name: '',
    department: 'General Medicine',
    qualification: 'MBBS, MD',
    councilRegistration: '',
    roomNumber: 'Room 102',
    timingSlot: '09:00 AM - 01:30 PM',
    consultationFee: 500
  });

  useEffect(() => {
    const unsubHosp = subscribeHospitals((list) => {
      setHospitals(list);
    });
    const unsubDocs = subscribeDoctorList((list) => {
      setDoctors(list);
    });
    return () => {
      unsubHosp();
      unsubDocs();
    };
  }, []);

  const symptomPills = [
    { label: '🤒 Fever & Flu', spec: 'General Medicine' },
    { label: '🫀 Chest Pain / Heart', spec: 'Cardiology & Chest Clinic' },
    { label: '🦴 Joint / Knee Pain', spec: 'Orthopedics & Joint Care' },
    { label: '👶 Child & Infant Care', spec: 'Pediatrics & Child Health' },
    { label: '🧠 Migraine & Neuro', spec: 'Neurology & Brain Sciences' },
    { label: '🧴 Skin Rash / Acne', spec: 'Dermatology & Cosmetology' }
  ];

  // Map user search query to symptoms if query matches
  const resolvedSymptomSpecialty = Object.entries(SYMPTOM_MAP).find(([symptom]) => 
    searchQuery.trim().toLowerCase().includes(symptom)
  )?.[1];

  const filteredHospitals = hospitals.filter((hosp) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      hosp.name.toLowerCase().includes(query) ||
      hosp.address.toLowerCase().includes(query) ||
      (hosp.specialties && hosp.specialties.some(s => s.toLowerCase().includes(query))) ||
      (resolvedSymptomSpecialty && hosp.specialties && hosp.specialties.some(s => s.toLowerCase().includes(resolvedSymptomSpecialty.toLowerCase())));

    const matchesSpecialty = 
      selectedSpecialty === 'All' || 
      (hosp.specialties && hosp.specialties.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase())));

    const matchesWait = !filterWait || hosp.avgWaitMinutes <= 15;

    return matchesQuery && matchesSpecialty && matchesWait;
  });

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!hospForm.name.trim()) {
      alert('Please enter Hospital Name');
      return;
    }

    setActionLoading(true);
    try {
      const createdHosp = await onboardHospital({
        name: hospForm.name.trim(),
        tagline: hospForm.tagline,
        address: hospForm.address,
        city: hospForm.city,
        distance: hospForm.distance,
        avgWaitMinutes: Number(hospForm.avgWaitMinutes) || 12,
        rating: Number(hospForm.rating) || 4.8,
        reviewsCount: Number(hospForm.reviewsCount) || 100,
        specialties: hospForm.specialties,
        timing: hospForm.timing,
        features: hospForm.features,
        contactPhone: hospForm.contactPhone,
        image: hospForm.image
      });

      // If lead doctor is provided, create doctor under this hospital
      if (hospForm.doctorName.trim()) {
        await addDoctorDirectly({
          name: hospForm.doctorName.trim(),
          department: hospForm.doctorDept || 'General Medicine',
          hospitalId: createdHosp.id,
          hospitalName: createdHosp.name,
          consultationFee: Number(hospForm.doctorFee) || 500,
          roomNumber: hospForm.doctorRoom || 'Room 101',
          status: 'approved'
        });
      }

      setFeedback({
        type: 'success',
        message: `✓ Successfully Onboarded "${createdHosp.name}"! It is now live in the marketplace.`
      });
      setShowOnboardModal(false);
      setHospForm({
        name: '',
        tagline: 'Premier Multi-Speciality Healthcare & Trauma Centre',
        address: 'Ring Road, Sector 15, New Delhi',
        city: 'New Delhi',
        distance: '2.0 km',
        avgWaitMinutes: 12,
        rating: 4.9,
        reviewsCount: 150,
        specialties: 'General Medicine, Pediatrics & Child Health, Orthopedics, Cardiology',
        timing: '24x7 Emergency | OPD: 8:00 AM - 6:00 PM',
        features: 'Live Token Tracker, Digital Prescription, Express Pharmacy, Instant Room Alert',
        contactPhone: '011-28905566',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
        doctorName: '',
        doctorDept: 'General Medicine',
        doctorFee: 500,
        doctorRoom: 'Room 101'
      });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to onboard hospital: ' + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDoctorToModalHosp = async (e) => {
    e.preventDefault();
    if (!newDocForm.name.trim() || !modalHospital) {
      alert('Please enter doctor name');
      return;
    }

    setActionLoading(true);
    try {
      await addDoctorDirectly({
        ...newDocForm,
        name: newDocForm.name.trim(),
        hospitalId: modalHospital.id,
        hospitalName: modalHospital.name,
        councilRegistration: newDocForm.councilRegistration || `MCI-${Math.floor(10000 + Math.random() * 90000)}-DL`,
        status: 'approved'
      });
      setShowAddDocForm(false);
      setNewDocForm({
        name: '',
        department: 'General Medicine',
        qualification: 'MBBS, MD',
        councilRegistration: '',
        roomNumber: 'Room 102',
        timingSlot: '09:00 AM - 01:30 PM',
        consultationFee: 500
      });
      setFeedback({
        type: 'success',
        message: `✓ Added ${newDocForm.name} to ${modalHospital.name} roster!`
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add doctor: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      
      {/* Feedback notification */}
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

      {/* Hero MediQ Marketplace Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '1.5rem',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 20px 35px -10px rgba(9, 13, 22, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#38bdf8' }}>
            <span>🏥</span> MediQ · Multi-Hospital OPD Marketplace
          </div>

          {/* MAIN + ONBOARD NEW HOSPITAL BUTTON */}
          <button
            onClick={() => setShowOnboardModal(true)}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.35rem',
              borderRadius: '0.75rem',
              fontWeight: 900,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 18px rgba(5, 150, 105, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={18} />
            <span>+ Add / Onboard New Hospital</span>
          </button>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '0.75rem', color: '#ffffff' }}>
          Discover a hospital, pick a doctor &amp; track your OPD token live.
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '720px', fontWeight: 600, lineHeight: 1.5, marginBottom: '1.75rem' }}>
          Just like you browse restaurants and track food orders — MediQ lets you compare hospital OPD wait times, book slots, and walk in right when your turn arrives.
        </p>

        {/* Search Bar with Symptom Detection */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          background: '#ffffff',
          padding: '0.5rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          maxWidth: '820px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 320px', padding: '0.5rem 0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by hospital, doctor, specialty or symptoms (e.g. 'rash', 'chest pain', 'fever')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#090d16',
                width: '100%',
                background: 'transparent'
              }}
            />
          </div>
          {resolvedSymptomSpecialty && (
            <div style={{ display: 'flex', alignItems: 'center', background: '#ecfdf5', color: '#065f46', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 900 }}>
              <span>✓ Routed to {resolvedSymptomSpecialty}</span>
            </div>
          )}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 800, color: '#475569' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Symptom Quick Routing Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          🩺 Symptom-to-Specialty Smart Routing:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {symptomPills.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedSpecialty(item.spec);
                setSearchQuery('');
              }}
              style={{
                background: selectedSpecialty === item.spec ? '#0284c7' : '#ffffff',
                color: selectedSpecialty === item.spec ? '#ffffff' : '#090d16',
                border: selectedSpecialty === item.spec ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                padding: '0.45rem 0.85rem',
                borderRadius: '2rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Filter Bar & Onboard Quick Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        background: '#ffffff',
        padding: '0.85rem 1.25rem',
        borderRadius: '1rem',
        border: '1.5px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569' }}>
            Filter Specialty:
          </span>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#090d16',
              outline: 'none'
            }}
          >
            <option value="All">All Specialties</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Pediatrics">Pediatrics &amp; Child Health</option>
            <option value="Orthopedics">Orthopedics &amp; Joint Care</option>
            <option value="Cardiology">Cardiology &amp; Chest</option>
            <option value="Neurology">Neurology</option>
            <option value="Dermatology">Dermatology</option>
          </select>

          <button
            onClick={() => setFilterWait(!filterWait)}
            style={{
              background: filterWait ? '#ecfdf5' : '#f8fafc',
              border: filterWait ? '1.5px solid #10b981' : '1px solid #cbd5e1',
              color: filterWait ? '#047857' : '#475569',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⚡ Wait &lt; 15 mins only
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>
            Showing <strong>{filteredHospitals.length}</strong> Partner Hospitals
          </div>
          <button
            onClick={() => setShowOnboardModal(true)}
            style={{
              background: '#090d16',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.95rem',
              borderRadius: '0.5rem',
              fontWeight: 900,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Plus size={15} />
            <span>+ Add Hospital</span>
          </button>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem' }}>
        {filteredHospitals.map((hosp) => {
          const approvedHospDoctors = doctors.filter(d => d.hospitalId === hosp.id && (d.status === 'approved' || !d.status));
          const isCurrentlyActive = activeHospitalId === hosp.id;

          // Compute wait-time band per MediQ PRD Section 9.1
          const waitBand = hosp.avgWaitMinutes <= 12 ? 'Low Wait' : (hosp.avgWaitMinutes <= 20 ? 'Medium Wait' : 'High Traffic');
          const waitColor = hosp.avgWaitMinutes <= 12 ? '#059669' : (hosp.avgWaitMinutes <= 20 ? '#0284c7' : '#d97706');
          const waitBg = hosp.avgWaitMinutes <= 12 ? '#ecfdf5' : (hosp.avgWaitMinutes <= 20 ? '#eff6ff' : '#fffbeb');

          return (
            <div
              key={hosp.id}
              style={{
                background: '#ffffff',
                border: isCurrentlyActive ? '2.5px solid #0284c7' : '1.5px solid #e2e8f0',
                borderRadius: '1.25rem',
                overflow: 'hidden',
                boxShadow: isCurrentlyActive 
                  ? '0 12px 28px -6px rgba(2, 132, 199, 0.25)' 
                  : '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Image & Badges */}
              <div style={{ position: 'relative', height: '175px', background: '#f1f5f9', overflow: 'hidden' }}>
                <img
                  src={hosp.image}
                  alt={hosp.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Rating Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#047857',
                  color: '#ffffff',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '0.6rem',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}>
                  <span>★</span> {hosp.rating}
                  <span style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 700 }}>({hosp.reviewsCount || 1200})</span>
                </div>

                {/* Distance Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(9, 13, 22, 0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '0.6rem',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span>📍</span> {hosp.distance}
                </div>

                {/* Live Wait-Time Band Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: waitBg,
                  color: waitColor,
                  border: `1px solid ${waitColor}40`,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.5rem',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: waitColor }} />
                  <span>~{hosp.avgWaitMinutes}m ({waitBand})</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#090d16', margin: 0, letterSpacing: '-0.01em' }}>
                    {hosp.name}
                  </h3>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                  {hosp.tagline}
                </p>

                <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  <MapPin size={14} color="#64748b" />
                  <span>{hosp.address}</span>
                </div>

                {/* Speciality Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.1rem' }}>
                  {(Array.isArray(hosp.specialties) ? hosp.specialties : ['General Medicine', 'Pediatrics']).map((spec, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '0.4rem'
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Booking Modes Support */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.55rem', borderRadius: '0.4rem' }}>
                    ⚡ Instant Walk-In
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '0.2rem 0.55rem', borderRadius: '0.4rem' }}>
                    📅 Slot Booking
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={() => setModalHospital(hosp)}
                    style={{
                      flex: 1,
                      background: '#f1f5f9',
                      color: '#090d16',
                      border: '1px solid #cbd5e1',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    👨‍⚕️ Clinicians ({approvedHospDoctors.length})
                  </button>
                  <button
                    onClick={() => onSelectHospital(hosp)}
                    style={{
                      flex: 2,
                      background: isCurrentlyActive ? '#0284c7' : '#090d16',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(9, 13, 22, 0.15)'
                    }}
                  >
                    <span>{isCurrentlyActive ? '✓ Book OPD Token' : '🏥 Book at this Facility'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: HOSPITAL CLINICIANS DETAIL MODAL */}
      {modalHospital && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 13, 22, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '1.25rem',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase' }}>
                  HOSPITAL OPD CLINICIAN ROSTER
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#090d16', margin: '0.2rem 0' }}>
                  {modalHospital.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, margin: 0 }}>
                  {modalHospital.address} · ⭐ {modalHospital.rating} Rating
                </p>
              </div>
              <button
                onClick={() => { setModalHospital(null); setShowAddDocForm(false); }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#090d16', margin: 0 }}>
                  Active Verified Doctors ({doctors.filter(d => d.hospitalId === modalHospital.id && (d.status === 'approved' || !d.status)).length})
                </h4>
                <button
                  onClick={() => setShowAddDocForm(!showAddDocForm)}
                  style={{
                    background: '#090d16',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.4rem',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  {showAddDocForm ? '✕ Cancel' : '+ Add Doctor to Roster'}
                </button>
              </div>

              {/* Add doctor directly from modal */}
              {showAddDocForm && (
                <form onSubmit={handleAddDoctorToModalHosp} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1.5px solid #cbd5e1', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>Doctor Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Full Name"
                        value={newDocForm.name}
                        onChange={(e) => setNewDocForm({ ...newDocForm, name: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>Department</label>
                      <input
                        type="text"
                        placeholder="General Medicine, Pediatrics, etc."
                        value={newDocForm.department}
                        onChange={(e) => setNewDocForm({ ...newDocForm, department: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>Room Number</label>
                      <input
                        type="text"
                        placeholder="Room 102"
                        value={newDocForm.roomNumber}
                        onChange={(e) => setNewDocForm({ ...newDocForm, roomNumber: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>Consultation Fee (₹)</label>
                      <input
                        type="number"
                        placeholder="500"
                        value={newDocForm.consultationFee}
                        onChange={(e) => setNewDocForm({ ...newDocForm, consultationFee: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
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
                      padding: '0.55rem',
                      borderRadius: '0.4rem',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Save Clinician
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {doctors
                  .filter(d => d.hospitalId === modalHospital.id && (d.status === 'approved' || !d.status))
                  .map(doc => (
                    <div key={doc.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 900, color: '#090d16', fontSize: '0.95rem' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{doc.department} · {doc.qualification}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 800, marginTop: '0.2rem' }}>
                          📍 {doc.roomNumber} ({doc.timingSlot})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>₹{doc.consultationFee || 500}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Consult Fee</div>
                      </div>
                    </div>
                  ))}

                {doctors.filter(d => d.hospitalId === modalHospital.id && (d.status === 'approved' || !d.status)).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontWeight: 600 }}>
                    No clinicians assigned yet. Click "+ Add Doctor to Roster" above!
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onSelectHospital(modalHospital);
                setModalHospital(null);
              }}
              style={{
                width: '100%',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem',
                borderRadius: '0.75rem',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Select Hospital &amp; Book Token →
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ONBOARD NEW HOSPITAL MODAL */}
      {showOnboardModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 13, 22, 0.75)',
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

            <form onSubmit={handleOnboardSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lilavati Hospital, AIIMS, Medanta"
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
                      placeholder="e.g. New Delhi / Mumbai"
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

                {/* Optional Lead Doctor */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    👨‍⚕️ Optional: Add Lead Clinician (First Doctor)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Doctor Name (e.g. Dr. A. K. Roy)"
                      value={hospForm.doctorName}
                      onChange={(e) => setHospForm({ ...hospForm, doctorName: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                    <input
                      type="text"
                      placeholder="Speciality (e.g. General Medicine)"
                      value={hospForm.doctorDept}
                      onChange={(e) => setHospForm({ ...hospForm, doctorDept: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Room Number (e.g. Room 101)"
                      value={hospForm.doctorRoom}
                      onChange={(e) => setHospForm({ ...hospForm, doctorRoom: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                    <input
                      type="number"
                      placeholder="Consult Fee ₹ (e.g. 500)"
                      value={hospForm.doctorFee}
                      onChange={(e) => setHospForm({ ...hospForm, doctorFee: e.target.value })}
                      style={{ padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.9rem',
                    borderRadius: '0.65rem',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {actionLoading ? 'Onboarding Hospital...' : '✓ Complete Hospital Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
