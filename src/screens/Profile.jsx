import React, { useContext, useEffect, useState } from 'react'
import { WSContext } from '../App.jsx'

const API_URL = import.meta.env.VITE_API_URL || ''

function InfoRow({ icon, label, value }) {
  return (
    <div className="info-row">
      <div className="info-icon">{icon}</div>
      <div className="info-content">
        <p className="info-label">{label}</p>
        <p className="info-value">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function Profile({ onBack, onLogout }) {
  const { clockedIn } = useContext(WSContext)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const license = localStorage.getItem('guard_license') || ''
    fetch(`${API_URL}/api/guard/profile`, {
      headers: { 'X-Guard-License': license },
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(d => { setProfile(d); setLoading(false) })
      .catch(() => { setError('Could not load profile.'); setLoading(false) })
  }, [])

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'GK'

  const fmtDate = (s) => {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const statusColor = profile?.status === 'active' ? 'var(--success)' : 'var(--warning)'
  const statusBg = profile?.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'

  return (
    <div style={{ padding: '1.25rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>My Profile</h1>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>
          <span className="spinner" style={{ display: 'block', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.85rem' }}>Loading profile…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚠️</p>
          <p style={{ color: '#f87171', fontSize: '0.88rem' }}>{error}</p>
        </div>
      )}

      {profile && (
        <>
          {/* Profile hero card */}
          <div className="card profile-hero">
            <div className="profile-avatar-wrapper">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="profile-avatar"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
              ) : null}
              <div className="profile-avatar profile-avatar-fallback" style={profile.photo_url ? { display: 'none' } : {}}>
                {initials}
              </div>
              <div className={`profile-status-dot ${profile.status === 'active' ? 'active' : 'inactive'}`} />
            </div>
            <h2 className="profile-name">{profile.name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="profile-badge" style={{ color: statusColor, background: statusBg, border: `1px solid ${statusColor}30` }}>
                {profile.status === 'active' ? '● Active' : '● ' + (profile.status || 'Unknown')}
              </span>
              <span className={`profile-badge ${clockedIn ? 'badge-on-duty' : 'badge-off-duty'}`}>
                {clockedIn ? '🟢 On Duty' : '⚫ Off Duty'}
              </span>
            </div>
          </div>

          {/* Info card */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <p className="section-label">Personal Information</p>
            <InfoRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
              label="Phone"
              value={profile.phone}
            />
            <InfoRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              label="Email"
              value={profile.email}
            />
            <InfoRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
              label="Address"
              value={profile.address}
            />
          </div>

          {/* License card */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <p className="section-label">License & Pay</p>
            <InfoRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              label="License No."
              value={profile.license_no}
            />
            <InfoRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>}
              label="License Expiry"
              value={fmtDate(profile.license_expiry)}
            />
            <InfoRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c1.7 0 3-1.3 3-3s-1.3-3-3-3H6"/></svg>}
              label="Hourly Rate"
              value={profile.hourly_rate ? `₹${profile.hourly_rate}/hr` : '—'}
            />
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="btn btn-danger"
            style={{ marginTop: '1.25rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            Logout
          </button>
        </>
      )}
    </div>
  )
}
