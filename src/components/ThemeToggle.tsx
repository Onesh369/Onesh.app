import { useI18n } from '../i18n'
import { useStore } from '../store'
import type { ThemeMode } from '../types'

const MODE_IDS: ThemeMode[] = ['auto', 'light', 'dark']

const NEXT: Record<ThemeMode, ThemeMode> = {
  auto: 'light',
  light: 'dark',
  dark: 'auto',
}

export function ThemeSwitch({
  value,
  onChange,
}: {
  value: ThemeMode
  onChange: (mode: ThemeMode) => void
}) {
  const { t } = useI18n()
  const currentLabel = t(`theme.${value}`)
  return (
    <>
      <div className="theme-switch" role="group" aria-label={t('theme.group')}>
        {MODE_IDS.map((id) => (
          <button
            key={id}
            className={`theme-btn ${value === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
            type="button"
          >
            {t(`theme.${id}`)}
          </button>
        ))}
      </div>
      <button
        className="icon-btn theme-cycle"
        type="button"
        onClick={() => onChange(NEXT[value])}
        aria-label={t('theme.switch', { label: currentLabel })}
        title={currentLabel}
      >
        <ThemeGlyph mode={value} />
      </button>
    </>
  )
}

function ThemeGlyph({ mode }: { mode: ThemeMode }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (mode === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  }
  if (mode === 'dark') {
    return (
      <svg {...common}>
        <path d="M15.5 4.5A7.5 7.5 0 1 0 19.5 15 6 6 0 0 1 15.5 4.5z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5A8.5 8.5 0 0 1 12 20.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useStore()
  return <ThemeSwitch value={themeMode} onChange={setThemeMode} />
}
