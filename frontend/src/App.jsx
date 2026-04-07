import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [tvLoading, setTvLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [permission, setPermission] = useState('default')
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState('')
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleButtonClick = async () => {
    if (loading) return

    if ('Notification' in window && Notification.permission !== 'granted') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        setNotification('Concedi le notifiche per ricevere il messaggio!')
        return
      }
    }

    setLoading(true)
    setNotification(null)

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title: 'Hello World!',
        body: 'Ecco il tuo messaggio!',
        delay: 5000,
      })
    }

    setTimeout(() => {
      setNotification('Hello World!')
      setLoading(false)
    }, 5000)
  }

  const handleTvPower = async () => {
    if (tvLoading) return
    setTvLoading(true)
    setNotification(null)

    try {
      const res = await fetch('/api/tv/power', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setNotification(data.turnedOn ? 'TV accesa!' : 'TV spenta!')
      } else if (res.status === 401) {
        setShowPinInput(true)
        setNotification('Autenticazione scaduta. Registrati di nuovo.')
      } else {
        setNotification('Errore: ' + data.error)
      }
    } catch {
      setNotification('Impossibile raggiungere il server')
    } finally {
      setTvLoading(false)
    }
  }

  const handleRequestPin = async () => {
    setRegistering(true)
    try {
      await fetch('/api/tv/pin', { method: 'POST' })
      setNotification('PIN mostrato sul TV! Inseriscilo qui sotto.')
    } catch {
      setNotification('Impossibile raggiungere il TV')
    } finally {
      setRegistering(false)
    }
  }

  const handleRegisterPin = async () => {
    if (!pin) return
    setRegistering(true)
    try {
      const res = await fetch(`/api/tv/register?pin=${pin}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setShowPinInput(false)
        setPin('')
        setNotification('TV registrato! Ora puoi usare il pulsante.')
      } else {
        setNotification('PIN non valido. Riprova.')
      }
    } catch {
      setNotification('Errore di connessione')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Hello World App</h1>
        <p className="subtitle">Premi il pulsante per ricevere un messaggio</p>

        {permission === 'denied' && (
          <p className="warning">
            Le notifiche sono bloccate. Abilitale dalle impostazioni del browser.
          </p>
        )}

        <button
          className={`btn ${loading ? 'loading' : ''}`}
          onClick={handleButtonClick}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-content">
              <span className="spinner"></span>
              Attendi 5 secondi...
            </span>
          ) : (
            'Salutami!'
          )}
        </button>

        <div className="divider"></div>

        <button
          className={`btn btn-tv ${tvLoading ? 'loading' : ''}`}
          onClick={handleTvPower}
          disabled={tvLoading}
        >
          {tvLoading ? (
            <span className="btn-content">
              <span className="spinner"></span>
              Invio...
            </span>
          ) : (
            <span className="btn-content">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
              Accendi / Spegni TV
            </span>
          )}
        </button>

        {showPinInput && (
          <div className="pin-section">
            <p className="pin-text">Il PIN e' mostrato sul TV</p>
            <div className="pin-row">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Inserisci PIN"
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

        {notification && (
          <div className="notification">
            <span className="notification-icon">&#128276;</span>
            {notification}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
