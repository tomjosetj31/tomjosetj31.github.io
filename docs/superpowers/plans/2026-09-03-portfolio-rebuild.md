# Aurora Glass Portfolio Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Create React App template portfolio with a dual-identity site — platform operator and product builder — whose writing chapter feeds itself from Medium every morning without manual maintenance.

**Architecture:** A single-page Vite + React + TypeScript site. All copy lives in typed modules under `src/content/`; components read from it and hold no copy of their own. Article data is accrued into an append-only JSON archive by a pre-build Node script, and every derived value (cadence, heatmap) is computed at render time from that archive by pure functions in `src/lib/`. Deployed to GitHub Pages as a root user site, rebuilt daily by a scheduled workflow.

**Tech Stack:** Vite 6, React 19, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/vite`), Motion 12 (`motion/react`), Vitest + React Testing Library + jsdom, `fast-xml-parser` (build-time only), `@fontsource-variable/*` self-hosted fonts.

**Spec:** `docs/superpowers/specs/2026-09-03-portfolio-rebuild-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Node 20+.** Vite 6 and the sync script both assume it.
- **Work on branch `redesign/aurora-glass`.** Merge to the default branch in one piece; the live site must never show a half-built page.
- **Vite `base: '/'`.** The site is a root user site, not a project subpath.
- **No external font or CSS requests.** Fonts are self-hosted npm packages. No Google Fonts, no CDN stylesheets. (Faster, and cleaner under GDPR given a German employer.)
- **All copy lives in `src/content/`.** Never inline a user-visible string in a component. The only exception is `aria-label`/`alt` text tied to a specific control.
- **Every animation is gated on `prefers-reduced-motion: reduce`.** No exceptions, including the CSS aurora drift.
- **Every text-bearing glass panel carries an opaque scrim beneath its blur** so contrast holds at WCAG AA regardless of what drifts behind it. Implemented once in the `.glass` class; never bypass it.
- **`src/content/articles.archive.json` is machine-written.** Never hand-edit it, never author it in a task other than Task 6.
- **The sync script must exit 0 on every failure path.** A Medium outage must not break a deploy.
- **Exactly one product carries `featured: true`.** Enforced by a test.
- **No percentage skill meters.** Grouped tool tags only.
- **Design tokens are CSS custom properties in `src/styles/tokens.css`** — the single source of truth, shared by Tailwind utilities and inline SVG.

### Token values (copy verbatim)

| Token | Value |
|---|---|
| `--aurora-violet` | `#7c3aed` |
| `--aurora-cyan` | `#22d3ee` |
| `--aurora-magenta` | `#e879f9` |
| `--accent-teal` | `#2dd4bf` |
| `--accent-indigo` | `#818cf8` |
| `--status-green` | `#4ade80` |
| `--bg` | `#05060f` |
| `--glass-bg` | `rgba(255, 255, 255, 0.048)` |
| `--glass-border` | `rgba(255, 255, 255, 0.115)` |
| `--glass-blur` | `14px` |
| `--text` | `#f4f6ff` |
| `--text-2` | `rgba(244, 246, 255, 0.60)` |
| `--text-3` | `rgba(244, 246, 255, 0.38)` |

---

## File Structure

Files that change together live together. Sections own their layout; primitives own their appearance; `lib/` owns all logic and is the only place with tests worth more than a smoke check.

| Path | Responsibility |
|---|---|
| `scripts/sync-medium.ts` | Fetch feed, merge archive, write file. Only I/O in the article path. |
| `src/content/types.ts` | Every content interface. No logic. |
| `src/content/profile.ts` | Name, headline, eyebrows, location, avatar, socials, résumé path. |
| `src/content/products.ts` | Product list. The file Tom edits most. |
| `src/content/experience.ts` | Kotaicode role + outcome cards + education. |
| `src/content/guides.ts` | The `learn-*` series. |
| `src/content/certifications.ts` | CKA / CKAD / AWS. |
| `src/content/writing.ts` | Feed URL, profile URL, topic stop-list. |
| `src/content/articles.archive.json` | Machine-written article archive. |
| `src/lib/articles.ts` | Pure: merge, dedupe, cadence + heatmap derivation. Shared by script and app. |
| `src/lib/feed.ts` | Pure: RSS XML → `Article[]`. Imported only by the script. |
| `src/hooks/useReducedMotion.ts` | Single source of motion gating. |
| `src/hooks/useCursorGlow.ts` | Cursor-tracked radial highlight for glass panels. |
| `src/components/ui/*` | `GlassPanel`, `MonoLabel`, `Tag`, `StatusChip`, `CountUp`, `CopyableCommand`. |
| `src/components/layout/*` | `AuroraField`, `Grain`, `Nav`, `Footer`. |
| `src/components/sections/*` | One file per chapter. Composes primitives, reads content. |
| `src/components/diagrams/*` | `PipelineDiagram`, `CadenceHeatmap`. |
| `src/components/palette/CommandPalette.tsx` | ⌘K. |
| `src/styles/tokens.css` | Tokens only. |
| `src/styles/index.css` | Tailwind import, base, and the semantic component classes. |
| `public/personal-portfolio/index.html` | Redirect stub for the old URL. |
| `.github/workflows/deploy.yml` | Build + deploy + daily article sync. |

**Why `feed.ts` is separate from `articles.ts`:** `parseFeed` needs `fast-xml-parser`, which must never reach the browser bundle. Keeping it in its own module that only the script imports means tree-shaking guarantees that, rather than relying on it.

---

## Task 1: Scaffold the project and strip the legacy stack

**Files:**
- Modify: `package.json` (full rewrite)
- Create: `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `vitest.setup.ts`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/index.css`
- Create: `src/lib/__tests__/smoke.test.ts`
- Delete: `server.js`, `src/App.css`, `src/index.css`, `src/index.js`, `src/App.js`, `src/App.test.js`, `src/setupTests.js`, `src/reportWebVitals.js`, `src/logo.svg`, `src/components/` (all 10 files), `src/assets/img/` (all), `src/assets/font/`, `public/index.html`, `public/manifest.json`, `package-lock.json`
- Keep: `src/assets/resume/` (replaced in Task 17), `.gitignore`, `README.md`, `public/robots.txt`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run build`, `npm run test`, `npm run typecheck`; the `.glass`, `.lbl`, `.tag`, `.chapter-*`, `.btn-primary`, `.btn-glass`, `.metric-chip`, `.status-chip` CSS classes every later task uses; tokens on `:root`.

- [ ] **Step 1: Delete the legacy CRA files**

```bash
cd /Users/tom/tomjosetj31/personal-portfolio
git rm -r --quiet server.js src/App.css src/index.css src/index.js src/App.js \
  src/App.test.js src/setupTests.js src/reportWebVitals.js src/logo.svg \
  src/components src/assets/img src/assets/font public/index.html \
  public/manifest.json package-lock.json
```

- [ ] **Step 2: Write the new `package.json`**

```json
{
  "name": "tomjosetj31.github.io",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "homepage": "https://tomjosetj31.github.io",
  "scripts": {
    "dev": "vite",
    "sync:medium": "vite-node scripts/sync-medium.ts",
    "prebuild": "npm run sync:medium",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fontsource-variable/inter": "^5.1.0",
    "@fontsource-variable/jetbrains-mono": "^5.1.0",
    "motion": "^12.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "fast-xml-parser": "^4.5.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-node": "^2.1.0",
    "vitest": "^2.1.0"
  }
}
```

Note the font packages: this plan specifies **Inter + JetBrains Mono**, the spec's documented fallback stack, because they are certain to resolve. Step 3 attempts the preferred Geist pair and keeps it only if it installs.

- [ ] **Step 3: Install, and try to upgrade to Geist**

```bash
npm install
npm install @fontsource-variable/geist @fontsource-variable/geist-mono 2>/dev/null \
  && echo "GEIST AVAILABLE — use geist in Step 6" \
  || echo "GEIST UNAVAILABLE — keep Inter + JetBrains Mono in Step 6"
```

Expected: either message is a valid outcome. Record which one you got; Step 6 branches on it. Do not fail the task if Geist is unavailable — the spec names Inter/JetBrains Mono as the sanctioned fallback.

- [ ] **Step 4: Write `tsconfig.json` and `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "composite": true
  },
  "include": ["vite.config.ts", "scripts"]
}
```

- [ ] **Step 5: Write `vite.config.ts` and `index.html`**

`vite.config.ts` — note `base: '/'` per Global Constraints, and jsdom for component tests:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tom Jose — DevOps &amp; Product Engineer</title>
    <meta
      name="description"
      content="DevOps engineer at Kotaicode. Five years building cloud-native platforms on AWS and Kubernetes — and the CLI tools, operators and Slack apps that run on them."
    />
    <meta name="theme-color" content="#05060f" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:title" content="Tom Jose — DevOps &amp; Product Engineer" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://tomjosetj31.github.io" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write `src/styles/tokens.css`**

Values are copied verbatim from Global Constraints. If Step 3 reported GEIST AVAILABLE, change the two `--font-*` values to `'Geist Variable'` and `'Geist Mono Variable'` and import those packages in Step 7 instead.

```css
:root {
  /* aurora */
  --aurora-violet: #7c3aed;
  --aurora-cyan: #22d3ee;
  --aurora-magenta: #e879f9;

  /* chapter accents */
  --accent-cyan: #22d3ee;
  --accent-violet: #a78bfa;
  --accent-teal: #2dd4bf;
  --accent-indigo: #818cf8;
  --status-green: #4ade80;

  /* surfaces */
  --bg: #05060f;
  --glass-bg: rgba(255, 255, 255, 0.048);
  --glass-border: rgba(255, 255, 255, 0.115);
  --glass-blur: 14px;
  --glass-scrim: rgba(5, 6, 15, 0.55);

  /* text */
  --text: #f4f6ff;
  --text-2: rgba(244, 246, 255, 0.6);
  --text-3: rgba(244, 246, 255, 0.38);

  /* type */
  --font-sans: 'Inter Variable', 'Helvetica Neue', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, 'SF Mono', Menlo, monospace;

  /* layout */
  --measure: 900px;
}
```

- [ ] **Step 7: Write `src/styles/index.css`**

The `.glass` rule is the AA contrast guarantee from Global Constraints — the `::before` scrim sits between the blurred aurora and the content. Do not remove it or set it transparent.

```css
@import 'tailwindcss';
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';
@import './tokens.css';

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: 2px solid var(--accent-cyan);
    outline-offset: 3px;
    border-radius: 4px;
  }
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* Opaque scrim under the blur guarantees AA contrast over any aurora bloom. */
  .glass {
    position: relative;
    isolation: isolate;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    backdrop-filter: blur(var(--glass-blur));
  }
  .glass::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: var(--glass-scrim);
  }

  .lbl {
    font-family: var(--font-mono);
    font-size: 9.5px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.19em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .tag {
    font-family: var(--font-mono);
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0.07em;
    color: var(--text-2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.045);
    padding: 4.5px 6px;
    border-radius: 5px;
  }

  .metric-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    padding: 4px 6px;
    border-radius: 5px;
    color: var(--chip, var(--accent-cyan));
    border: 1px solid color-mix(in srgb, var(--chip, var(--accent-cyan)) 30%, transparent);
    background: color-mix(in srgb, var(--chip, var(--accent-cyan)) 9%, transparent);
  }

  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--status-green);
    border: 1px solid color-mix(in srgb, var(--status-green) 28%, transparent);
    background: color-mix(in srgb, var(--status-green) 8%, transparent);
    padding: 5px 9px;
    border-radius: 999px;
  }

  .chapter {
    display: flex;
    align-items: center;
    gap: 13px;
    margin: 52px 0 22px;
  }
  .chapter-num {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--accent, var(--accent-cyan));
  }
  .chapter-title {
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.028em;
  }
  .chapter-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--accent, var(--accent-cyan)) 50%, transparent),
      transparent
    );
  }

  .btn-primary {
    font-weight: 600;
    font-size: 12.5px;
    color: #05060f;
    background: linear-gradient(96deg, #e9d5ff, #a5f3fc);
    padding: 11px 17px;
    border-radius: 9px;
    box-shadow: 0 6px 22px rgba(124, 58, 237, 0.3);
  }
  .btn-glass {
    font-weight: 600;
    font-size: 12.5px;
    color: var(--text);
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    padding: 11px 17px;
    border-radius: 9px;
  }

  .shell {
    max-width: var(--measure);
    margin: 0 auto;
    padding: 0 30px;
  }
}
```

- [ ] **Step 8: Write `vitest.setup.ts`, `src/main.tsx` and a placeholder `src/App.tsx`**

`vitest.setup.ts` — the `matchMedia` stub is required because jsdom does not implement it and `useReducedMotion` calls it:

```ts
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` — replaced in Task 17:

```tsx
export function App() {
  return <main className="shell">Scaffold OK</main>
}
```

- [ ] **Step 9: Write the smoke test**

`src/lib/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('toolchain', () => {
  it('runs typescript tests', () => {
    const doubled: number[] = [1, 2, 3].map((n) => n * 2)
    expect(doubled).toEqual([2, 4, 6])
  })
})
```

- [ ] **Step 10: Verify the toolchain**

```bash
npm run typecheck && npm run test && npm run build -- --mode development
```

Expected: typecheck clean, one passing test, and a `dist/` directory. `--mode development` is used here only because `prebuild` runs the sync script, which does not exist until Task 6 — if `npm run build` fails on the missing script, run `npx vite build` directly to verify instead.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: replace CRA scaffold with Vite + React 19 + TS + Tailwind v4

Strips bootstrap, animate.css, react-on-screen, three carousel libraries,
mailchimp, nodemailer, express and the dead localhost contact server.
Adds the design tokens and the semantic component classes every section
depends on, including the .glass scrim that guarantees AA contrast over
the aurora field."
```

---

## Task 2: Content types and content modules

**Files:**
- Create: `src/content/types.ts`, `src/content/profile.ts`, `src/content/products.ts`, `src/content/experience.ts`, `src/content/guides.ts`, `src/content/certifications.ts`, `src/content/writing.ts`
- Test: `src/content/__tests__/contracts.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: every type and content export the rest of the plan reads. Exact names below — later tasks import these verbatim.
  - `types.ts`: `ProductStatus`, `ProductLink`, `Product`, `OutcomeCard`, `Guide`, `Certification`, `Article`, `ArticleArchive`, `SocialLink`, `Profile`, `Experience`, `Education`
  - `profile.ts`: `profile: Profile`
  - `products.ts`: `products: Product[]`
  - `experience.ts`: `experience: Experience`, `education: Education`
  - `guides.ts`: `guides: Guide[]`
  - `certifications.ts`: `certifications: Certification[]`
  - `writing.ts`: `MEDIUM_FEED_URL: string`, `MEDIUM_PROFILE_URL: string`, `TOPIC_STOPLIST: string[]`

- [ ] **Step 1: Write the failing contract test**

These tests exist because `products.ts` is the file Tom edits by hand most often, and a malformed edit should fail CI rather than render a broken card.

`src/content/__tests__/contracts.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { products } from '../products'
import { profile } from '../profile'
import { experience, education } from '../experience'
import { guides } from '../guides'
import { certifications } from '../certifications'
import { MEDIUM_FEED_URL, MEDIUM_PROFILE_URL, TOPIC_STOPLIST } from '../writing'

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/__tests__/contracts.test.ts`
Expected: FAIL — `Failed to resolve import "../products"`.

- [ ] **Step 3: Write `src/content/types.ts`**

```ts
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
  outcomes: OutcomeCard[]
}

export interface Education {
  degree: string
  institution: string
  location: string
  period: string
}
```

- [ ] **Step 4: Write `src/content/profile.ts`**

Copy is final — it was chosen during design. Do not reword.

```ts
import type { Profile } from './types'

