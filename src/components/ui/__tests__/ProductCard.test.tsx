import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Product } from '../../../content/types'
import { ProductCard } from '../ProductCard'

function makeProduct(overrides: Partial<Product>): Product {
  return {
    slug: 'test-product',
    name: 'Test Product',
    tagline: 'Does a thing.',
    problem: 'Solves a problem.',
    status: 'shipped',
    stack: ['TypeScript'],
    links: [{ label: 'GitHub', href: 'https://github.com/example/example' }],
    ...overrides,
  }
}

describe('ProductCard status badge', () => {
  it('renders the shipped status with the shipped (green) treatment', () => {
    render(<ProductCard product={makeProduct({ status: 'shipped' })} />)
    const badge = screen.getByText('shipped')
    expect(badge.style.getPropertyValue('--chip')).toBe('var(--status-green)')
  })

  it('does not render a wip product with the shipped treatment', () => {
    render(<ProductCard product={makeProduct({ status: 'wip' })} />)
    const badge = screen.getByText('wip')
    expect(badge.style.getPropertyValue('--chip')).not.toBe('var(--status-green)')
    expect(badge.style.getPropertyValue('--chip')).toBe('var(--status-amber)')
  })

  it('does not render an archived product with the shipped treatment', () => {
    render(<ProductCard product={makeProduct({ status: 'archived' })} />)
    const badge = screen.getByText('archived')
    expect(badge.style.getPropertyValue('--chip')).not.toBe('var(--status-green)')
    expect(badge.style.getPropertyValue('--chip')).toBe('var(--status-neutral)')
  })

  it('gives the live status the same treatment as shipped', () => {
    render(<ProductCard product={makeProduct({ status: 'live' })} />)
    const badge = screen.getByText('live')
    expect(badge.style.getPropertyValue('--chip')).toBe('var(--status-green)')
  })
})
