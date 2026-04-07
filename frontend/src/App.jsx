import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleButtonClick = async () => {
    if (loading) return

    // Request notification permission if not granted
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

    // Schedule notification via service worker (works in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        title: 'Hello World!',
        body: 'Ecco il tuo messaggio!',
        delay: 5000,
      })
    }

    // Also show in-app after 5 seconds
    setTimeout(() => {
      setNotification('Hello World!')
      setLoading(false)
    }, 5000)
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
