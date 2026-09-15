import { useState } from 'react'
import { useAuth } from '../auth'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!user) return null

  const onLogout = async () => {
    setBusy(true)
    await logout()
  }

  return (
    <div className="account-wrap">
      <button className="account-chip" type="button" onClick={() => setOpen((value) => !value)}>
        {user.username}
      </button>
      {open ? (
        <div className="account-menu">
          <p>Signed in as {user.username}. Data syncs with this account.</p>
          <button className="ghost" disabled={busy} type="button" onClick={() => void onLogout()}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
