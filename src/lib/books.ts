import type { Book } from '../types'

export function bookPercent(book: Pick<Book, 'pages' | 'pagesRead'>): number {
  if (!book.pages || book.pages <= 0) return 0
  return Math.min(100, Math.round((book.pagesRead / book.pages) * 100))
}

export function normalizeBook(input: Omit<Book, 'id' | 'createdAt'>): Omit<Book, 'id' | 'createdAt'> {
  const pages = Math.max(0, Number(input.pages) || 0)
  let pagesRead = Math.max(0, Number(input.pagesRead) || 0)
  if (pages > 0) pagesRead = Math.min(pagesRead, pages)

  let status = input.status
  let dateFinish = input.dateFinish
  if (status === 'read' && pages > 0) {
    pagesRead = pages
    if (!dateFinish) dateFinish = new Date().toISOString().slice(0, 10)
  } else if (pages > 0 && pagesRead >= pages) {
    status = 'read'
    if (!dateFinish) dateFinish = new Date().toISOString().slice(0, 10)
  }

  return {
    ...input,
    title: input.title.trim(),
    author: input.author.trim(),
    year: input.year.trim(),
    pages,
    pagesRead,
    rating: Math.min(5, Math.max(0, Number(input.rating) || 0)),
    dateFinish,
    status,
  }
}
