import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppData, Book, Habit, ReadingEntry, Task, ThemeMode } from './types'
import { loadData, saveData, uid } from './lib/storage'
import { normalizeBook } from './lib/books'
import { getData } from './lib/api'
import { flushCloudSave, queueCloudSave } from './lib/sync'
import { applyTheme } from './lib/theme'
import { addDays, todayISO } from './lib/dates'
import { normalizeTime, optionalText } from './lib/tasks'

type Store = AppData & {
  addHabit: (input: Pick<Habit, 'name' | 'color' | 'icon'>) => void
  updateHabit: (id: string, patch: Partial<Pick<Habit, 'name' | 'color' | 'icon'>>) => void
  deleteHabit: (id: string) => void
  reorderHabits: (orderedIds: string[]) => void
  toggleHabit: (habitId: string, date: string) => void
  isDone: (habitId: string, date: string) => boolean
  streak: (habitId: string) => number
  addTask: (input: { title: string; date: string; important?: boolean; time?: string; place?: string; description?: string }) => string | undefined
  toggleTask: (id: string) => void
  renameTask: (id: string, title: string) => void
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'time' | 'place' | 'description'>>) => void
  deleteTask: (id: string) => void
  setTaskImportant: (id: string, important: boolean) => void
  moveTask: (id: string, date: string) => void
  moveOpenTasks: (from: string, to: string) => void
  reorderOpenTasks: (date: string, orderedIds: string[]) => void
  addBook: (input: Omit<Book, 'id' | 'createdAt'>) => void
  updateBook: (id: string, patch: Partial<Omit<Book, 'id' | 'createdAt'>>) => void
  deleteBook: (id: string) => void
  logReading: (bookId: string, toPage: number) => void
  finishBook: (bookId: string) => void
  setThemeMode: (mode: ThemeMode) => void
}

const StoreContext = createContext<Store | null>(null)

/**
 * Sets a book's current page to `toPage`, normalizes the book, and records the
 * page delta in the reading log against `today`. Same-day edits merge into a
 * single entry so a day never counts pages twice; corrections shrink it.
 */
function applyReadingProgress(prev: AppData, bookId: string, toPage: number, today: string): AppData {
  const book = prev.books.find((item) => item.id === bookId)
  if (!book) return prev
  const oldRead = book.pagesRead
  const { id: _id, createdAt: _createdAt, ...rest } = book
  const normalized = normalizeBook({ ...rest, pagesRead: Math.max(0, Math.round(toPage)) })
  const newRead = normalized.pagesRead
  const delta = newRead - oldRead
  const books = prev.books.map((item) => (item.id === bookId ? { ...item, ...normalized } : item))
  if (delta === 0) return { ...prev, books }

  let readingLog = prev.readingLog
  const index = readingLog.findIndex((entry) => entry.bookId === bookId && entry.date === today)
  if (index >= 0) {
    const nextPages = readingLog[index].pages + delta
    if (nextPages > 0) {
      readingLog = readingLog.map((entry, i) =>
        i === index ? { ...entry, pages: nextPages, toPage: newRead } : entry,
      )
    } else {
      readingLog = readingLog.filter((_, i) => i !== index)
    }
  } else if (delta > 0) {
    const entry: ReadingEntry = {
      id: uid(),
      bookId,
      date: today,
      pages: delta,
      fromPage: oldRead,
      toPage: newRead,
      createdAt: new Date().toISOString(),
    }
    readingLog = [...readingLog, entry]
  }
  return { ...prev, books, readingLog }
}

