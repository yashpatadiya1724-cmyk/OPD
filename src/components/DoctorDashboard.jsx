import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Clock, 
  CheckCircle, 
  SkipForward, 
  Play, 
  Pause, 
  Users, 
  BellRing, 
  AlertCircle,
  Sparkles,
  Phone,
  FileText,
  DoorOpen,
  Pill,
  Send,
  Scan,
  Camera
} from 'lucide-react';
import { 
  subscribeDoctorList, 
  subscribeDoctorTokens, 
  updateDoctorLocation, 
  updateTokenStatus, 
  toggleDoctorQueuePause,
  pauseDoctorQueue,
  skipToken,
  recallToken,
  sortQueueByPriority,
  checkMedicineStock,
  MEDICINE_INVENTORY,
  createPharmacyToken,
  getPharmacyPriceComparison,
  logAuditEvent
} from '../firebase';
import { playChime } from '../utils/audio';

export default function DoctorDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [tokens, setTokens] = useState([]);
  const [activeDoctor, setActiveDoctor] = useState(null);

  // Dynamic Room & Timing state
  const [roomNumber, setRoomNumber] = useState('');
  const [floorWing, setFloorWing] = useState('');
  const [timingSlot, setTimingSlot] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');

  // Consultation elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // PRD v4 Section 6.6: 3-Minute Response Window Countdown Timer
  const [responseCountdown, setResponseCountdown] = useState(180);

  // Skip Modal state (moves 3 back, second miss = no-show)
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('Patient absent outside room after 3-minute window');

  // Pause Queue Modal state (PRD 6.7)
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('Emergency surgery / procedure');
  const [pauseDelayMinutes, setPauseDelayMinutes] = useState(30);

  // Section 7.10 & 7.11: Pharmacy Handoff Modal & Price Comparison state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [prescribedMedicinesText, setPrescribedMedicinesText] = useState('Paracetamol 650mg, Cetirizine 10mg, Pantoprazole 40mg');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('pharm-hospital');
  const [sendToPharmacy, setSendToPharmacy] = useState(true);
  const [allowGenericSubstitution, setAllowGenericSubstitution] = useState(true);
  const [allergyAlert, setAllergyAlert] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [pharmacyHandoffSuccess, setPharmacyHandoffSuccess] = useState(null);

  const handleOpenCompleteModal = () => {
    if (!currentToken) return;
    // Check allergy warnings against patient reason/known profile
    const meds = prescribedMedicinesText.toLowerCase();
    if (currentToken.reason?.toLowerCase().includes('penicillin') && meds.includes('amox')) {
      setAllergyAlert('⚠️ WARNING: Patient reported Penicillin allergy. Amoxicillin is a Penicillin antibiotic!');
    } else {
      setAllergyAlert(null);
    }
    setShowCompleteModal(true);
  };

  const handleFinalizeComplete = async () => {
    if (!selectedDocId || !currentToken) return;
    try {
      setIsCompleting(true);
      const medList = prescribedMedicinesText
        .split(',')
        .map(m => m.trim())
        .filter(Boolean);

      const comparison = getPharmacyPriceComparison(medList);
      const chosenPharm = comparison.find(p => p.id === selectedPharmacyId) || comparison[0];

      let pharmacyResult = null;
      if (sendToPharmacy && medList.length > 0) {
        pharmacyResult = await createPharmacyToken({
          patientName: currentToken.patientName,
          phoneNumber: currentToken.phoneNumber,
          doctorId: selectedDocId,
          doctorName: activeDoctor?.name || 'Dr. Physician',
          linkedDoctorTokenId: currentToken.id,
          medicines: medList,
          allowGenericSubstitution,
          hospitalId: activeDoctor?.hospitalId || 'citycare-central',
          hospitalName: activeDoctor?.hospitalName || 'CityCare Central Hospital',
          pharmacyId: chosenPharm.id,
          pharmacyName: chosenPharm.name,
          pharmacyType: chosenPharm.type,
          pharmacyAddress: chosenPharm.address,
          pharmacyDistance: chosenPharm.distanceText,
          totalEstimatedPrice: chosenPharm.totalPrice
        });
      }

      await updateTokenStatus(selectedDocId, currentToken.id, 'completed', {
        prescribedMedicines: medList,
        pharmacyTokenCode: pharmacyResult?.tokenCode || null,
        pharmacyName: chosenPharm?.name || null,
        pharmacyStatus: pharmacyResult?.status || 'ready',
        genericSubstitutionAllowed: allowGenericSubstitution
      });

      if (pharmacyResult) {
        setPharmacyHandoffSuccess({
          code: pharmacyResult.tokenCode,
          name: chosenPharm.name,
          isAutoPacked: pharmacyResult.isAutoPacked
        });
        setTimeout(() => setPharmacyHandoffSuccess(null), 6000);
      }
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Error completing consultation:', err);
      alert('Failed to complete consultation: ' + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleMarkComplete = handleOpenCompleteModal;

  const handleSkipPrompt = () => {
    if (!currentToken) return;
    setShowSkipModal(true);
  };

  const handleConfirmSkip = async () => {
    if (!selectedDocId || !currentToken) return;
    try {
      const res = await skipToken(selectedDocId, currentToken.id, skipReason);
      setShowSkipModal(false);
      if (res.status === 'no-show') {
        alert(`Token #${currentToken.tokenNumber} has been closed as NO-SHOW (second response window missed).`);
      } else {
        alert(`Token #${currentToken.tokenNumber} skipped and moved 3 positions back in queue.`);
      }
    } catch (e) {
      console.error(e);
      alert('Skip error: ' + e.message);
    }
  };

  const handleRecall = async (token) => {
    if (!selectedDocId || !token) return;
    try {
      await recallToken(selectedDocId, token.id, activeDoctor?.name || 'Doctor');
      alert(`Token #${token.tokenNumber} recalled to active waiting queue.`);
    } catch (e) {
      console.error(e);
      alert('Recall error: ' + e.message);
    }
  };

  const handleConfirmPause = async () => {
    if (!activeDoctor) return;
    try {
      await pauseDoctorQueue(activeDoctor.id, {
        paused: true,
        reason: pauseReason,
        delayMinutes: Number(pauseDelayMinutes) || 30
      });
      setShowPauseModal(false);
      alert(`Queue paused. Live delay notice (${pauseDelayMinutes}m) broadcast to all patient screens & waiting room TVs.`);
    } catch (e) {
      console.error(e);
      alert('Pause error: ' + e.message);
    }
  };

  const handleResumeQueue = async () => {
    if (!activeDoctor) return;
    try {
      await pauseDoctorQueue(activeDoctor.id, {
        paused: false,
        reason: '',
        delayMinutes: 0
      });
      alert('Queue resumed. Live consultation status restored.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePause = () => {
    if (activeDoctor?.queuePaused) {
      handleResumeQueue();
    } else {
      setShowPauseModal(true);
    }
  };

  const handleSkip = handleSkipPrompt;

  const isApproved = activeDoctor?.status === 'approved' || !activeDoctor?.status;
  useEffect(() => {
    const unsub = subscribeDoctorList((docs) => {
      setDoctors(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
    });
    return () => unsub();
  }, [selectedDocId]);

  // Sync active doctor state
  useEffect(() => {
    const doc = doctors.find(d => d.id === selectedDocId);
    if (doc) {
      setActiveDoctor(doc);
      setRoomNumber(doc.roomNumber || 'Room 101');
      setFloorWing(doc.floorWing || 'Ground Floor');
      setTimingSlot(doc.timingSlot || '09:00 AM - 02:00 PM');
    }
  }, [selectedDocId, doctors]);

  // Subscribe to tokens for selected doctor
  useEffect(() => {
    if (!selectedDocId) return;
    const unsub = subscribeDoctorTokens(selectedDocId, (tList) => {
      const sorted = sortQueueByPriority(tList);
      setTokens(sorted);
    });
    return () => unsub();
  }, [selectedDocId]);

  const currentToken = tokens.find(t => t.status === 'in-progress');
  const waitingTokens = sortQueueByPriority(tokens.filter(t => t.status === 'waiting'));
  const skippedTokens = tokens.filter(t => t.status === 'skipped' || t.status === 'no-show');
  const completedCount = tokens.filter(t => t.status === 'completed').length;

  useEffect(() => {
    let interval = null;
    if (currentToken) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentToken?.id]);

  // PRD 6.6: 3-minute response countdown timer
  useEffect(() => {
    let timer = null;
    if (currentToken) {
      setResponseCountdown(180);
      timer = setInterval(() => {
        setResponseCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      setResponseCountdown(180);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentToken?.id]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!selectedDocId) return;
    try {
      setIsUpdatingLocation(true);
      await updateDoctorLocation(selectedDocId, {
        roomNumber: roomNumber.trim(),
        floorWing: floorWing.trim(),
        timingSlot: timingSlot.trim()
      });
      setLocationSuccessMsg('Room & Timings updated! Patients notified live.');
      setTimeout(() => setLocationSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location: ' + err.message);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleCallNext = async () => {
    if (!selectedDocId || waitingTokens.length === 0) return;
    playChime();
    const nextToken = waitingTokens[0];
    if (currentToken) {
      await updateTokenStatus(selectedDocId, currentToken.id, 'completed');
    }
    await updateTokenStatus(selectedDocId, nextToken.id, 'in-progress');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Doctor Selection & Top Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: isApproved 
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
            }}>
              <Stethoscope size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Active Doctor Console
                </label>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '1rem',
                  background: isApproved ? '#dcfce7' : '#fef3c7',
                  color: isApproved ? '#166534' : '#92400e',
                  border: `1px solid ${isApproved ? '#86efac' : '#fde68a'}`
                }}>
                  {isApproved ? '✓ APPROVED' : '⏳ PENDING KYC'}
                </span>
              </div>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="input-field"
                style={{ padding: '0.5rem 0.85rem', fontWeight: 900, fontSize: '1.1rem', minWidth: '280px' }}
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department}) — {d.status === 'pending' ? '⏳ PENDING KYC' : '✓ APPROVED'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>Waiting</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706' }}>
                {waitingTokens.length}
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>Completed</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>
                {completedCount}
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)' }} />
            
            <button
              onClick={handleTogglePause}
              disabled={!isApproved}
              className={`btn ${activeDoctor?.queuePaused ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 1rem', fontSize: '0.88rem', fontWeight: 800, opacity: isApproved ? 1 : 0.5 }}
            >
              {activeDoctor?.queuePaused ? (
                <>
                  <Play size={16} /> Resume Queue
                </>
              ) : (
                <>
                  <Pause size={16} /> Pause Queue
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* KYC PENDING LOCK BANNER */}
      {!isApproved && (
        <div style={{
          background: '#fffbeb',
          border: '2px solid #f59e0b',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#92400e' }}>
              Doctor Consultation Controls Locked — Administrative KYC Pending
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#78350f', fontWeight: 700, lineHeight: 1.5 }}>
            Medical Council Registration (<strong style={{ fontFamily: 'monospace' }}>{activeDoctor?.councilRegistration || 'PENDING'}</strong>) is under review by <strong>{activeDoctor?.hospitalName || 'CityCare Central Hospital'}</strong> administration.
            <br />
            Per medical compliance regulations, <strong>Call Next, Complete, and Location editing are locked</strong> until an administrator clicks <em>"Approve & Activate"</em> in the <strong>Admin & Approvals</strong> tab.
          </p>
        </div>
      )}

      {/* Grid: Dynamic Location Settings (Left) & Active Consultation Hero (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* DOCTOR DYNAMIC MEETING PLACE & TIMINGS EDITOR */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <DoorOpen size={24} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>Consultation Location &amp; Timings</h2>
            </div>
            <span className="badge badge-in-progress" style={{ fontSize: '0.7rem' }}>
              Live Sync
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Changing your room number or timings will instantly update the <strong>Patient Tracker App</strong> and the <strong>Waiting-Room TV Display</strong> with an audio alert.
          </p>

          <form onSubmit={handleUpdateLocation} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                <DoorOpen size={16} /> Room / Cabin Number:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Room 204, Cabin B"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                <MapPin size={16} /> Floor / OPD Wing:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 1st Floor, OPD Block B"
                value={floorWing}
                onChange={(e) => setFloorWing(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                <Clock size={16} /> Consultation Timing Slot:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 10:00 AM - 02:00 PM"
                value={timingSlot}
                onChange={(e) => setTimingSlot(e.target.value)}
                required
              />
            </div>

            {locationSuccessMsg && (
              <div style={{
                background: 'var(--badge-in-prog-bg)',
                border: '1px solid var(--badge-in-prog-border)',
                color: 'var(--badge-in-prog-text)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={18} />
                <span>{locationSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isApproved || isUpdatingLocation}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 900, opacity: isApproved ? 1 : 0.5 }}
            >
              <BellRing size={18} />
              <span>{isUpdatingLocation ? 'Broadcasting...' : 'Update & Notify All Patients'}</span>
            </button>
          </form>
        </div>

        {/* ACTIVE CONSULTATION HERO CARD */}
        <div className="glass-card" style={{
          padding: '1.75rem',
          border: currentToken ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot" style={{ background: currentToken ? '#10b981' : '#94a3b8' }}></span>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {currentToken ? 'Now In Consultation' : 'Doctor Idle'}
                </h3>
              </div>
              {currentToken && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* PRD 6.6: 3-Minute Response Window Timer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: responseCountdown > 30 ? '#eff6ff' : '#fef2f2',
                    color: responseCountdown > 30 ? '#1d4ed8' : '#b91c1c',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    border: responseCountdown > 30 ? '1px solid #bfdbfe' : '1px solid #fca5a5'
                  }}>
                    <Clock size={14} />
                    <span>Response: {formatTimer(responseCountdown)}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'var(--badge-comp-bg)',
                    color: 'var(--badge-comp-text)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 900
                  }}>
                    <Clock size={16} />
                    <span>{formatTimer(elapsedSeconds)}</span>
                  </div>
                </div>
              )}
            </div>

            {currentToken && responseCountdown === 0 && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                marginBottom: '0.85rem',
                fontSize: '0.82rem',
                color: '#991b1b',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️ 3-Minute patient response window expired outside room. Recommend: Tap "Skip Patient" to move 3 positions back.</span>
              </div>
            )}

            {currentToken ? (
              <div style={{ textAlign: 'center', padding: '1rem 0 1.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-muted)' }}>Current Patient Token</span>
                <div style={{
                  fontSize: '5.5rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                  margin: '0.5rem 0 1rem',
                  color: '#0284c7'
                }}>
                  #{currentToken.tokenNumber}
                </div>

                <div style={{
                  background: 'var(--bg-inner)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  textAlign: 'left',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {currentToken.patientName}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={14} /> {currentToken.phoneNumber}
                    </span>
                  </div>
                  {currentToken.reason && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <FileText size={16} color="var(--accent-cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{currentToken.reason}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Location: <strong style={{ color: 'var(--text-primary)' }}>{roomNumber}</strong> ({floorWing})
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={56} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <h4 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  No Patient Currently In Consultation
                </h4>
                <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                  Click <strong>Call Next Patient</strong> below to advance the queue.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleCallNext}
              disabled={!isApproved || waitingTokens.length === 0}
              className="btn btn-primary"
              style={{
                padding: '1.1rem',
                fontSize: '1.15rem',
                fontWeight: 900,
                opacity: (!isApproved || waitingTokens.length === 0) ? 0.5 : 1
              }}
            >
              <BellRing size={22} />
              <span>
                Call Next Patient {waitingTokens.length > 0 ? `(#${waitingTokens[0].tokenNumber})` : '(Queue Empty)'}
              </span>
            </button>

            {currentToken && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <button
                  onClick={handleMarkComplete}
                  disabled={!isApproved}
                  className="btn btn-success"
                  style={{ padding: '0.85rem', fontWeight: 800, opacity: isApproved ? 1 : 0.5 }}
                >
                  <CheckCircle size={18} />
                  <span>Mark Complete</span>
                </button>
                <button
                  onClick={handleSkip}
                  disabled={!isApproved}
                  className="btn btn-danger"
                  style={{ padding: '0.85rem', fontWeight: 800, opacity: isApproved ? 1 : 0.5 }}
                >
                  <SkipForward size={18} />
                  <span>Skip Patient</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Upcoming Patients In Queue */}
      <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>Upcoming Patients Waiting in Queue</h3>
          </div>
          <span className="badge badge-waiting">
            {waitingTokens.length} Waiting
          </span>
        </div>

        {waitingTokens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            No patients waiting in queue right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {waitingTokens.map((t, idx) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-inner)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: 900,
                      color: idx === 0 ? '#d97706' : '#0284c7'
                    }}>
                      #{t.tokenNumber}
                    </span>
                    {idx === 0 && (
                      <span className="badge badge-next" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                        Next
                      </span>
                    )}
                    {t.lane === 'emergency' && (
                      <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 900 }}>
                        🚨 Emergency
                      </span>
                    )}
                    {t.lane === 'senior' && (
                      <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 900 }}>
                        👴 Senior
                      </span>
                    )}
                    {t.lane === 'pregnant' && (
                      <span style={{ background: '#fce7f3', color: '#9d174d', border: '1px solid #fbcfe8', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 900 }}>
                        🤰 Priority
                      </span>
                    )}
                    {t.lane === 'disabled' && (
                      <span style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 900 }}>
                        ♿ Priority
                      </span>
                    )}
                    {t.type === 'slot' && (
                      <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 900 }}>
                        📅 Slot ({t.slotTime || 'Booked'})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {t.patientName}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Phone: {t.phoneNumber}
                  </div>
                  {t.skipCount > 0 && (
                    <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
                      ⚠️ Previously skipped ({t.skipCount}/2) — Moved back
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    playChime();
                    if (currentToken) {
                      await updateTokenStatus(selectedDocId, currentToken.id, 'completed');
                    }
                    await updateTokenStatus(selectedDocId, t.id, 'in-progress');
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 800 }}
                >
                  Call Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRD 6.6: SKIPPED & NO-SHOW TOKENS WITH RECALL ACTION */}
      {skippedTokens.length > 0 && (
        <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SkipForward size={20} color="#b45309" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#92400e', margin: 0 }}>
                Skipped &amp; Missed Response Tokens ({skippedTokens.length}) — PRD 6.6 Recall Allowed
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 700 }}>
              Doctor / Desk can recall tokens back to active queue until end of day
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
            {skippedTokens.map(st => (
              <div key={st.id} style={{
                background: 'var(--bg-surface)',
                border: '1px solid #fcd34d',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#b45309' }}>#{st.tokenNumber}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: st.status === 'no-show' ? '#fee2e2' : '#fef3c7',
                      color: st.status === 'no-show' ? '#991b1b' : '#92400e'
                    }}>
                      {st.status === 'no-show' ? 'NO-SHOW (CLOSED)' : 'SKIPPED (ABSENT)'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{st.patientName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reason: {st.skipReason || 'Absent outside room'}</div>
                </div>
                <button
                  onClick={() => handleRecall(st)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800, borderColor: '#f59e0b', color: '#92400e' }}
                >
                  Recall Token
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7.10: Auto Pharmacy Token Handoff Modal */}
      {showCompleteModal && currentToken && (
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
          onClick={() => setShowCompleteModal(false)}
        >
          <div 
            className="glass-card"
            style={{
              background: '#fff',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Complete Consultation • Token #{currentToken.tokenNumber}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Patient: {currentToken.patientName} ({currentToken.phoneNumber})
                </p>
              </div>
            </div>

            {/* Prescribed Medicines Box */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  💊 Prescribed Medicines (Add / Edit):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPrescribedMedicinesText('Augmentin 625mg (1 Tab TDS x 5d), Dolo 650mg (1 Tab SOS), Pantocid 40mg (1 Tab OD AC), Cetzine 10mg (1 Tab HS)');
                    }}
                    style={{
                      background: 'rgba(2, 132, 199, 0.1)',
                      border: '1px solid #38bdf8',
                      color: '#0284c7',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Scan size={13} />
                    <span>📷 AI Vision OCR Scan</span>
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                    {prescribedMedicinesText.split(',').filter(m => m.trim()).length} Items Added
                  </span>
                </div>
              </div>
              <textarea
                value={prescribedMedicinesText}
                onChange={(e) => setPrescribedMedicinesText(e.target.value)}
                rows={3}
                className="input-field"
                style={{ width: '100%', borderRadius: '10px', fontSize: '0.9rem', lineHeight: '1.4' }}
                placeholder="e.g. Paracetamol 650mg, Cetirizine 10mg, Pantoprazole 40mg..."
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                {[
                  'Paracetamol 650mg', 
                  'Amoxicillin 500mg', 
                  'Cetirizine 10mg', 
                  'Pantoprazole 40mg', 
                  'Azithromycin 500mg',
                  'Cough Syrup 100ml',
                  'Vitamin C & Zinc'
                ].map((quickMed) => (
                  <button
                    key={quickMed}
                    type="button"
                    onClick={() => {
                      if (!prescribedMedicinesText.includes(quickMed)) {
                        setPrescribedMedicinesText(prev => prev.trim() ? `${prev.trim()}, ${quickMed}` : quickMed);
                      }
                    }}
                    style={{
                      background: prescribedMedicinesText.includes(quickMed) ? '#e0f2fe' : '#f1f5f9',
                      border: prescribedMedicinesText.includes(quickMed) ? '1px solid #38bdf8' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: prescribedMedicinesText.includes(quickMed) ? '#0369a1' : '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    + {quickMed}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 7.10 & 7.11: Live Nearby Pharmacy Price & Distance Comparison Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#090d16' }}>
                  🏥 Select Destination Pharmacy (Live Price Analysis):
                </label>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 800 }}>
                  ⚡ Auto-Pack if 0 Waiting
                </span>
              </div>

              {(() => {
                const meds = prescribedMedicinesText.split(',').filter(m => m.trim());
                const comparisons = getPharmacyPriceComparison(meds);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {comparisons.map((ph) => {
                      const isSelected = selectedPharmacyId === ph.id;
                      return (
                        <div
                          key={ph.id}
                          onClick={() => setSelectedPharmacyId(ph.id)}
                          style={{
                            padding: '0.75rem 0.9rem',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                            background: isSelected ? '#f0f9ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <input
                              type="radio"
                              name="pharmacySelect"
                              checked={isSelected}
                              onChange={() => setSelectedPharmacyId(ph.id)}
                              style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#090d16' }}>{ph.name}</span>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 900,
                                  background: isSelected ? '#0284c7' : ph.badgeColor,
                                  color: '#fff',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px'
                                }}>
                                  Token: {ph.tokenPrefix}-XX
                                </span>
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                                📍 {ph.distanceText} • {ph.address}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#090d16' }}>
                              ₹{ph.totalPrice}
                            </div>
                            {ph.savings ? (
                              <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 800 }}>
                                {ph.savings}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                                {ph.isHospitalPharmacy ? '0m Walk (Ground Floor)' : 'Retail Price'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Section 7.10 Checkbox */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <input
                type="checkbox"
                id="sendPharmacyCheck"
                checked={sendToPharmacy}
                onChange={(e) => setSendToPharmacy(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#059669', cursor: 'pointer' }}
              />
              <label htmlFor="sendPharmacyCheck" style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#166534' }}>
                  ⚡ Auto Pharmacy Token Handoff &amp; Instant Pack
                </div>
                <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
                  Selected pharmacy receives token instantly. If counter has 0 queue, order auto-marks <strong>Packed &amp; Ready</strong> immediately.
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 800 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeComplete}
                disabled={isCompleting}
                className="btn btn-success"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 900 }}
              >
                {isCompleting ? 'Finalizing...' : 'Complete & Dispatch Token'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {pharmacyHandoffSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#059669',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '14px',
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 99999,
          fontWeight: 800
        }}>
          <Pill size={22} />
          <div>
            <div>✓ Consultation Completed! Token <strong>{pharmacyHandoffSuccess.code}</strong> dispatched to <strong>{pharmacyHandoffSuccess.name}</strong>.</div>
            {pharmacyHandoffSuccess.isAutoPacked && (
              <div style={{ fontSize: '0.8rem', color: '#bbf7d0', fontWeight: 700, marginTop: '2px' }}>
                ⚡ 0 Queue at Counter — Automatically Packed &amp; Ready for Pickup!
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRD 6.6: SKIP PATIENT MODAL */}
      {showSkipModal && currentToken && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => setShowSkipModal(false)}>
          <div className="glass-card" style={{
            background: '#fff',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SkipForward size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Skip Token #{currentToken.tokenNumber} ({currentToken.patientName})
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700 }}>
                  PRD 6.6 Logic: Moves 3 positions back. (Miss #{(currentToken.skipCount || 0) + 1}/2)
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Patient has missed their 3-minute response window outside the room. If this is their 2nd consecutive missed call, their token will be automatically closed as <strong>NO-SHOW</strong>.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Reason for Skipping:
              </label>
              <select
                className="input-field"
                value={skipReason}
                onChange={e => setSkipReason(e.target.value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                <option value="Patient absent outside room after 3-minute window">Patient absent outside room after 3-minute window</option>
                <option value="Stepped away for diagnostic testing (X-Ray/Lab)">Stepped away for diagnostic testing (X-Ray/Lab)</option>
                <option value="Patient requested 10-minute postponement">Patient requested 10-minute postponement</option>
                <option value="Vitals or triage assessment in progress">Vitals or triage assessment in progress</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 800 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="btn btn-danger"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 900 }}
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRD 6.7: PAUSE QUEUE / DOCTOR DELAY MODAL */}
      {showPauseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => setShowPauseModal(false)}>
          <div className="glass-card" style={{
            background: '#fff',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Pause size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Pause Consultation Queue &amp; Broadcast Delay
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>
                  PRD 6.7: Broadcasts live alert to patients &amp; waiting room TV
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Reason for Delay:
              </label>
              <select
                className="input-field"
                value={pauseReason}
                onChange={e => setPauseReason(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Emergency surgery / emergency procedure">Emergency surgery / procedure</option>
                <option value="Inpatient ICU ward rounds">Inpatient ICU ward rounds</option>
                <option value="Doctor running 30 min late">Doctor running late</option>
                <option value="Scheduled clinical break">Scheduled clinical break</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Expected Delay Duration (Minutes):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPauseDelayMinutes(mins)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: pauseDelayMinutes === mins ? '2px solid #d97706' : '1px solid var(--border-subtle)',
                      background: pauseDelayMinutes === mins ? '#fef3c7' : '#f8fafc',
                      color: pauseDelayMinutes === mins ? '#92400e' : 'var(--text-main)'
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginBottom: '1.25rem'
            }}>
              📢 <strong>Patient Impact:</strong> Patients will receive an in-app notice with options to <em>Stay &amp; Wait</em>, <em>Switch Doctor (same specialty)</em>, or <em>Reschedule Free of Cost</em>.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 800 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPause}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem', fontWeight: 900, background: '#d97706', borderColor: '#b45309' }}
              >
                Broadcast Delay &amp; Pause
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
