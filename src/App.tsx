import { useEffect, useState } from 'react'
import { AccountMenu } from './components/AccountMenu'
import { Logo } from './components/Logo'
import { HabitsPage } from './components/habits/HabitsPage'
import { LanguageSwitch } from './components/LanguageSwitch'
import { PlanPage } from './components/plan/PlanPage'
import { ReadingPage } from './components/reading/ReadingPage'
import { SiteFooter } from './components/SiteFooter'
import { ThemeToggle } from './components/ThemeToggle'
import { useI18n } from './i18n'
import { readLastPage, writeLastPage } from './lib/session'
import type { Page } from './types'

const PAGE_IDS: Page[] = ['habits', 'plan', 'reading']

export default function App() {
  const { t } = useI18n()
  const [page, setPage] = useState<Page>(() => readLastPage())
  const copy = {
    title: t(`pages.${page}.title`),
    text: t(`pages.${page}.text`),
  }

  const go = (next: Page) => {
    setPage(next)
    writeLastPage(next)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  return (
    <div className="app">
      <header className="masthead">
        <div className="mast-top">
          <div className="brand-mark">
            <Logo size={30} />
            Onesh 369
          </div>
          <div className="mast-actions">
            <nav className="nav nav-desktop" aria-label={t('nav.main')}>
              {PAGE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={page === id ? 'active' : ''}
                  aria-current={page === id ? 'page' : undefined}
                  onClick={() => go(id)}
                >
                  {t(`nav.${id}`)}
                </button>
              ))}
            </nav>
            <LanguageSwitch />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
        <div className="brand">
          <h1>{copy.title}</h1>
          <p className="brand-lead">{copy.text}</p>
        </div>
      </header>

      <main className="page-in" key={page}>
        {page === 'habits' ? <HabitsPage /> : page === 'plan' ? <PlanPage /> : <ReadingPage />}
      </main>

      <SiteFooter />

      <nav className="tab-bar" aria-label={t('nav.pages')}>
        {PAGE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={page === id ? 'active' : ''}
            aria-current={page === id ? 'page' : undefined}
            onClick={() => go(id)}
          >
            <TabIcon page={id} />
            {t(`nav.${id}`)}
          </button>
        ))}
      </nav>
    </div>
  )
}

function TabIcon({ page }: { page: Page }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (page === 'habits') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.2 12.2 10.8 14.8 16 9.4" />
      </svg>
    )
  }
  if (page === 'plan') {
    return (
      <svg {...common}>
        <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
        <path d="M8 8.5h8M8 12.5h8M8 16.5h5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20" />
      <path d="M6.2 3.5H20V20.5H6.2A2.2 2.2 0 0 1 4 18.3V5.7A2.2 2.2 0 0 1 6.2 3.5z" />
    </svg>
  )
}
