import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Article, ArticleArchive } from '../../../content/types'
import { Writing } from '../Writing'

const NOW = new Date('2026-09-03T06:00:00.000Z')

function article(guid: string, publishedAt: string, title: string, topics: string[]): Article {
  return { guid, title, url: `https://medium.com/p/${guid}`, publishedAt, topics }
}

const ARCHIVE: ArticleArchive = {
  source: 'https://medium.com/feed/@Tomjosetj31',
  firstSeenAt: '2026-09-03',
  lastSyncedAt: NOW.toISOString(),
  articles: [
    article('a1', '2026-09-02T09:46:00.000Z', 'How I Would Design GitOps for 100+ Clusters', ['gitops']),
    article('a2', '2026-09-01T11:01:00.000Z', 'Stop Debugging Kubernetes Manually', ['devops']),
    article('a3', '2026-08-28T10:01:00.000Z', 'GitOps Rollbacks', ['gitops']),
    article('a4', '2026-08-18T11:06:00.000Z', 'How GitOps Changes Deployment', ['gitops']),
  ],
}

const EMPTY: ArticleArchive = { ...ARCHIVE, articles: [] }

/** Titles contain regex metacharacters — "100+" would otherwise match "1000". */
function literal(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
}

describe('Writing', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Writing archive={ARCHIVE} now={NOW} />)
    expect(container.querySelector('#writing')).not.toBeNull()
  })

  it('features the newest article as a heading', () => {
    render(<Writing archive={ARCHIVE} now={NOW} />)
    expect(
      screen.getByRole('heading', { name: /How I Would Design GitOps for 100\+ Clusters/i }),
    ).toBeInTheDocument()
  })

  it('links every article to Medium', () => {
    render(<Writing archive={ARCHIVE} now={NOW} />)
    for (const item of ARCHIVE.articles) {
      expect(screen.getByRole('link', { name: literal(item.title) })).toHaveAttribute(
        'href',
        item.url,
      )
    }
  })

  it('shows the post count and the derived cadence', () => {
    render(<Writing archive={ARCHIVE} now={NOW} />)
    // Exact strings: the heatmap caption also contains the words "posts" and
    // "Publishing cadence", so a loose regex would match several elements.
    expect(screen.getByText('posts')).toBeInTheDocument()
    expect(screen.getByText('Publishing cadence')).toBeInTheDocument()
  })

  it('shows the most-written topic with generic tags excluded', () => {
    render(<Writing archive={ARCHIVE} now={NOW} />)
    // devops is stop-listed; gitops appears three times. Asserted via the tile
    // itself, since 'gitops' also renders as a tag on several article rows.
    expect(screen.getByTestId('top-topic')).toHaveTextContent('gitops')
  })

  it('links out to the Medium profile', () => {
    render(<Writing archive={ARCHIVE} now={NOW} />)
    expect(screen.getByRole('link', { name: /follow on medium/i })).toHaveAttribute(
      'href',
      'https://medium.com/@Tomjosetj31',
    )
  })

  it('renders a graceful empty state rather than crashing on an empty archive', () => {
    render(<Writing archive={EMPTY} now={NOW} />)
    expect(screen.getByRole('heading', { name: /writing/i })).toBeInTheDocument()
    expect(screen.getByText(/no articles yet/i)).toBeInTheDocument()
  })
})
