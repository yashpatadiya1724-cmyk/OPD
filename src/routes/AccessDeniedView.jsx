import React from 'react';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';

export default function AccessDeniedView({ 
  attemptedRoute, 
  userRole, 
  onNavigateHome,
  onOpenLogin 
}) {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <ShieldAlert size={36} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 800,
          background: '#FEE2E2',
          color: '#991B1B',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Access Restricted &bull; 403 Forbidden
        </span>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: 'var(--text-primary, #0F172A)',
          marginBottom: '0.75rem',
        }}>
          Privileged Clinical Area
        </h2>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary, #64748B)',
          lineHeight: '1.6',
          marginBottom: '1.75rem',
        }}>
          Your current session role <strong style={{ color: '#0284C7' }}>({userRole || 'Guest'})</strong> is not authorized to access the <strong>{attemptedRoute?.shortTitle || 'requested portal'}</strong>. This section requires elevated hospital staff credentials.
        </p>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={onNavigateHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
            }}
          >
            <Home size={18} />
            Back to Dashboard
          </button>

          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle, #CBD5E1)',
                background: 'transparent',
                color: 'var(--text-primary, #0F172A)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <LogIn size={18} />
              Switch Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
