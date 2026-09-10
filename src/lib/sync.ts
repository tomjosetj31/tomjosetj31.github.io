import type { Article, ArticleArchive } from '../content/types'
import { createEmptyArchive, mergeArchive } from './articles'
import { parseFeed } from './feed'

export interface SyncDeps {
  fetchFeed: () => Promise<string>
  /** Returns the raw archive JSON, or null when no archive exists yet. */
  readArchive: () => Promise<string | null>
  writeArchive: (json: string) => Promise<void>
  now: Date
  source: string
}

export interface SyncResult {
  status: 'updated' | 'unchanged' | 'skipped'
  reason?: string
  added: number
}

/**
 * Merge the live feed into the archive.
 *
 * Every failure returns `skipped` and writes nothing. A Medium outage must
 * never break a deploy or blank the writing chapter — the build then renders
 * from the last good archive.
 *
 * Pure aside from the injected `deps`: no top-level I/O, so this module is
 * safe to import from tests without touching the network or filesystem.
 */
export async function syncArchive(deps: SyncDeps): Promise<SyncResult> {
  let existing: ArticleArchive
  try {
    const raw = await deps.readArchive()
    existing = raw === null ? createEmptyArchive(deps.source, deps.now) : (JSON.parse(raw) as ArticleArchive)
    if (!Array.isArray(existing.articles)) throw new Error('archive has no articles array')
  } catch (error) {
    return { status: 'skipped', reason: `existing archive unreadable: ${String(error)}`, added: 0 }
  }

  let incoming: Article[]
  try {
    incoming = parseFeed(await deps.fetchFeed())
  } catch (error) {
    return { status: 'skipped', reason: String(error), added: 0 }
  }

  if (incoming.length === 0) {
    return { status: 'skipped', reason: 'feed produced no articles', added: 0 }
  }

  const known = new Set(existing.articles.map((a) => a.guid))
  const added = incoming.filter((a) => !known.has(a.guid)).length
  const merged = mergeArchive(existing, incoming, deps.now)

  // Compare articles only — lastSyncedAt always differs, and a no-op sync
  // should not produce a commit.
  if (JSON.stringify(merged.articles) === JSON.stringify(existing.articles)) {
    return { status: 'unchanged', added: 0 }
  }

  try {
    await deps.writeArchive(`${JSON.stringify(merged, null, 2)}\n`)
  } catch (error) {
    return { status: 'skipped', reason: `failed to write archive: ${String(error)}`, added: 0 }
  }

  return { status: 'updated', added }
}
