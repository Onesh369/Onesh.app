import { STORAGE_KEY, THEME_MODE_KEY } from '../constants'
import type { AppData, Task, ThemeMode } from '../types'
import { normalizeTime, optionalText } from './tasks'

const empty: AppData = {
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

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const mode = (localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null) ?? 'auto'
      return { ...empty, themeMode: mode }
    }
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return empty
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      completions: isRecord(parsed.completions) ? (parsed.completions as AppData['completions']) : {},
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(readTask).filter((task): task is Task => task !== null) : [],
      books: Array.isArray(parsed.books) ? parsed.books : [],
      themeMode:
        parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'auto'
          ? parsed.themeMode
          : 'auto',
    }
  } catch {
    return empty
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(THEME_MODE_KEY, data.themeMode)
}

export function uid(): string {
  return crypto.randomUUID()
}
