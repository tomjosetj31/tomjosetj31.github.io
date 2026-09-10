import type { WritingCopy } from './types'

export const MEDIUM_FEED_URL = 'https://medium.com/feed/@Tomjosetj31'
export const MEDIUM_PROFILE_URL = 'https://medium.com/@Tomjosetj31'

export const TOPIC_STOPLIST = [
  'software-engineering',
  'programming',
  'cloud-computing',
  'technology',
  'devops',
]

export const writingCopy: WritingCopy = {
  postsTileLabel: 'Tracked to date',
  postsSuffix: 'posts',
  cadenceTileLabel: 'Publishing cadence',
  cadenceSuffix: '/wk',
  topTopicTileLabel: 'Most-written topic',
  topTopicFallback: '—',
  emptyState: 'No articles yet — the feed sync will populate this on the next build.',
  latestBadge: (date) => `Latest · ${date}`,
  articlesTracked: (count) => `${count} articles tracked`,
  followOnMedium: 'Follow on Medium ↗',
  heatmapCaption: (weeks) => `Publishing cadence — last ${weeks} weeks`,
  heatmapAutoUpdated: 'Auto-updated daily',
  trackingSince: (firstSeenAt) =>
    `Tracking since ${firstSeenAt}. Medium's feed exposes only the latest ten posts, so history deepens from the first build onward.`,
}
