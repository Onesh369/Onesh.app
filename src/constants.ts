import type { BookFormat, BookStatus } from './types'

export const HABIT_COLORS = [
  '#3E6B55',
  '#4A6FA5',
  '#C46A3A',
  '#7A5C9E',
  '#2F6F6A',
  '#A67C2D',
  '#B4533A',
  '#5C6B4A',
] as const

export const HABIT_ICONS = [
  { id: 'reading', label: 'Reading' },
  { id: 'running', label: 'Running' },
  { id: 'gym', label: 'Gym' },
  { id: 'pray', label: 'Pray' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'walking', label: 'Walking' },
  { id: 'work', label: 'Online work' },
  { id: 'focus', label: 'Focus' },
  { id: 'farm', label: 'Agriculture' },
  { id: 'water', label: 'Drink water' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'journal', label: 'Journal' },
  { id: 'eat', label: 'Eat well' },
  { id: 'yoga', label: 'Stretch / yoga' },
  { id: 'bike', label: 'Cycling' },
  { id: 'sunrise', label: 'Wake early' },
  { id: 'study', label: 'Study' },
  { id: 'music', label: 'Music' },
] as const

export const GENRES = [
  'Fiction',
  'Literary Fiction',
  'Mystery / Thriller',
  'Fantasy',
  'Science Fiction',
  'Romance',
  'Historical Fiction',
  'Horror',
  'Young Adult',
  'Classics',
  'Non-Fiction',
  'Biography',
  'Memoir',
  'History',
  'Science',
  'Philosophy',
  'Psychology',
  'Self-Help',
  'Business',
  'Health',
  'Religion / Spirituality',
  'Poetry',
  'Art & Design',
  'Other',
] as const

export const FORMATS: { id: BookFormat; label: string }[] = [
  { id: 'book', label: 'Book' },
  { id: 'ebook', label: 'Ebook' },
  { id: 'audiobook', label: 'Audiobook' },
]

export const STATUSES: { id: BookStatus; label: string }[] = [
  { id: 'reading', label: 'Currently Reading' },
  { id: 'read', label: 'Read' },
  { id: 'stopped', label: 'Stopped' },
]

export const STORAGE_KEY = 'onesh-data-v1'
export const THEME_MODE_KEY = 'onesh-theme-mode'
export const LAST_USERNAME_KEY = 'onesh-last-username'
