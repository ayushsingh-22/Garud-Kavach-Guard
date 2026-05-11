import React, { useState } from 'react'
import apiConfig from '../apiConfig'

export default function TokenEntry({ onToken, theme, toggleTheme }) {
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const t = input.trim()
    if (!t) { setErr('Please enter your license number.'); return }

    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`${apiConfig.apiUrl}/api/guard/validate-license?license=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Invalid license number.')
        setLoading(false)
        return
      }
      onToken(t)
    } catch (_) {
      setErr('Unable to reach server. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      background: 'var(--bg)', position: 'relative'
    }}>
      {/* Theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme} style={{ position: 'absolute', top: '1rem', right: '1rem' }} title="Toggle theme">
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

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>Garud Kavach</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>Guard Field App</p>
        </div>

        <form onSubmit={submit}>
          <div className="card">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Enter your License Number to connect to the tracking system.
            </p>
            <div className="form-group">
              <label htmlFor="license">License Number</label>
              <input
                id="license"
                type="text"
                placeholder="e.g. GK-2024-001"
                value={input}
                onChange={e => { setInput(e.target.value); setErr('') }}
                autoComplete="off"
                autoCapitalize="none"
              />
              {err && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.4rem' }}>{err}</p>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Verifying…' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
