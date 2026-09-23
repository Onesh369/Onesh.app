import { useEffect, useRef, useState } from 'react'
import { LOCALES, useI18n, type Locale } from '../i18n'

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

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

  const choose = (id: Locale) => {
    setLocale(id)
    setOpen(false)
  }

  return (
    <div className="lang-picker" ref={wrapRef}>
      <button
        className="lang-picker-btn"
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('lang.switch', { label: t(`lang.${locale}`) })}
        onClick={() => setOpen((value) => !value)}
      >
        {t(`lang.${locale}`)}
        <Chevron open={open} />
      </button>
      {open ? (
        <ul className="lang-picker-menu" role="listbox" aria-label={t('lang.group')}>
          {LOCALES.map((id) => (
            <li key={id}>
              <button type="button" role="option" aria-selected={locale === id} onClick={() => choose(id)}>
                {t(`lang.${id}`)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? 'open' : ''}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