function habitStreak(dates: string[], today: string): number {
  const set = new Set(dates)
  let cursor = set.has(today) ? today : addDays(today, -1)
  if (!set.has(cursor)) return 0
  let count = 0
  while (set.has(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const hydrated = useRef(false)

  useEffect(() => {
    let cancelled = false
    getData()
      .then((remote) => {
        if (cancelled) return
        setData(remote)
        saveData(remote)
        applyTheme(remote.themeMode)
      })
      .catch(() => {
        if (!cancelled) applyTheme(loadData().themeMode)
      })
      .finally(() => {
        if (!cancelled) hydrated.current = true
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    applyTheme(data.themeMode)
    queueCloudSave(data)
  }, [data])

  useEffect(() => {
    const flush = () => {
      void flushCloudSave()
    }
    const onHide = () => {
      if (document.hidden) flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  useEffect(() => {
    applyTheme(data.themeMode)
    const timer = window.setInterval(() => applyTheme(data.themeMode), 60_000)
    return () => window.clearInterval(timer)
  }, [data.themeMode])

  const store = useMemo<Store>(() => {
    const isDone = (habitId: string, date: string) =>
      (data.completions[habitId] ?? []).includes(date)

    return {
      ...data,
      addHabit: (input) => {
        setData((prev) => {
          const habit: Habit = {
            id: uid(),
            createdAt: new Date().toISOString(),
            order: prev.habits.reduce((max, item) => Math.max(max, item.order), 0) + 1,
            ...input,
          }
          return { ...prev, habits: [...prev.habits, habit] }
        })
      },
      updateHabit: (id, patch) => {
        setData((prev) => ({
          ...prev,
          habits: prev.habits.map((habit) => (habit.id === id ? { ...habit, ...patch } : habit)),
        }))
      },
      deleteHabit: (id) => {
        setData((prev) => {
          const completions = { ...prev.completions }
          delete completions[id]
          return {
            ...prev,
            habits: prev.habits.filter((habit) => habit.id !== id),
            completions,
          }
        })
      },
      reorderHabits: (orderedIds) => {
        const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]))
        setData((prev) => ({
          ...prev,
          habits: prev.habits.map((habit) =>
            orderById.has(habit.id) ? { ...habit, order: orderById.get(habit.id) as number } : habit,
          ),
        }))
      },
      toggleHabit: (habitId, date) => {
        setData((prev) => {
          const current = prev.completions[habitId] ?? []
          const next = current.includes(date)
            ? current.filter((item) => item !== date)
            : [...current, date]
          return {
            ...prev,
            completions: { ...prev.completions, [habitId]: next },
          }
        })
      },
      isDone,
      streak: (habitId) => habitStreak(data.completions[habitId] ?? [], todayISO()),
      addTask: (input) => {
        const title = input.title.trim()
        if (!title) return undefined
        const id = uid()
        setData((prev) => {
          const dayOpen = prev.tasks.filter((task) => task.date === input.date && !task.done)
          const dayAll = prev.tasks.filter((task) => task.date === input.date)
          const order = input.important
            ? dayOpen.reduce((min, task) => Math.min(min, task.order), 1) - 1
            : dayAll.reduce((max, task) => Math.max(max, task.order), 0) + 1
          const task: Task = {
            id,
            title,
            date: input.date,
            time: normalizeTime(input.time),
            place: optionalText(input.place, 80),
            description: optionalText(input.description),
            done: false,
            important: Boolean(input.important),
            order,
            createdAt: new Date().toISOString(),
          }
          return { ...prev, tasks: [...prev.tasks, task] }
        })
        return id
      },
      toggleTask: (id) => {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
        }))
      },
      renameTask: (id, title) => {
        const trimmed = title.trim()
        if (!trimmed) return
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => (task.id === id ? { ...task, title: trimmed } : task)),
        }))
      },
      updateTask: (id, patch) => {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== id) return task
            const next = { ...task }
            if (patch.title !== undefined) {
              const title = patch.title.trim()
              if (title) next.title = title
            }
            if ('time' in patch) next.time = normalizeTime(patch.time)
            if ('place' in patch) next.place = optionalText(patch.place, 80)
            if ('description' in patch) next.description = optionalText(patch.description)
            return next
          }),
        }))
      },
      deleteTask: (id) => {
        setData((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== id) }))
      },
      setTaskImportant: (id, important) => {
        setData((prev) => {
          const current = prev.tasks.find((task) => task.id === id)
          if (!current) return prev
          const minOpen = prev.tasks
            .filter((task) => task.date === current.date && !task.done && task.id !== id)
            .reduce((min, task) => Math.min(min, task.order), 1)
          return {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === id
                ? { ...task, important, order: important ? minOpen - 1 : task.order }
                : task,
            ),
          }
        })
      },
      moveTask: (id, date) => {
        setData((prev) => {
          const current = prev.tasks.find((task) => task.id === id)
          if (!current || current.done || current.date === date) return prev
          const order = prev.tasks.filter((task) => task.date === date).reduce((max, task) => Math.max(max, task.order), 0) + 1
          return {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === id
                ? { ...task, date, order, rolledFrom: task.rolledFrom ?? task.date }
                : task,
            ),
          }
        })
      },
      moveOpenTasks: (from, to) => {
        if (from === to) return
        setData((prev) => {
          const moving = prev.tasks.filter((task) => task.date === from && !task.done)
          if (moving.length === 0) return prev
          let cursor = prev.tasks.filter((task) => task.date === to).reduce((max, task) => Math.max(max, task.order), 0)
          const ids = new Set(moving.map((task) => task.id))
          return {
            ...prev,
            tasks: prev.tasks.map((task) => {
              if (!ids.has(task.id)) return task
              cursor += 1
              return { ...task, date: to, order: cursor, rolledFrom: task.rolledFrom ?? task.date }
            }),
          }
        })
      },
      reorderOpenTasks: (date, orderedIds) => {
        const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]))
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.date === date && !task.done && orderById.has(task.id)
              ? { ...task, order: orderById.get(task.id) as number }
              : task,
          ),
        }))
      },
      addBook: (input) => {
        const book: Book = {
          id: uid(),
          createdAt: new Date().toISOString(),
          ...input,
        }
        setData((prev) => ({ ...prev, books: [book, ...prev.books] }))
      },
      updateBook: (id, patch) => {
        setData((prev) => ({
          ...prev,
          books: prev.books.map((book) => (book.id === id ? { ...book, ...patch } : book)),
        }))
      },
      deleteBook: (id) => {
        setData((prev) => ({
          ...prev,
          books: prev.books.filter((book) => book.id !== id),
          readingLog: prev.readingLog.filter((entry) => entry.bookId !== id),
        }))
      },
      logReading: (bookId, toPage) => {
        setData((prev) => applyReadingProgress(prev, bookId, toPage, todayISO()))
      },
      finishBook: (bookId) => {
        setData((prev) => {
          const book = prev.books.find((item) => item.id === bookId)
          if (!book) return prev
          if (book.pages > 0) {
            return applyReadingProgress(prev, bookId, book.pages, todayISO())
          }
          const dateFinish = book.dateFinish || todayISO()
          return {
            ...prev,
            books: prev.books.map((item) =>
              item.id === bookId ? { ...item, status: 'read', dateFinish } : item,
            ),
          }
        })
      },
      setThemeMode: (themeMode) => {
        setData((prev) => ({ ...prev, themeMode }))
      },
    }
  }, [data])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used within StoreProvider')
  return value
}
