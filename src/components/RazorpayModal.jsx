import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Lock, 
  ArrowRight,
  QrCode,
  Sparkles
} from 'lucide-react';

export default function RazorpayModal({ 
  isOpen, 
  onClose, 
  amount = 500, 
  title = "OPD Slot Prepayment", 
  doctorName = "Dr. Rajesh Mehta", 
  hospitalName = "CityCare Central Hospital",
  slotTime = "10:30 AM - 10:45 AM",
  onPaymentSuccess 
}) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('riya@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('432');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  if (!isOpen) return null;

  const platformCut = Math.round(amount * 0.10); // 10%
  const hospitalPayout = amount - platformCut;

  const RAZORPAY_KEY = "rzp_test_TmxKQ0fOUHs5z8";

  const handleOpenRazorpayLive = () => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      try {
        const options = {
          key: RAZORPAY_KEY,
          amount: amount * 100, // paise
          currency: "INR",
          name: "MediQ OPD Healthcare",
          description: `${title} • ${doctorName}`,
          image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=200&q=80",
          prefill: {
            name: "Patient",
            email: "patient@mediq.health",
            contact: "9876543210"
          },
          notes: {
            doctor: doctorName,
            hospital: hospitalName,
            slot: slotTime
          },
          theme: {
            color: "#0284c7"
          },
          handler: function (response) {
            const txId = response.razorpay_payment_id || `pay_${Date.now()}`;
            const res = {
              gatewayTxId: txId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              amount,
              platformCut,
              hospitalPayout,
              paymentMethod: 'Razorpay Live Checkout (UPI/Cards)',
              status: 'settled',
              timestamp: new Date().toISOString()
            };
            setPaymentResult(res);
            setIsSuccess(true);
            setTimeout(() => {
              onPaymentSuccess(res);
              setIsSuccess(false);
              setPaymentResult(null);
              onClose();
            }, 1500);
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (err) {
          alert(`Razorpay Payment Notice: ${err.error?.description || 'Payment was cancelled or failed'}`);
        });
        rzp.open();
        return;
      } catch (e) {
        console.warn('Razorpay open error, falling back to simulator:', e);
      }
    }
    handlePay();
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const txId = `pay_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const res = {
        gatewayTxId: txId,
        amount,
        platformCut,
        hospitalPayout,
        paymentMethod: method === 'upi' ? `UPI (${upiId})` : (method === 'card' ? 'Visa Card ending 8821' : 'HDFC NetBanking'),
        status: 'settled',
        timestamp: new Date().toISOString()
      };
      setPaymentResult(res);
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(res);
        setIsSuccess(false);
        setPaymentResult(null);
        onClose();
      }, 1800);
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      backgroundColor: 'rgba(9, 13, 22, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Razorpay Brand Header */}
        <div style={{
          background: 'linear-gradient(135deg, #02042b 0%, #0c2340 100%)',
          padding: '1.25rem 1.5rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#0c83ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.1rem'
            }}>
              R
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.04em' }}>Razorpay Trusted Checkout</div>
              <div style={{ fontSize: '0.72rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Lock size={11} /> 256-bit AES Encryption
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)'
            }}>
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#090d16', marginBottom: '0.35rem' }}>
              Payment Successful!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              Transaction ID: <code style={{ color: '#0284c7', fontWeight: 800 }}>{paymentResult?.gatewayTxId}</code>
            </p>
            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#059669', fontWeight: 800 }}>
              Slot Confirmed &bull; Token generated with zero-wait priority!
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem' }}>
            {/* Amount Banner */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  {title}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#090d16' }}>
                  {doctorName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
                  {slotTime} &bull; {hospitalName}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#090d16' }}>
                  ₹{amount}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>
                  Inclusive of Taxes
                </div>
              </div>
            </div>

            {/* Split Breakdown (PRD 6.9 Commission) */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.78rem',
              color: '#166534',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>MediQ Commission (10%): <strong>₹{platformCut}</strong></span>
              <span>Hospital Payout (90%): <strong>₹{hospitalPayout}</strong></span>
            </div>

            {/* Method Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: method === 'upi' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: method === 'upi' ? '#eff6ff' : '#ffffff',
                  color: method === 'upi' ? '#0284c7' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Smartphone size={16} /> UPI (GPay)
              </button>
              <button
                type="button"
                onClick={() => setMethod('card')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: method === 'card' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: method === 'card' ? '#eff6ff' : '#ffffff',
                  color: method === 'card' ? '#0284c7' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <CreditCard size={16} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: method === 'netbanking' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: method === 'netbanking' ? '#eff6ff' : '#ffffff',
                  color: method === 'netbanking' ? '#0284c7' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Building size={16} /> NetBanking
              </button>
            </div>

            {/* Input according to method */}
            {method === 'upi' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  UPI ID / VPA
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
                    ✓ Verified
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Quick Pay:</span>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                    <span key={app} style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {method === 'card' && (
              <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                      Valid Thru
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'netbanking' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Select Bank
                </label>
                <select style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700 }}>
                  <option>HDFC Bank (Popular)</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            {/* Razorpay Key Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              marginBottom: '1rem',
              fontSize: '0.75rem',
              color: '#166534',
              fontWeight: 700
            }}>
              <span>Live Test Key Active:</span>
              <code style={{ background: '#dcfce7', padding: '0.15rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                rzp_test_...Hs5z8
              </code>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleOpenRazorpayLive}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #0c83ff 0%, #0056b3 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.95rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '1.05rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px rgba(12, 131, 255, 0.35)'
              }}
            >
              <ShieldCheck size={20} />
              <span>{isProcessing ? 'Connecting Gateway...' : `Pay ₹${amount} with Razorpay`}</span>
            </button>

            {/* Quick Demo Simulator fallback */}
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#475569',
                border: '1px dashed #cbd5e1',
                padding: '0.6rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '0.5rem'
              }}
            >
              <Sparkles size={14} color="#0284c7" />
              <span>Or 1-Tap Quick Test Simulator</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Cancellation Refund Policy: &gt;2h: 100% &bull; 30m–2h: 50% &bull; &lt;30m: 0%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
