import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CountUp } from '../CountUp'

function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  setReducedMotion(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  // Ensure matchMedia is restored for subsequent tests
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
  }
})

describe('CountUp', () => {
  it('reaches the target value', async () => {
    render(<CountUp value={40} durationMs={50} />)
    await waitFor(() => expect(screen.getByText('40')).toBeInTheDocument(), { timeout: 1500 })
  })

  it('renders the final value immediately under reduced motion', () => {
    setReducedMotion(true)
    render(<CountUp value={30} />)
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('appends a suffix', async () => {
    render(<CountUp value={40} suffix="%" durationMs={50} />)
    await waitFor(() => expect(screen.getByText('40%')).toBeInTheDocument(), { timeout: 1500 })
  })

  it('renders decimals when asked', async () => {
    render(<CountUp value={4.2} decimals={1} durationMs={50} />)
    await waitFor(() => expect(screen.getByText('4.2')).toBeInTheDocument(), { timeout: 1500 })
  })

  it('renders zero without animating to something else', () => {
    setReducedMotion(true)
    render(<CountUp value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders final value on first render under reduced motion without flash', () => {
    setReducedMotion(true)
    const { container } = render(<CountUp value={42} />)
    // Assert immediately after render, without waitFor, proves no flash occurs
    expect(container.textContent).toBe('42')
  })

  it('never renders negative or overshooting values during animation', async () => {
    const value = 100
    const { container } = render(<CountUp value={value} durationMs={300} />)
    const span = container.querySelector('span')!

    // Sample rendered values across the animation to catch clock skew regressions
    const samples: number[] = []
    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 25))
      const text = span.textContent ?? '0'
      const num = parseFloat(text)
      samples.push(num)
    }

    // Every intermediate value must be in [0, value], never negative or exceeding target
    samples.forEach((sample) => {
      expect(sample).toBeGreaterThanOrEqual(0)
      expect(sample).toBeLessThanOrEqual(value)
    })

    // Final value should reach the target
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())
  })
})
