import { useState, useEffect } from 'react'
import './App.css'

const COMMANDS = {
  num1: 'AAAAAQAAAAEAAAAAAw==',
  num2: 'AAAAAQAAAAEAAAABAw==',
  num3: 'AAAAAQAAAAEAAAACAw==',
  num4: 'AAAAAQAAAAEAAAADAw==',
  num5: 'AAAAAQAAAAEAAAAEAw==',
  num6: 'AAAAAQAAAAEAAAAFAw==',
  num7: 'AAAAAQAAAAEAAAAGAw==',
  num8: 'AAAAAQAAAAEAAAAHAw==',
  num9: 'AAAAAQAAAAEAAAAIAw==',
  num0: 'AAAAAQAAAAEAAAAJAw==',
  up: 'AAAAAQAAAAEAAAB0Aw==',
  down: 'AAAAAQAAAAEAAAB1Aw==',
  left: 'AAAAAQAAAAEAAAA0Aw==',
  right: 'AAAAAQAAAAEAAAAzAw==',
  ok: 'AAAAAQAAAAEAAABlAw==',
  back: 'AAAAAgAAAJcAAAAjAw==',
  home: 'AAAAAQAAAAEAAABgAw==',
  volUp: 'AAAAAQAAAAEAAAASAw==',
  volDown: 'AAAAAQAAAAEAAAATAw==',
  mute: 'AAAAAQAAAAEAAAAUAw==',
  chUp: 'AAAAAQAAAAEAAAAQAw==',
  chDown: 'AAAAAQAAAAEAAAARAw==',
  play: 'AAAAAgAAAJcAAAAaAw==',
  pause: 'AAAAAgAAAJcAAAAZAw==',
  input: 'AAAAAQAAAAEAAAAlAw==',
  info: 'AAAAAQAAAAEAAAA6Aw==',
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
    } catch {}
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
    } catch {}
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

  return (
    <div className="app">
      <div className="remote">
        {/* Power */}
        <button
          className={`power-btn ${loading === 'power' ? 'active' : ''}`}
          onClick={togglePower}
          disabled={loading !== null}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        </button>

        {/* Top row */}
        <div className="top-row">
          <button className="func-btn" onClick={() => sendCommand('input')} disabled={loading !== null}>Input</button>
          <button className="func-btn" onClick={() => sendCommand('mute')} disabled={loading !== null}>Muto</button>
          <button className="func-btn" onClick={() => sendCommand('info')} disabled={loading !== null}>Info</button>
        </div>

        {/* D-Pad */}
        <div className="dpad">
          <div className="dpad-row">
            <div></div>
            <button className="dpad-btn" onClick={() => sendCommand('up')} disabled={loading !== null}>▲</button>
            <div></div>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onClick={() => sendCommand('left')} disabled={loading !== null}>◀</button>
            <button className="dpad-btn dpad-ok" onClick={() => sendCommand('ok')} disabled={loading !== null}>OK</button>
            <button className="dpad-btn" onClick={() => sendCommand('right')} disabled={loading !== null}>▶</button>
          </div>
          <div className="dpad-row">
            <div></div>
            <button className="dpad-btn" onClick={() => sendCommand('down')} disabled={loading !== null}>▼</button>
            <div></div>
          </div>
        </div>

        {/* Nav row */}
        <div className="nav-row">
          <button className="nav-btn" onClick={() => sendCommand('back')} disabled={loading !== null}>
            ← Indietro
          </button>
          <button className="nav-btn" onClick={() => sendCommand('home')} disabled={loading !== null}>
            Home
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

        {/* Number pad */}
        <div className="numpad">
          <button className="num-btn" onClick={() => sendCommand('num1')} disabled={loading !== null}>1</button>
          <button className="num-btn" onClick={() => sendCommand('num2')} disabled={loading !== null}>2</button>
          <button className="num-btn" onClick={() => sendCommand('num3')} disabled={loading !== null}>3</button>
          <button className="num-btn" onClick={() => sendCommand('num4')} disabled={loading !== null}>4</button>
          <button className="num-btn" onClick={() => sendCommand('num5')} disabled={loading !== null}>5</button>
          <button className="num-btn" onClick={() => sendCommand('num6')} disabled={loading !== null}>6</button>
          <button className="num-btn" onClick={() => sendCommand('num7')} disabled={loading !== null}>7</button>
          <button className="num-btn" onClick={() => sendCommand('num8')} disabled={loading !== null}>8</button>
          <button className="num-btn" onClick={() => sendCommand('num9')} disabled={loading !== null}>9</button>
          <div></div>
          <button className="num-btn" onClick={() => sendCommand('num0')} disabled={loading !== null}>0</button>
          <div></div>
        </div>

        {/* PIN section */}
        {showPinInput && (
          <div className="pin-section">
            <p className="pin-text">
              {authExpired ? 'Autenticazione scaduta. ' : ''}Inserisci il PIN mostrato sul TV
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
