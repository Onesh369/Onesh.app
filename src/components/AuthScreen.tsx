import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { canSubmit, cleanUsername, emailHint, passwordHint, passwordScore, passwordScoreLabel, usernameHint } from '../lib/credentials'
import { hasLocalContent } from '../lib/storage'
import { readGuestTheme, readLastUsername, takeSessionExpired, writeGuestTheme, writeLastUsername } from '../lib/session'
import { ThemeSwitch } from './ThemeToggle'
import type { ThemeMode } from '../types'

export function AuthLayout({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readGuestTheme())

  return (
    <div className="auth-app">
      <header className="auth-top">
        <div className="brand-mark">
          <span className="brand-dot" />
          Onesh 369
        </div>
        <ThemeSwitch
          value={themeMode}
          onChange={(mode) => {
            setThemeMode(mode)
            writeGuestTheme(mode)
          }}
        />
      </header>
      {children}
    </div>
  )
}

export function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState(() => readLastUsername())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')
  const [expired] = useState(() => takeSessionExpired())
  const [busy, setBusy] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const isSignup = mode === 'signup'
  const localNote = isSignup && hasLocalContent()
  const userHint = usernameHint(username)
  const mailHint = emailHint(email)
  const passHint = passwordHint(password, isSignup ? confirm : undefined)
  const score = passwordScore(password)
  const ready = canSubmit(mode, username, password, confirm, email)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [mode])

  const story = useMemo(
    () =>
      isSignup
        ? {
            title: 'Begin quietly.',
            text: 'Create an account. Your habits, plan, and books will follow you — phone, computer, anywhere.',
          }
        : {
            title: 'Welcome back.',
            text: 'Sign in once. The same days, the same shelf, on every device you open.',
          },
    [isSignup],
  )

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready || busy) return
    setError('')
    setBusy(true)
    try {
      if (isSignup) await signup(username, email, password)
      else await login(username, password)
      writeLastUsername(username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setEmail('')
    setPassword('')
    setConfirm('')
    setError('')
    setShowPassword(false)
  }

  return (
    <AuthLayout>
      <div className="auth-shell">
        <aside className="auth-story">
          <p className="kicker">Kept on your account</p>
          <h1>{story.title}</h1>
          <p>{story.text}</p>
          <ul className="auth-points">
            <li>One username. Every device.</li>
            <li>Habits, plan, and reading stay in sync.</li>
            <li>Your data lives on this Onesh server.</li>
          </ul>
        </aside>

        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="auth-tabs" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={!isSignup ? 'active' : ''}
              onClick={() => switchMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={isSignup ? 'active' : ''}
              onClick={() => switchMode('signup')}
            >
              Create account
            </button>
          </div>

          <h2 id="auth-heading">{isSignup ? 'Create account' : 'Sign in'}</h2>
          <p className="auth-lead">
            {isSignup
              ? 'Choose a username you can remember. You will use it on your phone and your computer.'
              : 'Use the same username and password you created on any other device.'}
          </p>

          {expired ? (
            <p className="auth-banner" role="status">
              Your session ended. Sign in again to keep going.
            </p>
          ) : null}

          {localNote ? (
            <p className="auth-banner auth-banner-soft" role="status">
              The data already on this device will move into this new account.
            </p>
          ) : null}

          <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
            <div className="field wide">
              <label htmlFor="auth-username">Username</label>
              <input
                ref={usernameRef}
                id="auth-username"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                maxLength={24}
                name="username"
                onChange={(event) => setUsername(cleanUsername(event.target.value))}
                placeholder="your_name"
                required
                value={username}
                aria-invalid={Boolean(username) && Boolean(userHint)}
                aria-describedby="auth-username-hint"
              />
              <span
                id="auth-username-hint"
                className={`auth-hint ${username && userHint ? 'warn' : username && !userHint ? 'ok' : ''}`}
              >
                {userHint || (username ? 'Looks good' : '3–24 letters, numbers, or _')}
              </span>
            </div>

            {isSignup ? (
              <div className="field wide">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  maxLength={255}
                  name="email"
                  onChange={(event) => setEmail(event.target.value.trim())}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                  aria-invalid={Boolean(email) && Boolean(mailHint)}
                  aria-describedby="auth-email-hint"
                />
                <span
                  id="auth-email-hint"
                  className={`auth-hint ${email && mailHint ? 'warn' : email && !mailHint ? 'ok' : ''}`}
                >
                  {mailHint || (email ? 'Looks good' : 'Your email address')}
                </span>
              </div>
            ) : null}

            <div className="field wide">
              <label htmlFor="auth-password">Password</label>
              <div className="field-input">
                <input
                  id="auth-password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  enterKeyHint={isSignup ? 'next' : 'go'}
                  minLength={8}
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  placeholder="At least 8 characters"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  aria-describedby="auth-password-hint"
                />
                <button
                  className="field-eye"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {isSignup && password ? (
                <div className="auth-strength" aria-hidden="true">
                  <span className={score > 0 ? 'on' : ''} />
                  <span className={score > 1 ? 'on' : ''} />
                  <span className={score > 2 ? 'on' : ''} />
                  <span className={score > 3 ? 'on' : ''} />
                  <em>{passwordScoreLabel(score)}</em>
                </div>
              ) : null}
              <span
                id="auth-password-hint"
                className={`auth-hint ${capsLock || (password && passHint) ? 'warn' : password && !passHint ? 'ok' : ''}`}
              >
                {capsLock ? 'Caps Lock is on' : passHint || (password ? 'Looks good' : 'At least 8 characters')}
              </span>
            </div>

            {isSignup ? (
              <div className="field wide">
                <label htmlFor="auth-confirm">Confirm password</label>
                <input
                  id="auth-confirm"
                  autoComplete="new-password"
                  enterKeyHint="go"
                  minLength={8}
                  name="confirm"
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Type it once more"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                />
              </div>
            ) : null}

            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="primary" disabled={busy || !ready} type="submit">
              {busy ? (isSignup ? 'Creating your account…' : 'Signing you in…') : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </AuthLayout>
  )
}
