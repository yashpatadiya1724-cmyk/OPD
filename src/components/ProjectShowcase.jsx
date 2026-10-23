import React, { useState } from 'react';
import { 
  Activity, 
  Award, 
  Users, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Pill, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Database, 
  Smartphone, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  FileText,
  Printer
} from 'lucide-react';

export default function ProjectShowcase({ onNavigateToRole }) {
  const [activeTab, setActiveTab] = useState('poster'); // 'poster' | 'methodology' | 'analytics' | 'architecture' | 'team'
  const [genericSavingsInput, setGenericSavingsInput] = useState(200);

  // Benchmarked data from field research
  const benchmarkMetrics = [
    { label: 'Waiting-Room Time', traditional: '114.5 min', mediq: '18.2 min', change: '-84.1%', positive: true, icon: Clock },
    { label: 'Dispensing Latency', traditional: '37.8 min', mediq: '4.2 min', change: '-88.9%', positive: true, icon: Pill },
    { label: 'Patient No-Shows', traditional: '23.4%', mediq: '4.1%', change: '-82.5%', positive: true, icon: TrendingDown },
    { label: 'Rx Fulfilment (1st Visit)', traditional: '68.8%', mediq: '94.2%', change: '+36.9%', positive: true, icon: CheckCircle2 },
    { label: 'Prescription Match Time', traditional: 'Manual walk', mediq: '84 ms', change: 'Instant', positive: true, icon: Cpu },
    { label: 'Generic Medicine Savings', traditional: '0% (Branded MRP)', mediq: '70.9% Avg', change: '₹142 / Rx', positive: true, icon: TrendingUp }
  ];

  const methodologySteps = [
    {
      num: 1,
      step: 'Patient Input',
      color: '#0284c7',
      roleKey: 'hospitals',
      items: ['Search Hospital & Doctor', 'Check Live Queue Depth', 'Book OPD Token with Live ETA', 'Enter Symptoms & Case Note', 'Get Transit-Aware Leave-Now Alert']
    },
    {
      num: 2,
      step: 'Predictive Engine',
      color: '#0d9488',
      roleKey: 'patient',
      items: ['Dynamic EWMA Queue Prediction', 'Trait/State Priority Matching', 'Emergency & Senior Lane Guard', 'Haversine Commute Latency Integration']
    },
    {
      num: 3,
      step: 'E-Prescription',
      color: '#7c3aed',
      roleKey: 'doctor',
      items: ['Doctor Consultation Console', 'Clinical Diagnosis & Vitals Note', 'Generate Digital Prescription', 'Automatic Generic (Jan Aushadhi) Mapping']
    },
    {
      num: 4,
      step: 'Matching Engine',
      color: '#ea580c',
      roleKey: 'pharmacy',
      items: ['Find Nearby Community Pharmacies', 'Real-Time Batch Stock Availability', 'Prescription Price Comparison (<84 ms)', '1-Click Prescription Dispatch']
    },
    {
      num: 5,
      step: 'Fulfilment',
      color: '#16a34a',
      roleKey: 'pharmacy',
      items: ['Pharmacy Confirms Stock', 'Auto Stock Deduction (ACID Transactions)', 'Express Counter Pickup or Delivery', 'Sync Patient & Hospital Audit Ledger']
    }
  ];

  const genericAlternatives = [
    { branded: 'Paracetamol 650 (Calpol/Dolo)', brandedPrice: 32, generic: 'Paracetamol Jan Aushadhi 650', genericPrice: 8, savePct: 75 },
    { branded: 'Amoxicillin + Clavulanic Acid 625 (Augmentin)', brandedPrice: 210, generic: 'Amoxy-Clav Jan Aushadhi 625', genericPrice: 58, savePct: 72 },
    { branded: 'Pantoprazole 40 (Pantocid)', brandedPrice: 155, generic: 'Pantoprazole PMBJP 40', genericPrice: 28, savePct: 82 },
    { branded: 'Azithromycin 500 (Azee/Zithromax)', brandedPrice: 140, generic: 'Azithromycin Jan Aushadhi 500', genericPrice: 42, savePct: 70 },
    { branded: 'Atorvastatin 10 (Atorva)', brandedPrice: 110, generic: 'Atorvastatin PMBJP 10', genericPrice: 25, savePct: 77 },
    { branded: 'Metformin 500 (Glycomet)', brandedPrice: 45, generic: 'Metformin Jan Aushadhi 500', genericPrice: 12, savePct: 73 }
  ];

  const sdgs = [
    { num: 3, title: 'Good Health and Well-Being', desc: 'Eliminating waiting hall cross-infection vectors and enabling accessible medicines through generic affordability.', opacity: 1 },
    { num: 8, title: 'Decent Work & Economic Growth', desc: 'Empowering local community standalone pharmacies against centralized dark-store monopolies.', opacity: 0.9 },
    { num: 9, title: 'Industry, Innovation & Infrastructure', desc: 'Enterprise-grade real-time inventory synchronization for micro-retailers without costly hardware.', opacity: 1 },
    { num: 11, title: 'Sustainable Cities & Communities', desc: 'Dynamic transit pacing reduces vehicular idling and parking congestion near major hospitals.', opacity: 1 },
    { num: 12, title: 'Responsible Consumption & Production', desc: 'Batch-expiry tracking and smart alerts drastically curb expiry waste in medicine supply chains.', opacity: 0.85 }
  ];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1rem 3rem', fontFamily: 'var(--font-sans)' }}>
      {/* ── Official Project Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #09375e 0%, #0369a1 45%, #0284c7 100%)',
        borderRadius: '16px',
        color: '#ffffff',
        padding: '2rem 2.25rem',
        boxShadow: '0 12px 32px rgba(2, 132, 199, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '1.75rem'
      }}>
        {/* Glow circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#ffffff',
                color: '#0369a1',
                padding: '0.3rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.78rem',
                letterSpacing: '0.05em'
              }}>
                PROJECT CODE: SOCCA - 12
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.3rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.78rem'
              }}>
                SILVER OAK UNIVERSITY • NAAC A+
              </span>
              <span style={{
                background: 'rgba(212, 175, 55, 0.25)',
                color: '#fef08a',
                border: '1px solid rgba(254, 240, 138, 0.5)',
                padding: '0.3rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.78rem'
              }}>
                BCA (SOCCA)
              </span>
            </div>

            <h1 style={{
              fontSize: '2.1rem',
              fontWeight: 900,
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              MediQ – Smart OPD Queue &amp; Pharmacy Fulfilment System
            </h1>

            <p style={{
              fontSize: '1rem',
              color: '#e0f2fe',
              margin: 0,
              maxWidth: '820px',
              lineHeight: 1.5,
              fontWeight: 500
            }}>
              A decentralized, cloud-native healthcare ecosystem unifying hospital discovery, intelligent OPD queue scheduling and community pharmacy fulfilment (&ldquo;Zomato for OPDs + Blinkit for Medicines&rdquo;).
            </p>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            minWidth: '260px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              Project Team &amp; Mentor
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.4 }}>
              1. Yash Patadiya <span style={{ color: '#93c5fd', fontSize: '0.78rem' }}>(BCA SOCCA)</span><br />
              2. Riya Dhariwal <span style={{ color: '#93c5fd', fontSize: '0.78rem' }}>(BCA SOCCA)</span><br />
              3. Prajapati Riddhi <span style={{ color: '#93c5fd', fontSize: '0.78rem' }}>(BCA SOCCA)</span>
            </div>
            <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '0.82rem', fontWeight: 800, color: '#fef08a' }}>
              Project Mentor: prof. Yash Khatri
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'poster', label: '📊 Poster Summary & Purpose' },
            { id: 'methodology', label: '🔄 5-Step Methodology Flow' },
            { id: 'analytics', label: '📈 Field Data & Savings Analysis' },
            { id: 'architecture', label: '🏛️ Technical Architecture (3 Apps + 13 Functions)' },
            { id: 'innovations', label: '🚀 Poster Future Scope Realized (LIVE)' },
            { id: 'team', label: '🎓 Authors & Viva Defense Info' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
                color: activeTab === tab.id ? '#0369a1' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: POSTER SUMMARY & PURPOSE ── */}
      {activeTab === 'poster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metric Highlights Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {benchmarkMetrics.slice(0, 4).map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, margin: '2px 0' }}>
                      {m.mediq}
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669' }}>
                      {m.change} vs Traditional ({m.traditional})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3-Column Layout from Poster */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Purpose & Clinical Motivation */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: '#0284c7', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>1</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>Purpose</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Outpatient departments (OPDs) in India are overcrowded, causing long non-clinical waiting, infection risk and doctor burnout. In our field study of <strong>4 hospitals and 250 patient journeys</strong>, patients waited an average of <strong>140.4 minutes</strong> for a <strong>6.5-minute consultation</strong>, queued again at the pharmacy, and <strong>25.1% met an out-of-stock medicine</strong> at the first counter. MediQ aims to give patients one unbroken digital journey, from choosing a hospital to collecting medicines, using existing phones and tablets with zero new hardware.
              </p>
            </div>

            {/* Abstract */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: '#0d9488', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>2</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>Abstract</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                The &ldquo;MediQ&rdquo; platform is a decentralized, cloud-native healthcare ecosystem that unifies hospital discovery, intelligent OPD queue scheduling and community pharmacy fulfilment (&ldquo;Zomato for OPDs + Blinkit for Medicines&rdquo;). Patients discover hospitals, compare doctors and fees, and book a digital token with a live ETA. After consultation, the doctor issues an e-prescription and a micro-inventory engine ranks nearby pharmacies by stock, distance and price in <strong>84 ms</strong>. Trials show an <strong>84.1% reduction</strong> in waiting-room time and <strong>94.2% single-trip prescription fulfilment</strong>, with zero stock-concurrency faults.
              </p>
            </div>

            {/* Results & Discussion */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ background: '#16a34a', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>3</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>Results &amp; Discussion</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                MediQ was compared with the traditional OPD workflow. Waiting-room time fell from <strong>114.5 to 18.2 minutes (-84.1%)</strong>, dispensing latency from <strong>37.8 to 4.2 minutes (-88.9%)</strong> and no-shows from <strong>23.4% to 4.1%</strong>. First-visit prescription fulfilment rose from <strong>68.8% to 94.2%</strong>. The EWMA model cut queue prediction error from <strong>24.6 to 4.2 minutes (MAE, -82.9%)</strong>. Showing generic (Jan Aushadhi) alternatives saved patients <strong>70.9% on average (₹142 / Rx)</strong>. 500 concurrent stock deductions produced zero negative-stock faults.
              </p>
            </div>
          </div>

          {/* Guarantees Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { title: 'Privacy First', desc: 'No unnecessary personal data stored; ABHA / ABDM architecture', color: '#0284c7' },
              { title: 'Real-Time Sync', desc: 'Zero-wait queue with real-time transit and inventory audit loop', color: '#0d9488' },
              { title: 'ACID Transaction Safe', desc: 'Accurate stock and prescription sync with zero concurrency faults', color: '#7c3aed' },
              { title: 'Community Health Focus', desc: 'Affordable & accessible care with 70.9% generic savings', color: '#16a34a' }
            ].map((g, i) => (
              <div key={i} style={{
                background: `${g.color}0d`,
                border: `1.5px solid ${g.color}35`,
                borderRadius: '10px',
                padding: '1rem 1.25rem'
              }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 900, color: g.color, marginBottom: '0.3rem' }}>
                  {g.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {g.desc}
                </div>
              </div>
            ))}
          </div>

          {/* UN SDGs Grid */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              🌍 United Nations Sustainable Development Goals (SDGs) Covered
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
              {sdgs.map(s => (
                <div key={s.num} style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  background: 'var(--bg-inner)',
                  opacity: s.opacity
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      SDG {s.num}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.title}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: 5-STEP METHODOLOGY FLOW ── */}
      {activeTab === 'methodology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              MediQ 5-Step End-to-End Methodology
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Click any step to launch and test that exact module inside this live platform:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
              {methodologySteps.map(step => (
                <div 
                  key={step.num}
                  style={{
                    background: 'var(--bg-inner)',
                    border: `2px solid ${step.color}40`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: step.color,
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      marginBottom: '0.75rem'
                    }}>
                      {step.num}
                    </div>

                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 900, color: step.color }}>
                      {step.step}
                    </h4>

                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {step.items.map((it, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{it}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => onNavigateToRole && onNavigateToRole(step.roleKey)}
                    style={{
                      marginTop: '1.25rem',
                      background: step.color,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>Test Step {step.num}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sequence Description */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              How MediQ Eliminates The 3-Hour OPD Silo
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: '#0284c7' }}>Pre-Arrival (Discovery &amp; Transit):</strong> Instead of arriving 2 hours early to stand in token queues, the patient books from home, compares doctor fees, and receives an EWMA-calculated departure notification precisely accounting for travel time.
              </div>
              <div>
                <strong style={{ color: '#0d9488' }}>Clinical Consultation (Doctor Console):</strong> The doctor calls tokens with 1-click on mobile or tablet. In-consultation timer updates the pacing model in real time. Doctor issues an e-prescription linked to standard drug formulations.
              </div>
              <div>
                <strong style={{ color: '#16a34a' }}>Dispensary &amp; Fulfilment (84ms Match):</strong> The prescription is instantaneously matched against stock in 3+ nearby pharmacies. Patient selects pickup or express delivery with generic alternatives saving up to 75%.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ANALYTICS & FIELD DATA ── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Comparison Table */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem',
            overflowX: 'auto'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Field Validation: Traditional OPD vs. MediQ Platform
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Based on time-motion empirical study of 4 multi-tier hospitals ($N=250$ patient journeys):
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-inner)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 900, color: 'var(--text-primary)' }}>Metric</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#dc2626' }}>Traditional Workflow</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#059669' }}>MediQ Validated</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 900, color: 'var(--text-primary)' }}>Net Impact</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkMetrics.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.label}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#991b1b', fontWeight: 700 }}>{m.traditional}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#065f46', fontWeight: 900 }}>{m.mediq}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 900,
                        fontSize: '0.8rem'
                      }}>
                        {m.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Generic Savings Calculator */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={22} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                Generic (Jan Aushadhi) Savings Calculator: 70.9% Average Relief
              </h3>
            </div>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Real-world benchmark of top prescribed formulations in Indian OPDs:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {genericAlternatives.map((alt, i) => (
                <div key={i} style={{
                  background: 'var(--bg-inner)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {alt.branded}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Branded MRP: <strong style={{ color: '#dc2626' }}>₹{alt.brandedPrice}</strong></span>
                    <span>Jan Aushadhi: <strong style={{ color: '#16a34a' }}>₹{alt.genericPrice}</strong></span>
                  </div>
                  <div style={{
                    marginTop: '0.6rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    textAlign: 'center'
                  }}>
                    Save {alt.savePct}% (₹{alt.brandedPrice - alt.genericPrice} saved per strip)
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#a7f3d0' }}>
                  Average Prescription Savings Benchmark
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>
                  ₹142 Saved per Prescription Journey
                </div>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#d1fae5', maxWidth: '400px' }}>
                By substituting top 5 branded molecules with certified Jan Aushadhi alternatives, low- and middle-income families cut their recurring healthcare expenses by over 70%.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TECHNICAL ARCHITECTURE ── */}
      {activeTab === 'architecture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Architecture Specifications (from Poster &amp; Research Paper)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* App Layer */}
              <div style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0284c7' }}>
                  <Smartphone size={22} />
                  <strong style={{ fontSize: '1rem' }}>APP LAYER</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Patient Flutter App:</strong> Hospital discovery, token booking, symptoms input, live queue tracker.</li>
                  <li><strong>Doctor Console App:</strong> One-tap calling, timer, e-prescription composer.</li>
                  <li><strong>Pharmacy Portal App:</strong> Dark-store stock ledger, batch tracking, 1-click dispatch.</li>
                  <li><strong>Web Admin &amp; TV Console:</strong> React 19 + Vite 6 executive console + 10-ft TV display.</li>
                </ul>
              </div>

              {/* Intelligence Layer */}
              <div style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0d9488' }}>
                  <Cpu size={22} />
                  <strong style={{ fontSize: '1rem' }}>INTELLIGENCE LAYER</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>Dynamic EWMA Pacing:</strong> Adaptive moving average of consultation velocity (MAE 4.2 min vs 24.6 min static).</li>
                  <li><strong>Transit-Aware Leave-Now:</strong> Reverse ETA calculation combining Haversine travel time + buffer.</li>
                  <li><strong>Micro-Inventory Matcher:</strong> 84 ms ranking of nearby pharmacies by distance, price, and stock.</li>
                  <li><strong>Jan Aushadhi Substitution:</strong> Automatic salt-based generic alternative mapping.</li>
                </ul>
              </div>

              {/* Cloud & Safety */}
              <div style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#7c3aed' }}>
                  <Database size={22} />
                  <strong style={{ fontSize: '1rem' }}>CLOUD &amp; SAFETY</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li><strong>13 Cloud Functions v2:</strong> Node.js serverless execution in Mumbai (asia-south1).</li>
                  <li><strong>ACID Transaction Safety:</strong> Document-level mutex locking prevents overselling under 500+ concurrent deductions.</li>
                  <li><strong>Immutable Audit Ledger:</strong> Every stock movement and token transition logged with millisecond timestamps.</li>
                  <li><strong>Zero Hardware:</strong> Operates entirely on standard smartphones, tablets, and web browsers.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: POSTER FUTURE SCOPE REALIZED (LIVE & OPERATIONAL) ── */}
      {activeTab === 'innovations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '1.75rem',
            color: '#ffffff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🚀</span>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                Poster Future Scope: 100% Realized &amp; Live in MediQ
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
              The 5 enhancements listed under <em>&ldquo;Conclusion &amp; Future Scope&rdquo;</em> on the official Aavishkar poster have been engineered and deployed into operational surfaces. Judges and evaluators can interact with each module live:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* 1. ABDM / ABHA ID */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid #10b981' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                    POSTER ITEM 1 • OPERATIONAL
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>🪪</span>
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ABDM / ABHA ID Integration &amp; Health Locker
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  National Health Authority (NHA) compliant 14-digit ABHA card generator, verifiable QR code, DPDP Act 2023 granular consent manager, and encrypted personal health records (PHR) locker.
                </p>
              </div>

              <button
                onClick={() => onNavigateToRole && onNavigateToRole('abdm')}
                style={{
                  marginTop: '1.25rem',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Launch ABHA Card &amp; Health Locker</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 2. Handwritten Prescription OCR */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid #0284c7' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                    POSTER ITEM 2 • OPERATIONAL
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>📷</span>
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Handwritten Prescription OCR &amp; AI Vision
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Computer vision digitizer that scans physical clinic paper prescriptions, parses dosages (TDS, SOS, OD), and automatically matches with Jan Aushadhi generic substitutes saving 70.9% on average.
                </p>
              </div>

              <button
                onClick={() => onNavigateToRole && onNavigateToRole('ocr')}
                style={{
                  marginTop: '1.25rem',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Test Prescription OCR Scanner</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 3. Scheduled EV Rider Home Delivery for Insulin & Vaccines */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid #059669' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                    POSTER ITEM 3 • OPERATIONAL
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>🛵</span>
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Scheduled EV Rider Delivery &amp; Cold-Chain Care
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Certified EV rider fleet for temperature-controlled medicine transport (2–8°C for Insulin &amp; Vaccines) with patient time-slot selection (Express / Morning / Evening) and secret doorstep OTP handoff verification.
                </p>
              </div>

              <button
                onClick={() => onNavigateToRole && onNavigateToRole('fulfillment')}
                style={{
                  marginTop: '1.25rem',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Open Rider Delivery &amp; Dispatch Fleet</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 4. Hospital Analytics and SMS Dashboards */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid #ea580c' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', background: '#ffedd5', color: '#c2410c', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                    POSTER ITEM 4 • OPERATIONAL
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>📢</span>
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Hospital Analytics &amp; SMS/WhatsApp Gateway
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Automated transit &ldquo;Leave Now&rdquo; alerts, doctor emergency delay broadcasts (+15m), pharmacy counter pickup SMS, and DLT-compliant telecom notification logging with 1.1s latency.
                </p>
              </div>

              <button
                onClick={() => onNavigateToRole && onNavigateToRole('admin')}
                style={{
                  marginTop: '1.25rem',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>View SMS Gateway &amp; Analytics</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 5. Multi-City Pharmacy Network Scaling */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid #0891b2' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', background: '#cffafe', color: '#0e7490', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                    POSTER ITEM 5 • OPERATIONAL
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>📦</span>
                </div>
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  Micro-Dark Store Inventory &amp; Stock-In (F23)
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Full multi-store batch inventory ledger, 3-tap Stock-In batch form, buffer low-stock alerts, 30-day expiry guardian, and atomic Firestore transactions eliminating negative stock.
                </p>
              </div>

              <button
                onClick={() => onNavigateToRole && onNavigateToRole('pharmacy')}
                style={{
                  marginTop: '1.25rem',
                  background: '#0891b2',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Open Pharmacy Inventory Ledger</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 6: TEAM & VIVA DEFENSE ── */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Project Identification &amp; Viva Defense Profile
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Institutional Details</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                  Silver Oak University
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  Education to Innovation • NAAC A+ Accredited
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0284c7', fontWeight: 800 }}>
                  Affiliation: BCA (SOCCA)
                </div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Project Code: <strong>SOCCA - 12</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Authors</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  <strong>1. Yash Patadiya</strong> — BCA (SOCCA)<br />
                  <strong>2. Riya Dhariwal</strong> — BCA (SOCCA)<br />
                  <strong>3. Prajapati Riddhi</strong> — BCA (SOCCA)
                </div>
                <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: '#059669', fontWeight: 800 }}>
                  Project Mentor: prof. Yash Khatri
                </div>
              </div>
            </div>

            {/* Top Viva Defense Quick Questions */}
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Top Evaluator Questions &amp; Validated Answers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  q: 'Q1: What is the core innovation of MediQ compared to Practo or Tata 1mg?',
                  a: 'Practo is limited to static appointment slots with no live queue velocity and no pharmacy link. Tata 1mg relies on 24-48h central warehouses. MediQ bridges both: it paces OPD queues dynamically with EWMA transit alerts, and uses community pharmacies as instant micro-fulfillment dark-stores in 84 ms.'
                },
                {
                  q: 'Q2: How does the EWMA model perform vs static time estimates?',
                  a: 'Static scheduling assumes a constant consult time (e.g., 10 min), resulting in a 24.6 min Mean Absolute Error (MAE). MediQ uses EWMA with α=0.75, slashing the prediction error to 4.2 minutes (-82.9% error reduction).'
                },
                {
                  q: 'Q3: How are negative-stock race conditions prevented?',
                  a: 'MediQ executes stock reservations inside Firestore ACID transactions. When two users checkout the last unit of a drug concurrently, transaction locks ensure only the first succeeds, while the second is safely re-routed.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0369a1', marginBottom: '0.3rem' }}>
                    {item.q}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
