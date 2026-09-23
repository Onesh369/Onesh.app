import { useI18n } from '../i18n'

const INSTAGRAM = 'https://www.instagram.com/onesh.369/'
const FACEBOOK = 'https://www.facebook.com/onesh.369'

export function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="site-footer">
      <p className="site-copy" dir="ltr">
        {t('footer.year')} <bdi>{t('footer.brand')}</bdi> — <bdi>{t('footer.rights')}</bdi>
      </p>
      <div className="site-social">
        <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <FacebookIcon />
        </a>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <InstagramIcon />
        </a>
      </div>
    </footer>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.5 8.5V6.8c0-.7.5-1.1 1.2-1.1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9V11h2v10h3.5V11h2.3l.4-2.5h-2.7z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
    </svg>
  )
}
