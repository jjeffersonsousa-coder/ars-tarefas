import { Activity, RecurrenceType, WeekendHandling } from './types'

function addInterval(date: Date, type: RecurrenceType, interval: number): Date {
  const d = new Date(date)
  switch (type) {
    case 'daily':
      d.setDate(d.getDate() + interval)
      break
    case 'weekly':
      d.setDate(d.getDate() + interval * 7)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + interval)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + interval)
      break
  }
  return d
}

function applyWeekendHandling(date: Date, handling: WeekendHandling): Date {
  const day = date.getDay() // 0=Sun, 6=Sat
  if (handling === 'before') {
    if (day === 6) date.setDate(date.getDate() - 1) // Sat → Fri
    if (day === 0) date.setDate(date.getDate() - 2) // Sun → Fri
  } else if (handling === 'after') {
    if (day === 6) date.setDate(date.getDate() + 2) // Sat → Mon
    if (day === 0) date.setDate(date.getDate() + 1) // Sun → Mon
  }
  return date
}

function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Returns the next due_date string for a recurring activity, or null if the series ended. */
export function nextRecurrenceDate(activity: Activity): string | null {
  if (!activity.is_recurring || !activity.recurrence_type) return null

  const base = activity.due_date ? new Date(activity.due_date + 'T12:00:00') : new Date()
  const interval = activity.recurrence_interval ?? 1
  const handling = activity.weekend_handling ?? 'none'

  let next = addInterval(base, activity.recurrence_type, interval)
  if (handling !== 'none') next = applyWeekendHandling(next, handling)

  // Check if past the end date
  if (activity.recurrence_end_date) {
    const end = new Date(activity.recurrence_end_date + 'T23:59:59')
    if (next > end) return null
  }

  return toDateStr(next)
}

/** Builds the payload for the next occurrence of a recurring activity. */
export function buildNextOccurrence(activity: Activity, nextDate: string): Partial<Activity> {
  return {
    entity_id: activity.entity_id,
    department_id: activity.department_id,
    title: activity.title,
    description: activity.description,
    context: activity.context,
    responsible_id: activity.responsible_id,
    priority: activity.priority,
    status: 'pendente',
    due_date: nextDate,
    follow_up_date: null,
    created_by: activity.created_by,
    is_recurring: true,
    recurrence_type: activity.recurrence_type,
    recurrence_interval: activity.recurrence_interval,
    recurrence_days: activity.recurrence_days,
    recurrence_end_date: activity.recurrence_end_date,
    weekend_handling: activity.weekend_handling,
    updated_at: new Date().toISOString(),
  }
}
