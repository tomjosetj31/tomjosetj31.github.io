import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CopyableCommand } from '../CopyableCommand'

const COMMAND = 'brew install tomjosetj31/spaceload/spaceload'

function stubClipboard(impl: () => Promise<void>) {
  Object.assign(navigator, { clipboard: { writeText: vi.fn(impl) } })
  return navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>
}

describe('CopyableCommand', () => {
  it('shows the command', () => {
    render(<CopyableCommand label="Install" command={COMMAND} />)
    expect(screen.getByText(COMMAND)).toBeInTheDocument()
  })

  it('writes the command to the clipboard when clicked', async () => {
    const writeText = stubClipboard(async () => {})
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledWith(COMMAND)
  })

  it('confirms the copy to the user', async () => {
    stubClipboard(async () => {})
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent(/copied/i))
  })

  it('exposes an accessible name that names the command', () => {
    render(<CopyableCommand label="Install" command={COMMAND} />)
    expect(screen.getByRole('button')).toHaveAccessibleName(`Copy command: ${COMMAND}`)
  })

  it('does not crash when the clipboard write is rejected', async () => {
    stubClipboard(async () => {
      throw new Error('denied')
    })
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent(/failed/i))
  })

  it('does not crash when the clipboard API is missing entirely', async () => {
    Object.assign(navigator, { clipboard: undefined })
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent(/failed/i))
  })

  it('does not crash when unmounting after a click', async () => {
    stubClipboard(async () => {})
    const { unmount } = render(<CopyableCommand label="Install" command={COMMAND} />)
    const button = screen.getByRole('button')
    button.click()
    unmount()
    // No error should be thrown on unmount
    expect(true).toBe(true)
  })

  it('handles rapid clicks with timer cleanup', async () => {
    vi.useFakeTimers()
    try {
      stubClipboard(async () => {})
      render(<CopyableCommand label="Install" command={COMMAND} />)
      const button = screen.getByRole('button')
      button.click()
      vi.advanceTimersByTime(100)
      button.click()
      vi.advanceTimersByTime(2300)
      expect(button).toHaveTextContent('Copy')
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders aria-live region for status announcements', () => {
    render(<CopyableCommand label="Install" command={COMMAND} />)
    const ariaLive = screen.getByRole('status')
    expect(ariaLive).toBeInTheDocument()
  })

  it('announces state changes in aria-live region when clipboard write succeeds', async () => {
    stubClipboard(async () => {})
    const { container } = render(<CopyableCommand label="Install" command={COMMAND} />)
    const button = screen.getByRole('button')
    const ariaLive = container.querySelector('[role="status"]')!
    expect(ariaLive.textContent).toBe('')
    button.click()
    await waitFor(() => expect(ariaLive.textContent).toBe('Copied'), { timeout: 500 })
  })

  it('announces state changes in aria-live region when clipboard write fails', async () => {
    stubClipboard(async () => {
      throw new Error('denied')
    })
    const { container } = render(<CopyableCommand label="Install" command={COMMAND} />)
    const button = screen.getByRole('button')
    const ariaLive = container.querySelector('[role="status"]')!
    expect(ariaLive.textContent).toBe('')
    button.click()
    await waitFor(() => expect(ariaLive.textContent).toBe('Copy failed'), { timeout: 500 })
  })
})
