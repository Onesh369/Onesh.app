import { useState } from 'react'
import { HabitsPage } from './components/habits/HabitsPage'
import { PlanPage } from './components/plan/PlanPage'
import { ReadingPage } from './components/reading/ReadingPage'
import { ThemeToggle } from './components/ThemeToggle'
import type { Page } from './types'

const COPY: Record<Page, { title: string; text: string }> = {
  habits: {
    title: 'Habits.',
    text: 'One tap a day. Calendar, streaks, and a quiet pulse of your week, month, and year.',
  },
  plan: {
    title: 'Plan.',
    text: 'A daily list. Check off what is done. Send the rest to tomorrow.',
  },
  reading: {
    title: 'Reading.',
    text: 'A shelf for what you are reading: pages, progress, genre, and the dates that matter.',
  },
}

export default function App() {
  const [page, setPage] = useState<Page>('habits')
  const copy = COPY[page]

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <div className="brand-mark">
            <span className="brand-dot" />
            Onesh 369
          </div>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
        </div>
        <div className="mast-actions">
          <nav className="nav" aria-label="Main">
            <button type="button" className={page === 'habits' ? 'active' : ''} onClick={() => setPage('habits')}>
              Habits
            </button>
            <button type="button" className={page === 'plan' ? 'active' : ''} onClick={() => setPage('plan')}>
              Plan
            </button>
            <button type="button" className={page === 'reading' ? 'active' : ''} onClick={() => setPage('reading')}>
              Reading
            </button>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {page === 'habits' ? <HabitsPage /> : page === 'plan' ? <PlanPage /> : <ReadingPage />}
    </div>
  )
}
