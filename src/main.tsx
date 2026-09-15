import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider, useAuth } from './auth.tsx'
import { AuthLayout, AuthScreen } from './components/AuthScreen.tsx'
import { StoreProvider } from './store.tsx'
import './index.css'

function Root() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <AuthLayout>
        <div className="auth-shell">
          <aside className="auth-story">
            <p className="kicker">Onesh 369</p>
            <h1>Opening.</h1>
            <p>Checking for a signed-in account…</p>
          </aside>
          <section className="auth-card auth-card-loading">
            <div className="auth-skeleton" />
            <div className="auth-skeleton short" />
            <div className="auth-skeleton" />
          </section>
        </div>
      </AuthLayout>
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
