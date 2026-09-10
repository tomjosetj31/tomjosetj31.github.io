import { profile } from '../../content/profile'
import { uiCopy } from '../../content/ui'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

export function Hero() {
  return (
    <section id="top" className="shell pt-16 pb-13">
      <Reveal>
        <div className="mb-5 flex items-center gap-3">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            width={42}
            height={42}
            className="rounded-full border border-white/20"
            style={{ boxShadow: '0 0 0 4px rgba(124,58,237,0.16)' }}
          />
          <div className="flex flex-col gap-1.5">
            <MonoLabel>{profile.eyebrow}</MonoLabel>
            <MonoLabel style={{ color: 'rgba(244,246,255,0.28)' }}>{profile.location}</MonoLabel>
          </div>
        </div>

        <h1
          className="m-0 font-bold"
          style={{
            fontSize: 'clamp(30px, 5.4vw, 52px)',
            lineHeight: 1.03,
            letterSpacing: '-0.038em',
          }}
        >
          {profile.headlineTop}
          <br />
          <span
            style={{
              background: 'linear-gradient(96deg, #c4b5fd 6%, #67e8f9 92%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {profile.headlineBottom}
          </span>
        </h1>

        <p
          className="my-5 max-w-[50ch] text-[14.5px] leading-[1.62]"
          style={{ color: 'var(--text-2)' }}
        >
          {profile.subline}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href="#infrastructure" className="btn-primary">
            {uiCopy.heroPrimaryCta}
          </a>
          <a href={profile.resumePath} download className="btn-glass">
            {uiCopy.heroSecondaryCta}
          </a>
        </div>
      </Reveal>
    </section>
  )
}
