import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { addDays, formatLong, isToday, lastNDays, todayISO } from '../../lib/dates'
import { sortHabits } from '../../lib/habits'
import { useStore } from '../../store'
import type { Habit, StatRange } from '../../types'
import { HabitDialog } from './HabitDialog'
import { HabitMark } from './HabitMark'
import { HabitStats } from './HabitStats'

export function HabitsPage() {
  const { habits, addHabit, updateHabit, deleteHabit, reorderHabits, toggleHabit, isDone, streak } = useStore()
  const ordered = useMemo(() => sortHabits(habits), [habits])
  const [selected, setSelected] = useState(todayISO())
  const [range, setRange] = useState<StatRange>('day')
  const [editing, setEditing] = useState<Habit | null>(null)
  const [creating, setCreating] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [popId, setPopId] = useState<string | null>(null)
  const draggingIdRef = useRef<string | null>(null)
  const orderedRef = useRef(ordered)
  orderedRef.current = ordered
  const today = todayISO()
  const doneSelected = ordered.filter((habit) => isDone(habit.id, selected)).length

  const moveTo = (targetId: string) => {
    const current = draggingIdRef.current
    if (!current || current === targetId) return
    const ids = orderedRef.current.map((habit) => habit.id)
    const from = ids.indexOf(current)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, current)
    reorderHabits(next)
  }

  const moveBy = (id: string, delta: number) => {
    const ids = orderedRef.current.map((habit) => habit.id)
    const from = ids.indexOf(id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= ids.length) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, id)
    reorderHabits(next)
  }

  const canReorder = ordered.length > 1

  const beginDrag = (habitId: string) => {
    draggingIdRef.current = habitId
    setDraggingId(habitId)
  }

  const stopDrag = () => {
    draggingIdRef.current = null
    setDraggingId(null)
  }

  const startPointerDrag = (habitId: string, event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0 || !canReorder) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    beginDrag(habitId)
  }

  const onGripPointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const current = draggingIdRef.current
    if (!current) return
    const node = document.elementFromPoint(event.clientX, event.clientY)
    const row = node instanceof Element ? node.closest<HTMLElement>('[data-habit-id]') : null
    const targetId = row?.dataset.habitId
    if (!row || !targetId || targetId === current) return
    const rect = row.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    const ids = orderedRef.current.map((habit) => habit.id)
    const from = ids.indexOf(current)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    if (from < to && event.clientY < mid) return
    if (from > to && event.clientY > mid) return
    moveTo(targetId)
  }

  const endPointerDrag = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    stopDrag()
  }

  return (
    <div className="layout">
      <section className="panel">
        <div className="section-head">
          <div>
            <div className="kicker">{isToday(selected) ? 'Today' : 'Review'}</div>
            <h2>{formatLong(selected)}</h2>
          </div>
          <div className="date-nav">
            <button className="icon-btn" type="button" onClick={() => setSelected(addDays(selected, -1))} aria-label="Previous day">
              ‹
            </button>
            <button
              className={`ghost ${isToday(selected) ? '' : 'today-jump'}`}
              type="button"
              onClick={() => setSelected(today)}
            >
              Today
            </button>
            <button className="icon-btn" type="button" onClick={() => setSelected(addDays(selected, 1))} aria-label="Next day">
              ›
            </button>
            <button className="primary" type="button" onClick={() => setCreating(true)}>
              Add habit
            </button>
          </div>
        </div>

        {habits.length > 0 ? (
          <>
            <div className="plan-meter" aria-label={`${doneSelected} of ${habits.length} done`}>
              <span style={{ width: `${(doneSelected / habits.length) * 100}%` }} />
            </div>
            <p className="plan-count">
              {doneSelected} of {habits.length} done
              {doneSelected === habits.length && selected <= today ? ' · All clear' : ''}
            </p>
          </>
        ) : null}

        {selected > today ? (
          <p className="future-note">This day has not started yet. You can look around — checks wait until it arrives.</p>
        ) : null}

        {habits.length === 0 ? (
          <div className="empty">
            <h3>Start with one small habit</h3>
            <p>Tap the circle each day. The calendar and stats fill themselves.</p>
            <button className="primary" type="button" onClick={() => setCreating(true)}>
              Add your first habit
            </button>
          </div>
        ) : (
          <div className="habits">
            {ordered.map((habit, index) => {
              const done = isDone(habit.id, selected)
              return (
                <article
                  key={habit.id}
                  className={`habit ${draggingId === habit.id ? 'dragging' : ''}`}
                  data-habit-id={habit.id}
                  onPointerMove={(event) => {
                    if (draggingIdRef.current) onGripPointerMove(event)
                  }}
                >
                  <div className="habit-reorder" aria-hidden={!canReorder}>
                    <button
                      type="button"
                      className="reorder-btn"
                      aria-label={`Move ${habit.name} up`}
                      disabled={!canReorder || index === 0}
                      onClick={() => moveBy(habit.id, -1)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
                    </button>
                    <span
                      className="habit-grip"
                      role="button"
                      tabIndex={canReorder ? 0 : -1}
                      aria-label={`Reorder ${habit.name}. Drag, or use arrow keys to move.`}
                      aria-disabled={!canReorder}
                      onPointerDown={(event) => startPointerDrag(habit.id, event)}
                      onPointerMove={onGripPointerMove}
                      onPointerUp={endPointerDrag}
                      onPointerCancel={endPointerDrag}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowUp') {
                          event.preventDefault()
                          moveBy(habit.id, -1)
                        }
                        if (event.key === 'ArrowDown') {
                          event.preventDefault()
                          moveBy(habit.id, 1)
                        }
                      }}
                    >
                      ⋮⋮
                    </span>
                    <button
                      type="button"
                      className="reorder-btn"
                      aria-label={`Move ${habit.name} down`}
                      disabled={!canReorder || index === ordered.length - 1}
                      onClick={() => moveBy(habit.id, 1)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`habit-check ${done ? 'done' : ''} ${popId === habit.id ? 'pop' : ''}`}
                    style={{
                      background: done ? habit.color : 'transparent',
                      borderColor: habit.color,
                      color: done ? '#fff' : habit.color,
                    }}
                    onAnimationEnd={() => {
                      if (popId === habit.id) setPopId(null)
                    }}
                    onClick={() => {
                      if (selected > today) return
                      toggleHabit(habit.id, selected)
                      if (!done) {
                        setPopId(habit.id)
                        try {
                          navigator.vibrate?.(12)
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                    disabled={selected > today}
                    aria-pressed={done}
                    aria-label={`${done ? 'Uncheck' : 'Complete'} ${habit.name}`}
                  >
                    <HabitMark id={habit.icon} />
                  </button>
                  <div className="habit-meta">
                    <h3>
                      {habit.name}
                      <span className="streak streak-inline">{streak(habit.id)}d</span>
                      <button className="tiny habit-edit-mobile" type="button" onClick={() => setEditing(habit)}>
                        Edit
                      </button>
                    </h3>
                    <div className="week-dots">
                      {lastNDays(selected, 7).map((date) => (
                        <button
                          key={date}
                          type="button"
                          className={`week-dot ${isDone(habit.id, date) ? 'on' : ''} ${isToday(date) ? 'today' : ''} ${selected === date ? 'picked' : ''}`}
                          style={{ '--habit': habit.color } as CSSProperties}
                          onClick={() => setSelected(date)}
                          aria-label={`${date}${isDone(habit.id, date) ? ', done' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="habit-side">
                    <span className="streak">{streak(habit.id)} day streak</span>
                    <button className="tiny" type="button" onClick={() => setEditing(habit)}>
                      Edit
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <HabitStats selected={selected} range={range} onRange={setRange} onSelect={setSelected} />

      {creating ? (
        <HabitDialog
          onClose={() => setCreating(false)}
          onSave={(input) => {
            addHabit(input)
            setCreating(false)
          }}
        />
      ) : null}

      {editing ? (
        <HabitDialog
          habit={editing}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            updateHabit(editing.id, input)
            setEditing(null)
          }}
          onDelete={() => {
            deleteHabit(editing.id)
            setEditing(null)
          }}
        />
      ) : null}
    </div>
  )
}
