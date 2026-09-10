import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { profile } from '../../../content/profile'
import { Hero } from '../Hero'

describe('Hero', () => {
  it('renders both halves of the headline as one heading', () => {
    render(<Hero />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(profile.headlineTop)
    expect(heading).toHaveTextContent(profile.headlineBottom)
  })

  it('shows the eyebrow and the location', () => {
    render(<Hero />)
    expect(screen.getByText(profile.eyebrow)).toBeInTheDocument()
    expect(screen.getByText(profile.location)).toBeInTheDocument()
  })

  it('shows the subline', () => {
    render(<Hero />)
    expect(screen.getByText(profile.subline)).toBeInTheDocument()
  })

  it('gives the avatar meaningful alt text', () => {
    render(<Hero />)
    expect(screen.getByAltText(profile.name)).toHaveAttribute('src', profile.avatarUrl)
  })

  it('offers a downloadable résumé and a link into the work', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: /download résumé/i })).toHaveAttribute(
      'href',
      profile.resumePath,
    )
    expect(screen.getByRole('link', { name: /see the work/i })).toHaveAttribute(
      'href',
      '#infrastructure',
    )
  })
})
