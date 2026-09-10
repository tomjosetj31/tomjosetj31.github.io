import { describe, expect, it } from 'vitest'
import type { Article, ArticleArchive } from '../../content/types'
import { deriveCadence, deriveHeatmap, windowStart } from '../articles'

const NOW = new Date('2026-09-03T06:00:00.000Z') // a Thursday

function article(guid: string, publishedAt: string, topics: string[] = ['gitops']): Article {
  return { guid, title: `Post ${guid}`, url: `https://medium.com/p/${guid}`, publishedAt, topics }
}

/** firstSeenAt is deliberately later than every publishedAt — the day-one situation. */
function archiveOf(articles: Article[]): ArticleArchive {
  return {
    source: 'https://medium.com/feed/@Tomjosetj31',
    firstSeenAt: '2026-09-03',
    lastSyncedAt: NOW.toISOString(),
    articles,
  }
}

const REAL_FEED = archiveOf([
  article('a1', '2026-09-02T09:46:00.000Z', ['software-engineering', 'gitops', 'devops']),
  article('a2', '2026-09-01T11:01:00.000Z', ['artificial-intelligence', 'devops']),
  article('a3', '2026-08-28T10:01:00.000Z', ['devops', 'gitops']),
  article('a4', '2026-08-27T10:51:00.000Z', ['devops', 'docker']),
  article('a5', '2026-08-26T09:31:00.000Z', ['aws', 'terraform']),
  article('a6', '2026-08-25T09:31:00.000Z', ['devops', 'kubernetes']),
  article('a7', '2026-08-21T11:11:00.000Z', ['devops', 'docker']),
  article('a8', '2026-08-20T11:01:00.000Z', ['devops', 'ci-cd-pipeline']),
  article('a9', '2026-08-19T12:01:00.000Z', ['devops', 'kubernetes']),
  article('a10', '2026-08-18T11:06:00.000Z', ['devops', 'gitops']),
])

const STOPLIST = ['software-engineering', 'programming', 'cloud-computing', 'technology', 'devops']

describe('windowStart', () => {
  it('is the earliest published date, not firstSeenAt', () => {
    expect(windowStart(REAL_FEED)).toBe('2026-08-18')
  })

  it('is null for an empty archive', () => {
    expect(windowStart(archiveOf([]))).toBeNull()
  })
})

describe('deriveCadence', () => {
  it('counts posts across the window anchored on the earliest post', () => {
    const c = deriveCadence(REAL_FEED, NOW, STOPLIST)
    expect(c.postCount).toBe(10)
    expect(c.windowDays).toBe(17) // 18 Aug -> 3 Sep inclusive
  })

  it('computes posts per week to one decimal place', () => {
    // 10 posts over 17 days = 4.1 per week
    expect(deriveCadence(REAL_FEED, NOW, STOPLIST).perWeek).toBe(4.1)
  })

  it('picks the most frequent topic after removing generic tags', () => {
    // devops appears 8 times but is stop-listed; gitops is next with 3.
    expect(deriveCadence(REAL_FEED, NOW, STOPLIST).topTopic).toBe('gitops')
  })

  it('falls back to the raw most-frequent topic when no stoplist is given', () => {
    expect(deriveCadence(REAL_FEED, NOW).topTopic).toBe('devops')
  })

  it('returns zeroes and no topic for an empty archive', () => {
    expect(deriveCadence(archiveOf([]), NOW, STOPLIST)).toEqual({
      postCount: 0,
      windowDays: 0,
      perWeek: 0,
      topTopic: null,
    })
  })

  it('does not divide by zero for a single post published today', () => {
    const c = deriveCadence(archiveOf([article('x', '2026-09-03T08:00:00.000Z')]), NOW, STOPLIST)
    expect(c.windowDays).toBe(1)
    expect(c.perWeek).toBe(7)
    expect(Number.isFinite(c.perWeek)).toBe(true)
  })

  it('breaks topic ties alphabetically so the tile is stable between builds', () => {
    const a = archiveOf([article('x', '2026-09-02T08:00:00.000Z', ['zebra', 'alpha'])])
    expect(deriveCadence(a, NOW).topTopic).toBe('alpha')
  })
})

describe('deriveHeatmap', () => {
  it('returns no weeks for an empty archive rather than throwing', () => {
    expect(deriveHeatmap(archiveOf([]), NOW)).toEqual([])
  })

  it('spans the Monday of the earliest post to the Monday of today', () => {
    const weeks = deriveHeatmap(REAL_FEED, NOW)
    expect(weeks).toHaveLength(3)
    expect(weeks[0].weekStartISO).toBe('2026-08-17')
    expect(weeks[2].weekStartISO).toBe('2026-08-31')
  })

  it('emits seven days per week, Monday first', () => {
    const week = deriveHeatmap(REAL_FEED, NOW)[0]
    expect(week.days).toHaveLength(7)
    expect(week.days[0].date).toBe('2026-08-17')
    expect(week.days[6].date).toBe('2026-08-23')
  })

  it('counts posts on the right days', () => {
    const week = deriveHeatmap(REAL_FEED, NOW)[0]
    const byDate = Object.fromEntries(week.days.map((d) => [d.date, d.count]))
    expect(byDate['2026-08-17']).toBe(0) // Monday — no post
    expect(byDate['2026-08-18']).toBe(1)
    expect(byDate['2026-08-21']).toBe(1)
    expect(byDate['2026-08-22']).toBe(0) // Saturday
  })

  it('counts two posts on the same day', () => {
    const a = archiveOf([
      article('x', '2026-09-01T08:00:00.000Z'),
      article('y', '2026-09-01T18:00:00.000Z'),
    ])
    const days = deriveHeatmap(a, NOW).flatMap((w) => w.days)
    expect(days.find((d) => d.date === '2026-09-01')?.count).toBe(2)
  })

  it('caps the grid at maxWeeks, keeping the most recent weeks', () => {
    const a = archiveOf([
      article('old', '2026-01-05T08:00:00.000Z'),
      article('new', '2026-09-02T08:00:00.000Z'),
    ])
    const weeks = deriveHeatmap(a, NOW, 4)
    expect(weeks).toHaveLength(4)
    expect(weeks[3].weekStartISO).toBe('2026-08-31')
  })
})
