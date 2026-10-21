import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  runTransaction, 
  onSnapshot, 
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCFe8xhMFk-UWafaqaNKJIVxADkM8RrL34",
  authDomain: "smart-opd-queue-tracker.firebaseapp.com",
  projectId: "smart-opd-queue-tracker",
  storageBucket: "smart-opd-queue-tracker.firebasestorage.app",
  messagingSenderId: "489741916150",
  appId: "1:489741916150:web:969809047cf4bca9c8d9d7",
  measurementId: "G-9F3QR1DYXJ"
};

export const RAZORPAY_KEY_ID = "rzp_test_TmxKQ0fOUHs5z8";

export const razorpayConfig = {
  keyId: RAZORPAY_KEY_ID,
  merchantName: "MediQ OPD Prepayment",
  themeColor: "#0284c7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const RAZORPAY_CONFIG = {
  keyId: RAZORPAY_KEY_ID
};

export function getTodayDateKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Atomic token generation transaction (Section 6.1 & 6.2 of PRD v4)
 * Supports priority lanes: Emergency (+1000), Senior/Pregnant/Disabled (+50), Normal (0)
 * Cap checking: walk-in cap = dailyCap - reservedForSlots
 * Idempotency: prevents duplicate booking for same patient/date
 */
export async function generateToken(doctorId, patientData) {
  const todayKey = getTodayDateKey();
  const counterRef = doc(db, 'doctors', doctorId, 'counters', todayKey);
  const tokenColRef = collection(db, 'doctors', doctorId, 'tokens');
  const newTokenDocRef = doc(tokenColRef);

  const lane = patientData.lane || 'normal'; // 'emergency' | 'senior' | 'pregnant' | 'disabled' | 'normal'
  const laneWeight = lane === 'emergency' ? 1000 : (['senior', 'pregnant', 'disabled'].includes(lane) ? 50 : 0);
  const slotBonus = patientData.type === 'slot' && patientData.arrivedInGrace ? 30 : 0;
  const initialPriorityScore = laneWeight + slotBonus;

  return await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists() ? (counterSnap.data().lastToken || 0) : 0;
    const walkInCount = counterSnap.exists() ? (counterSnap.data().walkInCount || 0) : 0;
    
    // Check doctor caps if available
    const doctorRef = doc(db, 'doctors', doctorId);
    const doctorSnap = await tx.get(doctorRef);
    const doctorData = doctorSnap.exists() ? doctorSnap.data() : {};
    const dailyCap = doctorData.dailyCap || 40;
    const reservedForSlots = doctorData.reservedForSlots || 15;
    const walkInCap = Math.max(10, dailyCap - reservedForSlots);

    const isWalkIn = (patientData.type || 'walkin') === 'walkin';
    if (isWalkIn && walkInCount >= walkInCap && !patientData.overrideCap) {
      const err = new Error(`Walk-in quota for today (${walkInCap} patients) has been reached. Please book an OPD slot or consult another available doctor.`);
      err.code = 'CAP_REACHED';
      throw err;
    }

    const nextToken = current + 1;
    const doctorCode = (doctorData.doctorCode || doctorId.replace(/[^a-zA-Z0-9]/g, '').slice(-3)).toUpperCase();
    const tokenDisplayCode = `D${doctorCode}-${String(nextToken).padStart(2, '0')}`;

    tx.set(counterRef, { 
      lastToken: nextToken, 
      dateKey: todayKey,
      walkInCount: isWalkIn ? walkInCount + 1 : walkInCount
    }, { merge: true });

    const tokenPayload = {
      id: newTokenDocRef.id,
      tokenNumber: nextToken,
      tokenCode: tokenDisplayCode,
      patientName: patientData.patientName,
      phoneNumber: patientData.phoneNumber,
      familyMemberName: patientData.familyMemberName || null,
      familyMemberRelation: patientData.familyMemberRelation || null,
      reason: patientData.reason || '',
      doctorId: doctorId,
      doctorName: doctorData.name || patientData.doctorName || 'Doctor',
      department: doctorData.department || patientData.department || 'General Medicine',
      hospitalId: doctorData.hospitalId || patientData.hospitalId || 'citycare-central',
      lane: lane,
      type: patientData.type || 'walkin', // 'walkin' | 'slot'
      slotTime: patientData.slotTime || null,
      priorityScore: initialPriorityScore,
      laneWeight: laneWeight,
      status: 'waiting',
      skipCount: 0,
      secondMissNoShow: false,
      date: todayKey,
      createdAt: serverTimestamp(),
      calledAt: null,
      completedAt: null,
      addedBy: patientData.addedBy || 'self'
    };

    tx.set(newTokenDocRef, tokenPayload);

    return {
      tokenId: newTokenDocRef.id,
      tokenNumber: nextToken,
      tokenCode: tokenDisplayCode,
      doctorId,
      priorityScore: initialPriorityScore,
      lane
    };
  });
}

/**
 * PRD v4 Section 6.2: Score-based priority queue ordering with fairness
 * priority = laneWeight + slotBonus + agingBonus
 * lane: Emergency=1000, Senior/Pregnant/Disabled=50, Normal=0
 * slotBonus: +30 if slot arrived within grace window
 * agingBonus: +1 per 5 min waited (prevents starvation)
 * Emergency jumps to front, displaces at most 1 patient per 4 calls for non-emergency lanes
 */
export function calculatePriorityScore(token) {
  let score = token.laneWeight || 0;
  if (!score) {
    if (token.lane === 'emergency') score = 1000;
    else if (['senior', 'pregnant', 'disabled'].includes(token.lane)) score = 50;
    else score = 0;
  }
  if (token.type === 'slot' && token.arrivedInGrace) {
    score += 30;
  }
  // Aging bonus: +1 point per 5 minutes waited since token creation
  if (token.createdAt) {
    const createdDate = token.createdAt.toDate ? token.createdAt.toDate() : new Date(token.createdAt);
    const minsWaited = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / 60000));
    const agingBonus = Math.floor(minsWaited / 5);
    score += agingBonus;
  }
  if (token.skipCount === 1) {
    score -= 15; // Moved 3 positions back equivalent penalty
  }
  return score;
}

export function sortQueueByPriority(waitingTokens, consultCallCount = 0) {
  if (!waitingTokens || waitingTokens.length === 0) return [];

  const withScores = waitingTokens.map(t => ({
    ...t,
    dynamicPriorityScore: calculatePriorityScore(t)
  }));

  const emergencies = withScores.filter(t => t.lane === 'emergency');
  const others = withScores.filter(t => t.lane !== 'emergency');

  others.sort((a, b) => {
    if (b.dynamicPriorityScore !== a.dynamicPriorityScore) {
      return b.dynamicPriorityScore - a.dynamicPriorityScore;
    }
    return (a.tokenNumber || 0) - (b.tokenNumber || 0);
  });

  if (emergencies.length === 0) return others;

  // Emergency fairness: allows emergency to jump to front, max 1 displacement per 4 regular calls
  const finalQueue = [];
  let eIdx = 0;
  let oIdx = 0;

  while (eIdx < emergencies.length || oIdx < others.length) {
    if (eIdx < emergencies.length) {
      finalQueue.push(emergencies[eIdx++]);
    }
    for (let i = 0; i < 3 && oIdx < others.length; i++) {
      finalQueue.push(others[oIdx++]);
    }
  }

  return finalQueue;
}

/**
 * PRD v4 Section 6.3: Wait-Time (ETA) Estimation with Confidence Range
 * avgConsult = weighted rolling mean of last 10 consults (recent x1.5)
 * ETA = sum(avgConsult for each patient ahead) + expectedBreakRemaining
 * range = ETA ± (1.0 * stdDev(last 10) * sqrt(patientsAhead)), cap ±50%
 * Outlier guard: ignore consults <1 min or >60 min
 */
export function calculateWaitTimeRange(patientsAhead, doctorStats = {}, recentConsults = []) {
  if (patientsAhead <= 0) {
    return {
      etaMinutes: 0,
      minRange: 0,
      maxRange: 2,
      displayRange: '< 2 min',
      stdDev: 2,
      avgConsult: doctorStats.avgConsultationMinutes || 10
    };
  }

  const validConsults = (recentConsults || []).map(c => {
    if (c.calledAt && c.completedAt) {
      const called = c.calledAt.toDate ? c.calledAt.toDate() : new Date(c.calledAt);
      const completed = c.completedAt.toDate ? c.completedAt.toDate() : new Date(c.completedAt);
      const diff = Math.round((completed - called) / 60000);
      if (diff >= 1 && diff <= 60) return diff;
    }
    return null;
  }).filter(Boolean).slice(-10);

  let avgConsult = doctorStats.avgConsultationMinutes || 10;
  let stdDev = 3.5;

  if (validConsults.length >= 3) {
    let weightedSum = 0;
    let totalWeight = 0;
    validConsults.forEach((duration, idx) => {
      const weight = idx >= validConsults.length - 3 ? 1.5 : 1.0;
      weightedSum += duration * weight;
      totalWeight += weight;
    });
    avgConsult = Math.round(weightedSum / totalWeight);

    const mean = weightedSum / totalWeight;
    const variance = validConsults.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / validConsults.length;
    stdDev = Math.max(1.5, Math.round(Math.sqrt(variance) * 10) / 10);
  }

  const expectedBreakRemaining = doctorStats.queuePaused ? (doctorStats.expectedDelayMinutes || 15) : 0;
  const etaMinutes = (patientsAhead * avgConsult) + expectedBreakRemaining;

  const delta = Math.min(etaMinutes * 0.5, Math.max(2, Math.round(1.0 * stdDev * Math.sqrt(patientsAhead))));
  const minRange = Math.max(1, Math.round(etaMinutes - delta));
  const maxRange = Math.round(etaMinutes + delta);

  return {
    etaMinutes,
    minRange,
    maxRange,
    displayRange: `~${minRange}–${maxRange} min`,
    stdDev,
    avgConsult
  };
}

