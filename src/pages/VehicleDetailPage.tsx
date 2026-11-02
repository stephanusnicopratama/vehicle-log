import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, deleteVehicle, newId } from '../db/database'
import { formatDisplayDate, todayDateOnly } from '../domain/dates'
import { markTaxPaid } from '../domain/tax'
import { getTaxReminderStatus } from '../domain/reminders'
import {
  MAINTENANCE_TYPE_LABELS,
  TAX_TYPE_LABELS,
  type MaintenanceRecord,
  type MaintenanceType,
  type TaxSchedule,
  type Vehicle,
} from '../domain/types'
import { StatusBadge } from '../components/StatusBadge'
import { formatIdr, formatKm } from '../lib/format'

type Tab = 'maintenance' | 'tax' | 'edit'

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('maintenance')
  const [maintFilter, setMaintFilter] = useState<'all' | MaintenanceType>(
    'all',
  )

  const vehicle = useLiveQuery(
    () => (id ? db.vehicles.get(id) : undefined),
    [id],
  )
  const records = useLiveQuery(
    () =>
      id
        ? db.maintenanceRecords.where('vehicleId').equals(id).toArray()
        : [],
    [id],
  )
  const taxSchedules = useLiveQuery(
    () =>
      id ? db.taxSchedules.where('vehicleId').equals(id).toArray() : [],
    [id],
  )

  const sortedRecords = useMemo(() => {
    if (!records) return []
    const list = [...records].sort((a, b) =>
      b.serviceDate.localeCompare(a.serviceDate),
    )
    if (maintFilter === 'all') return list
    return list.filter((r) => r.type === maintFilter)
  }, [records, maintFilter])

  if (vehicle === undefined) {
    return <p className="text-slate-400">Memuat…</p>
  }

  if (!vehicle) {
    return (
      <div>
        <p className="text-slate-300">Kendaraan tidak ditemukan.</p>
        <Link to="/vehicles" className="mt-4 inline-block text-emerald-400">
          ← Kembali
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/vehicles"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          ← Kendaraan
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-white">
          {vehicle.nickname}
        </h2>
        <p className="text-slate-400">
          {[vehicle.plateNumber, vehicle.makeModel]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Odometer: {formatKm(vehicle.currentOdometerKm)}
        </p>
      </div>

      <div className="flex gap-2 rounded-xl bg-slate-900 p-1">
        {(
          [
            ['maintenance', 'Perawatan'],
            ['tax', 'Pajak'],
            ['edit', 'Edit'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tab === key
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'maintenance' && (
        <MaintenanceSection
          vehicleId={vehicle.id}
          defaultKm={vehicle.currentOdometerKm}
          records={sortedRecords}
          filter={maintFilter}
          onFilterChange={setMaintFilter}
          onOdometerUpdate={async (km) => {
            await db.vehicles.update(vehicle.id, { currentOdometerKm: km })
          }}
        />
      )}

      {tab === 'tax' && taxSchedules && (
        <TaxSection schedules={taxSchedules} />
      )}

      {tab === 'edit' && (
        <EditVehicleForm
          vehicle={vehicle}
          onSaved={() => setTab('maintenance')}
          onDelete={async () => {
            const ok = window.confirm('Hapus kendaraan ini?')
            if (!ok) return
            await deleteVehicle(vehicle.id)
            navigate('/vehicles')
          }}
        />
      )}
    </div>
  )
}

function MaintenanceSection({
  vehicleId,
  defaultKm,
  records,
  filter,
  onFilterChange,
  onOdometerUpdate,
}: {
  vehicleId: string
  defaultKm: number
  records: MaintenanceRecord[]
  filter: 'all' | MaintenanceType
  onFilterChange: (f: 'all' | MaintenanceType) => void
  onOdometerUpdate: (km: number) => Promise<void>
}) {
  const [mode, setMode] = useState<'oil' | 'part' | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('oil')}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
        >
          + Ganti oli
        </button>
        <button
          type="button"
          onClick={() => setMode('part')}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
        >
          + Spare part
        </button>
      </div>

      {mode === 'oil' && (
        <MaintenanceForm
          vehicleId={vehicleId}
          type="oil_change"
          defaultKm={defaultKm}
          titleLabel="Jenis oli (opsional)"
          defaultTitle="Ganti oli"
          onDone={async (km) => {
            await onOdometerUpdate(km)
            setMode(null)
          }}
          onCancel={() => setMode(null)}
        />
      )}
      {mode === 'part' && (
        <MaintenanceForm
          vehicleId={vehicleId}
          type="part_replacement"
          defaultKm={defaultKm}
          titleLabel="Nama komponen / part"
          defaultTitle=""
          onDone={async (km) => {
            await onOdometerUpdate(km)
            setMode(null)
          }}
          onCancel={() => setMode(null)}
        />
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {(
          [
            ['all', 'Semua'],
            ['oil_change', 'Oli'],
            ['part_replacement', 'Part'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={`rounded-full px-3 py-1 ${
              filter === key
                ? 'bg-emerald-600/30 text-emerald-200'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada riwayat perawatan.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex justify-between gap-2">
                <p className="font-medium text-white">
                  {r.title || MAINTENANCE_TYPE_LABELS[r.type]}
                </p>
                <button
                  type="button"
                  className="text-xs text-red-400"
                  onClick={() => db.maintenanceRecords.delete(r.id)}
                >
                  Hapus
                </button>
              </div>
              <p className="text-sm text-slate-400">
                {MAINTENANCE_TYPE_LABELS[r.type]} ·{' '}
                {formatDisplayDate(r.serviceDate)} · {formatKm(r.odometerKm)}
              </p>
              {r.details && (
                <p className="mt-1 text-sm text-slate-300">{r.details}</p>
              )}
              {r.costIdr !== undefined && (
                <p className="mt-1 text-sm text-slate-400">
                  {formatIdr(r.costIdr)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MaintenanceForm({
  vehicleId,
  type,
  defaultKm,
  titleLabel,
  defaultTitle,
  onDone,
  onCancel,
}: {
  vehicleId: string
  type: MaintenanceType
  defaultKm: number
  titleLabel: string
  defaultTitle: string
  onDone: (km: number) => Promise<void>
  onCancel: () => void
}) {
  const [serviceDate, setServiceDate] = useState(todayDateOnly())
  const [odometerKm, setOdometerKm] = useState(defaultKm)
  const [title, setTitle] = useState(defaultTitle)
  const [details, setDetails] = useState('')
  const [costIdr, setCostIdr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const cost = costIdr.trim() ? Number(costIdr) : undefined
    await db.maintenanceRecords.add({
      id: newId(),
      vehicleId,
      type,
      serviceDate,
      odometerKm,
      title: title.trim(),
      details: details.trim(),
      costIdr: cost,
    })
    await onDone(odometerKm)
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <label className="block text-sm">
        <span className="text-slate-400">Tanggal</span>
        <input
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          value={serviceDate}
          onChange={(e) => setServiceDate(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Odometer (km)</span>
        <input
          type="number"
          required
          min={0}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          value={odometerKm}
          onChange={(e) => setOdometerKm(Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">{titleLabel}</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required={type === 'part_replacement'}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Catatan</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Biaya (Rp, opsional)</span>
        <input
          type="number"
          min={0}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          value={costIdr}
          onChange={(e) => setCostIdr(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white"
        >
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-300"
        >
          Batal
        </button>
      </div>
    </form>
  )
}

function TaxSection({ schedules }: { schedules: TaxSchedule[] }) {
  return (
    <ul className="space-y-4">
      {schedules
        .sort((a, b) => a.taxType.localeCompare(b.taxType))
        .map((schedule) => (
          <TaxCard key={schedule.id} schedule={schedule} />
        ))}
    </ul>
  )
}

function TaxCard({ schedule }: { schedule: TaxSchedule }) {
  const status = getTaxReminderStatus(schedule)
  const [nextDueEdit, setNextDueEdit] = useState(schedule.nextDueDate ?? '')
  const [editingDue, setEditingDue] = useState(false)

  async function markPaid() {
    const updated = markTaxPaid(schedule)
    await db.taxSchedules.put(updated)
    setNextDueEdit(updated.nextDueDate ?? '')
  }

  async function saveDueOverride() {
    await db.taxSchedules.update(schedule.id, {
      nextDueDate: nextDueEdit || null,
    })
    setEditingDue(false)
  }

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-white">
          {TAX_TYPE_LABELS[schedule.taxType]}
        </h3>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Terakhir bayar</dt>
          <dd className="text-slate-200">
            {formatDisplayDate(schedule.lastPaidDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Jatuh tempo berikutnya</dt>
          <dd className="text-slate-200">
            {formatDisplayDate(schedule.nextDueDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Ingatkan (hari sebelumnya)</dt>
          <dd className="text-slate-200">{schedule.remindDaysBefore}</dd>
        </div>
      </dl>

      {editingDue ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="date"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={nextDueEdit}
            onChange={(e) => setNextDueEdit(e.target.value)}
          />
          <button
            type="button"
            onClick={saveDueOverride}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
          >
            Simpan tanggal
          </button>
          <button
            type="button"
            onClick={() => setEditingDue(false)}
            className="text-sm text-slate-400"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingDue(true)}
          className="mt-3 text-sm text-emerald-400"
        >
          Ubah jatuh tempo manual
        </button>
      )}

      <button
        type="button"
        onClick={markPaid}
        className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        Mark sudah bayar
      </button>
    </li>
  )
}

function EditVehicleForm({
  vehicle,
  onSaved,
  onDelete,
}: {
  vehicle: Vehicle
  onSaved: () => void
  onDelete: () => Promise<void>
}) {
  const [form, setForm] = useState<Vehicle>({ ...vehicle })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await db.vehicles.put({
      ...form,
      nickname: form.nickname.trim(),
      plateNumber: form.plateNumber.trim(),
      makeModel: form.makeModel.trim(),
      notes: form.notes.trim(),
    })
    onSaved()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {(
        [
          ['nickname', 'Nama'],
          ['plateNumber', 'Plat'],
          ['makeModel', 'Merek & model'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-sm">
          <span className="text-slate-400">{label}</span>
          <input
            required={key === 'nickname'}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form[key]}
            onChange={(e) =>
              setForm((f) => ({ ...f, [key]: e.target.value }))
            }
          />
        </label>
      ))}
      <label className="block text-sm">
        <span className="text-slate-400">Odometer (km)</span>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          value={form.currentOdometerKm}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              currentOdometerKm: Number(e.target.value),
            }))
          }
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Catatan</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white"
      >
        Simpan perubahan
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-full rounded-xl border border-red-500/40 py-2.5 text-sm text-red-400"
      >
        Hapus kendaraan
      </button>
    </form>
  )
}
