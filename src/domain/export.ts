import {
  DEFAULT_SETTINGS,
  EXPORT_SCHEMA_VERSION,
  type ExportBundle,
  type MaintenanceRecord,
  type TaxSchedule,
  type Vehicle,
  type AppSettings,
} from './types'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isVehicle(value: unknown): value is Vehicle {
  if (!isObject(value)) return false
  const category = value.category
  const validCategory =
    category === undefined ||
    category === 'car' ||
    category === 'motorcycle'
  return (
    validCategory &&
    typeof value.id === 'string' &&
    typeof value.nickname === 'string' &&
    typeof value.plateNumber === 'string' &&
    typeof value.makeModel === 'string' &&
    typeof value.currentOdometerKm === 'number' &&
    typeof value.notes === 'string'
  )
}

export function normalizeVehicle(raw: Vehicle & { category?: Vehicle['category'] }): Vehicle {
  return {
    ...raw,
    category: raw.category ?? 'car',
  }
}

function isMaintenanceRecord(value: unknown): value is MaintenanceRecord {
  if (!isObject(value)) return false
  const type = value.type
  const validType =
    type === 'oil_change' || type === 'part_replacement' || type === 'other'
  return (
    typeof value.id === 'string' &&
    typeof value.vehicleId === 'string' &&
    validType &&
    typeof value.serviceDate === 'string' &&
    typeof value.odometerKm === 'number' &&
    typeof value.title === 'string' &&
    typeof value.details === 'string' &&
    (value.costIdr === undefined || typeof value.costIdr === 'number') &&
    (value.partId === undefined || typeof value.partId === 'string')
  )
}

function isTaxSchedule(value: unknown): value is TaxSchedule {
  if (!isObject(value)) return false
  const taxType = value.taxType
  const validTax =
    taxType === 'pajak_tahunan' || taxType === 'pajak_5_tahun'
  return (
    typeof value.id === 'string' &&
    typeof value.vehicleId === 'string' &&
    validTax &&
    (value.lastPaidDate === null || typeof value.lastPaidDate === 'string') &&
    (value.nextDueDate === null || typeof value.nextDueDate === 'string') &&
    typeof value.remindDaysBefore === 'number' &&
    typeof value.paidForCurrentPeriod === 'boolean'
  )
}

export function buildExportBundle(
  vehicles: Vehicle[],
  maintenanceRecords: MaintenanceRecord[],
  taxSchedules: TaxSchedule[],
  settings: AppSettings,
): ExportBundle {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    vehicles,
    maintenanceRecords,
    taxSchedules,
  }
}

export function parseImportBundle(raw: unknown): ExportBundle {
  if (!isObject(raw)) {
    throw new Error('File tidak valid: bukan JSON objek.')
  }
  if (raw.schemaVersion !== EXPORT_SCHEMA_VERSION) {
    throw new Error(
      `Versi schema tidak didukung (harus ${EXPORT_SCHEMA_VERSION}).`,
    )
  }
  if (!Array.isArray(raw.vehicles) || !raw.vehicles.every(isVehicle)) {
    throw new Error('Data kendaraan tidak valid.')
  }
  if (
    !Array.isArray(raw.maintenanceRecords) ||
    !raw.maintenanceRecords.every(isMaintenanceRecord)
  ) {
    throw new Error('Data perawatan tidak valid.')
  }
  if (
    !Array.isArray(raw.taxSchedules) ||
    !raw.taxSchedules.every(isTaxSchedule)
  ) {
    throw new Error('Data pajak tidak valid.')
  }
  const settingsRaw = raw.settings
  let settings = DEFAULT_SETTINGS
  if (isObject(settingsRaw)) {
    if (typeof settingsRaw.defaultRemindDaysBefore === 'number') {
      settings = {
        defaultRemindDaysBefore: settingsRaw.defaultRemindDaysBefore,
      }
    }
  }
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt:
      typeof raw.exportedAt === 'string'
        ? raw.exportedAt
        : new Date().toISOString(),
    settings,
    vehicles: raw.vehicles.map((v) => normalizeVehicle(v as Vehicle)),
    maintenanceRecords: raw.maintenanceRecords,
    taxSchedules: raw.taxSchedules,
  }
}

export function mergeBundles(
  existing: ExportBundle,
  incoming: ExportBundle,
): ExportBundle {
  const vehicleMap = new Map(existing.vehicles.map((v) => [v.id, v]))
  for (const v of incoming.vehicles) vehicleMap.set(v.id, v)

  const maintenanceMap = new Map(
    existing.maintenanceRecords.map((m) => [m.id, m]),
  )
  for (const m of incoming.maintenanceRecords) maintenanceMap.set(m.id, m)

  const taxMap = new Map(existing.taxSchedules.map((t) => [t.id, t]))
  for (const t of incoming.taxSchedules) taxMap.set(t.id, t)

  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: incoming.exportedAt,
    settings: incoming.settings,
    vehicles: [...vehicleMap.values()],
    maintenanceRecords: [...maintenanceMap.values()],
    taxSchedules: [...taxMap.values()],
  }
}
