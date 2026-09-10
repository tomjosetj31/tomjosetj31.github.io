import { useRef, useState, type FormEvent } from 'react'
import { contactCopy } from '../../content/contact'
import { profile } from '../../content/profile'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

const ENDPOINT = 'https://api.web3forms.com/submit'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = 'idle' | 'pending' | 'success' | 'error' | 'invalid'
type Field = 'name' | 'email' | 'message'
type FormState = Record<Field, string>
type FieldErrors = Partial<Record<Field, string>>

const fieldClass =
  'w-full rounded-[7px] border border-white/10 bg-black/30 px-3 py-2.5 text-[12.5px] outline-none'
const errorStyle = { color: '#fca5a5' }

/** Validates required fields plus email shape. Returns one message per invalid field. */
function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = contactCopy.nameError
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = contactCopy.emailError
  if (!form.message.trim()) errors.message = contactCopy.messageError
  return errors
}

function DirectChannels() {
  return (
    <ul className="mt-4 flex flex-wrap gap-4 p-0" style={{ listStyle: 'none' }}>
      <li>
        <a href={`mailto:${profile.email}`}>
          <MonoLabel>{profile.email}</MonoLabel>
        </a>
      </li>
      {profile.socials.map((social) => (
        <li key={social.label}>
          <a href={social.href} target="_blank" rel="noreferrer noopener">
            <MonoLabel>{social.label} ↗</MonoLabel>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Contact({
  accessKey = import.meta.env.VITE_WEB3FORMS_KEY ?? '',
}: {
  accessKey?: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const botcheckRef = useRef<HTMLInputElement>(null)

  const update = (field: Field) => (event: { target: { value: string } }) => {
    const value = event.target.value
    setForm((previous) => ({ ...previous, [field]: value }))
    setFieldErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setStatus('invalid')
      return
    }

    setFieldErrors({})
    setStatus('pending')
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Portfolio enquiry from ${form.name}`,
          from_name: form.name,
          ...form,
          botcheck: botcheckRef.current?.checked ?? false,
        }),
      })
      setStatus(response.ok ? 'success' : 'error')
      if (response.ok) setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="shell mt-13 scroll-mt-20" aria-label="Contact">
      <Reveal>
        <GlassPanel className="px-5 py-5">
          <h2 className="m-0 text-[21px] font-bold" style={{ letterSpacing: '-0.028em' }}>
            {contactCopy.heading}
          </h2>

          {/* No key configured: present a route that actually works rather than a
              form that silently discards the message, as the old site did. */}
          {accessKey === '' ? (
            <>
              <p className="mt-2.5 max-w-[54ch] text-[13px]" style={{ color: 'var(--text-2)' }}>
                {contactCopy.fallbackBlurb}
              </p>
              <DirectChannels />
            </>
          ) : (
            <>
              <p className="mt-2.5 max-w-[54ch] text-[13px]" style={{ color: 'var(--text-2)' }}>
                {contactCopy.blurb}
              </p>

              <form onSubmit={submit} className="mt-4 grid gap-2.5 sm:grid-cols-2" noValidate>
                <label className="flex flex-col gap-1.5">
                  <MonoLabel>{contactCopy.nameLabel}</MonoLabel>
                  <input
                    className={fieldClass}
                    value={form.name}
                    onChange={update('name')}
                    aria-invalid={fieldErrors.name ? true : undefined}
                    aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="contact-name-error" className="text-[11.5px]" style={errorStyle}>
                      {fieldErrors.name}
                    </p>
                  )}
                </label>

                <label className="flex flex-col gap-1.5">
                  <MonoLabel>{contactCopy.emailLabel}</MonoLabel>
                  <input
                    type="email"
                    className={fieldClass}
                    value={form.email}
                    onChange={update('email')}
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="contact-email-error" className="text-[11.5px]" style={errorStyle}>
                      {fieldErrors.email}
                    </p>
                  )}
                </label>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <MonoLabel>{contactCopy.messageLabel}</MonoLabel>
                  <textarea
                    rows={5}
                    className={fieldClass}
                    value={form.message}
                    onChange={update('message')}
                    aria-invalid={fieldErrors.message ? true : undefined}
                    aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                  />
                  {fieldErrors.message && (
                    <p id="contact-message-error" className="text-[11.5px]" style={errorStyle}>
                      {fieldErrors.message}
                    </p>
                  )}
                </label>

                {/* Web3Forms spam honeypot — hidden from users, filled only by bots.
                    Its checked state is read at submit time and sent as `botcheck`. */}
                <input ref={botcheckRef} type="checkbox" name="botcheck" className="hidden" tabIndex={-1} />

                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary" disabled={status === 'pending'}>
                    {status === 'pending' ? contactCopy.submitPending : contactCopy.submitIdle}
                  </button>
                </div>
              </form>

              <div aria-live="polite" className="mt-3 text-[12px]">
                {status === 'invalid' && <p style={errorStyle}>{contactCopy.validationMessage}</p>}
                {status === 'success' && (
                  <p style={{ color: 'var(--status-green)' }}>{contactCopy.successMessage}</p>
                )}
                {status === 'error' && <p style={errorStyle}>{contactCopy.errorMessage}</p>}
              </div>

              <DirectChannels />
            </>
          )}
        </GlassPanel>
      </Reveal>
    </section>
  )
}
