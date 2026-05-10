import React, { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'

const API_URL = import.meta.env.VITE_API_URL || ''

const SEVERITIES = [
  { value: 'low',    label: 'Low',    color: 'var(--success)' },
  { value: 'medium', label: 'Medium', color: 'var(--warning)' },
  { value: 'high',   label: 'High',   color: '#f97316' },
  { value: 'sos',    label: 'SOS',    color: 'var(--danger)' },
]

export default function IncidentForm({ onBack }) {
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setError('')
    setLoading(true)

    try {
      // Get current position
      let lat = 0, lng = 0
      try {
        await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(
            p => { lat = p.coords.latitude; lng = p.coords.longitude; res() },
            rej,
            { timeout: 5000 }
          )
        )
      } catch (_) {}

      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', form.description.trim())
      fd.append('severity', form.severity)
      fd.append('lat', lat)
      fd.append('lng', lng)
      if (photo) {
        let fileToUpload = photo
        if (photo.size > 1024 * 1024) {
          try {
            fileToUpload = await imageCompression(photo, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            })
          } catch (_) { /* fall back to original if compression fails */ }
        }
        fd.append('photo', fileToUpload)
      }

      const license = localStorage.getItem('guard_license') || ''
      const res = await fetch(`${API_URL}/api/guard/incidents`, {
        method: 'POST',
        headers: { 'X-Guard-License': license },
        body: fd,
      })

      if (!res.ok) throw new Error('Server error')
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onBack() }, 2000)
    } catch (err) {
      setError('Failed to submit. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h2 style={{ color: 'var(--success)', fontWeight: 700 }}>Incident Reported</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Returning to dashboard…</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.25rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Report Incident</h1>
      </div>

      <form onSubmit={submit}>
        {/* Severity */}
        <div className="form-group">
          <label>Severity</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
            {SEVERITIES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                style={{
                  padding: '0.6rem 0.25rem',
                  borderRadius: 8,
                  border: `2px solid ${form.severity === s.value ? s.color : 'var(--border)'}`,
                  background: form.severity === s.value ? 'var(--accent-soft)' : 'var(--surface)',
                  color: form.severity === s.value ? s.color : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            placeholder="Brief description of the incident"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={120}
          />
        </div>

        <div className="form-group">
          <label htmlFor="desc">Details</label>
          <textarea
            id="desc"
            rows={4}
            placeholder="What happened? Include any relevant details…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Photo */}
        <div className="form-group">
          <label>Photo (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />
          {photoPreview ? (
            <div style={{ position: 'relative' }}>
              <img src={photoPreview} alt="preview" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                  borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '0.8rem'
                }}
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileRef.current?.click()}
            >
              Take / Choose Photo
            </button>
          )}
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
        )}

        <button type="submit" className="btn btn-danger" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Submit Incident Report'}
        </button>
      </form>
    </div>
  )
}
