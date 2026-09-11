import React, { useState, useEffect } from 'react';
import { 
  subscribeDoctorList, 
  approveDoctor, 
  rejectDoctor,
  seedDemoData 
} from '../firebase';

export default function AdminKYCApprovals() {
  const [doctors, setDoctors] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    const unsub = subscribeDoctorList((list) => {
      setDoctors(list);
    });
    return () => unsub();
  }, []);

  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const approvedDoctors = doctors.filter(d => d.status === 'approved' || !d.status);

  const handleApprove = async (doctorId, doctorName) => {
    setActionLoading(doctorId);
    try {
      await approveDoctor(doctorId);
      setFeedback({
        type: 'success',
        message: `✓ Successfully Approved ${doctorName}! They can now generate tokens and appear in the Patient Check-in dropdown.`
      });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to approve doctor. Please try again.' });
    }
    setActionLoading(null);
  };

  const handleReject = async (doctorId, doctorName) => {
    const reason = window.prompt(`Enter rejection reason for ${doctorName}:`, 'Medical Council registration could not be verified in state database.');
    if (!reason) return;

    setActionLoading(doctorId);
    try {
      await rejectDoctor(doctorId, reason);
      setFeedback({
        type: 'error',
        message: `Doctor application for ${doctorName} rejected.`
      });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to reject doctor.' });
    }
    setActionLoading(null);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <span>🛡️</span> Regulatory Compliance
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#090d16', margin: '0 0 0.25rem' }}>
            Doctor Credential Verification & KYC Approval
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, margin: 0 }}>
            Hospital administration must verify Medical Council of India (MCI/NMC) registration before granting clinician token issuance and queue rights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#b45309', lineHeight: 1 }}>
              {pendingDoctors.length}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', marginTop: '0.25rem' }}>
              Pending KYC
            </div>
          </div>
          <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>
              {approvedDoctors.length}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginTop: '0.25rem' }}>
              Approved Active
            </div>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div style={{
          background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1.5px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: feedback.type === 'success' ? '#166534' : '#991b1b',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          fontWeight: 800,
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: '', message: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* SECTION 1: PENDING DOCTORS */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#090d16', margin: 0 }}>
            Pending Medical License Applications
          </h3>
          <span style={{ background: '#f59e0b', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 900 }}>
            {pendingDoctors.length} Require Action
          </span>
        </div>

        {pendingDoctors.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '1rem', padding: '2.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#090d16', marginBottom: '0.25rem' }}>
              All Doctor Applications Verified!
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, margin: '0 0 1rem' }}>
              No pending KYC registrations at this moment. New registrations will automatically appear here in real time.
            </p>
            <button
              onClick={() => seedDemoData()}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.85rem', color: '#090d16', cursor: 'pointer' }}
            >
              🔄 Re-Seed Demo Pending Doctor
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {pendingDoctors.map((docItem) => (
              <div
                key={docItem.id}
                style={{
                  background: '#ffffff',
                  border: '2px solid #f59e0b',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '0.4rem', textTransform: 'uppercase' }}>
                      ⏳ KYC PENDING REVIEW
                    </span>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#090d16', margin: '0.5rem 0 0.2rem' }}>
                      {docItem.name}
                    </h4>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>
                      {docItem.department}
                    </div>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#fef3c7',
                    border: '1.5px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    👨‍⚕️
                  </div>
                </div>

                {/* Hospital Affiliation */}
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>HOSPITAL AFFILIATION</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#090d16' }}>
                    🏥 {docItem.hospitalName || 'CityCare Central Hospital'}
                  </div>
                </div>

                {/* Medical Council KYC Number Box */}
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '0.6rem', padding: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase' }}>
                      Medical Council Reg. (KYC ID)
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#dbeafe', color: '#1d4ed8', padding: '0.15rem 0.4rem', borderRadius: '0.3rem' }}>
                      NMC VERIFY
                    </span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#090d16', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {docItem.councilRegistration}
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Degree:</span>{' '}
                    <strong style={{ color: '#090d16', fontWeight: 800 }}>{docItem.qualification || 'MBBS'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Experience:</span>{' '}
                    <strong style={{ color: '#090d16', fontWeight: 800 }}>{docItem.experienceYears || 5} Years</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>OPD Room:</span>{' '}
                    <strong style={{ color: '#090d16', fontWeight: 800 }}>{docItem.roomNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Timings:</span>{' '}
                    <strong style={{ color: '#090d16', fontWeight: 800 }}>{docItem.timingSlot}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleApprove(docItem.id, docItem.name)}
                    disabled={actionLoading === docItem.id}
                    style={{
                      flex: 2,
                      background: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 10px rgba(4, 120, 87, 0.2)'
                    }}
                  >
                    <span>✓ Approve & Activate</span>
                  </button>
                  <button
                    onClick={() => handleReject(docItem.id, docItem.name)}
                    disabled={actionLoading === docItem.id}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      color: '#dc2626',
                      border: '1.5px solid #fca5a5',
                      padding: '0.75rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: APPROVED DOCTORS DIRECTORY */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#090d16', marginBottom: '1rem' }}>
          Active Approved Clinicians ({approvedDoctors.length})
        </h3>
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>Doctor</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>Hospital</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>KYC License</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>Room & Slot</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {approvedDoctors.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 900, color: '#090d16' }}>{d.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{d.department}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#090d16' }}>
                    {d.hospitalName || 'CityCare Central Hospital'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>
                    {d.councilRegistration || 'MCI-VERIFIED'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: '#090d16', fontSize: '0.85rem' }}>{d.roomNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{d.timingSlot}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '1rem'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                      ACTIVE & APPROVED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
