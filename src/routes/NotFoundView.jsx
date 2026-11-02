import React from 'react';
import { Compass, Home, Search } from 'lucide-react';
import { ROUTES } from './routeConstants.js';

export default function NotFoundView({ requestedPath, onNavigateHome }) {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        maxWidth: '540px',
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
          background: 'rgba(2, 132, 199, 0.1)',
          color: '#0284C7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <Compass size={36} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 800,
          background: '#E0F2FE',
          color: '#0369A1',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Route Not Found &bull; 404
        </span>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: 'var(--text-primary, #0F172A)',
          marginBottom: '0.75rem',
        }}>
          Portal Surface Not Found
        </h2>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary, #64748B)',
          lineHeight: '1.6',
          marginBottom: '1.5rem',
        }}>
          The route <code style={{ 
            background: 'var(--bg-inner, #F1F5F9)', 
            padding: '0.2rem 0.5rem', 
            borderRadius: '6px',
            color: '#0284C7',
            fontWeight: 700 
          }}>{requestedPath || 'unknown'}</code> does not correspond to an active MediQ surface. Please return to the hospital directory.
        </p>

        <button
          onClick={onNavigateHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: '#0284C7',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Home size={18} />
          Go to Hospital Directory
        </button>
      </div>
    </div>
  );
}
