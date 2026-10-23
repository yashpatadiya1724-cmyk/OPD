import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Plane, 
  Bike, 
  Store, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  Thermometer, 
  Battery, 
  Radio, 
  Sparkles, 
  Percent, 
  CreditCard, 
  FileText,
  AlertTriangle
} from 'lucide-react';

const PARTNER_PHARMACIES = [
  {
    id: 'pharm-janaushadhi',
    name: 'Pradhan Mantri Jan Aushadhi Kendra',
    type: 'Govt. Generic Medicine Dark-Store',
    distanceKm: 0.8,
    etaMins: 7,
    rating: 4.9,
    savingsBadge: '70.9% CHEAPER (JAN AUSHADHI)',
    address: 'Shop 12, Jan Kalyan Complex, Ring Road',
    isRiderEnabled: true,
    inStock: true
  },
  {
    id: 'pharm-hospital',
    name: 'CityCare Central Dark-Store Pharmacy',
    type: 'In-House Rapid Micro-Fulfillment',
    distanceKm: 0.1,
    etaMins: 4,
    rating: 4.8,
    savingsBadge: 'FASTEST (ON-SITE DISPENSE)',
    address: 'Ground Floor, CityCare Atrium',
    isRiderEnabled: true,
    inStock: true
  },
  {
    id: 'pharm-apollo',
    name: 'Apollo Pharmacy 24x7 Dark Store',
    type: 'Hyperlocal Retail Partner',
    distanceKm: 1.4,
    etaMins: 10,
    rating: 4.7,
    savingsBadge: '24x7 ALL-NIGHT DISPATCH',
    address: 'Opp. Silver Oak University Gate 2',
    isRiderEnabled: true,
    inStock: true
  },
  {
    id: 'pharm-medplus',
    name: 'MedPlus Pharmacy & Wellness',
    type: 'Hyperlocal Retail Partner',
    distanceKm: 2.1,
    etaMins: 14,
    rating: 4.6,
    savingsBadge: 'VERIFIED STOCK BATCH',
    address: 'Near S.G. Highway Crossing',
    isRiderEnabled: true,
    inStock: true
  }
];

