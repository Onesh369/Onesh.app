import { useMemo } from 'react'
import { useI18n } from '../../i18n'
import { formatShort, isToday, lastNDays, todayISO, weekdayLabel, yearOf } from '../../lib/dates'
import {
  avgPagesPerDay,
  bestDay,
  lastNDaysPages,
  pagesInRange,
  pagesOnDate,
  readingStreak,
  recentEntries,
  totalPages,
} from '../../lib/reading'
import { useStore } from '../../store'

export function ReadingStats() {
  const { t, locale, localeTag } = useI18n()
  const { books, readingLog } = useStore()
  const today = todayISO()
  const year = yearOf(today)

  const model = useMemo(() => {
    const week = lastNDays(today, 7)
    const weekDays = lastNDaysPages(readingLog, today, 7)
    const maxWeek = Math.max(1, ...weekDays.map((day) => day.pages))
    const yearStart = `${year}-01-01`
    const finishedYear = books.filter(
      (book) => book.status === 'read' && book.dateFinish.startsWith(String(year)),
    ).length
    return {
      pagesToday: pagesOnDate(readingLog, today),
      streak: readingStreak(readingLog, today),
      avgDay: avgPagesPerDay(readingLog),
      pagesWeek: pagesInRange(readingLog, week[0], today),
      pagesYear: pagesInRange(readingLog, yearStart, `${year}-12-31`),
      total: totalPages(readingLog),
      best: bestDay(readingLog),
      finishedYear,
      weekDays,
      maxWeek,
      recent: recentEntries(readingLog, books, 6),
    }
  }, [books, readingLog, today, year])

  const hasLog = readingLog.length > 0

  return (
    <aside className="panel reading-stats">
      <div className="section-head">
        <div>
          <div className="kicker">{t('common.pulse')}</div>
          <h2>{t('reading.stats')}</h2>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat accent-gold">
          <b>{model.pagesToday}</b>
          <span>{t('reading.pagesToday')}</span>
        </div>
        <div className="stat accent-blue">
          <b>{model.streak}</b>
          <span>{t('reading.dayStreak')}</span>
        </div>
        <div className="stat">
          <b>{model.avgDay}</b>
          <span>{t('reading.avgDay')}</span>
        </div>
      </div>

      <div className="reading-bars-head">
        <span className="kicker">{t('reading.last7')}</span>
        <span className="streak">{t('reading.pagesCount', { n: model.pagesWeek })}</span>
      </div>
      <div className="bars reading-bars" aria-label={t('reading.weekBars')}>
        {model.weekDays.map((day) => {
          const height = day.pages > 0 ? Math.max(10, (day.pages / model.maxWeek) * 104) : 6
          return (
            <div key={day.date} className="bar" title={t('reading.pagesCount', { n: day.pages })}>
              <b className="bar-value">{day.pages > 0 ? day.pages : ''}</b>
              <i
                style={{ height: `${height}px`, opacity: day.pages > 0 ? 1 : 0.35 }}
                className={isToday(day.date) ? 'bar-today' : ''}
              />
              <span>{weekdayLabel(day.date, locale)}</span>
            </div>
          )
        })}
      </div>

      <div className="stat-grid" style={{ marginTop: 4 }}>
        <div className="stat">
          <b>{model.pagesYear}</b>
          <span>{t('reading.pagesInYear', { year })}</span>
        </div>
        <div className="stat">
          <b>{model.finishedYear}</b>
          <span>{t('reading.finishedYear', { year })}</span>
        </div>
        <div className="stat">
          <b>{model.best ? model.best.pages : 0}</b>
          <span>{t('reading.bestDay')}</span>
        </div>
      </div>

      <div className="reading-log">
        <div className="reading-bars-head">
          <span className="kicker">{t('reading.recent')}</span>
          {model.total > 0 ? <span className="streak">{t('reading.pagesTotal', { n: model.total })}</span> : null}
        </div>
        {hasLog ? (
          <ul className="log-list">
            {model.recent.map((entry) => (
              <li key={entry.id} className="log-row">
                <span className="log-pages">+{entry.pages}</span>
                <span className="log-title">{entry.title}</span>
                <span className="log-date">{isToday(entry.date) ? t('common.today') : formatShort(entry.date, localeTag)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reading-empty-hint">
            {t('reading.emptyHint')}
          </p>
        )}
      </div>
    </aside>
  )
}
