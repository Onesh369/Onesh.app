import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useI18n } from '../../i18n'
import { addDays, formatLong, isToday, lastNDays, todayISO } from '../../lib/dates'
import { sortHabits } from '../../lib/habits'
import { useStore } from '../../store'
import type { Habit, StatRange } from '../../types'
import { HabitDialog } from './HabitDialog'
import { HabitMark } from './HabitMark'
import { HabitStats } from './HabitStats'

export function HabitsPage() {
  const { t, localeTag } = useI18n()
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
            <div className="kicker">{isToday(selected) ? t('common.today') : t('common.review')}</div>
            <h2>{formatLong(selected, localeTag)}</h2>
          </div>
          <div className="date-nav">
            <button className="icon-btn" type="button" onClick={() => setSelected(addDays(selected, -1))} aria-label={t('common.previousDay')}>
              ‹
            </button>
            <button
              className={`ghost ${isToday(selected) ? '' : 'today-jump'}`}
              type="button"
              onClick={() => setSelected(today)}
            >
              {t('common.today')}
            </button>
            <button className="icon-btn" type="button" onClick={() => setSelected(addDays(selected, 1))} aria-label={t('common.nextDay')}>
              ›
            </button>
            <button className="primary" type="button" onClick={() => setCreating(true)}>
              {t('habits.add')}
            </button>
          </div>
        </div>

        {habits.length > 0 ? (
          <>
            <div className="plan-meter" aria-label={t('habits.doneOf', { done: doneSelected, total: habits.length })}>
              <span style={{ width: `${(doneSelected / habits.length) * 100}%` }} />
            </div>
            <p className="plan-count">
              {t('habits.doneOf', { done: doneSelected, total: habits.length })}
              {doneSelected === habits.length && selected <= today ? ` · ${t('habits.allClear')}` : ''}
            </p>
          </>
        ) : null}

        {selected > today ? (
          <p className="future-note">{t('habits.futureNote')}</p>
        ) : null}

        {habits.length === 0 ? (
          <div className="empty">
            <h3>{t('habits.emptyTitle')}</h3>
            <p>{t('habits.emptyText')}</p>
            <button className="primary" type="button" onClick={() => setCreating(true)}>
              {t('habits.addFirst')}
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
                      aria-label={t('habits.moveUp', { name: habit.name })}
                      disabled={!canReorder || index === 0}
                      onClick={() => moveBy(habit.id, -1)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
                    </button>
                    <span
                      className="habit-grip"
                      role="button"
                      tabIndex={canReorder ? 0 : -1}
                      aria-label={t('habits.reorder', { name: habit.name })}
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
                      aria-label={t('habits.moveDown', { name: habit.name })}
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
                    aria-label={done ? t('habits.uncheck', { name: habit.name }) : t('habits.complete', { name: habit.name })}
                  >
                    <HabitMark id={habit.icon} />
                  </button>
                  <div className="habit-meta">
                    <h3>
                      {habit.name}
                      <span className="streak streak-inline">{t('habits.dayStreakShort', { n: streak(habit.id) })}</span>
                      <button className="tiny habit-edit-mobile" type="button" onClick={() => setEditing(habit)}>
                        {t('common.edit')}
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
                          aria-label={`${date}${isDone(habit.id, date) ? t('habits.doneSuffix') : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="habit-side">
                    <span className="streak">{t('habits.dayStreak', { n: streak(habit.id) })}</span>
                    <button className="tiny" type="button" onClick={() => setEditing(habit)}>
                      {t('common.edit')}
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
