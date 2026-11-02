export type MaintenanceType = 'oil_change' | 'part_replacement' | 'other'

export type TaxType = 'pajak_tahunan' | 'pajak_5_tahun'

export type ReminderStatus = 'overdue' | 'upcoming' | 'ok' | 'unset'

export interface Vehicle {
  id: string
  nickname: string
  plateNumber: string
  makeModel: string
  currentOdometerKm: number
  notes: string
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  type: MaintenanceType
  serviceDate: string
  odometerKm: number
  title: string
  details: string
  costIdr?: number
}

export interface TaxSchedule {
  id: string
  vehicleId: string
  taxType: TaxType
  lastPaidDate: string | null
  nextDueDate: string | null
  remindDaysBefore: number
  paidForCurrentPeriod: boolean
}

export interface AppSettings {
  defaultRemindDaysBefore: number
}

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  pajak_tahunan: 'Pajak tahunan (PKB)',
  pajak_5_tahun: 'Pajak / STNK 5 tahun',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: 'Ganti oli',
  part_replacement: 'Spare part',
  other: 'Lainnya',
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultRemindDaysBefore: 30,
}

export const EXPORT_SCHEMA_VERSION = 1

export interface ExportBundle {
  schemaVersion: number
  exportedAt: string
  settings: AppSettings
  vehicles: Vehicle[]
  maintenanceRecords: MaintenanceRecord[]
  taxSchedules: TaxSchedule[]
}
