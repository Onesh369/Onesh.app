import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
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
  const { t, locale, localeTag } = useI18n()
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
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const submit = () => {
    const title = draft.trim()
    if (!title) return
    if (editingId && pendingSave.current) {
      updateTask(editingId, pendingSave.current())
    }
    addTask({
      title,
      date: selected,
      important: must,
    })
    setDraft('')
    setMust(false)
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
      nextLabel={isToday(selected) ? t('plan.tomorrow') : formatShort(nextDate, localeTag)}
      editing={editingId === task.id}
      dragging={draggingId === task.id}
      draggable={draggable}
      onToggle={() => toggleTask(task.id)}
      onEdit={() => setEditingId(task.id)}
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
            <div className="kicker">{isToday(selected) ? t('common.today') : selected > today ? t('common.upcoming') : t('common.review')}</div>
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
          </div>
        </div>

        <div className="plan-meter" aria-label={t('habits.doneOf', { done: progress.done, total: progress.total })}>
          <span style={{ width: `${Math.max(progress.total ? progress.rate * 100 : 0, 0)}%` }} />
        </div>
        <p className="plan-count">
          {progress.total === 0 ? t('plan.noTasks') : t('habits.doneOf', { done: progress.done, total: progress.total })}
          {progress.open > 0 ? ` · ${t('plan.openCount', { n: progress.open })}` : ''}
        </p>

        {leftovers.length > 0 ? (
          <aside className="rollover">
            <div>
              <strong>
                {leftovers.length === 1 ? t('plan.leftoverOne') : t('plan.leftoverMany', { n: leftovers.length })}
              </strong>
              <p>{t('plan.leftoverText')}</p>
            </div>
            <button className="primary" type="button" onClick={() => moveOpenTasks(yesterday, selected)}>
              {t('plan.bringOver')}
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
            placeholder={isToday(selected) ? t('plan.placeholderToday') : t('plan.placeholderOther', { date: formatShort(selected, localeTag) })}
            aria-label={t('plan.newTask')}
          />
          <button
            className={`tiny ${must ? 'on' : ''}`}
            type="button"
            onClick={() => setMust((value) => !value)}
            aria-pressed={must}
          >
            {t('plan.must')}
          </button>
          <button className="primary" type="submit">
            {t('plan.add')}
          </button>
        </form>

        {dayTasks.length === 0 ? (
          <div className="empty">
            <h3>{t('plan.emptyTitle')}</h3>
            <p>{t('plan.emptyText')}</p>
          </div>
        ) : (
          <div className="plan-list">
            {timedOpen.length > 0 ? (
              <div className="plan-group">
                <div className="kicker">{t('plan.schedule')}</div>
                {timedOpen.map((task) => renderRow(task, false))}
              </div>
            ) : null}

            {anytimeOpen.length > 0 ? (
              <div className="plan-group">
                <div className="kicker">{timedOpen.length > 0 ? t('plan.anytime') : t('plan.open')}</div>
                {anytimeOpen.map((task) => renderRow(task, true))}
              </div>
            ) : null}

            {openTasks.length === 0 && leftovers.length === 0 ? (
              <div className="empty compact">
                <h3>{t('plan.clearTitle')}</h3>
                <p>{t('plan.clearText')}</p>
              </div>
            ) : null}

            {doneTasks.length > 0 ? (
              <div className="plan-group">
                <div className="kicker">{t('plan.done', { n: doneTasks.length })}</div>
                {doneTasks.map((task) => renderRow(task, false))}
              </div>
            ) : null}

            {openTasks.length > 0 ? (
              <div className="plan-footer">
                <button className="ghost" type="button" onClick={() => moveOpenTasks(selected, nextDate)}>
                  {t('plan.moveLeftover', { date: isToday(selected) ? t('plan.tomorrow') : formatShort(nextDate, localeTag) })}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <aside className="panel">
        <div className="section-head">
          <div>
            <div className="kicker">{t('common.pulse')}</div>
            <h2>{t('plan.thisWeek')}</h2>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <b>
              {progress.done}/{progress.total || 0}
            </b>
            <span>{t('habits.thisDay')}</span>
          </div>
          <div className="stat">
            <b>{progress.open}</b>
            <span>{t('plan.stillOpen')}</span>
          </div>
          <div className="stat">
            <b>{Math.round(averageWeek(week, tasks) * 100)}%</b>
            <span>{t('plan.weekDone')}</span>
          </div>
        </div>
        <div className="bars" aria-label={t('plan.weekBars')}>
          {week.map((date) => {
            const rate = dayProgress(tasks, date).rate
            const total = dayProgress(tasks, date).total
            return (
              <button key={date} className="bar" type="button" onClick={() => setSelected(date)}>
                <i style={{ height: `${Math.max(8, total ? rate * 100 : 8)}px`, opacity: total ? 1 : 0.35 }} />
                <span>{weekdayLabel(date, locale)}</span>
              </button>
            )
          })}
        </div>
        <p className="plan-hint">
          {t('plan.hint')}
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
  const { t, localeTag } = useI18n()
  const [details, setDetails] = useState<Details>(toDetails(task))
  const [sure, setSure] = useState(false)
  const timeRef = useRef<HTMLInputElement>(null)
  const carry = rolledLabel(task, t('plan.fromYesterday'), (iso) => t('plan.fromDate', { date: formatShort(iso, localeTag) }))
  const hasDetails = Boolean(task.time || task.place || task.description)

  useEffect(() => {
    setDetails(toDetails(task))
    setSure(false)
  }, [task, editing])

  useEffect(() => {
    if (!editing) return
    onRegisterSave(() => details)
    return () => onRegisterSave(null)
  }, [editing, details, onRegisterSave])

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
        aria-label={task.done ? t('plan.uncheck', { name: task.title }) : t('plan.complete', { name: task.title })}
      >
        {task.done ? '✓' : ''}
      </button>
      <div className="task-body">
        {editing ? (
          <div className="task-editor" onKeyDown={(event) => event.key === 'Escape' && onCancelEdit()}>
            <div className="task-editor-head">
              <div className="kicker">{t('common.edit')}</div>
              <h3>{t('plan.taskDetails')}</h3>
            </div>
            <label className="task-field wide">
              <span>{t('plan.task')}</span>
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
            <div className="task-fields">
              <label className="task-field">
                <span>{t('plan.time')}</span>
                <input
                  ref={timeRef}
                  type="time"
                  value={details.time}
                  onChange={(event) => setDetails((current) => ({ ...current, time: event.target.value }))}
                />
              </label>
              <label className="task-field">
                <span>{t('plan.place')}</span>
                <input
                  type="text"
                  value={details.place}
                  onChange={(event) => setDetails((current) => ({ ...current, place: event.target.value }))}
                  placeholder={t('plan.placePlaceholder')}
                />
              </label>
              <label className="task-field wide">
                <span>{t('plan.description')}</span>
                <textarea
                  value={details.description}
                  onChange={(event) => setDetails((current) => ({ ...current, description: event.target.value }))}
                  placeholder={t('plan.descriptionPlaceholder')}
                  rows={3}
                />
              </label>
            </div>
            <div className="task-editor-actions">
              <button className="ghost" type="button" onClick={onCancelEdit}>
                {t('common.cancel')}
              </button>
              <button className="primary" type="button" onClick={() => details.title.trim() && onSave(details)}>
                {t('common.save')}
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
                {t('plan.addDetails')}
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
              {t('plan.must')}
            </button>
            <button className="tiny" type="button" onClick={onMove}>
              {nextLabel}
            </button>
          </>
        ) : null}
        <button
          className={`tiny ${sure ? 'on' : ''}`}
          type="button"
          onClick={() => {
            if (sure) onDelete()
            else setSure(true)
          }}
        >
          {sure ? t('plan.sure') : t('common.delete')}
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
