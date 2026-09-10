import { describe, expect, it } from 'vitest'
import type { Article, ArticleArchive } from '../../content/types'
import {
  addDaysISO,
  createEmptyArchive,
  daysBetween,
  mergeArchive,
  mondayOf,
  toISODate,
} from '../articles'

const SOURCE = 'https://medium.com/feed/@Tomjosetj31'
const NOW = new Date('2026-09-03T06:00:00.000Z')

function article(guid: string, publishedAt: string, title = `Post ${guid}`): Article {
  return { guid, title, url: `https://medium.com/p/${guid}`, publishedAt, topics: ['gitops'] }
}

describe('date helpers', () => {
  it('formats a UTC date', () => {
    expect(toISODate(new Date('2026-09-03T23:30:00.000Z'))).toBe('2026-09-03')
  })

  it('finds the Monday of a week, and is a no-op on a Monday', () => {
    expect(mondayOf('2026-09-03')).toBe('2026-08-31') // a Thursday
    expect(mondayOf('2026-08-31')).toBe('2026-08-31')
    expect(mondayOf('2026-09-06')).toBe('2026-08-31') // a Sunday belongs to the week before
  })

  it('adds days across a month boundary', () => {
    expect(addDaysISO('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDaysISO('2026-09-01', -1)).toBe('2026-08-31')
  })

  it('counts days between dates', () => {
    expect(daysBetween('2026-08-18', '2026-09-03')).toBe(16)
    expect(daysBetween('2026-09-03', '2026-09-03')).toBe(0)
  })
})

describe('createEmptyArchive', () => {
  it('stamps the source and first-seen date with no articles', () => {
    const a = createEmptyArchive(SOURCE, NOW)
    expect(a.source).toBe(SOURCE)
    expect(a.firstSeenAt).toBe('2026-09-03')
    expect(a.articles).toEqual([])
  })
})

describe('mergeArchive', () => {
  it('adds incoming articles newest first', () => {
    const merged = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('a', '2026-08-18T11:06:00.000Z'), article('b', '2026-09-02T09:46:00.000Z')],
      NOW,
    )
    expect(merged.articles.map((x) => x.guid)).toEqual(['b', 'a'])
  })

  it('deduplicates on guid within a single incoming batch', () => {
    const merged = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('a', '2026-08-18T11:06:00.000Z'), article('a', '2026-08-18T11:06:00.000Z')],
      NOW,
    )
    expect(merged.articles).toHaveLength(1)
  })

  it('keeps an article that has dropped out of the RSS window', () => {
    const existing: ArticleArchive = {
      ...createEmptyArchive(SOURCE, NOW),
      articles: [article('old', '2026-07-01T10:00:00.000Z')],
    }
    const merged = mergeArchive(existing, [article('new', '2026-09-02T09:46:00.000Z')], NOW)
    expect(merged.articles.map((x) => x.guid)).toEqual(['new', 'old'])
  })

  it('is idempotent — merging the same feed twice changes nothing', () => {
    const incoming = [article('a', '2026-08-18T11:06:00.000Z'), article('b', '2026-09-02T09:46:00.000Z')]
    const once = mergeArchive(createEmptyArchive(SOURCE, NOW), incoming, NOW)
    const twice = mergeArchive(once, incoming, NOW)
    expect(twice).toEqual(once)
  })

  it('updates a changed title in place without duplicating the guid', () => {
    const once = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('a', '2026-08-18T11:06:00.000Z', 'Original title')],
      NOW,
    )
    const twice = mergeArchive(
      once,
      [article('a', '2026-08-18T11:06:00.000Z', 'Corrected title')],
      NOW,
    )
    expect(twice.articles).toHaveLength(1)
    expect(twice.articles[0].title).toBe('Corrected title')
  })

  it('never overwrites firstSeenAt once it is set', () => {
    const existing: ArticleArchive = { ...createEmptyArchive(SOURCE, new Date('2026-06-01T00:00:00.000Z')) }
    const merged = mergeArchive(existing, [article('a', '2026-09-02T09:46:00.000Z')], NOW)
    expect(merged.firstSeenAt).toBe('2026-06-01')
  })

  it('backfills firstSeenAt when the archive lacks one', () => {
    const existing: ArticleArchive = { source: SOURCE, firstSeenAt: '', lastSyncedAt: '', articles: [] }
    expect(mergeArchive(existing, [], NOW).firstSeenAt).toBe('2026-09-03')
  })

  it('records the sync time on every run', () => {
    expect(mergeArchive(createEmptyArchive(SOURCE, NOW), [], NOW).lastSyncedAt).toBe(
      '2026-09-03T06:00:00.000Z',
    )
  })

  it('breaks publishedAt ties deterministically by guid', () => {
    const merged = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('z', '2026-09-01T10:00:00.000Z'), article('a', '2026-09-01T10:00:00.000Z')],
      NOW,
    )
    expect(merged.articles.map((x) => x.guid)).toEqual(['a', 'z'])
  })
})
