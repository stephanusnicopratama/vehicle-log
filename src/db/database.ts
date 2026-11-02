import Dexie, { type EntityTable } from 'dexie'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type MaintenanceRecord,
  type TaxSchedule,
  type Vehicle,
  type VehicleCategory,
} from '../domain/types'
import type { ExportBundle } from '../domain/types'
import { mergeBundles, buildExportBundle } from '../domain/export'
import { createDefaultTaxSchedules } from '../domain/tax'

const SETTINGS_KEY = 'app'

export class VehicleLogDatabase extends Dexie {
  vehicles!: EntityTable<Vehicle, 'id'>
  maintenanceRecords!: EntityTable<MaintenanceRecord, 'id'>
  taxSchedules!: EntityTable<TaxSchedule, 'id'>
  settings!: EntityTable<{ key: string; value: AppSettings }, 'key'>

  constructor() {
    super('vehicle-log')
    this.version(1).stores({
      vehicles: 'id, plateNumber',
      maintenanceRecords: 'id, vehicleId, type, serviceDate',
      taxSchedules: 'id, vehicleId, taxType, nextDueDate',
      settings: 'key',
    })
    this.version(2)
      .stores({
        vehicles: 'id, plateNumber, category',
        maintenanceRecords: 'id, vehicleId, type, serviceDate, partId',
        taxSchedules: 'id, vehicleId, taxType, nextDueDate',
        settings: 'key',
      })
      .upgrade((tx) =>
        tx
          .table('vehicles')
          .toCollection()
          .modify((v: Vehicle & { category?: VehicleCategory }) => {
            if (!v.category) v.category = 'car'
          }),
      )
  }
}

export const db = new VehicleLogDatabase()

export function newId(): string {
  return crypto.randomUUID()
}

export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.get(SETTINGS_KEY)
  return row?.value ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ key: SETTINGS_KEY, value: settings })
}

export async function createVehicle(
  input: Omit<Vehicle, 'id'>,
): Promise<Vehicle> {
  const settings = await getSettings()
  const vehicle: Vehicle = { ...input, id: newId() }
  const taxRows = createDefaultTaxSchedules(
    vehicle.id,
    settings.defaultRemindDaysBefore,
  ).map((row) => ({ ...row, id: newId() }))

  await db.transaction(
    'rw',
    db.vehicles,
    db.taxSchedules,
    async () => {
      await db.vehicles.add(vehicle)
      await db.taxSchedules.bulkAdd(taxRows)
    },
  )
  return vehicle
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await db.transaction(
    'rw',
    db.vehicles,
    db.maintenanceRecords,
    db.taxSchedules,
    async () => {
      await db.maintenanceRecords.where('vehicleId').equals(vehicleId).delete()
      await db.taxSchedules.where('vehicleId').equals(vehicleId).delete()
      await db.vehicles.delete(vehicleId)
    },
  )
}

export async function exportAll(): Promise<ExportBundle> {
  const [vehicles, maintenanceRecords, taxSchedules, settings] =
    await Promise.all([
      db.vehicles.toArray(),
      db.maintenanceRecords.toArray(),
      db.taxSchedules.toArray(),
      getSettings(),
    ])
  return buildExportBundle(
    vehicles,
    maintenanceRecords,
    taxSchedules,
    settings,
  )
}

export async function importReplace(bundle: ExportBundle): Promise<void> {
  await db.transaction(
    'rw',
    db.vehicles,
    db.maintenanceRecords,
    db.taxSchedules,
    db.settings,
    async () => {
      await db.vehicles.clear()
      await db.maintenanceRecords.clear()
      await db.taxSchedules.clear()
      await db.vehicles.bulkAdd(bundle.vehicles)
      await db.maintenanceRecords.bulkAdd(bundle.maintenanceRecords)
      await db.taxSchedules.bulkAdd(bundle.taxSchedules)
      await saveSettings(bundle.settings)
    },
  )
}

export async function importMerge(bundle: ExportBundle): Promise<void> {
  const current = await exportAll()
  const merged = mergeBundles(current, bundle)
  await importReplace(merged)
}
