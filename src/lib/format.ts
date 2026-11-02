export function formatIdr(amount: number | undefined): string {
  if (amount === undefined || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatKm(km: number): string {
  return `${new Intl.NumberFormat('id-ID').format(km)} km`
}
