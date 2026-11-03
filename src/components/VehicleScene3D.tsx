import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { VehicleCategory } from '../domain/types'
import { getPartsForCategory } from '../domain/partsCatalog'
import { VEHICLE_GLB, VEHICLE_MODEL_TRANSFORM } from './vehicleModelConfig'

interface VehicleDiagramProps {
  category: VehicleCategory
  selectedPartId: string | null
  onSelectPart: (partId: string) => void
}

useGLTF.preload(VEHICLE_GLB.car)
useGLTF.preload(VEHICLE_GLB.motorcycle)

export function VehicleDiagram(props: VehicleDiagramProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="h-[min(420px,55vh)] w-full">
        <Canvas
          camera={{ position: [4.2, 2.5, 4.6], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          shadows
        >
          <color attach="background" args={['#0f172a']} />
          <fog attach="fog" args={['#0f172a', 8, 20]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[6, 9, 4]}
            intensity={1.15}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 3, -3]} intensity={0.4} />
          <pointLight position={[0, 2, 2]} intensity={0.25} />
          <Suspense fallback={null}>
            <VehicleScene {...props} />
          </Suspense>
          <ContactShadows
            position={[0, -0.52, 0]}
            opacity={0.5}
            scale={14}
            blur={2.8}
            far={4.5}
          />
          <OrbitControls
            enablePan={false}
            minPolarAngle={0.35}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={3.8}
            maxDistance={10}
            target={[0, 0.05, 0]}
          />
        </Canvas>
      </div>
      <p className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-500">
        Putar model · arahkan ke titik komponen untuk nama · ketuk untuk detail
      </p>
    </div>
  )
}

function VehicleScene({
  category,
  selectedPartId,
  onSelectPart,
}: VehicleDiagramProps) {
  const parts = useMemo(() => getPartsForCategory(category), [category])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <group position={[0, -0.05, 0]}>
      <VehicleGlb category={category} />
      {parts.map((part) => (
        <PartHotspot
          key={part.id}
          partId={part.id}
          label={part.label}
          active={selectedPartId === part.id}
          hovered={hoveredId === part.id}
          onSelect={() => onSelectPart(part.id)}
          onHover={(v) => setHoveredId(v ? part.id : null)}
        />
      ))}
    </group>
  )
}

function VehicleGlb({ category }: { category: VehicleCategory }) {
  const { scene } = useGLTF(VEHICLE_GLB[category])
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  const t = VEHICLE_MODEL_TRANSFORM[category]

  return (
    <group position={t.position} rotation={t.rotation} scale={t.scale}>
      <primitive object={model} />
    </group>
  )
}

function PartHotspot({
  partId,
  label,
  active,
  hovered,
  onSelect,
  onHover,
}: {
  partId: string
  label: string
  active: boolean
  hovered: boolean
  onSelect: () => void
  onHover: (over: boolean) => void
}) {
  const layout = PART_LAYOUT[partId]
  if (!layout) return null

  const highlighted = active || hovered
  const scale = active ? 1.15 : hovered ? 1.08 : 1
  const color = active ? '#34d399' : hovered ? '#2dd4bf' : '#475569'

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    onSelect()
  }

  return (
    <mesh
      position={layout.position}
      rotation={layout.rotation ?? [0, 0, 0]}
      scale={scale}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {layout.geometry === 'sphere' ? (
        <sphereGeometry args={[layout.size[0], 16, 16]} />
      ) : (
        <boxGeometry args={layout.size} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={active ? '#059669' : hovered ? '#0d9488' : '#000000'}
        emissiveIntensity={active ? 0.65 : hovered ? 0.35 : 0}
        metalness={0.25}
        roughness={0.45}
        transparent
        opacity={highlighted ? 0.92 : 0}
        depthWrite={highlighted}
      />
      {highlighted && (
        <Html
          center
          distanceFactor={9}
          position={[0, Math.max(layout.size[1], layout.size[0]) * 0.85 + 0.1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium shadow-lg ${
              active
                ? 'border-emerald-400/60 bg-emerald-950/95 text-emerald-100'
                : 'border-teal-500/40 bg-slate-900/95 text-teal-100'
            }`}
          >
            {label}
          </div>
        </Html>
      )}
    </mesh>
  )
}

type PartLayout = {
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  geometry?: 'box' | 'sphere'
}

/** Hotspot positions tuned for Kenney sedan + chopper (X = front → rear). */
const PART_LAYOUT: Record<string, PartLayout> = {
  car_engine_oil: { position: [0.78, 0.2, 0.22], size: [0.38, 0.22, 0.34] },
  car_air_filter: { position: [0.48, 0.4, 0.12], size: [0.3, 0.16, 0.26] },
  car_battery: { position: [0.58, 0.16, -0.32], size: [0.26, 0.2, 0.3] },
  car_brake_front: {
    position: [0.94, 0.02, 0.7],
    size: [0.2, 0.2, 0.2],
    geometry: 'sphere',
  },
  car_brake_rear: {
    position: [-0.9, 0.02, 0.7],
    size: [0.2, 0.2, 0.2],
    geometry: 'sphere',
  },
  car_tires: {
    position: [0.94, -0.14, -0.64],
    size: [0.24, 0.24, 0.24],
    geometry: 'sphere',
  },
  car_coolant: { position: [0.62, 0.36, 0.52], size: [0.32, 0.26, 0.1] },
  car_transmission_oil: { position: [0.02, 0.1, 0.32], size: [0.34, 0.18, 0.3] },
  moto_engine_oil: { position: [0.12, 0.3, 0.04], size: [0.36, 0.28, 0.32] },
  moto_chain: { position: [-0.58, 0.14, 0], size: [0.18, 0.18, 0.32] },
  moto_brake_front: {
    position: [0.74, 0.03, 0.4],
    size: [0.18, 0.18, 0.18],
    geometry: 'sphere',
  },
  moto_brake_rear: {
    position: [-0.74, 0.03, 0.4],
    size: [0.18, 0.18, 0.18],
    geometry: 'sphere',
  },
  moto_tires: {
    position: [0.74, -0.1, -0.26],
    size: [0.22, 0.22, 0.22],
    geometry: 'sphere',
  },
  moto_battery: { position: [-0.08, 0.4, -0.06], size: [0.26, 0.14, 0.2] },
  moto_spark_plugs: { position: [0.22, 0.46, 0.1], size: [0.16, 0.12, 0.16] },
  moto_air_filter: {
    position: [0.32, 0.38, 0.18],
    size: [0.2, 0.2, 0.2],
    geometry: 'sphere',
  },
}
