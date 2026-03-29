# Homepage Hero Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the homepage hero into the approved `CLI minimal` direction with a large monospace `'/lucas-flatwhite'`, a calm spinner, one short supporting line, and low-contrast command-pill actions.

**Architecture:** Keep the existing Astro homepage structure and update the current hero in place. Drive the refresh through three layers: structured site data for hero copy and action order, a simplified `Hero.astro` markup contract, and a global style/token rewrite that moves the site from warm coffee tones to the new graphite-based system.

**Tech Stack:** Astro, TypeScript, CSS, Vitest, `@astrojs/check`

---

## File Structure

### Modify

- `src/data/site.ts` - add explicit hero copy fields and reorder the visible hero actions.
- `tests/site-data.test.ts` - lock the new hero content contract and action ordering.
- `src/components/Hero.astro` - replace the current warm multi-block hero with the approved poster-like composition.
- `src/styles/global.css` - replace warm palette tokens, add hero-specific layout/motion styles, and add reduced-motion coverage.

### Create

- `tests/hero-source.test.ts` - source-contract test for the refreshed hero markup.
- `tests/hero-styles.test.ts` - source-contract test for the graphite palette and motion guardrails.

## Task 1: Lock Hero Copy and Action Order in Site Data

**Files:**
- Modify: `tests/site-data.test.ts`
- Modify: `src/data/site.ts`
- Test: `tests/site-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/site-data.test.ts
import { describe, expect, it } from 'vitest';
import {
  primaryLinks,
  recommendedCommands,
  siteProfile,
} from '../src/data/site';
import {
  getHomepageSections,
  getSectionIds,
  getScrollCommandTargets,
} from '../src/lib/site';

describe('site data', () => {
  it('exposes the expected homepage sections', () => {
    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('returns isolated section ids to callers', () => {
    const sectionIds = getSectionIds() as string[];
    sectionIds.pop();

    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('keeps the homepage section order stable', () => {
    expect(getHomepageSections()).toEqual([
      { id: 'hero', label: 'Intro' },
      { id: 'projects', label: 'Selected Projects' },
      { id: 'links', label: 'Links' },
    ]);
  });

  it('keeps primary links unique and non-empty', () => {
    const hrefs = primaryLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(primaryLinks.every((link) => link.label.length > 0)).toBe(true);
  });

  it('keeps scroll commands aligned with section ids', () => {
    const validSectionIds = new Set(getSectionIds());
    expect(
      getScrollCommandTargets().every((target) => validSectionIds.has(target)),
    ).toBe(true);
  });

  it('keeps the profile copy populated', () => {
    expect(siteProfile.handle).toBe('lucas.flatwhite');
    expect(siteProfile.title.length).toBeGreaterThan(10);
  });

  it('keeps command ids unique', () => {
    const ids = recommendedCommands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every command description populated for accessibility and clarity', () => {
    expect(recommendedCommands.every((command) => command.description.length > 8)).toBe(true);
  });

  it('keeps the refreshed hero copy compact and stable', () => {
    expect(siteProfile.heroTitle).toBe('/lucas-flatwhite');
    expect(siteProfile.heroTagline).toBe('Building calm, useful things on the web.');
    expect(siteProfile.heroSpinnerLabel).toBe('Thinking');
  });

  it('keeps the hero action row in the approved order', () => {
    expect(primaryLinks.map((link) => link.label)).toEqual([
      'Projects',
      'GitHub',
      'Contact',
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/site-data.test.ts`

Expected: FAIL because `siteProfile.heroTitle`, `siteProfile.heroTagline`, and `siteProfile.heroSpinnerLabel` do not exist yet, and the current primary links are ordered `GitHub`, `X`, `Projects`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/data/site.ts
export const sectionIds = ['hero', 'projects', 'links'] as const;

export type SectionId = (typeof sectionIds)[number];

export type PrimaryLink = {
  label: string;
  href: string;
  external: boolean;
};

