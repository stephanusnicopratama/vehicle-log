import { lazy, Suspense, useState } from 'react'
import { db, newId } from '../db/database'
import { formatDisplayDate, todayDateOnly } from '../domain/dates'
import {
  getPartById,
  recordsForPart,
  type VehiclePart,
} from '../domain/partsCatalog'
import {
  MAINTENANCE_TYPE_LABELS,
  type MaintenanceRecord,
  type MaintenanceType,
  type Vehicle,
  type VehicleCategory,
} from '../domain/types'
import { formatIdr, formatKm } from '../lib/format'

const ReceiptOcrEntry = lazy(() =>
  import('./ReceiptOcrEntry').then((m) => ({ default: m.ReceiptOcrEntry })),
)

interface PartDetailPanelProps {
  vehicle: Vehicle
  part: VehiclePart
  records: MaintenanceRecord[]
  defaultKm: number
  onClose: () => void
  onOdometerUpdate: (km: number) => Promise<void>
}

export function PartDetailPanel({
  vehicle,
  part,
  records,
  defaultKm,
  onClose,
  onOdometerUpdate,
}: PartDetailPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [showOcr, setShowOcr] = useState(false)
  const partRecords = recordsForPart(records, part).sort((a, b) =>
    b.serviceDate.localeCompare(a.serviceDate),
  )
  const last = partRecords[0]

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 shadow-lg shadow-emerald-900/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            Komponen
          </p>
          <h3 className="text-xl font-bold text-white">{part.label}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          Tutup
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {part.description}
      </p>

      <div className="mt-4 rounded-xl bg-slate-950/60 px-4 py-3 text-sm">
        <p className="text-slate-500">Servis terakhir</p>
        <p className="mt-1 text-slate-200">
          {last
            ? `${formatDisplayDate(last.serviceDate)} · ${formatKm(last.odometerKm)}`
            : 'Belum tercatat'}
        </p>
      </div>

      {!showForm && !showOcr ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Catat perawatan / ganti part
          </button>
          <button
            type="button"
            onClick={() => setShowOcr(true)}
            className="flex-1 rounded-xl border border-teal-500/40 bg-teal-950/40 py-2.5 text-sm font-semibold text-teal-100 hover:bg-teal-900/50"
          >
            Scan struk bengkel
          </button>
        </div>
      ) : showOcr ? (
        <Suspense fallback={<p className="mt-4 text-sm text-slate-500">Memuat OCR…</p>}>
          <ReceiptOcrEntry
            vehicleId={vehicle.id}
            vehicleCategory={vehicle.category}
            defaultOdometerKm={defaultKm}
            lockedType={part.defaultMaintenanceType}
            lockedPartId={part.id}
            lockedTitle={part.label}
            onDone={async (km) => {
              await onOdometerUpdate(km)
              setShowOcr(false)
            }}
            onCancel={() => setShowOcr(false)}
          />
        </Suspense>
      ) : (
        <PartMaintenanceForm
          vehicleId={vehicle.id}
          part={part}
          defaultKm={defaultKm}
          onDone={async (km) => {
            await onOdometerUpdate(km)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {partRecords.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-400">Riwayat</h4>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {partRecords.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
              >
                <p className="font-medium text-white">
                  {r.title || part.label}
                </p>
                <p className="text-slate-500">
                  {MAINTENANCE_TYPE_LABELS[r.type]} ·{' '}
                  {formatDisplayDate(r.serviceDate)} · {formatKm(r.odometerKm)}
                </p>
                {r.costIdr !== undefined && (
                  <p className="text-slate-400">{formatIdr(r.costIdr)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PartMaintenanceForm({
  vehicleId,
  part,
  defaultKm,
  onDone,
  onCancel,
}: {
  vehicleId: string
  part: VehiclePart
  defaultKm: number
  onDone: (km: number) => Promise<void>
  onCancel: () => void
}) {
  const type: MaintenanceType = part.defaultMaintenanceType
  const [serviceDate, setServiceDate] = useState(todayDateOnly())
  const [odometerKm, setOdometerKm] = useState(defaultKm)
  const [details, setDetails] = useState('')
  const [costIdr, setCostIdr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const cost = costIdr.trim() ? Number(costIdr) : undefined
    await db.maintenanceRecords.add({
      id: newId(),
      vehicleId,
      partId: part.id,
      type,
      serviceDate,
      odometerKm,
      title: part.label,
      details: details.trim(),
      costIdr: cost,
    })
    await onDone(odometerKm)
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 border-t border-slate-800 pt-4"
    >
      <p className="text-sm text-slate-400">
        Mencatat:{' '}
        <span className="text-white">{MAINTENANCE_TYPE_LABELS[type]}</span>
      </p>
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
        <span className="text-slate-400">Catatan</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Biaya (Rp)</span>
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

export function resolvePart(
  category: VehicleCategory,
  partId: string,
): VehiclePart | undefined {
  return getPartById(category, partId)
}
