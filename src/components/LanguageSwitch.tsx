import { LOCALES, useI18n, type Locale } from '../i18n'

const NEXT: Record<Locale, Locale> = {
  en: 'fr',
  fr: 'ar',
  ar: 'en',
}

const SHORT: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ar: 'ع',
}

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n()

  return (
    <>
      <div className="lang-switch" role="group" aria-label={t('lang.group')}>
        {LOCALES.map((id) => (
          <button
            key={id}
            type="button"
            className={`lang-btn ${locale === id ? 'active' : ''}`}
            onClick={() => setLocale(id)}
            aria-pressed={locale === id}
            title={t(`lang.${id}`)}
          >
            {SHORT[id]}
          </button>
        ))}
      </div>
      <button
        className="icon-btn lang-cycle"
        type="button"
        onClick={() => setLocale(NEXT[locale])}
        aria-label={t('lang.switch', { label: t(`lang.${locale}`) })}
        title={t(`lang.${locale}`)}
      >
        <LangGlyph />
      </button>
    </>
  )
}

function LangGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}
