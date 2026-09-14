import { useMemo, useState } from 'react'
import { FORMATS, STATUSES } from '../../constants'
import { bookPercent, normalizeBook } from '../../lib/books'
import { yearOf, todayISO } from '../../lib/dates'
import { useStore } from '../../store'
import type { Book, BookStatus } from '../../types'
import { BookDialog } from './BookDialog'

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
  const { books, addBook, updateBook, deleteBook } = useStore()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [filter, setFilter] = useState<'all' | BookStatus>('all')

  const visible = useMemo(() => {
    const list = filter === 'all' ? books : books.filter((book) => book.status === filter)
    const rank = { reading: 0, stopped: 1, read: 2 }
    return [...list].sort((a, b) => rank[a.status] - rank[b.status] || a.title.localeCompare(b.title))
  }, [books, filter])

  const current = books.filter((book) => book.status === 'reading')
  const thisYear = yearOf(todayISO())
  const finishedYear = books.filter((book) => book.status === 'read' && book.dateFinish.startsWith(String(thisYear)))
  const pagesYear = finishedYear.reduce((sum, book) => sum + book.pages, 0)
  const rated = books.filter((book) => book.rating > 0)
  const avgRating = rated.length
    ? (rated.reduce((sum, book) => sum + book.rating, 0) / rated.length).toFixed(1)
    : '—'

  return (
    <div>
      <div className="stat-grid four" style={{ marginBottom: 22 }}>
        <div className="stat">
          <b>{current.length}</b>
          <span>currently reading</span>
        </div>
        <div className="stat">
          <b>{finishedYear.length}</b>
          <span>finished {thisYear}</span>
        </div>
        <div className="stat">
          <b>{pagesYear}</b>
          <span>pages this year</span>
        </div>
        <div className="stat">
          <b>{avgRating}</b>
          <span>avg rating</span>
        </div>
      </div>

      {current.length > 0 ? (
        <section className="reading-hero">
          {current.map((book) => {
            const percent = bookPercent(book)
            return (
              <article key={book.id} className="now-card">
                <div className="kicker">In progress</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '6px 0 4px' }}>{book.title}</h2>
                <div className="meta">
                  {book.author || 'Unknown author'}
                  {book.genre ? ` · ${book.genre}` : ''}
                </div>
                <div className="progress" aria-label={`${percent}%`}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <div className="meta">
                  {book.pagesRead} / {book.pages || '—'} pages · {percent}%
                </div>
                <div className="row-actions" style={{ marginTop: 12 }}>
                  {[10, 20, 50].map((step) => (
                    <button
                      key={step}
                      className="tiny"
                      type="button"
                      onClick={() => {
                        const { id, createdAt: _createdAt, ...rest } = book
                        updateBook(id, normalizeBook({ ...rest, pagesRead: rest.pagesRead + step }))
                      }}
                    >
                      +{step} pages
                    </button>
                  ))}
                  <button className="tiny" type="button" onClick={() => setEditing(book)}>
                    Edit
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      ) : null}

      <section className="panel">
        <div className="toolbar">
          <div>
            <div className="kicker">Library</div>
            <h2>Books</h2>
          </div>
          <div className="filters">
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

        {visible.length === 0 ? (
          <div className="empty">
            <h3>Your shelf is empty</h3>
            <p>Add a title, page count, and start date. Progress and percentage fill in as you read.</p>
            <button className="primary" type="button" onClick={() => setCreating(true)}>
              Add a book
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrap table-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Book name</th>
                    <th>Author</th>
                    <th>Year</th>
                    <th>Pages</th>
                    <th>Pages read</th>
                    <th>%</th>
                    <th>Progress</th>
                    <th>Rating</th>
                    <th>Start</th>
                    <th>Finish</th>
                    <th>Format</th>
                    <th>Genre</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((book) => {
                    const percent = bookPercent(book)
                    return (
                      <tr key={book.id}>
                        <td className="book-title">{book.title}</td>
                        <td>{book.author || '—'}</td>
                        <td>{book.year || '—'}</td>
                        <td>{book.pages || '—'}</td>
                        <td>{book.pagesRead || 0}</td>
                        <td>{percent}%</td>
                        <td style={{ minWidth: 90 }}>
                          <div className="progress">
                            <span style={{ width: `${percent}%` }} />
                          </div>
                        </td>
                        <td className="stars">{stars(book.rating)}</td>
                        <td>{book.dateStart || '—'}</td>
                        <td>{book.dateFinish || '—'}</td>
                        <td>
                          <span className="format">{formatLabel(book.format)}</span>
                        </td>
                        <td>{book.genre}</td>
                        <td>
                          <span className={`status ${book.status}`}>{statusLabel(book.status)}</span>
                        </td>
                        <td>
                          <button className="tiny" type="button" onClick={() => setEditing(book)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="cards-mobile">
              {visible.map((book) => {
                const percent = bookPercent(book)
                return (
                  <article key={book.id} className="book-card">
                    <div className="kicker">{statusLabel(book.status)}</div>
                    <h3>{book.title}</h3>
                    <div className="meta">
                      {book.author || 'Unknown'} · {book.year || 'n.d.'} · {book.genre}
                    </div>
                    <div className="progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <div className="meta">
                      {book.pagesRead}/{book.pages || '—'} · {percent}% · {formatLabel(book.format)}
                    </div>
                    <div className="meta" style={{ marginTop: 6 }}>
                      {stars(book.rating)} · {book.dateStart || 'no start'} → {book.dateFinish || '—'}
                    </div>
                    <button className="tiny" type="button" onClick={() => setEditing(book)} style={{ marginTop: 10 }}>
                      Edit
                    </button>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>

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
