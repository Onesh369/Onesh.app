export type ThemeMode = 'auto' | 'light' | 'dark'

export type Habit = {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export type BookStatus = 'reading' | 'read' | 'stopped'
export type BookFormat = 'book' | 'ebook' | 'audiobook'

export type Book = {
  id: string
  title: string
  author: string
  year: string
  pages: number
  pagesRead: number
  rating: number
  dateStart: string
  dateFinish: string
  format: BookFormat
  genre: string
  status: BookStatus
  createdAt: string
}

export type Task = {
  id: string
  title: string
  date: string
  time?: string
  place?: string
  description?: string
  done: boolean
  important: boolean
  order: number
  createdAt: string
  rolledFrom?: string
}

export type AppData = {
  habits: Habit[]
  completions: Record<string, string[]>
  tasks: Task[]
  books: Book[]
  themeMode: ThemeMode
}

export type Page = 'habits' | 'plan' | 'reading'
export type StatRange = 'day' | 'week' | 'month' | 'year'
