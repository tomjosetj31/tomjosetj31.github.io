import { profile } from '../../content/profile'
import { uiCopy } from '../../content/ui'
import { MonoLabel } from '../ui/MonoLabel'

export function Footer() {
  return (
    <footer className="shell mt-11 flex flex-col gap-4 border-t border-white/[0.07] py-5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonoLabel>
          {profile.name} · {profile.location}
        </MonoLabel>
        <ul className="flex gap-4">
          {profile.socials.map((social) => (
            <li key={social.label}>
              <a href={social.href} target="_blank" rel="noreferrer noopener">
                <MonoLabel>{social.label} ↗</MonoLabel>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <MonoLabel>{uiCopy.footerBuiltWith}</MonoLabel>
    </footer>
  )
}
