import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  exportAll,
  getSettings,
  importMerge,
  importReplace,
  saveSettings,
} from '../db/database'
import { parseImportBundle } from '../domain/export'
import { DEFAULT_SETTINGS } from '../domain/types'

export function SettingsPage() {
  const settings =
    useLiveQuery(() => getSettings(), []) ?? DEFAULT_SETTINGS
  const [remindDays, setRemindDays] = useState(
    DEFAULT_SETTINGS.defaultRemindDaysBefore,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    setRemindDays(settings.defaultRemindDaysBefore)
  }, [settings.defaultRemindDaysBefore])

  useEffect(() => {
    setNotificationsEnabled(
      typeof Notification !== 'undefined' &&
        Notification.permission === 'granted',
    )
  }, [])

  async function saveRemindDays() {
    const value = Math.max(1, Math.min(365, remindDays))
    await saveSettings({ defaultRemindDaysBefore: value })
    setRemindDays(value)
    setMessage('Pengaturan pengingat disimpan.')
  }

  async function handleExport() {
    const bundle = await exportAll()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vehicle-log-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Backup diunduh.')
  }

  async function handleImport(mode: 'replace' | 'merge', file: File) {
    const text = await file.text()
    const raw = JSON.parse(text) as unknown
    const bundle = parseImportBundle(raw)
    if (mode === 'replace') {
      const ok = window.confirm(
        'Import akan mengganti semua data di browser ini. Lanjutkan?',
      )
      if (!ok) return
      await importReplace(bundle)
    } else {
      await importMerge(bundle)
    }
    setMessage(
      mode === 'replace'
        ? 'Data berhasil diimpor (ganti semua).'
        : 'Data berhasil digabung.',
    )
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      setMessage('Browser tidak mendukung notifikasi.')
      return
    }
    const perm = await Notification.requestPermission()
    setNotificationsEnabled(perm === 'granted')
    setMessage(
      perm === 'granted'
        ? 'Notifikasi diizinkan (hanya saat app terbuka di v1).'
        : 'Notifikasi ditolak.',
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">Pengingat pajak</h2>
        <p className="mt-1 text-sm text-slate-400">
          Default hari sebelum jatuh tempo untuk kendaraan baru. Jadwal yang
          sudah ada tetap memakai nilai masing-masing.
        </p>
        <label className="mt-4 block text-sm">
          <span className="text-slate-400">Ingatkan (hari)</span>
          <input
            type="number"
            min={1}
            max={365}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={remindDays}
            onChange={(e) => setRemindDays(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={saveRemindDays}
          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Simpan
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">Backup data</h2>
        <p className="mt-1 text-sm text-slate-400">
          Semua data disimpan di perangkat ini (IndexedDB). Export JSON untuk
          cadangan.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="mt-4 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white"
        >
          Export JSON
        </button>
        <div className="mt-4 space-y-2">
          <ImportButton
            label="Import — ganti semua data"
            onFile={(f) => handleImport('replace', f)}
          />
          <ImportButton
            label="Import — gabung dengan data ada"
            onFile={(f) => handleImport('merge', f)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">Notifikasi</h2>
        <p className="mt-1 text-sm text-slate-400">
          Opsional. Peringatan utama tetap di beranda aplikasi.
        </p>
        {!notificationsEnabled ? (
          <button
            type="button"
            onClick={enableNotifications}
            className="mt-4 rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
          >
            Izinkan notifikasi browser
          </button>
        ) : (
          <p className="mt-4 text-sm text-emerald-400">Notifikasi aktif.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">
        <h2 className="font-semibold text-slate-300">Privasi</h2>
        <p className="mt-2">
          Vehicle Log tidak mengirim data ke server. Hapus data browser =
          hilang kecuali Anda punya backup JSON.
        </p>
      </section>

      {message && (
        <p className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}
    </div>
  )
}

function ImportButton({
  label,
  onFile,
}: {
  label: string
  onFile: (file: File) => void
}) {
  return (
    <label className="flex cursor-pointer justify-center rounded-xl border border-dashed border-slate-600 py-2.5 text-sm text-slate-300 hover:border-slate-500">
      {label}
      <input
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </label>
  )
}
