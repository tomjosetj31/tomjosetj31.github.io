import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { syncArchive } from '../src/lib/sync'
import { MEDIUM_FEED_URL } from '../src/content/writing'

const ARCHIVE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'content',
  'articles.archive.json',
)

async function main(): Promise<void> {
  try {
    const result = await syncArchive({
      source: MEDIUM_FEED_URL,
      now: new Date(),
      fetchFeed: async () => {
        const response = await fetch(MEDIUM_FEED_URL, {
          headers: { accept: 'application/rss+xml, application/xml, text/xml' },
          signal: AbortSignal.timeout(20_000),
        })
        if (!response.ok) throw new Error(`feed returned HTTP ${response.status}`)
        return response.text()
      },
      readArchive: async () => {
        try {
          return await readFile(ARCHIVE_PATH, 'utf8')
        } catch {
          return null
        }
      },
      writeArchive: async (json) => writeFile(ARCHIVE_PATH, json, 'utf8'),
    })

    // Consumed by the deploy workflow to decide whether to commit.
    console.log(`sync-medium: ${result.status}${result.added ? ` (+${result.added})` : ''}`)
    if (result.reason) console.warn(`sync-medium: ${result.reason}`)
  } catch (error) {
    // Belt and braces: syncArchive already guards its own failure paths, but
    // nothing here may ever let a rejection escape uncaught — that would
    // exit non-zero and, since this runs as `prebuild`, fail the deploy.
    console.warn(`sync-medium: unexpected error, skipping: ${String(error)}`)
  }

  // Always succeed. A feed or filesystem problem must not fail the build.
  process.exit(0)
}

// No main-module guard: this runner is never imported by anything (tests
// import `syncArchive` from `src/lib/sync` instead), so calling `main()`
// unconditionally is safe — and, unlike a `import.meta.url` guard, it
// actually runs under `vite-node`.
void main().catch((error: unknown) => {
  console.warn(`sync-medium: unexpected error, skipping: ${String(error)}`)
  process.exit(0)
})