export default function BlinkitFulfillmentModal({ 
  isOpen, 
  onClose, 
  initialMedicines = ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Pantoprazole 40mg'], 
  initialMode = 'darkstore',
  doctorName = 'Dr. Rajesh Mehta',
  patientName = 'Ravi Kumar Patel'
}) {
  const [selectedPharmacy, setSelectedPharmacy] = useState(PARTNER_PHARMACIES[0]);
  const [deliveryMode, setDeliveryMode] = useState(initialMode === 'drone' || !initialMode ? 'express_rider' : initialMode); // 'express_rider' | 'scheduled_rider' | 'darkstore' | 'pickup'
  const [selectedSlot, setSelectedSlot] = useState('express'); // 'express' | 'morning' | 'midday' | 'evening'
  const [useGeneric, setUseGeneric] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('B-402, Shivalik Residency, Near Sola Bridge, Ahmedabad');
  const [doorstepOtp] = useState('7391');
  
  // Fulfillment State Machine: 'configuring' -> 'committing_acid' -> 'live_tracking' -> 'delivered'
  const [orderStage, setOrderStage] = useState('configuring');
  const [acidTxnHash, setAcidTxnHash] = useState('');
  const [flightTimeSeconds, setFlightTimeSeconds] = useState(0);

  // EV Rider telemetry live simulation state
  const [riderTelemetry, setRiderTelemetry] = useState({
    riderName: 'Vikram Rathore',
    vehicle: 'Ather 450X EV (GJ-01-ET-9182)',
    speed: 34, // km/h
    temperature: 4.4, // celsius for cold-chain insulin/vaccines
    battery: 88, // % EV battery
    gpsLat: '23.0782° N',
    gpsLng: '72.5294° E',
    distanceKm: 1.1,
    etaRemainingMins: 8
  });

  // Calculate pricing
  const medicineCount = Math.max(1, initialMedicines.length);
  const baseBrandPrice = medicineCount * 85;
  const genericPrice = medicineCount * 25;
  const activeSubtotal = useGeneric ? genericPrice : baseBrandPrice;
  const deliveryFee = deliveryMode === 'pickup' ? 0 : deliveryMode === 'scheduled_rider' ? 15 : 25;
  const totalAmount = activeSubtotal + deliveryFee;

  // Handle ACID Order Placement
  const handlePlaceOrder = () => {
    setOrderStage('committing_acid');
    
    // Simulate Firestore atomic runTransaction commit
    setTimeout(() => {
      const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
      setAcidTxnHash(`ACID-TXN-${randomHex}-STK-LOCKED`);
      setOrderStage('live_tracking');
    }, 1200);
  };

  // Live rider tracking interval simulation
  useEffect(() => {
    let timer;
    if (orderStage === 'live_tracking') {
      timer = setInterval(() => {
        setFlightTimeSeconds(prev => {
          const next = prev + 1;
          setRiderTelemetry(t => ({
            ...t,
            speed: Math.round(32 + Math.cos(next) * 5),
            temperature: +(4.4 + (Math.sin(next) * 0.1)).toFixed(1),
            battery: Math.max(20, 88 - Math.floor(next / 15)),
            gpsLat: `23.${(782 + next * 2).toString().padStart(4, '0')}° N`,
            gpsLng: `72.${(5294 + next).toString().padStart(4, '0')}° E`,
            distanceKm: Math.max(0.1, +(1.1 - next * 0.04).toFixed(1)),
            etaRemainingMins: Math.max(1, 8 - Math.floor(next / 12))
          }));
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [orderStage]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '1.25rem',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        color: '#f8fafc',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                  MODULE B &bull; BLINKIT MICRO-FULFILLMENT
                </span>
                <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                  ACID CONCURRENCY VERIFIED
                </span>
              </div>
              <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>
                Instant Pharmacy Fulfillment &amp; Scheduled EV Rider Dispatch
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          
          {/* STEP 1: CONFIGURATION VIEW */}
          {orderStage === 'configuring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Prescribed Items Banner */}
              <div style={{ background: '#1e293b', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Doctor's Verified Prescription ({doctorName})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Pt: {patientName}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {initialMedicines.map((m, idx) => (
                    <span key={idx} style={{ background: '#0f172a', color: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, border: '1px solid #334155' }}>
                      💊 {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Delivery Mode Switcher */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>
                  Select Fulfillment Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  
                  {/* Option A: Scheduled Dark Store Rider (RECOMMENDED) */}
                  <div
                    onClick={() => setDeliveryMode('scheduled_rider')}
                    style={{
                      background: (deliveryMode === 'scheduled_rider' || deliveryMode === 'darkstore') ? 'rgba(5, 150, 105, 0.25)' : '#1e293b',
                      border: (deliveryMode === 'scheduled_rider' || deliveryMode === 'darkstore') ? '2px solid #34d399' : '1px solid #334155',
                      padding: '1.15rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <Bike size={24} color="#34d399" />
                      <span style={{ fontSize: '0.7rem', background: '#059669', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                        RECOMMENDED &bull; SLOTS
                      </span>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: '#ffffff' }}>
                      🛵 Scheduled Rider Home Delivery
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Delivered by assigned EV rider on your preferred time slot with secret doorstep OTP handoff.
                    </div>
                    <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#34d399' }}>
                      ETA: Choose your slot &bull; ₹15 rider fee
                    </div>
                  </div>

                  {/* Option B: Express 15-Min EV Rider */}
                  <div
                    onClick={() => setDeliveryMode('express_rider')}
                    style={{
                      background: deliveryMode === 'express_rider' ? 'rgba(2, 132, 199, 0.2)' : '#1e293b',
                      border: deliveryMode === 'express_rider' ? '2px solid #38bdf8' : '1px solid #334155',
                      padding: '1.15rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <Zap size={24} color="#38bdf8" />
                      <span style={{ fontSize: '0.7rem', background: '#0284c7', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                        ⚡ 15-MIN EXPRESS
                      </span>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: '#ffffff' }}>
                      ⚡ Instant Express EV Rider
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Immediate dispatch from nearest dark-store with insulated cold-bag (2–8°C for Insulin).
                    </div>
                    <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
                      ETA: ~12–15 mins &bull; ₹25 express fee
                    </div>
                  </div>

                  {/* Option C: Hospital Counter Pickup */}
                  <div
                    onClick={() => setDeliveryMode('pickup')}
                    style={{
                      background: deliveryMode === 'pickup' ? 'rgba(217, 119, 6, 0.2)' : '#1e293b',
                      border: deliveryMode === 'pickup' ? '2px solid #fbbf24' : '1px solid #334155',
                      padding: '1.15rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <Store size={24} color="#fbbf24" />
                      <span style={{ fontSize: '0.7rem', background: '#d97706', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                        ON-SITE
                      </span>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: '#ffffff' }}>
                      🏃 Hospital Counter Pickup
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Pre-packed at Ground Floor Atrium Counter 1. Zero wait time upon exiting OPD room.
                    </div>
                    <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>
                      ETA: ~3 mins &bull; Free Pickup
                    </div>
                  </div>

                </div>
              </div>

              {/* Time Slot Picker (When in Rider Mode) */}
              {deliveryMode === 'darkstore' && (
                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase' }}>
                      ⏰ Choose Home Delivery Time Slot
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Guaranteed on-time drop
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {[
                      { id: 'express', label: '⚡ Express', time: '15–20 Mins' },
                      { id: 'morning', label: '🌅 Morning', time: '8:00–10:00 AM' },
                      { id: 'midday', label: '☀️ Midday', time: '12:00–2:00 PM' },
                      { id: 'evening', label: '🌆 Evening', time: '5:00–7:00 PM' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSlot(s.id)}
                        style={{
                          padding: '0.55rem',
                          borderRadius: '8px',
                          border: selectedSlot === s.id ? '2px solid #34d399' : '1px solid #475569',
                          background: selectedSlot === s.id ? 'rgba(5, 150, 105, 0.25)' : '#0f172a',
                          color: selectedSlot === s.id ? '#34d399' : '#cbd5e1',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div>{s.label}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{s.time}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generic Jan Aushadhi Switch */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(2, 44, 34, 0.3) 100%)',
                border: '1px solid #059669',
                borderRadius: '12px',
                padding: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sparkles size={22} color="#34d399" />
                  <div>
                    <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '0.98rem' }}>
                      Jan Aushadhi Generic Substitution Engine (70.9% Savings)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>
                      Substitute expensive brands with PMBJP certified bio-equivalent salts.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#34d399' }}>
                    {useGeneric ? `₹${genericPrice}` : `₹${baseBrandPrice}`}
                  </span>
                  <button
                    onClick={() => setUseGeneric(!useGeneric)}
                    style={{
                      background: useGeneric ? '#059669' : '#334155',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {useGeneric ? '✓ Generic Applied (Save ₹' + (baseBrandPrice - genericPrice) + ')' : 'Switch to Generic'}
                  </button>
                </div>
              </div>

              {/* Partner Pharmacy Selector */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>
                  Choose Partner Pharmacy Dark Store:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {PARTNER_PHARMACIES.map((pharm) => (
                    <div
                      key={pharm.id}
                      onClick={() => setSelectedPharmacy(pharm)}
                      style={{
                        background: selectedPharmacy.id === pharm.id ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
                        border: selectedPharmacy.id === pharm.id ? '2px solid #38bdf8' : '1px solid #334155',
                        borderRadius: '10px',
                        padding: '0.85rem 1.15rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{pharm.name}</strong>
                          <span style={{ fontSize: '0.68rem', background: '#0284c7', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                            {pharm.savingsBadge}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                          📍 {pharm.distanceKm} km away &bull; {pharm.address} &bull; ⭐ {pharm.rating}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800 }}>
                          Est. Ready in {pharm.etaMins}m
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>
                          ● 100% Items in Stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Input */}
              {deliveryMode !== 'pickup' && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>
                    Delivery Drop Location / Patient Pin:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                    <MapPin size={18} color="#38bdf8" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        width: '100%',
                        fontSize: '0.85rem',
                        outline: 'none',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Total & Checkout Bar */}
              <div style={{
                borderTop: '1px solid #334155',
                paddingTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800 }}>
                    TOTAL AMOUNT DUE (INCL. TAX &amp; DISPATCH)
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>
                    ₹{totalAmount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                    ✔ Razorpay ACID Inventory Lock Active
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 20px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <CreditCard size={18} />
                  <span>Confirm Order &amp; Lock Stock (₹{totalAmount})</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: COMMITTING ACID TRANSACTION */}
          {orderStage === 'committing_acid' && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '4px solid #38bdf8',
                borderTopColor: 'transparent',
                margin: '0 auto 1.5rem',
                animation: 'spin 0.8s linear infinite'
              }} />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Executing Firestore ACID runTransaction...
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto' }}>
                Verifying medicine lot numbers, deducting batch quantities in Mumbai cloud database, and preventing negative-stock race conditions in 84 ms.
              </p>
            </div>
          )}

          {/* STEP 3: LIVE TRACKING & EV RIDER TELEMETRY HUD */}
          {orderStage === 'live_tracking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Confirmed Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                border: '1px solid #10b981',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={26} color="#34d399" />
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>Order Confirmed &amp; Stock Reserved!</strong>
                    <div style={{ fontSize: '0.78rem', color: '#a7f3d0', fontFamily: 'monospace' }}>
                      Commit Hash: {acidTxnHash} &bull; Chemist: {selectedPharmacy.name}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 800 }}>ESTIMATED ARRIVAL</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                    {riderTelemetry.etaRemainingMins} Minutes
                  </div>
                </div>
              </div>

              {/* Progress Milestones */}
              <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  
                  <div style={{ opacity: 1 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem', fontSize: '0.8rem', fontWeight: 900 }}>✓</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>Order Placed</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ACID Locked</div>
                  </div>

                  <div style={{ opacity: 1 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem', fontSize: '0.8rem', fontWeight: 900 }}>✓</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>Batch Packed</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Barcodes Verified</div>
                  </div>

                  <div style={{ opacity: 1 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem', fontSize: '0.8rem', fontWeight: 900 }}>
                      ⚡
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#38bdf8' }}>
                      Rider En-Route
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Active Route</div>
                  </div>

                  <div style={{ opacity: 0.5 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem', fontSize: '0.8rem', fontWeight: 900 }}>4</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>Safe Doorstep</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>OTP Handoff</div>
                  </div>

                </div>
              </div>

              {/* RIDER MODE HUD */}
              <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '14px', border: '2px solid #059669', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                
                {/* Secret Doorstep OTP Banner */}
                <div style={{ background: '#0f172a', borderRadius: '10px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', border: '1px solid #334155' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>
                      SECRET DOORSTEP DELIVERY OTP
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                      {doorstepOtp}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', background: '#059669', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 900 }}>
                      DOORSTEP HANDOFF SECURITY
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      Share this code with rider Vikram upon arrival
                    </div>
                  </div>
                </div>

                {/* Rider Telemetry Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>INSULATED BAG TEMP</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399', marginTop: '0.15rem' }}>
                      {riderTelemetry.temperature} °C
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Safe (2–8°C for Insulin)</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>ROAD SPEED</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.15rem' }}>
                      {riderTelemetry.speed} km/h
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>EV Ather 450X</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>EV BATTERY</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24', marginTop: '0.15rem' }}>
                      {riderTelemetry.battery}%
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>High Charge</span>
                  </div>

                  <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>REMAINING DISTANCE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a78bfa', marginTop: '0.15rem' }}>
                      {riderTelemetry.distanceKm} km
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Sola Overbridge</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.3rem' }}>
                        🛵
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '0.98rem', color: '#ffffff' }}>Rider Vikram Rathore</strong>
                          <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            ⭐ 4.96 (2,840+ runs)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                          Ather 450X EV (GJ-01-ET-9182) &bull; ❄️ Cold-Bag: 4.5°C &bull; En-route to {deliveryAddress}
                        </div>
                      </div>
                    </div>

                    <a
                      href="tel:+919825104921"
                      style={{
                        padding: '0.5rem 0.95rem',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}
                    >
                      📞 Call Rider
                    </a>
                  </div>

                  {/* Route Progress */}
                  <div style={{ background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📍 Landmark: Sola Bridge Crossing (1.1 km away)</span>
                    <span style={{ color: '#34d399', fontWeight: 800 }}>● Speed: 34 km/h (EV)</span>
                  </div>

                </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setOrderStage('delivered')}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Simulate Delivery Complete ✓
                </button>

                <button
                  onClick={onClose}
                  style={{
                    background: '#334155',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Close &amp; Keep Background Tracking
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: DELIVERED STATE */}
          {orderStage === 'delivered' && (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 30px rgba(5, 150, 105, 0.5)'
              }}>
                <CheckCircle2 size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Medicines Delivered Successfully!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                Delivered in <strong>8.2 minutes</strong> with unbroken cold-chain verification and zero stock discrepancy.
              </p>

              <div style={{ display: 'inline-block', background: '#1e293b', padding: '1rem 1.5rem', borderRadius: '10px', border: '1px solid #334155', textAlign: 'left', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Patient: <strong>{patientName}</strong></div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '3px' }}>Total Billed: <strong>₹{totalAmount}</strong> (Paid via UPI)</div>
                <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '3px' }}>Digital Tax Invoice generated &amp; synced to ABDM Locker.</div>
              </div>

              <div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Done &bull; Return to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
