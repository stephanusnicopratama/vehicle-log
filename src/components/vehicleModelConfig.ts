import type { VehicleCategory } from '../domain/types'

/** CC0 Kenney sedan (Car Kit) + low-poly motorcycle (same art style). */
export const VEHICLE_GLB: Record<VehicleCategory, string> = {
  car: `${import.meta.env.BASE_URL}models/sedan.glb`,
  motorcycle: `${import.meta.env.BASE_URL}models/motorcycle.glb`,
}

/** Scene transform so model wheels sit on the ground and length aligns with hotspot layout (X = hood → trunk). */
export const VEHICLE_MODEL_TRANSFORM: Record<
  VehicleCategory,
  {
    scale: number
    rotation: [number, number, number]
    position: [number, number, number]
  }
> = {
  car: {
    scale: 0.72,
    rotation: [0, -Math.PI / 2, 0],
    position: [0, -0.42, 0],
  },
  motorcycle: {
    scale: 0.72,
    rotation: [0, -Math.PI / 2, 0],
    position: [0, -0.42, 0],
  },
}
