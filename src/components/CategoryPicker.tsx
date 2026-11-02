import type { VehicleCategory } from '../domain/types'
import { VEHICLE_CATEGORY_LABELS } from '../domain/types'
import { CategoryPreview } from './VehicleDiagram'

export function CategoryPicker({
  value,
  onChange,
}: {
  value: VehicleCategory
  onChange: (c: VehicleCategory) => void
}) {
  const options: VehicleCategory[] = ['car', 'motorcycle']

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((cat) => {
        const selected = value === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`overflow-hidden rounded-xl border text-left transition ${
              selected
                ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
            }`}
          >
            <CategoryPreview category={cat} />
            <p
              className={`px-3 py-2 text-sm font-semibold ${
                selected ? 'text-emerald-200' : 'text-slate-300'
              }`}
            >
              {VEHICLE_CATEGORY_LABELS[cat]}
            </p>
          </button>
        )
      })}
    </div>
  )
}
