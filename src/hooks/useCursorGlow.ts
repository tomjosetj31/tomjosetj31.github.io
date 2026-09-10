import { useCallback, type MouseEventHandler } from 'react'
import { useReducedMotion } from './useReducedMotion'

export function useCursorGlow(): {
  onMouseMove: MouseEventHandler<HTMLElement>
  onMouseLeave: MouseEventHandler<HTMLElement>
} {
  const reduced = useReducedMotion()

  const onMouseMove = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      if (reduced) return
      const element = event.currentTarget
      const bounds = element.getBoundingClientRect()
      element.style.setProperty('--gx', `${event.clientX - bounds.left}px`)
      element.style.setProperty('--gy', `${event.clientY - bounds.top}px`)
      element.style.setProperty('--g-opacity', '1')
    },
    [reduced],
  )

  const onMouseLeave = useCallback<MouseEventHandler<HTMLElement>>((event) => {
    event.currentTarget.style.setProperty('--g-opacity', '0')
  }, [])

  return { onMouseMove, onMouseLeave }
}
