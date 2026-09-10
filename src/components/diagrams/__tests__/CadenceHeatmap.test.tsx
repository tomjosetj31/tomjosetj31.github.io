import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { HeatmapWeek } from '../../../lib/articles'
import { CadenceHeatmap } from '../CadenceHeatmap'

function week(weekStartISO: string, counts: number[]): HeatmapWeek {
  return {
    weekStartISO,
    days: counts.map((count, index) => {
      const date = new Date(`${weekStartISO}T00:00:00.000Z`)
      date.setUTCDate(date.getUTCDate() + index)
      return { date: date.toISOString().slice(0, 10), count }
    }),
  }
}

const WEEKS: HeatmapWeek[] = [
  week('2026-08-17', [0, 1, 1, 1, 1, 0, 0]),
  week('2026-08-24', [0, 1, 1, 1, 1, 0, 0]),
  week('2026-08-31', [0, 1, 2, 0, 0, 0, 0]),
]

describe('CadenceHeatmap', () => {
  it('renders one cell per day across every week', () => {
    const { container } = render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(21)
  })

  it('marks days with posts and leaves empty days unmarked', () => {
    const { container } = render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    // WEEKS holds 11 zero-days, 9 single-post days and 1 double-post day.
    expect(container.querySelectorAll('[data-level="0"]')).toHaveLength(11)
    expect(container.querySelectorAll('[data-level="1"]')).toHaveLength(9)
    expect(container.querySelectorAll('[data-level="2"]')).toHaveLength(1)
  })

  it('exposes an accessible summary rather than a wall of unlabelled divs', () => {
    render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    const grid = screen.getByRole('img')
    // 4 + 4 + 3 posts across the three fixture weeks.
    expect(grid).toHaveAccessibleName(/11 posts across 3 weeks/i)
  })

  it('states when tracking began, so a young archive is not read as a gap', () => {
    render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    expect(screen.getByText(/tracking since/i)).toBeInTheDocument()
  })

  it('renders nothing when there are no weeks', () => {
    const { container } = render(<CadenceHeatmap weeks={[]} firstSeenAt="2026-09-03" />)
    expect(container).toBeEmptyDOMElement()
  })
})
