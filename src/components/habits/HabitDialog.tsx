import { useState, type CSSProperties } from 'react'
import { HABIT_COLORS, HABIT_ICONS } from '../../constants'
import { useI18n, type MessageKey } from '../../i18n'
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
  const { t } = useI18n()
  const [name, setName] = useState(habit?.name ?? '')
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(habit?.icon ?? HABIT_ICONS[0].id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const selectedMark = HABIT_ICONS.find((item) => item.id === icon)
  const markLabel = selectedMark
    ? t(`habits.icons.${selectedMark.id}` as MessageKey)
    : t('habits.customMark')

  return (
    <Dialog title={habit ? t('habits.editTitle') : t('habits.newTitle')} onClose={onClose}>
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
            <label htmlFor="habit-name">{t('habits.name')}</label>
            <input
              id="habit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('habits.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="field wide">
            <label>{t('habits.color')}</label>
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
            <label>{t('habits.mark')}</label>
            <div className="icons">
              {HABIT_ICONS.map((item) => {
                const label = t(`habits.icons.${item.id}` as MessageKey)
                return (
                <button
                  key={item.id}
                  type="button"
                  className={`icon-pick ${icon === item.id ? 'on' : ''}`}
                  onClick={() => setIcon(item.id)}
                  title={label}
                  aria-label={label}
                  aria-pressed={icon === item.id}
                >
                  <HabitMark id={item.id} />
                </button>
                )
              })}
            </div>
            <p className="mark-name">{markLabel}</p>
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
          <button className="primary" type="submit" disabled={!name.trim()}>
            {t('habits.save')}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
