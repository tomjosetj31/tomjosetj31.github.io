import type { ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** The nav availability chip. The dot pulses unless the user prefers reduced motion. */
export function StatusChip({ children, pulse = true }: { children: ReactNode; pulse?: boolean }) {
  const reduced = useReducedMotion()

  return (
    <span className="status-chip">
      <span
        aria-hidden="true"
        style={{
          width: 5.5,
          height: 5.5,
          borderRadius: '50%',
          background: 'var(--status-green)',
          boxShadow: '0 0 7px var(--status-green)',
          animation: pulse && !reduced ? 'chip-pulse 2s ease-in-out infinite' : undefined,
        }}
      />
      {children}
    </span>
  )
}
