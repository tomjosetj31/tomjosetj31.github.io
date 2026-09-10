import { buildProofPoints } from '../../content/proof'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { Reveal } from '../ui/Reveal'

export function ProofStrip() {
  const proofPoints = buildProofPoints()

  return (
    <section className="shell" aria-label="Impact at a glance">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {proofPoints.map((point, index) => (
          <Reveal key={point.label.join(' ')} delay={index * 0.07} className="h-full">
            <GlassPanel glow className="relative h-full overflow-hidden px-3.5 py-3.5">
              <span
                aria-hidden="true"
                className="absolute inset-x-3 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
                }}
              />
              <div
                className="font-bold"
                style={{ fontSize: 26, lineHeight: 1, letterSpacing: '-0.045em' }}
              >
                {point.prefix}
                <CountUp value={point.value} decimals={point.decimals ?? 0} />
                {point.suffix && <span style={{ fontSize: 16 }}>{point.suffix}</span>}
              </div>
              <div
                className="mt-[7px]"
                style={{
                  font: '500 10px/1.35 var(--font-mono)',
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}
              >
                {point.label[0]}
                <br />
                {point.label[1]}
              </div>
            </GlassPanel>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
