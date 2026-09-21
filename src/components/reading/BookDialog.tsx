import { useState } from 'react'
import { FORMATS, GENRES, STATUSES } from '../../constants'
import { normalizeBook } from '../../lib/books'
import { todayISO } from '../../lib/dates'
import type { Book, BookFormat, BookStatus } from '../../types'
import { Dialog } from '../Dialog'

type Draft = Omit<Book, 'id' | 'createdAt'>

const blank = (): Draft => ({
  title: '',
  author: '',
  year: '',
  pages: 0,
  pagesRead: 0,
  rating: 0,
  dateStart: todayISO(),
  dateFinish: '',
  format: 'book',
  genre: 'Fiction',
  status: 'reading',
})

type Props = {
  book?: Book
  onClose: () => void
  onSave: (input: Draft) => void
  onDelete?: () => void
}

export function BookDialog({ book, onClose, onSave, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<Draft>(() =>
    book
      ? {
          title: book.title,
          author: book.author,
          year: book.year,
          pages: book.pages,
          pagesRead: book.pagesRead,
          rating: book.rating,
          dateStart: book.dateStart,
          dateFinish: book.dateFinish,
          format: book.format,
          genre: book.genre,
          status: book.status,
        }
      : blank(),
  )

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog title={book ? 'Edit book' : 'Add a book'} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const next = normalizeBook(draft)
          if (!next.title) return
          onSave(next)
        }}
      >
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="book-title">Book name</label>
            <input id="book-title" value={draft.title} onChange={(e) => set('title', e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="book-author">Author</label>
            <input id="book-author" value={draft.author} onChange={(e) => set('author', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="book-year">Year</label>
            <input id="book-year" value={draft.year} onChange={(e) => set('year', e.target.value)} placeholder="2024" />
          </div>
          <div className="field">
            <label htmlFor="book-pages">Pages</label>
            <input
              id="book-pages"
              type="number"
              min={0}
              value={draft.pages || ''}
              onChange={(e) => set('pages', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="book-read">Pages read</label>
            <input
              id="book-read"
              type="number"
              min={0}
              value={draft.pagesRead || ''}
              onChange={(e) => set('pagesRead', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="book-start">Date start</label>
            <input id="book-start" type="date" value={draft.dateStart} onChange={(e) => set('dateStart', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="book-finish">Date finish</label>
            <input id="book-finish" type="date" value={draft.dateFinish} onChange={(e) => set('dateFinish', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="book-format">Format</label>
            <select
              id="book-format"
              value={draft.format}
              onChange={(e) => set('format', e.target.value as BookFormat)}
            >
              {FORMATS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="book-genre">Genre</label>
            <select id="book-genre" value={draft.genre} onChange={(e) => set('genre', e.target.value)}>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="book-status">Status</label>
            <select
              id="book-status"
              value={draft.status}
              onChange={(e) => set('status', e.target.value as BookStatus)}
            >
              {STATUSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Rating</label>
            <div className="stars-input" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={draft.rating >= value ? 'on' : ''}
                  onClick={() => set('rating', draft.rating === value ? 0 : value)}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={draft.rating >= value}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dialog-actions">
          {onDelete ? (
            <button
              className="danger"
              type="button"
              onClick={() => {
                if (confirmDelete) onDelete()
                else setConfirmDelete(true)
              }}
            >
              {confirmDelete ? 'Delete forever' : 'Delete'}
            </button>
          ) : null}
          <button className="ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={!draft.title.trim()}>
            Save book
          </button>
        </div>
      </form>
    </Dialog>
  )
}
