import { useStore } from '../store'
import type { ThemeMode } from '../types'

const MODES: { id: ThemeMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Night' },
]

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useStore()

  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          className={`theme-btn ${themeMode === mode.id ? 'active' : ''}`}
          onClick={() => setThemeMode(mode.id)}
          type="button"
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
