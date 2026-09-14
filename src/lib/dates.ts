const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, amount: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

export function addMonths(iso: string, amount: number): string {
  const date = parseISODate(iso)
  date.setMonth(date.getMonth() + amount)
  return toISODate(date)
}

export function startOfMonth(iso: string): string {
  const date = parseISODate(iso)
  date.setDate(1)
  return toISODate(date)
}

export function daysInMonth(iso: string): number {
  const date = parseISODate(iso)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function weekdayIndex(iso: string): number {
  return parseISODate(iso).getDay()
}

export function formatLong(iso: string): string {
  const date = parseISODate(iso)
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

export function formatShort(iso: string): string {
  const date = parseISODate(iso)
  return `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`
}

export function formatMonthYear(iso: string): string {
  const date = parseISODate(iso)
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function weekdayLabel(iso: string): string {
  return WEEKDAYS[weekdayIndex(iso)]
}

export function yearOf(iso: string): number {
  return parseISODate(iso).getFullYear()
}

export function monthOf(iso: string): number {
  return parseISODate(iso).getMonth()
}

export function eachDay(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = start
  while (cursor <= end) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export function lastNDays(end: string, n: number): string[] {
  return eachDay(addDays(end, -(n - 1)), end)
}

export function monthGrid(iso: string): (string | null)[] {
  const start = startOfMonth(iso)
  const count = daysInMonth(iso)
  const pad = weekdayIndex(start)
  const cells: (string | null)[] = Array(pad).fill(null)
  for (let i = 0; i < count; i += 1) {
    cells.push(addDays(start, i))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function yearDays(year: number): string[] {
  return eachDay(`${year}-01-01`, `${year}-12-31`)
}

export function isToday(iso: string): boolean {
  return iso === todayISO()
}

export { WEEKDAYS, MONTHS }
