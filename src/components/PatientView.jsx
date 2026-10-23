import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Bell, 
  BellRing, 
  Volume2, 
  ArrowRight,
  RefreshCw,
  XCircle,
  DoorOpen,
  CalendarClock,
  Star,
  CreditCard,
  Pill,
  Car,
  Navigation,
  TrendingUp,
  Sparkles,
  Plane,
  Bike,
  Scan,
  ShieldCheck
} from 'lucide-react';
import { 
  subscribeDoctorList, 
  subscribeDoctor, 
  subscribeDoctorTokens, 
  generateToken,
  bookDoctorSlot,
  submitReview,
  subscribeSingleToken,
  saveToUserHistory,
  getPharmacyPriceComparison,
  subscribePharmacyTokens,
  calculateWaitTimeRange,
  getLeaveNowState,
  calculateSlotRefund,
  saveDpdpConsent,
  getDpdpConsent,
  recordTransaction,
  logAuditEvent
} from '../firebase';
import { 
  playChime, 
  playUrgentAlert, 
  vibrateDevice, 
  requestNotificationPermission, 
  sendBrowserNotification 
} from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import RazorpayModal from './RazorpayModal';
import BlinkitFulfillmentModal from './BlinkitFulfillmentModal';

const STORAGE_KEY = 'citycare_patient_token_session';

