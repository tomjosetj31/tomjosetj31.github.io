import { writingCopy } from '../../content/writing'
import type { HeatmapWeek } from '../../lib/articles'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function levelOf(count: number): 0 | 1 | 2 {
  if (count === 0) return 0
  return count === 1 ? 1 : 2
}

// Bespoke teal values with no design-token equivalent — the tokens only cover
// the flat accent colour, not these translucency/glow variants per level.
const LEVEL_STYLE: Record<0 | 1 | 2, { background: string; borderColor: string; boxShadow?: string }> = {
  0: { background: 'rgba(255,255,255,0.028)', borderColor: 'rgba(255,255,255,0.075)' },
  1: { background: 'rgba(45,212,191,0.32)', borderColor: 'rgba(45,212,191,0.4)' },
  2: {
    background: 'rgba(45,212,191,0.62)',
    borderColor: 'rgba(45,212,191,0.7)',
    boxShadow: '0 0 9px rgba(45,212,191,0.45)',
  },
}

export function CadenceHeatmap({
  weeks,
  firstSeenAt,
}: {
  weeks: HeatmapWeek[]
  firstSeenAt: string
}) {
  if (weeks.length === 0) return null

  const total = weeks.reduce(
    (sum, week) => sum + week.days.reduce((weekSum, day) => weekSum + day.count, 0),
    0,
  )

  return (
    <GlassPanel className="mb-3 px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <MonoLabel>{writingCopy.heatmapCaption(weeks.length)}</MonoLabel>
        <MonoLabel style={{ color: 'var(--accent-teal)' }}>{writingCopy.heatmapAutoUpdated}</MonoLabel>
      </div>

      <div className="flex items-start gap-[7px] overflow-x-auto">
        <div className="flex shrink-0 flex-col gap-[3.5px]">
          {DAY_LABELS.map((label, index) => (
            <span
              key={index}
              style={{
                height: 15,
                font: '600 8px/15px var(--font-mono)',
                color: 'var(--text-3)',
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div
          role="img"
          aria-label={`Publishing heatmap: ${total} posts across ${weeks.length} weeks`}
          className="flex gap-[3.5px]"
        >
          {weeks.map((week) => (
            <div key={week.weekStartISO} className="flex flex-col gap-[3.5px]">
              {week.days.map((day) => {
                const level = levelOf(day.count)
                return (
                  <span
                    key={day.date}
                    data-cell
                    data-level={level}
                    title={`${day.date}: ${day.count} post${day.count === 1 ? '' : 's'}`}
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 3,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      ...LEVEL_STYLE[level],
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 max-w-[70ch]" style={{ font: '500 9px/1.5 var(--font-mono)', color: 'var(--text-3)' }}>
        {writingCopy.trackingSince(firstSeenAt)}
      </p>
    </GlassPanel>
  )
}
