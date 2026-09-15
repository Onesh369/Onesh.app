import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider, useAuth } from './auth.tsx'
import { AuthScreen } from './components/AuthScreen.tsx'
import { StoreProvider } from './store.tsx'
import './index.css'

function Root() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="app auth-app">
        <div className="auth-card">
          <div className="brand-mark">
            <span className="brand-dot" />
            Onesh 369
          </div>
          <h1>Opening.</h1>
          <p>Checking your account…</p>
        </div>
      </div>
    )
  }
  if (!user) return <AuthScreen />
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
)