export const profile: Profile = {
  name: 'Tom Jose',
  monogram: 'TJ',
  headlineTop: 'I run the platform.',
  headlineBottom: 'I build the product.',
  eyebrow: 'DevOps Engineer · Kotaicode GmbH',
  location: 'Kerala, India — remote for Frankfurt · IST',
  subline:
    "Five years building the systems other people's software runs on — and the software that runs on them. AWS, Kubernetes and GitOps by day; CLI tools, operators and Slack apps the rest of the time.",
  avatarUrl: 'https://avatars.githubusercontent.com/u/60109661?v=4',
  email: 'tomjosethomastj31@gmail.com',
  resumePath: '/Tom-Jose-DevOps-Engineer.pdf',
  availability: 'Open to roles',
  socials: [
    { label: 'GitHub', href: 'https://github.com/tomjosetj31' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tomjosetj31/' },
    { label: 'Medium', href: 'https://medium.com/@Tomjosetj31' },
  ],
}
```

- [ ] **Step 5: Write `src/content/products.ts`**

This is the seed set. Tom's fuller product list is an open item in the spec and drops in here as a plain array edit — no component changes.

```ts
import type { Product } from './types'

export const products: Product[] = [
  {
    slug: 'spaceload',
    name: 'spaceload',
    tagline:
      'A macOS CLI that records and replays your entire dev environment — browser tabs, VPN, IDE, terminals.',
    problem:
      'Context-switching costs you twenty minutes of setup every time. `spaceload run` gets it back.',
    status: 'shipped',
    stack: ['Python 3.11', 'CLI', 'Homebrew tap', 'MIT'],
    install: {
      label: 'Install',
      command: 'brew install tomjosetj31/spaceload/spaceload',
    },
    links: [
      { label: 'Repo', href: 'https://github.com/tomjosetj31/spaceload' },
      { label: 'PyPI', href: 'https://pypi.org/project/spaceload/' },
    ],
    stars: 3,
    featured: true,
  },
  {
    slug: 'k8s-resource-booking-operator',
    name: 'K8s Resource Booking Operator',
    tagline:
      'A custom Kubernetes operator that schedules cloud instances against time-bound bookings.',
    problem:
      'Idle dev clusters burn money overnight. Tag it, book it, and the operator starts and stops it — without double-booking.',
    status: 'live',
    stack: ['Golang', 'Kubernetes CRDs', 'Kubernetes API'],
    links: [
      { label: 'Write-up', href: 'https://kotaico.de/resource-booking-operator/' },
    ],
  },
  {
    slug: 'cronochat',
    name: 'Cronochat',
    tagline:
      'A Slack app for scheduled, recurring, broadcast and anonymous messages.',
    problem:
      'Team announcements get forgotten or repeated by hand. Cronochat schedules them once and keeps information flowing.',
    status: 'shipped',
    stack: ['Slack API', 'Python', 'Scheduling'],
    links: [
      {
        label: 'Introduction',
        href: 'https://medium.com/@Tomjosetj31/introducing-cronochat-supercharge-your-slack-with-recurring-scheduled-broadcast-and-anonymous-107a2dfa25a8',
      },
    ],
  },
]
```

- [ ] **Step 6: Write `src/content/experience.ts`**

The four outcome cards are the spec's restructuring of eight undifferentiated résumé bullets. Metrics belong in `metric`, not buried in `body`.

```ts
import type { Education, Experience } from './types'

export const experience: Experience = {
  role: 'DevOps Engineer',
  company: 'Kotaicode GmbH',
  location: 'Frankfurt, Germany',
  period: '05/2021 — present',
  outcomes: [
    {
      title: 'Delivery',
      metric: '−40% deploy time',
      body: 'Built and maintained the CI/CD pipelines behind multi-environment releases, with automated testing gates on every merge.',
      tools: ['GitHub Actions', 'GitLab CI', 'Helm'],
    },
    {
      title: 'Cost',
      metric: '−30% AWS spend',
      body: 'Cost Explorer analysis plus dynamic node provisioning with Karpenter — right-sizing capacity to actual demand.',
      tools: ['Karpenter', 'Cost Explorer', 'EKS'],
    },
    {
      title: 'Reliability',
      metric: 'faster MTTR',
      body: 'Metrics, dashboards and log aggregation with alerting that catches regressions before customers report them.',
      tools: ['Prometheus', 'Grafana', 'Loki'],
    },
    {
      title: 'Provisioning',
      metric: 'GitOps',
      body: 'Infrastructure lifecycle as code and declarative deployments — reproducible environments and reliable rollbacks.',
      tools: ['Terraform', 'Crossplane', 'ArgoCD'],
    },
  ],
}

export const education: Education = {
  degree: 'Bachelor of Technology',
  institution: 'Govt. Engineering College Palakkad',
  location: 'Palakkad, India',
  period: '08/2016 — 09/2020',
}
```

- [ ] **Step 7: Write `src/content/guides.ts`, `certifications.ts` and `writing.ts`**

`guides.ts`:

```ts
import type { Guide } from './types'

export const guides: Guide[] = [
  {
    name: 'learn-kubernetes',
    repo: 'https://github.com/tomjosetj31/learn-kubernetes',
    description: 'From zero to hero with hands-on examples, diagrams and best practices.',
    days: 14,
  },
  {
    name: 'learn-ansible',
    repo: 'https://github.com/tomjosetj31/learn-ansible',
    description: 'Beginner to production-ready playbooks with real-world examples.',
    days: 8,
  },
  {
    name: 'learn-docker',
    repo: 'https://github.com/tomjosetj31/learn-docker',
    description:
      'Containerization fundamentals through images, storage, networking, Compose, security and CI/CD.',
    days: 7,
  },
  {
    name: 'learn-terraform',
    repo: 'https://github.com/tomjosetj31/learn-terraform',
    description: 'Commands, modules, state management and workspaces from scratch.',
  },
  {
    name: 'learn-argocd',
    repo: 'https://github.com/tomjosetj31/learn-argocd',
    description: 'Mastering ArgoCD and GitOps with hands-on examples and diagrams.',
    days: 10,
  },
  {
    name: 'learn-jenkins',
    repo: 'https://github.com/tomjosetj31/learn-jenkins',
    description: 'Pipelines, agents and CI patterns with Jenkins.',
  },
  {
    name: 'learn-elk-stack',
    repo: 'https://github.com/tomjosetj31/learn-elk-stack',
    description: 'Elasticsearch, Logstash and Kibana for centralised logging.',
  },
  {
    name: 'learn-linux',
    repo: 'https://github.com/tomjosetj31/learn-linux',
    description: 'The Linux fundamentals every platform engineer leans on daily.',
  },
  {
    name: 'kubernetes-CKAD',
    repo: 'https://github.com/tomjosetj31/kubernetes-CKAD',
    description: 'Exercises and notes for the CKAD exam.',
  },
]
```

`certifications.ts` — `verifyUrl` is an open item in the spec; badges render unlinked until Tom supplies the URLs, which is why the field is optional:

```ts
import type { Certification } from './types'

export const certifications: Certification[] = [
  {
    name: 'Certified Kubernetes Administrator',
    abbr: 'CKA',
    issuer: 'CNCF',
  },
  {
    name: 'Certified Kubernetes Application Developer',
    abbr: 'CKAD',
    issuer: 'CNCF',
  },
  {
    name: 'AWS Certified Cloud Practitioner',
    abbr: 'AWS CCP',
    issuer: 'Amazon Web Services',
  },
]
```

`writing.ts` — the stop-list exists because `software-engineering` and `devops` appear on nearly every post and would always win "top topic", making the tile uninformative:

```ts
export const MEDIUM_FEED_URL = 'https://medium.com/feed/@Tomjosetj31'
export const MEDIUM_PROFILE_URL = 'https://medium.com/@Tomjosetj31'

export const TOPIC_STOPLIST = [
  'software-engineering',
  'programming',
  'cloud-computing',
  'technology',
  'devops',
]
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/content/__tests__/contracts.test.ts && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add src/content
git commit -m "feat: add typed content modules for every section

All user-visible copy now lives in src/content/ rather than inline in
components, so adding a product is a one-file edit. Contract tests guard
the hand-edited files: exactly one featured product, unique slugs, https
links, four outcome cards."
```

---

## Task 3: Article archive merge

**Files:**
- Create: `src/lib/articles.ts`
- Test: `src/lib/__tests__/articles-merge.test.ts`

**Interfaces:**
- Consumes: `Article`, `ArticleArchive` from `src/content/types.ts` (Task 2).
- Produces, all pure and side-effect free:
  - `toISODate(d: Date): string` — UTC `YYYY-MM-DD`
  - `mondayOf(isoDate: string): string`
  - `addDaysISO(isoDate: string, days: number): string`
  - `daysBetween(startISO: string, endISO: string): number`
  - `createEmptyArchive(source: string, now: Date): ArticleArchive`
  - `mergeArchive(archive: ArticleArchive, incoming: Article[], now: Date): ArticleArchive`

  Task 4 appends `Cadence`, `HeatmapDay`, `HeatmapWeek`, `windowStart`, `deriveCadence` and `deriveHeatmap` to this same file. Task 6 imports `mergeArchive` and `createEmptyArchive`.

- [ ] **Step 1: Write the failing merge tests**

Every test here maps to a spec requirement. The survival test is the important one: Medium's RSS window holds only 10 posts, so a post leaving the feed must never leave the archive.

`src/lib/__tests__/articles-merge.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Article, ArticleArchive } from '../../content/types'
import {
  addDaysISO,
  createEmptyArchive,
  daysBetween,
  mergeArchive,
  mondayOf,
  toISODate,
} from '../articles'

const SOURCE = 'https://medium.com/feed/@Tomjosetj31'
const NOW = new Date('2026-09-03T06:00:00.000Z')

function article(guid: string, publishedAt: string, title = `Post ${guid}`): Article {
  return { guid, title, url: `https://medium.com/p/${guid}`, publishedAt, topics: ['gitops'] }
}

