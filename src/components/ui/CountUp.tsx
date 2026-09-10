import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface CountUpProps {
  value: number
  suffix?: string
  decimals?: number
  durationMs?: number
}

/** Counts from zero to `value` when scrolled into view. Static under reduced motion. */
export function CountUp({ value, suffix = '', decimals = 0, durationMs = 1100 }: CountUpProps) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)
  const [display, setDisplay] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const element = ref.current
    if (!element || started) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [reduced, started, value])

  useEffect(() => {
    if (reduced || !started) return
    let frame = 0
    let startedAt: number | null = null

    const tick = (now: number) => {
      // Use the rAF timestamp to derive start time, not performance.now().
      // In jsdom and other test environments, performance.now() and the rAF timestamp
      // do not share an origin — the gap widens under parallel load, causing negative
      // progress and breaking the easing curve. Deriving startedAt from the first rAF
      // callback ensures both values come from the same clock.
      if (startedAt === null) startedAt = now
      const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs))
      const eased = 1 - Math.pow(1 - progress, 3)
      if (progress < 1) {
        setDisplay(value * eased)
        frame = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced, started, value, durationMs])

  return (
    <span ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
