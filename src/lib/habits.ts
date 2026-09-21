import type { Habit } from '../types'
import { addDays, eachDay, lastNDays, monthOf, startOfMonth, yearDays, yearOf } from './dates'

export function sortHabits(habits: Habit[]): Habit[] {
  return [...habits].sort(
    (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
}

export function rateForDay(
  habits: Habit[],
  completions: Record<string, string[]>,
  date: string,
): number {
  if (habits.length === 0) return 0
  const done = habits.filter((habit) => (completions[habit.id] ?? []).includes(date)).length
  return done / habits.length
}

export function doneCount(
  habits: Habit[],
  completions: Record<string, string[]>,
  date: string,
): number {
  return habits.filter((habit) => (completions[habit.id] ?? []).includes(date)).length
}

export function averageRate(dates: string[], habits: Habit[], completions: Record<string, string[]>): number {
  if (dates.length === 0 || habits.length === 0) return 0
  const total = dates.reduce((sum, date) => sum + rateForDay(habits, completions, date), 0)
  return total / dates.length
}

export function weekDates(end: string): string[] {
  return lastNDays(end, 7)
}

export function monthDates(iso: string): string[] {
  const start = startOfMonth(iso)
  const endMonth = monthOf(iso)
  const endYear = yearOf(iso)
  let end = start
  while (yearOf(addDays(end, 1)) === endYear && monthOf(addDays(end, 1)) === endMonth) {
    end = addDays(end, 1)
  }
  return eachDay(start, end)
}

export function rangeDates(range: 'day' | 'week' | 'month' | 'year', selected: string): string[] {
  if (range === 'day') return [selected]
  if (range === 'week') return weekDates(selected)
  if (range === 'month') return monthDates(selected)
  return yearDays(yearOf(selected))
}

export function bestStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    run = addDays(prev, 1) === curr ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}
