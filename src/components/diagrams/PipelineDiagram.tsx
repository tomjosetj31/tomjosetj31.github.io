import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { pipelineCaption, pipelineNodes, pipelineStatus, supportingTools } from '../../content/pipeline'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'

export function PipelineDiagram() {
  const reduced = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)

  // Token position is a function of how far the diagram has travelled through
  // the viewport — the spec calls for scroll-driven, not a timer.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.85', 'end 0.4'],
  })
  const tokenLeft = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const tokenOpacity = useTransform(scrollYProgress, [0, 0.06, 0.94, 1], [0, 1, 1, 0])

  return (
    <GlassPanel className="overflow-hidden px-5 pt-5 pb-4.5">
      <div className="mb-5 flex justify-between gap-3">
        <MonoLabel>{pipelineCaption}</MonoLabel>
        <MonoLabel style={{ color: 'var(--accent-cyan)' }}>{pipelineStatus}</MonoLabel>
      </div>

      {/* Narrow viewports can't fit all five stages without shrinking text to
          illegibility, so the diagram scrolls horizontally inside its own
          container instead of clipping stages silently. The token lives
          inside this same scrollable region so it never detaches from the
          stages it travels between. */}
      <div
        className="overflow-x-auto"
        style={{ overscrollBehaviorX: 'contain' }}
        tabIndex={0}
        role="group"
        aria-label="Deployment pipeline, scrollable"
      >
        <div ref={trackRef} className="relative">
          {!reduced && (
            <motion.span
              aria-hidden="true"
              className="absolute -top-[3px] z-10 h-[7px] w-[7px] rounded-full"
              style={{
                left: tokenLeft,
                opacity: tokenOpacity,
                top: 'calc(50% - 3.5px)',
                background: '#67e8f9',
                boxShadow: '0 0 12px 3px rgba(103,232,249,0.7)',
              }}
            />
          )}

          <ol className="flex list-none items-center gap-0 p-0">
            {pipelineNodes.map((node, index) => (
              <li key={node.name} className="contents">
                <div
                  className="shrink-0 rounded-[7px] px-2 py-2.5 text-center"
                  style={{
                    border: '1px solid rgba(34,211,238,0.42)',
                    background: 'rgba(34,211,238,0.07)',
                  }}
                >
                  <div
                    style={{
                      font: '600 9px/1.15 var(--font-mono)',
                      letterSpacing: '0.06em',
                      color: 'var(--accent-cyan-soft)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.name}
                  </div>
                  <div
                    className="mt-1 hidden sm:block"
                    style={{
                      font: '500 7.5px/1 var(--font-mono)',
                      color: 'rgba(165,243,252,0.5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.detail}
                  </div>
                </div>
                {index < pipelineNodes.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="h-px min-w-2 flex-1"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(34,211,238,0.22), rgba(34,211,238,0.55))',
                    }}
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ul className="mt-4.5 flex list-none gap-2 border-t border-dashed border-white/[0.11] p-0 pt-4">
        {supportingTools.map((tool) => (
          <li
            key={tool}
            className="flex-1 rounded-[7px] border border-white/10 py-2 text-center"
            style={{
              font: '600 8.5px/1 var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-2)',
            }}
          >
            {tool}
          </li>
        ))}
      </ul>
    </GlassPanel>
  )
}
