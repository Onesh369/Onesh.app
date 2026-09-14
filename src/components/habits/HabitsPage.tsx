import { useState, type CSSProperties } from 'react'
import { addDays, formatLong, isToday, lastNDays, todayISO } from '../../lib/dates'
import { useStore } from '../../store'
import type { Habit, StatRange } from '../../types'
import { HabitDialog } from './HabitDialog'
import { HabitMark } from './HabitMark'
import { HabitStats } from './HabitStats'

export function HabitsPage() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabit, isDone, streak } = useStore()
  const [selected, setSelected] = useState(todayISO())
  const [range, setRange] = useState<StatRange>('day')
  const [editing, setEditing] = useState<Habit | null>(null)
  const [creating, setCreating] = useState(false)

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
            <button className="ghost" type="button" onClick={() => setSelected(todayISO())}>
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
            {habits.map((habit) => {
              const done = isDone(habit.id, selected)
              return (
                <article key={habit.id} className="habit">
                  <button
                    type="button"
                    className={`habit-check ${done ? 'done' : ''}`}
                    style={{
                      background: done ? habit.color : 'transparent',
                      borderColor: habit.color,
                      color: done ? '#fff' : habit.color,
                    }}
                    onClick={() => {
                      if (selected > todayISO()) return
                      toggleHabit(habit.id, selected)
                    }}
                    disabled={selected > todayISO()}
                    aria-pressed={done}
                    aria-label={`${done ? 'Uncheck' : 'Complete'} ${habit.name}`}
                  >
                    <HabitMark id={habit.icon} />
                  </button>
                  <div className="habit-meta">
                    <h3>
                      {habit.name}
                      <button className="tiny habit-edit-mobile" type="button" onClick={() => setEditing(habit)}>
                        Edit
                      </button>
                    </h3>
                    <div className="week-dots" aria-hidden="true">
                      {lastNDays(selected, 7).map((date) => (
                        <span
                          key={date}
                          className={`week-dot ${isDone(habit.id, date) ? 'on' : ''}`}
                          style={{ '--habit': habit.color } as CSSProperties}
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