/**
 * PRD v4 Section 6.4: Leave-Now Engine
 * buffer = 5 min (configurable) + parkingBuffer
 * leaveAt = ETA_lower - travelTime - buffer
 * States: Green (plenty of time), Amber (leave in <=10 min), Red (Leave Now), Late (ETA passed)
 */
export function getLeaveNowState({ etaMin = 20, travelTimeMinutes = 12, parkingBufferMinutes = 5 }) {
  const buffer = 5 + (parkingBufferMinutes || 5);
  const leaveAtMinutes = etaMin - travelTimeMinutes - buffer;

  let state = 'green';
  let label = 'Plenty of Time';
  let message = `You can relax at home. Live traffic is ~${travelTimeMinutes} mins. We'll alert you when it's time to depart.`;
  let badgeColor = '#059669';

  if (leaveAtMinutes <= -5) {
    state = 'late';
    label = 'ETA Passed';
    message = 'Your scheduled consultation time has passed. Please contact the front desk or reschedule your slot.';
    badgeColor = '#dc2626';
  } else if (leaveAtMinutes <= 0) {
    state = 'red';
    label = '🚗 LEAVE NOW FOR OPD';
    message = `Traffic: ~${travelTimeMinutes} mins drive + ${buffer} mins parking buffer. Depart now to walk straight into the consultation room!`;
    badgeColor = '#e11d48';
  } else if (leaveAtMinutes <= 10) {
    state = 'amber';
    label = `🚗 Depart in ~${leaveAtMinutes} mins`;
    message = `Get ready to leave in ${leaveAtMinutes} minutes to arrive comfortably before your turn.`;
    badgeColor = '#d97706';
  }

  return {
    state,
    label,
    message,
    badgeColor,
    leaveAtMinutes: Math.max(0, leaveAtMinutes),
    buffer,
    travelTimeMinutes
  };
}

/**
 * PRD v4 Section 6.5: Slot Cancellation & Refund Rules
 * Cancel refund: >2h = 100%, 30 min–2h = 50%, <30 min or no-show = 0%
 */
export function calculateSlotRefund(slotTime, consultationFee = 500) {
  let hoursUntil = 3.0;
  try {
    const timeMatch = slotTime?.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const now = new Date();
      const slotDate = new Date();
      slotDate.setHours(hours, mins, 0, 0);
      const diffMs = slotDate.getTime() - now.getTime();
      hoursUntil = diffMs / (1000 * 60 * 60);
    }
  } catch (e) {}

  let refundPercent = 0;
  let reason = '';
  if (hoursUntil > 2.0) {
    refundPercent = 100;
    reason = 'Cancelled >2h before slot (100% full refund)';
  } else if (hoursUntil >= 0.5) {
    refundPercent = 50;
    reason = 'Cancelled between 30 min and 2h before slot (50% partial refund)';
  } else {
    refundPercent = 0;
    reason = 'Cancelled <30 min before slot or no-show (0% non-refundable)';
  }

  const refundAmount = Math.round((consultationFee * refundPercent) / 100);
  return {
    refundPercent,
    refundAmount,
    reason,
    hoursUntil: Math.max(0, Math.round(hoursUntil * 10) / 10)
  };
}

/**
 * PRD v4 Section 6.9: Append-Only Transactions Ledger
 * Reconciled daily; platformCut = fee * 10%, hospitalPayout = fee * 90%
 */
export async function recordTransaction(txData) {
  const txId = txData.id || `tx-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const fee = Number(txData.amount) || 500;
  const platformCut = txData.platformCut !== undefined ? Number(txData.platformCut) : Math.round(fee * 0.10);
  const hospitalPayout = txData.hospitalPayout !== undefined ? Number(txData.hospitalPayout) : (fee - platformCut);

  const payload = {
    id: txId,
    type: txData.type || 'slot_prepayment',
    amount: fee,
    platformCut,
    hospitalPayout,
    patientId: txData.patientId || 'patient-user',
    patientName: txData.patientName || 'Patient',
    doctorId: txData.doctorId || '',
    doctorName: txData.doctorName || '',
    hospitalId: txData.hospitalId || 'citycare-central',
    hospitalName: txData.hospitalName || 'CityCare Central Hospital',
    paymentMethod: txData.paymentMethod || 'UPI / Razorpay',
    status: txData.status || 'settled',
    gatewayTxId: txData.gatewayTxId || `pay_${Math.random().toString(36).substring(2, 12)}`,
    notes: txData.notes || '',
    createdAt: serverTimestamp(),
    timestamp: new Date().toISOString()
  };

  try {
    const txRef = doc(db, 'transactions', txId);
    await setDoc(txRef, payload, { merge: true });
  } catch (e) {
    console.warn('recordTransaction fallback to local:', e);
  }
  return payload;
}

export function subscribeTransactions(callback) {
  const colRef = collection(db, 'transactions');
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.timestamp || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.timestamp || 0);
      return dateB - dateA;
    });
    callback(list);
  }, () => {
    callback([]);
  });
}

/**
 * PRD v4 Section 9: Immutable Audit Logs
 * For overrides, skips, KYC decisions, refunds, and Rx edits
 */
export async function logAuditEvent(auditData) {
  const logId = `audit-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const payload = {
    id: logId,
    actor: auditData.actor || 'system',
    actorRole: auditData.actorRole || 'user',
    action: auditData.action,
    entityType: auditData.entityType || 'token',
    entityId: auditData.entityId || '',
    reason: auditData.reason || '',
    before: auditData.before || null,
    after: auditData.after || null,
    hospitalId: auditData.hospitalId || 'citycare-central',
    timestamp: new Date().toISOString(),
    createdAt: serverTimestamp()
  };

  try {
    const logRef = doc(db, 'audit_logs', logId);
    await setDoc(logRef, payload);
  } catch (e) {
    console.warn('logAuditEvent error:', e);
  }
  return payload;
}

export function subscribeAuditLogs(callback) {
  const colRef = collection(db, 'audit_logs');
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.timestamp || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.timestamp || 0);
      return dateB - dateA;
    });
    callback(list);
  }, () => {
    callback([]);
  });
}

/**
 * PRD v4 Section 6.7: Doctor Delay / Pause with Reason & Broadcast
 */
export async function pauseDoctorQueue(doctorId, { paused, reason = 'Emergency surgery', delayMinutes = 30 }) {
  const docRef = doc(db, 'doctors', doctorId);
  const payload = {
    queuePaused: paused,
    pauseReason: paused ? reason : null,
    expectedDelayMinutes: paused ? delayMinutes : 0,
    pauseStartedAt: paused ? serverTimestamp() : null
  };
  await updateDoc(docRef, payload);

  await logAuditEvent({
    actor: doctorId,
    actorRole: 'doctor',
    action: paused ? 'DOCTOR_QUEUE_PAUSED' : 'DOCTOR_QUEUE_RESUMED',
    entityType: 'doctor',
    entityId: doctorId,
    reason: reason,
    details: { delayMinutes }
  });

  return payload;
}

/**
 * PRD v4 Section 6.6: Skip (moved 3 positions back once) / No-Show (second miss) / Recall
 */
export async function skipToken(doctorId, tokenId, reason = 'Patient not present after 3-minute call window') {
  const tokenRef = doc(db, 'doctors', doctorId, 'tokens', tokenId);
  const tokenSnap = await runTransaction(db, async (tx) => {
    const snap = await tx.get(tokenRef);
    if (!snap.exists()) throw new Error('Token does not exist');
    const data = snap.data();
    const newSkipCount = (data.skipCount || 0) + 1;
    
    if (newSkipCount >= 2) {
      tx.update(tokenRef, {
        status: 'no-show',
        skipCount: newSkipCount,
        secondMissNoShow: true,
        noShowAt: serverTimestamp(),
        noShowReason: reason
      });
      return { status: 'no-show', skipCount: newSkipCount };
    } else {
      tx.update(tokenRef, {
        status: 'waiting',
        skipCount: newSkipCount,
        skippedAt: serverTimestamp(),
        skipReason: reason,
        laneWeight: (data.laneWeight || 0) - 15
      });
      return { status: 'skipped', skipCount: newSkipCount };
    }
  });

  await logAuditEvent({
    actor: doctorId,
    actorRole: 'doctor',
    action: tokenSnap.status === 'no-show' ? 'TOKEN_MARKED_NO_SHOW' : 'TOKEN_SKIPPED',
    entityType: 'token',
    entityId: tokenId,
    reason: reason,
    details: { skipCount: tokenSnap.skipCount }
  });

  return tokenSnap;
}

export async function recallToken(doctorId, tokenId, actorUid = 'staff') {
  const tokenRef = doc(db, 'doctors', doctorId, 'tokens', tokenId);
  await updateDoc(tokenRef, {
    status: 'waiting',
    recalledAt: serverTimestamp(),
    skipCount: 0
  });

  await logAuditEvent({
    actor: actorUid,
    actorRole: 'staff',
    action: 'TOKEN_RECALLED',
    entityType: 'token',
    entityId: tokenId,
    reason: 'Patient arrived and recalled to active waiting queue'
  });
}

/**
 * PRD v4 Section 9: DPDP Act 2023 Consent Management
 */
export async function saveDpdpConsent(uid, consents = {}) {
  const payload = {
    uid,
    healthDataProcessing: consents.healthDataProcessing !== false,
    liveLocationTracking: consents.liveLocationTracking !== false,
    smsWhatsAppNotifications: consents.smsWhatsAppNotifications !== false,
    consentedAt: new Date().toISOString(),
    version: 'DPDP-2023-v1'
  };
  try {
    const userRef = doc(db, 'patients', uid);
    await setDoc(userRef, { consents: payload }, { merge: true });
    localStorage.setItem(`mediq_dpdp_consent_${uid}`, JSON.stringify(payload));
  } catch (e) {
    localStorage.setItem(`mediq_dpdp_consent_${uid}`, JSON.stringify(payload));
  }
  return payload;
}

