/**
 * MediQ v5 — Drug Master & Sample Pharmacy Seed Script
 * 
 * Run this once to populate:
 * 1. Drug Master database (50 common Indian medicines with salt mapping)
 * 2. Sample pharmacies (3 pharmacies with KYC verified)
 * 3. Sample inventory for each pharmacy
 * 
 * Usage: node seedDrugMaster.js
 * Requires: Firebase Admin SDK initialized
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ============================================================
// DRUG MASTER DATABASE — Top 50 Indian Medicines
// ============================================================
const drugMaster = [
  // Analgesics & Anti-Pyretics
  { name: "Paracetamol 500mg", salt: "Paracetamol", strength: "500mg", form: "tab", brands: ["Crocin", "Dolo"], mrp: 30, genericPrice: 8, schedule: "OTC", category: "analgesic" },
  { name: "Paracetamol 650mg", salt: "Paracetamol", strength: "650mg", form: "tab", brands: ["Dolo 650", "Calpol"], mrp: 35, genericPrice: 11, schedule: "OTC", category: "analgesic" },
  { name: "Ibuprofen 400mg", salt: "Ibuprofen", strength: "400mg", form: "tab", brands: ["Brufen", "Ibugesic"], mrp: 25, genericPrice: 7, schedule: "OTC", category: "analgesic" },
  { name: "Diclofenac 50mg", salt: "Diclofenac Sodium", strength: "50mg", form: "tab", brands: ["Voveran", "Diclomol"], mrp: 38, genericPrice: 10, schedule: "H", category: "analgesic" },

  // Antibiotics
  { name: "Amoxicillin 500mg", salt: "Amoxicillin", strength: "500mg", form: "cap", brands: ["Novamox", "Mox"], mrp: 110, genericPrice: 32, schedule: "H", category: "antibiotic" },
  { name: "Azithromycin 500mg", salt: "Azithromycin", strength: "500mg", form: "tab", brands: ["Azithral", "Zithromax"], mrp: 140, genericPrice: 45, schedule: "H", category: "antibiotic" },
  { name: "Ciprofloxacin 500mg", salt: "Ciprofloxacin", strength: "500mg", form: "tab", brands: ["Ciplox", "Cifran"], mrp: 65, genericPrice: 18, schedule: "H", category: "antibiotic" },
  { name: "Cefixime 200mg", salt: "Cefixime", strength: "200mg", form: "tab", brands: ["Taxim-O", "Zifi"], mrp: 120, genericPrice: 35, schedule: "H", category: "antibiotic" },
  { name: "Metronidazole 400mg", salt: "Metronidazole", strength: "400mg", form: "tab", brands: ["Flagyl", "Metrogyl"], mrp: 28, genericPrice: 8, schedule: "H", category: "antibiotic" },
  { name: "Doxycycline 100mg", salt: "Doxycycline", strength: "100mg", form: "cap", brands: ["Doxt-SL", "Doxy-1"], mrp: 85, genericPrice: 22, schedule: "H", category: "antibiotic" },

  // Gastrointestinal
  { name: "Pantoprazole 40mg", salt: "Pantoprazole", strength: "40mg", form: "tab", brands: ["Pan 40", "Pantop"], mrp: 95, genericPrice: 24, schedule: "H", category: "gastro" },
  { name: "Omeprazole 20mg", salt: "Omeprazole", strength: "20mg", form: "cap", brands: ["Omez", "Prilosec"], mrp: 65, genericPrice: 15, schedule: "H", category: "gastro" },
  { name: "Ranitidine 150mg", salt: "Ranitidine", strength: "150mg", form: "tab", brands: ["Zinetac", "Rantac"], mrp: 30, genericPrice: 8, schedule: "H", category: "gastro" },
  { name: "Domperidone 10mg", salt: "Domperidone", strength: "10mg", form: "tab", brands: ["Domstal", "Motilium"], mrp: 42, genericPrice: 12, schedule: "H", category: "gastro" },
  { name: "Ondansetron 4mg", salt: "Ondansetron", strength: "4mg", form: "tab", brands: ["Emeset", "Ondem"], mrp: 55, genericPrice: 16, schedule: "H", category: "gastro" },

  // Antihistamines & Allergy
  { name: "Cetirizine 10mg", salt: "Cetirizine", strength: "10mg", form: "tab", brands: ["Cetzine", "Alerid"], mrp: 28, genericPrice: 8, schedule: "OTC", category: "antihistamine" },
  { name: "Levocetirizine 5mg", salt: "Levocetirizine", strength: "5mg", form: "tab", brands: ["Xyzal", "Levocet"], mrp: 45, genericPrice: 12, schedule: "H", category: "antihistamine" },
  { name: "Montelukast 10mg", salt: "Montelukast", strength: "10mg", form: "tab", brands: ["Montair", "Singulair"], mrp: 120, genericPrice: 30, schedule: "H", category: "antihistamine" },

  // Cardiovascular
  { name: "Amlodipine 5mg", salt: "Amlodipine", strength: "5mg", form: "tab", brands: ["Amlong", "Norvasc"], mrp: 35, genericPrice: 10, schedule: "H", category: "cardiovascular" },
  { name: "Atorvastatin 10mg", salt: "Atorvastatin", strength: "10mg", form: "tab", brands: ["Atorlip", "Lipitor"], mrp: 85, genericPrice: 22, schedule: "H", category: "cardiovascular" },
  { name: "Losartan 50mg", salt: "Losartan", strength: "50mg", form: "tab", brands: ["Losar", "Cozaar"], mrp: 55, genericPrice: 15, schedule: "H", category: "cardiovascular" },
  { name: "Telmisartan 40mg", salt: "Telmisartan", strength: "40mg", form: "tab", brands: ["Telma", "Telmikind"], mrp: 75, genericPrice: 20, schedule: "H", category: "cardiovascular" },
  { name: "Aspirin 75mg", salt: "Aspirin", strength: "75mg", form: "tab", brands: ["Ecosprin", "Disprin"], mrp: 18, genericPrice: 5, schedule: "OTC", category: "cardiovascular" },
  { name: "Clopidogrel 75mg", salt: "Clopidogrel", strength: "75mg", form: "tab", brands: ["Clopilet", "Plavix"], mrp: 95, genericPrice: 28, schedule: "H", category: "cardiovascular" },

  // Diabetes
  { name: "Metformin 500mg", salt: "Metformin", strength: "500mg", form: "tab", brands: ["Glycomet", "Glucophage"], mrp: 42, genericPrice: 14, schedule: "H", category: "diabetes" },
  { name: "Metformin 1000mg", salt: "Metformin", strength: "1000mg", form: "tab", brands: ["Glycomet GP", "Gluconorm"], mrp: 75, genericPrice: 25, schedule: "H", category: "diabetes" },
  { name: "Glimepiride 2mg", salt: "Glimepiride", strength: "2mg", form: "tab", brands: ["Amaryl", "Glimestar"], mrp: 65, genericPrice: 18, schedule: "H", category: "diabetes" },

  // Respiratory
  { name: "Salbutamol 4mg", salt: "Salbutamol", strength: "4mg", form: "tab", brands: ["Asthalin", "Ventolin"], mrp: 22, genericPrice: 6, schedule: "H", category: "respiratory" },
  { name: "Theophylline 200mg", salt: "Theophylline", strength: "200mg", form: "tab", brands: ["Deriphyllin", "Theo-Dur"], mrp: 45, genericPrice: 12, schedule: "H", category: "respiratory" },

  // Steroids & Anti-inflammatory
  { name: "Prednisolone 5mg", salt: "Prednisolone", strength: "5mg", form: "tab", brands: ["Wysolone", "Omnacortil"], mrp: 18, genericPrice: 5, schedule: "H", category: "steroid" },
  { name: "Dexamethasone 0.5mg", salt: "Dexamethasone", strength: "0.5mg", form: "tab", brands: ["Decadron", "Dexona"], mrp: 12, genericPrice: 4, schedule: "H", category: "steroid" },

  // Vitamins & Supplements
  { name: "Calcium + Vitamin D3", salt: "Calcium Carbonate + Cholecalciferol", strength: "500mg+250IU", form: "tab", brands: ["Shelcal", "Calcimax"], mrp: 150, genericPrice: 45, schedule: "OTC", category: "supplement" },
  { name: "Iron + Folic Acid", salt: "Ferrous Sulphate + Folic Acid", strength: "100mg+0.5mg", form: "tab", brands: ["Dexorange", "Autrin"], mrp: 85, genericPrice: 25, schedule: "OTC", category: "supplement" },
  { name: "Vitamin B Complex", salt: "Thiamine + Riboflavin + Niacinamide + Pyridoxine", strength: "multi", form: "tab", brands: ["Becosules", "Neurobion"], mrp: 35, genericPrice: 10, schedule: "OTC", category: "supplement" },
  { name: "Zinc 50mg", salt: "Zinc Sulphate", strength: "50mg", form: "tab", brands: ["Zincovit", "Z&D"], mrp: 45, genericPrice: 12, schedule: "OTC", category: "supplement" },

  // Antifungal
  { name: "Fluconazole 150mg", salt: "Fluconazole", strength: "150mg", form: "cap", brands: ["Zocon", "Flucos"], mrp: 50, genericPrice: 14, schedule: "H", category: "antifungal" },

  // CNS / Neuro
  { name: "Gabapentin 300mg", salt: "Gabapentin", strength: "300mg", form: "cap", brands: ["Gabapin", "Neurontin"], mrp: 120, genericPrice: 35, schedule: "H", category: "neuro" },
  { name: "Pregabalin 75mg", salt: "Pregabalin", strength: "75mg", form: "cap", brands: ["Pregalin", "Lyrica"], mrp: 145, genericPrice: 40, schedule: "H", category: "neuro" },

  // Topical / External
  { name: "Diclofenac Gel 30g", salt: "Diclofenac Diethylamine", strength: "1%", form: "gel", brands: ["Voveran Emulgel", "Volini"], mrp: 95, genericPrice: 30, schedule: "OTC", category: "topical" },
  { name: "Betadine 50ml", salt: "Povidone-Iodine", strength: "5%", form: "solution", brands: ["Betadine"], mrp: 65, genericPrice: 20, schedule: "OTC", category: "topical" },
  { name: "Clotrimazole Cream 20g", salt: "Clotrimazole", strength: "1%", form: "cream", brands: ["Candid", "Canesten"], mrp: 55, genericPrice: 15, schedule: "OTC", category: "topical" },

  // Syrups
  { name: "Ambroxol Syrup 100ml", salt: "Ambroxol Hydrochloride", strength: "15mg/5ml", form: "syrup", brands: ["Mucolite", "Ambrodil"], mrp: 75, genericPrice: 22, schedule: "OTC", category: "respiratory" },
  { name: "ORS Powder", salt: "Oral Rehydration Salts", strength: "21.8g", form: "sachet", brands: ["Electral", "ORS"], mrp: 25, genericPrice: 8, schedule: "OTC", category: "gastro" },

  // Eye/Ear Drops
  { name: "Ciprofloxacin Eye Drops 5ml", salt: "Ciprofloxacin", strength: "0.3%", form: "drops", brands: ["Ciplox Eye", "Zoxan"], mrp: 40, genericPrice: 12, schedule: "H", category: "ophthalmic" },
  { name: "Tobramycin Eye Drops 5ml", salt: "Tobramycin", strength: "0.3%", form: "drops", brands: ["Tobrex", "Tobracin"], mrp: 85, genericPrice: 25, schedule: "H", category: "ophthalmic" },

  // Hormones / Thyroid
  { name: "Levothyroxine 50mcg", salt: "Levothyroxine", strength: "50mcg", form: "tab", brands: ["Thyronorm", "Eltroxin"], mrp: 110, genericPrice: 32, schedule: "H", category: "hormone" },

  // Anti-anxiety / Sleep
  { name: "Alprazolam 0.25mg", salt: "Alprazolam", strength: "0.25mg", form: "tab", brands: ["Restyl", "Alprax"], mrp: 30, genericPrice: 8, schedule: "H1", category: "cns" },

  // Injections (for hospital pharmacy reference)
  { name: "Ranitidine Inj 2ml", salt: "Ranitidine", strength: "25mg/ml", form: "injection", brands: ["Rantac Inj"], mrp: 12, genericPrice: 4, schedule: "H", category: "injection" },
  { name: "Tramadol Inj 2ml", salt: "Tramadol", strength: "50mg/ml", form: "injection", brands: ["Ultracet Inj"], mrp: 35, genericPrice: 10, schedule: "H1", category: "injection" },
];

// ============================================================
// SAMPLE PHARMACIES
// ============================================================
const samplePharmacies = [
  {
    id: "pharm-hospital",
    name: "CityCare Hospital Pharmacy",
    type: "hospital",
    address: "Ground Floor, CityCare Hospital, Link Road, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400053",
    lat: 19.1364,
    lng: 72.8296,
    drugLicenseNo: "MH-20B-2024-001234",
    gstNo: "27AABCC1234D1Z5",
    registeredPharmacist: "Imran Shaikh",
    pharmacistCouncilNo: "MH-PH-2019-4567",
    operatingHours: { open: "08:00", close: "21:00" },
    services: ["pickup"],
    deliveryRadius: 0,
    deliveryFee: 0,
    kycStatus: "verified",
    isActive: true,
    rating: 4.3,
    reviewCount: 245,
    commissionRate: 0.05,
  },
  {
    id: "pharm-janaushadhi",
    name: "Jan Aushadhi Kendra #102",
    type: "jan_aushadhi",
    address: "Shop 12, Govt Complex, S.V. Road, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400058",
    lat: 19.1280,
    lng: 72.8350,
    drugLicenseNo: "MH-20B-2024-005678",
    gstNo: "27AABCC5678E2Z3",
    registeredPharmacist: "Rajesh Patel",
    pharmacistCouncilNo: "MH-PH-2018-7890",
    operatingHours: { open: "09:00", close: "20:00" },
    services: ["pickup"],
    deliveryRadius: 0,
    deliveryFee: 0,
    kycStatus: "verified",
    isActive: true,
    rating: 4.1,
    reviewCount: 89,
    commissionRate: 0.03,
  },
  {
    id: "pharm-medplus",
    name: "MedPlus Pharmacy - Andheri",
    type: "chain",
    address: "Shop 5, Crystal Plaza, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400053",
    lat: 19.1350,
    lng: 72.8270,
    drugLicenseNo: "MH-20B-2024-009012",
    gstNo: "27AABCC9012F3Z1",
    registeredPharmacist: "Priya Deshmukh",
    pharmacistCouncilNo: "MH-PH-2020-3456",
    operatingHours: { open: "08:00", close: "22:00" },
    services: ["pickup", "delivery"],
    deliveryRadius: 3,
    deliveryFee: 30,
    kycStatus: "verified",
    isActive: true,
    rating: 4.5,
    reviewCount: 520,
    commissionRate: 0.05,
  },
];

// ============================================================
// SEED FUNCTIONS
// ============================================================

async function seedDrugMaster() {
  console.log("📦 Seeding Drug Master Database...");
  const batch = db.batch();

  for (const drug of drugMaster) {
    const drugId = drug.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const ref = db.doc(`drugMaster/${drugId}`);

    batch.set(ref, {
      name: drug.name,
      saltComposition: drug.salt,
      strength: drug.strength,
      form: drug.form,
      brands: drug.brands,
      mrp: drug.mrp,
      genericPrice: drug.genericPrice,
      scheduleType: drug.schedule,
      category: drug.category,
      isGeneric: false,
      janAushadhiAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`  ✅ ${drugMaster.length} drugs added to drugMaster collection.`);
}

async function seedPharmacies() {
  console.log("🏪 Seeding Sample Pharmacies...");

  for (const pharmacy of samplePharmacies) {
    const ref = db.doc(`pharmacies/${pharmacy.id}`);
    await ref.set({
      name: pharmacy.name,
      type: pharmacy.type,
      address: pharmacy.address,
      city: pharmacy.city,
      state: pharmacy.state,
      pinCode: pharmacy.pinCode,
      geo: new admin.firestore.GeoPoint(pharmacy.lat, pharmacy.lng),
      drugLicenseNo: pharmacy.drugLicenseNo,
      gstNo: pharmacy.gstNo,
      registeredPharmacist: pharmacy.registeredPharmacist,
      pharmacistCouncilNo: pharmacy.pharmacistCouncilNo,
      operatingHours: pharmacy.operatingHours,
      services: pharmacy.services,
      deliveryRadius: pharmacy.deliveryRadius,
      deliveryFee: pharmacy.deliveryFee,
      kycStatus: pharmacy.kycStatus,
      isActive: pharmacy.isActive,
      rating: pharmacy.rating,
      reviewCount: pharmacy.reviewCount,
      commissionRate: pharmacy.commissionRate,
      totalOrders: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ ${pharmacy.name} (${pharmacy.id})`);
  }
}

async function seedInventory() {
  console.log("💊 Seeding Sample Inventory for each pharmacy...");

  for (const pharmacy of samplePharmacies) {
    const pharmacyId = pharmacy.id;
    let count = 0;

    for (const drug of drugMaster) {
      // Randomly decide if this pharmacy stocks this drug (80% chance)
      if (Math.random() > 0.80 && pharmacy.type !== "hospital") continue;

      const drugId = drug.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const ref = db.doc(`pharmacies/${pharmacyId}/inventory/${drugId}`);

      // Random stock quantity
      const stockQty = Math.floor(Math.random() * 500) + 20;
      const batchNo = `BATCH-${Math.floor(Math.random() * 9000) + 1000}`;
      
      // Expiry 6-18 months from now
      const expiryMonths = Math.floor(Math.random() * 12) + 6;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

      // Price: Jan Aushadhi sells at generic price, others sell at 60-90% of MRP
      let sellingPrice;
      if (pharmacy.type === "jan_aushadhi") {
        sellingPrice = drug.genericPrice;
      } else {
        sellingPrice = Math.round(drug.mrp * (0.6 + Math.random() * 0.3));
      }

      await ref.set({
        drugId,
        drugMasterId: drugId,
        brandName: drug.brands[0],
        saltComposition: drug.salt,
        strength: drug.strength,
        form: drug.form,
        category: pharmacy.type === "jan_aushadhi" ? "jan_aushadhi" : drug.category,
        scheduleType: drug.schedule,
        availableQty: stockQty,
        batches: [{
          batchNo,
          qty: stockQty,
          expiryDate: expiryDate.toISOString().split("T")[0],
          purchasePrice: Math.round(drug.genericPrice * 0.8),
          receivedDate: new Date().toISOString(),
        }],
        mrp: drug.mrp,
        sellingPrice,
        reorderLevel: 20,
        isActive: true,
        stockStatus: stockQty > 20 ? "in_stock" : "low_stock",
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    }
    console.log(`  ✅ ${pharmacy.name}: ${count} drugs stocked`);
  }
}

// ============================================================
// SAMPLE HOSPITALS (Zomato-style)
// ============================================================
const sampleHospitals = [
  {
    id: "hosp-citycare",
    name: "CityCare Multispeciality Hospital",
    type: "hospital",
    address: "Near Andheri Station, Link Road, Andheri West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400053",
    lat: 19.1364,
    lng: 72.8296,
    phone: "+91-22-2632-1234",
    email: "info@citycarehospital.in",
    consultFee: 500,
    avgWaitTime: "15 min",
    specialities: ["General Medicine", "Orthopedics", "Cardiology", "ENT", "Dermatology", "Pediatrics"],
    rating: 4.3,
    reviewCount: 245,
    isActive: true,
    isOpen: true,
    operatingHours: { open: "08:00", close: "21:00" },
    beds: 120,
    emergencyAvailable: true,
    departments: [
      { name: "General Medicine", icon: "🩺", description: "Fever, infections, chronic diseases, preventive health", doctorCount: 8 },
      { name: "Orthopedics", icon: "🦴", description: "Bone, joint, muscle, spine disorders", doctorCount: 4 },
      { name: "Cardiology", icon: "❤️", description: "Heart conditions, ECG, echo, stress tests", doctorCount: 3 },
      { name: "ENT", icon: "👂", description: "Ear, nose, throat specialist", doctorCount: 2 },
      { name: "Dermatology", icon: "🧴", description: "Skin, hair, nail conditions", doctorCount: 3 },
      { name: "Pediatrics", icon: "👶", description: "Child healthcare, vaccination, growth", doctorCount: 4 },
    ],
  },
  {
    id: "hosp-lilavati",
    name: "Lilavati Hospital & Research Centre",
    type: "hospital",
    address: "A-791, Bandra Reclamation, Bandra West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400050",
    lat: 19.0520,
    lng: 72.8280,
    phone: "+91-22-2640-5000",
    email: "info@lilavatihospital.com",
    consultFee: 1200,
    avgWaitTime: "20 min",
    specialities: ["Neurosurgery", "Oncology", "Gastroenterology", "Urology", "Cardiology"],
    rating: 4.6,
    reviewCount: 1823,
    isActive: true,
    isOpen: true,
    operatingHours: { open: "00:00", close: "23:59" },
    beds: 314,
    emergencyAvailable: true,
    departments: [
      { name: "Neurosurgery", icon: "🧠", description: "Brain, spine, nerve surgery", doctorCount: 6 },
      { name: "Oncology", icon: "🎗️", description: "Cancer diagnosis, chemo, radiation", doctorCount: 5 },
      { name: "Gastroenterology", icon: "🫁", description: "Digestive system, liver, endoscopy", doctorCount: 4 },
      { name: "Urology", icon: "🩺", description: "Kidney, bladder, prostate conditions", doctorCount: 3 },
      { name: "Cardiology", icon: "❤️", description: "Heart conditions, angioplasty, bypass", doctorCount: 5 },
    ],
  },
  {
    id: "hosp-veerhealth",
    name: "Veer Health Clinic",
    type: "clinic",
    address: "Shop 4, Shree Ganesh CHS, Versova, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400061",
    lat: 19.1400,
    lng: 72.8200,
    phone: "+91-98765-43210",
    email: "dr.veer@healthclinic.in",
    consultFee: 300,
    avgWaitTime: "10 min",
    specialities: ["General Medicine", "Diabetes Care", "Preventive Health"],
    rating: 4.1,
    reviewCount: 89,
    isActive: true,
    isOpen: true,
    operatingHours: { open: "09:00", close: "20:00" },
    beds: 0,
    emergencyAvailable: false,
    departments: [
      { name: "General Consultation", icon: "🩺", description: "Walk-in OPD, follow-up, prescriptions", doctorCount: 2 },
      { name: "Diabetes Care", icon: "🩸", description: "Sugar monitoring, diet counseling, insulin management", doctorCount: 1 },
    ],
  },
  {
    id: "hosp-apollo",
    name: "Apollo Spectra Hospital",
    type: "hospital",
    address: "Tardeo Road, Mumbai Central, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400034",
    lat: 18.9750,
    lng: 72.8180,
    phone: "+91-22-4321-5678",
    email: "mumbai@apollospectra.com",
    consultFee: 800,
    avgWaitTime: "25 min",
    specialities: ["Orthopedics", "Ophthalmology", "Gynecology", "General Surgery", "ENT"],
    rating: 4.4,
    reviewCount: 412,
    isActive: true,
    isOpen: true,
    operatingHours: { open: "07:00", close: "22:00" },
    beds: 80,
    emergencyAvailable: true,
    departments: [
      { name: "Orthopedics", icon: "🦴", description: "Joint replacement, sports injuries", doctorCount: 5 },
      { name: "Ophthalmology", icon: "👁️", description: "Cataract, LASIK, retina", doctorCount: 3 },
      { name: "Gynecology", icon: "🤰", description: "Women's health, maternity, fertility", doctorCount: 4 },
      { name: "General Surgery", icon: "🔬", description: "Laparoscopic, hernia, appendix", doctorCount: 3 },
    ],
  },
];

async function seedHospitals() {
  console.log("🏥 Seeding Sample Hospitals...");

  for (const hospital of sampleHospitals) {
    const ref = db.doc(`hospitals/${hospital.id}`);
    const departments = hospital.departments || [];

    await ref.set({
      name: hospital.name,
      type: hospital.type,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pinCode: hospital.pinCode,
      geo: new admin.firestore.GeoPoint(hospital.lat, hospital.lng),
      phone: hospital.phone,
      email: hospital.email,
      consultFee: hospital.consultFee,
      avgWaitTime: hospital.avgWaitTime,
      specialities: hospital.specialities,
      rating: hospital.rating,
      reviewCount: hospital.reviewCount,
      isActive: hospital.isActive,
      isOpen: hospital.isOpen,
      operatingHours: hospital.operatingHours,
      beds: hospital.beds,
      emergencyAvailable: hospital.emergencyAvailable,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add departments as sub-collection
    for (const dept of departments) {
      const deptId = dept.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      await db.doc(`hospitals/${hospital.id}/departments/${deptId}`).set({
        name: dept.name,
        icon: dept.icon,
        description: dept.description,
        doctorCount: dept.doctorCount,
        isActive: true,
      });
    }

    console.log(`  ✅ ${hospital.name} (${departments.length} departments)`);
  }
}

async function seedSamplePrescriptions() {
  console.log("📋 Seeding Sample Prescriptions...");

  const prescriptions = [
    {
      id: "rx-demo-001",
      patientId: "patient-demo-001",
      patientName: "Rahul Sharma",
      doctorId: "dr-mehta",
      doctorName: "Dr. Mehta",
      hospitalId: "hosp-citycare",
      hospitalName: "CityCare Multispeciality Hospital",
      diagnosis: "Upper Respiratory Tract Infection",
      items: [
        { drugName: "Azithromycin 500mg", salt: "Azithromycin", strength: "500mg", form: "tab", quantity: 3, dosage: "1 OD", duration: "3 days", mrp: 140 },
        { drugName: "Paracetamol 650mg", salt: "Paracetamol", strength: "650mg", form: "tab", quantity: 10, dosage: "1 TDS", duration: "3 days", mrp: 35 },
        { drugName: "Cetirizine 10mg", salt: "Cetirizine", strength: "10mg", form: "tab", quantity: 5, dosage: "1 HS", duration: "5 days", mrp: 28 },
        { drugName: "Ambroxol Syrup 100ml", salt: "Ambroxol Hydrochloride", strength: "15mg/5ml", form: "syrup", quantity: 1, dosage: "10ml TDS", duration: "5 days", mrp: 75 },
      ],
    },
    {
      id: "rx-demo-002",
      patientId: "patient-demo-002",
      patientName: "Priya Patel",
      doctorId: "dr-shah",
      doctorName: "Dr. Shah",
      hospitalId: "hosp-citycare",
      hospitalName: "CityCare Multispeciality Hospital",
      diagnosis: "Type 2 Diabetes Mellitus",
      items: [
        { drugName: "Metformin 500mg", salt: "Metformin", strength: "500mg", form: "tab", quantity: 30, dosage: "1 BD", duration: "1 month", mrp: 42 },
        { drugName: "Glimepiride 2mg", salt: "Glimepiride", strength: "2mg", form: "tab", quantity: 30, dosage: "1 OD", duration: "1 month", mrp: 65 },
        { drugName: "Atorvastatin 10mg", salt: "Atorvastatin", strength: "10mg", form: "tab", quantity: 30, dosage: "1 HS", duration: "1 month", mrp: 85 },
      ],
    },
  ];

  for (const rx of prescriptions) {
    await db.doc(`prescriptions/${rx.id}`).set({
      ...rx,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ Rx ${rx.id}: ${rx.patientName} — ${rx.items.length} medicines`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("🚀 MediQ v5 — Database Seed Script");
  console.log("===================================\n");

  try {
    await seedDrugMaster();
    await seedPharmacies();
    await seedInventory();
    await seedHospitals();
    await seedSamplePrescriptions();

    console.log("\n✅ All seed data loaded successfully!");
    console.log("   Drug Master: " + drugMaster.length + " drugs");
    console.log("   Pharmacies: " + samplePharmacies.length + " pharmacies");
    console.log("   Hospitals: " + sampleHospitals.length + " hospitals");
    console.log("   Inventory: ~" + (drugMaster.length * samplePharmacies.length) + " stock entries");
    console.log("   Sample Prescriptions: 2");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  }

  process.exit(0);
}

main();
