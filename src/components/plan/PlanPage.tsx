import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, formatLong, formatShort, isToday, lastNDays, todayISO, weekdayLabel } from '../../lib/dates'
import { dayProgress, leftoverOn, rolledLabel, sortDayTasks, tasksOn } from '../../lib/tasks'
import { useStore } from '../../store'
import type { Task } from '../../types'

type Details = {
  title: string
  time: string
  place: string
  description: string
}

export function PlanPage() {
  const {
    tasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    setTaskImportant,
    moveTask,
    moveOpenTasks,
    reorderOpenTasks,
  } = useStore()
  const [selected, setSelected] = useState(todayISO())
  const [draft, setDraft] = useState('')
  const [must, setMust] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [freshId, setFreshId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingSave = useRef<(() => Details) | null>(null)

  const today = todayISO()
  const canComplete = selected <= today
  const nextDate = addDays(selected, 1)
  const yesterday = addDays(selected, -1)
  const dayTasks = useMemo(() => sortDayTasks(tasksOn(tasks, selected)), [tasks, selected])
  const openTasks = dayTasks.filter((task) => !task.done)
  const timedOpen = openTasks.filter((task) => task.time)
  const anytimeOpen = openTasks.filter((task) => !task.time)
  const doneTasks = dayTasks.filter((task) => task.done)
  const progress = dayProgress(tasks, selected)
  const leftovers = isToday(selected) ? leftoverOn(tasks, yesterday) : []
  const week = lastNDays(selected, 7)

  const closeDetails = () => {
    setEditingId(null)
    setFreshId(null)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const submit = () => {
    const title = draft.trim()
    if (!title) return
    if (editingId && pendingSave.current) {
      updateTask(editingId, pendingSave.current())
    }
    const id = addTask({
      title,
      date: selected,
      important: must,
    })
    setDraft('')
    setMust(false)
    if (id) {
      setFreshId(id)
      setEditingId(id)
    }
  }

  const dropOn = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return
    const ids = anytimeOpen.map((task) => task.id)
    const from = ids.indexOf(draggingId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, draggingId)
    reorderOpenTasks(selected, next)
    setDraggingId(null)
  }

  const renderRow = (task: Task, draggable: boolean) => (
    <TaskRow
      key={task.id}
      task={task}
      canComplete={canComplete}
      nextLabel={isToday(selected) ? 'Tomorrow' : formatShort(nextDate)}
      editing={editingId === task.id}
      fresh={freshId === task.id}
      dragging={draggingId === task.id}
      draggable={draggable}
      onToggle={() => toggleTask(task.id)}
      onEdit={() => {
        setFreshId(null)
        setEditingId(task.id)
      }}
      onRegisterSave={(save) => {
        pendingSave.current = save
      }}
      onSave={(details) => {
        updateTask(task.id, details)
        closeDetails()
      }}
      onCancelEdit={closeDetails}
      onMust={() => setTaskImportant(task.id, !task.important)}
      onMove={() => moveTask(task.id, nextDate)}
      onDelete={() => deleteTask(task.id)}
      onDragStart={() => setDraggingId(task.id)}
      onDragEnd={() => setDraggingId(null)}
      onDrop={() => dropOn(task.id)}
    />
  )

  return (
    <div className="layout">
      <section className="panel">
        <div className="section-head">
          <div>
            <div className="kicker">{isToday(selected) ? 'Today' : selected > today ? 'Upcoming' : 'Review'}</div>
            <h2>{formatLong(selected)}</h2>
          </div>
          <div className="date-nav">
            <button className="icon-btn" type="button" onClick={() => setSelected(addDays(selected, -1))} aria-label="Previous day">
              ‹
            </button>
            <button className="ghost" type="button" onClick={() => setSelected(today)}>
              Today
            </button>
            <button className="icon-btn" type="button" onClick={() => setSelected(addDays(selected, 1))} aria-label="Next day">
              ›
            </button>
          </div>
        </div>

        <div className="plan-meter" aria-label={`${progress.done} of ${progress.total} done`}>
          <span style={{ width: `${Math.max(progress.total ? progress.rate * 100 : 0, 0)}%` }} />
        </div>
        <p className="plan-count">
          {progress.total === 0 ? 'No tasks yet' : `${progress.done} of ${progress.total} done`}
          {progress.open > 0 ? ` · ${progress.open} open` : ''}
        </p>

        {leftovers.length > 0 ? (
          <aside className="rollover">
            <div>
              <strong>
                {leftovers.length === 1 ? '1 leftover from yesterday' : `${leftovers.length} leftovers from yesterday`}
              </strong>
              <p>Bring them into today, or leave them on yesterday until you are ready.</p>
            </div>
            <button className="primary" type="button" onClick={() => moveOpenTasks(yesterday, selected)}>
              Bring over
            </button>
          </aside>
        ) : null}

        <form
          className="plan-composer"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isToday(selected) ? 'What would make today count?' : `Add a task for ${formatShort(selected)}`}
            aria-label="New task"
          />
          <button
            className={`tiny ${must ? 'on' : ''}`}
            type="button"
            onClick={() => setMust((value) => !value)}
            aria-pressed={must}
          >
            Must
          </button>
          <button className="primary" type="submit">
            Add
          </button>
        </form>

        {dayTasks.length === 0 ? (
          <div className="empty">
            <h3>Write the few things that matter</h3>
            <p>Write the task first. After Add, you can give it a time, a place, or a note — only if you need them.</p>
          </div>
        ) : (
          <div className="plan-list">
            {timedOpen.length > 0 ? (
              <div className="plan-group">
                <div className="kicker">Schedule</div>
                {timedOpen.map((task) => renderRow(task, false))}
              </div>
            ) : null}

            {anytimeOpen.length > 0 ? (
              <div className="plan-group">
                <div className="kicker">{timedOpen.length > 0 ? 'Anytime' : 'Open'}</div>
                {anytimeOpen.map((task) => renderRow(task, true))}
              </div>
            ) : null}

            {openTasks.length === 0 && leftovers.length === 0 ? (
              <div className="empty compact">
                <h3>This day is clear</h3>
                <p>Everything here is done. Add more, or enjoy the empty list.</p>
              </div>
            ) : null}

            {doneTasks.length > 0 ? (
              <div className="plan-group">
                <div className="kicker">Done · {doneTasks.length}</div>
                {doneTasks.map((task) => renderRow(task, false))}
              </div>
            ) : null}

            {openTasks.length > 0 ? (
              <div className="plan-footer">
                <button className="ghost" type="button" onClick={() => moveOpenTasks(selected, nextDate)}>
                  Move leftover to {isToday(selected) ? 'tomorrow' : formatShort(nextDate)}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <aside className="panel">
        <div className="section-head">
          <div>
            <div className="kicker">Pulse</div>
            <h2>This week</h2>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <b>
              {progress.done}/{progress.total || 0}
            </b>
            <span>this day</span>
          </div>
          <div className="stat">
            <b>{progress.open}</b>
            <span>still open</span>
          </div>
          <div className="stat">
            <b>{Math.round(averageWeek(week, tasks) * 100)}%</b>
            <span>week done</span>
          </div>
        </div>
        <div className="bars" aria-label="Task completion last seven days">
          {week.map((date) => {
            const rate = dayProgress(tasks, date).rate
            const total = dayProgress(tasks, date).total
            return (
              <button key={date} className="bar" type="button" onClick={() => setSelected(date)}>
                <i style={{ height: `${Math.max(8, total ? rate * 100 : 8)}px`, opacity: total ? 1 : 0.35 }} />
                <span>{weekdayLabel(date)}</span>
              </button>
            )
          })}
        </div>
        <p className="plan-hint">
          Time, place, and notes stay optional. They open after you add the task.
        </p>
      </aside>
    </div>
  )
}

function averageWeek(days: string[], tasks: Task[]) {
  const counted = days.map((date) => dayProgress(tasks, date)).filter((item) => item.total > 0)
  if (counted.length === 0) return 0
  return counted.reduce((sum, item) => sum + item.rate, 0) / counted.length
}

type RowProps = {
  task: Task
  canComplete: boolean
  nextLabel: string
  editing: boolean
  fresh: boolean
  dragging: boolean
  draggable: boolean
  onToggle: () => void
  onEdit: () => void
  onRegisterSave: (save: (() => Details) | null) => void
  onSave: (details: Details) => void
  onCancelEdit: () => void
  onMust: () => void
  onMove: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
}

function TaskRow({
  task,
  canComplete,
  nextLabel,
  editing,
  fresh,
  dragging,
  draggable,
  onToggle,
  onEdit,
  onRegisterSave,
  onSave,
  onCancelEdit,
  onMust,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  onDrop,
}: RowProps) {
  const [details, setDetails] = useState<Details>(toDetails(task))
  const timeRef = useRef<HTMLInputElement>(null)
  const carry = rolledLabel(task)
  const hasDetails = Boolean(task.time || task.place || task.description)

  useEffect(() => {
    setDetails(toDetails(task))
  }, [task, editing])

  useEffect(() => {
    if (!editing) return
    onRegisterSave(() => details)
    return () => onRegisterSave(null)
  }, [editing, details, onRegisterSave])

  useEffect(() => {
    if (editing && fresh) timeRef.current?.focus()
  }, [editing, fresh])

  return (
    <article
      className={`task ${task.done ? 'done' : ''} ${task.important && !task.done ? 'must' : ''} ${task.time ? 'timed' : ''} ${editing ? 'editing' : ''} ${dragging ? 'dragging' : ''}`}
      draggable={draggable && !editing}
      onDragStart={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, input, textarea, label')) {
          event.preventDefault()
          return
        }
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!draggable) return
        event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDrop()
      }}
    >
      <span className="task-grip" aria-hidden="true">
        ⋮⋮
      </span>
      <button
        type="button"
        className={`task-check ${task.done ? 'on' : ''}`}
        onClick={onToggle}
        disabled={!canComplete}
        aria-pressed={task.done}
        aria-label={`${task.done ? 'Uncheck' : 'Complete'} ${task.title}`}
      >
        {task.done ? '✓' : ''}
      </button>
      <div className="task-body">
        {editing ? (
          <div className="task-editor" onKeyDown={(event) => event.key === 'Escape' && onCancelEdit()}>
            <div className="task-editor-head">
              <div className="kicker">{fresh ? 'Optional' : 'Edit'}</div>
              <h3>{fresh ? task.title : 'Task details'}</h3>
              {fresh ? <p>Add a time, a place, or a note only if you need them.</p> : null}
            </div>
            {fresh ? null : (
              <label className="task-field wide">
                <span>Task</span>
                <input
                  className="task-edit"
                  value={details.title}
                  autoFocus
                  onChange={(event) => setDetails((current) => ({ ...current, title: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      if (details.title.trim()) onSave(details)
                    }
                    if (event.key === 'Escape') onCancelEdit()
                  }}
                />
              </label>
            )}
            <div className="task-fields">
              <label className="task-field">
                <span>Time</span>
                <input
                  ref={timeRef}
                  type="time"
                  value={details.time}
                  onChange={(event) => setDetails((current) => ({ ...current, time: event.target.value }))}
                />
              </label>
              <label className="task-field">
                <span>Place</span>
                <input
                  type="text"
                  value={details.place}
                  onChange={(event) => setDetails((current) => ({ ...current, place: event.target.value }))}
                  placeholder="Farm, home, gym..."
                />
              </label>
              <label className="task-field wide">
                <span>Description</span>
                <textarea
                  value={details.description}
                  onChange={(event) => setDetails((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Anything you want to remember"
                  rows={3}
                />
              </label>
            </div>
            <div className="task-editor-actions">
              <button className="ghost" type="button" onClick={onCancelEdit}>
                {fresh ? 'Skip' : 'Cancel'}
              </button>
              <button className="primary" type="button" onClick={() => details.title.trim() && onSave(details)}>
                {fresh ? 'Done' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="task-title" type="button" onClick={onEdit}>
              {task.title}
            </button>
            {task.time || task.place || carry ? (
              <div className="task-meta">
                {task.time ? <span className="task-time">{task.time}</span> : null}
                {task.place ? <span className="task-place">{task.place}</span> : null}
                {carry ? <span className="task-carry">{carry}</span> : null}
              </div>
            ) : null}
            {task.description ? <p className="task-notes-preview">{task.description}</p> : null}
            {!hasDetails && !task.done ? (
              <button className="task-hint" type="button" onClick={onEdit}>
                Add time, place or note
              </button>
            ) : null}
          </>
        )}
      </div>
      {!editing ? (
      <div className="task-actions">
        {!task.done ? (
          <>
            <button className={`tiny ${task.important ? 'on' : ''}`} type="button" onClick={onMust} aria-pressed={task.important}>
              Must
            </button>
            <button className="tiny" type="button" onClick={onMove}>
              {nextLabel}
            </button>
          </>
        ) : null}
        <button className="tiny" type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
      ) : null}
    </article>
  )
}

function toDetails(task: Task): Details {
  return {
    title: task.title,
    time: task.time ?? '',
    place: task.place ?? '',
    description: task.description ?? '',
  }
}