export function getDpdpConsent(uid) {
  try {
    const saved = localStorage.getItem(`mediq_dpdp_consent_${uid}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    healthDataProcessing: true,
    liveLocationTracking: true,
    smsWhatsAppNotifications: true,
    consentedAt: new Date().toISOString()
  };
}

/**
 * PRD v4 Section 6.8: Real Pharmacy Inventory & Line-Item Stock Check
 */
export const MEDICINE_INVENTORY = [
  { id: 'med-pcm-650', name: 'Paracetamol 650mg (Dolo)', genericName: 'Paracetamol 650mg', category: 'Antipyretic / Analgesic', inHouseStock: 450, janAushadhiStock: 1200, apolloStock: 600, medPlusStock: 500, priceBranded: 35, priceGeneric: 11 },
  { id: 'med-amox-500', name: 'Amoxicillin 500mg (Novamox)', genericName: 'Amoxicillin 500mg', category: 'Antibiotic', inHouseStock: 180, janAushadhiStock: 450, apolloStock: 300, medPlusStock: 250, priceBranded: 110, priceGeneric: 32 },
  { id: 'med-cet-10', name: 'Cetirizine 10mg (Cetzine)', genericName: 'Cetirizine 10mg', category: 'Antihistamine / Allergy', inHouseStock: 300, janAushadhiStock: 800, apolloStock: 400, medPlusStock: 350, priceBranded: 28, priceGeneric: 8 },
  { id: 'med-panto-40', name: 'Pantoprazole 40mg (Pan 40)', genericName: 'Pantoprazole 40mg', category: 'Antacid / PPI', inHouseStock: 220, janAushadhiStock: 650, apolloStock: 380, medPlusStock: 310, priceBranded: 95, priceGeneric: 24 },
  { id: 'med-azithro-500', name: 'Azithromycin 500mg (Azithral)', genericName: 'Azithromycin 500mg', category: 'Macrolide Antibiotic', inHouseStock: 95, janAushadhiStock: 300, apolloStock: 210, medPlusStock: 190, priceBranded: 140, priceGeneric: 45 },
  { id: 'med-cough-syp', name: 'Dextromethorphan Cough Syrup (100ml)', genericName: 'Dextromethorphan HBr', category: 'Cough Suppressant', inHouseStock: 60, janAushadhiStock: 180, apolloStock: 120, medPlusStock: 100, priceBranded: 125, priceGeneric: 38 },
  { id: 'med-metformin-500', name: 'Metformin 500mg (Glycomet)', genericName: 'Metformin 500mg', category: 'Anti-Diabetic', inHouseStock: 500, janAushadhiStock: 1500, apolloStock: 750, medPlusStock: 600, priceBranded: 42, priceGeneric: 14 },
  { id: 'med-atorva-10', name: 'Atorvastatin 10mg (Atorlip)', genericName: 'Atorvastatin 10mg', category: 'Lipid Lowering / Statin', inHouseStock: 140, janAushadhiStock: 500, apolloStock: 280, medPlusStock: 220, priceBranded: 85, priceGeneric: 22 }
];

export function checkMedicineStock(medicineName, pharmacyId = 'pharm-hospital') {
  const lower = medicineName.toLowerCase();
  const matched = MEDICINE_INVENTORY.find(m => 
    lower.includes(m.name.toLowerCase().split(' ')[0]) || 
    lower.includes(m.genericName.toLowerCase().split(' ')[0])
  );

  if (!matched) {
    return { inStock: true, stockLevel: 'Available (40+ units)', genericSubstitute: null };
  }

  let count = matched.inHouseStock;
  if (pharmacyId === 'pharm-janaushadhi') count = matched.janAushadhiStock;
  if (pharmacyId === 'pharm-apollo') count = matched.apolloStock;
  if (pharmacyId === 'pharm-medplus') count = matched.medPlusStock;

  return {
    inStock: count > 10,
    stockCount: count,
    stockLevel: count > 50 ? 'In Stock' : (count > 0 ? 'Low Stock' : 'Out of Stock'),
    genericName: matched.genericName,
    genericPrice: matched.priceGeneric,
    brandedPrice: matched.priceBranded,
    savingsPercent: Math.round(((matched.priceBranded - matched.priceGeneric) / matched.priceBranded) * 100)
  };
}

/**
 * Updates doctor's dynamic room number and consultation timings
 */
export async function updateDoctorLocation(doctorId, { roomNumber, floorWing, timingSlot }) {
  const doctorRef = doc(db, 'doctors', doctorId);
  return await updateDoc(doctorRef, {
    roomNumber: roomNumber || 'OPD Room 1',
    floorWing: floorWing || 'General OPD Wing',
    timingSlot: timingSlot || '09:00 AM - 02:00 PM',
    locationUpdatedAt: serverTimestamp()
  });
}

/**
 * Updates a token status (calling next, completing, skipping)
 */
export async function updateTokenStatus(doctorId, tokenId, status, extra = {}) {
  const tokenRef = doc(db, 'doctors', doctorId, 'tokens', tokenId);
  const payload = { status };

  if (status === 'in-progress') {
    payload.calledAt = serverTimestamp();
  } else if (status === 'completed') {
    payload.completedAt = serverTimestamp();
  }
  
  if (extra.notes) payload.notes = extra.notes;
  if (extra.customRoom) payload.customRoom = extra.customRoom;
  if (extra.prescribedMedicines) payload.prescribedMedicines = extra.prescribedMedicines;
  if (extra.pharmacyTokenCode) payload.pharmacyTokenCode = extra.pharmacyTokenCode;
  if (extra.pharmacyName) payload.pharmacyName = extra.pharmacyName;

  return await updateDoc(tokenRef, payload);
}

/**
 * Pause / Resume doctor queue
 */
export async function toggleDoctorQueuePause(doctorId, queuePaused, reason = 'Consultation break') {
  return await pauseDoctorQueue(doctorId, { paused: queuePaused, reason });
}

/**
 * Real-time listener for doctor profile & room/timings
 */
export function subscribeDoctor(doctorId, callback) {
  const docRef = doc(db, 'doctors', doctorId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  });
}

/**
 * Real-time listener for list of all doctors
 */
export function subscribeDoctorList(callback) {
  const colRef = collection(db, 'doctors');
  return onSnapshot(colRef, (snap) => {
    const doctors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(doctors);
  });
}

/**
 * Real-time listener for hospitals directory
 */
export function subscribeHospitals(callback) {
  const colRef = collection(db, 'hospitals');
  return onSnapshot(colRef, (snap) => {
    const hospitals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(hospitals);
  });
}

/**
 * Hospital Onboarding & Facility Management (SuperAdmin / Hospital Admin)
 */
export async function onboardHospital(hospitalData) {
  const hospId = hospitalData.id || `hosp-${Date.now()}`;
  const docRef = doc(db, 'hospitals', hospId);
  const payload = {
    id: hospId,
    name: hospitalData.name,
    tagline: hospitalData.tagline || 'Leading Multi-Speciality Healthcare & Research Facility',
    address: hospitalData.address || 'Sector 14, Ring Road, New Delhi',
    city: hospitalData.city || 'New Delhi',
    rating: Number(hospitalData.rating) || 4.8,
    reviewsCount: Number(hospitalData.reviewsCount) || 150,
    distance: hospitalData.distance || '1.5 km',
    specialties: Array.isArray(hospitalData.specialties) 
      ? hospitalData.specialties 
      : (typeof hospitalData.specialties === 'string' ? hospitalData.specialties.split(',').map(s => s.trim()).filter(Boolean) : ['General Medicine', 'Pediatrics']),
    avgWaitMinutes: Number(hospitalData.avgWaitMinutes) || 12,
    activeDoctorsCount: Number(hospitalData.activeDoctorsCount) || 0,
    openNow: hospitalData.openNow !== undefined ? hospitalData.openNow : true,
    timing: hospitalData.timing || '24x7 Emergency | OPD: 8:00 AM - 6:00 PM',
    features: Array.isArray(hospitalData.features)
      ? hospitalData.features
      : (typeof hospitalData.features === 'string' ? hospitalData.features.split(',').map(f => f.trim()).filter(Boolean) : ['Live Token Tracker', 'Digital Prescription', 'Express Pharmacy']),
    image: hospitalData.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    contactPhone: hospitalData.contactPhone || '011-28901234',
    commissionRate: Number(hospitalData.commissionRate) || 10,
    licenseNumber: hospitalData.licenseNumber || `NABH-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: serverTimestamp()
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Remove or Archive Hospital Facility
 */
export async function deleteHospital(hospitalId) {
  const docRef = doc(db, 'hospitals', hospitalId);
  return await deleteDoc(docRef);
}

/**
 * Add Doctor directly under a specific hospital (Admin / Facility Manager)
 */
export async function addDoctorDirectly(doctorData) {
  const doctorId = doctorData.id || `dr-${Date.now()}`;
  const docRef = doc(db, 'doctors', doctorId);
  const todayKey = getTodayDateKey();
  const payload = {
    id: doctorId,
    name: doctorData.name,
    email: doctorData.email || `${doctorId}@hospital.com`,
    phone: doctorData.phone || '9876543210',
    department: doctorData.department || 'General Medicine',
    hospitalId: doctorData.hospitalId || 'citycare-central',
    hospitalName: doctorData.hospitalName || 'CityCare Central Hospital',
    qualification: doctorData.qualification || 'MBBS, MD',
    councilRegistration: doctorData.councilRegistration || `MCI-${Math.floor(10000 + Math.random() * 90000)}`,
    experienceYears: Number(doctorData.experienceYears) || 8,
    roomNumber: doctorData.roomNumber || 'Room 101',
    floorWing: doctorData.floorWing || 'Ground Floor, OPD Wing A',
    timingSlot: doctorData.timingSlot || '09:00 AM - 01:00 PM',
    avgConsultationMinutes: Number(doctorData.avgConsultationMinutes) || 10,
    status: doctorData.status || 'approved',
    queuePaused: false,
    activeQueueDate: todayKey,
    consultationFee: Number(doctorData.consultationFee) || 500,
    bio: doctorData.bio || 'Senior medical specialist providing dedicated clinical consultations.',
    createdAt: serverTimestamp()
  };
  await setDoc(docRef, payload, { merge: true });

  // Initialize counter doc
  const counterRef = doc(db, 'doctors', doctorId, 'counters', todayKey);
  await setDoc(counterRef, { lastToken: 0, dateKey: todayKey }, { merge: true });

  return payload;
}

/**
 * Real-time listener for doctors pending KYC approval
 */
export function subscribePendingDoctors(callback) {
  const colRef = collection(db, 'doctors');
  return onSnapshot(colRef, (snap) => {
    const pendingDocs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.status === 'pending');
    callback(pendingDocs);
  });
}

/**
 * Doctor self-registration with KYC details (PRD + Custom Requirement)
 * Account starts as 'pending' until Hospital Admin approves it
 */
export async function registerDoctorWithKYC(doctorData) {
  const doctorId = doctorData.id || `dr-${Date.now()}`;
  const docRef = doc(db, 'doctors', doctorId);
  const todayKey = getTodayDateKey();

  const payload = {
    id: doctorId,
    name: doctorData.name,
    email: doctorData.email || '',
    phone: doctorData.phone || '',
    department: doctorData.department || 'General Medicine',
    hospitalId: doctorData.hospitalId || 'citycare-central',
    hospitalName: doctorData.hospitalName || 'CityCare Central Hospital',
    councilRegistration: doctorData.councilRegistration || `MCI-${Math.floor(10000 + Math.random() * 90000)}-IN`,
    qualification: doctorData.qualification || 'MBBS, MD',
    experienceYears: Number(doctorData.experienceYears) || 5,
    roomNumber: doctorData.roomNumber || 'Room 101',
    floorWing: doctorData.floorWing || 'Ground Floor, OPD Wing A',
    timingSlot: doctorData.timingSlot || '09:00 AM - 01:00 PM',
    avgConsultationMinutes: Number(doctorData.avgConsultationMinutes) || 10,
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    queuePaused: false,
    activeQueueDate: todayKey,
    kycSubmittedAt: serverTimestamp(),
    kycApprovedAt: null,
    rejectionReason: null,
    bio: doctorData.bio || 'Experienced medical practitioner specializing in patient care.',
    consultationFee: doctorData.consultationFee || 500
  };

  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Admin approves Doctor KYC registration
 * Once approved, doctor appears in patient check-in & can generate/call tokens
 */
export async function approveDoctor(doctorId) {
  const docRef = doc(db, 'doctors', doctorId);
  return await updateDoc(docRef, {
    status: 'approved',
    kycApprovedAt: serverTimestamp(),
    rejectionReason: null
  });
}

/**
 * Admin rejects Doctor KYC registration with reason
 */
export async function rejectDoctor(doctorId, reason = 'Credentials could not be verified') {
  const docRef = doc(db, 'doctors', doctorId);
  return await updateDoc(docRef, {
    status: 'rejected',
    rejectionReason: reason
  });
}

/**
 * Real-time listener for a doctor's tokens
 */
export function subscribeDoctorTokens(doctorId, callback) {
  const tokensRef = collection(db, 'doctors', doctorId, 'tokens');
  return onSnapshot(tokensRef, (snap) => {
    const tokens = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(tokens);
  });
}

/**
 * MediQ v3.0: Symptom to Specialty Intelligent Mapping
 * Enables natural language symptom search (e.g. 'rash' -> Dermatology)
 */
export const SYMPTOM_MAP = {
  "fever": "General Medicine",
  "cough": "General Medicine",
  "cold": "General Medicine",
  "viral": "General Medicine",
  "headache": "Neurology & Brain Sciences",
  "migraine": "Neurology & Brain Sciences",
  "dizziness": "Neurology & Brain Sciences",
  "seizure": "Neurology & Brain Sciences",
  "chest pain": "Cardiology & Chest Clinic",
  "palpitation": "Cardiology & Chest Clinic",
  "breathlessness": "Cardiology & Chest Clinic",
  "heart": "Cardiology & Chest Clinic",
  "hypertension": "Cardiology & Chest Clinic",
  "knee pain": "Orthopedics & Joint Care",
  "joint pain": "Orthopedics & Joint Care",
  "back pain": "Orthopedics & Joint Care",
  "fracture": "Orthopedics & Joint Care",
  "bone": "Orthopedics & Joint Care",
  "skin rash": "Dermatology & Cosmetology",
  "rash": "Dermatology & Cosmetology",
  "acne": "Dermatology & Cosmetology",
  "itching": "Dermatology & Cosmetology",
  "allergy": "Dermatology & Cosmetology",
  "child": "Pediatrics & Child Health",
  "baby": "Pediatrics & Child Health",
  "vaccination": "Pediatrics & Child Health",
  "infant": "Pediatrics & Child Health"
};

/**
 * MediQ v4.0: Slot Booking with Prepayment, Ledger Recording & Grace Tracking
 */
export async function bookDoctorSlot(doctorId, bookingData) {
  const todayKey = getTodayDateKey();
  const appointmentId = `apt-${Date.now()}`;
  const aptRef = doc(db, 'appointments', appointmentId);

  const fee = Number(bookingData.consultationFee) || 500;
  const platformCommission = Math.round(fee * 0.10); // 10% MediQ platform fee
  const hospitalPayout = fee - platformCommission;

  const payload = {
    id: appointmentId,
    doctorId,
    doctorName: bookingData.doctorName || '',
    hospitalId: bookingData.hospitalId || 'citycare-central',
    hospitalName: bookingData.hospitalName || 'CityCare Central Hospital',
    patientName: bookingData.patientName,
    phoneNumber: bookingData.phoneNumber,
    familyMemberName: bookingData.familyMemberName || null,
    familyMemberRelation: bookingData.familyMemberRelation || null,
    slotTime: bookingData.slotTime || '10:30 AM - 10:45 AM',
    date: bookingData.date || todayKey,
    consultationFee: fee,
    platformCommission: platformCommission,
    hospitalPayout: hospitalPayout,
    paymentStatus: bookingData.paymentStatus || 'prepaid',
    paymentMethod: bookingData.paymentMethod || 'UPI / Razorpay',
    bookingMode: 'slot',
    status: 'confirmed',
    lane: bookingData.lane || 'normal',
    createdAt: serverTimestamp()
  };

  await setDoc(aptRef, payload, { merge: true });

  // Record transaction into append-only transactions ledger (PRD 6.9)
  await recordTransaction({
    id: `tx-${appointmentId}`,
    type: 'slot_prepayment',
    amount: fee,
    platformCut: platformCommission,
    hospitalPayout: hospitalPayout,
    patientName: bookingData.patientName,
    doctorId,
    doctorName: bookingData.doctorName || '',
    hospitalId: bookingData.hospitalId || 'citycare-central',
    hospitalName: bookingData.hospitalName || 'CityCare Central Hospital',
    paymentMethod: bookingData.paymentMethod || 'UPI / Razorpay',
    status: 'settled',
    notes: `Prepaid slot appointment for ${bookingData.slotTime}`
  });

  // Issue entry in doctor's tokens with slot tag & priority calculation
  const tokenResult = await generateToken(doctorId, {
    patientName: bookingData.patientName,
    phoneNumber: bookingData.phoneNumber,
    familyMemberName: bookingData.familyMemberName,
    familyMemberRelation: bookingData.familyMemberRelation,
    reason: `[Slot: ${bookingData.slotTime}] ${bookingData.reason || 'Scheduled Consultation'}`,
    type: 'slot',
    lane: bookingData.lane || 'normal',
    slotTime: bookingData.slotTime,
    arrivedInGrace: true,
    addedBy: 'slot-booking'
  });

  return {
    appointmentId,
    tokenId: tokenResult.tokenId,
    tokenNumber: tokenResult.tokenNumber,
    tokenCode: tokenResult.tokenCode,
    ...payload
  };
}

/**
 * MediQ v3.0: Submit Post-Consultation Rating & Review
 */
export async function submitReview(reviewData) {
  const reviewId = `rev-${Date.now()}`;
  const reviewRef = doc(db, 'reviews', reviewId);

  const payload = {
    id: reviewId,
    hospitalId: reviewData.hospitalId || 'citycare-central',
    hospitalName: reviewData.hospitalName || 'CityCare Central Hospital',
    doctorId: reviewData.doctorId,
    doctorName: reviewData.doctorName,
    patientName: reviewData.patientName || 'Anonymous Patient',
    rating: Number(reviewData.rating) || 5,
    comment: reviewData.comment || '',
    verifiedVisit: true,
    createdAt: serverTimestamp()
  };

  await setDoc(reviewRef, payload);
  return payload;
}

/**
 * Real-time listener for marketplace reviews
 */
export function subscribeReviews(callback) {
  const colRef = collection(db, 'reviews');
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

/**
 * Real-time listener for slot bookings
 */
export function subscribeAppointments(callback) {
  const colRef = collection(db, 'appointments');
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

/**
 * Real-time listener for a specific token
 */
export function subscribeSingleToken(doctorId, tokenId, callback) {
  const tokenRef = doc(db, 'doctors', doctorId, 'tokens', tokenId);
  return onSnapshot(tokenRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  });
}

/**
 * Initial Demo Seeder with realistic hospitals, approved doctors, pending KYC doctors, and sample queue tokens
 */
export async function seedDemoData() {
  try {
    const todayKey = getTodayDateKey();

    // 1. Seed Multi-Hospital Directory (Zomato-style)
  const demoHospitals = [
    {
      id: "citycare-central",
      name: "CityCare Central Hospital",
      tagline: "Premier Multi-Speciality, Trauma & Research Centre",
      rating: 4.9,
      reviewsCount: 1420,
      distance: "1.2 km",
      address: "Sector 14, Ring Road, New Delhi",
      image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
      specialties: ["General Medicine", "Pediatrics & Child Health", "Orthopedics & Joint Care", "Cardiology & Chest Clinic"],
      avgWaitMinutes: 12,
      activeDoctorsCount: 4,
      openNow: true,
      timing: "24x7 Emergency | OPD: 8:00 AM - 6:00 PM",
      features: ["Live Token Tracker", "Digital Prescription", "Instant Room Alert", "Express Pharmacy"]
    },
    {
      id: "apollo-health",
      name: "Apollo Health City",
      tagline: "Advanced Cardiac, Neuro & Robotic Surgery Excellence",
      rating: 4.8,
      reviewsCount: 2310,
      distance: "3.5 km",
      address: "Mathura Road, Sarita Vihar, New Delhi",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
      specialties: ["Cardiology", "Neurology", "Gastroenterology", "Oncology"],
      avgWaitMinutes: 18,
      activeDoctorsCount: 6,
      openNow: true,
      timing: "OPD: 8:30 AM - 7:00 PM",
      features: ["Super-specialist OPD", "Zero-Wait VIP Queue", "NABL Accredited Lab", "Ambulance in 10m"]
    },
    {
      id: "fortis-hospital",
      name: "Fortis Super Speciality Hospital",
      tagline: "World-Class Mother & Child, Orthopedics & Pulmonology",
      rating: 4.7,
      reviewsCount: 980,
      distance: "4.8 km",
      address: "Sector B, Pocket 1, Vasant Kunj, New Delhi",
      image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80",
      specialties: ["Pediatrics", "Orthopedics", "Pulmonology", "Dermatology"],
      avgWaitMinutes: 15,
      activeDoctorsCount: 5,
      openNow: true,
      timing: "OPD: 9:00 AM - 5:30 PM",
      features: ["Live Queue Tracker", "Child Friendly Waiting Area", "In-house Diagnostics"]
    },
    {
      id: "max-super",
      name: "Max Healthcare Super Speciality",
      tagline: "Comprehensive Tertiary Care, Organ Transplant & Wellness",
      rating: 4.9,
      reviewsCount: 1850,
      distance: "2.1 km",
      address: "Press Enclave Marg, Saket, New Delhi",
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
      specialties: ["General Medicine", "Internal Medicine", "ENT", "Dermatology"],
      avgWaitMinutes: 14,
      activeDoctorsCount: 4,
      openNow: true,
      timing: "24x7 Emergency | OPD: 8:00 AM - 8:00 PM",
      features: ["FastTrack OPD", "Real-Time Room Relocation", "High Throughput Clinic"]
    }
  ];

  for (const hosp of demoHospitals) {
    const hospRef = doc(db, 'hospitals', hosp.id);
    await setDoc(hospRef, hosp, { merge: true });
  }

  // 2. Seed Approved Doctors & Pending KYC Doctors across all Partner Hospitals
  const demoDoctors = [
    // --- CITYCARE CENTRAL HOSPITAL ---
    {
      id: "dr-mehta",
      name: "Dr. Rajesh Mehta",
      email: "dr.mehta@citycare.com",
      department: "General Medicine",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      qualification: "MBBS, MD (Internal Medicine)",
      councilRegistration: "MCI-48291-DL",
      experienceYears: 14,
      roomNumber: "Room 102",
      floorWing: "Ground Floor, OPD Wing A",
      timingSlot: "09:00 AM - 01:30 PM",
      avgConsultationMinutes: 10,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 500,
      bio: "Senior Consultant Physician with 14+ years experience in managing acute infections, hypertension and lifestyle disorders."
    },
    {
      id: "dr-sharma",
      name: "Dr. Sarah Sharma",
      email: "dr.sharma@citycare.com",
      department: "Pediatrics & Child Health",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      qualification: "MBBS, DCH, DNB (Pediatrics)",
      councilRegistration: "MCI-52194-MH",
      experienceYears: 9,
      roomNumber: "Room 205",
      floorWing: "1st Floor, Maternal & Child Wing",
      timingSlot: "10:00 AM - 02:00 PM",
      avgConsultationMinutes: 12,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 600,
      bio: "Dedicated pediatrician passionate about child immunization, growth monitoring, and adolescent care."
    },
    {
      id: "dr-verma",
      name: "Dr. Vivek Verma",
      email: "dr.verma@citycare.com",
      department: "Orthopedics & Joint Care",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      qualification: "MBBS, MS (Orthopedics), Fellowship Joint Replacement",
      councilRegistration: "MCI-39871-KA",
      experienceYears: 16,
      roomNumber: "Room 304",
      floorWing: "2nd Floor, Surgical & Bone Block",
      timingSlot: "10:30 AM - 03:00 PM",
      avgConsultationMinutes: 15,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 750,
      bio: "Orthopedic surgeon specializing in sports trauma, knee replacements, and spine wellness."
    },
    {
      id: "dr-nair",
      name: "Dr. Priya Nair",
      email: "dr.nair@citycare.com",
      department: "Cardiology & Chest Clinic",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      qualification: "MBBS, MD, DM (Cardiology)",
      councilRegistration: "MCI-61029-KL",
      experienceYears: 11,
      roomNumber: "Room 401",
      floorWing: "3rd Floor, Heart Center",
      timingSlot: "09:30 AM - 01:00 PM",
      avgConsultationMinutes: 14,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 900,
      bio: "Interventional cardiologist committed to preventive cardiovascular health and echo evaluations."
    },

    // --- APOLLO HEALTH CITY ---
    {
      id: "dr-saxena-apollo",
      name: "Dr. Arjun Saxena",
      email: "dr.saxena@apollohealth.com",
      department: "Cardiology",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      qualification: "MBBS, MD, DM (Cardiology), FACC",
      councilRegistration: "MCI-88219-DL",
      experienceYears: 18,
      roomNumber: "Room C-101",
      floorWing: "Ground Floor, Apollo Heart Block",
      timingSlot: "08:30 AM - 01:30 PM",
      avgConsultationMinutes: 15,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 1200,
      bio: "Chief of Interventional Cardiology with expertise in complex coronary angioplasty and TAVR procedures."
    },
    {
      id: "dr-kapoor-apollo",
      name: "Dr. Shalini Kapoor",
      email: "dr.kapoor@apollohealth.com",
      department: "Neurology",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      qualification: "MBBS, MD, DM (Neurology)",
      councilRegistration: "MCI-71402-MH",
      experienceYears: 13,
      roomNumber: "Room N-204",
      floorWing: "2nd Floor, Neuro Tower",
      timingSlot: "10:00 AM - 03:00 PM",
      avgConsultationMinutes: 18,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 1000,
      bio: "Neurologist specializing in stroke management, epilepsy, and Parkinson's rehabilitation."
    },
    {
      id: "dr-gupta-apollo",
      name: "Dr. Rohan Gupta",
      email: "dr.gupta@apollohealth.com",
      department: "Gastroenterology",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      qualification: "MBBS, MD, DM (Gastroenterology)",
      councilRegistration: "MCI-64910-UP",
      experienceYears: 11,
      roomNumber: "Room G-305",
      floorWing: "3rd Floor, Digestive Health Center",
      timingSlot: "11:00 AM - 04:00 PM",
      avgConsultationMinutes: 12,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 850,
      bio: "Senior gastroenterologist specializing in therapeutic endoscopy and liver disease management."
    },
    {
      id: "dr-sundaram-apollo",
      name: "Dr. Meenakshi Sundaram",
      email: "dr.sundaram@apollohealth.com",
      department: "Oncology",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      qualification: "MBBS, MD, DM (Medical Oncology)",
      councilRegistration: "MCI-58319-TN",
      experienceYears: 15,
      roomNumber: "Room O-401",
      floorWing: "4th Floor, Cancer Care Pavilion",
      timingSlot: "09:00 AM - 02:00 PM",
      avgConsultationMinutes: 20,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 1500,
      bio: "Precision oncology specialist focused on targeted therapies, immunotherapy, and breast cancer."
    },

    // --- FORTIS SUPER SPECIALITY HOSPITAL ---
    {
      id: "dr-trivedi-fortis",
      name: "Dr. Alok Trivedi",
      email: "dr.trivedi@fortiscare.com",
      department: "Pediatrics",
      hospitalId: "fortis-hospital",
      hospitalName: "Fortis Super Speciality Hospital",
      qualification: "MBBS, MS, MCh (Pediatric Surgery)",
      councilRegistration: "MCI-43189-DL",
      experienceYears: 16,
      roomNumber: "Room P-102",
      floorWing: "1st Floor, Child & Mother Care Wing",
      timingSlot: "09:00 AM - 02:00 PM",
      avgConsultationMinutes: 12,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 900,
      bio: "Pediatric surgeon offering comprehensive neonatal and child trauma care."
    },
    {
      id: "dr-singhania-fortis",
      name: "Dr. Ritu Singhania",
      email: "dr.singhania@fortiscare.com",
      department: "Pulmonology",
      hospitalId: "fortis-hospital",
      hospitalName: "Fortis Super Speciality Hospital",
      qualification: "MBBS, MD (Pulmonary Medicine), FCCP",
      councilRegistration: "MCI-59124-WB",
      experienceYears: 12,
      roomNumber: "Room R-203",
      floorWing: "2nd Floor, Chest & Allergy Center",
      timingSlot: "10:00 AM - 03:00 PM",
      avgConsultationMinutes: 14,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 800,
      bio: "Pulmonologist with expertise in asthma, sleep apnea, and post-viral respiratory health."
    },
    {
      id: "dr-joshi-fortis",
      name: "Dr. Devendra Joshi",
      email: "dr.joshi@fortiscare.com",
      department: "Orthopedics",
      hospitalId: "fortis-hospital",
      hospitalName: "Fortis Super Speciality Hospital",
      qualification: "MBBS, MS (Orthopedics), Fellowship Joint Replacement",
      councilRegistration: "MCI-31298-GJ",
      experienceYears: 20,
      roomNumber: "Room S-301",
      floorWing: "3rd Floor, Bone & Joint Institute",
      timingSlot: "10:30 AM - 04:00 PM",
      avgConsultationMinutes: 15,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 1100,
      bio: "Renowned joint replacement and robotic knee reconstruction surgeon."
    },
    {
      id: "dr-sen-fortis",
      name: "Dr. Kritika Sen",
      email: "dr.sen@fortiscare.com",
      department: "Dermatology",
      hospitalId: "fortis-hospital",
      hospitalName: "Fortis Super Speciality Hospital",
      qualification: "MBBS, MD (DVL - Dermatology)",
      councilRegistration: "MCI-76501-KA",
      experienceYears: 8,
      roomNumber: "Room D-105",
      floorWing: "1st Floor, Derma & Aesthetic Clinic",
      timingSlot: "11:00 AM - 05:00 PM",
      avgConsultationMinutes: 10,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 700,
      bio: "Consultant dermatologist specializing in chronic eczema, vitiligo, and clinical aesthetics."
    },

    // --- MAX HEALTHCARE SUPER SPECIALITY ---
    {
      id: "dr-goel-max",
      name: "Dr. Sanjay Goel",
      email: "dr.goel@maxhealthcare.com",
      department: "General Medicine",
      hospitalId: "max-super",
      hospitalName: "Max Healthcare Super Speciality",
      qualification: "MBBS, MD (Internal Medicine), PGD Diabetology",
      councilRegistration: "MCI-62901-DL",
      experienceYears: 17,
      roomNumber: "Room M-101",
      floorWing: "Ground Floor, Primary Care OPD",
      timingSlot: "08:00 AM - 01:00 PM",
      avgConsultationMinutes: 10,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 650,
      bio: "Diabetologist and internist managing complex chronic lifestyle conditions and geriatric health."
    },
    {
      id: "dr-agrawal-max",
      name: "Dr. Preeti Agrawal",
      email: "dr.agrawal@maxhealthcare.com",
      department: "ENT",
      hospitalId: "max-super",
      hospitalName: "Max Healthcare Super Speciality",
      qualification: "MBBS, MS (ENT, Head & Neck)",
      councilRegistration: "MCI-55418-UP",
      experienceYears: 11,
      roomNumber: "Room E-202",
      floorWing: "2nd Floor, ENT & Hearing Clinic",
      timingSlot: "09:30 AM - 02:30 PM",
      avgConsultationMinutes: 12,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 750,
      bio: "ENT surgeon specializing in endoscopic sinus surgery, vertigo, and microsurgery of the ear."
    },
    {
      id: "dr-batra-max",
      name: "Dr. Tarun Batra",
      email: "dr.batra@maxhealthcare.com",
      department: "Internal Medicine",
      hospitalId: "max-super",
      hospitalName: "Max Healthcare Super Speciality",
      qualification: "MBBS, MD (Internal Medicine), DM (Nephrology)",
      councilRegistration: "MCI-48209-HR",
      experienceYears: 14,
      roomNumber: "Room K-303",
      floorWing: "3rd Floor, Renal & Dialysis Block",
      timingSlot: "10:00 AM - 03:00 PM",
      avgConsultationMinutes: 15,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 950,
      bio: "Nephrologist providing critical renal care, dialysis management, and transplant follow-up."
    },
    {
      id: "dr-deshmukh-max",
      name: "Dr. Ananya Deshmukh",
      email: "dr.deshmukh@maxhealthcare.com",
      department: "Dermatology",
      hospitalId: "max-super",
      hospitalName: "Max Healthcare Super Speciality",
      qualification: "MBBS, MD (Dermatology)",
      councilRegistration: "MCI-91820-DL",
      experienceYears: 9,
      roomNumber: "Room B-402",
      floorWing: "4th Floor, Dermatology Suite",
      timingSlot: "11:00 AM - 04:00 PM",
      avgConsultationMinutes: 12,
      status: "approved",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 800,
      bio: "Senior consultant focused on pediatric dermatology, trichology, and autoimmune skin disorders."
    },

    // --- PENDING KYC DOCTORS (FOR ADMIN REVIEW) ---
    {
      id: "dr-karan-pending",
      name: "Dr. Karan Malhotra",
      email: "dr.karan@apollo.com",
      department: "Dermatology & Cosmetology",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      qualification: "MBBS, MD (Dermatology, Venereology & Leprosy)",
      councilRegistration: "MCI-77341-UP-KYC-PENDING",
      experienceYears: 6,
      roomNumber: "Room 108",
      floorWing: "Ground Floor, Skin Clinic",
      timingSlot: "02:00 PM - 07:00 PM",
      avgConsultationMinutes: 10,
      status: "pending",
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 700,
      bio: "Dermatologist with special training in laser therapies and chronic psoriasis management.",
      kycSubmittedAt: new Date(Date.now() - 60 * 60000)
    }
  ];

  for (const docData of demoDoctors) {
    const docRef = doc(db, 'doctors', docData.id);
    await setDoc(docRef, docData, { merge: true });

    // Seed counters only for approved doctors
    if (docData.status === 'approved') {
      const counterRef = doc(db, 'doctors', docData.id, 'counters', todayKey);
      await setDoc(counterRef, { lastToken: 4, dateKey: todayKey }, { merge: true });

      // Seed sample tokens (1 in-progress, 2 waiting, 1 completed)
      const tokens = [
        {
          tokenNumber: 1,
          patientName: "Aarav Patel",
          phoneNumber: "9876543210",
          reason: "Follow-up checkup & report review",
          status: "completed",
          date: todayKey,
          createdAt: new Date(Date.now() - 40 * 60000),
          calledAt: new Date(Date.now() - 35 * 60000),
          completedAt: new Date(Date.now() - 20 * 60000),
          addedBy: "self"
        },
        {
          tokenNumber: 2,
          patientName: "Sunita Roy",
          phoneNumber: "9812345678",
          reason: "Mild fever & headache for 2 days",
          status: "in-progress",
          date: todayKey,
          createdAt: new Date(Date.now() - 25 * 60000),
          calledAt: new Date(Date.now() - 5 * 60000),
          completedAt: null,
          addedBy: "self"
        },
        {
          tokenNumber: 3,
          patientName: "Rohan Verma",
          phoneNumber: "9823456789",
          reason: "Routine prescription renewal",
          status: "waiting",
          date: todayKey,
          createdAt: new Date(Date.now() - 15 * 60000),
          calledAt: null,
          completedAt: null,
          addedBy: "reception"
        },
        {
          tokenNumber: 4,
          patientName: "Meera Iyer",
          phoneNumber: "9834567890",
          reason: "Joint pain & stiffness",
          status: "waiting",
          date: todayKey,
          createdAt: new Date(Date.now() - 5 * 60000),
          calledAt: null,
          completedAt: null,
          addedBy: "self"
        }
      ];

      for (const t of tokens) {
        const tokenDocRef = doc(db, 'doctors', docData.id, 'tokens', `token-${t.tokenNumber}`);
        await setDoc(tokenDocRef, t, { merge: true });
      }
    }
  }

  // 3. Seed Verified Post-Consultation Reviews (MediQ PRD Section 9.10)
  const demoReviews = [
    {
      id: "rev-1",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      doctorId: "dr-mehta",
      doctorName: "Dr. Rajesh Mehta",
      patientName: "Siddharth Malhotra",
      rating: 5,
      comment: "Remarkable experience! Live queue tracker showed 3 patients ahead so I arrived just in time. Dr. Mehta was thorough and attentive.",
      verifiedVisit: true,
      createdAt: new Date(Date.now() - 120 * 60000)
    },
    {
      id: "rev-2",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      doctorId: "dr-sharma",
      doctorName: "Dr. Sarah Sharma",
      patientName: "Neha Sen",
      rating: 5,
      comment: "Best pediatrician OPD in the area. No standing in long lines with an irritable toddler. The dynamic room alert notified us right away!",
      verifiedVisit: true,
      createdAt: new Date(Date.now() - 240 * 60000)
    },
    {
      id: "rev-3",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      doctorId: "dr-nair",
      doctorName: "Dr. Priya Nair",
      patientName: "Vikram Batra",
      rating: 4,
      comment: "Smooth OPD check-in. Pre-paid slot booking saved 25 minutes of counter billing time.",
      verifiedVisit: true,
      createdAt: new Date(Date.now() - 360 * 60000)
    }
  ];

  for (const rev of demoReviews) {
    const revRef = doc(db, 'reviews', rev.id);
    await setDoc(revRef, rev, { merge: true });
  }

  // 4. Seed Confirmed Slot Bookings (MediQ PRD Section 9.3)
  const demoAppointments = [
    {
      id: "apt-1",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      doctorId: "dr-mehta",
      doctorName: "Dr. Rajesh Mehta",
      patientName: "Pooja Hegde",
      phoneNumber: "9876500112",
      slotTime: "11:30 AM - 11:45 AM",
      date: todayKey,
      consultationFee: 500,
      platformCommission: 50,
      hospitalPayout: 450,
      paymentStatus: "prepaid",
      bookingMode: "slot",
      status: "confirmed",
      createdAt: new Date(Date.now() - 90 * 60000)
    },
    {
      id: "apt-2",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      doctorId: "dr-verma",
      doctorName: "Dr. Vivek Verma",
      patientName: "Deepak Chahar",
      phoneNumber: "9811122334",
      slotTime: "12:00 PM - 12:15 PM",
      date: todayKey,
      consultationFee: 750,
      platformCommission: 75,
      hospitalPayout: 675,
      paymentStatus: "prepaid",
      bookingMode: "slot",
      status: "confirmed",
      createdAt: new Date(Date.now() - 50 * 60000)
    }
  ];

  for (const apt of demoAppointments) {
    const aptRef = doc(db, 'appointments', apt.id);
    await setDoc(aptRef, apt, { merge: true });
  }

  // 5. Seed OPD Visit History (MediQ PRD Section 7 & User History requirement)
  const demoHistory = [
    {
      id: "hist-101",
      tokenNumber: 1,
      bookingMode: "instant",
      patientName: "Riya Sharma",
      phoneNumber: "9876543210",
      doctorId: "dr-mehta",
      doctorName: "Dr. Rajesh Mehta",
      department: "General Medicine",
      qualification: "MBBS, MD (Internal Medicine)",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      roomNumber: "Room 102",
      floorWing: "Ground Floor, OPD Wing A",
      reason: "Mild fever & headache for 2 days",
      status: "completed",
      consultationFee: 500,
      paymentStatus: "paid",
      rating: 5,
      reviewText: "Dr. Mehta diagnosed the viral fever accurately and explained the medication clearly. Very little wait time with the live tracker!",
      date: todayKey,
      timestamp: new Date(Date.now() - 120 * 60000).toISOString()
    },
    {
      id: "hist-102",
      tokenNumber: 2,
      bookingMode: "instant",
      patientName: "Aarav Patel",
      phoneNumber: "9876543210",
      doctorId: "dr-sharma",
      doctorName: "Dr. Sarah Sharma",
      department: "Pediatrics & Child Health",
      qualification: "MBBS, DCH, DNB (Pediatrics)",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      roomNumber: "Room 205",
      floorWing: "1st Floor, Maternal & Child Wing",
      reason: "Routine MMR vaccination & growth check",
      status: "completed",
      consultationFee: 600,
      paymentStatus: "paid",
      rating: 5,
      reviewText: "Gentle with children and very patient. Great experience with digital queue!",
      date: todayKey,
      timestamp: new Date(Date.now() - 360 * 60000).toISOString()
    },
    {
      id: "hist-103",
      tokenNumber: 7,
      bookingMode: "slot",
      slotTime: "11:30 AM - 11:45 AM",
      patientName: "Riya Sharma",
      phoneNumber: "9876543210",
      doctorId: "dr-nair",
      doctorName: "Dr. Priya Nair",
      department: "Cardiology & Chest Clinic",
      qualification: "MBBS, MD, DM (Cardiology)",
      hospitalId: "apollo-health",
      hospitalName: "Apollo Health City",
      roomNumber: "Room 401",
      floorWing: "3rd Floor, Heart Center",
      reason: "Preventive cardiac assessment & BP screening",
      status: "completed",
      consultationFee: 900,
      paymentStatus: "paid",
      rating: 4,
      reviewText: "Prompt consultation and clear guidance on preventive diet and exercise.",
      date: todayKey,
      timestamp: new Date(Date.now() - 800 * 60000).toISOString()
    },
    {
      id: "hist-104",
      tokenNumber: 4,
      bookingMode: "instant",
      patientName: "Riya Sharma",
      phoneNumber: "9876543210",
      doctorId: "dr-verma",
      doctorName: "Dr. Vivek Verma",
      department: "Orthopedics & Joint Care",
      qualification: "MBBS, MS (Orthopedics)",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      roomNumber: "Room 304",
      floorWing: "2nd Floor, Surgical Block",
      reason: "Knee joint pain during stairs",
      status: "waiting",
      consultationFee: 750,
      paymentStatus: "paid",
      date: todayKey,
      timestamp: new Date(Date.now() - 25 * 60000).toISOString()
    }
  ];

  for (const h of demoHistory) {
    const hRef = doc(db, 'history', h.id);
    await setDoc(hRef, h, { merge: true });
  }

  // 6. Seed PRD v4 Transactions Ledger (Append-Only)
  const demoTransactions = [
    {
      id: "tx-demo-01",
      type: "slot_prepayment",
      amount: 500,
      platformCut: 50,
      hospitalPayout: 450,
      patientName: "Riya Sharma",
      doctorName: "Dr. Rajesh Mehta",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      paymentMethod: "UPI / Google Pay",
      status: "settled",
      notes: "Slot #04 prepayment (10:30 AM - 10:45 AM)",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString()
    },
    {
      id: "tx-demo-02",
      type: "slot_prepayment",
      amount: 750,
      platformCut: 75,
      hospitalPayout: 675,
      patientName: "Deepak Chahar",
      doctorName: "Dr. Vivek Verma",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      paymentMethod: "Razorpay / Credit Card",
      status: "settled",
      notes: "Slot #02 prepayment (12:00 PM - 12:15 PM)",
      timestamp: new Date(Date.now() - 95 * 60000).toISOString()
    },
    {
      id: "tx-demo-03",
      type: "refund",
      amount: -500,
      platformCut: 0,
      hospitalPayout: -500,
      patientName: "Sunil Joshi",
      doctorName: "Dr. Rajesh Mehta",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      paymentMethod: "UPI Refund",
      status: "refunded",
      notes: "Cancelled >2h before appointment (100% full refund rule applied)",
      timestamp: new Date(Date.now() - 140 * 60000).toISOString()
    }
  ];

  for (const tx of demoTransactions) {
    const txRef = doc(db, 'transactions', tx.id);
    await setDoc(txRef, tx, { merge: true });
  }

  // 7. Seed PRD v4 Audit Logs
  const demoAuditLogs = [
    {
      id: "audit-demo-01",
      actor: "kavita.reception",
      actorRole: "reception",
      action: "QUEUE_OVERRIDE",
      entityType: "token",
      entityId: "DMEH-03",
      reason: "Acute severe chest pain - triaged to Emergency Lane",
      hospitalId: "citycare-central",
      timestamp: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: "audit-demo-02",
      actor: "dr-mehta",
      actorRole: "doctor",
      action: "TOKEN_SKIPPED",
      entityType: "token",
      entityId: "DMEH-01",
      reason: "Patient not present after 3-minute alert countdown; moved 3 positions back",
      hospitalId: "citycare-central",
      timestamp: new Date(Date.now() - 60 * 60000).toISOString()
    },
    {
      id: "audit-demo-03",
      actor: "admin.anil",
      actorRole: "hospital_admin",
      action: "KYC_APPROVED",
      entityType: "doctor",
      entityId: "dr-mehta",
      reason: "MCI license verified against NMC portal",
      hospitalId: "citycare-central",
      timestamp: new Date(Date.now() - 240 * 60000).toISOString()
    }
  ];

  for (const log of demoAuditLogs) {
    const logRef = doc(db, 'audit_logs', log.id);
    await setDoc(logRef, log, { merge: true });
  }

  try {
    localStorage.setItem('mediq_user_history', JSON.stringify(demoHistory));
  } catch (e) {}

  return true;
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

/**
 * Saves a visit/token/appointment record to user history (both Firestore & localStorage)
 */
export async function saveToUserHistory(historyItem) {
  try {
    const id = historyItem.id || `hist-${Date.now()}`;
    const payload = {
      id,
      timestamp: new Date().toISOString(),
      ...historyItem
    };

    // 1. Save to localStorage cache for instant fast loading
    try {
      const stored = JSON.parse(localStorage.getItem('mediq_user_history') || '[]');
      const filtered = stored.filter(x => x.id !== id && (x.tokenNumber && historyItem.tokenNumber ? x.tokenNumber !== historyItem.tokenNumber : true));
      filtered.unshift(payload);
      localStorage.setItem('mediq_user_history', JSON.stringify(filtered.slice(0, 30)));
    } catch (e) {
      console.warn('localStorage history save error', e);
    }

    // 2. Persist to Firestore collection `history`
    const histRef = doc(db, 'history', id);
    await setDoc(histRef, {
      ...payload,
      createdAt: serverTimestamp()
    }, { merge: true });

    return payload;
  } catch (err) {
    console.error('saveToUserHistory error:', err);
    return historyItem;
  }
}

/**
 * Subscribes to history items from Firestore & merges with localStorage
 */
export function subscribeUserHistory(callback) {
  const colRef = collection(db, 'history');
  return onSnapshot(colRef, (snap) => {
    const remoteItems = [];
    snap.forEach(docSnap => {
      remoteItems.push({ id: docSnap.id, ...docSnap.data() });
    });

    let localItems = [];
    try {
      localItems = JSON.parse(localStorage.getItem('mediq_user_history') || '[]');
    } catch (e) {}

    const map = new Map();
    remoteItems.forEach(item => map.set(item.id, item));
    localItems.forEach(item => {
      if (!map.has(item.id)) map.set(item.id, item);
    });

    const merged = Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.timestamp || 0);
      const dateB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.timestamp || 0);
      return dateB - dateA;
    });

    callback(merged);
  }, (err) => {
    console.warn('Firestore history subscription error, fallback to local:', err);
    try {
      const local = JSON.parse(localStorage.getItem('mediq_user_history') || '[]');
      callback(local);
    } catch (e) {
      callback([]);
    }
  });
}

/**
 * SECTION 7.10: Auto Pharmacy Token Handoff
 * Issues a dedicated pharmacy counter token for the chosen pharmacy
 * If zero waiting in queue, automatically marks as 'ready' (packed & ready for pickup)
 */
export async function createPharmacyToken(data) {
  const pharmacyId = data.pharmacyId || 'pharm-hospital';
  const prefixMap = {
    'pharm-hospital': 'PH',
    'pharm-janaushadhi': 'JA',
    'pharm-apollo': 'AP',
    'pharm-medplus': 'MP'
  };
  const prefix = prefixMap[pharmacyId] || 'PH';

  try {
    const todayKey = getTodayDateKey();
    const counterRef = doc(db, 'pharmacyCounters', `${pharmacyId}_${todayKey}`);
    const colRef = collection(db, 'pharmacy_tokens');
    const newDocRef = doc(colRef);

    let nextToken = 1;
    let initialStatus = 'ready'; // Default if no queue ahead

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? (snap.data().lastToken || 0) : 0;
      const activePending = snap.exists() ? (snap.data().activePending || 0) : 0;
      nextToken = current + 1;

      // If active pending > 0, mark as preparing; if 0, auto-pack immediately as ready!
      initialStatus = activePending > 0 ? 'preparing' : 'ready';

      tx.set(counterRef, { 
        lastToken: nextToken, 
        activePending: activePending + 1, 
        dateKey: todayKey,
        pharmacyId 
      }, { merge: true });

      const tokenCode = `${prefix}-${String(nextToken).padStart(2, '0')}`;

      tx.set(newDocRef, {
        id: newDocRef.id,
        tokenNumber: nextToken,
        tokenCode,
        prefix,
        patientName: data.patientName || 'Patient',
        phoneNumber: data.phoneNumber || '',
        doctorId: data.doctorId || '',
        doctorName: data.doctorName || 'Doctor',
        linkedDoctorTokenId: data.linkedDoctorTokenId || '',
        medicines: data.medicines || ['Paracetamol 500mg', 'Cetirizine 10mg'],
        hospitalId: data.hospitalId || 'citycare-central',
        hospitalName: data.hospitalName || 'CityCare Central Hospital',
        pharmacyId,
        pharmacyName: data.pharmacyName || 'CityCare In-House Pharmacy',
        pharmacyType: data.pharmacyType || 'On-Site Hospital Counter',
        pharmacyAddress: data.pharmacyAddress || 'Ground Floor, Hospital Main Atrium',
        pharmacyDistance: data.pharmacyDistance || '0.0 km',
        status: initialStatus, // 'ready' (auto-packed) or 'preparing'
        counterNumber: initialStatus === 'ready' ? 'Counter 1 (Pickup Ready)' : 'Counter 1',
        isAutoPacked: initialStatus === 'ready',
        date: todayKey,
        createdAt: serverTimestamp(),
        totalEstimatedPrice: data.totalEstimatedPrice || 180
      });
    });

    return {
      id: newDocRef.id,
      tokenNumber: nextToken,
      tokenCode: `${prefix}-${String(nextToken).padStart(2, '0')}`,
      status: initialStatus,
      isAutoPacked: initialStatus === 'ready',
      pharmacyId,
      pharmacyName: data.pharmacyName || 'CityCare In-House Pharmacy'
    };
  } catch (err) {
    console.error('createPharmacyToken error:', err);
    // Fallback offline / direct write
    const fallbackId = `ph-${Date.now()}`;
    const tokenCode = `${prefix}-0${(Date.now() % 9) + 1}`;
    const fallbackData = {
      id: fallbackId,
      tokenNumber: (Date.now() % 9) + 1,
      tokenCode,
      prefix,
      patientName: data.patientName || 'Patient',
      phoneNumber: data.phoneNumber || '',
      doctorId: data.doctorId || '',
      doctorName: data.doctorName || 'Doctor',
      linkedDoctorTokenId: data.linkedDoctorTokenId || '',
      medicines: data.medicines || ['Paracetamol 500mg', 'Cetirizine 10mg'],
      hospitalId: data.hospitalId || 'citycare-central',
      hospitalName: data.hospitalName || 'CityCare Central Hospital',
      pharmacyId,
      pharmacyName: data.pharmacyName || 'CityCare In-House Pharmacy',
      pharmacyType: data.pharmacyType || 'On-Site Hospital Counter',
      pharmacyAddress: data.pharmacyAddress || 'Ground Floor, Hospital Main Atrium',
      pharmacyDistance: data.pharmacyDistance || '0.0 km',
      status: 'ready',
      counterNumber: 'Counter 1 (Pickup Ready)',
      isAutoPacked: true,
      date: getTodayDateKey(),
      createdAt: new Date(),
      totalEstimatedPrice: data.totalEstimatedPrice || 180
    };
    try {
      await setDoc(doc(db, 'pharmacy_tokens', fallbackId), fallbackData, { merge: true });
    } catch(e) {}
    return fallbackData;
  }
}

