import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth'
import { getSyncStatus, subscribeSync, type SyncStatus } from '../lib/sync'

const SYNC_COPY: Record<SyncStatus, string> = {
  idle: 'Ready on this device',
  saving: 'Saving to your account…',
  saved: 'Saved to your account',
  error: 'Could not save. Will retry on the next change.',
}

export function AccountMenu() {
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
        <div className="account-menu" role="dialog" aria-label="Account">
          <div className="account-menu-head">
            <span className="account-avatar lg" aria-hidden="true">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.username}</strong>
              <p className={sync === 'error' ? 'warn' : ''}>{SYNC_COPY[sync]}</p>
            </div>
          </div>
          <p>Open onesh.online on another phone or computer and sign in with this username to see the same data.</p>
          <button className="ghost" disabled={busy} type="button" onClick={() => void onLogout()}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
