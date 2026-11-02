import type { ReminderStatus, TaxSchedule } from './types'
import { daysBetween, todayDateOnly } from './dates'

export function getTaxReminderStatus(
  schedule: TaxSchedule,
  today: string = todayDateOnly(),
): ReminderStatus {
  if (!schedule.nextDueDate) return 'unset'
  const daysUntil = daysBetween(today, schedule.nextDueDate)
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= schedule.remindDaysBefore) return 'upcoming'
  return 'ok'
}

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  overdue: 'Terlambat',
  upcoming: 'Segera jatuh tempo',
  ok: 'Aman',
  unset: 'Belum diatur',
}

export function statusBadgeClass(status: ReminderStatus): string {
  switch (status) {
    case 'overdue':
      return 'bg-red-500/20 text-red-300 ring-red-500/40'
    case 'upcoming':
      return 'bg-amber-500/20 text-amber-200 ring-amber-500/40'
    case 'ok':
      return 'bg-emerald-500/20 text-emerald-200 ring-emerald-500/40'
    default:
      return 'bg-slate-500/20 text-slate-300 ring-slate-500/40'
  }
}
