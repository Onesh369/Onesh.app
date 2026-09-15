import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppData, Book, Habit, Task, ThemeMode } from './types'
import { loadData, saveData, uid } from './lib/storage'
import { getData, putData } from './lib/api'
import { applyTheme } from './lib/theme'
import { addDays, todayISO } from './lib/dates'
import { normalizeTime, optionalText } from './lib/tasks'

type Store = AppData & {
  addHabit: (input: Pick<Habit, 'name' | 'color' | 'icon'>) => void
  updateHabit: (id: string, patch: Partial<Pick<Habit, 'name' | 'color' | 'icon'>>) => void
  deleteHabit: (id: string) => void
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
  setThemeMode: (mode: ThemeMode) => void
}

const StoreContext = createContext<Store | null>(null)

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
        if (!cancelled) applyTheme(data.themeMode)
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
    saveData(data)
    applyTheme(data.themeMode)
    const timer = window.setTimeout(() => {
      void putData(data).catch(() => undefined)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [data])

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
        const habit: Habit = {
          id: uid(),
          createdAt: new Date().toISOString(),
          ...input,
        }
        setData((prev) => ({ ...prev, habits: [...prev.habits, habit] }))
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
        }))
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
