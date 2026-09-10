import raw from '../content/articles.archive.json'
import type { ArticleArchive } from '../content/types'

/** The single typed entry point to the machine-written archive. */
export const archive = raw as ArticleArchive
