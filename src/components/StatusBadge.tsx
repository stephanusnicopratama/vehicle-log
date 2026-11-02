import type { ReminderStatus } from '../domain/types'
import {
  REMINDER_STATUS_LABELS,
  statusBadgeClass,
} from '../domain/reminders'

export function StatusBadge({ status }: { status: ReminderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(status)}`}
    >
      {REMINDER_STATUS_LABELS[status]}
    </span>
  )
}
