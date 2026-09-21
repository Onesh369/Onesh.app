import { useMemo, useState } from 'react'
import { GENRES } from '../../constants'
import { useI18n, type MessageKey } from '../../i18n'
import { bookPercent } from '../../lib/books'
import { todayISO } from '../../lib/dates'
import { pagesForBookOnDate } from '../../lib/reading'
import { useStore } from '../../store'
import type { Book, BookStatus } from '../../types'
import { BookDialog } from './BookDialog'
import { ReadingStats } from './ReadingStats'

function stars(rating: number): string {
  if (!rating) return '—'
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function genreLabel(genre: string, t: (key: MessageKey) => string): string {
  return (GENRES as readonly string[]).includes(genre) ? t(`reading.genres.${genre}` as MessageKey) : genre
}

function statusLabel(status: BookStatus, t: (key: MessageKey) => string): string {
  return t(`reading.statuses.${status}`)
}

function formatLabel(format: Book['format'], t: (key: MessageKey) => string): string {
  return t(`reading.formats.${format}`)
}

export function ReadingPage() {
  const { t } = useI18n()
  const { books, readingLog, addBook, updateBook, deleteBook, logReading, finishBook } = useStore()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [filter, setFilter] = useState<'all' | BookStatus>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const list = filter === 'all' ? books : books.filter((book) => book.status === filter)
    const needle = query.trim().toLowerCase()
    const matched = needle
      ? list.filter(
          (book) =>
            book.title.toLowerCase().includes(needle) ||
            book.author.toLowerCase().includes(needle) ||
            book.genre.toLowerCase().includes(needle),
        )
      : list
    const rank = { reading: 0, stopped: 1, read: 2 }
    return [...matched].sort((a, b) => rank[a.status] - rank[b.status] || a.title.localeCompare(b.title))
  }, [books, filter, query])

  const current = books.filter((book) => book.status === 'reading')

  return (
    <div>
      {current.length > 0 ? (
        <section className="reading-hero">
          {current.map((book) => (
            <NowReadingCard
              key={book.id}
              book={book}
              todayPages={pagesForBookOnDate(readingLog, book.id, todayISO())}
              onOpen={() => setEditing(book)}
              onLog={(toPage) => logReading(book.id, toPage)}
              onFinish={() => finishBook(book.id)}
            />
          ))}
        </section>
      ) : null}

      <div className="layout reading-layout">
        <section className="panel">
          <div className="toolbar">
            <div>
              <div className="kicker">{t('reading.library')}</div>
              <h2>{t('reading.books')}</h2>
            </div>
            <div className="filters">
              <input
                className="search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('reading.search')}
                aria-label={t('reading.searchAria')}
              />
              {(['all', 'reading', 'read', 'stopped'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${filter === item ? 'active' : ''}`}
                  onClick={() => setFilter(item)}
                >
                  {item === 'all' ? t('reading.all') : statusLabel(item, t)}
                </button>
              ))}
              <button className="primary" type="button" onClick={() => setCreating(true)}>
                {t('reading.add')}
              </button>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="empty">
              <h3>{t('reading.emptyTitle')}</h3>
              <p>{t('reading.emptyText')}</p>
              <button className="primary" type="button" onClick={() => setCreating(true)}>
                {t('reading.addABook')}
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty compact">
              <h3>{t('reading.nothingTitle')}</h3>
              <p>{t('reading.nothingText')}</p>
            </div>
          ) : (
            <div className="shelf">
              {visible.map((book) => {
                const percent = bookPercent(book)
                return (
                  <article key={book.id} className="book-card tap" onClick={() => setEditing(book)}>
                    <div className="book-card-top">
                      <span className={`status ${book.status}`}>{statusLabel(book.status, t)}</span>
                      <span className="format">{formatLabel(book.format, t)}</span>
                    </div>
                    <h3>{book.title}</h3>
                    <div className="meta">
                      {book.author || t('common.unknown')}
                      {book.year ? ` · ${book.year}` : ''}
                      {book.genre ? ` · ${genreLabel(book.genre, t)}` : ''}
                    </div>
                    <div className="progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <div className="book-card-foot">
                      <span className="meta">
                        {book.pagesRead}/{book.pages || '—'} · {percent}%
                      </span>
                      <span className="stars">{stars(book.rating)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <ReadingStats />
      </div>

      {creating ? (
        <BookDialog
          onClose={() => setCreating(false)}
          onSave={(input) => {
            addBook(input)
            setCreating(false)
          }}
        />
      ) : null}

      {editing ? (
        <BookDialog
          book={editing}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            updateBook(editing.id, input)
            setEditing(null)
          }}
          onDelete={() => {
            deleteBook(editing.id)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}

type NowProps = {

  book: Book
  todayPages: number
  onOpen: () => void
  onLog: (toPage: number) => void
  onFinish: () => void
}

function NowReadingCard({ book, todayPages, onOpen, onLog, onFinish }: NowProps) {
  const { t } = useI18n()
  const [pageInput, setPageInput] = useState('')
  const percent = bookPercent(book)
  const pagesLeft = book.pages > 0 ? Math.max(0, book.pages - book.pagesRead) : null

  const submitPage = () => {
    const value = Number(pageInput)
    if (!pageInput.trim() || Number.isNaN(value)) return
    onLog(value)
    setPageInput('')
  }

  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()

  return (
    <article className="now-card tap" onClick={onOpen}>
      <div className="now-card-head">
        <div className="kicker">{t('reading.currently')}</div>
        {todayPages > 0 ? <span className="today-pill">{t('reading.todayPages', { n: todayPages })}</span> : null}
      </div>
      <h2 className="now-title">{book.title}</h2>
      <div className="meta">
        {book.author || t('common.unknownAuthor')}
        {book.genre ? ` · ${genreLabel(book.genre, t)}` : ''}
      </div>
      <div className="progress" aria-label={`${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="now-meta">
        <span>
          <b>{book.pagesRead}</b> / {book.pages || '—'} {t('reading.pagesUnit')}
        </span>
        <span className="now-percent">{percent}%</span>
        {pagesLeft != null ? <span className="meta">{t('reading.pagesLeft', { n: pagesLeft })}</span> : null}
      </div>

      <div className="page-logger" onClick={stop}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={book.pages || undefined}
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitPage()
            }
          }}
          placeholder={t('reading.pagePlaceholder', { page: book.pagesRead })}
          aria-label={t('reading.pageAria')}
        />
        <button className="primary page-save" type="button" onClick={submitPage} disabled={!pageInput.trim()}>
          {t('reading.savePage')}
        </button>
      </div>

      <div className="row-actions now-actions" onClick={stop}>
        <span className="quick-label">{t('reading.quickAdd')}</span>
        {[10, 20, 50].map((step) => (
          <button key={step} className="tiny" type="button" onClick={() => onLog(book.pagesRead + step)}>
            +{step}
          </button>
        ))}
        <button className="tiny finish" type="button" onClick={onFinish}>
          {t('reading.finish')}
        </button>
      </div>
    </article>
  )
}
