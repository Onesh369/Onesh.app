import type { Task } from '../types'
import { addDays } from './dates'

export function normalizeTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/)
  if (!match) return undefined
  const hours = Number(match[1])
  if (hours > 23) return undefined
  return `${String(hours).padStart(2, '0')}:${match[2]}`
}

export function minutesOf(time?: string): number | null {
  const normalized = normalizeTime(time)
  if (!normalized) return null
  const [hours, minutes] = normalized.split(':').map(Number)
  return hours * 60 + minutes
}

export function tasksOn(tasks: Task[], date: string): Task[] {
  return tasks.filter((task) => task.date === date)
}

export function sortDayTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const aTime = minutesOf(a.time)
    const bTime = minutesOf(b.time)
    if (aTime != null && bTime != null && aTime !== bTime) return aTime - bTime
    if (aTime != null && bTime == null) return -1
    if (aTime == null && bTime != null) return 1
    return a.order - b.order || a.createdAt.localeCompare(b.createdAt)
  })
}

export function dayProgress(tasks: Task[], date: string) {
  const day = tasksOn(tasks, date)
  const done = day.filter((task) => task.done).length
  return {
    done,
    open: day.length - done,
    total: day.length,
    rate: day.length ? done / day.length : 0,
  }
}

export function optionalText(value: unknown, max = 2000): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed || undefined
}

export function leftoverOn(tasks: Task[], date: string): Task[] {
  return tasksOn(tasks, date).filter((task) => !task.done)
}

export function rolledLabel(
  task: Task,
  yesterday: string,
  fromDate: (iso: string) => string,
): string | null {
  if (!task.rolledFrom) return null
  return task.rolledFrom === addDays(task.date, -1) ? yesterday : fromDate(task.rolledFrom)
}
