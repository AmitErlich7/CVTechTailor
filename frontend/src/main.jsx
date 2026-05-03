import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { setTokenProvider } from './services/api.js'
import { AppAuthProvider, useAppAuth } from './services/appAuth.jsx'

// TokenBridge wires the Firebase getToken function into the API service layer.
function TokenBridge({ children }) {
  const { getToken } = useAppAuth()

  useEffect(() => {
    setTokenProvider(() => getToken())
  }, [getToken])

  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppAuthProvider>
      <TokenBridge>
        <App />
      </TokenBridge>
    </AppAuthProvider>
  </React.StrictMode>,
)
