import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { certifications } from '../../../content/certifications'
import { education } from '../../../content/experience'
import { guides } from '../../../content/guides'
import { Credentials } from '../Credentials'
import { Teaching } from '../Teaching'

describe('Teaching', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Teaching />)
    expect(container.querySelector('#teaching')).not.toBeNull()
  })

  it('links every guide to its repository', () => {
    render(<Teaching />)
    for (const guide of guides) {
      expect(screen.getByRole('link', { name: new RegExp(guide.name, 'i') })).toHaveAttribute(
        'href',
        guide.repo,
      )
    }
  })

  it('shows the day count for guides that have one', () => {
    render(<Teaching />)
    const withDays = guides.filter((g) => typeof g.days === 'number')
    for (const guide of withDays) {
      expect(screen.getByText(`${guide.days}-day`)).toBeInTheDocument()
    }
  })
})

describe('Credentials', () => {
  it('lists every certification', () => {
    render(<Credentials />)
    for (const certification of certifications) {
      expect(screen.getByText(certification.abbr)).toBeInTheDocument()
      expect(screen.getByText(certification.name)).toBeInTheDocument()
    }
  })

  it('renders a certification without a verify URL as plain text, not a dead link', () => {
    render(<Credentials />)
    const unverifiable = certifications.filter((c) => !c.verifyUrl)
    for (const certification of unverifiable) {
      expect(screen.queryByRole('link', { name: new RegExp(certification.abbr, 'i') })).toBeNull()
    }
  })

  it('shows the degree and institution', () => {
    render(<Credentials />)
    expect(screen.getByText(education.degree)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(education.institution, 'i'))).toBeInTheDocument()
  })
})
