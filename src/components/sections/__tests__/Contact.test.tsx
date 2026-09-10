import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contactCopy } from '../../../content/contact'
import { profile } from '../../../content/profile'
import { Contact } from '../Contact'

const KEY = 'test-access-key'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })))
  // Re-establish matchMedia each test: vi.restoreAllMocks() below resets the vi.fn()
  // installed by vitest.setup.ts, which would otherwise break Reveal's
  // useReducedMotion() on every test after the first (see CountUp.test.tsx).
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
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function fillForm() {
  await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace')
  await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
  await userEvent.type(screen.getByLabelText(/message/i), 'Interested in your platform work.')
}

describe('Contact without an access key', () => {
  it('offers a mailto link instead of a form that cannot submit', () => {
    render(<Contact accessKey="" />)
    expect(screen.getByRole('link', { name: new RegExp(profile.email, 'i') })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    )
    expect(screen.queryByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') })).toBeNull()
  })
})

describe('Contact with an access key', () => {
  it('renders the form fields', () => {
    render(<Contact accessKey={KEY} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('refuses to submit an incomplete form and does not call the API', async () => {
    render(<Contact accessKey={KEY} />)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.validationMessage)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('posts the message to Web3Forms with the access key', async () => {
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.web3forms.com/submit')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.access_key).toBe(KEY)
    expect(body.email).toBe('ada@example.com')
    expect(body.message).toBe('Interested in your platform work.')
  })

  it('includes the honeypot field in the submitted payload', async () => {
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toHaveProperty('botcheck', false)
  })

  it('confirms success to the user', async () => {
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.successMessage)).toBeInTheDocument()
  })

  it('reports a failed submission and still offers the email address', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(profile.email, 'i') })).toBeInTheDocument()
  })

  it('reports a network failure rather than hanging', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.errorMessage)).toBeInTheDocument()
  })

  it('lists the direct channels alongside the form', () => {
    render(<Contact accessKey={KEY} />)
    for (const social of profile.socials) {
      expect(screen.getByRole('link', { name: new RegExp(social.label, 'i') })).toHaveAttribute(
        'href',
        social.href,
      )
    }
  })

  it('disables the submit button while a submission is pending', async () => {
    let resolveFetch: (value: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve
          }),
      ),
    )
    render(<Contact accessKey={KEY} />)
    await fillForm()
    const button = screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') })
    await userEvent.click(button)

    expect(await screen.findByRole('button', { name: new RegExp(contactCopy.submitPending, 'i') })).toBeDisabled()

    resolveFetch(new Response(JSON.stringify({ success: true }), { status: 200 }))
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
  })

  describe('per-field inline validation', () => {
    it('marks every empty required field invalid and shows its own error message', async () => {
      render(<Contact accessKey={KEY} />)
      await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(messageInput).toHaveAttribute('aria-invalid', 'true')

      expect(await screen.findByText(contactCopy.nameError)).toBeInTheDocument()
      expect(screen.getByText(contactCopy.emailError)).toBeInTheDocument()
      expect(screen.getByText(contactCopy.messageError)).toBeInTheDocument()
    })

    it('associates each field error with its input via aria-describedby', async () => {
      render(<Contact accessKey={KEY} />)
      await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

      const nameInput = screen.getByLabelText(/name/i)
      const describedBy = nameInput.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()

      const errorNode = document.getElementById(describedBy as string)
      expect(errorNode).not.toBeNull()
      expect(errorNode).toHaveTextContent(contactCopy.nameError)
    })

    it('flags an invalid email shape even when the field is not empty', async () => {
      render(<Contact accessKey={KEY} />)
      await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace')
      await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
      await userEvent.type(screen.getByLabelText(/message/i), 'Hello, interested in your work.')
      await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

      expect(await screen.findByText(contactCopy.emailError)).toBeInTheDocument()
      expect(screen.queryByText(contactCopy.nameError)).toBeNull()
      expect(screen.queryByText(contactCopy.messageError)).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('accepts a valid, non-empty email shape without flagging that field', async () => {
      render(<Contact accessKey={KEY} />)
      await fillForm()
      await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

      await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
      expect(screen.queryByText(contactCopy.emailError)).toBeNull()
    })

    it('clears a field error once the visitor corrects that field', async () => {
      render(<Contact accessKey={KEY} />)
      await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
      expect(await screen.findByText(contactCopy.nameError)).toBeInTheDocument()

      await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace')

      expect(screen.queryByText(contactCopy.nameError)).toBeNull()
      // Other untouched fields remain flagged.
      expect(screen.getByText(contactCopy.emailError)).toBeInTheDocument()
      expect(screen.getByText(contactCopy.messageError)).toBeInTheDocument()
    })
  })
})
