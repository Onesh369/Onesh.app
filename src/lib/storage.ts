import { STORAGE_KEY, THEME_MODE_KEY } from '../constants'
import type { AppData, Task, ThemeMode } from '../types'
import { normalizeTime, optionalText } from './tasks'

export const emptyData: AppData = {
  habits: [],
  completions: {},
  tasks: [],
  books: [],
  themeMode: 'auto',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseAppData(value: unknown): AppData {
  if (!isRecord(value)) return { ...emptyData }
  return {
    habits: Array.isArray(value.habits) ? value.habits : [],
    completions: isRecord(value.completions) ? (value.completions as AppData['completions']) : {},
    tasks: Array.isArray(value.tasks) ? value.tasks.map(readTask).filter((task): task is Task => task !== null) : [],
    books: Array.isArray(value.books) ? value.books : [],
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
