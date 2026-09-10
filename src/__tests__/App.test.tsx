import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../App'
import { chapters } from '../content/chapters'

describe('App', () => {
  it('renders a single main landmark', () => {
    render(<App />)
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders a skip link that targets the main content', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main',
    )
  })

  it('renders every chapter section', () => {
    const { container } = render(<App />)
    for (const chapter of chapters) {
      expect(container.querySelector(`#${chapter.id}`)).not.toBeNull()
    }
  })

  it('renders exactly one h1', () => {
    render(<App />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('opens the command palette on the ⌘K shortcut', async () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens the command palette from the nav button', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /command palette/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the palette again on Escape', async () => {
    render(<App />)
    await userEvent.keyboard('{Meta>}k{/Meta}')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
