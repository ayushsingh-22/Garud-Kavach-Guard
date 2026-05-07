import React, { useContext, useState } from 'react'
import { WSContext } from '../App.jsx'

const statusColor = (wsState) => {
  if (wsState === 'open') return '#22c55e'
  if (wsState === 'connecting') return '#f59e0b'
  return '#ef4444'
}

const statusLabel = (wsState) => {
  if (wsState === 'open') return 'Connected'
  if (wsState === 'connecting') return 'Connecting…'
  return 'Disconnected'
}

export default function Dashboard({ onNav }) {
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>Field Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusColor(wsState),
              boxShadow: wsState === 'open' ? `0 0 6px ${statusColor(wsState)}` : 'none'
            }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{statusLabel(wsState)}</span>
          </div>
        </div>
        <span className={`badge ${clockedIn ? 'badge-success' : 'badge-muted'}`}>
          {clockedIn ? '🟢 On Duty' : '⚫ Off Duty'}
        </span>
      </div>

      {/* Clock In/Out */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
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
            : clockedIn ? '⏹ Clock Out' : '▶ Clock In'}
        </button>
        {wsState !== 'open' && (
          <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.75rem', textAlign: 'center' }}>
            Waiting for connection before you can clock in…
          </p>
        )}
      </div>

      {/* Location */}
      {lastPos && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📍 Last Known Location
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Latitude</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>{lastPos.lat.toFixed(5)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Longitude</p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>{lastPos.lng.toFixed(5)}</p>
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${lastPos.lat},${lastPos.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}
          >
            Open in Google Maps →
          </a>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => onNav('incident')}
          style={{ padding: '1rem', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          Report Incident
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onNav('shifts')}
          style={{ padding: '1rem', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          <span style={{ fontSize: '1.5rem' }}>📅</span>
          My Shifts
        </button>
      </div>

      {/* SOS Active Banner */}
      {sosSent && (
        <div style={{
          background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          border: '1.5px solid #ef4444',
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
            border: '2px solid #ef4444',
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
