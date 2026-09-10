import { chapters } from '../../content/chapters'
import { guides } from '../../content/guides'
import { uiCopy } from '../../content/ui'
import { ChapterHeading } from '../ui/ChapterHeading'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

const chapter = chapters[3]

export function Teaching() {
  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide, index) => (
          <Reveal key={guide.name} delay={0.04 * index} className="h-full">
            <GlassPanel glow className="h-full px-3.5 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={guide.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[13px] font-bold"
                  style={{ letterSpacing: '-0.015em', fontFamily: 'var(--font-mono)' }}
                >
                  {guide.name}
                </a>
                {typeof guide.days === 'number' && (
                  <span className="metric-chip" style={{ ['--chip' as string]: chapter.accent }}>
                    {guide.days}-day
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-[1.5]" style={{ color: 'var(--text-2)' }}>
                {guide.description}
              </p>
            </GlassPanel>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <MonoLabel as="p" className="mt-3 block">
          {uiCopy.guidesSummary(guides.length)}
        </MonoLabel>
      </Reveal>
    </section>
  )
}
