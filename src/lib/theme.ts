import type { ThemeMode } from '../types'

export function resolveTheme(mode: ThemeMode, now = new Date()): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode
  const hour = now.getHours()
  return hour >= 6 && hour < 19 ? 'light' : 'dark'
}

export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode)
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themeMode = mode
}
