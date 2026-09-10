import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { products } from '../../../content/products'
import { Products } from '../Products'

describe('Products', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Products />)
    expect(container.querySelector('#products')).not.toBeNull()
  })

  it('renders every product', () => {
    render(<Products />)
    for (const product of products) {
      expect(screen.getByRole('heading', { name: product.name })).toBeInTheDocument()
    }
  })

  it('shows each product tagline and problem statement', () => {
    render(<Products />)
    for (const product of products) {
      expect(screen.getByText(product.tagline)).toBeInTheDocument()
    }
  })

  it('renders every product link as an external link', () => {
    render(<Products />)
    for (const product of products) {
      for (const link of product.links) {
        const anchor = screen.getByRole('link', { name: new RegExp(link.label, 'i') })
        expect(anchor).toHaveAttribute('href', link.href)
        expect(anchor).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
      }
    }
  })

  it('renders a copyable install command only for products that have one', () => {
    render(<Products />)
    const withInstall = products.filter((p) => p.install)
    expect(screen.getAllByRole('button', { name: /copy command/i })).toHaveLength(withInstall.length)
    for (const product of withInstall) {
      expect(screen.getByText(product.install!.command)).toBeInTheDocument()
    }
  })

  it('marks the featured product so it is visually distinct', () => {
    const { container } = render(<Products />)
    const featured = products.find((p) => p.featured)!
    const cards = container.querySelectorAll('[data-featured="true"]')
    expect(cards).toHaveLength(1)
    expect(within(cards[0] as HTMLElement).getByRole('heading')).toHaveTextContent(featured.name)
  })

  it('shows the status badge for each product', () => {
    render(<Products />)
    for (const product of products) {
      expect(screen.getAllByText(new RegExp(product.status, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('renders backtick-delimited spans in the problem copy as inline code, never as literal backticks', () => {
    const { container } = render(<Products />)
    const spaceload = products.find((p) => p.slug === 'spaceload')!
    expect(spaceload.problem).toContain('`spaceload run`')

    const codeEls = Array.from(container.querySelectorAll('code'))
    const command = codeEls.find((el) => el.textContent === 'spaceload run')
    expect(command).toBeDefined()

    expect(container.textContent?.includes('`')).toBe(false)
  })
})
