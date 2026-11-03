import type { VehicleCategory } from '../domain/types'

/** Small 2D preview for category picker (keeps bundle light on list screen) */
export function CategoryPreview({ category }: { category: VehicleCategory }) {
  return (
    <svg viewBox="0 0 400 220" className="h-24 w-full">
      {category === 'car' ? <CarSilhouette /> : <MotorcycleSilhouette />}
    </svg>
  )
}

function CarSilhouette() {
  return (
    <g className="fill-slate-700/90 stroke-slate-500/60" strokeWidth="1.5">
      <path
        d="M 55 155 Q 55 130 75 120 L 110 105 L 145 95 L 220 88 L 290 92 L 330 105 L 355 118 Q 365 128 365 155 Z"
        className="fill-slate-600/80"
      />
      <circle cx="95" cy="158" r="22" className="fill-slate-800 stroke-slate-600" />
      <circle cx="310" cy="158" r="22" className="fill-slate-800 stroke-slate-600" />
    </g>
  )
}

function MotorcycleSilhouette() {
  return (
    <g className="fill-slate-700/90 stroke-slate-500/60" strokeWidth="1.5">
      <ellipse cx="175" cy="105" rx="42" ry="32" className="fill-slate-600/80" />
      <path
        d="M 55 155 Q 40 140 55 125 L 95 115 L 175 95 L 260 115 L 295 158 L 80 165 Z"
        className="fill-slate-600/70"
      />
      <circle cx="68" cy="158" r="20" className="fill-slate-800 stroke-slate-600" />
      <circle cx="285" cy="158" r="20" className="fill-slate-800 stroke-slate-600" />
    </g>
  )
}
