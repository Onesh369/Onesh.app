import { useState, type CSSProperties } from 'react'
import { HABIT_COLORS, HABIT_ICONS } from '../../constants'
import type { Habit } from '../../types'
import { Dialog } from '../Dialog'
import { HabitMark } from './HabitMark'

type Props = {
  habit?: Habit
  onClose: () => void
  onSave: (input: { name: string; color: string; icon: string }) => void
  onDelete?: () => void
}

export function HabitDialog({ habit, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(habit?.name ?? '')
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(habit?.icon ?? HABIT_ICONS[0].id)
  const selectedMark = HABIT_ICONS.find((item) => item.id === icon)

  return (
    <Dialog title={habit ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim()
          if (!trimmed) return
          onSave({ name: trimmed, color, icon })
        }}
      >
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="habit-name">Habit name</label>
            <input
              id="habit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Read 20 pages, walk, stretch..."
              autoFocus
            />
          </div>
          <div className="field wide">
            <label>Color</label>
            <div className="swatches">
              {HABIT_COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`swatch ${color === item ? 'on' : ''}`}
                  style={{ '--pick': item } as CSSProperties}
                  onClick={() => setColor(item)}
                  aria-label={item}
                />
              ))}
            </div>
          </div>
          <div className="field wide">
            <label>Mark</label>
            <div className="icons">
              {HABIT_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`icon-pick ${icon === item.id ? 'on' : ''}`}
                  onClick={() => setIcon(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  aria-pressed={icon === item.id}
                >
                  <HabitMark id={item.id} />
                </button>
              ))}
            </div>
            <p className="mark-name">{selectedMark?.label ?? 'Custom mark'}</p>
          </div>
        </div>
        <div className="dialog-actions">
          {onDelete ? (
            <button className="danger" type="button" onClick={onDelete}>
              Delete
            </button>
          ) : null}
          <button className="ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save habit
          </button>
        </div>
      </form>
    </Dialog>
  )
}
