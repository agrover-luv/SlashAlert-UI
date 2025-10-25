import { useState, useEffect, useRef } from 'react'

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const googleButtonRef = useRef(null)

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const handleCredentialResponse = (response) => {
    try {
      addLog('✅ Google credential received!')
      addLog(`Credential length: ${response.credential?.length || 0}`)
      
      // Parse JWT to get user info
      const base64Url = response.credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      const userInfo = JSON.parse(jsonPayload)
      addLog(`✅ User authenticated: ${userInfo.email}`)
      setUser(userInfo)
      setError(null)
    } catch (err) {
      addLog(`❌ Error processing credential: ${err.message}`)
      setError(err.message)
    }
  }

  useEffect(() => {
    addLog('🚀 Starting Google OAuth initialization...')
    addLog(`Current Origin: ${window.location.origin}`)
    
    const initializeGoogle = () => {
      if (!window.google) {
        addLog('📚 Loading Google Identity Services script...')
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          addLog('✅ Google script loaded successfully')
          setupGoogleAuth()
        }
        script.onerror = () => {
          addLog('❌ Failed to load Google script')
          setError('Failed to load Google Identity Services')
        }
        document.head.appendChild(script)
      } else {
        addLog('📚 Google script already loaded')
        setupGoogleAuth()
      }
    }

    const setupGoogleAuth = () => {
      // Your client ID
      const clientId = '208621379401-mundn85bk9cbgmarea2esilgi8e8vqhj.apps.googleusercontent.com'
      addLog(`🔑 Using Client ID: ${clientId}`)
      
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false
        })
        
        addLog('✅ Google OAuth initialized successfully')
        
        // Render the sign-in button
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'sign_in_with',
            shape: 'rectangular'
          })
          addLog('✅ Google Sign-In button rendered')
        }
      } catch (err) {
        addLog(`❌ Error initializing Google OAuth: ${err.message}`)
        setError(err.message)
      }
    }

    initializeGoogle()
  }, [])

  const handleSignOut = () => {
    setUser(null)
    setError(null)
    addLog('👋 User signed out')
    
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔐 Google OAuth Test</h1>
      <p><strong>Origin:</strong> {window.location.origin}</p>
      
      {!user ? (
        <div>
          <h2>Sign In</h2>
          <div ref={googleButtonRef} style={{ marginBottom: '20px' }}></div>
          {error && (
            <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>✅ Signed In Successfully!</h2>
          <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Picture:</strong> <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} /></p>
            <p><strong>Email Verified:</strong> {user.email_verified ? '✅' : '❌'}</p>
          </div>
          <button onClick={handleSignOut} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Debug Logs</h3>
          <button onClick={clearLogs} style={{ padding: '5px 10px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
            Clear Logs
          </button>
        </div>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px', 
          fontFamily: 'monospace', 
          fontSize: '12px',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #ddd'
        }}>
          {logs.length === 0 ? (
            <p style={{ color: '#666', margin: 0 }}>No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h4>⚠️ Important Notes:</h4>
        <ul>
          <li>This test uses the same Google Client ID as your main app</li>
          <li>Make sure <code>http://localhost:5173</code> is added to your Google Cloud Console authorized origins</li>
          <li>If this works but your main app doesn't, the issue is in your main app's code</li>
          <li>If this doesn't work, the issue is with your Google Cloud Console configuration</li>
        </ul>
      </div>
    </div>
  )
}

export default App