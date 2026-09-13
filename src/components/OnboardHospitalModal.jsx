import React, { useState } from 'react';
import { onboardHospital, addDoctorDirectly } from '../firebase';
import { Building2, X, Plus, CheckCircle2, Stethoscope, MapPin, Sparkles } from 'lucide-react';

export default function OnboardHospitalModal({ isOpen, onClose, onHospitalCreated }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [hospForm, setHospForm] = useState({
    name: '',
    tagline: 'Premier Multi-Speciality Healthcare & Emergency Centre',
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
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

      if (onHospitalCreated) {
        onHospitalCreated(createdHosp);
      }
      alert(`✓ Successfully Onboarded "${createdHosp.name}"! It is now live across the platform.`);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to onboard hospital: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 13, 22, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
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
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '2px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🏥 HOSPITAL NETWORK ONBOARDING
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#090d16', margin: '0.2rem 0 0' }}>
              Add New Hospital Facility
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Fill in details to onboard a hospital into the MediQ OPD Network.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', color: '#475569' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                Hospital Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AIIMS Hospital, Lilavati Hospital, Medanta"
                value={hospForm.name}
                onChange={(e) => setHospForm({ ...hospForm, name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 800, color: '#090d16' }}
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
                  Distance (e.g. 2.5 km)
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

            {/* Lead Clinician Optional Section */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1.5px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>👨‍⚕️</span> Optional: Add First Doctor for this Hospital
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
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.95rem',
                borderRadius: '0.65rem',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {actionLoading ? 'Onboarding Hospital...' : '✓ Complete Hospital Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
