import type { MaintenanceType, VehicleCategory, MaintenanceRecord } from './types'

export interface VehiclePart {
  id: string
  label: string
  description: string
  /** Suggested log type when user records service for this part */
  defaultMaintenanceType: MaintenanceType
  /** Hotspot center in SVG viewBox coordinates (400×220) */
  x: number
  y: number
}

const CAR_PARTS: VehiclePart[] = [
  {
    id: 'car_engine_oil',
    label: 'Oli mesin',
    description:
      'Pelumas mesin; ganti sesuai interval km atau bulan (cek manual).',
    defaultMaintenanceType: 'oil_change',
    x: 155,
    y: 95,
  },
  {
    id: 'car_air_filter',
    label: 'Filter udara',
    description: 'Menyaring debu masuk ke mesin; sering diganti saat servis.',
    defaultMaintenanceType: 'part_replacement',
    x: 200,
    y: 78,
  },
  {
    id: 'car_battery',
    label: 'Aki',
    description: 'Sumber listrik starter dan aksesoris; cek tegangan & usia.',
    defaultMaintenanceType: 'part_replacement',
    x: 118,
    y: 72,
  },
  {
    id: 'car_brake_front',
    label: 'Rem depan',
    description: 'Kampas/cakram depan; perhatikan bunyi dan jarak rem.',
    defaultMaintenanceType: 'part_replacement',
    x: 268,
    y: 148,
  },
  {
    id: 'car_brake_rear',
    label: 'Rem belakang',
    description: 'Kampas/cakram belakang; ganti jika tipis atau bergetar.',
    defaultMaintenanceType: 'part_replacement',
    x: 88,
    y: 148,
  },
  {
    id: 'car_tires',
    label: 'Ban',
    description: 'Rotasi, tekanan angin, dan kedalaman alur ban.',
    defaultMaintenanceType: 'part_replacement',
    x: 318,
    y: 168,
  },
  {
    id: 'car_coolant',
    label: 'Coolant / radiator',
    description: 'Cairan pendingin mesin; cek level dan kebocoran.',
    defaultMaintenanceType: 'part_replacement',
    x: 175,
    y: 58,
  },
  {
    id: 'car_transmission_oil',
    label: 'Oli transmisi',
    description: 'Matic/manual — ganti sesuai rekomendasi pabrikan.',
    defaultMaintenanceType: 'oil_change',
    x: 105,
    y: 108,
  },
]

const MOTORCYCLE_PARTS: VehiclePart[] = [
  {
    id: 'moto_engine_oil',
    label: 'Oli mesin',
    description: 'Ganti rutin; motor lebih sering per km dibanding mobil.',
    defaultMaintenanceType: 'oil_change',
    x: 168,
    y: 102,
  },
  {
    id: 'moto_chain',
    label: 'Rantai & gear',
    description: 'Pelumas rantai, tension, dan keausan gear.',
    defaultMaintenanceType: 'part_replacement',
    x: 72,
    y: 118,
  },
  {
    id: 'moto_brake_front',
    label: 'Rem depan',
    description: 'Kampas/cakram depan — paling sering dipakai.',
    defaultMaintenanceType: 'part_replacement',
    x: 248,
    y: 142,
  },
  {
    id: 'moto_brake_rear',
    label: 'Rem belakang',
    description: 'Kampas tromol/cakram belakang.',
    defaultMaintenanceType: 'part_replacement',
    x: 58,
    y: 148,
  },
  {
    id: 'moto_tires',
    label: 'Ban',
    description: 'Depan & belakang — tekanan dan alur ban.',
    defaultMaintenanceType: 'part_replacement',
    x: 278,
    y: 168,
  },
  {
    id: 'moto_battery',
    label: 'Aki',
    description: 'Dry/wet battery; cek terminal dan pengisian.',
    defaultMaintenanceType: 'part_replacement',
    x: 195,
    y: 68,
  },
  {
    id: 'moto_spark_plugs',
    label: 'Busi',
    description: 'Busi iridium/standard; ganti jika mesin kasar atau boros.',
    defaultMaintenanceType: 'part_replacement',
    x: 210,
    y: 88,
  },
  {
    id: 'moto_air_filter',
    label: 'Filter udara',
    description: 'Box filter atau filter udara sport.',
    defaultMaintenanceType: 'part_replacement',
    x: 228,
    y: 78,
  },
]

export function getPartsForCategory(category: VehicleCategory): VehiclePart[] {
  return category === 'car' ? CAR_PARTS : MOTORCYCLE_PARTS
}

export function getPartById(
  category: VehicleCategory,
  partId: string,
): VehiclePart | undefined {
  return getPartsForCategory(category).find((p) => p.id === partId)
}

export function recordsForPart(
  records: MaintenanceRecord[],
  part: VehiclePart,
): MaintenanceRecord[] {
  return records.filter(
    (r) =>
      r.partId === part.id ||
      r.title.toLowerCase().includes(part.label.toLowerCase()),
  )
}
