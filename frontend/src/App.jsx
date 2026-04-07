import { useState, useEffect } from 'react'
import './App.css'

const COMMANDS = {
  up: 'AAAAAQAAAAEAAAB0Aw==',
  down: 'AAAAAQAAAAEAAAB1Aw==',
  left: 'AAAAAQAAAAEAAAA0Aw==',
  right: 'AAAAAQAAAAEAAAA1Aw==',
  ok: 'AAAAAQAAAAEAAABlAw==',
  back: 'AAAAAQAAAAEAAABQAw==',
  home: 'AAAAAQAAAAEAAABgAw==',
  volUp: 'AAAAAQAAAAEAAAA+Aw==',
  volDown: 'AAAAAQAAAAEAAAA/Aw==',
  mute: 'AAAAAQAAAAEAAAAUAw==',
  chUp: 'AAAAAQAAAAEAAAAZAw==',
  chDown: 'AAAAAQAAAAEAAAAbAw==',
  play: 'AAAAAgAAAJcAAAAwAw==',
  pause: 'AAAAAgAAAJcAAAAZAw==',
  input: 'AAAAAQAAAAEAAAAlAw==',
  epg: 'AAAAAQAAAAEAAAB7Aw==',
  info: 'AAAAAQAAAAEAAAAfAw==',
}

function App() {
  const [loading, setLoading] = useState(null)
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState('')
  const [registering, setRegistering] = useState(false)
  const [authExpired, setAuthExpired] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  const sendCommand = async (cmd) => {
    if (loading) return
    setLoading(cmd)
    try {
      const res = await fetch('/api/tv/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: COMMANDS[cmd] }),
      })
      if (res.status === 401) {
        setAuthExpired(true)
        setShowPinInput(true)
      }
    } catch { /* ignore */ }
    setLoading(null)
  }

  const togglePower = async () => {
    if (loading) return
    setLoading('power')
    try {
      const res = await fetch('/api/tv/power', { method: 'POST' })
      if (res.status === 401) {
        setAuthExpired(true)
        setShowPinInput(true)
      }
    } catch { /* ignore */ }
    setLoading(null)
  }

  const handleRequestPin = async () => {
    setRegistering(true)
    try { await fetch('/api/tv/pin', { method: 'POST' }) } catch {}
    setRegistering(false)
  }

  const handleRegisterPin = async () => {
    if (!pin) return
    setRegistering(true)
    try {
      const res = await fetch(`/api/tv/register?pin=${pin}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setShowPinInput(false)
        setAuthExpired(false)
        setPin('')
      }
    } catch {}
    setRegistering(false)
  }

  const DpadButton = ({ cmd, label, large }) => (
    <button
      className={`dpad-btn ${large ? 'dpad-btn-large' : ''}`}
      onClick={() => sendCommand(cmd)}
      disabled={loading !== null}
    >
      {loading === cmd ? <span className="spinner-sm"></span> : label}
    </button>
  )

  return (
    <div className="app">
      <div className="remote">
        {/* Power */}
        <button
          className={`power-btn ${loading === 'power' ? 'active' : ''}`}
          onClick={togglePower}
          disabled={loading !== null}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </button>

        {/* Top row */}
        <div className="top-row">
          <button className="func-btn" onClick={() => sendCommand('input')} disabled={loading !== null}>Input</button>
          <button className="func-btn" onClick={() => sendCommand('mute')} disabled={loading !== null}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          </button>
          <button className="func-btn" onClick={() => sendCommand('info')} disabled={loading !== null}>Info</button>
        </div>

        {/* D-Pad */}
        <div className="dpad">
          <div className="dpad-row">
            <div></div>
            <DpadButton cmd="up" label="▲" />
            <div></div>
          </div>
          <div className="dpad-row">
            <DpadButton cmd="left" label="◀" />
            <DpadButton cmd="ok" label="OK" large />
            <DpadButton cmd="right" label="▶" />
          </div>
          <div className="dpad-row">
            <div></div>
            <DpadButton cmd="down" label="▼" />
            <div></div>
          </div>
        </div>

        {/* Nav row */}
        <div className="nav-row">
          <button className="nav-btn" onClick={() => sendCommand('back')} disabled={loading !== null}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Indietro</span>
          </button>
          <button className="nav-btn" onClick={() => sendCommand('home')} disabled={loading !== null}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <span>Home</span>
          </button>
        </div>

        {/* Volume & Channel */}
        <div className="media-row">
          <div className="vol-group">
            <button className="media-btn" onClick={() => sendCommand('volUp')} disabled={loading !== null}>+</button>
            <span className="media-label">Vol</span>
            <button className="media-btn" onClick={() => sendCommand('volDown')} disabled={loading !== null}>−</button>
          </div>
          <div className="vol-group">
            <button className="media-btn" onClick={() => sendCommand('chUp')} disabled={loading !== null}>▲</button>
            <span className="media-label">Canale</span>
            <button className="media-btn" onClick={() => sendCommand('chDown')} disabled={loading !== null}>▼</button>
          </div>
        </div>

        {/* Playback */}
        <div className="play-row">
          <button className="play-btn" onClick={() => sendCommand('play')} disabled={loading !== null}>▶</button>
          <button className="play-btn" onClick={() => sendCommand('pause')} disabled={loading !== null}>⏸</button>
        </div>

        {/* PIN section */}
        {showPinInput && (
          <div className="pin-section">
            <p className="pin-text">
              {authExpired ? 'Autenticazione scaduta.' : ''} Inserisci il PIN mostrato sul TV
            </p>
            <div className="pin-row">
              {authExpired && (
                <button className="pin-btn-secondary" onClick={handleRequestPin} disabled={registering}>
                  Mostra PIN
                </button>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="pin-input"
              />
              <button className="pin-btn" onClick={handleRegisterPin} disabled={registering || !pin}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
