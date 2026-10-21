import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MediQ Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = window.location.origin;
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <AlertTriangle size={42} color="#ef4444" />
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            MediQ Platform Recovery
          </h1>
          <p style={{ color: '#94a3b8', maxWidth: '460px', margin: '0 0 1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
            A client-side initialization state was caught. Click below to refresh the clinical workspace with a clean cache.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <RefreshCw size={18} />
              <span>Reload Workspace</span>
            </button>

            <button
              onClick={this.handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <Home size={18} />
              <span>Clear Cache &amp; Reset</span>
            </button>
          </div>

          {/* Always display error details so users and developers can diagnose instantly */}
          {this.state.error && (
            <div style={{
              marginTop: '1.5rem',
              maxWidth: '850px',
              width: '100%',
              textAlign: 'left',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#f87171', fontWeight: 800, fontSize: '0.85rem' }}>
                  Diagnostics: {this.state.error.name || 'Runtime Error'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `${this.state.error?.toString()}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`
                    );
                    alert('Error diagnostics copied to clipboard');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Copy Diagnostics
                </button>
              </div>
              <pre style={{
                color: '#fca5a5',
                fontSize: '0.78rem',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '260px',
                overflowY: 'auto',
                fontFamily: 'monospace'
              }}>
                {this.state.error.toString()}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                {this.state.errorInfo?.componentStack ? `\n\nComponent Trace:${this.state.errorInfo.componentStack}` : ''}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
