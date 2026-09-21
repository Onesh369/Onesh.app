import { useMemo, useState } from 'react'
import { FORMATS, STATUSES } from '../../constants'
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

function statusLabel(status: BookStatus): string {
  return STATUSES.find((item) => item.id === status)?.label ?? status
}

function formatLabel(format: Book['format']): string {
  return FORMATS.find((item) => item.id === format)?.label ?? format
}

export function ReadingPage() {
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
              <div className="kicker">Library</div>
              <h2>Books</h2>
            </div>
            <div className="filters">
              <input
                className="search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or author"
                aria-label="Search books"
              />
              {(['all', 'reading', 'read', 'stopped'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${filter === item ? 'active' : ''}`}
                  onClick={() => setFilter(item)}
                >
                  {item === 'all' ? 'All' : statusLabel(item)}
                </button>
              ))}
              <button className="primary" type="button" onClick={() => setCreating(true)}>
                Add book
              </button>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="empty">
              <h3>Your shelf is empty</h3>
              <p>Add a title, page count, and start date. Progress and percentage fill in as you read.</p>
              <button className="primary" type="button" onClick={() => setCreating(true)}>
                Add a book
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty compact">
              <h3>Nothing matches</h3>
              <p>Try another filter, or clear the search.</p>
            </div>
          ) : (
            <div className="shelf">
              {visible.map((book) => {
                const percent = bookPercent(book)
                return (
                  <article key={book.id} className="book-card tap" onClick={() => setEditing(book)}>
                    <div className="book-card-top">
                      <span className={`status ${book.status}`}>{statusLabel(book.status)}</span>
                      <span className="format">{formatLabel(book.format)}</span>
                    </div>
                    <h3>{book.title}</h3>
                    <div className="meta">
                      {book.author || 'Unknown'}
                      {book.year ? ` · ${book.year}` : ''}
                      {book.genre ? ` · ${book.genre}` : ''}
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
        <div className="kicker">Currently reading</div>
        {todayPages > 0 ? <span className="today-pill">+{todayPages} today</span> : null}
      </div>
      <h2 className="now-title">{book.title}</h2>
      <div className="meta">
        {book.author || 'Unknown author'}
        {book.genre ? ` · ${book.genre}` : ''}
      </div>
      <div className="progress" aria-label={`${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="now-meta">
        <span>
          <b>{book.pagesRead}</b> / {book.pages || '—'} pages
        </span>
        <span className="now-percent">{percent}%</span>
        {pagesLeft != null ? <span className="meta">{pagesLeft} left</span> : null}
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
          placeholder={`On page… (was ${book.pagesRead})`}
          aria-label="Current page reached"
        />
        <button className="primary page-save" type="button" onClick={submitPage} disabled={!pageInput.trim()}>
          Save page
        </button>
      </div>

      <div className="row-actions now-actions" onClick={stop}>
        <span className="quick-label">Quick add</span>
        {[10, 20, 50].map((step) => (
          <button key={step} className="tiny" type="button" onClick={() => onLog(book.pagesRead + step)}>
            +{step}
          </button>
        ))}
        <button className="tiny finish" type="button" onClick={onFinish}>
          Finish
        </button>
      </div>
    </article>
  )
}
