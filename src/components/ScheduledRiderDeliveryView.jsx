import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Clock, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Key, 
  Sparkles, 
  Package, 
  Thermometer, 
  Navigation, 
  ChevronRight, 
  Star, 
  AlertCircle, 
  ArrowRight, 
  Zap, 
  Check,
  Building2,
  User,
  ShoppingBag,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Delivery Time Slots configuration
const DELIVERY_SLOTS = [
  {
    id: 'express',
    tag: '⚡ EXPRESS NOW',
    title: 'Instant 15–20 Mins',
    timeRange: 'Arriving in ~18 mins',
    desc: 'Nearest dark-store rider immediately dispatched',
    badgeColor: '#059669',
    badgeBg: '#dcfce7',
    fee: 29,
    recommended: true
  },
  {
    id: 'morning',
    tag: '🌅 MORNING SLOT',
    title: '08:00 AM – 10:00 AM',
    timeRange: 'Tomorrow morning doorstep delivery',
    desc: 'Ideal for empty-stomach & morning routine medicines',
    badgeColor: '#0284c7',
    badgeBg: '#e0f2fe',
    fee: 15,
    recommended: false
  },
  {
    id: 'midday',
    tag: '☀️ MIDDAY SLOT',
    title: '12:00 PM – 02:00 PM',
    timeRange: 'Lunchtime scheduled delivery',
    desc: 'Delivered to home or office desk before post-lunch doses',
    badgeColor: '#d97706',
    badgeBg: '#fef3c7',
    fee: 15,
    recommended: false
  },
  {
    id: 'evening',
    tag: '🌆 EVENING SLOT',
    title: '05:00 PM – 07:00 PM',
    timeRange: 'Post-work / dinner schedule',
    desc: 'Most popular slot for working professionals',
    badgeColor: '#7c3aed',
    badgeBg: '#ede9fe',
    fee: 15,
    recommended: false
  },
  {
    id: 'night',
    tag: '🌙 NIGHT URGENT',
    title: '09:00 PM – 11:00 PM',
    timeRange: 'Late-night home dispatch',
    desc: 'Temperature-controlled SOS night run with security handoff',
    badgeColor: '#e11d48',
    badgeBg: '#ffe4e6',
    fee: 35,
    recommended: false
  }
];

// Active Fleet Riders
const FLEET_RIDERS = [
  {
    id: 'rider-vikram',
    name: 'Vikram Rathore',
    avatar: '🛵',
    rating: 4.96,
    trips: 2840,
    vehicle: 'Ather 450X EV (GJ-01-ET-9182)',
    status: 'On Delivery',
    bagTemp: 4.5,
    phone: '+91 98251 04921',
    zone: 'Sola / Science City / Gota',
    battery: '88% EV Charge',
    vaccineCertified: true
  },
  {
    id: 'rider-rahul',
    name: 'Rahul M. Sharma',
    avatar: '⚡',
    rating: 4.88,
    trips: 1920,
    vehicle: 'Ola S1 Pro (GJ-01-KM-3312)',
    status: 'At Dark-Store Hub',
    bagTemp: 4.2,
    phone: '+91 98791 22819',
    zone: 'Navrangpura / Satellite',
    battery: '94% EV Charge',
    vaccineCertified: true
  },
  {
    id: 'rider-amit',
    name: 'Amit K. Patel',
    avatar: '🛵',
    rating: 4.92,
    trips: 3410,
    vehicle: 'TVS iQube (GJ-01-PA-7741)',
    status: 'En Route to Hub',
    bagTemp: 5.0,
    phone: '+91 98980 44920',
    zone: 'Bodakdev / SG Highway',
    battery: '72% EV Charge',
    vaccineCertified: true
  },
  {
    id: 'rider-deepak',
    name: 'Deepak Parmar',
    avatar: '📦',
    rating: 4.85,
    trips: 1450,
    vehicle: 'Hero Vida V1 (GJ-01-DP-1904)',
    status: 'Reserved for 5 PM Slot',
    bagTemp: 4.8,
    phone: '+91 97240 55109',
    zone: 'Chandkheda / Motera',
    battery: '99% EV Charge',
    vaccineCertified: true
  }
];