describe('date helpers', () => {
  it('formats a UTC date', () => {
    expect(toISODate(new Date('2026-09-03T23:30:00.000Z'))).toBe('2026-09-03')
  })

  it('finds the Monday of a week, and is a no-op on a Monday', () => {
    expect(mondayOf('2026-09-03')).toBe('2026-08-31') // a Thursday
    expect(mondayOf('2026-08-31')).toBe('2026-08-31')
    expect(mondayOf('2026-09-06')).toBe('2026-08-31') // a Sunday belongs to the week before
  })

  it('adds days across a month boundary', () => {
    expect(addDaysISO('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDaysISO('2026-09-01', -1)).toBe('2026-08-31')
  })

  it('counts days between dates', () => {
    expect(daysBetween('2026-08-18', '2026-09-03')).toBe(16)
    expect(daysBetween('2026-09-03', '2026-09-03')).toBe(0)
  })
})

describe('createEmptyArchive', () => {
  it('stamps the source and first-seen date with no articles', () => {
    const a = createEmptyArchive(SOURCE, NOW)
    expect(a.source).toBe(SOURCE)
    expect(a.firstSeenAt).toBe('2026-09-03')
    expect(a.articles).toEqual([])
  })
})

describe('mergeArchive', () => {
  it('adds incoming articles newest first', () => {
    const merged = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('a', '2026-08-18T11:06:00.000Z'), article('b', '2026-09-02T09:46:00.000Z')],
      NOW,
    )
    expect(merged.articles.map((x) => x.guid)).toEqual(['b', 'a'])
  })

  it('deduplicates on guid within a single incoming batch', () => {
    const merged = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('a', '2026-08-18T11:06:00.000Z'), article('a', '2026-08-18T11:06:00.000Z')],
      NOW,
    )
    expect(merged.articles).toHaveLength(1)
  })

  it('keeps an article that has dropped out of the RSS window', () => {
    const existing: ArticleArchive = {
      ...createEmptyArchive(SOURCE, NOW),
      articles: [article('old', '2026-07-01T10:00:00.000Z')],
    }
    const merged = mergeArchive(existing, [article('new', '2026-09-02T09:46:00.000Z')], NOW)
    expect(merged.articles.map((x) => x.guid)).toEqual(['new', 'old'])
  })

  it('is idempotent — merging the same feed twice changes nothing', () => {
    const incoming = [article('a', '2026-08-18T11:06:00.000Z'), article('b', '2026-09-02T09:46:00.000Z')]
    const once = mergeArchive(createEmptyArchive(SOURCE, NOW), incoming, NOW)
    const twice = mergeArchive(once, incoming, NOW)
    expect(twice).toEqual(once)
  })

  it('updates a changed title in place without duplicating the guid', () => {
    const once = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('a', '2026-08-18T11:06:00.000Z', 'Original title')],
      NOW,
    )
    const twice = mergeArchive(
      once,
      [article('a', '2026-08-18T11:06:00.000Z', 'Corrected title')],
      NOW,
    )
    expect(twice.articles).toHaveLength(1)
    expect(twice.articles[0].title).toBe('Corrected title')
  })

  it('never overwrites firstSeenAt once it is set', () => {
    const existing: ArticleArchive = { ...createEmptyArchive(SOURCE, new Date('2026-06-01T00:00:00.000Z')) }
    const merged = mergeArchive(existing, [article('a', '2026-09-02T09:46:00.000Z')], NOW)
    expect(merged.firstSeenAt).toBe('2026-06-01')
  })

  it('backfills firstSeenAt when the archive lacks one', () => {
    const existing: ArticleArchive = { source: SOURCE, firstSeenAt: '', lastSyncedAt: '', articles: [] }
    expect(mergeArchive(existing, [], NOW).firstSeenAt).toBe('2026-09-03')
  })

  it('records the sync time on every run', () => {
    expect(mergeArchive(createEmptyArchive(SOURCE, NOW), [], NOW).lastSyncedAt).toBe(
      '2026-09-03T06:00:00.000Z',
    )
  })

  it('breaks publishedAt ties deterministically by guid', () => {
    const merged = mergeArchive(
      createEmptyArchive(SOURCE, NOW),
      [article('z', '2026-09-01T10:00:00.000Z'), article('a', '2026-09-01T10:00:00.000Z')],
      NOW,
    )
    expect(merged.articles.map((x) => x.guid)).toEqual(['a', 'z'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/articles-merge.test.ts`
Expected: FAIL — `Failed to resolve import "../articles"`.

- [ ] **Step 3: Write `src/lib/articles.ts`**

```ts
import type { Article, ArticleArchive } from '../content/types'

const MS_PER_DAY = 86_400_000

/** UTC `YYYY-MM-DD`. All article maths is done in UTC so tests never depend on the runner's timezone. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** The Monday of the week containing `isoDate`. Sunday belongs to the week that precedes it. */
export function mondayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  const dow = d.getUTCDay() // 0 = Sunday
  const shift = dow === 0 ? 6 : dow - 1
  return toISODate(new Date(d.getTime() - shift * MS_PER_DAY))
}

export function addDaysISO(isoDate: string, days: number): string {
  return toISODate(new Date(new Date(`${isoDate}T00:00:00.000Z`).getTime() + days * MS_PER_DAY))
}

export function daysBetween(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T00:00:00.000Z`).getTime()
  const end = new Date(`${endISO}T00:00:00.000Z`).getTime()
  return Math.round((end - start) / MS_PER_DAY)
}

export function createEmptyArchive(source: string, now: Date): ArticleArchive {
  return { source, firstSeenAt: toISODate(now), lastSyncedAt: now.toISOString(), articles: [] }
}

/**
 * Append-only merge keyed on Medium's `guid`.
 *
 * An article present in the archive but absent from `incoming` is preserved —
 * Medium's RSS exposes only the latest 10 posts, so absence from the feed is
 * not evidence that a post is gone.
 */
export function mergeArchive(
  archive: ArticleArchive,
  incoming: Article[],
  now: Date,
): ArticleArchive {
  const byGuid = new Map<string, Article>()
  for (const existing of archive.articles) byGuid.set(existing.guid, existing)
  for (const fresh of incoming) {
    byGuid.set(fresh.guid, { ...(byGuid.get(fresh.guid) ?? {}), ...fresh })
  }

  const articles = [...byGuid.values()].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.guid.localeCompare(b.guid),
  )

  return {
    source: archive.source,
    firstSeenAt: archive.firstSeenAt || toISODate(now),
    lastSyncedAt: now.toISOString(),
    articles,
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/articles-merge.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/articles.ts src/lib/__tests__/articles-merge.test.ts
git commit -m "feat: add append-only article archive merge

Keyed on Medium's guid so a post dropping out of the 10-item RSS window
can never disappear from the archive. Merge is idempotent, updates
changed titles in place, and never overwrites firstSeenAt."
```

---

## Task 4: Cadence and heatmap derivation

**Files:**
- Modify: `src/lib/articles.ts` (append)
- Test: `src/lib/__tests__/articles-derive.test.ts`

**Interfaces:**
- Consumes: `toISODate`, `mondayOf`, `addDaysISO`, `daysBetween` from Task 3.
- Produces:
  - `interface Cadence { postCount: number; windowDays: number; perWeek: number; topTopic: string | null }`
  - `interface HeatmapDay { date: string; count: number }`
  - `interface HeatmapWeek { weekStartISO: string; days: HeatmapDay[] }` — `days` always has 7 entries, Monday through Sunday
  - `windowStart(archive: ArticleArchive): string | null`
  - `deriveCadence(archive: ArticleArchive, now: Date, stoplist?: string[]): Cadence`
  - `deriveHeatmap(archive: ArticleArchive, now: Date, maxWeeks?: number): HeatmapWeek[]`

  Task 13 consumes all three functions.

**The window rule, restated because it is the spec's one corrected bug:** both derivations anchor to the **earliest `publishedAt` in the archive**, never to `firstSeenAt`. The first sync yields ~10 posts spanning roughly three weeks *before* the archive existed; anchoring to `firstSeenAt` would render an empty grid on day one.

- [ ] **Step 1: Write the failing derivation tests**

`src/lib/__tests__/articles-derive.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Article, ArticleArchive } from '../../content/types'
import { deriveCadence, deriveHeatmap, windowStart } from '../articles'

const NOW = new Date('2026-09-03T06:00:00.000Z') // a Thursday

function article(guid: string, publishedAt: string, topics: string[] = ['gitops']): Article {
  return { guid, title: `Post ${guid}`, url: `https://medium.com/p/${guid}`, publishedAt, topics }
}

/** firstSeenAt is deliberately later than every publishedAt — the day-one situation. */
function archiveOf(articles: Article[]): ArticleArchive {
  return {
    source: 'https://medium.com/feed/@Tomjosetj31',
    firstSeenAt: '2026-09-03',
    lastSyncedAt: NOW.toISOString(),
    articles,
  }
}

const REAL_FEED = archiveOf([
  article('a1', '2026-09-02T09:46:00.000Z', ['software-engineering', 'gitops', 'devops']),
  article('a2', '2026-09-01T11:01:00.000Z', ['artificial-intelligence', 'devops']),
  article('a3', '2026-08-28T10:01:00.000Z', ['devops', 'gitops']),
  article('a4', '2026-08-27T10:51:00.000Z', ['devops', 'docker']),
  article('a5', '2026-08-26T09:31:00.000Z', ['aws', 'terraform']),
  article('a6', '2026-08-25T09:31:00.000Z', ['devops', 'kubernetes']),
  article('a7', '2026-08-21T11:11:00.000Z', ['devops', 'docker']),
  article('a8', '2026-08-20T11:01:00.000Z', ['devops', 'ci-cd-pipeline']),
  article('a9', '2026-08-19T12:01:00.000Z', ['devops', 'kubernetes']),
  article('a10', '2026-08-18T11:06:00.000Z', ['devops', 'gitops']),
])

const STOPLIST = ['software-engineering', 'programming', 'cloud-computing', 'technology', 'devops']

describe('windowStart', () => {
  it('is the earliest published date, not firstSeenAt', () => {
    expect(windowStart(REAL_FEED)).toBe('2026-08-18')
  })

  it('is null for an empty archive', () => {
    expect(windowStart(archiveOf([]))).toBeNull()
  })
})

describe('deriveCadence', () => {
  it('counts posts across the window anchored on the earliest post', () => {
    const c = deriveCadence(REAL_FEED, NOW, STOPLIST)
    expect(c.postCount).toBe(10)
    expect(c.windowDays).toBe(17) // 18 Aug -> 3 Sep inclusive
  })

  it('computes posts per week to one decimal place', () => {
    // 10 posts over 17 days = 4.1 per week
    expect(deriveCadence(REAL_FEED, NOW, STOPLIST).perWeek).toBe(4.1)
  })

  it('picks the most frequent topic after removing generic tags', () => {
    // devops appears 8 times but is stop-listed; gitops is next with 3.
    expect(deriveCadence(REAL_FEED, NOW, STOPLIST).topTopic).toBe('gitops')
  })

  it('falls back to the raw most-frequent topic when no stoplist is given', () => {
    expect(deriveCadence(REAL_FEED, NOW).topTopic).toBe('devops')
  })

  it('returns zeroes and no topic for an empty archive', () => {
    expect(deriveCadence(archiveOf([]), NOW, STOPLIST)).toEqual({
      postCount: 0,
      windowDays: 0,
      perWeek: 0,
      topTopic: null,
    })
  })

  it('does not divide by zero for a single post published today', () => {
    const c = deriveCadence(archiveOf([article('x', '2026-09-03T08:00:00.000Z')]), NOW, STOPLIST)
    expect(c.windowDays).toBe(1)
    expect(c.perWeek).toBe(7)
    expect(Number.isFinite(c.perWeek)).toBe(true)
  })

  it('breaks topic ties alphabetically so the tile is stable between builds', () => {
    const a = archiveOf([article('x', '2026-09-02T08:00:00.000Z', ['zebra', 'alpha'])])
    expect(deriveCadence(a, NOW).topTopic).toBe('alpha')
  })
})

describe('deriveHeatmap', () => {
  it('returns no weeks for an empty archive rather than throwing', () => {
    expect(deriveHeatmap(archiveOf([]), NOW)).toEqual([])
  })

  it('spans the Monday of the earliest post to the Monday of today', () => {
    const weeks = deriveHeatmap(REAL_FEED, NOW)
    expect(weeks).toHaveLength(3)
    expect(weeks[0].weekStartISO).toBe('2026-08-17')
    expect(weeks[2].weekStartISO).toBe('2026-08-31')
  })

  it('emits seven days per week, Monday first', () => {
    const week = deriveHeatmap(REAL_FEED, NOW)[0]
    expect(week.days).toHaveLength(7)
    expect(week.days[0].date).toBe('2026-08-17')
    expect(week.days[6].date).toBe('2026-08-23')
  })

  it('counts posts on the right days', () => {
    const week = deriveHeatmap(REAL_FEED, NOW)[0]
    const byDate = Object.fromEntries(week.days.map((d) => [d.date, d.count]))
    expect(byDate['2026-08-17']).toBe(0) // Monday — no post
    expect(byDate['2026-08-18']).toBe(1)
    expect(byDate['2026-08-21']).toBe(1)
    expect(byDate['2026-08-22']).toBe(0) // Saturday
  })

  it('counts two posts on the same day', () => {
    const a = archiveOf([
      article('x', '2026-09-01T08:00:00.000Z'),
      article('y', '2026-09-01T18:00:00.000Z'),
    ])
    const days = deriveHeatmap(a, NOW).flatMap((w) => w.days)
    expect(days.find((d) => d.date === '2026-09-01')?.count).toBe(2)
  })

  it('caps the grid at maxWeeks, keeping the most recent weeks', () => {
    const a = archiveOf([
      article('old', '2026-01-05T08:00:00.000Z'),
      article('new', '2026-09-02T08:00:00.000Z'),
    ])
    const weeks = deriveHeatmap(a, NOW, 4)
    expect(weeks).toHaveLength(4)
    expect(weeks[3].weekStartISO).toBe('2026-08-31')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/articles-derive.test.ts`
Expected: FAIL — `deriveCadence is not a function` (or an import error).

- [ ] **Step 3: Append the derivation code to `src/lib/articles.ts`**

```ts
export interface Cadence {
  postCount: number
  windowDays: number
  /** Posts per week over the window, to one decimal place. */
  perWeek: number
  topTopic: string | null
}

export interface HeatmapDay {
  date: string
  count: number
}

export interface HeatmapWeek {
  weekStartISO: string
  /** Always 7 entries, Monday through Sunday. */
  days: HeatmapDay[]
}

/**
 * The earliest published date in the archive, or null when it is empty.
 *
 * This — not `firstSeenAt` — anchors both derivations. The first sync yields
 * posts that predate the archive, so anchoring on `firstSeenAt` would render
 * an empty grid on day one.
 */
export function windowStart(archive: ArticleArchive): string | null {
  if (archive.articles.length === 0) return null
  return archive.articles.reduce(
    (earliest, a) => (a.publishedAt < earliest ? a.publishedAt : earliest),
    archive.articles[0].publishedAt,
  ).slice(0, 10)
}

export function deriveCadence(
  archive: ArticleArchive,
  now: Date,
  stoplist: string[] = [],
): Cadence {
  const start = windowStart(archive)
  if (start === null) return { postCount: 0, windowDays: 0, perWeek: 0, topTopic: null }

  const postCount = archive.articles.length
  const windowDays = Math.max(1, daysBetween(start, toISODate(now)) + 1)
  const perWeek = Math.round((postCount / windowDays) * 7 * 10) / 10

  const blocked = new Set(stoplist.map((t) => t.toLowerCase()))
  const counts = new Map<string, number>()
  for (const a of archive.articles) {
    for (const topic of a.topics) {
      const key = topic.toLowerCase()
      if (blocked.has(key)) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  // Ties break alphabetically so the rendered tile is stable between builds.
  const topTopic =
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null

  return { postCount, windowDays, perWeek, topTopic }
}

export function deriveHeatmap(
  archive: ArticleArchive,
  now: Date,
  maxWeeks = 26,
): HeatmapWeek[] {
  const start = windowStart(archive)
  if (start === null) return []

  const countsByDate = new Map<string, number>()
  for (const a of archive.articles) {
    const date = a.publishedAt.slice(0, 10)
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1)
  }

  const weeks: HeatmapWeek[] = []
  const lastMonday = mondayOf(toISODate(now))
  for (let monday = mondayOf(start); monday <= lastMonday; monday = addDaysISO(monday, 7)) {
    weeks.push({
      weekStartISO: monday,
      days: Array.from({ length: 7 }, (_, i) => {
        const date = addDaysISO(monday, i)
        return { date, count: countsByDate.get(date) ?? 0 }
      }),
    })
  }

  return weeks.slice(-maxWeeks)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__ && npm run typecheck`
Expected: all PASS in both merge and derive suites, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/articles.ts src/lib/__tests__/articles-derive.test.ts
git commit -m "feat: derive publishing cadence and heatmap from the archive

Both anchor on the earliest publishedAt rather than firstSeenAt, so a
freshly-created archive still renders three populated weeks instead of an
empty grid. Topic ranking drops generic tags via a stoplist and breaks
ties alphabetically to keep builds deterministic."
```

---

## Task 5: Parse the Medium RSS feed

**Files:**
- Create: `src/lib/feed.ts`
- Create: `src/lib/__tests__/fixtures/medium-feed.xml`
- Test: `src/lib/__tests__/feed.test.ts`

**Interfaces:**
- Consumes: `Article` from `src/content/types.ts`.
- Produces: `parseFeed(xml: string): Article[]`. Task 6 is the only consumer — it must never be imported from a component, or `fast-xml-parser` lands in the browser bundle.

**Three things the real feed does that a naive parser gets wrong** — all verified against the live feed, all covered by tests below:

1. `<guid isPermaLink="false">` carries an attribute, so with `ignoreAttributes: false` the parsed value is `{ '#text': '…', '@_isPermaLink': 'false' }`, not a string.
2. Every `<link>` ends in an RSS tracking parameter — `?source=rss-3769c583571b------2`. It must be stripped; those URLs should not ship on the site.
3. A post with one `<category>` parses as a string, not an array. Ten posts with five categories each parse as arrays. Both shapes must work.

- [ ] **Step 1: Write the fixture**

`src/lib/__tests__/fixtures/medium-feed.xml` — two real items, trimmed of `content:encoded` bodies, plus one deliberately malformed third item:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     version="2.0">
  <channel>
    <title><![CDATA[Stories by Tom Jose | DevOps on Medium]]></title>
    <link>https://medium.com/@Tomjosetj31?source=rss-3769c583571b------2</link>
    <item>
      <title><![CDATA[How I Would Design GitOps for 100+ Kubernetes Clusters]]></title>
      <link>https://medium.com/kotaicode/how-i-would-design-gitops-for-100-kubernetes-clusters-206a174a1c59?source=rss-3769c583571b------2</link>
      <guid isPermaLink="false">https://medium.com/p/206a174a1c59</guid>
      <category><![CDATA[software-engineering]]></category>
      <category><![CDATA[cloud-computing]]></category>
      <category><![CDATA[gitops]]></category>
      <category><![CDATA[devops]]></category>
      <category><![CDATA[kubernetes]]></category>
      <dc:creator><![CDATA[Tom Jose | DevOps]]></dc:creator>
      <pubDate>Wed, 02 Sep 2026 09:46:00 GMT</pubDate>
      <content:encoded><![CDATA[<p>trimmed</p>]]></content:encoded>
    </item>
    <item>
      <title><![CDATA[Reducing CI/CD Build Times by 70%]]></title>
      <link>https://medium.com/kotaicode/reducing-ci-cd-build-times-by-70-abc123def456?source=rss-3769c583571b------2</link>
      <guid isPermaLink="false">https://medium.com/p/abc123def456</guid>
      <category><![CDATA[ci-cd-pipeline]]></category>
      <dc:creator><![CDATA[Tom Jose | DevOps]]></dc:creator>
      <pubDate>Thu, 20 Aug 2026 11:01:00 GMT</pubDate>
      <content:encoded><![CDATA[<p>trimmed</p>]]></content:encoded>
    </item>
    <item>
      <title><![CDATA[Post with an unparseable date]]></title>
      <link>https://medium.com/p/badbadbad</link>
      <guid isPermaLink="false">https://medium.com/p/badbadbad</guid>
      <pubDate>not a date at all</pubDate>
    </item>
  </channel>
</rss>
```

- [ ] **Step 2: Write the failing parser tests**

`src/lib/__tests__/feed.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseFeed } from '../feed'

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
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/feed.test.ts`
Expected: FAIL — `Failed to resolve import "../feed"`.

- [ ] **Step 4: Write `src/lib/feed.ts`**

```ts
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
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#text'] ?? '')
  }
  return String(value)
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/feed.test.ts && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/feed.ts src/lib/__tests__/feed.test.ts src/lib/__tests__/fixtures
git commit -m "feat: parse the Medium RSS feed into typed articles

Handles the three shapes the real feed actually produces: guid elements
carrying attributes, single categories arriving as strings rather than
arrays, and RSS tracking parameters on every link. Never throws — a
malformed feed yields an empty array so the build survives it."
```

---

## Task 6: The sync script

**Files:**
- Create: `scripts/sync-medium.ts`
- Create: `src/content/articles.archive.json` (written by the script, committed once)
- Test: `src/lib/__tests__/sync.test.ts`

**Interfaces:**
- Consumes: `parseFeed` (Task 5), `mergeArchive` + `createEmptyArchive` (Task 3), `MEDIUM_FEED_URL` (Task 2).
- Produces:
  - `syncArchive(deps: SyncDeps): Promise<SyncResult>` — the testable core, exported from the script module
  - `interface SyncDeps { fetchFeed: () => Promise<string>; readArchive: () => Promise<string | null>; writeArchive: (json: string) => Promise<void>; now: Date; source: string }`
  - `interface SyncResult { status: 'updated' | 'unchanged' | 'skipped'; reason?: string; added: number }`
  - Task 18 reads `status` from the script's stdout to decide whether to commit.

**Why the logic is split from the I/O:** the failure paths are the whole point of this task, and they are only testable if `fetch`, `readFile` and `writeFile` are injected. The module's bottom half wires the real ones and is not unit-tested.

- [ ] **Step 1: Write the failing sync tests**

Each test maps to a spec requirement: *"if the feed is unreachable, returns non-200, or fails to parse, the script logs a warning and exits zero, leaving the archive untouched."*

`src/lib/__tests__/sync.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import type { SyncDeps } from '../../../scripts/sync-medium'
import { syncArchive } from '../../../scripts/sync-medium'

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
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/sync.test.ts`
Expected: FAIL — cannot resolve `scripts/sync-medium`.

- [ ] **Step 3: Write `scripts/sync-medium.ts`**

The `main()` guard at the bottom uses `process.argv[1]` so importing this module from a test never triggers a real network call.

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { ArticleArchive } from '../src/content/types'
import { createEmptyArchive, mergeArchive } from '../src/lib/articles'
import { parseFeed } from '../src/lib/feed'
import { MEDIUM_FEED_URL } from '../src/content/writing'

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

  let incoming
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

  await deps.writeArchive(`${JSON.stringify(merged, null, 2)}\n`)
  return { status: 'updated', added }
}

const ARCHIVE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'content',
  'articles.archive.json',
)

async function main(): Promise<void> {
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

  // Always succeed. A feed problem must not fail the build.
  process.exit(0)
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  void main()
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/sync.test.ts && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 5: Run the real sync to create the archive**

```bash
npm run sync:medium
cat src/content/articles.archive.json | head -20
```

Expected: `sync-medium: updated (+10)` and a JSON file with 10 real articles. This is the one time the archive is authored; from here it is machine-written only.

- [ ] **Step 6: Verify the failure path against a real unreachable feed**

```bash
node -e "
const {syncArchive} = await import('./scripts/sync-medium.ts').catch(() => ({}));
" 2>/dev/null || npx vite-node -e "
import { syncArchive } from './scripts/sync-medium.ts'
const r = await syncArchive({
  source: 'x', now: new Date(),
  fetchFeed: async () => { throw new Error('simulated outage') },
  readArchive: async () => require('node:fs').readFileSync('src/content/articles.archive.json','utf8'),
  writeArchive: async () => { throw new Error('MUST NOT WRITE') },
})
console.log(r)
"
```

Expected: `{ status: 'skipped', reason: 'Error: simulated outage', added: 0 }` and no write. If the inline runner is awkward, the Step 1 unit tests already cover this — treat this step as optional confirmation.

- [ ] **Step 7: Commit**

```bash
git add scripts/sync-medium.ts src/lib/__tests__/sync.test.ts src/content/articles.archive.json
git commit -m "feat: sync the Medium feed into the article archive before every build

I/O is injected so every failure path is tested: unreachable feed, garbage
XML, an empty feed and a corrupt existing archive all return 'skipped',
write nothing and exit zero. A no-op sync reports 'unchanged' so the daily
workflow produces no commit on quiet days."
```

---

## Task 7: Motion gating and static UI primitives

**Files:**
- Create: `src/hooks/useReducedMotion.ts`, `src/hooks/useCursorGlow.ts`
- Create: `src/components/ui/GlassPanel.tsx`, `src/components/ui/MonoLabel.tsx`, `src/components/ui/Tag.tsx`, `src/components/ui/StatusChip.tsx`
- Modify: `src/styles/index.css` (add `.glass-glow`)
- Test: `src/hooks/__tests__/useReducedMotion.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces — every later component imports from here:
  - `useReducedMotion(): boolean`
  - `useCursorGlow(): { onMouseMove: MouseEventHandler<HTMLElement>; onMouseLeave: MouseEventHandler<HTMLElement> }`
  - `<GlassPanel as?="div"|"section"|"article" glow?={boolean} className?={string}>` — renders `.glass`, adds `.glass-glow` and the cursor handlers when `glow`
  - `<MonoLabel as?="span"|"div" className?>` — renders `.lbl`
  - `<Tag>` — renders `.tag`
  - `<StatusChip pulse?={boolean}>` — renders `.status-chip` with a leading dot

`useReducedMotion` is the **single** source of motion gating named in Global Constraints. No component may read `matchMedia` directly.

- [ ] **Step 1: Write the failing hook test**

`src/hooks/__tests__/useReducedMotion.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from '../useReducedMotion'

function Probe() {
  return <span data-testid="probe">{String(useReducedMotion())}</span>
}

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
  return listeners
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReducedMotion', () => {
  it('is false when the user has expressed no preference', () => {
    mockMatchMedia(false)
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('false')
  })

  it('is true when the user prefers reduced motion', () => {
    mockMatchMedia(true)
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('true')
  })

  it('queries prefers-reduced-motion specifically', () => {
    mockMatchMedia(false)
    render(<Probe />)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('does not throw when matchMedia is unavailable', () => {
    // @ts-expect-error deliberately removing the API to simulate an old environment
    delete window.matchMedia
    expect(() => render(<Probe />)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useReducedMotion.test.tsx`
Expected: FAIL — `Failed to resolve import "../useReducedMotion"`.

- [ ] **Step 3: Write the two hooks**

`src/hooks/useReducedMotion.ts`:

```ts
import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** The single source of motion gating. No component should read matchMedia directly. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(QUERY).matches
      : false,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    setReduced(mq.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
```

`src/hooks/useCursorGlow.ts` — writes CSS custom properties rather than React state, so tracking the cursor never re-renders:

```ts
import { useCallback, type MouseEventHandler } from 'react'
import { useReducedMotion } from './useReducedMotion'

export function useCursorGlow(): {
  onMouseMove: MouseEventHandler<HTMLElement>
  onMouseLeave: MouseEventHandler<HTMLElement>
} {
  const reduced = useReducedMotion()

  const onMouseMove = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      if (reduced) return
      const element = event.currentTarget
      const bounds = element.getBoundingClientRect()
      element.style.setProperty('--gx', `${event.clientX - bounds.left}px`)
      element.style.setProperty('--gy', `${event.clientY - bounds.top}px`)
      element.style.setProperty('--g-opacity', '1')
    },
    [reduced],
  )

  const onMouseLeave = useCallback<MouseEventHandler<HTMLElement>>((event) => {
    event.currentTarget.style.setProperty('--g-opacity', '0')
  }, [])

  return { onMouseMove, onMouseLeave }
}
```

- [ ] **Step 4: Add `.glass-glow` to `src/styles/index.css`**

Insert inside the existing `@layer components` block, directly after the `.glass::before` rule:

```css
  .glass-glow::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    opacity: var(--g-opacity, 0);
    transition: opacity 0.25s ease;
    background: radial-gradient(
      220px circle at var(--gx, 50%) var(--gy, 50%),
      rgba(167, 139, 250, 0.16),
      transparent 70%
    );
  }
```

- [ ] **Step 5: Write the four static primitives**

`src/components/ui/GlassPanel.tsx`:

```tsx
import type { HTMLAttributes, ReactNode } from 'react'
import { useCursorGlow } from '../../hooks/useCursorGlow'

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside'
  /** Adds the cursor-tracked radial highlight. Off by default. */
  glow?: boolean
  children: ReactNode
}

export function GlassPanel({
  as: Tag = 'div',
  glow = false,
  className = '',
  children,
  ...rest
}: GlassPanelProps) {
  const { onMouseMove, onMouseLeave } = useCursorGlow()
  const glowProps = glow ? { onMouseMove, onMouseLeave } : {}

  return (
    <Tag className={`glass ${glow ? 'glass-glow' : ''} ${className}`.trim()} {...glowProps} {...rest}>
      {children}
    </Tag>
  )
}
```

`src/components/ui/MonoLabel.tsx`:

```tsx
import type { HTMLAttributes, ReactNode } from 'react'

interface MonoLabelProps extends HTMLAttributes<HTMLElement> {
  as?: 'span' | 'div' | 'p'
  children: ReactNode
}

export function MonoLabel({ as: Tag = 'span', className = '', children, ...rest }: MonoLabelProps) {
  return (
    <Tag className={`lbl ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
```

`src/components/ui/Tag.tsx`:

```tsx
import type { ReactNode } from 'react'

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>
}
```

`src/components/ui/StatusChip.tsx`:

```tsx
import type { ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** The nav availability chip. The dot pulses unless the user prefers reduced motion. */
export function StatusChip({ children, pulse = true }: { children: ReactNode; pulse?: boolean }) {
  const reduced = useReducedMotion()

  return (
    <span className="status-chip">
      <span
        aria-hidden="true"
        style={{
          width: 5.5,
          height: 5.5,
          borderRadius: '50%',
          background: 'var(--status-green)',
          boxShadow: '0 0 7px var(--status-green)',
          animation: pulse && !reduced ? 'chip-pulse 2s ease-in-out infinite' : undefined,
        }}
      />
      {children}
    </span>
  )
}
```

Add the keyframes to the `@layer base` block in `src/styles/index.css`:

```css
  @keyframes chip-pulse {
    50% {
      opacity: 0.35;
      transform: scale(0.8);
    }
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/hooks && npm run typecheck`
Expected: 4 PASS, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/hooks src/components/ui src/styles/index.css
git commit -m "feat: add motion gating hook and static glass primitives

useReducedMotion is the single source of motion gating; useCursorGlow
writes CSS custom properties rather than React state so cursor tracking
never triggers a re-render."
```

---

## Task 8: Interactive primitives — CountUp and CopyableCommand

**Files:**
- Create: `src/components/ui/CountUp.tsx`, `src/components/ui/CopyableCommand.tsx`
- Modify: `vitest.setup.ts` (add an `IntersectionObserver` stub)
- Test: `src/components/ui/__tests__/CountUp.test.tsx`, `src/components/ui/__tests__/CopyableCommand.test.tsx`

**Interfaces:**
- Consumes: `useReducedMotion` (Task 7).
- Produces:
  - `<CountUp value={number} suffix?={string} decimals?={number} durationMs?={number} />` — used by `ProofStrip` (Task 10) and the writing cadence tiles (Task 13)
  - `<CopyableCommand label={string} command={string} />` — used by product cards (Task 12)

- [ ] **Step 1: Add the IntersectionObserver stub to `vitest.setup.ts`**

jsdom has no `IntersectionObserver`, and `CountUp` uses it to start on scroll. The stub fires immediately so tests are deterministic rather than timing-dependent.

```ts
class ImmediateIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

if (!('IntersectionObserver' in window)) {
  window.IntersectionObserver =
    ImmediateIntersectionObserver as unknown as typeof window.IntersectionObserver
}
```

- [ ] **Step 2: Write the failing tests**

`src/components/ui/__tests__/CountUp.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CountUp } from '../CountUp'

function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  setReducedMotion(false)
})

describe('CountUp', () => {
  it('reaches the target value', async () => {
    render(<CountUp value={40} />)
    await waitFor(() => expect(screen.getByText('40')).toBeInTheDocument())
  })

  it('renders the final value immediately under reduced motion', () => {
    setReducedMotion(true)
    render(<CountUp value={30} />)
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('appends a suffix', async () => {
    render(<CountUp value={40} suffix="%" />)
    await waitFor(() => expect(screen.getByText('40%')).toBeInTheDocument())
  })

  it('renders decimals when asked', async () => {
    render(<CountUp value={4.2} decimals={1} />)
    await waitFor(() => expect(screen.getByText('4.2')).toBeInTheDocument())
  })

  it('renders zero without animating to something else', () => {
    setReducedMotion(true)
    render(<CountUp value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
```

`src/components/ui/__tests__/CopyableCommand.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CopyableCommand } from '../CopyableCommand'

const COMMAND = 'brew install tomjosetj31/spaceload/spaceload'

function stubClipboard(impl: () => Promise<void>) {
  Object.assign(navigator, { clipboard: { writeText: vi.fn(impl) } })
  return navigator.clipboard.writeText as unknown as ReturnType<typeof vi.fn>
}

describe('CopyableCommand', () => {
  it('shows the command', () => {
    render(<CopyableCommand label="Install" command={COMMAND} />)
    expect(screen.getByText(COMMAND)).toBeInTheDocument()
  })

  it('writes the command to the clipboard when clicked', async () => {
    const writeText = stubClipboard(async () => {})
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledWith(COMMAND)
  })

  it('confirms the copy to the user', async () => {
    stubClipboard(async () => {})
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent(/copied/i))
  })

  it('exposes an accessible name that names the command', () => {
    render(<CopyableCommand label="Install" command={COMMAND} />)
    expect(screen.getByRole('button')).toHaveAccessibleName(`Copy command: ${COMMAND}`)
  })

  it('does not crash when the clipboard write is rejected', async () => {
    stubClipboard(async () => {
      throw new Error('denied')
    })
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent(/failed/i))
  })

  it('does not crash when the clipboard API is missing entirely', async () => {
    Object.assign(navigator, { clipboard: undefined })
    render(<CopyableCommand label="Install" command={COMMAND} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent(/failed/i))
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/components/ui`
Expected: FAIL — both imports unresolved.

- [ ] **Step 4: Write `src/components/ui/CountUp.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface CountUpProps {
  value: number
  suffix?: string
  decimals?: number
  durationMs?: number
}

/** Counts from zero to `value` when scrolled into view. Static under reduced motion. */
export function CountUp({ value, suffix = '', decimals = 0, durationMs = 1100 }: CountUpProps) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)
  const [display, setDisplay] = useState(value)

  // Start at zero only when we are actually going to animate.
  useEffect(() => {
    if (!reduced && !started) setDisplay(0)
  }, [reduced, started])

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const element = ref.current
    if (!element || started) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [reduced, started, value])

  useEffect(() => {
    if (reduced || !started) return
    let frame = 0
    const startedAt = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      if (progress < 1) {
        setDisplay(value * eased)
        frame = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced, started, value, durationMs])

  return (
    <span ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
```

- [ ] **Step 5: Write `src/components/ui/CopyableCommand.tsx`**

```tsx
import { useState } from 'react'
import { MonoLabel } from './MonoLabel'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * A copyable shell command. The spec singles this out: a product you can
 * `brew install` reads as a real product, so the command must be one click away.
 */
export function CopyableCommand({ label, command }: { label: string; command: string }) {
  const [state, setState] = useState<CopyState>('idle')

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(command)
      setState('copied')
    } catch {
      setState('failed')
    }
    window.setTimeout(() => setState('idle'), 2200)
  }

  return (
    <div className="my-3">
      <MonoLabel className="mb-1.5 block">{label}</MonoLabel>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy command: ${command}`}
        className="flex w-full items-center justify-between gap-2 rounded-[7px] border border-white/10 bg-black/40 px-2.5 py-2.5 text-left"
      >
        <code
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ font: '500 10px/1 var(--font-mono)', color: '#a5f3fc' }}
        >
          {command}
        </code>
        <MonoLabel style={{ flexShrink: 0 }}>
          {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
        </MonoLabel>
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/ui && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui vitest.setup.ts
git commit -m "feat: add CountUp and CopyableCommand primitives

CountUp starts on scroll and renders its final value immediately under
reduced motion. CopyableCommand degrades to a 'copy failed' state when the
clipboard API is denied or absent rather than throwing."
```

---

## Task 9: Layout shell — aurora, grain, nav, footer

**Files:**
- Create: `src/content/chapters.ts`
- Modify: `src/content/types.ts` (add `Chapter`)
- Create: `src/components/layout/AuroraField.tsx`, `src/components/layout/Grain.tsx`, `src/components/layout/Nav.tsx`, `src/components/layout/Footer.tsx`
- Create: `src/components/ui/Reveal.tsx`, `src/components/ui/ChapterHeading.tsx`
- Modify: `src/styles/index.css` (aurora keyframes)
- Test: `src/components/layout/__tests__/Nav.test.tsx`

**Interfaces:**
- Consumes: `profile` (Task 2), `GlassPanel`/`MonoLabel`/`StatusChip` (Task 7), `useReducedMotion` (Task 7).
- Produces:
  - `interface Chapter { id: string; num: string; title: string; accent: string }` in `types.ts`
  - `chapters: Chapter[]` — consumed by `Nav` (here), each section (Tasks 11–14) and `CommandPalette` (Task 16)
  - `<AuroraField />`, `<Grain />`, `<Nav />`, `<Footer />`
  - `<Reveal delay?={number} className?={string}>` — the standard scroll-reveal wrapper; every section uses it rather than calling Motion directly
  - `<ChapterHeading chapter={Chapter} />` — renders the `.chapter` row

- [ ] **Step 1: Add `Chapter` to `src/content/types.ts`**

```ts
export interface Chapter {
  /** Also the section's DOM id and the anchor target. */
  id: string
  num: string
  title: string
  /** A CSS custom property reference, e.g. 'var(--accent-cyan)'. */
  accent: string
}
```

- [ ] **Step 2: Write `src/content/chapters.ts`**

Order here is the page order. `CommandPalette` and `Nav` both derive from it, so a reorder needs no component change.

```ts
import type { Chapter } from './types'

export const chapters: Chapter[] = [
  { id: 'infrastructure', num: '01', title: 'Infrastructure', accent: 'var(--accent-cyan)' },
  { id: 'products', num: '02', title: 'Products', accent: 'var(--accent-violet)' },
  { id: 'writing', num: '03', title: 'Writing', accent: 'var(--accent-teal)' },
  { id: 'teaching', num: '04', title: 'Teaching', accent: 'var(--accent-indigo)' },
]
```

- [ ] **Step 3: Write the failing nav test**

`src/components/layout/__tests__/Nav.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { chapters } from '../../../content/chapters'
import { profile } from '../../../content/profile'
import { Nav } from '../Nav'

describe('Nav', () => {
  it('links to every chapter by anchor', () => {
    render(<Nav onOpenPalette={() => {}} />)
    for (const chapter of chapters) {
      const link = screen.getByRole('link', { name: new RegExp(chapter.title, 'i') })
      expect(link).toHaveAttribute('href', `#${chapter.id}`)
    }
  })

  it('offers the résumé as a download', () => {
    render(<Nav onOpenPalette={() => {}} />)
    const resume = screen.getByRole('link', { name: /résumé/i })
    expect(resume).toHaveAttribute('href', profile.resumePath)
    expect(resume).toHaveAttribute('download')
  })

  it('shows the availability chip when profile declares one', () => {
    render(<Nav onOpenPalette={() => {}} />)
    expect(screen.getByText(profile.availability!)).toBeInTheDocument()
  })

  it('exposes a labelled button that opens the command palette', () => {
    render(<Nav onOpenPalette={() => {}} />)
    expect(screen.getByRole('button', { name: /command palette/i })).toBeInTheDocument()
  })

  it('is a navigation landmark', () => {
    render(<Nav onOpenPalette={() => {}} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/components/layout`
Expected: FAIL — `Failed to resolve import "../Nav"`.

- [ ] **Step 5: Write `AuroraField` and `Grain`**

`src/components/layout/AuroraField.tsx` — three drifting blooms behind everything. Motion is CSS-only so the global `prefers-reduced-motion` rule in `index.css` already freezes it; no hook needed.

```tsx
/** The fixed aurora backdrop. Purely decorative and never interactive. */
export function AuroraField() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <span className="aurora-bloom aurora-bloom-1" />
      <span className="aurora-bloom aurora-bloom-2" />
      <span className="aurora-bloom aurora-bloom-3" />
    </div>
  )
}
```

`src/components/layout/Grain.tsx` — the texture that keeps glassmorphism from reading as a Figma default:

```tsx
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='.5'/></svg>\")"

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ opacity: 0.16, backgroundImage: NOISE }}
    />
  )
}
```

Add to the `@layer components` block of `src/styles/index.css`:

```css
  .aurora-bloom {
    position: absolute;
    border-radius: 50%;
    filter: blur(58px);
    opacity: 0.62;
  }
  .aurora-bloom-1 {
    width: 560px;
    height: 560px;
    left: -170px;
    top: -230px;
    background: radial-gradient(circle, var(--aurora-violet), transparent 64%);
    animation: drift-1 34s ease-in-out infinite alternate;
  }
  .aurora-bloom-2 {
    width: 480px;
    height: 480px;
    right: -150px;
    top: 60px;
    background: radial-gradient(circle, var(--aurora-cyan), transparent 64%);
    animation: drift-2 41s ease-in-out infinite alternate;
  }
  .aurora-bloom-3 {
    width: 400px;
    height: 400px;
    left: 34%;
    top: 420px;
    opacity: 0.34;
    background: radial-gradient(circle, var(--aurora-magenta), transparent 66%);
    animation: drift-3 47s ease-in-out infinite alternate;
  }
```

…and to `@layer base`:

```css
  @keyframes drift-1 {
    to {
      transform: translate(70px, 60px) scale(1.14);
    }
  }
  @keyframes drift-2 {
    to {
      transform: translate(-60px, 80px) scale(1.1);
    }
  }
  @keyframes drift-3 {
    to {
      transform: translate(50px, -70px) scale(1.18);
    }
  }
```

- [ ] **Step 6: Write `Reveal` and `ChapterHeading`**

`src/components/ui/Reveal.tsx` — the only place Motion is called for scroll reveals, so the reduced-motion gate cannot be forgotten in a section:

```tsx
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

`src/components/ui/ChapterHeading.tsx`:

```tsx
import type { Chapter } from '../../content/types'

export function ChapterHeading({ chapter }: { chapter: Chapter }) {
  return (
    <div className="chapter" style={{ ['--accent' as string]: chapter.accent }}>
      <span className="chapter-num">{chapter.num}</span>
      <h2 className="chapter-title">{chapter.title}</h2>
      <span className="chapter-line" aria-hidden="true" />
    </div>
  )
}
```

- [ ] **Step 7: Write `Nav` and `Footer`**

`src/components/layout/Nav.tsx`:

```tsx
import { chapters } from '../../content/chapters'
import { profile } from '../../content/profile'
import { MonoLabel } from '../ui/MonoLabel'
import { StatusChip } from '../ui/StatusChip'

export function Nav({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <nav
      className="sticky top-0 z-20 border-b border-white/[0.07]"
      style={{ backdropFilter: 'blur(16px) saturate(140%)', background: 'rgba(5,6,15,0.62)' }}
    >
      <div className="shell flex items-center justify-between py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-extrabold"
            style={{ background: 'linear-gradient(135deg, var(--aurora-violet), var(--aurora-cyan))' }}
          >
            {profile.monogram}
          </span>
          <span className="text-[12.5px] font-semibold tracking-tight">{profile.name}</span>
        </a>

        <div className="flex items-center gap-4">
          {profile.availability && (
            <span className="hidden sm:inline-flex">
              <StatusChip>{profile.availability}</StatusChip>
            </span>
          )}

          <ul className="hidden items-center gap-4 md:flex">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <a
                  href={`#${chapter.id}`}
                  className="text-[11.5px] font-medium"
                  style={{ color: 'var(--text-2)' }}
                >
                  {chapter.num} {chapter.title}
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            className="rounded-[5px] border px-1.5 py-1"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
          >
            <MonoLabel>⌘K</MonoLabel>
          </button>

          <a
            href={profile.resumePath}
            download
            className="rounded-[7px] px-3 py-[7px] text-[11px] font-semibold"
            style={{ background: '#f4f6ff', color: '#05060f' }}
          >
            Résumé ↓
          </a>
        </div>
      </div>
    </nav>
  )
}
```

`src/components/layout/Footer.tsx`:

```tsx
import { profile } from '../../content/profile'
import { MonoLabel } from '../ui/MonoLabel'

export function Footer() {
  return (
    <footer className="shell mt-11 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] py-5 pb-8">
      <MonoLabel>
        {profile.name} · {profile.location}
      </MonoLabel>
      <ul className="flex gap-4">
        {profile.socials.map((social) => (
          <li key={social.label}>
            <a href={social.href} target="_blank" rel="noreferrer noopener">
              <MonoLabel>{social.label} ↗</MonoLabel>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/components/layout && npm run typecheck`
Expected: 5 PASS, typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add src/content/chapters.ts src/content/types.ts src/components/layout src/components/ui src/styles/index.css
git commit -m "feat: add aurora backdrop, grain, nav and footer

Chapters are data, so nav, section headings and the command palette all
derive from one array. Reveal is the only place Motion is called for
scroll reveals, so the reduced-motion gate cannot be forgotten."
```

---

## Task 10: Hero and proof strip

**Files:**
- Create: `src/components/sections/Hero.tsx`, `src/components/sections/ProofStrip.tsx`
- Create: `src/content/proof.ts`
- Test: `src/components/sections/__tests__/Hero.test.tsx`

**Interfaces:**
- Consumes: `profile` (Task 2), `GlassPanel`/`MonoLabel` (Task 7), `CountUp` (Task 8), `Reveal` (Task 9).
- Produces:
  - `interface ProofPoint { value: number; suffix?: string; decimals?: number; prefix?: string; label: string }` in `types.ts`
  - `proofPoints: ProofPoint[]` in `src/content/proof.ts`
  - `<Hero />`, `<ProofStrip />`

- [ ] **Step 1: Add `ProofPoint` to `src/content/types.ts` and write `src/content/proof.ts`**

```ts
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
```

`src/content/proof.ts` — the spec's point is that these four facts are the strongest on the résumé and are currently buried mid-bullet:

```ts
import type { ProofPoint } from './types'

export const proofPoints: ProofPoint[] = [
  { prefix: '~', value: 40, suffix: '%', label: ['Faster', 'deploys'] },
  { prefix: '~', value: 30, suffix: '%', label: ['Lower AWS', 'spend'] },
  { value: 5, suffix: 'yrs', label: ['Production', 'platforms'] },
  { value: 3, label: ['CKA · CKAD', 'AWS'] },
]
```

- [ ] **Step 2: Write the failing hero test**

`src/components/sections/__tests__/Hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { profile } from '../../../content/profile'
import { Hero } from '../Hero'

describe('Hero', () => {
  it('renders both halves of the headline as one heading', () => {
    render(<Hero />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(profile.headlineTop)
    expect(heading).toHaveTextContent(profile.headlineBottom)
  })

  it('shows the eyebrow and the location', () => {
    render(<Hero />)
    expect(screen.getByText(profile.eyebrow)).toBeInTheDocument()
    expect(screen.getByText(profile.location)).toBeInTheDocument()
  })

  it('shows the subline', () => {
    render(<Hero />)
    expect(screen.getByText(profile.subline)).toBeInTheDocument()
  })

  it('gives the avatar meaningful alt text', () => {
    render(<Hero />)
    expect(screen.getByAltText(profile.name)).toHaveAttribute('src', profile.avatarUrl)
  })

  it('offers a downloadable résumé and a link into the work', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: /download résumé/i })).toHaveAttribute(
      'href',
      profile.resumePath,
    )
    expect(screen.getByRole('link', { name: /see the work/i })).toHaveAttribute(
      'href',
      '#infrastructure',
    )
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/__tests__/Hero.test.tsx`
Expected: FAIL — `Failed to resolve import "../Hero"`.

- [ ] **Step 4: Write `src/components/sections/Hero.tsx`**

The gradient on `headlineBottom` is the design's focal point — the second line carries it, never the first.

```tsx
import { profile } from '../../content/profile'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

export function Hero() {
  return (
    <section id="top" className="shell pt-16 pb-13">
      <Reveal>
        <div className="mb-5 flex items-center gap-3">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            width={42}
            height={42}
            className="rounded-full border border-white/20"
            style={{ boxShadow: '0 0 0 4px rgba(124,58,237,0.16)' }}
          />
          <div className="flex flex-col gap-1.5">
            <MonoLabel>{profile.eyebrow}</MonoLabel>
            <MonoLabel style={{ color: 'rgba(244,246,255,0.28)' }}>{profile.location}</MonoLabel>
          </div>
        </div>

        <h1
          className="m-0 font-bold"
          style={{
            fontSize: 'clamp(30px, 5.4vw, 52px)',
            lineHeight: 1.03,
            letterSpacing: '-0.038em',
          }}
        >
          {profile.headlineTop}
          <br />
          <span
            style={{
              background: 'linear-gradient(96deg, #c4b5fd 6%, #67e8f9 92%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {profile.headlineBottom}
          </span>
        </h1>

        <p
          className="my-5 max-w-[50ch] text-[14.5px] leading-[1.62]"
          style={{ color: 'var(--text-2)' }}
        >
          {profile.subline}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href="#infrastructure" className="btn-primary">
            See the work ↓
          </a>
          <a href={profile.resumePath} download className="btn-glass">
            Download résumé
          </a>
        </div>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 5: Write `src/components/sections/ProofStrip.tsx`**

```tsx
import { proofPoints } from '../../content/proof'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { Reveal } from '../ui/Reveal'

export function ProofStrip() {
  return (
    <section className="shell" aria-label="Impact at a glance">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {proofPoints.map((point, index) => (
          <Reveal key={point.label.join(' ')} delay={index * 0.07}>
            <GlassPanel glow className="relative h-full overflow-hidden px-3.5 py-3.5">
              <span
                aria-hidden="true"
                className="absolute inset-x-3 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
                }}
              />
              <div
                className="font-bold"
                style={{ fontSize: 26, lineHeight: 1, letterSpacing: '-0.045em' }}
              >
                {point.prefix}
                <CountUp value={point.value} decimals={point.decimals ?? 0} />
                {point.suffix && <span style={{ fontSize: 16 }}>{point.suffix}</span>}
              </div>
              <div
                className="mt-[7px]"
                style={{
                  font: '500 10px/1.35 var(--font-mono)',
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}
              >
                {point.label[0]}
                <br />
                {point.label[1]}
              </div>
            </GlassPanel>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/sections && npm run typecheck`
Expected: 5 PASS, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/content/proof.ts src/content/types.ts src/components/sections
git commit -m "feat: add hero and proof strip

The four numbers in the proof strip are the strongest facts on the résumé
and were previously buried mid-bullet. Gradient fill lands on the second
headline line only, per the approved design."
```

---

## Task 11: Infrastructure chapter and the pipeline diagram

**Files:**
- Create: `src/content/pipeline.ts`
- Modify: `src/content/types.ts` (add `PipelineNode`)
- Create: `src/components/diagrams/PipelineDiagram.tsx`, `src/components/sections/Infrastructure.tsx`
- Test: `src/components/sections/__tests__/Infrastructure.test.tsx`

**Interfaces:**
- Consumes: `experience` (Task 2), `chapters` (Task 9), `GlassPanel`/`MonoLabel`/`Tag`/`Reveal`/`ChapterHeading`, `useReducedMotion`.
- Produces:
  - `interface PipelineNode { name: string; detail: string }` in `types.ts`
  - `pipelineNodes: PipelineNode[]`, `supportingTools: string[]` in `src/content/pipeline.ts`
  - `<PipelineDiagram />`, `<Infrastructure />`

**This is the centrepiece.** The spec is explicit that it must *demonstrate* rather than assert: a single deploy token travels `Git → CI → ECR → ArgoCD → EKS` driven by scroll position, not a timer. Under reduced motion the token is not rendered at all — the diagram still reads perfectly as a static schematic.

- [ ] **Step 1: Add `PipelineNode` to `types.ts` and write `src/content/pipeline.ts`**

```ts
export interface PipelineNode {
  name: string
  /** The real tooling behind this stage, rendered small beneath the name. */
  detail: string
}
```

```ts
import type { PipelineNode } from './types'

export const pipelineNodes: PipelineNode[] = [
  { name: 'GIT', detail: 'github · gitlab' },
  { name: 'CI', detail: 'actions · gitlab-ci' },
  { name: 'ECR', detail: 'image registry' },
  { name: 'ARGOCD', detail: 'gitops · helm' },
  { name: 'EKS', detail: 'karpenter' },
]

/** Rendered beneath the flow, under a dashed rule. */
export const supportingTools = ['Prometheus', 'Grafana', 'Loki', 'Terraform', 'Crossplane']
```

- [ ] **Step 2: Write the failing test**

`src/components/sections/__tests__/Infrastructure.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { experience } from '../../../content/experience'
import { pipelineNodes, supportingTools } from '../../../content/pipeline'
import { Infrastructure } from '../Infrastructure'

describe('Infrastructure', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Infrastructure />)
    expect(container.querySelector('#infrastructure')).not.toBeNull()
  })

  it('names every stage of the pipeline', () => {
    render(<Infrastructure />)
    for (const node of pipelineNodes) {
      expect(screen.getByText(node.name)).toBeInTheDocument()
    }
  })

  it('names the supporting tools', () => {
    render(<Infrastructure />)
    // getAllByText, not getByText: Prometheus, Grafana, Loki, Terraform and
    // Crossplane each appear both under the pipeline and as an outcome tag.
    for (const tool of supportingTools) {
      expect(screen.getAllByText(tool).length).toBeGreaterThan(0)
    }
  })

  it('renders all four outcome cards with their metric attached to the heading', () => {
    render(<Infrastructure />)
    for (const outcome of experience.outcomes) {
      const heading = screen.getByRole('heading', { name: new RegExp(outcome.title, 'i') })
      expect(heading).toHaveTextContent(outcome.metric)
    }
  })

  it('lists the tools behind each outcome', () => {
    render(<Infrastructure />)
    for (const tool of experience.outcomes.flatMap((o) => o.tools)) {
      expect(screen.getAllByText(tool).length).toBeGreaterThan(0)
    }
  })

  it('states the role and employer', () => {
    render(<Infrastructure />)
    expect(screen.getByText(new RegExp(experience.company, 'i'))).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/__tests__/Infrastructure.test.tsx`
Expected: FAIL — import unresolved.

- [ ] **Step 4: Write `src/components/diagrams/PipelineDiagram.tsx`**

```tsx
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { pipelineNodes, supportingTools } from '../../content/pipeline'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'

export function PipelineDiagram() {
  const reduced = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)

  // Token position is a function of how far the diagram has travelled through
  // the viewport — the spec calls for scroll-driven, not a timer.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.85', 'end 0.4'],
  })
  const tokenLeft = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const tokenOpacity = useTransform(scrollYProgress, [0, 0.06, 0.94, 1], [0, 1, 1, 0])

  return (
    <GlassPanel className="overflow-hidden px-5 pt-5 pb-4.5">
      <div className="mb-5 flex justify-between gap-3">
        <MonoLabel>Fig. 01 — Delivery path in production</MonoLabel>
        <MonoLabel style={{ color: 'var(--accent-cyan)' }}>Live</MonoLabel>
      </div>

      <div ref={trackRef} className="relative">
        {!reduced && (
          <motion.span
            aria-hidden="true"
            className="absolute -top-[3px] z-10 h-[7px] w-[7px] rounded-full"
            style={{
              left: tokenLeft,
              opacity: tokenOpacity,
              top: 'calc(50% - 3.5px)',
              background: '#67e8f9',
              boxShadow: '0 0 12px 3px rgba(103,232,249,0.7)',
            }}
          />
        )}

        <ol className="flex list-none items-center gap-0 p-0">
          {pipelineNodes.map((node, index) => (
            <li key={node.name} className="contents">
              <div
                className="shrink-0 rounded-[7px] px-2 py-2.5 text-center"
                style={{
                  border: '1px solid rgba(34,211,238,0.42)',
                  background: 'rgba(34,211,238,0.07)',
                }}
              >
                <div
                  style={{
                    font: '600 9px/1.15 var(--font-mono)',
                    letterSpacing: '0.06em',
                    color: '#a5f3fc',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.name}
                </div>
                <div
                  className="mt-1"
                  style={{
                    font: '500 7.5px/1 var(--font-mono)',
                    color: 'rgba(165,243,252,0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.detail}
                </div>
              </div>
              {index < pipelineNodes.length - 1 && (
                <span
                  aria-hidden="true"
                  className="h-px min-w-2 flex-1"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(34,211,238,0.22), rgba(34,211,238,0.55))',
                  }}
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      <ul className="mt-4.5 flex list-none gap-2 border-t border-dashed border-white/[0.11] p-0 pt-4">
        {supportingTools.map((tool) => (
          <li
            key={tool}
            className="flex-1 rounded-[7px] border border-white/10 py-2 text-center"
            style={{
              font: '600 8.5px/1 var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-2)',
            }}
          >
            {tool}
          </li>
        ))}
      </ul>
    </GlassPanel>
  )
}
```

- [ ] **Step 5: Write `src/components/sections/Infrastructure.tsx`**

```tsx
import { chapters } from '../../content/chapters'
import { experience } from '../../content/experience'
import { ChapterHeading } from '../ui/ChapterHeading'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'
import { Tag } from '../ui/Tag'
import { PipelineDiagram } from '../diagrams/PipelineDiagram'

const chapter = chapters[0]

export function Infrastructure() {
  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      <Reveal>
        <PipelineDiagram />
      </Reveal>

      <Reveal delay={0.08}>
        <MonoLabel as="p" className="mt-4 mb-3 block">
          {experience.role} · {experience.company} · {experience.location} · {experience.period}
        </MonoLabel>
      </Reveal>

      <div className="grid gap-2.5 md:grid-cols-2">
        {experience.outcomes.map((outcome, index) => (
          <Reveal key={outcome.title} delay={0.06 * index}>
            <GlassPanel glow className="h-full px-3.5 py-3.5">
              <h3 className="m-0 flex items-center gap-2 text-[13px] font-bold tracking-tight">
                {outcome.title}
                <span className="metric-chip" style={{ ['--chip' as string]: chapter.accent }}>
                  {outcome.metric}
                </span>
              </h3>
              <p className="my-2.5 text-[11.8px] leading-[1.55]" style={{ color: 'var(--text-2)' }}>
                {outcome.body}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {outcome.tools.map((tool) => (
                  <Tag key={tool}>{tool}</Tag>
                ))}
              </div>
            </GlassPanel>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/sections && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/content/pipeline.ts src/content/types.ts src/components/diagrams src/components/sections/Infrastructure.tsx
git commit -m "feat: add infrastructure chapter with scroll-driven pipeline diagram

The deploy token's position is a function of scroll progress rather than a
timer. Under reduced motion the token is not rendered and the diagram
still reads as a static schematic."
```

---

## Task 12: Products chapter

**Files:**
- Create: `src/components/sections/Products.tsx`, `src/components/ui/ProductCard.tsx`
- Test: `src/components/sections/__tests__/Products.test.tsx`

**Interfaces:**
- Consumes: `products` (Task 2), `chapters` (Task 9), `CopyableCommand` (Task 8), `GlassPanel`/`Tag`/`MonoLabel`/`Reveal`/`ChapterHeading`.
- Produces: `<ProductCard product={Product} />`, `<Products />`

The featured product renders wider and violet-tinted. Per Global Constraints the flag — not array position — decides which one, so reordering the array cannot silently move the hero treatment.

- [ ] **Step 1: Write the failing test**

`src/components/sections/__tests__/Products.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { products } from '../../../content/products'
import { Products } from '../Products'

describe('Products', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Products />)
    expect(container.querySelector('#products')).not.toBeNull()
  })

  it('renders every product', () => {
    render(<Products />)
    for (const product of products) {
      expect(screen.getByRole('heading', { name: product.name })).toBeInTheDocument()
    }
  })

  it('shows each product tagline and problem statement', () => {
    render(<Products />)
    for (const product of products) {
      expect(screen.getByText(product.tagline)).toBeInTheDocument()
    }
  })

  it('renders every product link as an external link', () => {
    render(<Products />)
    for (const product of products) {
      for (const link of product.links) {
        const anchor = screen.getByRole('link', { name: new RegExp(link.label, 'i') })
        expect(anchor).toHaveAttribute('href', link.href)
        expect(anchor).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
      }
    }
  })

  it('renders a copyable install command only for products that have one', () => {
    render(<Products />)
    const withInstall = products.filter((p) => p.install)
    expect(screen.getAllByRole('button', { name: /copy command/i })).toHaveLength(withInstall.length)
    for (const product of withInstall) {
      expect(screen.getByText(product.install!.command)).toBeInTheDocument()
    }
  })

  it('marks the featured product so it is visually distinct', () => {
    const { container } = render(<Products />)
    const featured = products.find((p) => p.featured)!
    const cards = container.querySelectorAll('[data-featured="true"]')
    expect(cards).toHaveLength(1)
    expect(within(cards[0] as HTMLElement).getByRole('heading')).toHaveTextContent(featured.name)
  })

  it('shows the status badge for each product', () => {
    render(<Products />)
    for (const product of products) {
      expect(screen.getAllByText(new RegExp(product.status, 'i')).length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/__tests__/Products.test.tsx`
Expected: FAIL — import unresolved.

- [ ] **Step 3: Write `src/components/ui/ProductCard.tsx`**

```tsx
import type { Product } from '../../content/types'
import { CopyableCommand } from './CopyableCommand'
import { GlassPanel } from './GlassPanel'
import { MonoLabel } from './MonoLabel'
import { Tag } from './Tag'

export function ProductCard({ product }: { product: Product }) {
  const featured = product.featured === true

  return (
    <GlassPanel
      as="article"
      glow
      data-featured={featured ? 'true' : 'false'}
      className="h-full px-4 py-4"
      style={
        featured
          ? {
              borderColor: 'rgba(167,139,250,0.38)',
              background:
                'linear-gradient(150deg, rgba(167,139,250,0.10), rgba(255,255,255,0.035))',
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="m-0 text-[16px] font-bold" style={{ letterSpacing: '-0.025em' }}>
          {product.name}
        </h3>
        <span
          style={{
            font: '600 8.5px/1 var(--font-mono)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--status-green)',
            border: '1px solid rgba(134,239,172,0.3)',
            background: 'rgba(134,239,172,0.08)',
            padding: '4.5px 7px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {product.status}
        </span>
      </div>

      <p className="mt-2 text-[11.5px] leading-[1.5] font-medium" style={{ color: 'var(--text-2)' }}>
        {product.tagline}
      </p>
      <p className="mt-2 text-[11.3px] leading-[1.55]" style={{ color: 'var(--text-3)' }}>
        {product.problem}
      </p>

      {product.install && (
        <CopyableCommand label={product.install.label} command={product.install.command} />
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {product.stack.map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3.5">
        {product.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              font: '600 10px/1 var(--font-mono)',
              letterSpacing: '0.08em',
              color: '#c4b5fd',
            }}
          >
            {link.label} ↗
          </a>
        ))}
        {typeof product.stars === 'number' && (
          <MonoLabel aria-label={`${product.stars} GitHub stars`}>★ {product.stars}</MonoLabel>
        )}
      </div>
    </GlassPanel>
  )
}
```

- [ ] **Step 4: Write `src/components/sections/Products.tsx`**

```tsx
import { chapters } from '../../content/chapters'
import { products } from '../../content/products'
import { ChapterHeading } from '../ui/ChapterHeading'
import { ProductCard } from '../ui/ProductCard'
import { Reveal } from '../ui/Reveal'

const chapter = chapters[1]

export function Products() {
  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <Reveal
            key={product.slug}
            delay={0.06 * index}
            className={product.featured ? 'md:col-span-2' : ''}
          >
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/sections && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Products.tsx src/components/ui/ProductCard.tsx
git commit -m "feat: add products chapter with featured card and install commands

The featured flag, not array position, drives the hero treatment, so
reordering products cannot silently move it. Install commands render only
where a product has one."
```

---

## Task 13: Writing chapter and the cadence heatmap

**Files:**
- Create: `src/lib/archive.ts`
- Create: `src/components/diagrams/CadenceHeatmap.tsx`, `src/components/sections/Writing.tsx`
- Test: `src/components/diagrams/__tests__/CadenceHeatmap.test.tsx`, `src/components/sections/__tests__/Writing.test.tsx`

**Interfaces:**
- Consumes: `deriveCadence`, `deriveHeatmap`, `HeatmapWeek` (Task 4), `MEDIUM_PROFILE_URL`/`TOPIC_STOPLIST` (Task 2), the archive JSON (Task 6), `CountUp` (Task 8).
- Produces:
  - `archive: ArticleArchive` in `src/lib/archive.ts` — the single typed import of the JSON
  - `<CadenceHeatmap weeks={HeatmapWeek[]} firstSeenAt={string} />`
  - `<Writing archive?={ArticleArchive} now?={Date} />` — both props default to the real archive and the current date, and exist so tests can inject a fixture instead of depending on live data

**Both components take their data as props.** If `Writing` read the archive JSON directly, its tests would break every morning when the cron adds a post. That is the reason for the injection, not testing dogma.

- [ ] **Step 1: Write `src/lib/archive.ts`**

```ts
import raw from '../content/articles.archive.json'
import type { ArticleArchive } from '../content/types'

/** The single typed entry point to the machine-written archive. */
export const archive = raw as ArticleArchive
```

- [ ] **Step 2: Write the failing heatmap test**

`src/components/diagrams/__tests__/CadenceHeatmap.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { HeatmapWeek } from '../../../lib/articles'
import { CadenceHeatmap } from '../CadenceHeatmap'

function week(weekStartISO: string, counts: number[]): HeatmapWeek {
  return {
    weekStartISO,
    days: counts.map((count, index) => {
      const date = new Date(`${weekStartISO}T00:00:00.000Z`)
      date.setUTCDate(date.getUTCDate() + index)
      return { date: date.toISOString().slice(0, 10), count }
    }),
  }
}

const WEEKS: HeatmapWeek[] = [
  week('2026-08-17', [0, 1, 1, 1, 1, 0, 0]),
  week('2026-08-24', [0, 1, 1, 1, 1, 0, 0]),
  week('2026-08-31', [0, 1, 2, 0, 0, 0, 0]),
]

describe('CadenceHeatmap', () => {
  it('renders one cell per day across every week', () => {
    const { container } = render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(21)
  })

  it('marks days with posts and leaves empty days unmarked', () => {
    const { container } = render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    // WEEKS holds 11 zero-days, 9 single-post days and 1 double-post day.
    expect(container.querySelectorAll('[data-level="0"]')).toHaveLength(11)
    expect(container.querySelectorAll('[data-level="1"]')).toHaveLength(9)
    expect(container.querySelectorAll('[data-level="2"]')).toHaveLength(1)
  })

  it('exposes an accessible summary rather than a wall of unlabelled divs', () => {
    render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    const grid = screen.getByRole('img')
    // 4 + 4 + 3 posts across the three fixture weeks.
    expect(grid).toHaveAccessibleName(/11 posts across 3 weeks/i)
  })

  it('states when tracking began, so a young archive is not read as a gap', () => {
    render(<CadenceHeatmap weeks={WEEKS} firstSeenAt="2026-09-03" />)
    expect(screen.getByText(/tracking since/i)).toBeInTheDocument()
  })

  it('renders nothing when there are no weeks', () => {
    const { container } = render(<CadenceHeatmap weeks={[]} firstSeenAt="2026-09-03" />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 3: Write the failing writing-section test**

`src/components/sections/__tests__/Writing.test.tsx`:

```tsx
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
```

- [ ] **Step 4: Run both tests to verify they fail**

Run: `npx vitest run src/components/diagrams src/components/sections/__tests__/Writing.test.tsx`
Expected: FAIL — both imports unresolved.

- [ ] **Step 5: Write `src/components/diagrams/CadenceHeatmap.tsx`**

```tsx
import type { HeatmapWeek } from '../../lib/articles'
import { MonoLabel } from '../ui/MonoLabel'
import { GlassPanel } from '../ui/GlassPanel'

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function levelOf(count: number): 0 | 1 | 2 {
  if (count === 0) return 0
  return count === 1 ? 1 : 2
}

const LEVEL_STYLE: Record<0 | 1 | 2, { background: string; borderColor: string; boxShadow?: string }> = {
  0: { background: 'rgba(255,255,255,0.028)', borderColor: 'rgba(255,255,255,0.075)' },
  1: { background: 'rgba(45,212,191,0.32)', borderColor: 'rgba(45,212,191,0.4)' },
  2: {
    background: 'rgba(45,212,191,0.62)',
    borderColor: 'rgba(45,212,191,0.7)',
    boxShadow: '0 0 9px rgba(45,212,191,0.45)',
  },
}

export function CadenceHeatmap({
  weeks,
  firstSeenAt,
}: {
  weeks: HeatmapWeek[]
  firstSeenAt: string
}) {
  if (weeks.length === 0) return null

  const total = weeks.reduce(
    (sum, week) => sum + week.days.reduce((weekSum, day) => weekSum + day.count, 0),
    0,
  )

  return (
    <GlassPanel className="mb-3 px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <MonoLabel>Publishing cadence — last {weeks.length} weeks</MonoLabel>
        <MonoLabel style={{ color: 'var(--accent-teal)' }}>Auto-updated daily</MonoLabel>
      </div>

      <div className="flex items-start gap-[7px] overflow-x-auto">
        <div className="flex shrink-0 flex-col gap-[3.5px]">
          {DAY_LABELS.map((label, index) => (
            <span
              key={index}
              style={{
                height: 15,
                font: '600 8px/15px var(--font-mono)',
                color: 'var(--text-3)',
                letterSpacing: '0.08em',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div
          role="img"
          aria-label={`Publishing heatmap: ${total} posts across ${weeks.length} weeks`}
          className="flex gap-[3.5px]"
        >
          {weeks.map((week) => (
            <div key={week.weekStartISO} className="flex flex-col gap-[3.5px]">
              {week.days.map((day) => {
                const level = levelOf(day.count)
                return (
                  <span
                    key={day.date}
                    data-cell
                    data-level={level}
                    title={`${day.date}: ${day.count} post${day.count === 1 ? '' : 's'}`}
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 3,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      ...LEVEL_STYLE[level],
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 max-w-[70ch]" style={{ font: '500 9px/1.5 var(--font-mono)', color: 'var(--text-3)' }}>
        Tracking since {firstSeenAt}. Medium's feed exposes only the latest ten posts, so history
        deepens from the first build onward.
      </p>
    </GlassPanel>
  )
}
```

- [ ] **Step 6: Write `src/components/sections/Writing.tsx`**

```tsx
import { chapters } from '../../content/chapters'
import type { ArticleArchive } from '../../content/types'
import { MEDIUM_PROFILE_URL, TOPIC_STOPLIST } from '../../content/writing'
import { archive as liveArchive } from '../../lib/archive'
import { deriveCadence, deriveHeatmap } from '../../lib/articles'
import { CadenceHeatmap } from '../diagrams/CadenceHeatmap'
import { ChapterHeading } from '../ui/ChapterHeading'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'
import { Tag } from '../ui/Tag'

const chapter = chapters[2]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function Writing({
  archive = liveArchive,
  now = new Date(),
}: {
  archive?: ArticleArchive
  now?: Date
}) {
  const cadence = deriveCadence(archive, now, TOPIC_STOPLIST)
  const weeks = deriveHeatmap(archive, now)
  const [featured, ...rest] = archive.articles

  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      {featured === undefined ? (
        <GlassPanel className="px-4 py-5">
          <p style={{ color: 'var(--text-2)' }}>
            No articles yet — the feed sync will populate this on the next build.
          </p>
        </GlassPanel>
      ) : (
        <>
          <Reveal>
            <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
              <GlassPanel glow className="px-3.5 py-3.5">
                <div className="font-bold" style={{ fontSize: 25, letterSpacing: '-0.045em' }}>
                  <CountUp value={cadence.postCount} /> <span className="text-[14px]">posts</span>
                </div>
                <MonoLabel className="mt-[7px] block">Tracked to date</MonoLabel>
              </GlassPanel>

              <GlassPanel glow className="px-3.5 py-3.5">
                <div className="font-bold" style={{ fontSize: 25, letterSpacing: '-0.045em' }}>
                  <CountUp value={cadence.perWeek} decimals={1} />
                  <span className="text-[14px]">/wk</span>
                </div>
                <MonoLabel className="mt-[7px] block">Publishing cadence</MonoLabel>
              </GlassPanel>

              <GlassPanel glow data-testid="top-topic" className="col-span-2 px-3.5 py-3.5 md:col-span-1">
                <div className="font-bold" style={{ fontSize: 25, letterSpacing: '-0.045em' }}>
                  {cadence.topTopic ?? '—'}
                </div>
                <MonoLabel className="mt-[7px] block">Most-written topic</MonoLabel>
              </GlassPanel>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <CadenceHeatmap weeks={weeks} firstSeenAt={archive.firstSeenAt} />
          </Reveal>

          <Reveal delay={0.1}>
            <GlassPanel
              glow
              className="mb-2.5 px-5 py-4.5"
              style={{
                borderColor: 'rgba(94,234,212,0.34)',
                background: 'linear-gradient(150deg, rgba(45,212,191,0.10), rgba(255,255,255,0.035))',
              }}
            >
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <h3 className="m-0 max-w-[34ch] text-[20px] font-bold" style={{ letterSpacing: '-0.03em', lineHeight: 1.22 }}>
                  <a href={featured.url} target="_blank" rel="noreferrer noopener">
                    {featured.title}
                  </a>
                </h3>
                <MonoLabel style={{ color: 'var(--accent-teal)', whiteSpace: 'nowrap' }}>
                  Latest · {formatDate(featured.publishedAt)}
                </MonoLabel>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {featured.topics.slice(0, 4).map((topic) => (
                  <Tag key={topic}>{topic}</Tag>
                ))}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.14}>
            <GlassPanel className="overflow-hidden">
              <ul className="m-0 list-none p-0">
                {rest.slice(0, 6).map((item) => (
                  <li
                    key={item.guid}
                    className="flex items-center gap-3.5 border-b border-white/[0.055] px-4 py-3 last:border-b-0"
                  >
                    <MonoLabel style={{ width: 56, flexShrink: 0 }}>
                      {formatDate(item.publishedAt)}
                    </MonoLabel>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="min-w-0 flex-1 text-[12.8px] leading-[1.4] font-medium"
                    >
                      {item.title}
                    </a>
                    <MonoLabel style={{ color: 'var(--accent-teal)', flexShrink: 0 }}>
                      {item.topics[0] ?? ''}
                    </MonoLabel>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.18}>
            <GlassPanel className="mt-2.5 flex items-center justify-between gap-3 px-4 py-3.5">
              <MonoLabel>{archive.articles.length} articles tracked</MonoLabel>
              <a
                href={MEDIUM_PROFILE_URL}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  font: '600 10.5px/1 var(--font-mono)',
                  letterSpacing: '0.1em',
                  color: 'var(--accent-teal)',
                }}
              >
                Follow on Medium ↗
              </a>
            </GlassPanel>
          </Reveal>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/components && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add src/lib/archive.ts src/components/diagrams/CadenceHeatmap.tsx src/components/sections/Writing.tsx
git commit -m "feat: add writing chapter with cadence tiles and publishing heatmap

Everything derives from the archive at render time — nothing is
hand-maintained. Both components take data as props so their tests do not
break every morning when the cron adds a post. The heatmap carries an
accessible summary and states when tracking began."
```

---

## Task 14: Teaching chapter and credentials

**Files:**
- Create: `src/components/sections/Teaching.tsx`, `src/components/sections/Credentials.tsx`
- Test: `src/components/sections/__tests__/Teaching.test.tsx`

**Interfaces:**
- Consumes: `guides` + `certifications` + `education` (Task 2), `chapters` (Task 9).
- Produces: `<Teaching />`, `<Credentials />`

`Certification.verifyUrl` is optional and currently absent for all three — an open item in the spec. A badge with no URL must render as plain text, never as a dead link.

- [ ] **Step 1: Write the failing test**

`src/components/sections/__tests__/Teaching.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { certifications } from '../../../content/certifications'
import { education } from '../../../content/experience'
import { guides } from '../../../content/guides'
import { Credentials } from '../Credentials'
import { Teaching } from '../Teaching'

describe('Teaching', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Teaching />)
    expect(container.querySelector('#teaching')).not.toBeNull()
  })

  it('links every guide to its repository', () => {
    render(<Teaching />)
    for (const guide of guides) {
      expect(screen.getByRole('link', { name: new RegExp(guide.name, 'i') })).toHaveAttribute(
        'href',
        guide.repo,
      )
    }
  })

  it('shows the day count for guides that have one', () => {
    render(<Teaching />)
    const withDays = guides.filter((g) => typeof g.days === 'number')
    for (const guide of withDays) {
      expect(screen.getByText(`${guide.days}-day`)).toBeInTheDocument()
    }
  })
})

describe('Credentials', () => {
  it('lists every certification', () => {
    render(<Credentials />)
    for (const certification of certifications) {
      expect(screen.getByText(certification.abbr)).toBeInTheDocument()
      expect(screen.getByText(certification.name)).toBeInTheDocument()
    }
  })

  it('renders a certification without a verify URL as plain text, not a dead link', () => {
    render(<Credentials />)
    const unverifiable = certifications.filter((c) => !c.verifyUrl)
    for (const certification of unverifiable) {
      expect(screen.queryByRole('link', { name: new RegExp(certification.abbr, 'i') })).toBeNull()
    }
  })

  it('shows the degree and institution', () => {
    render(<Credentials />)
    expect(screen.getByText(education.degree)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(education.institution, 'i'))).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/__tests__/Teaching.test.tsx`
Expected: FAIL — imports unresolved.

- [ ] **Step 3: Write `src/components/sections/Teaching.tsx`**

```tsx
import { chapters } from '../../content/chapters'
import { guides } from '../../content/guides'
import { ChapterHeading } from '../ui/ChapterHeading'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

const chapter = chapters[3]

export function Teaching() {
  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide, index) => (
          <Reveal key={guide.name} delay={0.04 * index}>
            <GlassPanel glow className="h-full px-3.5 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={guide.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[13px] font-bold"
                  style={{ letterSpacing: '-0.015em', fontFamily: 'var(--font-mono)' }}
                >
                  {guide.name}
                </a>
                {typeof guide.days === 'number' && (
                  <span className="metric-chip" style={{ ['--chip' as string]: chapter.accent }}>
                    {guide.days}-day
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-[1.5]" style={{ color: 'var(--text-2)' }}>
                {guide.description}
              </p>
            </GlassPanel>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <MonoLabel as="p" className="mt-3 block">
          {guides.length} structured guides · open source on GitHub
        </MonoLabel>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 4: Write `src/components/sections/Credentials.tsx`**

```tsx
import { certifications } from '../../content/certifications'
import { education } from '../../content/experience'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

export function Credentials() {
  return (
    <section id="credentials" className="shell mt-13 scroll-mt-20" aria-label="Credentials">
      <Reveal>
        <MonoLabel as="p" className="mb-3 block">
          Certifications
        </MonoLabel>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {certifications.map((certification) => (
            <GlassPanel glow key={certification.abbr} className="px-3.5 py-3.5">
              <div className="text-[15px] font-bold" style={{ letterSpacing: '-0.02em' }}>
                {certification.verifyUrl ? (
                  <a href={certification.verifyUrl} target="_blank" rel="noreferrer noopener">
                    {certification.abbr} ↗
                  </a>
                ) : (
                  certification.abbr
                )}
              </div>
              <p className="mt-2 text-[11.5px] leading-[1.45]" style={{ color: 'var(--text-2)' }}>
                {certification.name}
              </p>
              <MonoLabel className="mt-2 block">{certification.issuer}</MonoLabel>
            </GlassPanel>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <MonoLabel as="p" className="mt-6 mb-3 block">
          Education
        </MonoLabel>
        <GlassPanel className="flex flex-wrap items-baseline justify-between gap-3 px-3.5 py-3.5">
          <div>
            <div className="text-[14px] font-bold" style={{ letterSpacing: '-0.02em' }}>
              {education.degree}
            </div>
            <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--text-2)' }}>
              {education.institution} — {education.location}
            </p>
          </div>
          <MonoLabel>{education.period}</MonoLabel>
        </GlassPanel>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Teaching.tsx src/components/sections/Credentials.tsx
git commit -m "feat: add teaching chapter and credentials

The learn-* series was invisible on the previous site. Certifications
without a verification URL render as plain text rather than dead links,
since those URLs are still an open item."
```

---

## Task 15: Contact section

**Files:**
- Create: `src/components/sections/Contact.tsx`
- Modify: `src/content/types.ts` (add `ContactCopy`), create `src/content/contact.ts`
- Create: `.env.example`
- Test: `src/components/sections/__tests__/Contact.test.tsx`

**Interfaces:**
- Consumes: `profile` (Task 2), `GlassPanel`/`MonoLabel`/`Reveal`.
- Produces: `<Contact accessKey?={string} />` — defaults to `import.meta.env.VITE_WEB3FORMS_KEY`, injected in tests
- Produces: `contactCopy: ContactCopy` in `src/content/contact.ts`

**Why this task matters beyond features:** the previous site POSTed to `http://localhost:5000`, so every message sent through the live site was silently lost. The fallback path is therefore not a nicety — without an access key configured, the section must present a working `mailto:` route rather than a form that pretends to submit.

- [ ] **Step 1: Add `ContactCopy` to `types.ts` and write `src/content/contact.ts`**

```ts
export interface ContactCopy {
  heading: string
  blurb: string
  /** Shown in place of the form when no Web3Forms key is configured. */
  fallbackBlurb: string
  submitIdle: string
  submitPending: string
  successMessage: string
  errorMessage: string
  validationMessage: string
}
```

```ts
import type { ContactCopy } from './types'

export const contactCopy: ContactCopy = {
  heading: 'Open to interesting problems',
  blurb:
    'Platform work, product work, or something that needs both. Drop a line and I will get back to you.',
  fallbackBlurb: 'Email is the fastest route to me.',
  submitIdle: 'Send message',
  submitPending: 'Sending…',
  successMessage: "Thanks — that came through. I'll reply shortly.",
  errorMessage: 'That did not send. Email me directly and I will pick it up.',
  validationMessage: 'Please fill in your name, email and a message.',
}
```

- [ ] **Step 2: Write `.env.example`**

```
# Web3Forms access key. Without it the contact section falls back to a mailto link.
# Free key from https://web3forms.com — it is a public key, safe to commit to CI.
VITE_WEB3FORMS_KEY=
```

- [ ] **Step 3: Write the failing test**

`src/components/sections/__tests__/Contact.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contactCopy } from '../../../content/contact'
import { profile } from '../../../content/profile'
import { Contact } from '../Contact'

const KEY = 'test-access-key'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function fillForm() {
  await userEvent.type(screen.getByLabelText(/name/i), 'Ada Lovelace')
  await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
  await userEvent.type(screen.getByLabelText(/message/i), 'Interested in your platform work.')
}

describe('Contact without an access key', () => {
  it('offers a mailto link instead of a form that cannot submit', () => {
    render(<Contact accessKey="" />)
    expect(screen.getByRole('link', { name: new RegExp(profile.email, 'i') })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    )
    expect(screen.queryByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') })).toBeNull()
  })
})

describe('Contact with an access key', () => {
  it('renders the form fields', () => {
    render(<Contact accessKey={KEY} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('refuses to submit an incomplete form and does not call the API', async () => {
    render(<Contact accessKey={KEY} />)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.validationMessage)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('posts the message to Web3Forms with the access key', async () => {
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.web3forms.com/submit')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.access_key).toBe(KEY)
    expect(body.email).toBe('ada@example.com')
    expect(body.message).toBe('Interested in your platform work.')
  })

  it('confirms success to the user', async () => {
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.successMessage)).toBeInTheDocument()
  })

  it('reports a failed submission and still offers the email address', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(profile.email, 'i') })).toBeInTheDocument()
  })

  it('reports a network failure rather than hanging', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    render(<Contact accessKey={KEY} />)
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(contactCopy.submitIdle, 'i') }))
    expect(await screen.findByText(contactCopy.errorMessage)).toBeInTheDocument()
  })

  it('lists the direct channels alongside the form', () => {
    render(<Contact accessKey={KEY} />)
    for (const social of profile.socials) {
      expect(screen.getByRole('link', { name: new RegExp(social.label, 'i') })).toHaveAttribute(
        'href',
        social.href,
      )
    }
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/__tests__/Contact.test.tsx`
Expected: FAIL — import unresolved.

- [ ] **Step 5: Write `src/components/sections/Contact.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { contactCopy } from '../../content/contact'
import { profile } from '../../content/profile'
import { GlassPanel } from '../ui/GlassPanel'
import { MonoLabel } from '../ui/MonoLabel'
import { Reveal } from '../ui/Reveal'

const ENDPOINT = 'https://api.web3forms.com/submit'

type Status = 'idle' | 'pending' | 'success' | 'error' | 'invalid'

const fieldClass =
  'w-full rounded-[7px] border border-white/10 bg-black/30 px-3 py-2.5 text-[12.5px] outline-none'

function DirectChannels() {
  return (
    <ul className="mt-4 flex flex-wrap gap-4 p-0" style={{ listStyle: 'none' }}>
      <li>
        <a href={`mailto:${profile.email}`}>
          <MonoLabel>{profile.email}</MonoLabel>
        </a>
      </li>
      {profile.socials.map((social) => (
        <li key={social.label}>
          <a href={social.href} target="_blank" rel="noreferrer noopener">
            <MonoLabel>{social.label} ↗</MonoLabel>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Contact({
  accessKey = import.meta.env.VITE_WEB3FORMS_KEY ?? '',
}: {
  accessKey?: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((previous) => ({ ...previous, [field]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('invalid')
      return
    }

    setStatus('pending')
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Portfolio enquiry from ${form.name}`,
          from_name: form.name,
          ...form,
        }),
      })
      setStatus(response.ok ? 'success' : 'error')
      if (response.ok) setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="shell mt-13 scroll-mt-20">
      <Reveal>
        <GlassPanel className="px-5 py-5">
          <h2 className="m-0 text-[21px] font-bold" style={{ letterSpacing: '-0.028em' }}>
            {contactCopy.heading}
          </h2>

          {/* No key configured: present a route that actually works rather than a
              form that silently discards the message, as the old site did. */}
          {accessKey === '' ? (
            <>
              <p className="mt-2.5 max-w-[54ch] text-[13px]" style={{ color: 'var(--text-2)' }}>
                {contactCopy.fallbackBlurb}
              </p>
              <DirectChannels />
            </>
          ) : (
            <>
              <p className="mt-2.5 max-w-[54ch] text-[13px]" style={{ color: 'var(--text-2)' }}>
                {contactCopy.blurb}
              </p>

              <form onSubmit={submit} className="mt-4 grid gap-2.5 sm:grid-cols-2" noValidate>
                <label className="flex flex-col gap-1.5">
                  <MonoLabel>Name</MonoLabel>
                  <input className={fieldClass} value={form.name} onChange={update('name')} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <MonoLabel>Email</MonoLabel>
                  <input
                    type="email"
                    className={fieldClass}
                    value={form.email}
                    onChange={update('email')}
                  />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <MonoLabel>Message</MonoLabel>
                  <textarea
                    rows={5}
                    className={fieldClass}
                    value={form.message}
                    onChange={update('message')}
                  />
                </label>

                {/* Web3Forms spam honeypot — hidden from users, filled only by bots. */}
                <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} />

                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary" disabled={status === 'pending'}>
                    {status === 'pending' ? contactCopy.submitPending : contactCopy.submitIdle}
                  </button>
                </div>
              </form>

              <div aria-live="polite" className="mt-3 text-[12px]">
                {status === 'invalid' && (
                  <p style={{ color: '#fca5a5' }}>{contactCopy.validationMessage}</p>
                )}
                {status === 'success' && (
                  <p style={{ color: 'var(--status-green)' }}>{contactCopy.successMessage}</p>
                )}
                {status === 'error' && <p style={{ color: '#fca5a5' }}>{contactCopy.errorMessage}</p>}
              </div>

              <DirectChannels />
            </>
          )}
        </GlassPanel>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 6: Add the Vite env type**

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB3FORMS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/components/sections/__tests__/Contact.test.tsx && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/sections/Contact.tsx src/content/contact.ts src/content/types.ts src/vite-env.d.ts .env.example
git commit -m "fix: make the contact form actually deliver messages

The previous site POSTed to http://localhost:5000, so every message sent
through the live site was silently lost. Submissions now go to Web3Forms,
and with no key configured the section presents a working mailto route
rather than a form that pretends to submit."
```

---

## Task 16: Command palette

**Files:**
- Create: `src/components/palette/CommandPalette.tsx`, `src/hooks/usePaletteShortcut.ts`
- Test: `src/components/palette/__tests__/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `chapters` (Task 9), `products` + `profile` (Task 2), `useReducedMotion` (Task 7).
- Produces:
  - `usePaletteShortcut(onOpen: () => void): void` — binds ⌘K / Ctrl+K
  - `<CommandPalette open={boolean} onClose={() => void} />`

Spec calls this "the cheapest single feature that makes a portfolio feel engineered rather than decorated." Keyboard operation is a hard accessibility requirement, not a bonus: Escape closes, arrows move, Enter activates, and focus lands in the input on open.

- [ ] **Step 1: Write the failing test**

`src/components/palette/__tests__/CommandPalette.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { chapters } from '../../../content/chapters'
import { CommandPalette } from '../CommandPalette'

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is a labelled modal dialog when open', () => {
    render(<CommandPalette open onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/command palette/i)
  })

  it('focuses the search input on open', () => {
    render(<CommandPalette open onClose={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('lists every chapter as a command', () => {
    render(<CommandPalette open onClose={() => {}} />)
    for (const chapter of chapters) {
      expect(screen.getByRole('option', { name: new RegExp(chapter.title, 'i') })).toBeInTheDocument()
    }
  })

  it('filters commands as you type', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    await userEvent.type(screen.getByRole('combobox'), 'spaceload')
    expect(screen.getByRole('option', { name: /spaceload/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /teaching/i })).toBeNull()
  })

  it('matches case-insensitively', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    await userEvent.type(screen.getByRole('combobox'), 'WRITING')
    expect(screen.getByRole('option', { name: /writing/i })).toBeInTheDocument()
  })

  it('reports when nothing matches instead of showing an empty list', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    await userEvent.type(screen.getByRole('combobox'), 'zzzznomatch')
    expect(screen.getByText(/no matches/i)).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('moves the active option with the arrow keys', async () => {
    render(<CommandPalette open onClose={() => {}} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('closes after activating a command with Enter', async () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    await userEvent.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} />)
    await userEvent.click(screen.getByTestId('palette-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/palette`
Expected: FAIL — import unresolved.

- [ ] **Step 3: Write `src/hooks/usePaletteShortcut.ts`**

```ts
import { useEffect } from 'react'

/** Binds ⌘K on macOS and Ctrl+K elsewhere. */
export function usePaletteShortcut(onOpen: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpen])
}
```

- [ ] **Step 4: Write `src/components/palette/CommandPalette.tsx`**

```tsx
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { chapters } from '../../content/chapters'
import { products } from '../../content/products'
import { profile } from '../../content/profile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { MonoLabel } from '../ui/MonoLabel'

interface Command {
  id: string
  label: string
  hint: string
  run: () => void
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function buildCommands(): Command[] {
  return [
    ...chapters.map((chapter) => ({
      id: `chapter-${chapter.id}`,
      label: `${chapter.num} ${chapter.title}`,
      hint: 'Jump to chapter',
      run: () => scrollToId(chapter.id),
    })),
    ...products.map((product) => ({
      id: `product-${product.slug}`,
      label: product.name,
      hint: 'Product',
      run: () => scrollToId('products'),
    })),
    {
      id: 'copy-email',
      label: `Copy email — ${profile.email}`,
      hint: 'Action',
      run: () => {
        void navigator.clipboard?.writeText(profile.email).catch(() => undefined)
      },
    },
    {
      id: 'resume',
      label: 'Download résumé',
      hint: 'Action',
      run: () => window.open(profile.resumePath, '_blank', 'noopener'),
    },
    {
      id: 'github',
      label: 'Open GitHub profile',
      hint: 'Action',
      run: () => window.open('https://github.com/tomjosetj31', '_blank', 'noopener'),
    },
  ]
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const commands = useMemo(buildCommands, [])
  const reduced = useReducedMotion()

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return commands
    return commands.filter((command) => command.label.toLowerCase().includes(needle))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  if (!open) return null

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, matches.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      matches[active]?.run()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
      <div
        data-testid="palette-backdrop"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(5,6,15,0.66)', backdropFilter: 'blur(6px)' }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="glass relative z-10 w-[min(560px,92vw)] overflow-hidden p-0"
        initial={reduced ? false : { opacity: 0, scale: 0.97, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-label="Search commands"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to a chapter, a product, or copy my email…"
          className="w-full border-0 border-b border-white/10 bg-transparent px-4 py-3.5 text-[13.5px] outline-none"
        />

        {matches.length === 0 ? (
          <p className="px-4 py-4 text-[12.5px]" style={{ color: 'var(--text-3)' }}>
            No matches.
          </p>
        ) : (
          <ul id="palette-list" role="listbox" className="m-0 max-h-[46vh] list-none overflow-y-auto p-1.5">
            {matches.map((command, index) => (
              <li
                key={command.id}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  command.run()
                  onClose()
                }}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[7px] px-2.5 py-2.5 text-[12.5px]"
                style={index === active ? { background: 'rgba(255,255,255,0.07)' } : undefined}
              >
                <span>{command.label}</span>
                <MonoLabel>{command.hint}</MonoLabel>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/palette && npm run typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/palette src/hooks/usePaletteShortcut.ts
git commit -m "feat: add the ⌘K command palette

Jump to any chapter or product by name, copy the email, grab the résumé.
Fully keyboard operable: Escape closes, arrows move the active option,
Enter activates, and focus lands in the input on open."
```

---

## Task 17: Compose the app, accessibility pass, and assets

**Files:**
- Modify: `src/App.tsx` (full rewrite)
- Modify: `src/styles/index.css` (skip link)
- Create: `public/favicon.svg`, `public/personal-portfolio/index.html`
- Create: `public/Tom-Jose-DevOps-Engineer.pdf` (copied from Tom's résumé)
- Delete: `src/assets/resume/Kotaicode_Resume.pdf`
- Modify: `README.md`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: every section and layout component from Tasks 9–16.
- Produces: the composed `<App />`.

- [ ] **Step 1: Install the current résumé and remove the stale one**

The live site currently serves `Kotaicode_Resume.pdf`, which predates the February résumé. `profile.resumePath` (Task 2) already points at the new filename.

```bash
cp "/Users/tom/Desktop/personal/strictly-personal/resume/Tom-Jose-DevOps-Engineer-feb-3.pdf" \
   public/Tom-Jose-DevOps-Engineer.pdf
git rm -r --quiet src/assets/resume
ls -la public/Tom-Jose-DevOps-Engineer.pdf
```

Expected: the PDF exists in `public/` and the old `src/assets/resume/` directory is gone.

- [ ] **Step 2: Write `public/favicon.svg`**

An aurora-gradient monogram, matching the nav mark:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#a)"/>
  <text x="32" y="43" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="28" font-weight="700" fill="#05060f">TJ</text>
</svg>
```

- [ ] **Step 3: Write the redirect stub**

`public/personal-portfolio/index.html`. Links to `tomjosetj31.github.io/personal-portfolio` are already on Tom's résumé and LinkedIn; after the repo rename that path is served by the root site, so this file catches them.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting — Tom Jose</title>
    <link rel="canonical" href="https://tomjosetj31.github.io/" />
    <meta http-equiv="refresh" content="0; url=/" />
    <meta name="robots" content="noindex" />
  </head>
  <body>
    <p>This page has moved to <a href="/">tomjosetj31.github.io</a>.</p>
    <script>
      window.location.replace('/')
    </script>
  </body>
</html>
```

- [ ] **Step 4: Add the skip link style to `src/styles/index.css`**

Inside `@layer components`:

```css
  .skip-link {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 100;
    padding: 10px 16px;
    border-radius: 0 0 8px 0;
    background: #f4f6ff;
    color: #05060f;
    font-weight: 600;
    font-size: 13px;
  }
  .skip-link:focus {
    left: 0;
  }
```

- [ ] **Step 5: Write the failing app test**

`src/__tests__/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../App'
import { chapters } from '../content/chapters'

describe('App', () => {
  it('renders a single main landmark', () => {
    render(<App />)
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders a skip link that targets the main content', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main',
    )
  })

  it('renders every chapter section', () => {
    const { container } = render(<App />)
    for (const chapter of chapters) {
      expect(container.querySelector(`#${chapter.id}`)).not.toBeNull()
    }
  })

  it('renders exactly one h1', () => {
    render(<App />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('opens the command palette on the ⌘K shortcut', async () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens the command palette from the nav button', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /command palette/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the palette again on Escape', async () => {
    render(<App />)
    await userEvent.keyboard('{Meta>}k{/Meta}')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/App.test.tsx`
Expected: FAIL — the placeholder `App` renders none of this.

- [ ] **Step 7: Write `src/App.tsx`**

```tsx
import { useCallback, useState } from 'react'
import { AuroraField } from './components/layout/AuroraField'
import { Footer } from './components/layout/Footer'
import { Grain } from './components/layout/Grain'
import { Nav } from './components/layout/Nav'
import { CommandPalette } from './components/palette/CommandPalette'
import { Contact } from './components/sections/Contact'
import { Credentials } from './components/sections/Credentials'
import { Hero } from './components/sections/Hero'
import { Infrastructure } from './components/sections/Infrastructure'
import { Products } from './components/sections/Products'
import { ProofStrip } from './components/sections/ProofStrip'
import { Teaching } from './components/sections/Teaching'
import { Writing } from './components/sections/Writing'
import { usePaletteShortcut } from './hooks/usePaletteShortcut'

export function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  usePaletteShortcut(openPalette)

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <AuroraField />
      <Grain />

      <div className="relative z-10">
        <Nav onOpenPalette={openPalette} />

        <main id="main">
          <Hero />
          <ProofStrip />
          <Infrastructure />
          <Products />
          <Writing />
          <Teaching />
          <Credentials />
          <Contact />
        </main>

        <Footer />
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </>
  )
}
```

- [ ] **Step 8: Update `README.md`**

```markdown
# tomjosetj31.github.io

Personal site for Tom Jose — DevOps engineer and product builder.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · Motion. Deployed to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Editing content

All copy lives in `src/content/` — components hold none of their own.

| To change | Edit |
|---|---|
| Products | `src/content/products.ts` |
| Role and outcome cards | `src/content/experience.ts` |
| Teaching guides | `src/content/guides.ts` |
| Headline, socials, availability | `src/content/profile.ts` |
| Certifications | `src/content/certifications.ts` |

`src/content/articles.archive.json` is **machine-written** — never edit it by hand.

## Medium sync

`npm run sync:medium` fetches the feed and merges new posts into the archive.
It runs automatically before every build and daily via GitHub Actions, so the
writing chapter updates itself. If Medium is unreachable the sync is skipped and
the build proceeds from the last good archive.

## Contact form

Set `VITE_WEB3FORMS_KEY` (see `.env.example`). Without it the contact section
falls back to a `mailto:` link.

## Commands

```bash
npm run dev         # dev server
npm run test        # unit tests
npm run typecheck   # tsc --noEmit
npm run build       # sync + typecheck + production build
```
```

- [ ] **Step 9: Run everything**

```bash
npm run test && npm run typecheck && npm run build && ls dist
```

Expected: all tests pass, typecheck clean, `dist/` contains `index.html`, `favicon.svg`, `Tom-Jose-DevOps-Engineer.pdf` and `personal-portfolio/index.html`.

- [ ] **Step 10: Check it in a browser**

```bash
npm run preview
```

Open the printed URL and confirm: the aurora drifts, the pipeline token moves as you scroll, proof numbers count up, ⌘K opens the palette, the heatmap renders, and every glass panel's text is legible over the brightest bloom. Then re-check with reduced motion enabled (macOS: System Settings → Accessibility → Display → Reduce motion) and confirm nothing animates and nothing disappears.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: compose the full page with skip link and palette wiring

Adds the current résumé PDF, the aurora monogram favicon and a redirect
stub at /personal-portfolio/ so links already on the résumé and LinkedIn
survive the move to the root user site."
```

---

## Task 18: Build, deploy and daily sync workflow

**Files:**
- Delete: `.github/workflows/deploy.yml` (the existing Jekyll-oriented workflow)
- Create: `.github/workflows/deploy.yml` (replacement)

**Interfaces:**
- Consumes: `npm run test`, `npm run build`, and the `sync-medium` stdout contract from Task 6.
- Produces: the deployed site, and a daily archive commit when the feed has new posts.

**Two constraints from the spec are encoded here:**

1. **The archive commit must not re-trigger the build.** Pushes authenticated with the default `GITHUB_TOKEN` do not trigger workflow runs, so this is safe by default. The commit message also carries `[skip ci]` in case that token is ever swapped for a PAT, which *would* re-trigger.
2. **A quiet day produces no commit.** `sync-medium` reports `unchanged` and leaves the file byte-identical, so `git diff --quiet` short-circuits.

- [ ] **Step 1: Delete the old workflow**

```bash
git rm --quiet .github/workflows/deploy.yml
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

`npm run build` runs `prebuild`, which runs the sync — so the feed is fetched exactly once per run, and the commit step inspects what the build already wrote.

```yaml
name: Build and deploy

on:
  push:
    branches: [main]
  schedule:
    # Daily at 06:00 UTC — picks up overnight Medium posts.
    - cron: '0 6 * * *'
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build
        # prebuild runs sync:medium, so the archive is refreshed here.
        env:
          VITE_WEB3FORMS_KEY: ${{ secrets.WEB3FORMS_KEY }}
        run: npm run build

      - name: Commit refreshed article archive
        run: |
          if git diff --quiet -- src/content/articles.archive.json; then
            echo "archive unchanged — nothing to commit"
            exit 0
          fi
          git config user.name  "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add src/content/articles.archive.json
          git commit -m "chore: sync medium archive [skip ci]"
          git push

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Validate the workflow file parses**

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml')); print('workflow YAML ok')"
```

Expected: `workflow YAML ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build, deploy and sync the Medium archive daily

Replaces the Jekyll-oriented workflow. A daily cron refreshes the article
archive and commits it only when it actually changed; the default
GITHUB_TOKEN means that commit cannot re-trigger the build."
```

- [ ] **Step 5: Hand back the manual steps**

These cannot be done from the repo and must be done by Tom in GitHub's UI. List them explicitly when reporting the task complete:

1. **Rename the repository** `personal-portfolio` → `tomjosetj31.github.io` (Settings → General → Repository name).
2. **Rename the default branch** `master` → `main` (Settings → Branches).
3. **Set Pages source to GitHub Actions** (Settings → Pages → Build and deployment → Source: GitHub Actions).
4. **Optional:** add a `WEB3FORMS_KEY` repository secret to activate the contact form. Without it the site falls back to `mailto:`, which is a working state.

- [ ] **Step 6: Merge the branch**

Only after Tom confirms the manual steps above, so the first deploy lands on a correctly-configured repo.

```bash
git checkout main
git merge --no-ff redesign/aurora-glass -m "feat: rebuild portfolio as Aurora Glass dual-identity site"
git push origin main
```

---

## Notes for the executor

**Verify before claiming completion.** Every task ends with a command whose output you must actually read. "Tests should pass" is not a result; the output of `npm run test` is.

**If a task's tests will not pass, stop and report rather than weakening the test.** The article-merge and sync-failure tests in Tasks 3–6 encode the two behaviours that keep an unattended daily job from corrupting data or breaking deploys. A failing test there is a real finding.

**Open items carried from the spec.** None block implementation:

1. Tom's fuller product list — drops into `src/content/products.ts` as array entries.
2. Certification verification URLs — `verifyUrl` on each entry in `certifications.ts`.
3. A Web3Forms access key — until then the contact section uses `mailto:`.
4. Optionally, a Medium data export to backfill the archive and complete the heatmap immediately.
