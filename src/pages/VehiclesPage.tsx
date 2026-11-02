import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { createVehicle, db, deleteVehicle } from '../db/database'
import { getTaxReminderStatus } from '../domain/reminders'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import type { ReminderStatus, Vehicle } from '../domain/types'

const emptyForm = {
  nickname: '',
  plateNumber: '',
  makeModel: '',
  currentOdometerKm: 0,
  notes: '',
}

export function VehiclesPage() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const taxSchedules = useLiveQuery(() => db.taxSchedules.toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nickname.trim()) return
    setSaving(true)
    try {
      await createVehicle({
        ...form,
        nickname: form.nickname.trim(),
        plateNumber: form.plateNumber.trim(),
        makeModel: form.makeModel.trim(),
        notes: form.notes.trim(),
      })
      setForm(emptyForm)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    const ok = window.confirm(
      `Hapus ${vehicle.nickname}? Semua riwayat perawatan dan pajak ikut terhapus.`,
    )
    if (!ok) return
    await deleteVehicle(vehicle.id)
  }

  if (vehicles === undefined) {
    return <p className="text-slate-400">Memuat…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Kendaraan</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {showForm ? 'Batal' : 'Tambah'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <Field
            label="Nama / julukan"
            value={form.nickname}
            onChange={(v) => setForm((f) => ({ ...f, nickname: v }))}
            required
          />
          <Field
            label="Nomor plat"
            value={form.plateNumber}
            onChange={(v) => setForm((f) => ({ ...f, plateNumber: v }))}
          />
          <Field
            label="Merek & model"
            value={form.makeModel}
            onChange={(v) => setForm((f) => ({ ...f, makeModel: v }))}
          />
          <Field
            label="Odometer saat ini (km)"
            type="number"
            value={String(form.currentOdometerKm)}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                currentOdometerKm: Number(v) || 0,
              }))
            }
          />
          <label className="block text-sm">
            <span className="text-slate-400">Catatan</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Simpan kendaraan
          </button>
        </form>
      )}

      {vehicles.length === 0 && !showForm ? (
        <EmptyState
          title="Daftar kosong"
          description="Tambahkan mobil atau motor untuk mulai mencatat perawatan."
        />
      ) : (
        <ul className="space-y-3">
          {vehicles.map((vehicle) => {
            const schedules =
              taxSchedules?.filter((t) => t.vehicleId === vehicle.id) ?? []
            const worst = schedules.reduce<{ rank: number; status: ReminderStatus }>(
              (acc, s) => {
                const st = getTaxReminderStatus(s)
                const rank =
                  st === 'overdue'
                    ? 3
                    : st === 'upcoming'
                      ? 2
                      : st === 'unset'
                        ? 1
                        : 0
                return rank > acc.rank ? { rank, status: st } : acc
              },
              { rank: 0, status: 'ok' },
            )
            return (
              <li
                key={vehicle.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/vehicles/${vehicle.id}`}
                      className="text-lg font-semibold text-white hover:text-emerald-300"
                    >
                      {vehicle.nickname}
                    </Link>
                    <p className="text-sm text-slate-400">
                      {[vehicle.plateNumber, vehicle.makeModel]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                    {worst.rank > 0 && (
                      <div className="mt-2">
                        <StatusBadge status={worst.status} />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(vehicle)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-400">{label}</span>
      <input
        type={type}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
