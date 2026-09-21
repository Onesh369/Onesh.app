import { HABIT_COLORS, HABIT_ICONS, STORAGE_KEY, THEME_MODE_KEY } from '../constants'
import type { AppData, Habit, ReadingEntry, Task, ThemeMode } from '../types'
import { normalizeTime, optionalText } from './tasks'

export const emptyData: AppData = {
  habits: [],
  completions: {},
  tasks: [],
  books: [],
  readingLog: [],
  themeMode: 'auto',
}

function readHabit(value: unknown, index: number): Habit | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null
  }
  return {
    id: value.id,
    name: value.name,
    color: typeof value.color === 'string' ? value.color : HABIT_COLORS[0],
    icon: typeof value.icon === 'string' ? value.icon : HABIT_ICONS[0].id,
    order: typeof value.order === 'number' ? value.order : index + 1,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  }
}

function readTask(value: unknown): Task | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.date !== 'string') {
    return null
  }
  return {
    id: value.id,
    title: value.title,
    date: value.date,
    time: normalizeTime(value.time),
    place: optionalText(value.place, 80),
    description: optionalText(value.description),
    done: Boolean(value.done),
    important: Boolean(value.important),
    order: typeof value.order === 'number' ? value.order : 0,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    rolledFrom: typeof value.rolledFrom === 'string' ? value.rolledFrom : undefined,
  }
}

function readReadingEntry(value: unknown): ReadingEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.bookId !== 'string' || typeof value.date !== 'string') {
    return null
  }
  const toNum = (input: unknown) => Math.max(0, Math.round(Number(input) || 0))
  return {
    id: value.id,
    bookId: value.bookId,
    date: value.date,
    pages: toNum(value.pages),
    fromPage: toNum(value.fromPage),
    toPage: toNum(value.toPage),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseAppData(value: unknown): AppData {
  if (!isRecord(value)) return { ...emptyData }
  return {
    habits: Array.isArray(value.habits)
      ? value.habits.map(readHabit).filter((habit): habit is Habit => habit !== null)
      : [],
    completions: isRecord(value.completions) ? (value.completions as AppData['completions']) : {},
    tasks: Array.isArray(value.tasks) ? value.tasks.map(readTask).filter((task): task is Task => task !== null) : [],
    books: Array.isArray(value.books) ? value.books : [],
    readingLog: Array.isArray(value.readingLog)
      ? value.readingLog.map(readReadingEntry).filter((entry): entry is ReadingEntry => entry !== null)
      : [],
    themeMode:
      value.themeMode === 'light' || value.themeMode === 'dark' || value.themeMode === 'auto'
        ? value.themeMode
        : 'auto',
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const mode = (localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null) ?? 'auto'
      return { ...emptyData, themeMode: mode }
    }
    return parseAppData(JSON.parse(raw))
  } catch {
    return { ...emptyData }
  }
}

export function hasLocalContent(data: AppData = loadData()) {
  return data.habits.length > 0 || data.tasks.length > 0 || data.books.length > 0
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY)
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(THEME_MODE_KEY, data.themeMode)
}

export function uid(): string {
  return crypto.randomUUID()
}
