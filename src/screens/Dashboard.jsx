import React, { useContext, useState } from 'react'
import { WSContext } from '../App.jsx'

const statusColor = (wsState) => {
  if (wsState === 'open') return 'var(--success)'
  if (wsState === 'connecting') return 'var(--warning)'
  return 'var(--danger)'
}

const statusLabel = (wsState) => {
  if (wsState === 'open') return 'Connected'
  if (wsState === 'connecting') return 'Connecting…'
  return 'Disconnected'
}

export default function Dashboard({ onNav, theme, toggleTheme }) {
  const { wsState, clockedIn, lastPos, clockIn, clockOut, sendSOS, sosSent, sosTime, clearSosSent } = useContext(WSContext)
  const [loading, setLoading] = useState(false)
  const [sosConfirm, setSosConfirm] = useState(false)

  const handleClockToggle = async () => {
    setLoading(true)
    try {
      if (clockedIn) await clockOut()
      else await clockIn()
    } finally {
      setLoading(false)
    }
  }

  const handleSOS = async () => {
    if (!sosConfirm) {
      setSosConfirm(true)
      setTimeout(() => setSosConfirm(false), 4000)
      return
    }
    setSosConfirm(false)
    await sendSOS()
  }

  return (
    <div style={{ padding: '1.25rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Field Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
            <div className={wsState === 'open' ? 'status-dot-pulse' : ''} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusColor(wsState),
              boxShadow: wsState === 'open' ? `0 0 6px var(--success)` : 'none'
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{statusLabel(wsState)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge ${clockedIn ? 'badge-success' : 'badge-muted'}`}>
            {clockedIn ? '● On Duty' : '● Off Duty'}
          </span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" x2="12" y1="1" y2="3"/><line x1="12" x2="12" y1="21" y2="23"/>
                <line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/>
                <line x1="1" x2="3" y1="12" y2="12"/><line x1="21" x2="23" y1="12" y2="12"/>
                <line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Clock In/Out */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p className="section-label" style={{ marginBottom: '0.25rem' }}>Current Shift</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {clockedIn
            ? 'Your location is being shared with the control room every minute.'
            : 'Clock in to start your shift and begin location sharing.'}
        </p>
        <button
          onClick={handleClockToggle}
          disabled={loading || wsState !== 'open'}
          className={`btn ${clockedIn ? 'btn-outline' : 'btn-success'}`}
        >
          {loading
            ? <span className="spinner" />
            : clockedIn ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="12" height="12" rx="1"/>
                </svg>
                Clock Out
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Clock In
              </>
            )}
        </button>
        {wsState !== 'open' && (
          <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.75rem', textAlign: 'center' }}>
            Waiting for connection before you can clock in…
          </p>
        )}
      </div>

      {/* Location */}
      {lastPos && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <p className="section-label" style={{ marginBottom: 0 }}>Last Known Location</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Latitude</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{lastPos.lat.toFixed(5)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Longitude</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>{lastPos.lng.toFixed(5)}</p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${lastPos.lat},${lastPos.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
            </svg>
            Open in Google Maps
          </a>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => onNav('incident')}
          style={{ padding: '1rem', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
          </svg>
          Report Incident
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onNav('shifts')}
          style={{ padding: '1rem', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          My Shifts
        </button>
      </div>

      {/* SOS Active Banner */}
      {sosSent && (
        <div style={{
          background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          border: '1.5px solid var(--danger)',
          boxShadow: '0 0 20px rgba(239,68,68,0.35)'
        }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#fef2f2', fontSize: '0.95rem', margin: 0 }}>SOS ACTIVE</p>
            <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Control room alerted{sosTime ? ` at ${sosTime}` : ''}
            </p>
          </div>
          <button
            onClick={clearSosSent}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
              color: '#fca5a5', fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.6rem',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SOS */}
      <button
        onClick={handleSOS}
        disabled={wsState !== 'open'}
        className={`btn btn-danger ${!sosConfirm && !sosSent ? 'sos-btn' : ''}`}
        style={{
          marginBottom: '0.5rem', padding: '1.1rem', fontSize: '1rem', letterSpacing: '0.05em',
          ...(sosSent ? {
            background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
            border: '2px solid var(--danger)',
            boxShadow: '0 0 16px rgba(239,68,68,0.5)'
          } : {})
        }}
      >
        {sosSent ? '🚨 SOS SENT — Tap to Resend' : sosConfirm ? '\u26A0\uFE0F Tap again to CONFIRM SOS' : '\uD83C\uDD98 SEND SOS ALERT'}
      </button>
      {sosConfirm && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#f87171' }}>
          SOS will alert the control room immediately with your location.
        </p>
      )}
    </div>
  )
}
