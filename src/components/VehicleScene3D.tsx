import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { VehicleCategory } from '../domain/types'
import { getPartsForCategory } from '../domain/partsCatalog'

interface VehicleDiagramProps {
  category: VehicleCategory
  selectedPartId: string | null
  onSelectPart: (partId: string) => void
}

export function VehicleDiagram(props: VehicleDiagramProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="h-[min(420px,55vh)] w-full">
        <Canvas
          camera={{ position: [4, 2.2, 4.5], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0f172a']} />
          <fog attach="fog" args={['#0f172a', 8, 18]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 8, 3]} intensity={1.1} castShadow />
          <directionalLight position={[-4, 2, -2]} intensity={0.35} />
          <Suspense fallback={null}>
            <VehicleScene {...props} />
          </Suspense>
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.45}
            scale={12}
            blur={2.5}
            far={4}
          />
          <OrbitControls
            enablePan={false}
            minPolarAngle={0.35}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={3.5}
            maxDistance={9}
            target={[0, 0.15, 0]}
          />
        </Canvas>
      </div>
      <p className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-500">
        Putar model · ketuk komponen hijau untuk detail
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
    <group position={[0, -0.2, 0]}>
      {category === 'car' ? <CarBody /> : <MotorcycleBody />}
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

function PartHotspot({
  partId,
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

  const scale = active ? 1.12 : hovered ? 1.06 : 1
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
        opacity={active || hovered ? 0.95 : 0.72}
      />
    </mesh>
  )
}

type PartLayout = {
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  geometry?: 'box' | 'sphere'
}

const PART_LAYOUT: Record<string, PartLayout> = {
  car_engine_oil: { position: [-0.55, 0.35, 0.55], size: [0.45, 0.28, 0.38] },
  car_air_filter: { position: [-0.2, 0.62, 0.35], size: [0.32, 0.18, 0.28] },
  car_battery: { position: [-0.95, 0.28, 0.15], size: [0.28, 0.22, 0.32] },
  car_brake_front: { position: [0.95, 0.05, 0.72], size: [0.22, 0.22, 0.22], geometry: 'sphere' },
  car_brake_rear: { position: [-0.95, 0.05, 0.72], size: [0.22, 0.22, 0.22], geometry: 'sphere' },
  car_tires: { position: [0.95, -0.08, -0.55], size: [0.26, 0.26, 0.26], geometry: 'sphere' },
  car_coolant: { position: [-0.75, 0.45, 0.95], size: [0.35, 0.35, 0.12] },
  car_transmission_oil: { position: [0.15, 0.08, 0.45], size: [0.38, 0.2, 0.32] },
  moto_engine_oil: { position: [0.05, 0.35, 0.15], size: [0.38, 0.32, 0.35] },
  moto_chain: { position: [-0.75, 0.12, 0.05], size: [0.2, 0.2, 0.35] },
  moto_brake_front: { position: [0.85, 0.08, 0.55], size: [0.2, 0.2, 0.2], geometry: 'sphere' },
  moto_brake_rear: { position: [-0.85, 0.08, 0.55], size: [0.2, 0.2, 0.2], geometry: 'sphere' },
  moto_tires: { position: [0.85, -0.05, -0.35], size: [0.24, 0.24, 0.24], geometry: 'sphere' },
  moto_battery: { position: [-0.15, 0.55, -0.05], size: [0.28, 0.16, 0.22] },
  moto_spark_plugs: { position: [0.2, 0.58, 0.2], size: [0.18, 0.14, 0.18] },
  moto_air_filter: { position: [0.35, 0.48, 0.35], size: [0.22, 0.22, 0.22], geometry: 'sphere' },
}

function CarBody() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.35, 0.95]} />
        <meshStandardMaterial color="#334155" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[-0.15, 0.55, -0.05]} castShadow>
        <boxGeometry args={[1.15, 0.45, 0.82]} />
        <meshStandardMaterial color="#3f4f63" metalness={0.2} roughness={0.5} />
      </mesh>
      <Wheel position={[0.95, -0.05, 0.62]} />
      <Wheel position={[-0.95, -0.05, 0.62]} />
      <Wheel position={[0.95, -0.05, -0.62]} />
      <Wheel position={[-0.95, -0.05, -0.62]} />
    </group>
  )
}

function MotorcycleBody() {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.55, 0.45, 0.7]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.55, 0.55, 0]} castShadow>
        <boxGeometry args={[0.75, 0.12, 0.22]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[-0.55, 0.65, 0]} castShadow>
        <boxGeometry args={[0.35, 0.08, 0.12]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Wheel position={[0.75, -0.05, 0]} scale={0.85} />
      <Wheel position={[-0.75, -0.05, 0]} scale={0.85} />
    </group>
  )
}

function Wheel({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <mesh position={position} scale={scale} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.32, 0.32, 0.18, 24]} />
      <meshStandardMaterial color="#1e293b" metalness={0.15} roughness={0.85} />
    </mesh>
  )
}
