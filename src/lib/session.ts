import { LAST_PAGE_KEY, LAST_USERNAME_KEY, THEME_MODE_KEY } from '../constants'
import type { Page, ThemeMode } from '../types'
import { applyTheme } from '../lib/theme'

export function readGuestTheme(): ThemeMode {
  const mode = localStorage.getItem(THEME_MODE_KEY)
  return mode === 'light' || mode === 'dark' || mode === 'auto' ? mode : 'auto'
}

export function writeGuestTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_MODE_KEY, mode)
  applyTheme(mode)
}

export function readLastUsername() {
  return localStorage.getItem(LAST_USERNAME_KEY) ?? ''
}

export function writeLastUsername(username: string) {
  localStorage.setItem(LAST_USERNAME_KEY, username)
}

export function takeSessionExpired() {
  const expired = sessionStorage.getItem('onesh-session-expired') === '1'
  if (expired) sessionStorage.removeItem('onesh-session-expired')
  return expired
}

export function markSessionExpired() {
  sessionStorage.setItem('onesh-session-expired', '1')
}

export function readLastPage(): Page {
  try {
    const value = localStorage.getItem(LAST_PAGE_KEY)
    return value === 'plan' || value === 'reading' || value === 'habits' ? value : 'habits'
  } catch {
    return 'habits'
  }
}

export function writeLastPage(page: Page) {
  try {
    localStorage.setItem(LAST_PAGE_KEY, page)
  } catch {
    /* ignore quota / private mode */
  }
}
