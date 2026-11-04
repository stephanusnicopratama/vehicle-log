import * as THREE from 'three'
import type { VehicleCategory } from '../domain/types'

export type PartHotspotSpec = {
  geometry?: 'box' | 'sphere'
  size: [number, number, number]
  anchor:
    | { type: 'node'; name: string; offset?: [number, number, number] }
    | {
        type: 'body'
        bodyName: string
        /** 0–1 position inside the body mesh bounding box */
        u: number
        v: number
        w: number
      }
}

const CAR_SPECS: Record<string, PartHotspotSpec> = {
  car_engine_oil: {
    size: [0.36, 0.22, 0.32],
    anchor: { type: 'body', bodyName: 'body', u: 0.5, v: 0.52, w: 0.82 },
  },
  car_air_filter: {
    size: [0.28, 0.16, 0.24],
    anchor: { type: 'body', bodyName: 'body', u: 0.5, v: 0.78, w: 0.72 },
  },
  car_battery: {
    size: [0.26, 0.2, 0.28],
    anchor: { type: 'body', bodyName: 'body', u: 0.62, v: 0.62, w: 0.18 },
  },
  car_brake_front: {
    geometry: 'sphere',
    size: [0.18, 0.18, 0.18],
    anchor: { type: 'node', name: 'wheel-front-right', offset: [0, 0.04, 0] },
  },
  car_brake_rear: {
    geometry: 'sphere',
    size: [0.18, 0.18, 0.18],
    anchor: { type: 'node', name: 'wheel-back-left', offset: [0, 0.04, 0] },
  },
  car_tires: {
    geometry: 'sphere',
    size: [0.22, 0.22, 0.22],
    anchor: { type: 'node', name: 'wheel-front-right' },
  },
  car_coolant: {
    size: [0.3, 0.24, 0.12],
    anchor: { type: 'body', bodyName: 'body', u: 0.45, v: 0.72, w: 0.78 },
  },
  car_transmission_oil: {
    size: [0.32, 0.18, 0.28],
    anchor: { type: 'body', bodyName: 'body', u: 0.55, v: 0.38, w: 0.42 },
  },
}

const MOTO_SPECS: Record<string, PartHotspotSpec> = {
  moto_engine_oil: {
    size: [0.34, 0.26, 0.3],
    anchor: { type: 'body', bodyName: 'body', u: 0.52, v: 0.48, w: 0.58 },
  },
  moto_chain: {
    size: [0.2, 0.16, 0.28],
    anchor: { type: 'node', name: 'wheel-back', offset: [0, 0.12, 0.08] },
  },
  moto_brake_front: {
    geometry: 'sphere',
    size: [0.16, 0.16, 0.16],
    anchor: { type: 'node', name: 'wheel-front', offset: [0, 0.04, 0] },
  },
  moto_brake_rear: {
    geometry: 'sphere',
    size: [0.16, 0.16, 0.16],
    anchor: { type: 'node', name: 'wheel-back', offset: [0, 0.04, 0] },
  },
  moto_tires: {
    geometry: 'sphere',
    size: [0.2, 0.2, 0.2],
    anchor: { type: 'node', name: 'wheel-front' },
  },
  moto_battery: {
    size: [0.24, 0.14, 0.18],
    anchor: { type: 'body', bodyName: 'body', u: 0.5, v: 0.82, w: 0.42 },
  },
  moto_spark_plugs: {
    size: [0.16, 0.12, 0.14],
    anchor: { type: 'body', bodyName: 'body', u: 0.5, v: 0.72, w: 0.68 },
  },
  moto_air_filter: {
    geometry: 'sphere',
    size: [0.18, 0.18, 0.18],
    anchor: { type: 'body', bodyName: 'body', u: 0.55, v: 0.65, w: 0.62 },
  },
}

export function getPartHotspotSpec(
  category: VehicleCategory,
  partId: string,
): PartHotspotSpec | undefined {
  const table = category === 'car' ? CAR_SPECS : MOTO_SPECS
  return table[partId]
}

function nodePosition(
  model: THREE.Object3D,
  space: THREE.Object3D,
  name: string,
  offset?: [number, number, number],
): THREE.Vector3 | null {
  const node = model.getObjectByName(name)
  if (!node) return null

  const world = new THREE.Vector3()
  if (offset) {
    world.set(...offset)
    node.localToWorld(world)
  } else {
    node.getWorldPosition(world)
  }
  return space.worldToLocal(world)
}

function bodyPosition(
  model: THREE.Object3D,
  space: THREE.Object3D,
  bodyName: string,
  u: number,
  v: number,
  w: number,
): THREE.Vector3 | null {
  const body = model.getObjectByName(bodyName)
  if (!body) return null

  const box = new THREE.Box3().setFromObject(body)
  const world = new THREE.Vector3(
    THREE.MathUtils.lerp(box.min.x, box.max.x, u),
    THREE.MathUtils.lerp(box.min.y, box.max.y, v),
    THREE.MathUtils.lerp(box.min.z, box.max.z, w),
  )
  return space.worldToLocal(world)
}

export function resolveHotspotPosition(
  model: THREE.Object3D,
  transformGroup: THREE.Object3D,
  spec: PartHotspotSpec,
): THREE.Vector3 | null {
  transformGroup.updateMatrixWorld(true)
  model.updateMatrixWorld(true)

  if (spec.anchor.type === 'node') {
    return nodePosition(
      model,
      transformGroup,
      spec.anchor.name,
      spec.anchor.offset,
    )
  }
  return bodyPosition(
    model,
    transformGroup,
    spec.anchor.bodyName,
    spec.anchor.u,
    spec.anchor.v,
    spec.anchor.w,
  )
}
