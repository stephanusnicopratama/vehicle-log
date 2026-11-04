import { useRef, useState } from 'react'
import { db, newId } from '../db/database'
import { todayDateOnly } from '../domain/dates'
import { parseReceiptText, type ParsedReceipt } from '../domain/receiptParse'
import {
  MAINTENANCE_TYPE_LABELS,
  type MaintenanceType,
  type VehicleCategory,
} from '../domain/types'
import { recognizeReceiptImage } from '../lib/receiptOcr'

type Step = 'pick' | 'scanning' | 'review'

interface ReceiptOcrEntryProps {
  vehicleId: string
  vehicleCategory: VehicleCategory
  defaultOdometerKm: number
  /** When logging from a specific part, lock type / part linkage */
  lockedType?: MaintenanceType
  lockedPartId?: string
  lockedTitle?: string
  onDone: (odometerKm: number) => Promise<void>
  onCancel: () => void
}

export function ReceiptOcrEntry({
  vehicleId,
  vehicleCategory,
  defaultOdometerKm,
  lockedType,
  lockedPartId,
  lockedTitle,
  onDone,
  onCancel,
}: ReceiptOcrEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('pick')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)

  const [type, setType] = useState<MaintenanceType>(lockedType ?? 'other')
  const [serviceDate, setServiceDate] = useState(todayDateOnly())
  const [odometerKm, setOdometerKm] = useState(defaultOdometerKm)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [costIdr, setCostIdr] = useState('')

  function applyParsed(receipt: ParsedReceipt) {
    setParsed(receipt)
    setType(lockedType ?? receipt.type)
    setServiceDate(receipt.serviceDate)
    setOdometerKm(receipt.odometerKm)
    setTitle(lockedTitle ?? receipt.title)
    setDetails(receipt.details)
    setCostIdr(receipt.costIdr !== undefined ? String(receipt.costIdr) : '')
    setStep('review')
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setStep('scanning')
    setProgress(0)

    try {
      const rawText = await recognizeReceiptImage(file, setProgress)
      if (!rawText.trim()) {
        setError('Teks tidak terbaca. Coba foto lebih terang atau lebih dekat.')
        setStep('pick')
        return
      }
      applyParsed(
        parseReceiptText(rawText, {
          defaultOdometerKm,
          category: vehicleCategory,
          lockedType,
          lockedPartId,
        }),
      )
    } catch {
      setError('OCR gagal. Periksa koneksi internet (unduh model sekali) lalu coba lagi.')
      setStep('pick')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const cost = costIdr.trim() ? Number(costIdr) : undefined
    const partId = lockedPartId ?? parsed?.partId
    await db.maintenanceRecords.add({
      id: newId(),
      vehicleId,
      partId,
      type: lockedType ?? type,
      serviceDate,
      odometerKm,
      title: title.trim() || 'Servis bengkel',
      details: details.trim(),
      costIdr: cost,
    })
    await onDone(odometerKm)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-500/30 bg-slate-900/70 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-400">
          Scan struk bengkel
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Foto nota servis — teks dibaca di perangkat Anda (privasi). Periksa
          isian sebelum simpan.
        </p>
      </div>

      {step === 'pick' && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-teal-500/50 bg-teal-950/30 py-8 text-sm font-semibold text-teal-100 hover:border-teal-400/70"
          >
            Ambil foto / pilih gambar struk
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </>
      )}

      {step === 'scanning' && (
        <div className="space-y-3 text-center">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Pratinjau struk"
              className="mx-auto max-h-40 rounded-lg border border-slate-700 object-contain"
            />
          )}
          <p className="text-sm text-slate-300">Membaca struk… {progress}%</p>
          <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-teal-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Unduhan model OCR pertama kali butuh koneksi internet.
          </p>
        </div>
      )}

      {step === 'review' && (
        <form onSubmit={submit} className="space-y-3">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Struk"
              className="max-h-36 w-full rounded-lg border border-slate-700 object-contain"
            />
          )}
          <p className="text-xs text-amber-200/90">
            Periksa dan koreksi isian — OCR tidak selalu sempurna.
          </p>

          {!lockedType && (
            <label className="block text-sm">
              <span className="text-slate-400">Jenis servis</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                value={type}
                onChange={(e) => setType(e.target.value as MaintenanceType)}
              >
                {(
                  Object.entries(MAINTENANCE_TYPE_LABELS) as [
                    MaintenanceType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}

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
            <span className="text-slate-400">Judul / ringkasan</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Catatan (teks struk)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              rows={3}
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
              Simpan ke riwayat
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
      )}

      {step !== 'review' && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Batal
        </button>
      )}
    </div>
  )
}
