import type { Book, ReadingEntry } from '../types'
import { addDays, lastNDays } from './dates'

/** Total pages logged on a given day (across all books). */
export function pagesOnDate(log: ReadingEntry[], date: string): number {
  return log.reduce((sum, entry) => (entry.date === date ? sum + entry.pages : sum), 0)
}

/** Pages logged for one book on a given day. */
export function pagesForBookOnDate(log: ReadingEntry[], bookId: string, date: string): number {
  return log.reduce(
    (sum, entry) => (entry.bookId === bookId && entry.date === date ? sum + entry.pages : sum),
    0,
  )
}

/** Total pages read in a date range (inclusive). */
export function pagesInRange(log: ReadingEntry[], start: string, end: string): number {
  return log.reduce((sum, entry) => (entry.date >= start && entry.date <= end ? sum + entry.pages : sum), 0)
}

export function totalPages(log: ReadingEntry[]): number {
  return log.reduce((sum, entry) => sum + entry.pages, 0)
}

/** Array of { date, pages } for the last n days ending at `end`. */
export function lastNDaysPages(log: ReadingEntry[], end: string, n: number): { date: string; pages: number }[] {
  return lastNDays(end, n).map((date) => ({ date, pages: pagesOnDate(log, date) }))
}

/** Consecutive days (ending today/yesterday) with at least one page read. */
export function readingStreak(log: ReadingEntry[], today: string): number {
  const days = new Set(log.filter((entry) => entry.pages > 0).map((entry) => entry.date))
  let cursor = days.has(today) ? today : addDays(today, -1)
  if (!days.has(cursor)) return 0
  let count = 0
  while (days.has(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

/** Number of distinct days with any reading in the whole log. */
export function readingDays(log: ReadingEntry[]): number {
  return new Set(log.filter((entry) => entry.pages > 0).map((entry) => entry.date)).size
}

/** Best single day (most pages) in the log. */
export function bestDay(log: ReadingEntry[]): { date: string; pages: number } | null {
  const byDay = new Map<string, number>()
  for (const entry of log) {
    byDay.set(entry.date, (byDay.get(entry.date) ?? 0) + entry.pages)
  }
  let best: { date: string; pages: number } | null = null
  for (const [date, pages] of byDay) {
    if (!best || pages > best.pages) best = { date, pages }
  }
  return best
}

/** Average pages per active reading day. */
export function avgPagesPerDay(log: ReadingEntry[]): number {
  const days = readingDays(log)
  if (days === 0) return 0
  return Math.round(totalPages(log) / days)
}

/** Recent log entries (newest first), enriched with the book title. */
export function recentEntries(
  log: ReadingEntry[],
  books: Book[],
  limit = 8,
): { id: string; date: string; pages: number; toPage: number; title: string }[] {
  const titleById = new Map(books.map((book) => [book.id, book.title]))
  return [...log]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      pages: entry.pages,
      toPage: entry.toPage,
      title: titleById.get(entry.bookId) ?? 'Unknown book',
    }))
}

/** Pages read per calendar month of a given year, as a 12-length array. */
export function pagesByMonth(log: ReadingEntry[], year: number): number[] {
  const months = Array(12).fill(0)
  for (const entry of log) {
    if (entry.date.startsWith(`${year}-`)) {
      const month = Number(entry.date.slice(5, 7)) - 1
      if (month >= 0 && month < 12) months[month] += entry.pages
    }
  }
  return months
}
