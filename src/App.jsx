import React, { useState, useEffect, useRef, useCallback } from 'react'

// ─── Config ───────────────────────────────────────────────────────────────────
// In production, VITE_API_URL points to the deployed backend.
// In dev, derive from window.location so it works from any device (LAN, mobile).
const API_URL = import.meta.env.VITE_API_URL || ''
// In dev, WS goes through the Vite proxy (same host+port as the page) so it
// works from localhost, LAN, and any IP without hardcoding — Vite handles TLS.
// In production, derive from VITE_API_URL.
const WS_URL  = API_URL
  ? API_URL.replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
const PING_INTERVAL_MS = 60_000 // send location every 60s when clocked in

// ─── Screens ──────────────────────────────────────────────────────────────────
import Dashboard    from './screens/Dashboard.jsx'
import IncidentForm from './screens/IncidentForm.jsx'
import ShiftSchedule from './screens/ShiftSchedule.jsx'
import TokenEntry   from './screens/TokenEntry.jsx'

// ─── WebSocket context ────────────────────────────────────────────────────────
export const WSContext = React.createContext(null)

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('dashboard')   // dashboard | incident | shifts
  const [token, setToken] = useState(() =>
    new URLSearchParams(window.location.search).get('token') ||
    localStorage.getItem('guard_token') || ''
  )
  const [wsState, setWsState]       = useState('disconnected') // disconnected | connecting | open
  const [clockedIn, setClockedIn]   = useState(false)
  const [lastPos, setLastPos]       = useState(null)
  const [sosSent, setSosSent]       = useState(false)
  const [sosTime, setSosTime]       = useState(null)
  const wsRef          = useRef(null)
  const pingTimer       = useRef(null)
  const reconnectTimer  = useRef(null)

  // Persist token
  useEffect(() => {
    if (token) localStorage.setItem('guard_token', token)
  }, [token])

  // ── WebSocket management ────────────────────────────────────────────────────
  const sendMsg = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
      return true
    }
    return false
  }, [])

  // Safely dispose a WebSocket without triggering "closed before connection" warnings.
  // For CONNECTING sockets we must wait until open before closing.
  const disposeWs = useCallback((ws) => {
    if (!ws) return
    ws.onmessage = null
    ws.onerror   = null
    ws.onclose   = null
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.onopen = () => ws.close()
    } else {
      ws.onopen = null
      ws.close()
    }
  }, [])

  const connect = useCallback(() => {
    if (!token) return
    clearTimeout(reconnectTimer.current)
    disposeWs(wsRef.current)
    wsRef.current = null
    setWsState('connecting')

    const ws = new WebSocket(`${WS_URL}/ws/guard?token=${encodeURIComponent(token)}`)

    ws.onopen = () => {
      if (wsRef.current !== ws) return
      setWsState('open')
    }
    ws.onclose = (e) => {
      if (wsRef.current !== ws) return
      setWsState('disconnected')
      clearInterval(pingTimer.current)
      // Close code 4001 = auth failure (token missing/invalid).
      // Clear the stored token so the guard is taken back to TokenEntry.
      // Any other close code = network/server issue — reconnect after 5s.
      if (e.code === 4001) {
        localStorage.removeItem('guard_token')
        setToken('')
        return
      }
      reconnectTimer.current = setTimeout(() => connect(), 5000)
    }
    ws.onerror = () => ws.close()

    wsRef.current = ws
  }, [token, disposeWs])

  useEffect(() => {
    if (token) connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      clearInterval(pingTimer.current)
      disposeWs(wsRef.current)
      wsRef.current = null
    }
  }, [connect, token, disposeWs])

  // ── Location helpers ────────────────────────────────────────────────────────
  const getCurrentPos = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })

  // ── Clock In ────────────────────────────────────────────────────────────────
  const clockIn = useCallback(async () => {
    let pos = { lat: 0, lng: 0 }
    try { pos = await getCurrentPos() } catch (_) { /* use 0,0 if denied */ }
    setLastPos(pos)
    sendMsg({ type: 'clockin', lat: pos.lat, lng: pos.lng, timestamp: new Date().toISOString() })
    setClockedIn(true)

    // Start pinging location every 60s
    clearInterval(pingTimer.current)
    pingTimer.current = setInterval(async () => {
      let p = { lat: 0, lng: 0 }
      try { p = await getCurrentPos() } catch (_) {}
      setLastPos(p)
      sendMsg({ type: 'location', lat: p.lat, lng: p.lng, timestamp: new Date().toISOString() })
    }, PING_INTERVAL_MS)
  }, [sendMsg])

  // ── Clock Out ───────────────────────────────────────────────────────────────
  const clockOut = useCallback(async () => {
    clearInterval(pingTimer.current)
    let pos = lastPos || { lat: 0, lng: 0 }
    try { pos = await getCurrentPos() } catch (_) {}
    sendMsg({ type: 'clockout', lat: pos.lat, lng: pos.lng, timestamp: new Date().toISOString() })
    setClockedIn(false)
  }, [sendMsg, lastPos])

  // ── SOS ──────────────────────────────────────────────────────────────────────
  const sendSOS = useCallback(async () => {
    let pos = lastPos || { lat: 0, lng: 0 }
    try { pos = await getCurrentPos() } catch (_) {}
    sendMsg({ type: 'sos', lat: pos.lat, lng: pos.lng, timestamp: new Date().toISOString() })
    setSosSent(true)
    setSosTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }, [sendMsg, lastPos])

  const clearSosSent = useCallback(() => {
    setSosSent(false)
    setSosTime(null)
  }, [])

  // ── Token setup screen ──────────────────────────────────────────────────────
  if (!token) {
    return <TokenEntry onToken={t => setToken(t)} />
  }

  const ctx = { wsState, clockedIn, lastPos, clockIn, clockOut, sendSOS, sendMsg, token, sosSent, sosTime, clearSosSent }

  return (
    <WSContext.Provider value={ctx}>
      <div className="app">
        {/* ── Screen router ── */}
        {screen === 'dashboard' && <Dashboard onNav={setScreen} />}
        {screen === 'incident'  && <IncidentForm onBack={() => setScreen('dashboard')} />}
        {screen === 'shifts'    && <ShiftSchedule onBack={() => setScreen('dashboard')} />}

        {/* ── Bottom nav ── */}
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          background: '#1e293b', borderTop: '1px solid #334155',
          display: 'flex', zIndex: 100
        }}>
          {[
            { id: 'dashboard', label: 'Home', emoji: '🏠' },
            { id: 'incident',  label: 'Report', emoji: '⚠️' },
            { id: 'shifts',    label: 'Shifts', emoji: '📅' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              style={{
                flex: 1, padding: '0.75rem 0.5rem', background: 'none', border: 'none',
                color: screen === item.id ? '#3b82f6' : '#94a3b8',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </WSContext.Provider>
  )
}
