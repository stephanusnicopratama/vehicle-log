/** Parse YYYY-MM-DD as local calendar date (no timezone drift). */
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayDateOnly(): string {
  return formatDateOnly(new Date())
}

export function addYears(iso: string, years: number): string {
  const date = parseDateOnly(iso)
  date.setFullYear(date.getFullYear() + years)
  return formatDateOnly(date)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseDateOnly(fromIso).getTime()
  const to = parseDateOnly(toIso).getTime()
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

export function formatDisplayDate(iso: string | null): string {
  if (!iso) return '—'
  const date = parseDateOnly(iso)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
