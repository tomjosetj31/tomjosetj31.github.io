import { chapters } from '../../content/chapters'
import { experience } from '../../content/experience'
import { PipelineDiagram } from '../diagrams/PipelineDiagram'
import { ChapterHeading } from '../ui/ChapterHeading'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'
import { Tag } from '../ui/Tag'

const chapter = chapters[0]

export function Infrastructure() {
  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      <Reveal>
        <PipelineDiagram />
      </Reveal>

      <Reveal delay={0.08}>
        <MonoLabel as="p" className="mt-4 mb-3 block">
          {experience.role} · {experience.company} · {experience.location} · {experience.period}
        </MonoLabel>
      </Reveal>

      <div className="grid gap-2.5 md:grid-cols-2">
        {experience.outcomes.map((outcome, index) => (
          <Reveal key={outcome.title} delay={0.06 * index} className="h-full">
            <GlassPanel glow className="h-full px-3.5 py-3.5">
              <h3 className="m-0 flex items-center gap-2 text-[13px] font-bold tracking-tight">
                {outcome.title}
                <span className="metric-chip" style={{ ['--chip' as string]: chapter.accent }}>
                  {outcome.metric}
                </span>
              </h3>
              <p className="my-2.5 text-[11.8px] leading-[1.55]" style={{ color: 'var(--text-2)' }}>
                {outcome.body}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {outcome.tools.map((tool) => (
                  <Tag key={tool}>{tool}</Tag>
                ))}
              </div>
            </GlassPanel>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
