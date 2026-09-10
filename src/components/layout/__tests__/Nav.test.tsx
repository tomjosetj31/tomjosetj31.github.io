import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { chapters } from '../../../content/chapters'
import { profile } from '../../../content/profile'
import { Nav } from '../Nav'

describe('Nav', () => {
  it('links to every chapter by anchor', () => {
    render(<Nav onOpenPalette={() => {}} />)
    for (const chapter of chapters) {
      const link = screen.getByRole('link', { name: new RegExp(chapter.title, 'i') })
      expect(link).toHaveAttribute('href', `#${chapter.id}`)
    }
  })

  it('offers the résumé as a download', () => {
    render(<Nav onOpenPalette={() => {}} />)
    const resume = screen.getByRole('link', { name: /résumé/i })
    expect(resume).toHaveAttribute('href', profile.resumePath)
    expect(resume).toHaveAttribute('download')
  })

  it('shows the availability chip when profile declares one', () => {
    render(<Nav onOpenPalette={() => {}} />)
    expect(screen.getByText(profile.availability!)).toBeInTheDocument()
  })

  it('exposes a labelled button that opens the command palette', () => {
    render(<Nav onOpenPalette={() => {}} />)
    expect(screen.getByRole('button', { name: /command palette/i })).toBeInTheDocument()
  })

  it('is a navigation landmark', () => {
    render(<Nav onOpenPalette={() => {}} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})

describe('Nav mobile menu', () => {
  it('exposes a closed toggle by default', () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('reveals links to all four chapters when activated', async () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(toggle)

    const panelId = toggle.getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)
    expect(panel).toBeInTheDocument()

    for (const chapter of chapters) {
      const link = within(panel!).getByRole('link', { name: new RegExp(chapter.title, 'i') })
      expect(link).toHaveAttribute('href', `#${chapter.id}`)
    }
  })

  it('flips aria-expanded to true once open', async () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes on Escape', async () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(toggle)
    const panelId = toggle.getAttribute('aria-controls')!
    expect(document.getElementById(panelId)).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(document.getElementById(panelId)).toBeNull()
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when a chapter link inside it is activated', async () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(toggle)
    const panelId = toggle.getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)!

    const link = within(panel).getByRole('link', { name: new RegExp(chapters[0].title, 'i') })
    await userEvent.click(link)

    expect(document.getElementById(panelId)).toBeNull()
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the panel out of the accessibility tree while closed', () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    const panelId = toggle.getAttribute('aria-controls')!

    expect(document.getElementById(panelId)).toBeNull()
    // The desktop link set is always present; the mobile panel's duplicate must not be.
    expect(screen.queryAllByRole('link', { name: new RegExp(chapters[0].title, 'i') })).toHaveLength(1)
  })

  it("hides the bar's résumé link below md, since the open panel supplies its own", async () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(toggle)

    const panelId = toggle.getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)!
    const resumeLinks = screen.getAllByRole('link', { name: /résumé/i })
    const barResumeLink = resumeLinks.find((link) => !panel.contains(link))

    expect(resumeLinks).toHaveLength(2) // one in the bar, one in the open panel
    expect(barResumeLink).toHaveClass('hidden')
    expect(barResumeLink).toHaveClass('md:inline-block')
  })

  it("hides the panel's availability chip at sm and up, since the bar's own chip covers that range", async () => {
    render(<Nav onOpenPalette={() => {}} />)
    const toggle = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(toggle)

    const panelId = toggle.getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)!
    const chipWrapper = within(panel).getByText(profile.availability!).closest('span')!.parentElement!

    expect(chipWrapper).toHaveClass('sm:hidden')
  })
})
