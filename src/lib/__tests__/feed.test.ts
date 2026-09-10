import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseFeed } from '../feed'

const __dirname = dirname(fileURLToPath(import.meta.url))
const xml = readFileSync(join(__dirname, 'fixtures/medium-feed.xml'), 'utf8')

describe('parseFeed', () => {
  it('parses every well-formed item and drops the malformed one', () => {
    const articles = parseFeed(xml)
    expect(articles).toHaveLength(2)
  })

  it('reads the guid out of an element that carries attributes', () => {
    expect(parseFeed(xml)[0].guid).toBe('https://medium.com/p/206a174a1c59')
  })

  it('strips the RSS tracking parameter from the link', () => {
    const url = parseFeed(xml)[0].url
    expect(url).toBe(
      'https://medium.com/kotaicode/how-i-would-design-gitops-for-100-kubernetes-clusters-206a174a1c59',
    )
    expect(url).not.toContain('source=rss')
  })

  it('decodes CDATA titles', () => {
    expect(parseFeed(xml)[0].title).toBe('How I Would Design GitOps for 100+ Kubernetes Clusters')
  })

  it('normalises pubDate to an ISO timestamp', () => {
    expect(parseFeed(xml)[0].publishedAt).toBe('2026-09-02T09:46:00.000Z')
  })

  it('collects multiple categories as topics', () => {
    expect(parseFeed(xml)[0].topics).toEqual([
      'software-engineering',
      'cloud-computing',
      'gitops',
      'devops',
      'kubernetes',
    ])
  })

  it('handles an item with a single category, which parses as a string not an array', () => {
    expect(parseFeed(xml)[1].topics).toEqual(['ci-cd-pipeline'])
  })

  it('gives an item with no categories an empty topics array', () => {
    const single = `<?xml version="1.0"?><rss version="2.0"><channel><item>
      <title>No topics</title><link>https://medium.com/p/x</link>
      <guid isPermaLink="false">https://medium.com/p/x</guid>
      <pubDate>Wed, 02 Sep 2026 09:46:00 GMT</pubDate></item></channel></rss>`
    expect(parseFeed(single)[0].topics).toEqual([])
  })

  it('handles a channel with exactly one item, which parses as an object not an array', () => {
    const single = `<?xml version="1.0"?><rss version="2.0"><channel><item>
      <title>Only post</title><link>https://medium.com/p/solo</link>
      <guid isPermaLink="false">https://medium.com/p/solo</guid>
      <pubDate>Wed, 02 Sep 2026 09:46:00 GMT</pubDate></item></channel></rss>`
    expect(parseFeed(single)).toHaveLength(1)
  })

  it('returns an empty array for a feed with no items', () => {
    expect(parseFeed('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>')).toEqual([])
  })

  it('returns an empty array for garbage rather than throwing', () => {
    expect(parseFeed('this is not xml at all <<<>>>')).toEqual([])
    expect(parseFeed('')).toEqual([])
  })

  it('skips items whose title or guid parse as nested objects without #text', () => {
    const withNestedTitle = `<?xml version="1.0"?><rss version="2.0"><channel><item>
      <title><t>x</t></title><link>https://medium.com/p/nested</link>
      <guid isPermaLink="false">https://medium.com/p/nested</guid>
      <pubDate>Wed, 02 Sep 2026 09:46:00 GMT</pubDate></item></channel></rss>`
    const articles = parseFeed(withNestedTitle)
    expect(articles).toHaveLength(0)

    const withNestedGuid = `<?xml version="1.0"?><rss version="2.0"><channel><item>
      <title>Valid title</title><link>https://medium.com/p/nested</link>
      <guid><g>x</g></guid>
      <pubDate>Wed, 02 Sep 2026 09:46:00 GMT</pubDate></item></channel></rss>`
    const articles2 = parseFeed(withNestedGuid)
    expect(articles2).toHaveLength(0)

    // Verify no "[object Object]" appears in any field
    const allArticles = [...articles, ...articles2]
    for (const article of allArticles) {
      expect(article.title).not.toContain('[object Object]')
      expect(article.guid).not.toContain('[object Object]')
      expect(article.url).not.toContain('[object Object]')
    }
  })
})
