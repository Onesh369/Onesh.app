import type { StatRange } from '../../types'
import { useI18n, type MessageKey } from '../../i18n'
import {
  addMonths,
  formatMonthYear,
  lastNDays,
  monthGrid,
  weekdayIndex,
  weekdayLabel,
  yearDays,
  yearOf,
} from '../../lib/dates'
import { averageRate, bestStreak, doneCount, monthDates, rateForDay } from '../../lib/habits'
import { useStore } from '../../store'
import { HabitCalendar } from './HabitCalendar'

type Props = {
  selected: string
  range: StatRange
  onRange: (range: StatRange) => void
  onSelect: (date: string) => void
}

const RANGES: StatRange[] = ['day', 'week', 'month', 'year']

export function HabitStats({ selected, range, onRange, onSelect }: Props) {
  const { t, locale, localeTag } = useI18n()
  const { habits, completions, streak } = useStore()
  const week = lastNDays(selected, 7)
  const month = monthDates(selected)
  const year = yearDays(yearOf(selected))
  const dayRate = rateForDay(habits, completions, selected)
  const weekRate = averageRate(week, habits, completions)
  const monthRate = averageRate(month, habits, completions)
  const yearRate = averageRate(year, habits, completions)
  const topStreak = habits.reduce(
    (best, habit) => Math.max(best, streak(habit.id), bestStreak(completions[habit.id] ?? [])),
    0,
  )

  const headline =
    range === 'day' ? dayRate : range === 'week' ? weekRate : range === 'month' ? monthRate : yearRate

  return (
    <aside className="panel">
      <div className="section-head">
        <div>
          <div className="kicker">{t('common.pulse')}</div>
          <h2>{t('habits.stats')}</h2>
        </div>
        {range === 'month' || range === 'year' ? (
          <div className="date-nav">
            <button
              className="icon-btn"
              type="button"
              onClick={() => onSelect(range === 'year' ? addMonths(selected, -12) : addMonths(selected, -1))}
              aria-label={t('common.previous')}
            >
              ‹
            </button>
            <span className="streak">{range === 'year' ? yearOf(selected) : formatMonthYear(selected, localeTag)}</span>
            <button
              className="icon-btn"
              type="button"
              onClick={() => onSelect(range === 'year' ? addMonths(selected, 12) : addMonths(selected, 1))}
              aria-label={t('common.next')}
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      <div className="stats-tabs">
        {RANGES.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${range === id ? 'active' : ''}`}
            onClick={() => onRange(id)}
          >
            {t(`habits.${id}`)}
          </button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat">
          <b>{Math.round(headline * 100)}%</b>
          <span>{t(`habits.${range}Done` as MessageKey)}</span>
        </div>
        <div className="stat">
          <b>
            {doneCount(habits, completions, selected)}/{habits.length || 0}
          </b>
          <span>{t('habits.thisDay')}</span>
        </div>
        <div className="stat">
          <b>{topStreak}</b>
          <span>{t('habits.bestStreak')}</span>
        </div>
      </div>

      {range === 'week' || range === 'day' ? (
        <div className="bars" aria-label={t('habits.lastSeven')}>
          {week.map((date) => {
            const rate = rateForDay(habits, completions, date)
            return (
              <button key={date} className="bar" type="button" onClick={() => onSelect(date)}>
                <i style={{ height: `${Math.max(8, rate * 100)}px` }} />
                <span>{weekdayLabel(date, locale)}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {range === 'month' || range === 'day' ? (
        <HabitCalendar cells={monthGrid(selected)} selected={selected} onSelect={onSelect} />
      ) : null}

      {range === 'year' ? (
        <div className="year-heat" aria-label={t('habits.yearHeat')}>
          {Array.from({ length: weekdayIndex(`${yearOf(selected)}-01-01`) }).map((_, index) => (
            <span key={`pad-${index}`} className="year-cell heat-0" style={{ visibility: 'hidden' }} />
          ))}
          {year.map((date) => {
            const rate = rateForDay(habits, completions, date)
            const heat =
              rate <= 0 ? 'heat-0' : rate < 0.25 ? 'heat-1' : rate < 0.5 ? 'heat-2' : rate < 0.75 ? 'heat-3' : 'heat-4'
            return (
              <button
                key={date}
                type="button"
                className={`year-cell ${heat}`}
                title={date}
                onClick={() => onSelect(date)}
              />
            )
          })}
        </div>
      ) : null}
    </aside>
  )
}
