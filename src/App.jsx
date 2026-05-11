import React, { useState, useEffect, useRef, useCallback } from 'react'
import apiConfig, { getWsUrl } from './apiConfig'

// ─── Config ───────────────────────────────────────────────────────────────────
const PING_INTERVAL_MS = 60_000 // send location every 60s when clocked in

// ─── Screens ──────────────────────────────────────────────────────────────────
import Dashboard    from './screens/Dashboard.jsx'
import IncidentForm from './screens/IncidentForm.jsx'
import ShiftSchedule from './screens/ShiftSchedule.jsx'
import TokenEntry   from './screens/TokenEntry.jsx'
import Profile      from './screens/Profile.jsx'

// ─── WebSocket context ────────────────────────────────────────────────────────
export const WSContext = React.createContext(null)

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('dashboard')   // dashboard | incident | shifts | profile
  const [theme, setTheme] = useState(() => localStorage.getItem('guard_theme') || 'dark')
  const [token, setToken] = useState(() =>
    new URLSearchParams(window.location.search).get('license') ||
    localStorage.getItem('guard_license') || ''
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
    if (token) localStorage.setItem('guard_license', token)
  }, [token])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('guard_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleLogout = () => {
    localStorage.removeItem('guard_license')
    setToken('')
    setScreen('dashboard')
  }

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

    const ws = new WebSocket(`${getWsUrl()}/ws/guard?license=${encodeURIComponent(token)}`)

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
        localStorage.removeItem('guard_license')
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
    return <TokenEntry onToken={t => setToken(t)} theme={theme} toggleTheme={toggleTheme} />
  }

  const ctx = { wsState, clockedIn, lastPos, clockIn, clockOut, sendSOS, sendMsg, token, sosSent, sosTime, clearSosSent }

  return (
    <WSContext.Provider value={ctx}>
      <div className="app">
        {/* ── Screen router ── */}
        {screen === 'dashboard' && <Dashboard onNav={setScreen} theme={theme} toggleTheme={toggleTheme} />}
        {screen === 'incident'  && <IncidentForm onBack={() => setScreen('dashboard')} />}
        {screen === 'shifts'    && <ShiftSchedule onBack={() => setScreen('dashboard')} />}
        {screen === 'profile'   && <Profile onBack={() => setScreen('dashboard')} onLogout={handleLogout} />}

        {/* ── Bottom nav ── */}
        <nav className="bottom-nav">
          {[
            { id: 'dashboard', label: 'Home', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            )},
            { id: 'incident', label: 'Report', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
              </svg>
            )},
            { id: 'shifts', label: 'Shifts', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
            )},
            { id: 'profile', label: 'Profile', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )},
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`nav-item ${screen === item.id ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </WSContext.Provider>
  )
}
