import { useStore } from '../store'
import type { ThemeMode } from '../types'

const MODES: { id: ThemeMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Night' },
]

export function ThemeSwitch({
  value,
  onChange,
}: {
  value: ThemeMode
  onChange: (mode: ThemeMode) => void
}) {
  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          className={`theme-btn ${value === mode.id ? 'active' : ''}`}
          onClick={() => onChange(mode.id)}
          type="button"
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useStore()
  return <ThemeSwitch value={themeMode} onChange={setThemeMode} />
}
