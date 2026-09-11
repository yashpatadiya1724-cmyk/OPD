import React, { useState, useEffect } from 'react';
import { subscribeHospitals, subscribeDoctorList, SYMPTOM_MAP } from '../firebase';

export default function HospitalDirectory({ onSelectHospital, activeHospitalId }) {
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [filterWait, setFilterWait] = useState(false);
  const [modalHospital, setModalHospital] = useState(null);

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

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
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

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem', color: '#38bdf8' }}>
          <span>🏥</span> MediQ · Multi-Hospital OPD Marketplace
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
          <button
            onClick={() => { setSelectedSpecialty('All'); setSearchQuery(''); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '2rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: selectedSpecialty === 'All' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: selectedSpecialty === 'All' ? '#0284c7' : '#ffffff',
              color: selectedSpecialty === 'All' ? '#ffffff' : '#090d16'
            }}
          >
            All Hospitals
          </button>
          {symptomPills.map((pill) => {
            const isSelected = selectedSpecialty === pill.spec;
            return (
              <button
                key={pill.label}
                onClick={() => setSelectedSpecialty(isSelected ? 'All' : pill.spec)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '2rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#e0f2fe' : '#ffffff',
                  color: isSelected ? '#0369a1' : '#090d16',
                  transition: 'all 0.15s ease'
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem' }}>
        {filteredHospitals.map((hosp) => {
          const approvedHospDoctors = doctors.filter(d => d.hospitalId === hosp.id && d.status === 'approved');
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
                  border: `1.5px solid ${waitColor}`,
                  color: waitColor,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '0.6rem',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span>⏱️ {waitBand} (~{hosp.avgWaitMinutes} mins)</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#090d16', margin: '0 0 0.35rem', lineHeight: 1.25 }}>
                  {hosp.name}
                </h3>

                <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                  {hosp.tagline}
                </p>

                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.85rem' }}>
                  <span>🏢</span> {hosp.address}
                </div>

                {/* Specialties Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {hosp.specialties && hosp.specialties.map((spec) => (
                    <span
                      key={spec}
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

                {/* Booking Modes Support (PRD Section 9.3) */}
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
                    View Clinicians
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

      {/* Hospital Clinicians Detail Modal */}
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
                onClick={() => setModalHospital(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#090d16', marginBottom: '0.75rem' }}>
                Active Verified Doctors ({doctors.filter(d => d.hospitalId === modalHospital.id && d.status === 'approved').length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {doctors
                  .filter(d => d.hospitalId === modalHospital.id && d.status === 'approved')
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
    </div>
  );
}
