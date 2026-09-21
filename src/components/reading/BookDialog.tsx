import { useState } from 'react'
import { FORMATS, GENRES, STATUSES } from '../../constants'
import { useI18n, type MessageKey } from '../../i18n'
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
  const { t } = useI18n()
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
    <Dialog title={book ? t('reading.editBook') : t('reading.addABook')} onClose={onClose}>
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
            <label htmlFor="book-title">{t('reading.bookName')}</label>
            <input id="book-title" value={draft.title} onChange={(e) => set('title', e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="book-author">{t('reading.author')}</label>
            <input id="book-author" value={draft.author} onChange={(e) => set('author', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="book-year">{t('reading.year')}</label>
            <input id="book-year" value={draft.year} onChange={(e) => set('year', e.target.value)} placeholder="2024" />
          </div>
          <div className="field">
            <label htmlFor="book-pages">{t('reading.pages')}</label>
            <input
              id="book-pages"
              type="number"
              min={0}
              value={draft.pages || ''}
              onChange={(e) => set('pages', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="book-read">{t('reading.pagesRead')}</label>
            <input
              id="book-read"
              type="number"
              min={0}
              value={draft.pagesRead || ''}
              onChange={(e) => set('pagesRead', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="book-start">{t('reading.dateStart')}</label>
            <input id="book-start" type="date" value={draft.dateStart} onChange={(e) => set('dateStart', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="book-finish">{t('reading.dateFinish')}</label>
            <input id="book-finish" type="date" value={draft.dateFinish} onChange={(e) => set('dateFinish', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="book-format">{t('reading.format')}</label>
            <select
              id="book-format"
              value={draft.format}
              onChange={(e) => set('format', e.target.value as BookFormat)}
            >
              {FORMATS.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(`reading.formats.${item.id}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="book-genre">{t('reading.genre')}</label>
            <select id="book-genre" value={draft.genre} onChange={(e) => set('genre', e.target.value)}>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {t(`reading.genres.${genre}` as MessageKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="book-status">{t('reading.status')}</label>
            <select
              id="book-status"
              value={draft.status}
              onChange={(e) => set('status', e.target.value as BookStatus)}
            >
              {STATUSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(`reading.statuses.${item.id}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('reading.rating')}</label>
            <div className="stars-input" role="group" aria-label={t('reading.rating')}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={draft.rating >= value ? 'on' : ''}
                  onClick={() => set('rating', draft.rating === value ? 0 : value)}
                  aria-label={value === 1 ? t('reading.star', { n: value }) : t('reading.stars', { n: value })}
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
              {confirmDelete ? t('common.deleteForever') : t('common.delete')}
            </button>
          ) : null}
          <button className="ghost" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="primary" type="submit" disabled={!draft.title.trim()}>
            {t('reading.saveBook')}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
