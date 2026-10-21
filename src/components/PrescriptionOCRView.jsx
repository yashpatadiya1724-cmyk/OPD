import React, { useState } from 'react';
import { 
  Scan, 
  Camera, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Percent, 
  Layers, 
  RefreshCw,
  TrendingDown,
  Clock,
  Printer,
  ChevronRight,
  Plane
} from 'lucide-react';

// Master samples of Indian handwritten & clinic prescriptions
const SAMPLE_PRESCRIPTIONS = [
  {
    id: 'rx-sample-1',
    label: 'Sample 1: General Physician (Acute Fever & Bronchitis)',
    doctorName: 'Dr. Rajesh K. Mehta, MD (General Medicine)',
    regNo: 'GMC-48291 / NMC Verified',
    clinic: 'CityCare Central Hospital OPD - Room 104',
    date: '2026-10-21',
    patientName: 'Ravi Kumar Patel',
    patientAge: '34 Yrs / Male',
    diagnosis: 'Acute Upper Respiratory Tract Infection (URTI) with High-grade Fever',
    imagePlaceholderBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    badge: 'Standard OPD Rx',
    medicines: [
      {
        brandName: 'Augmentin 625mg',
        form: 'Tablet',
        dosage: '1 Tab - TDS (Every 8 hrs)',
        timing: 'After Food (Post Prandial)',
        duration: '5 Days',
        qty: 15,
        brandPrice: 220,
        genericName: 'Amoxicillin + Potassium Clavulanate 625mg',
        genericBrand: 'Jan Aushadhi Amoxy-Clav 625',
        genericPrice: 65,
        category: 'Broad-Spectrum Antibiotic',
        confidence: 98.4
      },
      {
        brandName: 'Dolo 650mg',
        form: 'Tablet',
        dosage: '1 Tab - SOS (Max 3/day for fever >100°F)',
        timing: 'After Food',
        duration: '3 Days',
        qty: 10,
        brandPrice: 35,
        genericName: 'Paracetamol 650mg IP',
        genericBrand: 'Jan Aushadhi Paracetamol 650',
        genericPrice: 11,
        category: 'Antipyretic / Analgesic',
        confidence: 99.1
      },
      {
        brandName: 'Pantocid 40mg',
        form: 'Tablet',
        dosage: '1 Tab - OD (Morning)',
        timing: 'Empty Stomach (30 min Before Food)',
        duration: '5 Days',
        qty: 5,
        brandPrice: 95,
        genericName: 'Pantoprazole Gastro-resistant 40mg',
        genericBrand: 'Jan Aushadhi Pantoprazole 40',
        genericPrice: 24,
        category: 'Proton Pump Inhibitor / Antacid',
        confidence: 96.8
      },
      {
        brandName: 'Cetzine 10mg',
        form: 'Tablet',
        dosage: '1 Tab - HS (Bedtime)',
        timing: 'At Night',
        duration: '5 Days',
        qty: 5,
        brandPrice: 28,
        genericName: 'Cetirizine Hydrochloride 10mg',
        genericBrand: 'Jan Aushadhi Cetirizine 10',
        genericPrice: 8,
        category: 'Antihistamine / Anti-Allergic',
        confidence: 97.5
      }
    ]
  },
  {
    id: 'rx-sample-2',
    label: 'Sample 2: Pediatric Care (Seasonal Viral & Cough)',
    doctorName: 'Dr. Anita Joshi, MD (Pediatrics)',
    regNo: 'MMC-62940 / NMC Verified',
    clinic: 'ChildCare Clinic & Immunization Center',
    date: '2026-10-21',
    patientName: 'Master Aarav Sharma',
    patientAge: '6 Yrs / Male',
    diagnosis: 'Viral Pharyngitis with Productive Cough',
    imagePlaceholderBg: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
    badge: 'Pediatric Rx',
    medicines: [
      {
        brandName: 'Ascoril LS Syrup 100ml',
        form: 'Syrup',
        dosage: '5 ml - TDS',
        timing: 'After Food',
        duration: '5 Days',
        qty: 1,
        brandPrice: 135,
        genericName: 'Levosalbutamol + Ambroxol + Guaiphenesin',
        genericBrand: 'Jan Aushadhi Cough Expectorant',
        genericPrice: 38,
        category: 'Bronchodilator / Expectorant',
        confidence: 97.2
      },
      {
        brandName: 'Crocin 240mg DS Suspension',
        form: 'Syrup',
        dosage: '5 ml - SOS (For fever)',
        timing: 'After Food',
        duration: '3 Days',
        qty: 1,
        brandPrice: 65,
        genericName: 'Paracetamol Paediatric Oral Suspension 250mg/5ml',
        genericBrand: 'Jan Aushadhi Paracetamol Syrup',
        genericPrice: 18,
        category: 'Antipyretic',
        confidence: 98.9
      },
      {
        brandName: 'Montair LC Kid Syrup',
        form: 'Syrup',
        dosage: '5 ml - OD (Bedtime)',
        timing: 'At Night',
        duration: '7 Days',
        qty: 1,
        brandPrice: 160,
        genericName: 'Montelukast 4mg + Levocetirizine 2.5mg',
        genericBrand: 'Jan Aushadhi Monte-LC Kid',
        genericPrice: 42,
        category: 'Anti-allergic / Leukotriene Inhibitor',
        confidence: 95.7
      }
    ]
  },
  {
    id: 'rx-sample-3',
    label: 'Sample 3: Orthopedic & Trauma (Lumbar Spondylitis)',
    doctorName: 'Dr. S. K. Patel, MS (Ortho)',
    regNo: 'GMC-33109 / NMC Verified',
    clinic: 'Metro Bone & Joint Institute',
    date: '2026-10-20',
    patientName: 'Smt. Sushila Ben',
    patientAge: '68 Yrs / Female (Senior Citizen Priority)',
    diagnosis: 'Acute Lumbar Radiculopathy with Osteoarthritis Knee',
    imagePlaceholderBg: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
    badge: 'Geriatric Ortho Rx',
    medicines: [
      {
        brandName: 'Zerodol-SP',
        form: 'Tablet',
        dosage: '1 Tab - BD',
        timing: 'After Food',
        duration: '7 Days',
        qty: 14,
        brandPrice: 155,
        genericName: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
        genericBrand: 'Jan Aushadhi Aceclo-Serratio',
        genericPrice: 44,
        category: 'NSAID / Anti-inflammatory Pain Relief',
        confidence: 98.1
      },
      {
        brandName: 'Shelcal 500mg',
        form: 'Tablet',
        dosage: '1 Tab - OD',
        timing: 'After Lunch with Water',
        duration: '30 Days',
        qty: 30,
        brandPrice: 140,
        genericName: 'Calcium Carbonate 500mg + Vitamin D3 250 IU',
        genericBrand: 'Jan Aushadhi Calcium + Vit D3',
        genericPrice: 38,
        category: 'Bone Mineral Supplement',
        confidence: 99.4
      },
      {
        brandName: 'Rabemac DSR',
        form: 'Capsule',
        dosage: '1 Cap - OD',
        timing: 'Empty Stomach (Morning)',
        duration: '7 Days',
        qty: 7,
        brandPrice: 130,
        genericName: 'Rabeprazole 20mg + Domperidone 30mg SR',
        genericBrand: 'Jan Aushadhi Rabe-DSR',
        genericPrice: 32,
        category: 'Gastro-resistant PPI',
        confidence: 96.3
      }
    ]
  }
];

