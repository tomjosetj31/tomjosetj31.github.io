import { chapters } from '../../content/chapters'
import type { ArticleArchive } from '../../content/types'
import { MEDIUM_PROFILE_URL, TOPIC_STOPLIST, writingCopy } from '../../content/writing'
import { archive as liveArchive } from '../../lib/archive'
import { deriveCadence, deriveHeatmap } from '../../lib/articles'
import { CadenceHeatmap } from '../diagrams/CadenceHeatmap'
import { ChapterHeading } from '../ui/ChapterHeading'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'
import { Tag } from '../ui/Tag'

const chapter = chapters[2]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function Writing({
  archive = liveArchive,
  now = new Date(),
}: {
  archive?: ArticleArchive
  now?: Date
}) {
  const cadence = deriveCadence(archive, now, TOPIC_STOPLIST)
  const weeks = deriveHeatmap(archive, now)
  const [featured, ...rest] = archive.articles

  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      {featured === undefined ? (
        <GlassPanel className="px-4 py-5">
          <p style={{ color: 'var(--text-2)' }}>{writingCopy.emptyState}</p>
        </GlassPanel>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
            <Reveal className="h-full">
              <GlassPanel glow className="h-full px-3.5 py-3.5">
                <div className="font-bold" style={{ fontSize: 25, letterSpacing: '-0.045em' }}>
                  <CountUp value={cadence.postCount} />{' '}
                  <span className="text-[14px]">{writingCopy.postsSuffix}</span>
                </div>
                <MonoLabel className="mt-[7px] block">{writingCopy.postsTileLabel}</MonoLabel>
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.06} className="h-full">
              <GlassPanel glow className="h-full px-3.5 py-3.5">
                <div className="font-bold" style={{ fontSize: 25, letterSpacing: '-0.045em' }}>
                  <CountUp value={cadence.perWeek} decimals={1} />
                  <span className="text-[14px]">{writingCopy.cadenceSuffix}</span>
                </div>
                <MonoLabel className="mt-[7px] block">{writingCopy.cadenceTileLabel}</MonoLabel>
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.12} className="col-span-2 h-full md:col-span-1">
              <GlassPanel glow data-testid="top-topic" className="h-full px-3.5 py-3.5">
                <div className="font-bold" style={{ fontSize: 25, letterSpacing: '-0.045em' }}>
                  {cadence.topTopic ?? writingCopy.topTopicFallback}
                </div>
                <MonoLabel className="mt-[7px] block">{writingCopy.topTopicTileLabel}</MonoLabel>
              </GlassPanel>
            </Reveal>
          </div>

          <Reveal delay={0.16}>
            <CadenceHeatmap weeks={weeks} firstSeenAt={archive.firstSeenAt} />
          </Reveal>

          <Reveal delay={0.2}>
            <GlassPanel
              glow
              className="mb-2.5 px-5 py-4.5"
              style={{
                borderColor: 'rgba(94,234,212,0.34)',
                background: 'linear-gradient(150deg, rgba(45,212,191,0.10), rgba(255,255,255,0.035))',
              }}
            >
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <h3 className="m-0 max-w-[34ch] text-[20px] font-bold" style={{ letterSpacing: '-0.03em', lineHeight: 1.22 }}>
                  <a href={featured.url} target="_blank" rel="noreferrer noopener">
                    {featured.title}
                  </a>
                </h3>
                <MonoLabel style={{ color: 'var(--accent-teal)', whiteSpace: 'nowrap' }}>
                  {writingCopy.latestBadge(formatDate(featured.publishedAt))}
                </MonoLabel>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {featured.topics.slice(0, 4).map((topic) => (
                  <Tag key={topic}>{topic}</Tag>
                ))}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.24}>
            <GlassPanel className="overflow-hidden">
              <ul className="m-0 list-none p-0">
                {rest.slice(0, 6).map((item) => (
                  <li
                    key={item.guid}
                    className="flex items-center gap-3.5 border-b border-white/[0.055] px-4 py-3 last:border-b-0"
                  >
                    <MonoLabel style={{ width: 56, flexShrink: 0 }}>
                      {formatDate(item.publishedAt)}
                    </MonoLabel>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="min-w-0 flex-1 text-[12.8px] leading-[1.4] font-medium"
                    >
                      {item.title}
                    </a>
                    <MonoLabel style={{ color: 'var(--accent-teal)', flexShrink: 0 }}>
                      {item.topics[0] ?? ''}
                    </MonoLabel>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.28}>
            <GlassPanel className="mt-2.5 flex items-center justify-between gap-3 px-4 py-3.5">
              <MonoLabel>{writingCopy.articlesTracked(archive.articles.length)}</MonoLabel>
              <a
                href={MEDIUM_PROFILE_URL}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  font: '600 10.5px/1 var(--font-mono)',
                  letterSpacing: '0.1em',
                  color: 'var(--accent-teal)',
                }}
              >
                {writingCopy.followOnMedium}
              </a>
            </GlassPanel>
          </Reveal>
        </>
      )}
    </section>
  )
}
