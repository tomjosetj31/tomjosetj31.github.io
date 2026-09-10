import { certifications } from '../../content/certifications'
import { education } from '../../content/experience'
import { uiCopy } from '../../content/ui'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

export function Credentials() {
  return (
    <section id="credentials" className="shell mt-13 scroll-mt-20" aria-label="Credentials">
      <Reveal>
        <MonoLabel as="p" className="mb-3 block">
          {uiCopy.certificationsLabel}
        </MonoLabel>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {certifications.map((certification) => (
            <GlassPanel glow key={certification.abbr} className="px-3.5 py-3.5">
              <div className="text-[15px] font-bold" style={{ letterSpacing: '-0.02em' }}>
                {certification.verifyUrl ? (
                  <a href={certification.verifyUrl} target="_blank" rel="noreferrer noopener">
                    {certification.abbr} ↗
                  </a>
                ) : (
                  certification.abbr
                )}
              </div>
              <p className="mt-2 text-[11.5px] leading-[1.45]" style={{ color: 'var(--text-2)' }}>
                {certification.name}
              </p>
              <MonoLabel className="mt-2 block">{certification.issuer}</MonoLabel>
            </GlassPanel>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <MonoLabel as="p" className="mt-6 mb-3 block">
          {uiCopy.educationLabel}
        </MonoLabel>
        <GlassPanel className="flex flex-wrap items-baseline justify-between gap-3 px-3.5 py-3.5">
          <div>
            <div className="text-[14px] font-bold" style={{ letterSpacing: '-0.02em' }}>
              {education.degree}
            </div>
            <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--text-2)' }}>
              {education.institution} — {education.location}
            </p>
          </div>
          <MonoLabel>{education.period}</MonoLabel>
        </GlassPanel>
      </Reveal>
    </section>
  )
}
