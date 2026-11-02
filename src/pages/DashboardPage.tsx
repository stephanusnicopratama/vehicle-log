import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import { formatDisplayDate } from '../domain/dates'
import { getTaxReminderStatus } from '../domain/reminders'
import { TAX_TYPE_LABELS, type MaintenanceRecord } from '../domain/types'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/EmptyState'
import { formatKm } from '../lib/format'

function lastOilChange(
  records: MaintenanceRecord[],
  vehicleId: string,
): MaintenanceRecord | undefined {
  return records
    .filter((r) => r.vehicleId === vehicleId && r.type === 'oil_change')
    .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))[0]
}

export function DashboardPage() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const taxSchedules = useLiveQuery(() => db.taxSchedules.toArray(), [])
  const maintenance = useLiveQuery(() => db.maintenanceRecords.toArray(), [])

  if (vehicles === undefined) {
    return <p className="text-slate-400">Memuat…</p>
  }

  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="Belum ada kendaraan"
        description="Tambahkan kendaraan pertama untuk melacak oli, spare part, dan jadwal pajak."
        actionLabel="Tambah kendaraan"
        actionTo="/vehicles"
      />
    )
  }

  const alerts =
    taxSchedules?.flatMap((schedule) => {
      const status = getTaxReminderStatus(schedule)
      if (status !== 'overdue' && status !== 'upcoming') return []
      const vehicle = vehicles.find((v) => v.id === schedule.vehicleId)
      return [{ schedule, status, vehicle }]
    }) ?? []

  alerts.sort((a, b) => {
    const da = a.schedule.nextDueDate ?? ''
    const db_ = b.schedule.nextDueDate ?? ''
    return da.localeCompare(db_)
  })

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Peringatan pajak
        </h2>
        {alerts.length === 0 ? (
          <p className="rounded-xl bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            Tidak ada pajak yang jatuh tempo atau terlambat.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map(({ schedule, status, vehicle }) => (
              <li
                key={schedule.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">
                      {vehicle?.nickname ?? 'Kendaraan'}
                      {vehicle?.plateNumber
                        ? ` · ${vehicle.plateNumber}`
                        : ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {TAX_TYPE_LABELS[schedule.taxType]}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Jatuh tempo:{' '}
                      {formatDisplayDate(schedule.nextDueDate)}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                {vehicle && (
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Kelola pajak →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Ganti oli terakhir
        </h2>
        <ul className="space-y-3">
          {vehicles.map((vehicle) => {
            const oil = maintenance
              ? lastOilChange(maintenance, vehicle.id)
              : undefined
            return (
              <li
                key={vehicle.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{vehicle.nickname}</p>
                  <p className="text-sm text-slate-400">
                    {oil
                      ? `${formatDisplayDate(oil.serviceDate)} · ${formatKm(oil.odometerKm)}`
                      : 'Belum tercatat'}
                  </p>
                </div>
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Detail
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
