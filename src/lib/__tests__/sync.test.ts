import { describe, expect, it, vi } from 'vitest'
import type { SyncDeps } from '../sync'
import { syncArchive } from '../sync'

const SOURCE = 'https://medium.com/feed/@Tomjosetj31'
const NOW = new Date('2026-09-03T06:00:00.000Z')

const FEED = `<?xml version="1.0"?><rss version="2.0"><channel><item>
  <title><![CDATA[How I Would Design GitOps for 100+ Kubernetes Clusters]]></title>
  <link>https://medium.com/p/206a174a1c59?source=rss-x</link>
  <guid isPermaLink="false">https://medium.com/p/206a174a1c59</guid>
  <category><![CDATA[gitops]]></category>
  <pubDate>Wed, 02 Sep 2026 09:46:00 GMT</pubDate>
</item></channel></rss>`

function deps(overrides: Partial<SyncDeps> = {}): SyncDeps & { writeArchive: ReturnType<typeof vi.fn> } {
  const writeArchive = vi.fn(async () => {})
  return {
    fetchFeed: async () => FEED,
    readArchive: async () => null,
    writeArchive,
    now: NOW,
    source: SOURCE,
    ...overrides,
  } as SyncDeps & { writeArchive: ReturnType<typeof vi.fn> }
}

describe('syncArchive — happy path', () => {
  it('creates an archive on the first run', async () => {
    const d = deps()
    const result = await syncArchive(d)
    expect(result.status).toBe('updated')
    expect(result.added).toBe(1)
    expect(d.writeArchive).toHaveBeenCalledOnce()

    const written = JSON.parse(d.writeArchive.mock.calls[0][0] as string)
    expect(written.articles).toHaveLength(1)
    expect(written.firstSeenAt).toBe('2026-09-03')
    expect(written.source).toBe(SOURCE)
  })

  it('writes pretty-printed JSON with a trailing newline, so diffs stay readable', async () => {
    const d = deps()
    await syncArchive(d)
    const json = d.writeArchive.mock.calls[0][0] as string
    expect(json).toContain('\n  ')
    expect(json.endsWith('\n')).toBe(true)
  })

  it('reports unchanged and does not write when the feed brings nothing new', async () => {
    const existing = JSON.stringify({
      source: SOURCE,
      firstSeenAt: '2026-08-01',
      lastSyncedAt: '2026-09-02T06:00:00.000Z',
      articles: [
        {
          guid: 'https://medium.com/p/206a174a1c59',
          title: 'How I Would Design GitOps for 100+ Kubernetes Clusters',
          url: 'https://medium.com/p/206a174a1c59',
          publishedAt: '2026-09-02T09:46:00.000Z',
          topics: ['gitops'],
        },
      ],
    })
    const d = deps({ readArchive: async () => existing })
    const result = await syncArchive(d)
    expect(result.status).toBe('unchanged')
    expect(result.added).toBe(0)
    expect(d.writeArchive).not.toHaveBeenCalled()
  })
})

describe('syncArchive — failure paths must leave the archive untouched', () => {
  const existing = JSON.stringify({
    source: SOURCE,
    firstSeenAt: '2026-08-01',
    lastSyncedAt: '2026-09-02T06:00:00.000Z',
    articles: [],
  })

  it('skips when the feed is unreachable', async () => {
    const d = deps({
      readArchive: async () => existing,
      fetchFeed: async () => {
        throw new Error('ENOTFOUND medium.com')
      },
    })
    const result = await syncArchive(d)
    expect(result.status).toBe('skipped')
    expect(result.reason).toContain('ENOTFOUND')
    expect(d.writeArchive).not.toHaveBeenCalled()
  })

  it('skips when the feed returns unparseable XML', async () => {
    const d = deps({ readArchive: async () => existing, fetchFeed: async () => 'not xml <<<' })
    const result = await syncArchive(d)
    expect(result.status).toBe('skipped')
    expect(d.writeArchive).not.toHaveBeenCalled()
  })

  it('skips when the feed parses but contains no articles', async () => {
    const d = deps({
      readArchive: async () => existing,
      fetchFeed: async () => '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
    })
    expect((await syncArchive(d)).status).toBe('skipped')
    expect(d.writeArchive).not.toHaveBeenCalled()
  })

  it('skips when the existing archive is corrupt, rather than overwriting it', async () => {
    const d = deps({ readArchive: async () => '{ this is not json' })
    const result = await syncArchive(d)
    expect(result.status).toBe('skipped')
    expect(result.reason).toMatch(/archive/i)
    expect(d.writeArchive).not.toHaveBeenCalled()
  })

  it('resolves to skipped, not a rejection, when writeArchive itself throws (EACCES, ENOSPC, ...)', async () => {
    const d = deps({
      readArchive: async () => existing,
      writeArchive: vi.fn(async () => {
        throw new Error('EACCES: permission denied')
      }),
    })
    const result = await syncArchive(d)
    expect(result.status).toBe('skipped')
    expect(result.reason).toContain('EACCES')
    expect(result.added).toBe(0)
  })
})

describe('syncArchive — write failure does not mask a real result', () => {
  it('still reports unchanged (and never calls writeArchive) when a broken writeArchive is injected but the feed brings nothing new', async () => {
    const existing = JSON.stringify({
      source: SOURCE,
      firstSeenAt: '2026-08-01',
      lastSyncedAt: '2026-09-02T06:00:00.000Z',
      articles: [
        {
          guid: 'https://medium.com/p/206a174a1c59',
          title: 'How I Would Design GitOps for 100+ Kubernetes Clusters',
          url: 'https://medium.com/p/206a174a1c59',
          publishedAt: '2026-09-02T09:46:00.000Z',
          topics: ['gitops'],
        },
      ],
    })
    const writeArchive = vi.fn(async () => {
      throw new Error('MUST NOT BE CALLED')
    })
    const d = deps({ readArchive: async () => existing, writeArchive })
    const result = await syncArchive(d)
    expect(result.status).toBe('unchanged')
    expect(result.added).toBe(0)
    expect(writeArchive).not.toHaveBeenCalled()
  })

  it('still reports updated with the correct added count when writeArchive succeeds', async () => {
    const d = deps()
    const result = await syncArchive(d)
    expect(result.status).toBe('updated')
    expect(result.added).toBe(1)
    expect(d.writeArchive).toHaveBeenCalledOnce()
  })
})