export default function ScheduledRiderDeliveryView({ onBackToDirectory, defaultTab = 'patient_order' }) {
  const { currentUser } = useAuth();

  // Active top-level subview: 'patient_order' | 'pharmacist_dispatch' | 'rider_terminal'
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Order Configuration State
  const [selectedDay, setSelectedDay] = useState('today'); // 'today' | 'tomorrow' | 'day_after'
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);
  const [useGenericSaving, setUseGenericSaving] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('B-402, Shivalik Residency, Near Sola Bridge, Ahmedabad');
  const [deliveryInstruction, setDeliveryInstruction] = useState('call_before');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Fulfillment State Machine: 'configuring' -> 'assigned' -> 'out_for_delivery' -> 'delivered'
  const [orderState, setOrderState] = useState('configuring');
  const [assignedRider, setAssignedRider] = useState(FLEET_RIDERS[0]);
  const [doorstepOtp, setDoorstepOtp] = useState('7391');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [orderId, setOrderId] = useState('MEDIQ-SLOT-8821');

  // Live GPS simulation values
  const [liveDistanceKm, setLiveDistanceKm] = useState(1.4);
  const [liveEtaMins, setLiveEtaMins] = useState(14);
  const [riderSpeedKmh, setRiderSpeedKmh] = useState(36);
  const [currentRoad, setCurrentRoad] = useState('Crossing Sola Overbridge towards Science City Road');

  // Prescribed items
  const prescribedMedicines = [
    { name: 'Augmentin 625mg (Amoxy-Clav)', brandPrice: 220, genericPrice: 65, qty: 1, form: '10 Tablets Strip' },
    { name: 'Dolo 650mg (Paracetamol IP)', brandPrice: 35, genericPrice: 11, qty: 1, form: '15 Tablets Strip' },
    { name: 'Pan-D (Pantoprazole + Domperidone)', brandPrice: 145, genericPrice: 38, qty: 1, form: '10 Capsules Strip' },
    { name: 'Cetirizine 10mg (Anti-Allergy)', brandPrice: 40, genericPrice: 9, qty: 1, form: '10 Tablets Strip' }
  ];

  const brandSubtotal = prescribedMedicines.reduce((acc, m) => acc + m.brandPrice, 0);
  const genericSubtotal = prescribedMedicines.reduce((acc, m) => acc + m.genericPrice, 0);
  const savings = brandSubtotal - genericSubtotal;
  const activeMedsCost = useGenericSaving ? genericSubtotal : brandSubtotal;
  const grandTotal = activeMedsCost + selectedSlot.fee;

  // Countdown timer when out for delivery
  useEffect(() => {
    let interval;
    if (orderState === 'out_for_delivery') {
      interval = setInterval(() => {
        setLiveEtaMins(prev => {
          if (prev <= 1) {
            setLiveDistanceKm(0.1);
            setCurrentRoad('Arrived at gate! Ringing doorbell.');
            return 1;
          }
          setLiveDistanceKm(d => +(Math.max(0.1, d - 0.1)).toFixed(1));
          setRiderSpeedKmh(s => Math.floor(32 + Math.random() * 8));
          return prev - 1;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [orderState]);

  // Handle Order Placement
  const handleConfirmOrder = () => {
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const randomId = 'MEDIQ-SLOT-' + Math.floor(1000 + Math.random() * 9000);
    setDoorstepOtp(randomOtp);
    setOrderId(randomId);
    setOrderState('assigned');
    setLiveEtaMins(selectedSlot.id === 'express' ? 14 : 35);
    setLiveDistanceKm(1.6);
  };

  // Handle Rider Dispatch
  const handleDispatchRider = () => {
    setOrderState('out_for_delivery');
  };

  // Handle OTP verification in Rider Terminal
  const handleVerifyOtp = () => {
    if (enteredOtp === doorstepOtp || enteredOtp === '1234') {
      setOrderState('delivered');
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '1.5rem 1rem 4rem',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)'
    }}>

      {/* ── Pinterest Aesthetic Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 165, 233, 0.08) 50%, rgba(245, 158, 11, 0.08) 100%)',
        borderRadius: '24px',
        padding: '2rem 1.75rem',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0,0,0,0.1)',
        marginBottom: '1.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative soft blurs */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.35rem 0.85rem', borderRadius: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '0.75rem', border: '1px solid var(--border-subtle)' }}>
              <Bike size={16} color="#059669" />
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#059669', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                HYPERLOCAL RIDER FLEET &bull; SCHEDULED HOME DELIVERY
              </span>
            </div>

            <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '0 0 0.4rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Smart Scheduled Medicine Delivery
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, maxWidth: '620px', lineHeight: 1.5 }}>
              Choose your exact time slot for home delivery. Certified EV delivery partners transport your medicines in temperature-controlled bags with secret doorstep OTP handoff.
            </p>
          </div>

          {/* Quick Fleet Highlights Pills */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '0.55rem 0.95rem', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>ACTIVE EV RIDERS</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>4 On Duty</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '0.55rem 0.95rem', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>AVG EXPRESS ETA</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>14 Mins</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '0.55rem 0.95rem', borderRadius: '14px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>COLD-CHAIN BAG</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#d97706' }}>2°C – 8°C</div>
            </div>
          </div>
        </div>

        {/* ── Pinterest-Style View Switcher Tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid rgba(226, 232, 240, 0.7)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('patient_order')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              border: activeTab === 'patient_order' ? '2px solid #059669' : '1px solid #e2e8f0',
              background: activeTab === 'patient_order' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              color: activeTab === 'patient_order' ? '#059669' : 'var(--text-muted)',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'patient_order' ? '0 4px 14px rgba(5, 150, 105, 0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <ShoppingBag size={16} />
            <span>1. Patient Order &amp; Scheduled Slots</span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacist_dispatch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              border: activeTab === 'pharmacist_dispatch' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              background: activeTab === 'pharmacist_dispatch' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              color: activeTab === 'pharmacist_dispatch' ? '#0284c7' : 'var(--text-muted)',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'pharmacist_dispatch' ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Building2 size={16} />
            <span>2. Pharmacy Fleet Dispatch Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('rider_terminal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              borderRadius: '12px',
              border: activeTab === 'rider_terminal' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
              background: activeTab === 'rider_terminal' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              color: activeTab === 'rider_terminal' ? '#7c3aed' : 'var(--text-muted)',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'rider_terminal' ? '0 4px 14px rgba(124, 58, 237, 0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Bike size={16} />
            <span>3. Rider Mobile App Screen (Simulated)</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: PATIENT SCHEDULED ORDER & LIVE TRACKING                 */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'patient_order' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
          
          {/* Left Column: Slot Selector & Details (7 cols) */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Bento Card A: Select Delivery Day */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: '1.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#059669" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    Step 1 &bull; Choose Preferred Day
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>
                  ✔ 7 Days a week delivery
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[
                  { id: 'today', label: 'Today', date: 'Thursday, 22 Oct', badge: 'Fastest Dispatch' },
                  { id: 'tomorrow', label: 'Tomorrow', date: 'Friday, 23 Oct', badge: 'Scheduled' },
                  { id: 'day_after', label: 'Saturday', date: '24 Oct', badge: 'Weekend Refill' }
                ].map(d => {
                  const active = selectedDay === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDay(d.id)}
                      style={{
                        padding: '0.9rem 0.75rem',
                        borderRadius: '14px',
                        border: active ? '2px solid #059669' : '1.5px solid var(--border-subtle)',
                        background: active ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-inner)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: active ? '#059669' : 'var(--text-primary)' }}>
                          {d.label}
                        </span>
                        {active && <CheckCircle2 size={16} color="#059669" />}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
                        {d.date}
                      </div>
                      <span style={{ display: 'inline-block', marginTop: '0.45rem', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', background: active ? '#059669' : '#e2e8f0', color: active ? '#ffffff' : '#64748b' }}>
                        {d.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bento Card B: Pinterest Interactive Time Slots */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: '1.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="#0284c7" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    Step 2 &bull; Select Delivery Time Slot
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Guaranteed ±5 min window
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {DELIVERY_SLOTS.map(slot => {
                  const isSelected = selectedSlot.id === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '16px',
                        border: isSelected ? `2px solid ${slot.badgeColor}` : '1.5px solid var(--border-subtle)',
                        background: isSelected ? slot.badgeBg : 'var(--bg-inner)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        transition: 'all 0.18s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? `6px solid ${slot.badgeColor}` : '2px solid #94a3b8',
                          background: '#ffffff',
                          flexShrink: 0
                        }} />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>{slot.title}</strong>
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: '4px', background: slot.badgeColor, color: '#ffffff' }}>
                              {slot.tag}
                            </span>
                            {slot.recommended && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#fef08a', color: '#854d0e' }}>
                                ⭐ POPULAR
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {slot.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: slot.badgeColor }}>
                          ₹{slot.fee} delivery
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Rider Assigned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bento Card C: Delivery Address & Instructions */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: '1.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} color="#e11d48" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    Step 3 &bull; Home Drop Location &amp; Instructions
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {isEditingAddress ? 'Save Address' : 'Edit Address'}
                </button>
              </div>

              {isEditingAddress ? (
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid #0284c7',
                    background: 'var(--bg-inner)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    outline: 'none',
                    marginBottom: '1rem'
                  }}
                />
              ) : (
                <div style={{ background: 'var(--bg-inner)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    📍 {deliveryAddress}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Home Landmark: Near CIMS Hospital Road &bull; Ahmedabad 380060
                  </div>
                </div>
              )}

              {/* Rider Special Instruction Chips */}
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Special Rider Instructions:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'call_before', label: '📞 Call Before Arriving', icon: Phone },
                  { id: 'no_bell', label: '🔕 Don\'t Ring Bell (Sleeping Baby)', icon: AlertCircle },
                  { id: 'security', label: '🏢 Leave with Society Gate Security', icon: Building2 },
                  { id: 'contactless', label: '😷 Contactless Doorstep Drop', icon: ShieldCheck }
                ].map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => setDeliveryInstruction(inst.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: deliveryInstruction === inst.id ? '2px solid #059669' : '1px solid var(--border-subtle)',
                      background: deliveryInstruction === inst.id ? '#dcfce7' : 'var(--bg-inner)',
                      color: deliveryInstruction === inst.id ? '#065f46' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {inst.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary, Savings & Rider Tracking (5 cols) */}
          <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Bento Card D: Doctor's Prescription & Jan Aushadhi Savings */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: '1.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase' }}>
                  Doctor's e-Prescription (Dr. Rajesh Mehta)
                </span>
                <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                  Verified OPD Rx
                </span>
              </div>

              {/* Medicines List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {prescribedMedicines.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-inner)', padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.form} &bull; Qty: {m.qty}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: useGenericSaving ? '#059669' : 'var(--text-primary)' }}>
                        ₹{useGenericSaving ? m.genericPrice : m.brandPrice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generic Jan Aushadhi Savings Toggle Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.08) 0%, rgba(2, 44, 34, 0.04) 100%)',
                border: '1.5px dashed #059669',
                borderRadius: '14px',
                padding: '0.9rem 1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="#059669" />
                    <strong style={{ fontSize: '0.85rem', color: '#065f46' }}>Jan Aushadhi Generic Switch</strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#059669', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: 900 }}>
                    SAVE ₹{savings} (70.9%)
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 0.6rem', lineHeight: 1.4 }}>
                  Swap expensive branded pharma salts with Pradhan Mantri Jan Aushadhi Kendra bio-equivalents.
                </p>
                <button
                  onClick={() => setUseGenericSaving(!useGenericSaving)}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: useGenericSaving ? '#059669' : '#334155',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {useGenericSaving ? '✓ Generic Savings Applied (₹' + genericSubtotal + ')' : 'Switch to Branded (₹' + brandSubtotal + ')'}
                </button>
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Medicines Subtotal:</span>
                  <span>₹{activeMedsCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Scheduled Delivery ({selectedSlot.title}):</span>
                  <span>₹{selectedSlot.fee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-subtle)' }}>
                  <span>To Pay:</span>
                  <span style={{ color: '#059669' }}>₹{grandTotal}</span>
                </div>
              </div>

              {/* Order State Action Button */}
              {orderState === 'configuring' && (
                <button
                  onClick={handleConfirmOrder}
                  style={{
                    width: '100%',
                    marginTop: '1.25rem',
                    background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.9rem',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Bike size={18} />
                  <span>Confirm Slot &amp; Assign Rider (₹{grandTotal})</span>
                </button>
              )}
            </div>

            {/* Bento Card E: LIVE RIDER TRACKING & SECRET OTP (Once Order Placed) */}
            {orderState !== 'configuring' && (
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: '20px',
                padding: '1.5rem',
                border: '2px solid #059669',
                boxShadow: '0 12px 35px rgba(5, 150, 105, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                    <strong style={{ fontSize: '0.88rem', color: '#059669', textTransform: 'uppercase' }}>
                      Live Rider Status: {orderState === 'assigned' ? 'Rider Assigned' : orderState === 'out_for_delivery' ? 'Out for Delivery' : 'Delivered'}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#065f46', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                    {orderId}
                  </span>
                </div>

                {/* Secret Doorstep OTP Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '14px',
                  padding: '1rem',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    SECRET DOORSTEP DELIVERY OTP
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '0.2em', color: '#38bdf8', margin: '0.2rem 0' }}>
                    {doorstepOtp}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>
                    🔒 Share this 4-digit code with the rider only after receiving sealed medicine package.
                  </div>
                </div>

                {/* Assigned Rider Profile Card */}
                <div style={{ background: 'var(--bg-inner)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                      {assignedRider.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{assignedRider.name}</strong>
                        <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                          ⭐ {assignedRider.rating}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {assignedRider.vehicle}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                        ❄️ Cold-Bag Sensor: {assignedRider.bagTemp}°C &bull; {assignedRider.trips}+ Safe Trips
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <a
                      href={`tel:${assignedRider.phone}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#0284c7',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={14} />
                      <span>Call Rider</span>
                    </a>
                    <button
                      onClick={() => alert(`WhatsApp notifications active for Order ${orderId}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#059669',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp Alert</span>
                    </button>
                  </div>
                </div>

                {/* Animated Route & GPS Simulation */}
                <div style={{ background: '#090d16', padding: '1rem', borderRadius: '14px', color: '#ffffff', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>LIVE GPS TELEMETRY</span>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>● {riderSpeedKmh} km/h (EV Speed)</span>
                  </div>

                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>
                    {orderState === 'delivered' ? '0 Mins (Delivered)' : `ETA: ~${liveEtaMins} Minutes (${liveDistanceKm} km)`}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                    📍 {currentRoad}
                  </div>

                  {/* Visual Route SVG Track */}
                  <div style={{ marginTop: '0.75rem', position: 'relative', height: '24px', background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: orderState === 'delivered' ? '100%' : orderState === 'out_for_delivery' ? '70%' : '25%',
                      background: 'linear-gradient(90deg, #059669 0%, #38bdf8 100%)',
                      borderRadius: '12px',
                      transition: 'width 1s ease'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: orderState === 'delivered' ? '92%' : orderState === 'out_for_delivery' ? '65%' : '20%',
                      fontSize: '1rem',
                      transition: 'left 1s ease'
                    }}>
                      🛵
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                    <span>CityCare Dark-Store</span>
                    <span>Patient Doorstep</span>
                  </div>
                </div>

                {/* Quick Simulation controls */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {orderState === 'assigned' && (
                    <button
                      onClick={handleDispatchRider}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      Simulate: Rider Out for Delivery 🛵
                    </button>
                  )}
                  {orderState === 'out_for_delivery' && (
                    <button
                      onClick={() => setOrderState('delivered')}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      Simulate: Doorstep Delivered ✓
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: PHARMACIST & DARK-STORE FLEET DISPATCH HUB              */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pharmacist_dispatch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Fleet Overview Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ON-DUTY EV RIDERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>4 Active</div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>100% Green EV Fleet</div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SCHEDULED DISPATCHES TODAY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284c7', marginTop: '0.2rem' }}>38 Orders</div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>98.4% On-Time Delivery</div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>AVG DOORSTEP TRANSIT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '0.2rem' }}>13.8 Mins</div>
              <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>±3 min variance limit</div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>COLD-CHAIN INTEGRITY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7c3aed', marginTop: '0.2rem' }}>100%</div>
              <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>Zero temperature breach</div>
            </div>
          </div>

          {/* Active Fleet Table */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                  Hyperlocal Rider Fleet Live Roster
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Assigned riders for CityCare Central Hospital &amp; Jan Aushadhi Hub dark-stores.
                </p>
              </div>

              <button
                onClick={() => alert('New EV rider added to dispatch pool.')}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                + Register New Delivery Partner
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {FLEET_RIDERS.map(rider => (
                <div
                  key={rider.id}
                  style={{
                    background: 'var(--bg-inner)',
                    borderRadius: '14px',
                    padding: '1rem 1.25rem',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                      {rider.avatar}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{rider.name}</strong>
                        <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                          ⭐ {rider.rating}
                        </span>
                        <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#065f46', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                          {rider.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        🛵 {rider.vehicle} &bull; {rider.zone} &bull; {rider.battery}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>BAG TEMPERATURE</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: '#059669' }}>
                        ❄️ {rider.bagTemp}°C
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAssignedRider(rider);
                        alert(`Assigned order to ${rider.name}`);
                      }}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 0.95rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Assign Slot Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* VIEW 3: RIDER MOBILE APP SCREEN (SIMULATED TERMINAL)             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rider_terminal' && (
        <div style={{ maxWidth: '420px', margin: '0 auto' }}>
          
          {/* Phone Shell */}
          <div style={{
            background: '#090d16',
            borderRadius: '36px',
            padding: '1.25rem',
            border: '6px solid #1e293b',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            color: '#f8fafc'
          }}>
            {/* Phone Top Notch */}
            <div style={{ width: '120px', height: '16px', background: '#1e293b', borderRadius: '8px', margin: '0 auto 1.25rem' }} />

            {/* Rider Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900 }}>● ONLINE &amp; ACCEPTING RUNS</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                  {assignedRider.name}
                </div>
              </div>
              <div style={{ background: '#1e293b', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                ⭐ {assignedRider.rating}
              </div>
            </div>

            {/* Current Active Trip Card */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '1rem', border: '1px solid #334155', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', background: '#059669', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 900 }}>
                  ACTIVE SCHEDULED RUN
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {orderId}
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', margin: '0.2rem 0' }}>
                Deliver to: Ravi Kumar Patel
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                📍 {deliveryAddress}
              </div>

              <div style={{ marginTop: '0.75rem', background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.76rem', color: '#38bdf8' }}>
                📢 <strong>Note:</strong> {deliveryInstruction === 'no_bell' ? 'Sleeping baby! Don\'t ring bell.' : deliveryInstruction === 'call_before' ? 'Call on gate before entering.' : 'Contactless handoff.'}
              </div>
            </div>

            {/* Step: Doorstep OTP Handoff Form */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '1.15rem', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                <Key size={16} />
                <span>ENTER CUSTOMER OTP TO UNLOCK</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 0.85rem' }}>
                Ask patient for their 4-digit code (sent via SMS / MediQ App):
              </p>

              <input
                type="text"
                maxLength={4}
                placeholder="••••"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                style={{
                  width: '180px',
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  letterSpacing: '0.4em',
                  fontWeight: 900,
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: otpError ? '2px solid #ef4444' : '2px solid #38bdf8',
                  background: '#0f172a',
                  color: '#ffffff',
                  outline: 'none',
                  marginBottom: '0.75rem'
                }}
              />

              {otpError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Incorrect OTP. Please ask patient for 4-digit code.
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Verify OTP &amp; Complete Handoff ✓
              </button>

              <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: '#64748b' }}>
                Tip: Patient's generated OTP is <strong>{doorstepOtp}</strong> (or type 1234)
              </div>
            </div>

            {orderState === 'delivered' && (
              <div style={{ marginTop: '1rem', background: '#064e3b', border: '1px solid #10b981', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
                <CheckCircle2 size={24} color="#34d399" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '0.9rem' }}>
                  Delivery Successfully Completed!
                </div>
                <div style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>
                  Tamper-proof seal verified &amp; invoice cleared.
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
