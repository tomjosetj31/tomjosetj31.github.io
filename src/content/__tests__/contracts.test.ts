import { describe, expect, it } from 'vitest'
import { products } from '../products'
import { profile } from '../profile'
import { experience, education } from '../experience'
import { guides } from '../guides'
import { certifications } from '../certifications'
import { buildProofPoints } from '../proof'
import { MEDIUM_FEED_URL, MEDIUM_PROFILE_URL, TOPIC_STOPLIST } from '../writing'
import { uiCopy } from '../ui'

describe('products', () => {
  it('has at least one product', () => {
    expect(products.length).toBeGreaterThan(0)
  })

  it('marks exactly one product as featured', () => {
    expect(products.filter((p) => p.featured === true)).toHaveLength(1)
  })

  it('gives every product the required fields', () => {
    for (const p of products) {
      expect(p.slug, 'slug').toMatch(/^[a-z0-9-]+$/)
      expect(p.name.length, `${p.slug} name`).toBeGreaterThan(0)
      expect(p.tagline.length, `${p.slug} tagline`).toBeGreaterThan(0)
      expect(p.problem.length, `${p.slug} problem`).toBeGreaterThan(0)
      expect(p.stack.length, `${p.slug} stack`).toBeGreaterThan(0)
      expect(p.links.length, `${p.slug} links`).toBeGreaterThan(0)
    }
  })

  it('uses unique slugs', () => {
    const slugs = products.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('gives every link an absolute https href and a label', () => {
    for (const p of products) {
      for (const l of p.links) {
        expect(l.label.length, `${p.slug} link label`).toBeGreaterThan(0)
        expect(l.href, `${p.slug} -> ${l.label}`).toMatch(/^https:\/\//)
      }
    }
  })
})

describe('profile', () => {
  it('has both headline halves, since the design renders them on separate lines', () => {
    expect(profile.headlineTop.length).toBeGreaterThan(0)
    expect(profile.headlineBottom.length).toBeGreaterThan(0)
  })

  it('has a résumé path rooted at the site root', () => {
    expect(profile.resumePath).toMatch(/^\/.+\.pdf$/)
  })

  it('has a plausible email', () => {
    expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })

  it('has at least three socials', () => {
    expect(profile.socials.length).toBeGreaterThanOrEqual(3)
    for (const s of profile.socials) {
      expect(s.href).toMatch(/^https:\/\//)
    }
  })
})

describe('experience', () => {
  it('has four outcome cards, one per section of the infrastructure chapter', () => {
    expect(experience.outcomes).toHaveLength(4)
  })

  it('gives every outcome card a metric and at least one tool', () => {
    for (const o of experience.outcomes) {
      expect(o.metric.length, `${o.title} metric`).toBeGreaterThan(0)
      expect(o.tools.length, `${o.title} tools`).toBeGreaterThan(0)
    }
  })

  it('records education', () => {
    expect(education.degree.length).toBeGreaterThan(0)
    expect(education.institution.length).toBeGreaterThan(0)
  })
})

describe('guides', () => {
  it('lists the learn-* series', () => {
    expect(guides.length).toBeGreaterThanOrEqual(9)
  })

  it('points every guide at a github repo', () => {
    for (const g of guides) {
      expect(g.repo, g.name).toMatch(/^https:\/\/github\.com\//)
    }
  })
})

describe('certifications', () => {
  it('lists CKA, CKAD and the AWS certification', () => {
    const abbrs = certifications.map((c) => c.abbr)
    expect(abbrs).toContain('CKA')
    expect(abbrs).toContain('CKAD')
    expect(certifications).toHaveLength(3)
  })
})

describe('writing config', () => {
  it('points at the medium feed', () => {
    expect(MEDIUM_FEED_URL).toBe('https://medium.com/feed/@Tomjosetj31')
    expect(MEDIUM_PROFILE_URL).toMatch(/^https:\/\/medium\.com\/@/)
  })

  it('stop-lists the generic tags so the top topic is informative', () => {
    expect(TOPIC_STOPLIST).toContain('software-engineering')
  })
})

describe('ui copy', () => {
  it('gives every field a non-empty string, or a template function that produces one', () => {
    for (const [key, value] of Object.entries(uiCopy)) {
      if (typeof value === 'function') {
        const rendered = value(9)
        expect(typeof rendered, key).toBe('string')
        expect(rendered.length, key).toBeGreaterThan(0)
        continue
      }
      expect(typeof value, key).toBe('string')
      expect(value.length, key).toBeGreaterThan(0)
    }
  })

  it('renders the guide-count summary from the live count, never a baked-in number', () => {
    expect(uiCopy.guidesSummary(9)).toBe('9 structured guides · open source on GitHub')
    expect(uiCopy.guidesSummary(3)).toBe('3 structured guides · open source on GitHub')
  })
})

describe('proof strip', () => {
  it('derives the certification count from the live certifications list, never a baked-in number', () => {
    const points = buildProofPoints(new Date('2026-01-01'))
    const certPoint = points.find((p) => p.label[0] === 'CKA · CKAD')
    expect(certPoint?.value).toBe(certifications.length)
  })

  it('computes the tenure figure rather than baking in a constant', () => {
    // Straddle the role's May-1 anniversary a few years apart: the day before it lands
    // one year behind the day after, proving the value is computed from `now`, not fixed.
    const justBefore = buildProofPoints(new Date('2024-04-30'))
    const justAfter = buildProofPoints(new Date('2024-05-02'))

    const tenureBefore = justBefore.find((p) => p.suffix === 'yrs')?.value
    const tenureAfter = justAfter.find((p) => p.suffix === 'yrs')?.value

    expect(tenureBefore).toBeDefined()
    expect(tenureAfter).toBeDefined()
    expect(tenureAfter).toBe((tenureBefore as number) + 1)
  })

  it('keeps the ~40%/~30% headline figures in lockstep with the matching outcome metrics', () => {
    const points = buildProofPoints(new Date('2026-01-01'))
    const deployPoint = points.find((p) => p.label[1] === 'deploys')
    const awsPoint = points.find((p) => p.label[0] === 'Lower AWS')

    const deployOutcome = experience.outcomes.find((o) => o.title === 'Delivery')
    const awsOutcome = experience.outcomes.find((o) => o.title === 'Cost')

    const deployMetricValue = Number(deployOutcome?.metric.match(/(\d+)%/)?.[1])
    const awsMetricValue = Number(awsOutcome?.metric.match(/(\d+)%/)?.[1])

    expect(deployPoint?.value).toBe(deployMetricValue)
    expect(awsPoint?.value).toBe(awsMetricValue)
  })
})