export type RecommendedCommand =
  | {
      id: string;
      label: string;
      description: string;
      kind: 'scroll';
      target: Exclude<SectionId, 'hero'>;
    }
  | {
      id: string;
      label: string;
      description: string;
      kind: 'link';
      href: string;
    };

export const siteProfile = {
  handle: 'lucas.flatwhite',
  name: 'Lucas Flatwhite',
  title: 'Lucas Flatwhite builds calm, useful things on the web.',
  intro: 'A quiet terminal-flavored portfolio focused on useful web work.',
  availability: 'Available for interesting collaborations and experiments.',
  heroTitle: '/lucas-flatwhite',
  heroTagline: 'Building calm, useful things on the web.',
  heroSpinnerLabel: 'Thinking',
} as const;

export const primaryLinks = [
  {
    label: 'Projects',
    href: '#projects',
    external: false,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true,
  },
  {
    label: 'Contact',
    href: '#links',
    external: false,
  },
] as const satisfies readonly PrimaryLink[];

export const recommendedCommands = [
  {
    id: 'view-projects',
    label: 'view projects',
    description: 'Jump to selected work.',
    kind: 'scroll',
    target: 'projects',
  },
  {
    id: 'open-github',
    label: 'open github',
    description: 'Open the GitHub profile.',
    kind: 'link',
    href: 'https://github.com/lucas-flatwhite/',
  },
  {
    id: 'contact',
    label: 'contact',
    description: 'Jump to links and contact options.',
    kind: 'scroll',
    target: 'links',
  },
] as const satisfies readonly RecommendedCommand[];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run tests/site-data.test.ts`

Expected: PASS with `9 passed` and no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/data/site.ts tests/site-data.test.ts
git commit -m "feat: lock refreshed hero content"
```

## Task 2: Replace Hero Markup With the Quiet Monument Composition

**Files:**
- Create: `tests/hero-source.test.ts`
- Modify: `src/components/Hero.astro`
- Test: `tests/hero-source.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/hero-source.test.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const heroSource = readFileSync(resolve('src/components/Hero.astro'), 'utf8');

describe('hero source contract', () => {
  it('uses the refreshed hero data fields and simplified structure', () => {
    expect(heroSource).toContain('siteProfile.heroTitle');
    expect(heroSource).toContain('siteProfile.heroTagline');
    expect(heroSource).toContain('siteProfile.heroSpinnerLabel');
    expect(heroSource).toContain('class="hero-stage"');
    expect(heroSource).toContain('class="hero-spinner"');
    expect(heroSource).toContain('class="hero-tagline"');
    expect(heroSource).not.toContain('coffee-trigger');
    expect(heroSource).not.toContain('Brew commands');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/hero-source.test.ts`

Expected: FAIL because the current hero still renders the old eyebrow, multiple paragraphs, and `coffee-trigger` button instead of the new poster-like structure.

- [ ] **Step 3: Write the minimal implementation**

```astro
--- 
import { primaryLinks, siteProfile } from '../data/site';
---

<section class="hero" id="hero" aria-labelledby="hero-title">
  <div class="hero-stage">
    <div class="hero-status">
      <span class="hero-spinner" aria-hidden="true"></span>
      <span class="sr-only">{siteProfile.heroSpinnerLabel}</span>
    </div>

    <div class="hero-copy">
      <h1 id="hero-title">{siteProfile.heroTitle}</h1>
      <p class="hero-tagline">{siteProfile.heroTagline}</p>

      <nav class="hero-actions" aria-label="Primary links">
        {primaryLinks.map((link) => (
          <a
            class="hero-link hero-pill"
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noreferrer' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run tests/hero-source.test.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro tests/hero-source.test.ts
git commit -m "feat: rebuild homepage hero layout"
```

## Task 3: Replace Warm Styling With the Graphite Hero System

