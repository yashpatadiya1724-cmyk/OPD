import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut, 
  Edit3, 
  Save, 
  Building2, 
  FileCheck2, 
  Calendar, 
  HeartHandshake, 
  Clock, 
  ExternalLink,
  Sparkles,
  Stethoscope,
  Hospital,
  Droplet,
  MapPin,
  AlertCircle
} from 'lucide-react';

export default function AccountView({ onNavigateToHistory, onNavigateToRole }) {
  const { currentUser, logout, updateUserProfile, switchRole, DEMO_ACCOUNTS } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    bloodGroup: currentUser?.bloodGroup || 'B+',
    emergencyContact: currentUser?.emergencyContact || '',
    address: currentUser?.address || '',
    abdmId: currentUser?.abdmId || 'ABDM-91-8273-4410',
    councilRegistration: currentUser?.councilRegistration || '',
    department: currentUser?.department || 'General Medicine',
    hospitalName: currentUser?.hospitalName || 'CityCare Central Hospital',
    roomNumber: currentUser?.roomNumber || 'Room 102'
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await updateUserProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'doctor':
        return { label: 'Licensed Clinician & KYC Gated', bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' };
      case 'reception':
        return { label: 'Hospital Reception Desk Staff', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'admin':
        return { label: 'Super Admin & Platform Operator', bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' };
      default:
        return { label: 'Verified Patient (ABDM)', bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' };
    }
  };

  const badgeInfo = getRoleBadge(currentUser?.role || 'patient');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Banner & Profile Header */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        {/* Decorative Top Bar */}
        <div style={{
          height: '100px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            bottom: '-45px',
            left: '2rem',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '1rem'
          }}>
            {/* Avatar */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '4px solid #ffffff',
              background: '#f8fafc',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={45} color="#0284c7" />
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Row */}
        <div style={{
          padding: '3.5rem 2rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#090d16',
                letterSpacing: '-0.02em'
              }}>
                {currentUser?.displayName || 'MediQ User'}
              </h1>

              {/* Role Badge */}
              <span style={{
                background: badgeInfo.bg,
                color: badgeInfo.color,
                border: `1px solid ${badgeInfo.border}`,
                padding: '0.25rem 0.65rem',
                borderRadius: '2rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <ShieldCheck size={14} />
                <span>{badgeInfo.label}</span>
              </span>

              {/* Google Verified Chip */}
              {currentUser?.isGoogle && (
                <span style={{
                  background: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '2rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Google Account Linked</span>
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              marginTop: '0.5rem',
              color: '#64748b',
              fontSize: '0.88rem',
              fontWeight: 600,
              flexWrap: 'wrap'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={16} />
                <span>{currentUser?.email || 'No email registered'}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={16} />
                <span>{currentUser?.phoneNumber || '9876543210'}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: isEditing ? '#f1f5f9' : '#ffffff',
                color: '#090d16',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <Edit3 size={16} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={logout}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '10px',
                border: '1.5px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div style={{
            margin: '0 2rem 1.5rem',
            padding: '0.75rem 1rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#065f46',
            fontSize: '0.88rem',
            fontWeight: 800
          }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>Profile successfully updated and synchronized!</span>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* OPD History Direct Action */}
        <div 
          onClick={onNavigateToHistory}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '1.25rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0284c7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
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
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#090d16' }}>
                My OPD Visit History
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                View past consultations, digital slips &amp; reviews
              </p>
            </div>
          </div>
          <ExternalLink size={18} color="#94a3b8" />
        </div>

        {/* ABDM Health ID Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileCheck2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#090d16' }}>
                ABDM Health ID
              </h3>
              <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#065f46', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                Verified
              </span>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' }}>
              {formData.abdmId}
            </p>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Personal & Health Profile */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <User size={20} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#090d16' }}>
              Personal &amp; Contact Details
            </h2>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                      background: '#ffffff'
                    }}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. 9876500000 (Spouse)"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#090d16', marginBottom: '0.35rem' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Indiranagar, Bengaluru"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Blood Group</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Droplet size={15} />
                  <span>{formData.bloodGroup}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Emergency Contact</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#090d16' }}>
                  {formData.emergencyContact || '9876500000 (Spouse)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Residential Address</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#090d16', textAlign: 'right', maxWidth: '200px' }}>
                  {formData.address || 'Bengaluru, Karnataka'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Account Security</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={15} />
                  <span>2FA Active</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Professional / Role Details */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Stethoscope size={20} color="#0d9488" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#090d16' }}>
              {currentUser?.role === 'doctor' ? 'Clinician Credentials & KYC' : 'OPD Role & Affiliation'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Role</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#090d16', textTransform: 'capitalize' }}>
                {currentUser?.role || 'patient'}
              </span>
            </div>

            {currentUser?.role === 'doctor' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Medical Council Registration</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                    {currentUser?.councilRegistration || 'MCI-48291-DL'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>KYC Status</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={15} />
                    <span>Admin Approved</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Department</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#090d16' }}>
                    {currentUser?.department || 'General Medicine'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Assigned OPD Room</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#090d16' }}>
                    {currentUser?.roomNumber || 'Room 102'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Preferred Hospital</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#090d16' }}>
                    CityCare Central Hospital
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Patient Pass Type</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>
                    MediQ FastTrack Member
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total OPD Tokens Used</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#090d16' }}>
                    4 Visits
                  </span>
                </div>
              </>
            )}

            {/* Switch Active Role Bar */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>
                Switch Perspective for Testing:
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['patient', 'doctor', 'reception', 'admin'].map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      if (onNavigateToRole) onNavigateToRole(r);
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: currentUser?.role === r ? '#0284c7' : '#f8fafc',
                      color: currentUser?.role === r ? '#ffffff' : '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
