import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GlassPanel } from '../GlassPanel'

describe('GlassPanel', () => {
  it('composes caller-supplied onMouseMove with glow handler', async () => {
    const callerOnMouseMove = vi.fn()
    const { container } = render(
      <GlassPanel glow onMouseMove={callerOnMouseMove}>
        content
      </GlassPanel>,
    )
    const panel = container.querySelector('.glass-glow') as HTMLElement

    await userEvent.hover(panel)

    expect(callerOnMouseMove).toHaveBeenCalled()
    expect(panel.style.getPropertyValue('--g-opacity')).toBe('1')
  })

  it('calls caller-supplied onMouseLeave and resets glow opacity', async () => {
    const callerOnMouseLeave = vi.fn()
    const { container } = render(
      <GlassPanel glow onMouseLeave={callerOnMouseLeave}>
        content
      </GlassPanel>,
    )
    const panel = container.querySelector('.glass-glow') as HTMLElement

    await userEvent.hover(panel)
    await userEvent.unhover(panel)

    expect(callerOnMouseLeave).toHaveBeenCalled()
    expect(panel.style.getPropertyValue('--g-opacity')).toBe('0')
  })

  it('composes className with glow and custom classes', () => {
    const { container } = render(
      <GlassPanel glow className="custom-class">
        content
      </GlassPanel>,
    )
    const panel = container.querySelector('.glass-glow') as HTMLElement

    expect(panel.classList.contains('glass')).toBe(true)
    expect(panel.classList.contains('glass-glow')).toBe(true)
    expect(panel.classList.contains('custom-class')).toBe(true)
  })
})
