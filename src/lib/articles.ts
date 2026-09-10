import type { Article, ArticleArchive } from '../content/types'

const MS_PER_DAY = 86_400_000

/** UTC `YYYY-MM-DD`. All article maths is done in UTC so tests never depend on the runner's timezone. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** The Monday of the week containing `isoDate`. Sunday belongs to the week that precedes it. */
export function mondayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  const dow = d.getUTCDay() // 0 = Sunday
  const shift = dow === 0 ? 6 : dow - 1
  return toISODate(new Date(d.getTime() - shift * MS_PER_DAY))
}

export function addDaysISO(isoDate: string, days: number): string {
  return toISODate(new Date(new Date(`${isoDate}T00:00:00.000Z`).getTime() + days * MS_PER_DAY))
}

export function daysBetween(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T00:00:00.000Z`).getTime()
  const end = new Date(`${endISO}T00:00:00.000Z`).getTime()
  return Math.round((end - start) / MS_PER_DAY)
}

export function createEmptyArchive(source: string, now: Date): ArticleArchive {
  return { source, firstSeenAt: toISODate(now), lastSyncedAt: now.toISOString(), articles: [] }
}

/**
 * Append-only merge keyed on Medium's `guid`.
 *
 * An article present in the archive but absent from `incoming` is preserved —
 * Medium's RSS exposes only the latest 10 posts, so absence from the feed is
 * not evidence that a post is gone.
 */
export function mergeArchive(
  archive: ArticleArchive,
  incoming: Article[],
  now: Date,
): ArticleArchive {
  const byGuid = new Map<string, Article>()
  for (const existing of archive.articles) byGuid.set(existing.guid, existing)
  for (const fresh of incoming) {
    byGuid.set(fresh.guid, { ...(byGuid.get(fresh.guid) ?? {}), ...fresh })
  }

  const articles = [...byGuid.values()].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.guid.localeCompare(b.guid),
  )

  return {
    source: archive.source,
    firstSeenAt: archive.firstSeenAt || toISODate(now),
    lastSyncedAt: now.toISOString(),
    articles,
  }
}

export interface Cadence {
  postCount: number
  windowDays: number
  /** Posts per week over the window, to one decimal place. */
  perWeek: number
  topTopic: string | null
}

export interface HeatmapDay {
  date: string
  count: number
}

export interface HeatmapWeek {
  weekStartISO: string
  /** Always 7 entries, Monday through Sunday. */
  days: HeatmapDay[]
}

/**
 * The earliest published date in the archive, or null when it is empty.
 *
 * This — not `firstSeenAt` — anchors both derivations. The first sync yields
 * posts that predate the archive, so anchoring on `firstSeenAt` would render
 * an empty grid on day one.
 */
export function windowStart(archive: ArticleArchive): string | null {
  if (archive.articles.length === 0) return null
  return archive.articles.reduce(
    (earliest, a) => (a.publishedAt < earliest ? a.publishedAt : earliest),
    archive.articles[0].publishedAt,
  ).slice(0, 10)
}

export function deriveCadence(
  archive: ArticleArchive,
  now: Date,
  stoplist: string[] = [],
): Cadence {
  const start = windowStart(archive)
  if (start === null) return { postCount: 0, windowDays: 0, perWeek: 0, topTopic: null }

  const postCount = archive.articles.length
  const windowDays = Math.max(1, daysBetween(start, toISODate(now)) + 1)
  const perWeek = Math.round((postCount / windowDays) * 7 * 10) / 10

  const blocked = new Set(stoplist.map((t) => t.toLowerCase()))
  const counts = new Map<string, number>()
  for (const a of archive.articles) {
    for (const topic of a.topics) {
      const key = topic.toLowerCase()
      if (blocked.has(key)) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  // Ties break alphabetically so the rendered tile is stable between builds.
  const topTopic =
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null

  return { postCount, windowDays, perWeek, topTopic }
}

export function deriveHeatmap(
  archive: ArticleArchive,
  now: Date,
  maxWeeks = 26,
): HeatmapWeek[] {
  const start = windowStart(archive)
  if (start === null) return []

  const countsByDate = new Map<string, number>()
  for (const a of archive.articles) {
    const date = a.publishedAt.slice(0, 10)
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1)
  }

  const weeks: HeatmapWeek[] = []
  const lastMonday = mondayOf(toISODate(now))
  for (let monday = mondayOf(start); monday <= lastMonday; monday = addDaysISO(monday, 7)) {
    weeks.push({
      weekStartISO: monday,
      days: Array.from({ length: 7 }, (_, i) => {
        const date = addDaysISO(monday, i)
        return { date, count: countsByDate.get(date) ?? 0 }
      }),
    })
  }

  return weeks.slice(-maxWeeks)
}