export default function PatientView({ activeHospital, onSwitchToHospitals }) {
  const { currentUser } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Entry Mode (MediQ PRD Section 9.3): 'walkin' | 'slot'
  const [entryMode, setEntryMode] = useState('walkin');
  const [selectedSlotTime, setSelectedSlotTime] = useState('10:30 AM - 10:45 AM');
  const [paymentOption, setPaymentOption] = useState('prepaid');

  // PRD v4: Priority Lane ('normal' | 'senior' | 'pregnant' | 'disabled')
  const [patientLane, setPatientLane] = useState(currentUser?.lane || 'normal');

  // PRD v4: Family Profiles
  const [familyProfile, setFamilyProfile] = useState('self');
  const [customFamilyName, setCustomFamilyName] = useState('');
  const [customFamilyRelation, setCustomFamilyRelation] = useState('Father');

  // Razorpay Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSlotBooking, setPendingSlotBooking] = useState(null);

  // Cancellation & Refund Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Doctor Delay / Pause Dismiss state
  const [delayNoticeDismissed, setDelayNoticeDismissed] = useState(false);

  // DPDP Consent state
  const [dpdpConsented, setDpdpConsented] = useState(() => {
    return getDpdpConsent(currentUser?.uid || 'guest').healthDataProcessing;
  });

  // Post-Consultation Rating & Review state
  const [patientRating, setPatientRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  // Completed Pharmacy Order Banner
  const [completedOrderNotice, setCompletedOrderNotice] = useState(null);
  const [showBlinkitModal, setShowBlinkitModal] = useState(false);
  const [blinkitInitialMode, setBlinkitInitialMode] = useState('express_rider');

  // Check-in form fields
  const [patientName, setPatientName] = useState(currentUser?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-prefill if user logs in or switches account
  useEffect(() => {
    if (currentUser?.displayName && !patientName) {
      setPatientName(currentUser.displayName);
    }
    if (currentUser?.phoneNumber && !phoneNumber) {
      setPhoneNumber(currentUser.phoneNumber);
    }
  }, [currentUser]);

  // Live Token & Doctor data
  const [myTokenData, setMyTokenData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [doctorQueueTokens, setDoctorQueueTokens] = useState([]);

  // Urgent Location Change Notification Alert
  const [locationAlert, setLocationAlert] = useState(null);
  const prevLocationRef = useRef(null);
  const prevStatusRef = useRef(null);

  // Filter ONLY APPROVED doctors (pending KYC doctors are strictly hidden from patients)
  const approvedDoctors = doctors.filter(d => d.status === 'approved' || !d.status);
  const displayDoctors = activeHospital 
    ? approvedDoctors.filter(d => d.hospitalId === activeHospital.id || !d.hospitalId)
    : approvedDoctors;

  // Subscribe to doctor list
  useEffect(() => {
    const unsub = subscribeDoctorList((docs) => {
      setDoctors(docs);
    });
    return () => unsub();
  }, []);

  // Sync selected doctor when displayDoctors change
  useEffect(() => {
    if (displayDoctors.length > 0) {
      const stillValid = displayDoctors.some(d => d.id === selectedDoctorId);
      if (!stillValid) {
        setSelectedDoctorId(displayDoctors[0].id);
      }
    }
  }, [displayDoctors, selectedDoctorId]);

  // Subscribe to active token and doctor if session exists
  useEffect(() => {
    if (!session?.doctorId || !session?.tokenId) return;

    // Listen to token
    const unsubToken = subscribeSingleToken(session.doctorId, session.tokenId, (tData) => {
      if (tData) {
        setMyTokenData(tData);

        // Check if status transitioned to in-progress
        if (prevStatusRef.current && prevStatusRef.current !== 'in-progress' && tData.status === 'in-progress') {
          playChime();
          vibrateDevice([300, 150, 300]);
          sendBrowserNotification(
            "It's Your Turn! - CityCare OPD",
            `Your token #${tData.tokenNumber} is now being called! Please proceed to the doctor.`
          );
        }

        // AUTO-CLEAR: When pharmacy completes order and dispenses medicines, remove queue screen!
        if (tData.pharmacyStatus === 'dispensed' || tData.status === 'dispensed') {
          playChime();
          vibrateDevice([200, 100, 200]);
          sendBrowserNotification(
            "Medicines Dispensed! - CityCare OPD",
            `Your prescription for token #${tData.tokenNumber || session.tokenNumber} has been dispensed. Your OPD visit is complete!`
          );
          setCompletedOrderNotice({
            tokenNumber: tData.tokenNumber || session.tokenNumber,
            doctorName: session.doctorName || 'Doctor',
            medicines: tData.prescribedMedicines || []
          });
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {}
          setSession(null);
          setMyTokenData(null);
          return;
        }

        prevStatusRef.current = tData.status;
      }
    });

    // Also listen directly to pharmacy_tokens to catch immediate dispense updates
    const unsubPharmacy = subscribePharmacyTokens((pharmList) => {
      const match = pharmList.find(p => 
        (p.linkedDoctorTokenId && p.linkedDoctorTokenId === session.tokenId) ||
        (p.id && p.id === session.tokenId) ||
        (p.tokenCode && session.pharmacyTokenCode && p.tokenCode === session.pharmacyTokenCode)
      );

      if (match && match.status === 'dispensed') {
        playChime();
        setCompletedOrderNotice({
          tokenNumber: session.tokenNumber,
          doctorName: session.doctorName || 'Doctor',
          medicines: match.medicines || []
        });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        setSession(null);
        setMyTokenData(null);
      }
    });

    // Listen to doctor (for dynamic room and timings changes)
    const unsubDoc = subscribeDoctor(session.doctorId, (docInfo) => {
      if (docInfo) {
        setDoctorData(docInfo);

        const currentLocKey = `${docInfo.roomNumber}_${docInfo.floorWing}_${docInfo.timingSlot}`;
        if (prevLocationRef.current && prevLocationRef.current !== currentLocKey) {
          playUrgentAlert();
          vibrateDevice([250, 100, 250]);
          
          const alertMsg = {
            title: "Doctor Location / Timings Updated!",
            roomNumber: docInfo.roomNumber,
            floorWing: docInfo.floorWing,
            timingSlot: docInfo.timingSlot,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setLocationAlert(alertMsg);

          sendBrowserNotification(
            "Doctor Location Changed! - CityCare OPD",
            `${docInfo.name} is now in ${docInfo.roomNumber} (${docInfo.floorWing}). Hours: ${docInfo.timingSlot}`
          );
        }
        prevLocationRef.current = currentLocKey;
      }
    });

    // Listen to doctor queue to calculate position
    const unsubQueue = subscribeDoctorTokens(session.doctorId, (allTokens) => {
      setDoctorQueueTokens(allTokens);
    });

    return () => {
      unsubToken();
      unsubPharmacy();
      unsubDoc();
      unsubQueue();
    };
  }, [session]);

  // Handle Check-in submit (Supports Walk-In and Slot Booking)
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !phoneNumber.trim() || !selectedDoctorId) {
      setErrorMessage('Please fill in your name, 10-digit phone number, and select a doctor.');
      return;
    }
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    const docObj = doctors.find(d => d.id === selectedDoctorId);

    // If slot prepayment, open Razorpay modal
    if (entryMode === 'slot' && paymentOption === 'prepaid') {
      setPendingSlotBooking({
        selectedDoctorId,
        docObj,
        patientName: patientName.trim(),
        phoneNumber: phoneNumber.trim(),
        reason: reason.trim(),
        slotTime: selectedSlotTime,
        lane: patientLane
      });
      setShowPaymentModal(true);
      return;
    }

    await executeBooking({
      selectedDoctorId,
      docObj,
      patientName: patientName.trim(),
      phoneNumber: phoneNumber.trim(),
      reason: reason.trim(),
      lane: patientLane,
      slotTime: entryMode === 'slot' ? selectedSlotTime : null,
      paymentStatus: paymentOption,
      paymentMethod: 'Pay at Hospital'
    });
  };

  const executeBooking = async (bookingParams) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await requestNotificationPermission();

      const { selectedDoctorId, docObj, patientName, phoneNumber, reason, lane, slotTime, paymentStatus, paymentMethod, gatewayTxId } = bookingParams;

      let result;
      if (entryMode === 'slot') {
        result = await bookDoctorSlot(selectedDoctorId, {
          patientName,
          phoneNumber,
          reason,
          slotTime,
          consultationFee: docObj?.consultationFee || 500,
          hospitalId: activeHospital?.id || docObj?.hospitalId || 'citycare-central',
          hospitalName: activeHospital?.name || docObj?.hospitalName || 'CityCare Central Hospital',
          doctorName: docObj?.name || '',
          paymentStatus: paymentStatus || 'prepaid',
          paymentMethod: paymentMethod || 'UPI / Razorpay',
          lane: lane || 'normal'
        });
      } else {
        result = await generateToken(selectedDoctorId, {
          patientName,
          phoneNumber,
          reason,
          lane: lane || 'normal',
          type: 'walkin',
          addedBy: 'self'
        });
      }

      const newSession = {
        doctorId: selectedDoctorId,
        tokenId: result.tokenId,
        tokenNumber: result.tokenNumber,
        tokenCode: result.tokenCode,
        patientName,
        phoneNumber,
        entryMode,
        slotTime: entryMode === 'slot' ? slotTime : null,
        lane: lane || 'normal'
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);

      // Save to OPD Visit History
      saveToUserHistory({
        id: `hist-${result.tokenId || Date.now()}`,
        tokenNumber: result.tokenNumber,
        tokenCode: result.tokenCode,
        bookingMode: entryMode,
        slotTime: entryMode === 'slot' ? slotTime : null,
        patientName,
        phoneNumber,
        doctorId: selectedDoctorId,
        doctorName: docObj?.name || doctorData?.name || 'Doctor',
        department: docObj?.department || doctorData?.department || 'General Medicine',
        qualification: docObj?.qualification || doctorData?.qualification || '',
        hospitalId: activeHospital?.id || docObj?.hospitalId || 'citycare-central',
        hospitalName: activeHospital?.name || docObj?.hospitalName || 'CityCare Central Hospital',
        roomNumber: docObj?.roomNumber || doctorData?.roomNumber || 'Room 102',
        floorWing: docObj?.floorWing || doctorData?.floorWing || '',
        reason: reason || 'OPD Consultation',
        status: 'waiting',
        lane: lane || 'normal',
        consultationFee: docObj?.consultationFee || 500,
        paymentStatus: paymentStatus === 'prepaid' ? 'paid' : 'pay-at-hospital',
        gatewayTxId: gatewayTxId || null,
        date: new Date().toISOString().split('T')[0]
      });

      playChime();
    } catch (err) {
      console.error('Check-in error:', err);
      setErrorMessage('Failed to generate token: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRazorpaySuccess = async (txResult) => {
    if (!pendingSlotBooking) return;
    await executeBooking({
      ...pendingSlotBooking,
      paymentStatus: 'prepaid',
      paymentMethod: txResult.paymentMethod,
      gatewayTxId: txResult.gatewayTxId
    });
    setPendingSlotBooking(null);
  };

  const handleCancelAndRefund = async () => {
    if (!session?.tokenId && !session?.tokenNumber) return;
    try {
      setIsCancelling(true);
      const refund = calculateSlotRefund(session.slotTime, doctorData?.consultationFee || 500);

      if (refund.refundAmount > 0) {
        await recordTransaction({
          type: 'refund',
          amount: -refund.refundAmount,
          platformCut: 0,
          hospitalPayout: -refund.refundAmount,
          patientName: session.patientName,
          doctorId: session.doctorId,
          doctorName: doctorData?.name || '',
          hospitalId: activeHospital?.id || 'citycare-central',
          hospitalName: activeHospital?.name || 'CityCare Central Hospital',
          paymentMethod: 'UPI / Original Source',
          status: 'refunded',
          notes: `${refund.reason} for cancelled slot ${session.slotTime || ''}`
        });
      }

      await logAuditEvent({
        actor: session.patientName,
        actorRole: 'patient',
        action: 'SLOT_CANCELLED_REFUND',
        entityType: 'token',
        entityId: session.tokenId,
        reason: refund.reason,
        details: { refundAmount: refund.refundAmount, refundPercent: refund.refundPercent }
      });

      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
      setMyTokenData(null);
      setShowCancelModal(false);
      alert(`Booking cancelled successfully. Refund: ₹${refund.refundAmount} (${refund.refundPercent}% refund policy applied).`);
    } catch (e) {
      console.error(e);
      alert('Cancellation error: ' + e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!doctorData) return;
    setSubmittingReview(true);
    try {
      await submitReview({
        hospitalId: activeHospital?.id || doctorData.hospitalId || 'citycare-central',
        hospitalName: activeHospital?.name || doctorData.hospitalName || 'CityCare Central Hospital',
        doctorId: doctorData.id,
        doctorName: doctorData.name,
        patientName: session?.patientName || patientName || 'Patient',
        rating: patientRating,
        comment: reviewComment
      });

      // Update in history as well
      if (session?.tokenId) {
        saveToUserHistory({
          id: `hist-${session.tokenId}`,
          rating: patientRating,
          reviewText: reviewComment,
          status: 'completed'
        });
      }

      setReviewSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLeaveQueue = () => {
    if (window.confirm('Are you sure you want to leave the queue?')) {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
      setMyTokenData(null);
      setLocationAlert(null);
      setReviewSubmitted(false);
      setReviewComment('');
      prevLocationRef.current = null;
    }
  };

  // Queue Calculations (PRD v4 6.3 & 6.4)
  const myTokenNum = myTokenData?.tokenNumber || session?.tokenNumber;
  const currentServingToken = doctorQueueTokens.find(t => t.status === 'in-progress');
  const servingNumber = currentServingToken ? currentServingToken.tokenNumber : (doctorQueueTokens.filter(t => t.status === 'completed').length);

  const patientsAhead = doctorQueueTokens.filter(
    t => t.status === 'waiting' && (t.tokenNumber || 0) < (myTokenNum || 0)
  ).length;

  const completedConsults = doctorQueueTokens.filter(t => t.status === 'completed');
  const waitInfo = calculateWaitTimeRange(patientsAhead, doctorData || {}, completedConsults);

  const leaveNowInfo = getLeaveNowState({
    etaMin: waitInfo.minRange,
    travelTimeMinutes: 14,
    parkingBufferMinutes: 5
  });

  const refundInfo = calculateSlotRefund(
    session?.slotTime || myTokenData?.slotTime, 
    doctorData?.consultationFee || 500
  );

  const avgConsult = doctorData?.avgConsultationMinutes || 10;
  const estimatedWaitMinutes = patientsAhead * avgConsult;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Dynamic Location Notification Banner */}
      {locationAlert && (
        <div className="notification-banner-urgent glass-card" style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{
                background: '#f59e0b',
                color: '#fff',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BellRing size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {locationAlert.title}
                </h4>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  The doctor is now consulting in <strong>{locationAlert.roomNumber}</strong> ({locationAlert.floorWing}).
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  <span><CalendarClock size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Timings: {locationAlert.timingSlot}</span>
                  <span>Updated at {locationAlert.timestamp}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLocationAlert(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED PHARMACY ORDER BANNER (Queue screen cleared) */}
      {completedOrderNotice && (
        <div style={{
          background: '#ecfdf5',
          border: '2px solid #10b981',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={26} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#064e3b' }}>
                ✓ Pharmacy Order Dispensed &amp; OPD Visit Complete!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                Token #{completedOrderNotice.tokenNumber} is closed. Medicines dispensed at pharmacy counter.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCompletedOrderNotice(null)}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* VIEW A: CHECK-IN SCREEN */}
      {!session ? (
        <div className="glass-card" style={{ padding: '2.25rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)'
            }}>
              <Ticket size={30} />
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)' }}>Get Your OPD Digital Token</h2>
            <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Track your live position and wait outside the crowded hall. Receive alerts when your turn arrives!
            </p>
          </div>

          {errorMessage && (
            <div style={{
              background: 'var(--badge-skip-bg)',
              border: '1px solid var(--badge-skip-border)',
              color: 'var(--badge-skip-text)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Hospital Affiliation Header */}
            {activeHospital && (
              <div style={{
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                    Consultation Facility
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#090d16' }}>
                    🏥 {activeHospital.name}
                  </div>
                </div>
                {onSwitchToHospitals && (
                  <button
                    type="button"
                    onClick={onSwitchToHospitals}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #93c5fd',
                      color: '#0284c7',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Change Hospital
                  </button>
                )}
              </div>
            )}

            {/* Mode Selector: Walk-In vs Slot Booking (MediQ PRD Section 9.3) */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setEntryMode('walkin')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '0.55rem',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: entryMode === 'walkin' ? '#0284c7' : 'transparent',
                  color: entryMode === 'walkin' ? '#ffffff' : '#475569',
                  boxShadow: entryMode === 'walkin' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                ⚡ Instant Walk-In Token
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('slot')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '0.55rem',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: entryMode === 'slot' ? '#0284c7' : 'transparent',
                  color: entryMode === 'slot' ? '#ffffff' : '#475569',
                  boxShadow: entryMode === 'slot' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                📅 Book OPD Time Slot
              </button>
            </div>

            {/* Slot Picker (Shown when Slot mode is selected) */}
            {entryMode === 'slot' && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase' }}>
                    SELECT TODAY'S APPOINTMENT WINDOW
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '0.3rem' }}>
                    Zero-Wait Priority
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  {['09:30 AM - 09:45 AM', '10:00 AM - 10:15 AM', '10:30 AM - 10:45 AM', '11:00 AM - 11:15 AM', '11:30 AM - 11:45 AM', '12:00 PM - 12:15 PM', '02:00 PM - 02:15 PM', '02:30 PM - 02:45 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: selectedSlotTime === slot ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: selectedSlotTime === slot ? '#eff6ff' : '#ffffff',
                        color: selectedSlotTime === slot ? '#0284c7' : '#090d16',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                  <span style={{ fontWeight: 700, color: '#475569' }}>Consultation Fee:</span>
                  <strong style={{ fontWeight: 900, color: '#059669', fontSize: '1.1rem' }}>
                    ₹{displayDoctors.find(d => d.id === selectedDoctorId)?.consultationFee || 500}
                  </strong>
                </div>
              </div>
            )}

            {/* PRD v4: Family Profiles */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Booking For <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {[
                  { id: 'self', label: 'Myself (Riya)', icon: '👤' },
                  { id: 'ramesh', label: 'Ramesh (Father, 68)', icon: '👴', defaultLane: 'senior' },
                  { id: 'aarav', label: 'Aarav (Child, 4)', icon: '👶', defaultLane: 'pregnant' },
                  { id: 'other', label: '+ Add Family Member', icon: '➕' }
                ].map(mem => (
                  <button
                    key={mem.id}
                    type="button"
                    onClick={() => {
                      setFamilyProfile(mem.id);
                      if (mem.id === 'self') {
                        setPatientName(currentUser?.displayName || 'Riya Sharma');
                        setPatientLane('normal');
                      } else if (mem.id === 'ramesh') {
                        setPatientName('Ramesh Kumar');
                        setPatientLane('senior');
                      } else if (mem.id === 'aarav') {
                        setPatientName('Aarav Patel');
                        setPatientLane('pregnant');
                      }
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: familyProfile === mem.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: familyProfile === mem.id ? '#eff6ff' : '#ffffff',
                      color: familyProfile === mem.id ? '#0284c7' : '#334155',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{mem.icon}</span> {mem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PRD v4 Section 6.2: Priority Lanes */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#334155', textTransform: 'uppercase' }}>
                  Priority Triage Lane
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: patientLane !== 'normal' ? '#059669' : '#64748b' }}>
                  {patientLane !== 'normal' ? '⚡ +50 Queue Score Bonus' : 'Standard FIFO'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: patientLane === 'normal' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: patientLane === 'normal' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  <input
                    type="radio"
                    name="patientLane"
                    checked={patientLane === 'normal'}
                    onChange={() => setPatientLane('normal')}
                  />
                  <span>Normal OPD</span>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: patientLane === 'senior' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  background: patientLane === 'senior' ? '#fffbeb' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  <input
                    type="radio"
                    name="patientLane"
                    checked={patientLane === 'senior'}
                    onChange={() => setPatientLane('senior')}
                  />
                  <span>👴 Senior Citizen (60+)</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Priya Sharma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Phone Number (10 digits) <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                required
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Used to deliver token status updates &amp; alerts.
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Department &amp; Doctor <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '0.4rem' }}>
                  ✓ KYC Verified Clinicians
                </span>
              </div>
              <select
                className="input-field"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                required
              >
                {displayDoctors.length === 0 ? (
                  <option disabled value="">No approved doctors available for this facility</option>
                ) : (
                  displayDoctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.department} ({d.roomNumber || 'Room 101'})
                    </option>
                  ))
                )}
              </select>
              {displayDoctors.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, marginTop: '0.35rem', display: 'block' }}>
                  ⏳ Doctors for this hospital are currently pending Medical Council KYC verification.
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Reason for Visit (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Fever, Consultation, Blood pressure check"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* SECTION 7.9: Smart Leave-Now Engine Toggle */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Smart Leave-Now Alert (Reverse ETA)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Section 7.9 • Syncs live travel time to alert you exactly when to leave home.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={true}
                readOnly
                style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '1.05rem',
                fontSize: '1.1rem',
                fontWeight: 900,
                marginTop: '0.5rem'
              }}
            >
              <Ticket size={22} />
              <span>{isSubmitting ? 'Generating Token...' : 'Get My Digital Token'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* VIEW B: LIVE TOKEN STATUS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* PRD v4 Section 6.7: DOCTOR DELAY / PAUSE NOTICE */}
          {doctorData?.queuePaused && !delayNoticeDismissed && (
            <div style={{
              background: '#fff1f2',
              border: '2px solid #f43f5e',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.6rem' }}>🚨</span>
                  <div>
                    <div style={{ fontWeight: 900, color: '#9f1239', fontSize: '1.05rem' }}>
                      Doctor Delayed: {doctorData.pauseReason || 'Emergency surgery'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#be123c', fontWeight: 700 }}>
                      Expected Delay: ~{doctorData.expectedDelayMinutes || 30} mins. Your queue spot is preserved.
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDelayNoticeDismissed(true)}
                  style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '0.45rem 0.95rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ✓ Stay in Queue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Doctor reassignment request submitted. Front desk is allocating available General Medicine consultant.');
                  }}
                  style={{ background: '#ffffff', color: '#9f1239', border: '1.5px solid #f43f5e', padding: '0.45rem 0.95rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🔄 Switch Doctor (Same Specialty)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  style={{ background: '#ffffff', color: '#64748b', border: '1.5px solid #cbd5e1', padding: '0.45rem 0.95rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  📅 Cancel / Refund Slot
                </button>
              </div>
            </div>
          )}

          {/* PRD v4 Section 6.4: 4-STATE SMART LEAVE-NOW ENGINE ALERT BANNER */}
          {myTokenData?.status === 'waiting' && (
            <div style={{
              background: leaveNowInfo.state === 'red' ? '#ffe4e6' : (leaveNowInfo.state === 'amber' ? '#fef3c7' : '#eff6ff'),
              border: `2px solid ${leaveNowInfo.state === 'red' ? '#f43f5e' : (leaveNowInfo.state === 'amber' ? '#f59e0b' : '#38bdf8')}`,
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: leaveNowInfo.state === 'red' ? '0 8px 24px rgba(244, 63, 94, 0.25)' : 'none',
              animation: leaveNowInfo.state === 'red' ? 'pulse 2s infinite' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: leaveNowInfo.state === 'red' ? '#e11d48' : (leaveNowInfo.state === 'amber' ? '#d97706' : '#0284c7'),
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Car size={26} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: leaveNowInfo.state === 'red' ? '#9f1239' : (leaveNowInfo.state === 'amber' ? '#92400e' : '#0369a1') }}>
                    {leaveNowInfo.label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                    {leaveNowInfo.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                    Traffic confidence: ±3 min &bull; Hospital parking buffer: {leaveNowInfo.buffer} min
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    const hospName = activeHospital?.name || 'CityCare Central Hospital';
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospName)}`, '_blank');
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#0284c7',
                    border: '1.5px solid #0284c7',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <Navigation size={14} /> Open in Maps
                </button>
                <span style={{
                  background: leaveNowInfo.badgeColor,
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px'
                }}>
                  {leaveNowInfo.state.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Main Token Hero Card (Pinterest Aesthetic) */}
          <div className="glass-card pinterest-card" style={{
            padding: '2.5rem 1.75rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            background: myTokenData?.status === 'in-progress' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)' 
              : 'var(--bg-surface)',
            border: myTokenData?.status === 'in-progress' ? '2.5px solid #059669' : '1.5px solid var(--border-subtle)',
            boxShadow: myTokenData?.status === 'in-progress'
              ? '0 20px 45px -10px rgba(5, 150, 105, 0.25)'
              : '0 12px 35px -10px rgba(0, 0, 0, 0.06)'
          }}>
            
            {/* PRD v4: Priority Lane & Slot Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {session?.lane === 'emergency' && (
                <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: 900, fontSize: '0.78rem', border: '1.5px solid #f43f5e' }}>
                  🚨 EMERGENCY LANE (Priority 1000)
                </span>
              )}
              {['senior', 'pregnant', 'disabled'].includes(session?.lane) && (
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: 900, fontSize: '0.78rem', border: '1.5px solid #f59e0b' }}>
                  👴 PRIORITY CARE LANE (+50 Score)
                </span>
              )}
              {(!session?.lane || session?.lane === 'normal') && (
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #cbd5e1' }}>
                  👤 Normal OPD Lane
                </span>
              )}
              {session?.entryMode === 'slot' && (
                <span style={{ background: '#eff6ff', color: '#0284c7', padding: '0.3rem 0.85rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #bfdbfe' }}>
                  📅 Slot: {session.slotTime || '10:30 AM'} (Grace: ±10 min)
                </span>
              )}
            </div>

            {/* Status Pill */}
            <div style={{ marginBottom: '1.15rem' }}>
              {myTokenData?.status === 'in-progress' && (
                <span className="badge badge-in-progress" style={{ fontSize: '0.88rem', padding: '0.4rem 1.15rem' }}>
                  <span className="pulse-dot" style={{ background: '#10b981' }}></span>
                  Now Calling You! Proceed to Room
                </span>
              )}
              {myTokenData?.status === 'waiting' && (
                patientsAhead === 0 ? (
                  <span className="badge badge-next" style={{ fontSize: '0.88rem', padding: '0.4rem 1.15rem' }}>
                    <span className="pulse-dot" style={{ background: '#f59e0b' }}></span>
                    You're Next In Line!
                  </span>
                ) : (
                  <span className="badge badge-waiting" style={{ fontSize: '0.88rem', padding: '0.4rem 1.15rem' }}>
                    Waiting In Queue
                  </span>
                )
              )}
              {myTokenData?.status === 'completed' && (
                <span className="badge badge-completed" style={{ fontSize: '0.88rem', padding: '0.4rem 1.15rem' }}>
                  ✓ Consultation Completed
                </span>
              )}
              {myTokenData?.status === 'skipped' && (
                <span className="badge badge-skipped" style={{ fontSize: '0.88rem', padding: '0.4rem 1.15rem' }}>
                  Token Skipped (Moved 3 back)
                </span>
              )}
              {myTokenData?.status === 'no-show' && (
                <span className="badge badge-skipped" style={{ fontSize: '0.88rem', padding: '0.4rem 1.15rem', background: '#fef2f2', color: '#dc2626' }}>
                  ❌ Closed as No-Show
                </span>
              )}
            </div>

            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Your Token Number
            </span>

            <div style={{
              fontSize: '5.8rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.05,
              margin: '0.25rem 0',
              color: myTokenData?.status === 'in-progress' ? '#059669' : '#0284c7'
            }}>
              #{myTokenNum}
            </div>

            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {session.patientName}
            </div>

            {/* Live Comparison Counters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1.5rem',
              padding: '1.15rem',
              background: 'var(--bg-inner)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Currently Serving</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7' }}>
                  {servingNumber ? `#${servingNumber}` : '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Patients Ahead of You</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: patientsAhead === 0 ? '#d97706' : 'var(--text-primary)' }}>
                  {patientsAhead}
                </div>
              </div>
            </div>

            {/* PRD v4 Section 6.3: Estimated Wait Time Range */}
            {myTokenData?.status === 'waiting' && (
              <div style={{
                marginTop: '1.15rem',
                padding: '0.85rem 1rem',
                background: '#f0f9ff',
                border: '1.5px solid #bae6fd',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#0369a1', fontSize: '1.05rem', fontWeight: 900 }}>
                  <Clock size={20} />
                  <span>Estimated Wait: <strong>{waitInfo.displayRange}</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginTop: '3px' }}>
                  Rolling pace: ~{waitInfo.avgConsult} min/patient (weighted x1.5) &bull; Confidence range: ±{waitInfo.stdDev} min
                </div>
              </div>
            )}

            {/* Cancel & Refund Action Buttons */}
            {myTokenData?.status === 'waiting' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                {session?.entryMode === 'slot' && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    style={{
                      padding: '0.5rem 1.1rem',
                      borderRadius: '8px',
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1.5px solid #fecdd3',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel Slot &amp; Refund
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLeaveQueue}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Leave Queue
                </button>
              </div>
            )}
          </div>

          {/* DYNAMIC DOCTOR MEETING PLACE & TIMINGS CARD */}
          <div className="glass-card" style={{
            padding: '1.65rem',
            background: 'var(--bg-card)',
            border: '2px solid var(--border-subtle)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <DoorOpen size={24} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>Doctor Location &amp; Schedule</h3>
              </div>
              <span className="badge badge-in-progress" style={{ fontSize: '0.7rem' }}>
                Live Sync
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {doctorData?.name || 'Doctor'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                  {doctorData?.department || 'OPD Department'}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <MapPin size={20} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Consultation Room</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {doctorData?.roomNumber || 'Room 101'}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {doctorData?.floorWing || 'Ground Floor'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <CalendarClock size={20} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Hospital Timings</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {doctorData?.timingSlot || '09:00 AM - 02:00 PM'}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Today's Consultation Slot
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* POST-CONSULTATION RATING & REVIEW CARD (MediQ PRD Section 9.10) */}
          {myTokenData?.status === 'completed' && (
            <div style={{
              background: '#ffffff',
              border: '2px solid #10b981',
              borderRadius: '1.25rem',
              padding: '1.75rem',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.35rem' }}>🩺</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#090d16', margin: '0 0 0.35rem' }}>
                How was your OPD Consultation?
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600, margin: '0 0 1.25rem' }}>
                Rate <strong>{doctorData?.name || 'the Doctor'}</strong> at <strong>{doctorData?.hospitalName || activeHospital?.name || 'CityCare Central Hospital'}</strong> to help future patients.
              </p>

              {reviewSubmitted ? (
                <div style={{ background: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0', padding: '1rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.95rem' }}>
                  ✓ Thank you for your feedback! Your verified patient review has been published to the MediQ marketplace.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPatientRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '2rem',
                          color: star <= patientRating ? '#f59e0b' : '#cbd5e1',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Share your experience with the doctor's consultation, wait time, or room facilities..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '0.65rem',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#090d16',
                      marginBottom: '1rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={submittingReview}
                    style={{
                      width: '100%',
                      background: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.9rem',
                      borderRadius: '0.65rem',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
                    }}
                  >
                    {submittingReview ? 'Submitting Review...' : 'Submit Verified Patient Review ★'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SECTION 7.10: AUTO PHARMACY TOKEN DISPENSE TRACKER */}
          {myTokenData?.status === 'completed' && (
            <div className="glass-card" style={{ padding: '1.75rem', border: '2px solid #059669', background: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#059669',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Pill size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#15803d', textTransform: 'uppercase' }}>
                      SECTION 7.10 • AUTO PHARMACY TOKEN HANDOFF
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#064e3b' }}>
                      Hospital Pharmacy Dispense Counter
                    </h3>
                  </div>
                </div>

                <span style={{
                  background: '#dcfce7',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  border: '1px solid #86efac'
                }}>
                  ● LIVE HANDOFF ACTIVE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#fff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bbf7d0', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>YOUR PHARMACY TOKEN</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
                    {myTokenData?.pharmacyTokenCode || 'PH-02'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                    Linked to Doctor OPD Visit
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>DISPENSE COUNTER</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '0.25rem' }}>
                    Counter 1 (Main Atrium)
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    Estimated dispense time: ~4 mins
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>STATUS</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}>
                      ⏳ Pharmacist Packing Medicines
                    </span>
                  </div>
                </div>
              </div>

              {/* Scheduled EV Rider Delivery & Dark-Store Fulfillment Action Bar (PRD v5 Module B) */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #38bdf8',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', background: '#0284c7', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                      MODULE B • HYPERLOCAL BLINKIT SPEED
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#059669', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                      POSTER SCOPE 3
                    </span>
                  </div>
                  <h4 style={{ margin: '0.3rem 0 0.15rem', fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                    Scheduled Home Delivery by Certified EV Rider Fleet
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Select your convenient time slot or 15-min express delivery with 70.9% Jan Aushadhi generic savings &amp; secret doorstep OTP handoff.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBlinkitInitialMode('scheduled_rider');
                      setShowBlinkitModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)'
                    }}
                  >
                    <Bike size={16} />
                    <span>🛵 Schedule Home Delivery (Rider &amp; Slot)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBlinkitInitialMode('express_rider');
                      setShowBlinkitModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Zap size={16} />
                    <span>⚡ 15-Min Express Rider</span>
                  </button>
                </div>
              </div>

              {/* Explicit Exit / Done Button: Clears queue screen once pharmacy is completed */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    playChime();
                    setCompletedOrderNotice({
                      tokenNumber: myTokenData?.tokenNumber || session?.tokenNumber,
                      doctorName: doctorData?.name || session?.doctorName || 'Doctor',
                      medicines: myTokenData?.prescribedMedicines || []
                    });
                    try {
                      localStorage.removeItem(STORAGE_KEY);
                    } catch (e) {}
                    setSession(null);
                    setMyTokenData(null);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>✓ Medicines Received — Clear Queue Screen</span>
                </button>
              </div>

              {/* SECTION 7.11: PHARMACY PRICE & DISTANCE COMPARISON TABLE */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <TrendingUp size={20} color="#059669" />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#064e3b' }}>
                    Section 7.11 • Pharmacy Price &amp; Distance Comparison
                  </h4>
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  Compare real-time medicine availability, travel distance, and prescription costs across nearby pharmacies:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {getPharmacyPriceComparison(myTokenData?.prescribedMedicines).map((pharm) => (
                    <div 
                      key={pharm.id}
                      style={{
                        background: '#fff',
                        border: pharm.isHospitalPharmacy ? '2px solid #059669' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#090d16', fontWeight: 900 }}>{pharm.name}</strong>
                          <span style={{
                            background: `${pharm.badgeColor}15`,
                            color: pharm.badgeColor,
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '10px'
                          }}>
                            {pharm.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                          📍 {pharm.distanceKm === 0 ? 'Inside Hospital (Ground Floor)' : `${pharm.distanceKm} km away • ~${pharm.travelTimeMinutes} min drive`} • {pharm.address}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>ESTIMATED TOTAL</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                            ₹{pharm.totalPrice}
                          </div>
                        </div>

                        {pharm.isHospitalPharmacy ? (
                          <button
                            type="button"
                            style={{
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: 900,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Active Token #{myTokenData?.pharmacyTokenCode || 'PH-02'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(pharm.name + ' ' + pharm.address)}`, '_blank')}
                            style={{
                              background: '#f1f5f9',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Navigation size={14} />
                            <span>Navigate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Leave Queue Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button
              onClick={handleLeaveQueue}
              className="btn btn-secondary"
              style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-muted)', border: 'none', background: 'transparent' }}
            >
              Need to check in another person or leave queue? Click here
            </button>
          </div>

        </div>
      )}

      {/* PRD v4 Section 9: DPDP ACT 2023 PRIVACY & CONSENT BADGE */}
      <div style={{
        marginTop: '2rem',
        padding: '0.85rem 1.25rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.78rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>🔒</span>
          <div>
            <strong style={{ color: '#334155' }}>DPDP Act 2023 Consent Active:</strong> Digital Health Data encrypted at rest &bull; GPS location tracking restricted to active OPD token duration only.
          </div>
        </div>
        <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 800 }}>
          ✓ Explicit Consent Recorded
        </span>
      </div>

      {/* RAZORPAY PAYMENT MODAL (PRD v4 Section 6.9) */}
      <RazorpayModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingSlotBooking(null);
        }}
        amount={pendingSlotBooking?.docObj?.consultationFee || 500}
        title="OPD Slot Prepayment"
        doctorName={pendingSlotBooking?.docObj?.name || 'Doctor'}
        hospitalName={activeHospital?.name || 'CityCare Central Hospital'}
        slotTime={pendingSlotBooking?.slotTime || selectedSlotTime}
        onPaymentSuccess={handleRazorpaySuccess}
      />

      {/* BLINKIT HYPERLOCAL & SCHEDULED RIDER FULFILLMENT MODAL (MODULE B) */}
      <BlinkitFulfillmentModal
        isOpen={showBlinkitModal}
        onClose={() => setShowBlinkitModal(false)}
        initialMedicines={myTokenData?.prescribedMedicines || ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Pantoprazole 40mg']}
        initialMode={blinkitInitialMode}
        doctorName={doctorData?.name || session?.doctorName || 'Dr. Rajesh Mehta'}
        patientName={patientName || currentUser?.displayName || 'Ravi Kumar Patel'}
      />

      {/* CANCELLATION & REFUND POLICY MODAL (PRD v4 Section 6.5) */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.75rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#090d16', marginBottom: '0.5rem' }}>
              Cancel Appointment &amp; Request Refund
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Are you sure you want to cancel your scheduled consultation with <strong>{doctorData?.name}</strong>?
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                Refund Calculation (PRD 6.5 Policy)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Original Paid Fee:</span>
                <strong style={{ fontSize: '0.95rem', color: '#090d16' }}>₹{doctorData?.consultationFee || 500}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Refund Rate:</span>
                <strong style={{ fontSize: '0.95rem', color: refundInfo.refundPercent > 0 ? '#059669' : '#dc2626' }}>
                  {refundInfo.refundPercent}%
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#090d16' }}>Net Refund to Account:</span>
                <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>₹{refundInfo.refundAmount}</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 600 }}>
                Rule: {refundInfo.reason}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleCancelAndRefund}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  cursor: isCancelling ? 'not-allowed' : 'pointer'
                }}
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