**Files:**
- Create: `tests/hero-styles.test.ts`
- Modify: `src/styles/global.css`
- Test: `tests/hero-styles.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/hero-styles.test.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve('src/styles/global.css'), 'utf8');

describe('hero style contract', () => {
  it('uses the graphite palette and restrained motion guardrails', () => {
    expect(styles).toContain('--bg: #0b0d10');
    expect(styles).toContain('--surface: #11161d');
    expect(styles).toContain('--text: #f5f7fa');
    expect(styles).toContain('--muted: #8e99a8');
    expect(styles).toContain('.hero-stage');
    expect(styles).toContain('.hero-spinner');
    expect(styles).toContain('.hero-tagline');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/hero-styles.test.ts`

Expected: FAIL because the current stylesheet still contains the warm coffee palette and does not define the new hero layout/motion hooks.

- [ ] **Step 3: Write the minimal implementation**

```css
/* src/styles/global.css */
:root {
  color-scheme: dark;
  --bg: #0b0d10;
  --surface: #11161d;
  --surface-strong: #161d26;
  --text: #f5f7fa;
  --muted: #8e99a8;
  --accent: #d6dde7;
  --border: #26303c;
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 30%),
    linear-gradient(180deg, #050608 0%, var(--bg) 100%);
  color: var(--text);
  font-family: 'Roboto Slab', serif;
}

.hero {
  min-height: min(78vh, 760px);
  display: flex;
  align-items: center;
  padding: clamp(2rem, 5vw, 4rem);
  background: rgba(17, 22, 29, 0.62);
  border: 1px solid rgba(38, 48, 60, 0.9);
  border-radius: 32px;
}

.hero-stage {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: clamp(1rem, 2vw, 1.5rem);
  width: 100%;
}

.hero-status {
  padding-top: 0.5rem;
}

.hero-spinner {
  display: inline-flex;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 999px;
  border: 2px solid rgba(245, 247, 250, 0.14);
  border-top-color: var(--text);
  animation: hero-spin 2.6s linear infinite;
}

.hero-copy h1 {
  margin: 0;
  max-width: 12ch;
  font-family: 'Roboto Mono', monospace;
  font-size: clamp(3.6rem, 11vw, 8.75rem);
  line-height: 0.88;
  letter-spacing: -0.08em;
}

.hero-tagline {
  margin: 1.25rem 0 0;
  max-width: 34ch;
  color: var(--muted);
  font-size: clamp(0.95rem, 1.6vw, 1.1rem);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.5rem;
}

.hero-pill {
  min-height: 42px;
  padding: 0.72rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(17, 22, 29, 0.94);
  color: var(--accent);
  box-shadow: none;
}

.hero-pill:hover,
.hero-pill:focus-visible {
  border-color: #3a4655;
  color: var(--text);
  background: rgba(22, 29, 38, 0.98);
  transform: translateY(-1px);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes hero-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .hero {
    min-height: auto;
  }

  .hero-stage {
    grid-template-columns: 1fr;
  }

  .hero-status {
    padding-top: 0;
  }

  .hero-copy h1 {
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-spinner,
  .hero-link,
  .hero-pill,
  .command-item,
  .project-links a,
  .footer-links a {
    animation: none;
    transition: none;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run tests/hero-styles.test.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Run integrated verification**

Run: `npm test -- --run tests/site-data.test.ts tests/hero-source.test.ts tests/hero-styles.test.ts`

Expected: PASS with all three test files green.

Run: `npm run check`

Expected: PASS with Astro type-check clean.

Run: `npm run build`

Expected: PASS with a production build generated successfully.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css tests/hero-styles.test.ts
git commit -m "feat: restyle homepage hero"
```

## Verification Checklist

- Confirm the first visible title is `'/lucas-flatwhite'`.
- Confirm only one visible supporting sentence appears under the title.
- Confirm the spinner sits to the left of the title on desktop and stays visually associated with it on mobile.
- Confirm the visible hero actions read `Projects`, `GitHub`, `Contact`.
- Confirm the old warm coffee palette is gone from the hero and surrounding shell.
- Confirm reduced-motion disables the spinner animation and hover transitions.

