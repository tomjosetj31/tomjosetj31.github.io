import { XMLParser } from 'fast-xml-parser'
import type { Article } from '../content/types'

interface RawItem {
  title?: unknown
  link?: unknown
  guid?: unknown
  category?: unknown
  pubDate?: unknown
}

/** `{ '#text': '…', '@_isPermaLink': 'false' }` or a bare string, depending on attributes. */
function textOf(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#text'] ?? '')
  }
  return ''
}

function asArray(value: unknown): unknown[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

/** Medium appends `?source=rss-…` to every link. Those must not ship on the site. */
function cleanUrl(raw: string): string {
  return raw.split('?')[0]
}

/**
 * Parse a Medium RSS document into articles.
 *
 * Never throws: a malformed document yields an empty array, and individual
 * items missing a guid, link, title or parseable date are skipped. The sync
 * script depends on this — a bad feed must not break the build.
 */
export function parseFeed(xml: string): Article[] {
  let doc: unknown
  try {
    doc = new XMLParser({ ignoreAttributes: false, trimValues: true }).parse(xml)
  } catch {
    return []
  }

  const channel = (doc as { rss?: { channel?: { item?: unknown } } })?.rss?.channel
  if (!channel) return []

  const articles: Article[] = []
  for (const raw of asArray(channel.item) as RawItem[]) {
    const guid = textOf(raw.guid).trim()
    const title = textOf(raw.title).trim()
    const url = cleanUrl(textOf(raw.link).trim())
    const timestamp = Date.parse(textOf(raw.pubDate).trim())

    if (!guid || !title || !url || Number.isNaN(timestamp)) continue

    articles.push({
      guid,
      title,
      url,
      publishedAt: new Date(timestamp).toISOString(),
      topics: asArray(raw.category).map((c) => textOf(c).trim()).filter(Boolean),
    })
  }

  return articles
}
