export type ProductStatus = 'shipped' | 'live' | 'wip' | 'archived'

export interface ProductLink {
  label: string
  href: string
}

export interface Product {
  slug: string
  name: string
  /** One line: what it does. */
  tagline: string
  /** The problem it solves, in the user's terms. */
  problem: string
  status: ProductStatus
  stack: string[]
  /** Rendered as a copyable command block when present. */
  install?: { label: string; command: string }
  links: ProductLink[]
  stars?: number
  /** Exactly one product carries this. Enforced by contracts.test.ts. */
  featured?: boolean
}

export interface OutcomeCard {
  title: string
  /** Short metric rendered as a chip in the card heading, e.g. "-40% deploy time". */
  metric: string
  body: string
  tools: string[]
}

export interface Guide {
  name: string
  repo: string
  description: string
  /** Length of the guide in days, where it has one. */
  days?: number
}

export interface Certification {
  name: string
  abbr: string
  issuer: string
  verifyUrl?: string
}

export interface Article {
  /** Medium's stable post id. The dedupe key — never derive it from the title. */
  guid: string
  title: string
  url: string
  /** ISO 8601, UTC. */
  publishedAt: string
  /** From RSS <category> tags. */
  topics: string[]
}

export interface ArticleArchive {
  source: string
  /** ISO date of the first sync. Caption metadata only — not the heatmap window. */
  firstSeenAt: string
  lastSyncedAt: string
  /** Append-only, sorted newest first. */
  articles: Article[]
}

export interface SocialLink {
  label: string
  href: string
}

export interface Profile {
  name: string
  monogram: string
  /** Headline renders as two lines; the second is gradient-filled. */
  headlineTop: string
  headlineBottom: string
  eyebrow: string
  location: string
  subline: string
  avatarUrl: string
  email: string
  resumePath: string
  /** Nav status chip text, or null to hide the chip. */
  availability: string | null
  socials: SocialLink[]
}

export interface Experience {
  role: string
  company: string
  location: string
  period: string
  /** ISO date the role started. Drives the computed tenure shown in the proof strip. */
  startedAt: string
  outcomes: OutcomeCard[]
}

export interface Education {
  degree: string
  institution: string
  location: string
  period: string
}

export interface Chapter {
  /** Also the section's DOM id and the anchor target. */
  id: string
  num: string
  title: string
  /** A CSS custom property reference, e.g. 'var(--accent-cyan)'. */
  accent: string
}

export interface ProofPoint {
  value: number
  /** Rendered small, after the number. */
  suffix?: string
  /** Rendered before the number, e.g. '~' or '−'. */
  prefix?: string
  decimals?: number
  /** Two short lines; rendered with a break between them. */
  label: [string, string]
}

export interface UiCopy {
  /** Hero's primary CTA — links into the work. */
  heroPrimaryCta: string
  /** Hero's secondary CTA — downloads the résumé. */
  heroSecondaryCta: string
  /** Nav's résumé download link, both desktop and mobile-menu renderings. */
  navResumeLabel: string
  /** Teaching chapter's certifications sub-heading. */
  certificationsLabel: string
  /** Teaching chapter's education sub-heading. */
  educationLabel: string
  /** Teaching chapter's footer line. `count` is the number of guides. */
  guidesSummary: (count: number) => string
  /** Command palette's search input placeholder. */
  palettePlaceholder: string
  /** Command palette's message when no command matches the query. */
  paletteEmptyState: string
  /** Command palette hint next to a chapter-jump command. */
  paletteHintChapter: string
  /** Command palette hint next to a product command. */
  paletteHintProduct: string
  /** Command palette hint next to an action command (copy email, résumé, GitHub). */
  paletteHintAction: string
  /** Command palette "copy email" command label. `email` is the address copied. */
  paletteCopyEmailLabel: (email: string) => string
  /** Command palette "download résumé" command label. */
  paletteResumeLabel: string
  /** Command palette "open GitHub profile" command label. */
  paletteGithubLabel: string
  /** Skip-navigation link, visible on keyboard focus only. */
  skipToContent: string
  /** Footer's one-line "built with" credit. */
  footerBuiltWith: string
}

export interface PipelineNode {
  name: string
  /** The real tooling behind this stage, rendered small beneath the name. */
  detail: string
}

export interface WritingCopy {
  /** Tile label above the animated post count. */
  postsTileLabel: string
  /** Word rendered beside the animated post count, e.g. "12 posts". */
  postsSuffix: string
  /** Tile label above the animated weekly cadence figure. */
  cadenceTileLabel: string
  /** Unit rendered after the animated cadence figure, e.g. "1.4/wk". */
  cadenceSuffix: string
  /** Tile label above the most-written topic. */
  topTopicTileLabel: string
  /** Shown in the topic tile when no topic survives the stoplist. */
  topTopicFallback: string
  /** Shown instead of the featured post and list when the archive is empty. */
  emptyState: string
  /** Badge on the featured card. `date` is the already-formatted publish date. */
  latestBadge: (date: string) => string
  /** Footer line naming how many articles the archive holds. */
  articlesTracked: (count: number) => string
  /** Footer link out to the author's Medium profile. */
  followOnMedium: string
  /** Heatmap caption. `weeks` is the number of weeks rendered. */
  heatmapCaption: (weeks: number) => string
  /** Heatmap status word, top-right of the caption row. */
  heatmapAutoUpdated: string
  /** Heatmap footnote. `firstSeenAt` is the archive's first-sync ISO date. */
  trackingSince: (firstSeenAt: string) => string
}

export interface ContactCopy {
  heading: string
  blurb: string
  /** Shown in place of the form when no Web3Forms key is configured. */
  fallbackBlurb: string
  nameLabel: string
  emailLabel: string
  messageLabel: string
  submitIdle: string
  submitPending: string
  successMessage: string
  errorMessage: string
  /** Form-level fallback shown alongside per-field errors when validation fails. */
  validationMessage: string
  /** Shown beneath the name field when it is left empty. */
  nameError: string
  /** Shown beneath the email field when it is empty or not a valid email shape. */
  emailError: string
  /** Shown beneath the message field when it is left empty. */
  messageError: string
}
