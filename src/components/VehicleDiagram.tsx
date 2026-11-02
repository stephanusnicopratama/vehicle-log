import type { VehicleCategory } from '../domain/types'
import { getPartsForCategory } from '../domain/partsCatalog'

interface VehicleDiagramProps {
  category: VehicleCategory
  selectedPartId: string | null
  onSelectPart: (partId: string) => void
}

export function VehicleDiagram({
  category,
  selectedPartId,
  onSelectPart,
}: VehicleDiagramProps) {
  const parts = getPartsForCategory(category)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
      <svg
        viewBox="0 0 400 220"
        className="h-auto w-full touch-none"
        role="img"
        aria-label={
          category === 'car'
            ? 'Diagram mobil, pilih komponen'
            : 'Diagram motor, pilih komponen'
        }
      >
        {category === 'car' ? <CarSilhouette /> : <MotorcycleSilhouette />}
        {parts.map((part) => {
          const active = selectedPartId === part.id
          return (
            <g key={part.id}>
              <circle
                cx={part.x}
                cy={part.y}
                r={active ? 16 : 13}
                className={`cursor-pointer transition-all ${
                  active
                    ? 'fill-emerald-500/90 stroke-white stroke-[2]'
                    : 'fill-emerald-600/40 stroke-emerald-400/80 stroke-[1.5] hover:fill-emerald-500/60'
                }`}
                onClick={() => onSelectPart(part.id)}
              />
              <text
                x={part.x}
                y={part.y + 4}
                textAnchor="middle"
                className="pointer-events-none fill-white text-[9px] font-semibold"
              >
                •
              </text>
              <title>{part.label}</title>
            </g>
          )
        })}
      </svg>
      <p className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-500">
        Ketuk titik hijau untuk detail komponen
      </p>
    </div>
  )
}

function CarSilhouette() {
  return (
    <g className="fill-slate-700/90 stroke-slate-500/60" strokeWidth="1.5">
      <path
        d="M 55 155 Q 55 130 75 120 L 110 105 L 145 95 L 220 88 L 290 92 L 330 105 L 355 118 Q 365 128 365 155 Z"
        className="fill-slate-600/80"
      />
      <path d="M 115 105 L 145 95 L 175 115 L 115 120 Z" opacity="0.5" />
      <path d="M 230 90 L 280 95 L 300 115 L 240 118 Z" opacity="0.5" />
      <circle cx="95" cy="158" r="22" className="fill-slate-800 stroke-slate-600" />
      <circle cx="95" cy="158" r="10" className="fill-slate-600" />
      <circle cx="310" cy="158" r="22" className="fill-slate-800 stroke-slate-600" />
      <circle cx="310" cy="158" r="10" className="fill-slate-600" />
      <rect x="70" y="118" width="260" height="8" rx="2" opacity="0.3" />
    </g>
  )
}

function MotorcycleSilhouette() {
  return (
    <g className="fill-slate-700/90 stroke-slate-500/60" strokeWidth="1.5">
      <ellipse cx="175" cy="105" rx="42" ry="32" className="fill-slate-600/80" />
      <path
        d="M 55 155 Q 40 140 55 125 L 95 115 L 130 100 L 175 95 L 220 100 L 260 115 L 290 130 Q 310 145 295 158 L 250 165 L 80 165 Z"
        className="fill-slate-600/70"
      />
      <circle cx="68" cy="158" r="20" className="fill-slate-800 stroke-slate-600" />
      <circle cx="68" cy="158" r="9" className="fill-slate-600" />
      <circle cx="285" cy="158" r="20" className="fill-slate-800 stroke-slate-600" />
      <circle cx="285" cy="158" r="9" className="fill-slate-600" />
      <path d="M 175 75 L 195 55 L 210 70 L 185 95 Z" className="fill-slate-500/50" />
    </g>
  )
}

/** Small preview for category picker cards */
export function CategoryPreview({ category }: { category: VehicleCategory }) {
  return (
    <svg viewBox="0 0 400 220" className="h-24 w-full">
      {category === 'car' ? <CarSilhouette /> : <MotorcycleSilhouette />}
    </svg>
  )
}
