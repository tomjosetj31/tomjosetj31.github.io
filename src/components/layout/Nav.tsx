import { motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { chapters } from '../../content/chapters'
import { profile } from '../../content/profile'
import { uiCopy } from '../../content/ui'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { MonoLabel } from '../ui/MonoLabel'
import { StatusChip } from '../ui/StatusChip'

export function Nav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const reduced = useReducedMotion()
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return
      setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const panelContent = (
    <>
      {/* sm:hidden: the bar's own chip (hidden sm:inline-flex) already covers >=640px;
          without this, both would render at once between 640-767px while the panel is open. */}
      {profile.availability && (
        <span className="inline-flex sm:hidden">
          <StatusChip>{profile.availability}</StatusChip>
        </span>
      )}
      <ul className="flex flex-col gap-3">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              onClick={closeMenu}
              className="text-[13px] font-medium"
              style={{ color: 'var(--text-2)' }}
            >
              {chapter.num} {chapter.title}
            </a>
          </li>
        ))}
      </ul>
      <a
        href={profile.resumePath}
        download
        onClick={closeMenu}
        className="rounded-[7px] px-3 py-[7px] text-center text-[11px] font-semibold"
        style={{ background: 'var(--text)', color: 'var(--bg)' }}
      >
        {uiCopy.navResumeLabel}
      </a>
    </>
  )

  return (
    <nav
      className="sticky top-0 z-20 border-b border-white/[0.07]"
      style={{ backdropFilter: 'blur(16px) saturate(140%)', background: 'rgba(5,6,15,0.62)' }}
    >
      <div className="shell flex items-center justify-between py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-extrabold"
            style={{ background: 'linear-gradient(135deg, var(--aurora-violet), var(--aurora-cyan))' }}
          >
            {profile.monogram}
          </span>
          <span className="text-[12.5px] font-semibold tracking-tight">{profile.name}</span>
        </a>

        <div className="flex items-center gap-4">
          {profile.availability && (
            <span className="hidden sm:inline-flex">
              <StatusChip>{profile.availability}</StatusChip>
            </span>
          )}

          <ul className="hidden items-center gap-4 md:flex">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <a
                  href={`#${chapter.id}`}
                  className="text-[11.5px] font-medium"
                  style={{ color: 'var(--text-2)' }}
                >
                  {chapter.num} {chapter.title}
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            className="rounded-[5px] border px-1.5 py-1"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
          >
            <MonoLabel>⌘K</MonoLabel>
          </button>

          {/* hidden below md: the mobile panel supplies its own résumé link there,
              so this stays out of the DOM's accessible-name count while it's open. */}
          <a
            href={profile.resumePath}
            download
            className="hidden rounded-[7px] px-3 py-[7px] text-[11px] font-semibold md:inline-block"
            style={{ background: '#f4f6ff', color: '#05060f' }}
          >
            {uiCopy.navResumeLabel}
          </a>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-[5px] border px-1.5 py-1 md:hidden"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
          >
            <MonoLabel>{menuOpen ? 'Close' : 'Menu'}</MonoLabel>
          </button>
        </div>
      </div>

      {menuOpen &&
        (reduced ? (
          <div
            id={panelId}
            ref={panelRef}
            className="shell flex flex-col gap-4 border-t border-white/[0.07] py-4 md:hidden"
          >
            {panelContent}
          </div>
        ) : (
          <motion.div
            id={panelId}
            ref={panelRef}
            className="shell flex flex-col gap-4 border-t border-white/[0.07] py-4 md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {panelContent}
          </motion.div>
        ))}
    </nav>
  )
}
