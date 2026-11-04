import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { VehicleCategory } from '../domain/types'
import { getPartsForCategory } from '../domain/partsCatalog'
import { VEHICLE_GLB, VEHICLE_MODEL_TRANSFORM } from './vehicleModelConfig'
import {
  getPartHotspotSpec,
  resolveHotspotPosition,
  type PartHotspotSpec,
} from './vehiclePartAnchors'

interface VehicleDiagramProps {
  category: VehicleCategory
  selectedPartId: string | null
  onSelectPart: (partId: string | null) => void
}

useGLTF.preload(VEHICLE_GLB.car)
useGLTF.preload(VEHICLE_GLB.motorcycle)

export function VehiclePartsList({
  category,
  selectedPartId,
  onSelectPart,
}: {
  category: VehicleCategory
  selectedPartId: string | null
  onSelectPart: (partId: string | null) => void
}) {
  const parts = useMemo(() => getPartsForCategory(category), [category])

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {parts.length} komponen yang bisa dipilih
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {parts.map((part) => {
          const active = selectedPartId === part.id
          return (
            <button
              key={part.id}
              type="button"
              onClick={() =>
                onSelectPart(active ? null : part.id)
              }
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-emerald-400/70 bg-emerald-950/80 text-emerald-100'
                  : 'border-slate-700 bg-slate-950/80 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {part.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
        Putar model · ketuk komponen di model atau pilih dari daftar di bawah
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
      <VehicleModelWithHotspots
        category={category}
        parts={parts}
        selectedPartId={selectedPartId}
        hoveredId={hoveredId}
        onSelectPart={onSelectPart}
        onHoverPart={setHoveredId}
      />
    </group>
  )
}

function VehicleModelWithHotspots({
  category,
  parts,
  selectedPartId,
  hoveredId,
  onSelectPart,
  onHoverPart,
}: {
  category: VehicleCategory
  parts: ReturnType<typeof getPartsForCategory>
  selectedPartId: string | null
  hoveredId: string | null
  onSelectPart: (partId: string) => void
  onHoverPart: (partId: string | null) => void
}) {
  const { scene } = useGLTF(VEHICLE_GLB[category])
  const transformRef = useRef<THREE.Group>(null)
  const [positions, setPositions] = useState<
    Record<string, [number, number, number]>
  >({})

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

  useLayoutEffect(() => {
    const group = transformRef.current
    if (!group) return

    const next: Record<string, [number, number, number]> = {}
    for (const part of parts) {
      const spec = getPartHotspotSpec(category, part.id)
      if (!spec) continue
      const pos = resolveHotspotPosition(model, group, spec)
      if (!pos) continue
      next[part.id] = [pos.x, pos.y, pos.z]
    }
    setPositions(next)
  }, [category, model, parts])

  return (
    <group
      ref={transformRef}
      position={t.position}
      rotation={t.rotation}
      scale={t.scale}
    >
      <primitive object={model} />
      {parts.map((part) => {
        const pos = positions[part.id]
        const spec = getPartHotspotSpec(category, part.id)
        if (!pos || !spec) return null
        return (
          <PartHotspot
            key={part.id}
            label={part.label}
            spec={spec}
            position={pos}
            active={selectedPartId === part.id}
            hovered={hoveredId === part.id}
            onSelect={() => onSelectPart(part.id)}
            onHover={(v) => onHoverPart(v ? part.id : null)}
          />
        )
      })}
    </group>
  )
}

function PartHotspot({
  label,
  spec,
  position,
  active,
  hovered,
  onSelect,
  onHover,
}: {
  label: string
  spec: PartHotspotSpec
  position: [number, number, number]
  active: boolean
  hovered: boolean
  onSelect: () => void
  onHover: (over: boolean) => void
}) {
  const highlighted = active || hovered
  const scale = active ? 1.15 : hovered ? 1.08 : 1
  const color = active ? '#34d399' : hovered ? '#2dd4bf' : '#475569'

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    onSelect()
  }

  return (
    <mesh
      position={position}
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
      {spec.geometry === 'sphere' ? (
        <sphereGeometry args={[spec.size[0], 16, 16]} />
      ) : (
        <boxGeometry args={spec.size} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={active ? '#059669' : hovered ? '#0d9488' : '#000000'}
        emissiveIntensity={active ? 0.65 : hovered ? 0.35 : 0}
        metalness={0.25}
        roughness={0.45}
        transparent
        opacity={highlighted ? 0.92 : 0.35}
        depthWrite={highlighted}
      />
      {(highlighted || active) && (
        <Html
          center
          distanceFactor={9}
          position={[0, Math.max(spec.size[1], spec.size[0]) * 0.85 + 0.1, 0]}
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
