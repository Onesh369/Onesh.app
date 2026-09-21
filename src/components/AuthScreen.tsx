import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { useI18n, type Translate } from '../i18n'
import { canSubmit, cleanUsername, EMAIL_PATTERN, passwordScore, USERNAME_PATTERN } from '../lib/credentials'
import { hasLocalContent } from '../lib/storage'
import { readGuestTheme, readLastUsername, takeSessionExpired, writeGuestTheme, writeLastUsername } from '../lib/session'
import { LanguageSwitch } from './LanguageSwitch'
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
        <div className="mast-actions">
          <LanguageSwitch />
          <ThemeSwitch
            value={themeMode}
            onChange={(mode) => {
              setThemeMode(mode)
              writeGuestTheme(mode)
            }}
          />
        </div>
      </header>
      {children}
    </div>
  )
}

function usernameHintText(value: string, t: Translate) {
  if (!value) return t('auth.usernameRule')
  if (value.length < 3) return value.length === 2 ? t('auth.usernameShortOne') : t('auth.usernameShort', { n: 3 - value.length })
  if (!USERNAME_PATTERN.test(value)) return t('auth.usernameInvalid')
  return ''
}

function emailHintText(value: string, t: Translate) {
  if (!value) return t('auth.emailEmpty')
  if (!EMAIL_PATTERN.test(value)) return t('auth.emailInvalid')
  return ''
}

function passwordHintText(value: string, t: Translate, confirm?: string) {
  if (!value) return t('auth.passwordRule')
  if (value.length < 8) return t('auth.passwordShort', { n: 8 - value.length })
  if (confirm !== undefined && confirm.length > 0 && confirm !== value) return t('auth.passwordMismatch')
  return ''
}

function strengthLabel(score: number, t: Translate) {
  if (score <= 1) return t('auth.strengthKeep')
  if (score === 2) return t('auth.strengthOkay')
  if (score === 3) return t('auth.strengthStrong')
  return t('auth.strengthSolid')
}

export function AuthScreen() {
  const { login, signup } = useAuth()
  const { t, translateError } = useI18n()
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
  const userHint = usernameHintText(username, t)
  const mailHint = emailHintText(email, t)
  const passHint = passwordHintText(password, t, isSignup ? confirm : undefined)
  const score = passwordScore(password)
  const ready = canSubmit(mode, username, password, confirm, email)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [mode])

  const story = useMemo(
    () =>
      isSignup
        ? {
            title: t('auth.signupTitle'),
            text: t('auth.signupText'),
          }
        : {
            title: t('auth.signinTitle'),
            text: t('auth.signinText'),
          },
    [isSignup, t],
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
      setError(err instanceof Error ? translateError(err.message) : t('auth.genericError'))
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
          <p className="kicker">{t('auth.kicker')}</p>
          <h1>{story.title}</h1>
          <p>{story.text}</p>
          <ul className="auth-points">
            <li>{t('auth.point1')}</li>
            <li>{t('auth.point2')}</li>
            <li>{t('auth.point3')}</li>
          </ul>
        </aside>

        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="auth-tabs" role="tablist" aria-label={t('auth.tabs')}>
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={!isSignup ? 'active' : ''}
              onClick={() => switchMode('signin')}
            >
              {t('auth.signIn')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={isSignup ? 'active' : ''}
              onClick={() => switchMode('signup')}
            >
              {t('auth.createAccount')}
            </button>
          </div>

          <h2 id="auth-heading">{isSignup ? t('auth.createAccount') : t('auth.signIn')}</h2>
          <p className="auth-lead">{isSignup ? t('auth.signupLead') : t('auth.signinLead')}</p>

          {expired ? (
            <p className="auth-banner" role="status">
              {t('auth.sessionEnded')}
            </p>
          ) : null}

          {localNote ? (
            <p className="auth-banner auth-banner-soft" role="status">
              {t('auth.localMove')}
            </p>
          ) : null}

          <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
            <div className="field wide">
              <label htmlFor="auth-username">{t('auth.username')}</label>
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
                placeholder={t('auth.usernamePlaceholder')}
                required
                value={username}
                aria-invalid={Boolean(username) && Boolean(userHint)}
                aria-describedby="auth-username-hint"
              />
              <span
                id="auth-username-hint"
                className={`auth-hint ${username && userHint ? 'warn' : username && !userHint ? 'ok' : ''}`}
              >
                {userHint || (username ? t('auth.looksGood') : t('auth.usernameRule'))}
              </span>
            </div>

            {isSignup ? (
              <div className="field wide">
                <label htmlFor="auth-email">{t('auth.email')}</label>
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
                  placeholder={t('auth.emailPlaceholder')}
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
                  {mailHint || (email ? t('auth.looksGood') : t('auth.emailEmpty'))}
                </span>
              </div>
            ) : null}

            <div className="field wide">
              <label htmlFor="auth-password">{t('auth.password')}</label>
              <div className="field-input">
                <input
                  id="auth-password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  enterKeyHint={isSignup ? 'next' : 'go'}
                  minLength={8}
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  aria-describedby="auth-password-hint"
                />
                <button
                  className="field-eye"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? t('auth.hide') : t('auth.show')}
                </button>
              </div>
              {isSignup && password ? (
                <div className="auth-strength" aria-hidden="true">
                  <span className={score > 0 ? 'on' : ''} />
                  <span className={score > 1 ? 'on' : ''} />
                  <span className={score > 2 ? 'on' : ''} />
                  <span className={score > 3 ? 'on' : ''} />
                  <em>{strengthLabel(score, t)}</em>
                </div>
              ) : null}
              <span
                id="auth-password-hint"
                className={`auth-hint ${capsLock || (password && passHint) ? 'warn' : password && !passHint ? 'ok' : ''}`}
              >
                {capsLock
                  ? t('auth.capsLock')
                  : passHint || (password ? t('auth.looksGood') : t('auth.passwordRule'))}
              </span>
            </div>

            {isSignup ? (
              <div className="field wide">
                <label htmlFor="auth-confirm">{t('auth.confirm')}</label>
                <input
                  id="auth-confirm"
                  autoComplete="new-password"
                  enterKeyHint="go"
                  minLength={8}
                  name="confirm"
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder={t('auth.confirmPlaceholder')}
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
              {busy
                ? isSignup
                  ? t('auth.creating')
                  : t('auth.signingIn')
                : isSignup
                  ? t('auth.createAccount')
                  : t('auth.signIn')}
            </button>
          </form>
        </section>
      </div>
    </AuthLayout>
  )
}