/**
 * Subscribes to real-time pharmacy tokens
 */
export function subscribePharmacyTokens(callback) {
  const colRef = collection(db, 'pharmacy_tokens');
  return onSnapshot(colRef, async (snap) => {
    if (snap.empty) {
      // Auto-seed initial interactive tokens so buttons work immediately
      const initialTokens = [
        {
          id: 'ph-demo-1',
          tokenNumber: 1,
          tokenCode: 'PH-01',
          prefix: 'PH',
          patientName: 'Riya Sharma',
          phoneNumber: '9876543210',
          doctorId: 'dr-mehta',
          doctorName: 'Dr. Rajesh Mehta',
          medicines: ['Paracetamol 650mg', 'Azithromycin 500mg'],
          hospitalId: 'citycare-central',
          hospitalName: 'CityCare Central Hospital',
          pharmacyId: 'pharm-hospital',
          pharmacyName: 'CityCare In-House Pharmacy',
          status: 'preparing',
          counterNumber: 'Counter 1',
          isAutoPacked: false,
          totalEstimatedPrice: 120,
          date: getTodayDateKey(),
          createdAt: new Date()
        },
        {
          id: 'ph-demo-2',
          tokenNumber: 2,
          tokenCode: 'JA-01',
          prefix: 'JA',
          patientName: 'Amit Verma',
          phoneNumber: '9812345678',
          doctorId: 'dr-verma',
          doctorName: 'Dr. Vivek Verma',
          medicines: ['Pantoprazole 40mg', 'Domperidone'],
          hospitalId: 'citycare-central',
          hospitalName: 'CityCare Central Hospital',
          pharmacyId: 'pharm-janaushadhi',
          pharmacyName: 'Pradhan Mantri Jan Aushadhi Kendra',
          status: 'ready',
          counterNumber: 'Counter 1 (Pickup Ready)',
          isAutoPacked: true,
          totalEstimatedPrice: 36,
          date: getTodayDateKey(),
          createdAt: new Date()
        }
      ];

      for (const t of initialTokens) {
        try {
          await setDoc(doc(db, 'pharmacy_tokens', t.id), t, { merge: true });
        } catch (e) {}
      }
      callback(initialTokens);
      return;
    }

    const list = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    list.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    callback(list);
  }, (err) => {
    console.warn('subscribePharmacyTokens fallback:', err);
    callback([
      { id: 'ph-demo-1', tokenCode: 'PH-01', patientName: 'Riya Sharma', pharmacyName: 'CityCare In-House Pharmacy', medicines: ['Paracetamol 650mg', 'Azithromycin 500mg'], status: 'preparing', counterNumber: 'Counter 1', totalEstimatedPrice: 120 },
      { id: 'ph-demo-2', tokenCode: 'JA-01', patientName: 'Amit Verma', pharmacyName: 'Pradhan Mantri Jan Aushadhi Kendra', medicines: ['Pantoprazole 40mg', 'Domperidone'], status: 'ready', counterNumber: 'Counter 1', isAutoPacked: true, totalEstimatedPrice: 36 }
    ]);
  });
}

