import { isToday, WEEKDAYS } from '../../lib/dates'
import { rateForDay } from '../../lib/habits'
import { useStore } from '../../store'

type Props = {
  cells: (string | null)[]
  selected: string
  onSelect: (date: string) => void
}

function heatClass(rate: number): string {
  if (rate <= 0) return 'heat-0'
  if (rate < 0.25) return 'heat-1'
  if (rate < 0.5) return 'heat-2'
  if (rate < 0.75) return 'heat-3'
  return 'heat-4'
}

export function HabitCalendar({ cells, selected, onSelect }: Props) {
  const { habits, completions } = useStore()

  return (
    <div className="calendar" role="grid" aria-label="Month calendar">
      {WEEKDAYS.map((day) => (
        <div key={day} className="dow">
          {day}
        </div>
      ))}
      {cells.map((date, index) => {
        if (!date) {
          return <div key={`empty-${index}`} className="day empty" />
        }
        const rate = rateForDay(habits, completions, date)
        return (
          <button
            key={date}
            type="button"
            className={`day ${heatClass(rate)} ${selected === date ? 'selected' : ''} ${isToday(date) ? 'today' : ''}`}
            onClick={() => onSelect(date)}
          >
            {Number(date.slice(-2))}
          </button>
        )
      })}
    </div>
  )
}
