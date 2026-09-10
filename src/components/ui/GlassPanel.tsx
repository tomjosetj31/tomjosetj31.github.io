import { useCallback, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react'
import { useCursorGlow } from '../../hooks/useCursorGlow'

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside'
  /** Adds the cursor-tracked radial highlight. Off by default. */
  glow?: boolean
  children: ReactNode
}

export function GlassPanel({
  as: Tag = 'div',
  glow = false,
  className = '',
  children,
  onMouseMove: callerOnMouseMove,
  onMouseLeave: callerOnMouseLeave,
  ...rest
}: GlassPanelProps) {
  const { onMouseMove: glowOnMouseMove, onMouseLeave: glowOnMouseLeave } = useCursorGlow()

  /* Compose glow handlers with caller-supplied handlers if present. */
  const onMouseMove = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      glowOnMouseMove(event)
      callerOnMouseMove?.(event)
    },
    [glowOnMouseMove, callerOnMouseMove],
  )

  const onMouseLeave = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      glowOnMouseLeave(event)
      callerOnMouseLeave?.(event)
    },
    [glowOnMouseLeave, callerOnMouseLeave],
  )

  const handlers = glow ? { onMouseMove, onMouseLeave } : {}

  return (
    <Tag className={`glass ${glow ? 'glass-glow' : ''} ${className}`.trim()} {...handlers} {...rest}>
      {children}
    </Tag>
  )
}
