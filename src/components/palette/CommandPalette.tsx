import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { chapters } from '../../content/chapters'
import { products } from '../../content/products'
import { profile } from '../../content/profile'
import { uiCopy } from '../../content/ui'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { MonoLabel } from '../ui/MonoLabel'

interface Command {
  id: string
  label: string
  hint: string
  run: () => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** All elements inside `container` that can receive Tab focus, in DOM order. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function buildCommands(): Command[] {
  return [
    ...chapters.map((chapter) => ({
      id: `chapter-${chapter.id}`,
      label: `${chapter.num} ${chapter.title}`,
      hint: uiCopy.paletteHintChapter,
      run: () => scrollToId(chapter.id),
    })),
    ...products.map((product) => ({
      id: `product-${product.slug}`,
      label: product.name,
      hint: uiCopy.paletteHintProduct,
      run: () => scrollToId('products'),
    })),
    {
      id: 'copy-email',
      label: uiCopy.paletteCopyEmailLabel(profile.email),
      hint: uiCopy.paletteHintAction,
      run: () => {
        void navigator.clipboard?.writeText(profile.email).catch(() => undefined)
      },
    },
    {
      id: 'resume',
      label: uiCopy.paletteResumeLabel,
      hint: uiCopy.paletteHintAction,
      run: () => window.open(profile.resumePath, '_blank', 'noopener'),
    },
    {
      id: 'github',
      label: uiCopy.paletteGithubLabel,
      hint: uiCopy.paletteHintAction,
      run: () => window.open('https://github.com/tomjosetj31', '_blank', 'noopener'),
    },
  ]
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const commands = useMemo(buildCommands, [])
  const reduced = useReducedMotion()

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return commands
    return commands.filter((command) => command.label.toLowerCase().includes(needle))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    } else {
      // preventScroll: focus() scrolls its element into view by default, which would
      // cancel a command's own scrollIntoView (e.g. a chapter jump) that just ran.
      previouslyFocusedRef.current?.focus({ preventScroll: true })
      previouslyFocusedRef.current = null
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  if (!open) return null

  const runAndClose = (command: Command) => {
    command.run()
    onClose()
  }

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, matches.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const command = matches[active]
      if (command) runAndClose(command)
      else onClose()
      return
    }
    if (event.key === 'Tab') {
      const container = dialogRef.current
      if (!container) return
      const focusable = getFocusableElements(container)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement as HTMLElement | null
      const currentIndex = current ? focusable.indexOf(current) : -1

      if (event.shiftKey) {
        if (currentIndex <= 0) {
          event.preventDefault()
          last.focus()
        }
      } else if (currentIndex === -1 || currentIndex === focusable.length - 1) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
      <div
        data-testid="palette-backdrop"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(5,6,15,0.66)', backdropFilter: 'blur(6px)' }}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="glass relative z-10 w-[min(560px,92vw)] overflow-hidden p-0"
        initial={reduced ? false : { opacity: 0, scale: 0.97, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-label="Search commands"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={uiCopy.palettePlaceholder}
          className="w-full border-0 border-b border-white/10 bg-transparent px-4 py-3.5 text-[13.5px] outline-none"
        />

        {matches.length === 0 ? (
          <p className="px-4 py-4 text-[12.5px]" style={{ color: 'var(--text-3)' }}>
            {uiCopy.paletteEmptyState}
          </p>
        ) : (
          <ul id="palette-list" role="listbox" className="m-0 max-h-[46vh] list-none overflow-y-auto p-1.5">
            {matches.map((command, index) => (
              <li
                key={command.id}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => runAndClose(command)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[7px] px-2.5 py-2.5 text-[12.5px]"
                style={index === active ? { background: 'rgba(255,255,255,0.07)' } : undefined}
              >
                <span>{command.label}</span>
                <MonoLabel>{command.hint}</MonoLabel>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
