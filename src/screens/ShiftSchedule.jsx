import React, { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const DAY   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtDate = (s) => {
  const d = new Date(s)
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`
}
const fmtTime = (s) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const durationHrs = (start, end) => {
  const diff = (new Date(end) - new Date(start)) / 3_600_000
  return diff > 0 ? `${diff.toFixed(1)}h` : '—'
}

const shiftStatus = (shift) => {
  const now   = new Date()
  const start = new Date(shift.start_time)
  const end   = new Date(shift.end_time)
  if (now >= start && now <= end) return { label: 'Active',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'  }
  if (now < start)               return { label: 'Upcoming',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' }
  return                                { label: 'Completed', color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.2)' }
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{
        fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '0.5rem', paddingLeft: '0.25rem'
      }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {children}
      </div>
    </div>
  )
}

function ShiftCard({ shift }) {
  const st          = shiftStatus(shift)
  const isCompleted = new Date() > new Date(shift.end_time)
  return (
    <div
      className="card"
      style={{
        opacity: isCompleted ? 0.72 : 1,
        borderLeft: `3px solid ${st.color}`,
        padding: '1rem 1.1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Client / assignment name — FIXED: was shift.location, now shift.client_name */}
          <p style={{
            fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem',
            marginBottom: '0.35rem', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {shift.client_name || 'Assignment'}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.12rem' }}>
            📅 {fmtDate(shift.start_time)}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🕐 {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
            <span style={{ marginLeft: '0.5rem', color: st.color, fontWeight: 600, fontSize: '0.72rem' }}>
              · {durationHrs(shift.start_time, shift.end_time)}
            </span>
          </p>
          {isCompleted && shift.actual_hours > 0 && (
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              marginTop: '0.45rem', paddingTop: '0.45rem',
              borderTop: '1px solid var(--border)'
            }}>
              Logged: <span style={{ color: '#22c55e', fontWeight: 700 }}>{shift.actual_hours}h</span>
            </p>
          )}
        </div>
        {/* Status pill */}
        <span style={{
          fontSize: '0.7rem', fontWeight: 700,
          padding: '3px 10px', borderRadius: 999,
          color: st.color, background: st.bg,
          border: `1px solid ${st.border}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{st.label}</span>
      </div>
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ShiftSchedule({ onBack }) {
  const [shifts,  setShifts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const token = localStorage.getItem('guard_token') || ''
    const load = () => {
      fetch(`${API_URL}/api/guard/shifts`, {
        headers: { 'X-Guard-Token': token },
      })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
        .then(d  => { setShifts(Array.isArray(d) ? d : []); setLoading(false) })
        .catch(()  => { setError('Could not load shifts. Check your connection.'); setLoading(false) })
    }
    load()
    // Refresh every 60 s so status (Active/Upcoming/Completed) updates without reload.
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  const now       = new Date()
  const active    = shifts.filter(s => now >= new Date(s.start_time) && now <= new Date(s.end_time))
  const upcoming  = [...shifts.filter(s => now < new Date(s.start_time))].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const completed = shifts.filter(s => now > new Date(s.end_time))
  const nextShift = upcoming[0]

  return (
    <div style={{ padding: '1.25rem', paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--surface2)', border: 'none', color: 'var(--text)',
            cursor: 'pointer', borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0,
          }}
        >←</button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>My Shifts</h1>
          {!loading && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{shifts.length} total</p>}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>
          <span className="spinner" style={{ display: 'block', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.85rem' }}>Loading shifts…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚠️</p>
          <p style={{ color: '#f87171', fontSize: '0.88rem' }}>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && shifts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.25rem' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</p>
          <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>No shifts yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HR will assign your shifts here.</p>
        </div>
      )}

      {/* Next shift highlight card */}
      {!loading && !error && nextShift && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.12))',
          border: '1px solid rgba(59,130,246,0.28)',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
            ⚡ Next Shift
          </p>
          <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem', marginBottom: '0.2rem' }}>
            {nextShift.client_name || 'Assignment'}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {fmtDate(nextShift.start_time)} · {fmtTime(nextShift.start_time)} – {fmtTime(nextShift.end_time)}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.2rem', fontWeight: 600 }}>
            {durationHrs(nextShift.start_time, nextShift.end_time)} duration
          </p>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <Section label="🟢 Active Now">
          {active.map(s => <ShiftCard key={s.id} shift={s} />)}
        </Section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section label="🕐 Upcoming">
          {upcoming.map(s => <ShiftCard key={s.id} shift={s} />)}
        </Section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Section label="✓ Completed">
          {completed.map(s => <ShiftCard key={s.id} shift={s} />)}
        </Section>
      )}
    </div>
  )
}
