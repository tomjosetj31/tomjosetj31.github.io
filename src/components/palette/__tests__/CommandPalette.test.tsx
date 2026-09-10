import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { chapters } from '../../../content/chapters'
import { CommandPalette } from '../CommandPalette'

/** Manages `open` state for real so focus-restore behaviour can be observed across a close. */
function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open palette
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  )
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is a labelled modal dialog when open', () => {
    render(<CommandPalette open onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/command palette/i)
  })

  it('focuses the search input on open', () => {
    render(<CommandPalette open onClose={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('lists every chapter as a command', () => {
    render(<CommandPalette open onClose={() => {}} />)
    for (const chapter of chapters) {
      expect(screen.getByRole('option', { name: new RegExp(chapter.title, 'i') })).toBeInTheDocument()
    }
  })

  it('filters commands as you type', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    await userEvent.type(screen.getByRole('combobox'), 'spaceload')
    expect(screen.getByRole('option', { name: /spaceload/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /teaching/i })).toBeNull()
  })

  it('matches case-insensitively', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    await userEvent.type(screen.getByRole('combobox'), 'WRITING')
    expect(screen.getByRole('option', { name: /writing/i })).toBeInTheDocument()
  })

  it('reports when nothing matches instead of showing an empty list', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    await userEvent.type(screen.getByRole('combobox'), 'zzzznomatch')
    expect(screen.getByText(/no matches/i)).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('moves the active option with the arrow keys', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('closes after activating a command with Enter', async () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    await userEvent.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    await userEvent.click(screen.getByTestId('palette-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  describe('focus management', () => {
    it('traps Tab focus inside the dialog instead of leaking into the page behind it', async () => {
      render(<CommandPalette open onClose={() => {}} />)
      const input = screen.getByRole('combobox')
      expect(input).toHaveFocus()

      await userEvent.tab()
      expect(input).toHaveFocus()

      await userEvent.tab({ shift: true })
      expect(input).toHaveFocus()
    })

    it('restores focus to the trigger after closing with Escape', async () => {
      render(<Harness />)
      const trigger = screen.getByRole('button', { name: /open palette/i })

      await userEvent.click(trigger)
      expect(screen.getByRole('combobox')).toHaveFocus()

      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    it('restores focus to the trigger after closing by clicking the backdrop', async () => {
      render(<Harness />)
      const trigger = screen.getByRole('button', { name: /open palette/i })

      await userEvent.click(trigger)
      await userEvent.click(screen.getByTestId('palette-backdrop'))
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    it('restores focus to the trigger after activating a command with Enter', async () => {
      render(<Harness />)
      const trigger = screen.getByRole('button', { name: /open palette/i })

      await userEvent.click(trigger)
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    it('restores focus without re-scrolling, so it cannot cancel the command it just ran', async () => {
      render(<Harness />)
      const trigger = screen.getByRole('button', { name: /open palette/i })
      const focusSpy = vi.spyOn(trigger, 'focus')

      await userEvent.click(trigger)
      await userEvent.keyboard('{Enter}')

      await waitFor(() => expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true }))
    })
  })
})