export default function PrescriptionOCRView({ onOrderFulfillment, onOpenAbdmLocker }) {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_PRESCRIPTIONS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [hasScanned, setHasScanned] = useState(true);
  const [genericToggle, setGenericToggle] = useState(true); // Default to Jan Aushadhi generic savings!
  const [customImageUploaded, setCustomImageUploaded] = useState(null);
  const [orderNotification, setOrderNotification] = useState(null);

  // Trigger simulated scanning animation
  const handleStartScan = (sample) => {
    setSelectedSample(sample);
    setIsScanning(true);
    setScanProgress(0);
    setHasScanned(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 12;
      if (progress >= 100) {
        setScanProgress(100);
        setIsScanning(false);
        setHasScanned(true);
        clearInterval(interval);
      } else {
        setScanProgress(progress);
      }
    }, 180);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImageUploaded(reader.result);
        handleStartScan(SAMPLE_PRESCRIPTIONS[0]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Pricing calculations
  const totalBrandCost = selectedSample.medicines.reduce((acc, m) => acc + m.brandPrice, 0);
  const totalGenericCost = selectedSample.medicines.reduce((acc, m) => acc + m.genericPrice, 0);
  const totalSavings = totalBrandCost - totalGenericCost;
  const savingsPercent = Math.round((totalSavings / totalBrandCost) * 100);

  const activeCost = genericToggle ? totalGenericCost : totalBrandCost;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
          }}>
            <Scan size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                letterSpacing: '0.05em'
              }}>
                POSTER ENHANCEMENT 2 • AI VISION
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                98.2% MODEL ACCURACY
              </span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: '0.25rem 0 0.15rem' }}>
              Handwritten Prescription OCR &amp; AI Digitizer
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
              Scans doctors' physical paper prescriptions, parses dosages, and maps instant Jan Aushadhi generic savings (70.9% avg).
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            padding: '0.65rem 1.15rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}>
            <Camera size={16} color="#38bdf8" />
            <span>Upload Photo / Scan</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            onClick={() => handleStartScan(selectedSample)}
            disabled={isScanning}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: isScanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <RefreshCw size={16} className={isScanning ? 'spin' : ''} />
            <span>{isScanning ? `Analyzing (${scanProgress}%)...` : 'Re-Scan Current Rx'}</span>
          </button>
        </div>
      </div>

      {/* Sample Selector Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Select Clinical Sample:
        </span>
        {SAMPLE_PRESCRIPTIONS.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleStartScan(sample)}
            style={{
              background: selectedSample.id === sample.id ? '#0284c7' : 'var(--bg-inner)',
              color: selectedSample.id === sample.id ? '#ffffff' : 'var(--text-secondary)',
              border: selectedSample.id === sample.id ? 'none' : '1px solid var(--border-subtle)',
              padding: '0.5rem 0.95rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {sample.badge}
          </button>
        ))}
      </div>

      {/* Order Feedback Alert */}
      {orderNotification && (
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={24} color="#34d399" />
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                {orderNotification.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#a7f3d0' }}>
                {orderNotification.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOrderNotification(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Split: Scanned Physical Document vs Digitized Clinical Data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Physical Paper Prescription Preview & Scanner Laser */}
        <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                Original Paper Prescription
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 900 }}>
              ● HIGH-RES CAPTURE
            </span>
          </div>

          {/* Interactive Document Pad */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #cbd5e1',
            padding: '1.5rem',
            color: '#0f172a',
            fontFamily: "'Courier New', Courier, monospace",
            position: 'relative',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.1)',
            minHeight: '440px'
          }}>
            
            {/* Real-time laser scanning line animation */}
            {isScanning && (
              <div style={{
                position: 'absolute',
                top: `${scanProgress}%`,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #38bdf8, #0284c7, #38bdf8, transparent)',
                boxShadow: '0 0 16px #38bdf8, 0 0 8px #0284c7',
                zIndex: 10,
                transition: 'top 0.15s ease'
              }} />
            )}

            {/* Document Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', color: '#0369a1' }}>
                {selectedSample.clinic}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '2px' }}>
                {selectedSample.doctorName}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Reg: {selectedSample.regNo} &bull; Date: {selectedSample.date}
              </div>
            </div>

            {/* Patient Info Block */}
            <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', border: '1px dashed #94a3b8', fontSize: '0.8rem' }}>
              <div><strong>Pt Name:</strong> {selectedSample.patientName}</div>
              <div><strong>Age/Sex:</strong> {selectedSample.patientAge}</div>
              <div style={{ marginTop: '3px', color: '#dc2626' }}>
                <strong>Dx:</strong> {selectedSample.diagnosis}
              </div>
            </div>

            {/* Hand-drawn simulated Rx Symbol */}
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', marginBottom: '0.5rem', fontFamily: 'serif' }}>
              ℞
            </div>

            {/* Simulated Doctor Handwriting List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              {selectedSample.medicines.map((m, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    background: isScanning ? 'rgba(56, 189, 248, 0.08)' : '#f1f5f9',
                    borderLeft: '4px solid #0284c7',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#0f172a' }}>
                    {idx + 1}. Tab. {m.brandName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                    {m.dosage} &bull; {m.timing} &bull; {m.duration}
                  </div>
                </div>
              ))}
            </div>

            {/* Doctor Signature */}
            <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
              <span style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.4rem', color: '#0369a1', display: 'block' }}>
                Dr. R. K. Mehta
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>
                Verified Digital Sign &bull; NMC Validated
              </span>
            </div>

          </div>

          {/* Scanner AI Metrics Bar */}
          <div style={{ marginTop: '1.25rem', background: 'var(--bg-inner)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              <span>OCR MODEL: MediQ-Vision-v4.2</span>
              <span style={{ color: '#10b981' }}>CONFIDENCE: 98.4%</span>
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              ✔ Doctor handwriting de-skewed &bull; Multi-language salt lexicon verified &bull; Schedule H audit passed.
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Digitized Structured Prescription & Jan Aushadhi Optimizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card 1: Jan Aushadhi Generic Cost Optimizer */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '2px solid #059669', background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.15) 0%, rgba(2, 44, 34, 0.15) 100%)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Percent size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase' }}>
                    PMBJP / JAN AUSHADHI REVOLUTION
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    Generic Medicine Substitution Optimizer
                  </h3>
                </div>
              </div>

              {/* Generic vs Branded Toggle Switch */}
              <div style={{
                background: 'var(--bg-inner)',
                padding: '0.3rem',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '0.35rem'
              }}>
                <button
                  onClick={() => setGenericToggle(true)}
                  style={{
                    background: genericToggle ? '#059669' : 'transparent',
                    color: genericToggle ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Sparkles size={14} />
                  <span>Jan Aushadhi Generic ({savingsPercent}% OFF)</span>
                </button>

                <button
                  onClick={() => setGenericToggle(false)}
                  style={{
                    background: !genericToggle ? '#0284c7' : 'transparent',
                    color: !genericToggle ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  Branded MRP
                </button>
              </div>
            </div>

            {/* Savings Scorecard Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              background: 'var(--bg-surface)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>BRANDED MRP COST</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#94a3b8', textDecoration: genericToggle ? 'line-through' : 'none' }}>
                  ₹{totalBrandCost}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Standard Retail Chemist</span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>JAN AUSHADHI GENERIC</span>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981' }}>
                  ₹{totalGenericCost}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>Govt PMBJP Verified Salts</span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>PATIENT MONEY SAVED</span>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8' }}>
                  ₹{totalSavings}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800 }}>
                  🏆 {savingsPercent}% Net Financial Relief
                </span>
              </div>
            </div>

          </div>

          {/* Card 2: Extracted Medicine Table with Form & Dosage Details */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Digitized Clinical Items ({selectedSample.medicines.length} Prescribed)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                Extracted via OCR Engine
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {selectedSample.medicines.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-inner)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        {genericToggle ? m.genericBrand : m.brandName}
                      </strong>
                      <span style={{
                        background: 'rgba(2, 132, 199, 0.1)',
                        color: '#0284c7',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px'
                      }}>
                        {m.category}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      <strong>Active Salt:</strong> {m.genericName}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span><strong>Dose:</strong> {m.dosage}</span>
                      <span><strong>Schedule:</strong> {m.timing}</span>
                      <span><strong>Course:</strong> {m.duration} ({m.qty} Units)</span>
                    </div>
                  </div>

                  {/* Price Comparison Block */}
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                        {genericToggle ? 'JAN AUSHADHI PRICE' : 'BRANDED MRP'}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: genericToggle ? '#10b981' : 'var(--text-primary)' }}>
                        ₹{genericToggle ? m.genericPrice : m.brandPrice}
                      </div>
                      {genericToggle && (
                        <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                          Save ₹{m.brandPrice - m.genericPrice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Instant Fulfillment Trigger Bar */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                  PRESCRIPTION TOTAL ({genericToggle ? 'JAN AUSHADHI GENERIC' : 'BRANDED'})
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ₹{activeCost}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onOrderFulfillment) {
                      onOrderFulfillment({
                        medicines: selectedSample.medicines.map(m => genericToggle ? m.genericBrand : m.brandName),
                        totalPrice: activeCost,
                        isGeneric: genericToggle,
                        doctorName: selectedSample.doctorName,
                        mode: 'drone'
                      });
                    } else {
                      setOrderNotification({
                        title: 'Cold-Chain Drone Dispatch Initialized!',
                        message: `Emergency Drone Aero-MediQ launched with ${selectedSample.medicines.length} medicines. Estimated delivery: 8 mins.`
                      });
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.25rem',
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
                  <Plane size={18} />
                  <span>🚁 Emergency Drone Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOrderFulfillment) {
                      onOrderFulfillment({
                        medicines: selectedSample.medicines.map(m => genericToggle ? m.genericBrand : m.brandName),
                        totalPrice: activeCost,
                        isGeneric: genericToggle,
                        doctorName: selectedSample.doctorName,
                        mode: 'darkstore'
                      });
                    } else {
                      setOrderNotification({
                        title: '⚡ 10-Minute Dark Store Order Placed!',
                        message: `Order for ₹${activeCost} sent to nearest chemist with ACID stock reservation.`
                      });
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <ShoppingBag size={18} />
                  <span>⚡ 10-Min Dark Store Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAbdmLocker) {
                      onOpenAbdmLocker();
                    } else {
                      setOrderNotification({
                        title: 'Prescription Saved to ABDM Health Locker',
                        message: `Linked to ABHA-91-8273-4410-2026. Cryptographic hash recorded on DPDP ledger.`
                      });
                    }
                  }}
                  style={{
                    background: 'var(--bg-inner)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ShieldCheck size={16} color="#059669" />
                  <span>Save to ABDM Locker</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
