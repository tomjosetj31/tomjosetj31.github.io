import { useEffect, useRef, useState } from 'react'
import { MonoLabel } from './MonoLabel'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * A copyable shell command. The spec singles this out: a product you can
 * `brew install` reads as a real product, so the command must be one click away.
 */
export function CopyableCommand({ label, command }: { label: string; command: string }) {
  const [state, setState] = useState<CopyState>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(command)
      setState('copied')
    } catch {
      setState('failed')
    }
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setState('idle'), 2200)
  }

  return (
    <div className="my-3">
      <MonoLabel className="mb-1.5 block">{label}</MonoLabel>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy command: ${command}`}
        className="flex w-full items-center justify-between gap-2 rounded-[7px] border border-white/10 bg-black/40 px-2.5 py-2.5 text-left"
      >
        <code
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--accent-cyan-soft)' }}
        >
          {command}
        </code>
        <MonoLabel style={{ flexShrink: 0 }}>
          {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
        </MonoLabel>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </div>
  )
}
