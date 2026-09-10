import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from '../useReducedMotion'

function Probe() {
  return <span data-testid="probe">{String(useReducedMotion())}</span>
}

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
  return listeners
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReducedMotion', () => {
  it('is false when the user has expressed no preference', () => {
    mockMatchMedia(false)
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('false')
  })

  it('is true when the user prefers reduced motion', () => {
    mockMatchMedia(true)
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('true')
  })

  it('queries prefers-reduced-motion specifically', () => {
    mockMatchMedia(false)
    render(<Probe />)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('does not throw when matchMedia is unavailable', () => {
    // @ts-expect-error deliberately removing the API to simulate an old environment
    delete window.matchMedia
    expect(() => render(<Probe />)).not.toThrow()
  })
})
