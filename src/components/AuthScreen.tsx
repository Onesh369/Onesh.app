import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'

export function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isSignup = mode === 'signup'

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) await signup(username.trim(), password)
      else await login(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app auth-app">
      <div className="auth-card">
        <div className="brand-mark">
          <span className="brand-dot" />
          Onesh 369
        </div>
        <h1>{isSignup ? 'Create account.' : 'Welcome back.'}</h1>
        <p>
          {isSignup
            ? 'Pick a username and password. Your habits, plan, and books will follow you on any phone or computer.'
            : 'Sign in to open your synced habits, daily plan, and reading shelf.'}
        </p>

        <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
          <div className="field wide">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              minLength={3}
              maxLength={24}
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              pattern="[A-Za-z0-9_]+"
              placeholder="your_name"
              required
              value={username}
            />
          </div>
          <div className="field wide">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              type="password"
              value={password}
            />
          </div>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="primary" disabled={busy} type="submit">
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(isSignup ? 'signin' : 'signup')
            setError('')
          }}
        >
          {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </div>
    </div>
  )
}
