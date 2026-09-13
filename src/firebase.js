import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function getTodayDateKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Atomic token generation transaction (Section 7.1 of PRD)
 */
export async function generateToken(doctorId, patientData) {
  const todayKey = getTodayDateKey();
  const counterRef = doc(db, 'doctors', doctorId, 'counters', todayKey);
  const tokenColRef = collection(db, 'doctors', doctorId, 'tokens');
  const newTokenDocRef = doc(tokenColRef);

  return await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists() ? (counterSnap.data().lastToken || 0) : 0;
    const nextToken = current + 1;

    tx.set(counterRef, { lastToken: nextToken, dateKey: todayKey }, { merge: true });

    tx.set(newTokenDocRef, {
      tokenNumber: nextToken,
      patientName: patientData.patientName,
      phoneNumber: patientData.phoneNumber,
      reason: patientData.reason || '',
      doctorId: doctorId,
      status: 'waiting',
      date: todayKey,
      createdAt: serverTimestamp(),
      calledAt: null,
      completedAt: null,
      addedBy: patientData.addedBy || 'self'
    });

    return {
      tokenId: newTokenDocRef.id,
      tokenNumber: nextToken,
      doctorId
    };
  });
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

  return await updateDoc(tokenRef, payload);
}

/**
 * Pause / Resume doctor queue
 */
export async function toggleDoctorQueuePause(doctorId, queuePaused) {
  const docRef = doc(db, 'doctors', doctorId);
  return await updateDoc(docRef, { queuePaused });
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
 * MediQ v3.0: Slot Booking (Scheduled OPD Appointment) with Fee Prepayment
 */
export async function bookDoctorSlot(doctorId, bookingData) {
  const todayKey = getTodayDateKey();
  const appointmentId = `apt-${Date.now()}`;
  const aptRef = doc(db, 'appointments', appointmentId);

  const fee = Number(bookingData.consultationFee) || 500;
  const platformCommission = Math.round(fee * 0.10); // 10% MediQ platform fee

  const payload = {
    id: appointmentId,
    doctorId,
    doctorName: bookingData.doctorName || '',
    hospitalId: bookingData.hospitalId || 'citycare-central',
    hospitalName: bookingData.hospitalName || 'CityCare Central Hospital',
    patientName: bookingData.patientName,
    phoneNumber: bookingData.phoneNumber,
    slotTime: bookingData.slotTime || '10:30 AM - 10:45 AM',
    date: bookingData.date || todayKey,
    consultationFee: fee,
    platformCommission: platformCommission,
    hospitalPayout: fee - platformCommission,
    paymentStatus: bookingData.paymentStatus || 'prepaid', // 'prepaid' | 'pay-at-hospital'
    bookingMode: 'slot',
    status: 'confirmed',
    createdAt: serverTimestamp()
  };

  await setDoc(aptRef, payload, { merge: true });

  // Also issue an entry in doctor's tokens with slot tag so the doctor queue reflects it
  const tokenResult = await generateToken(doctorId, {
    patientName: bookingData.patientName,
    phoneNumber: bookingData.phoneNumber,
    reason: `[Slot: ${bookingData.slotTime}] ${bookingData.reason || 'Scheduled Consultation'}`,
    addedBy: 'slot-booking'
  });

  return {
    appointmentId,
    tokenId: tokenResult.tokenId,
    tokenNumber: tokenResult.tokenNumber,
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

  // 2. Seed Approved Doctors & Pending KYC Doctors
  const demoDoctors = [
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
    // Doctor with PENDING KYC Approval (for Admin Review Demo)
    {
      id: "dr-ananya-pending",
      name: "Dr. Ananya Deshmukh",
      email: "dr.ananya@fortis.com",
      department: "Neurology & Brain Sciences",
      hospitalId: "citycare-central",
      hospitalName: "CityCare Central Hospital",
      qualification: "MBBS, MD, DM (Neurology) - AIIMS New Delhi",
      councilRegistration: "MCI-91820-DL-KYC-VERIFY",
      experienceYears: 7,
      roomNumber: "Room 502",
      floorWing: "5th Floor, Neuro Tower",
      timingSlot: "11:00 AM - 04:00 PM",
      avgConsultationMinutes: 20,
      status: "pending", // Waiting for Admin approval!
      queuePaused: false,
      activeQueueDate: todayKey,
      consultationFee: 1000,
      bio: "Newly registered neurologist awaiting hospital administration verification of Medical Council of India license.",
      kycSubmittedAt: new Date(Date.now() - 30 * 60000)
    },
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
      status: "pending", // Waiting for Admin approval!
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
 */
export async function updatePharmacyTokenStatus(tokenId, status, counterNumber = 'Counter 1') {
  const docRef = doc(db, 'pharmacy_tokens', tokenId);
  return await setDoc(docRef, {
    status,
    counterNumber,
    updatedAt: serverTimestamp()
  }, { merge: true });
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