/**
 * Updates Pharmacy Token Status ('preparing' | 'ready' | 'dispensed')
 * When status is 'dispensed', syncs with linked doctor token so patient app/web queue screen immediately clears!
 */
export async function updatePharmacyTokenStatus(tokenId, status, counterNumber = 'Counter 1') {
  try {
    const docRef = doc(db, 'pharmacy_tokens', tokenId);
    let linkedData = null;
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        linkedData = snap.data();
      }
    } catch (e) {}

    await setDoc(docRef, {
      status,
      counterNumber,
      dispensedAt: status === 'dispensed' ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Sync to linked doctor token if present
    if (linkedData && linkedData.doctorId && linkedData.linkedDoctorTokenId) {
      try {
        const docTokenRef = doc(db, 'doctors', linkedData.doctorId, 'tokens', linkedData.linkedDoctorTokenId);
        await setDoc(docTokenRef, {
          pharmacyStatus: status,
          status: status === 'dispensed' ? 'dispensed' : 'completed',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Syncing to doctor token warning:', err);
      }
    }

    return { success: true, tokenId, status };
  } catch (err) {
    console.warn('updatePharmacyTokenStatus firestore error, falling back locally:', err);
    return { success: true, tokenId, status, isLocal: true };
  }
}

/**
 * SECTION 7.11: Dynamic Pharmacy Price & Distance Comparison Engine
 * Computes live pricing based on medicine count and generic vs branded options
 */
export function getPharmacyPriceComparison(medicines = ['Paracetamol 500mg', 'Amoxicillin 250mg']) {
  const medCount = Math.max(1, medicines.length);

  return [
    {
      id: 'pharm-hospital',
      name: 'CityCare In-House Pharmacy',
      type: 'On-Site Hospital Counter',
      distanceKm: 0.0,
      distanceText: '0.0 km (Inside Hospital)',
      travelTimeMinutes: 0,
      address: 'Ground Floor, Main Hospital Atrium (Counter 1 & 2)',
      isHospitalPharmacy: true,
      inStock: true,
      totalPrice: medCount * 60,
      tokenPrefix: 'PH',
      badge: '⚡ FASTEST (ON-SITE DISPENSE)',
      badgeColor: '#0284c7',
      savings: null
    },
    {
      id: 'pharm-janaushadhi',
      name: 'Pradhan Mantri Jan Aushadhi Kendra',
      type: 'Government Generic Medicine Center',
      distanceKm: 0.8,
      distanceText: '0.8 km (4 min away)',
      travelTimeMinutes: 4,
      address: 'Shop 12, Jan Kalyan Complex, Ring Road',
      isHospitalPharmacy: false,
      inStock: true,
      totalPrice: Math.round(medCount * 18),
      tokenPrefix: 'JA',
      badge: '⭐ BEST VALUE GENERIC (70% OFF)',
      badgeColor: '#7c3aed',
      savings: `Save ₹${(medCount * 60) - Math.round(medCount * 18)} (70% Off)`
    },
    {
      id: 'pharm-apollo',
      name: 'Apollo Pharmacy — 24/7',
      type: 'Retail Chain Pharmacy',
      distanceKm: 0.4,
      distanceText: '0.4 km (2 min away)',
      travelTimeMinutes: 2,
      address: 'Opposite Metro Pillar 142, Ring Road',
      isHospitalPharmacy: false,
      inStock: true,
      totalPrice: medCount * 65,
      tokenPrefix: 'AP',
      badge: '🏪 24/7 OPEN (DOORSTEP PICKUP)',
      badgeColor: '#0369a1',
      savings: null
    },
    {
      id: 'pharm-medplus',
      name: 'MedPlus Pharmacy & Wellness',
      type: 'Discount Pharmacy Network',
      distanceKm: 1.1,
      distanceText: '1.1 km (6 min away)',
      travelTimeMinutes: 6,
      address: 'Shop 4, Sunrise Commercial Complex',
      isHospitalPharmacy: false,
      inStock: true,
      totalPrice: Math.round(medCount * 52),
      tokenPrefix: 'MP',
      badge: '🟢 BRANDED DISCOUNT (15% OFF)',
      badgeColor: '#059669',
      savings: `Save ₹${(medCount * 60) - Math.round(medCount * 52)} (15% Off)`
    }
  ];
}

export default app;
