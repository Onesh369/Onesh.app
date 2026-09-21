import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { getSyncStatus, subscribeSync, type SyncStatus } from '../lib/sync'

const SYNC_KEYS: Record<SyncStatus, 'account.syncIdle' | 'account.syncSaving' | 'account.syncSaved' | 'account.syncError'> = {
  idle: 'account.syncIdle',
  saving: 'account.syncSaving',
  saved: 'account.syncSaved',
  error: 'account.syncError',
}

export function AccountMenu() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sync, setSync] = useState<SyncStatus>(getSyncStatus)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => subscribeSync(setSync), [])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const onLogout = async () => {
    setBusy(true)
    await logout()
  }

  return (
    <div className="account-wrap" ref={wrapRef}>
      <button
        className="account-chip"
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar" aria-hidden="true">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <span className="account-name">{user.username}</span>
      </button>
      {open ? (
        <div className="account-menu" role="dialog" aria-label={t('account.menu')}>
          <div className="account-menu-head">
            <span className="account-avatar lg" aria-hidden="true">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.username}</strong>
              <p className={sync === 'error' ? 'warn' : ''}>{t(SYNC_KEYS[sync])}</p>
            </div>
          </div>
          <p>{t('account.hint')}</p>
          <button className="ghost" disabled={busy} type="button" onClick={() => void onLogout()}>
            {busy ? t('account.signingOut') : t('account.signOut')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
