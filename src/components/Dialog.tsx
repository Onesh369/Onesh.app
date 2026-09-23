import { type ReactNode, useEffect } from 'react'
import { useI18n } from '../i18n'
import { Logo } from './Logo'

type Props = {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Dialog({ title, children, onClose }: Props) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-head">
          <div>
            <div className="kicker with-logo">
              <Logo size={18} />
              {t('common.onesh')}
            </div>
            <h2>{title}</h2>
          </div>
          <button className="ghost" type="button" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
