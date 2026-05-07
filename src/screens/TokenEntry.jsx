import React, { useState } from 'react'

export default function TokenEntry({ onToken }) {
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const t = input.trim()
    if (!t) { setErr('Please enter your token.'); return }
    onToken(t)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      background: '#0f172a'
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '2rem'
          }}>🛡️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>Garud Kavach</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.25rem', fontSize: '0.875rem' }}>Guard Field App</p>
        </div>

        <form onSubmit={submit}>
          <div className="card">
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Enter the token provided by your supervisor to connect to the tracking system.
            </p>
            <div className="form-group">
              <label htmlFor="token">Guard Token</label>
              <input
                id="token"
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={input}
                onChange={e => { setInput(e.target.value); setErr('') }}
                autoComplete="off"
                autoCapitalize="none"
              />
              {err && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{err}</p>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
