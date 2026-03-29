# Astro Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current static `index.html` portfolio with an Astro landing page that preserves the playful terminal-cafe identity while making introduction, projects, and links easy to discover.

**Architecture:** Build a mostly static Astro site with one homepage composed from focused components. Keep short profile, link, and recommended-command data in a typed module, keep selected projects in a Markdown-backed Astro content collection, and use a small client-side script only for the coffee-triggered command menu and section scrolling.

**Tech Stack:** Astro, TypeScript, Astro content collections, CSS, Vitest, `@astrojs/check`

---

## File Structure

### Create

- `package.json` - Astro and test scripts plus dependencies
- `tsconfig.json` - TypeScript configuration for Astro and Vitest
- `astro.config.mjs` - Astro project configuration
- `vitest.config.ts` - Vitest configuration for node-based tests
- `public/assets/flatwhite.svg` - publicly served coffee icon
- `public/assets/fonts/roboto-slab-300.ttf` - publicly served heading font
- `public/assets/fonts/roboto-slab-700.ttf` - publicly served heading font
- `public/assets/fonts/roboto-mono-400.ttf` - publicly served monospace font
- `src/env.d.ts` - Astro ambient type declarations
- `src/data/site.ts` - profile copy, primary links, and recommended commands
- `src/lib/site.ts` - pure helpers for validating and grouping site data
- `src/lib/command-actions.ts` - pure helper for command action resolution
- `src/content.config.ts` - Astro content collection schema for project cards
- `src/content/projects/lucasflatwhite-com.md` - migrated project entry for this site
- `src/content/projects/gstack-ko.md` - featured project entry
- `src/content/projects/obsidian-translations.md` - featured project entry
- `src/layouts/BaseLayout.astro` - shared document shell and metadata
- `src/components/Hero.astro` - hero content and top-level calls to action
- `src/components/CommandShelf.astro` - recommended commands panel and client script
- `src/components/ProjectGrid.astro` - selected project cards
- `src/components/FooterLinks.astro` - link/contact section
- `src/pages/index.astro` - single homepage composition
- `src/styles/global.css` - design tokens and shared styles
- `tests/site-data.test.ts` - data-shape and link contract tests
- `tests/project-order.test.ts` - project sorting helper tests
- `tests/command-actions.test.ts` - command action resolution tests

### Modify

- `.gitignore` - keep Astro and test output ignored
- `README.md` - explain Astro structure and content editing flow

### Remove After Migration

- `index.html` - legacy static homepage
- `style.css` - legacy static stylesheet
- `assets/` - legacy asset location replaced by `public/assets/`

### Reuse

- `assets/flatwhite.svg` - reuse as coffee icon source
- `assets/fonts/*` - reuse existing self-hosted fonts via Astro-safe paths

## Task 1: Bootstrap Astro Foundation and Typed Site Data

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/env.d.ts`
- Create: `public/assets/flatwhite.svg`
- Create: `public/assets/fonts/roboto-slab-300.ttf`
- Create: `public/assets/fonts/roboto-slab-700.ttf`
- Create: `public/assets/fonts/roboto-mono-400.ttf`
- Create: `src/data/site.ts`
- Create: `src/lib/site.ts`
- Test: `tests/site-data.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing data-contract test**

```ts
// tests/site-data.test.ts
import { describe, expect, it } from 'vitest';
import {
  primaryLinks,
  recommendedCommands,
  siteProfile,
} from '../src/data/site';
import { getSectionIds, getScrollCommandTargets } from '../src/lib/site';

describe('site data', () => {
  it('exposes the expected homepage sections', () => {
    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('keeps primary links unique and non-empty', () => {
    const hrefs = primaryLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(primaryLinks.every((link) => link.label.length > 0)).toBe(true);
  });

  it('keeps scroll commands aligned with section ids', () => {
    expect(getScrollCommandTargets()).toEqual(['projects', 'links']);
  });

  it('keeps the profile copy populated', () => {
    expect(siteProfile.handle).toBe('lucas.flatwhite');
    expect(siteProfile.title.length).toBeGreaterThan(10);
  });

  it('keeps command ids unique', () => {
    const ids = recommendedCommands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/site-data.test.ts`

Expected: FAIL with a package-script or module resolution error because `package.json`, `src/data/site.ts`, and `src/lib/site.ts` do not exist yet.

- [ ] **Step 3: Write the minimal Astro and site-data implementation**

```json
// package.json
{
  "name": "lucasflatwhite-com",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "@types/node": "^22.14.0",
    "astro": "^5.6.0",
    "typescript": "^5.8.3",
    "vite": "^6.2.3",
    "vitest": "^3.1.1"
  }
}
```

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src", "tests"]
}
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lucasflatwhite.com'
});
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

```ts
// src/env.d.ts
/// <reference types="astro/client" />
```

```bash
mkdir -p public/assets/fonts
cp assets/flatwhite.svg public/assets/flatwhite.svg
cp assets/fonts/roboto-slab-300.ttf public/assets/fonts/roboto-slab-300.ttf
cp assets/fonts/roboto-slab-700.ttf public/assets/fonts/roboto-slab-700.ttf
cp assets/fonts/roboto-mono-400.ttf public/assets/fonts/roboto-mono-400.ttf
```

```ts
// src/data/site.ts
export type SectionId = 'hero' | 'projects' | 'links';

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
  title: 'Developer who loves flat whites and playful interfaces.',
  intro:
    'I build tools, translations, and small web experiences with a warm terminal-cafe attitude.',
  availability: 'Available for interesting collaborations and experiments.'
} as const;

export const primaryLinks: PrimaryLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true
  },
  {
    label: 'X',
    href: 'https://x.com/lucas_flatwhite',
    external: true
  },
  {
    label: 'Projects',
    href: '#projects',
    external: false
  }
];

export const recommendedCommands: RecommendedCommand[] = [
  {
    id: 'view-projects',
    label: 'view projects',
    description: 'Jump to selected work.',
    kind: 'scroll',
    target: 'projects'
  },
  {
    id: 'open-github',
    label: 'open github',
    description: 'Open the GitHub profile.',
    kind: 'link',
    href: 'https://github.com/lucas-flatwhite/'
  },
  {
    id: 'contact',
    label: 'contact',
    description: 'Jump to links and contact options.',
    kind: 'scroll',
    target: 'links'
  }
];
```

```ts
// src/lib/site.ts
import { recommendedCommands, type SectionId } from '../data/site';

const sectionIds: SectionId[] = ['hero', 'projects', 'links'];

export function getSectionIds(): SectionId[] {
  return sectionIds;
}

export function getScrollCommandTargets(): string[] {
  return recommendedCommands
    .filter((command) => command.kind === 'scroll')
    .map((command) => command.target);
}
```

```gitignore
# .gitignore
.claude/
node_modules/
.astro/
dist/
coverage/
.DS_Store
```

- [ ] **Step 4: Install dependencies and run the test to verify it passes**

Run: `npm install`

Run: `npm test -- --run tests/site-data.test.ts`

Expected: PASS with `5 passed`.

- [ ] **Step 5: Commit the foundation**

```bash
git add package.json tsconfig.json astro.config.mjs vitest.config.ts src/env.d.ts src/data/site.ts src/lib/site.ts tests/site-data.test.ts .gitignore package-lock.json
git add public/assets/flatwhite.svg public/assets/fonts/roboto-slab-300.ttf public/assets/fonts/roboto-slab-700.ttf public/assets/fonts/roboto-mono-400.ttf
git commit -m "feat: bootstrap Astro portfolio foundation"
```

## Task 2: Add Project Content Collection and Ordering Helper

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/projects/lucasflatwhite-com.md`
- Create: `src/content/projects/gstack-ko.md`
- Create: `src/content/projects/obsidian-translations.md`
- Create: `src/lib/projects.ts`
- Test: `tests/project-order.test.ts`

- [ ] **Step 1: Write the failing project-order test**

```ts
// tests/project-order.test.ts
import { describe, expect, it } from 'vitest';
import { sortFeaturedProjects } from '../src/lib/projects';

describe('sortFeaturedProjects', () => {
  it('keeps featured projects ordered by the numeric order field', () => {
    const projects = [
      { data: { title: 'Third', featured: true, order: 3 } },
      { data: { title: 'Hidden', featured: false, order: 0 } },
      { data: { title: 'First', featured: true, order: 1 } },
      { data: { title: 'Second', featured: true, order: 2 } }
    ];

    expect(sortFeaturedProjects(projects).map((entry) => entry.data.title)).toEqual([
      'First',
      'Second',
      'Third'
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/project-order.test.ts`

Expected: FAIL with `Cannot find module '../src/lib/projects'`.

- [ ] **Step 3: Write the content schema, project Markdown, and helper**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).min(1),
    href: z.string().url(),
    repo: z.string().url().optional(),
    order: z.number().int().nonnegative(),
    featured: z.boolean().default(true)
  })
});

export const collections = {
  projects
};
```

```ts
// src/lib/projects.ts
type ProjectEntry = {
  data: {
    title: string;
    featured: boolean;
    order: number;
  };
};

export function sortFeaturedProjects<T extends ProjectEntry>(entries: T[]): T[] {
  return entries
    .filter((entry) => entry.data.featured)
    .sort((left, right) => left.data.order - right.data.order);
}
```

```md
<!-- src/content/projects/lucasflatwhite-com.md -->
---
title: lucasflatwhite-com
summary: Rebuilt personal home on the web with a playful terminal-cafe presentation and friendlier navigation.
tags:
  - Astro
  - TypeScript
  - CSS
href: https://github.com/lucas-flatwhite/lucasflatwhite-com
repo: https://github.com/lucas-flatwhite/lucasflatwhite-com
order: 1
featured: true
---

Personal website experiments, UI iteration, and the current Astro migration all live here.
```

```md
<!-- src/content/projects/gstack-ko.md -->
---
title: gstack-ko
summary: Korean localization work for the gstack ecosystem, focused on accurate translation without breaking command semantics.
tags:
  - Localization
  - Docs
  - Tooling
href: https://github.com/lucas-flatwhite/gstack-ko
repo: https://github.com/lucas-flatwhite/gstack-ko
order: 2
featured: true
---

Translation work for developer tooling with special care for commands, flags, code blocks, and source-language integrity.
```

```md
<!-- src/content/projects/obsidian-translations.md -->
---
title: obsidian-translations
summary: Translation and maintenance work for Obsidian-related copy and localization flows.
tags:
  - Translation
  - Open Source
  - Content Ops
href: https://github.com/lucas-flatwhite/obsidian-translations
repo: https://github.com/lucas-flatwhite/obsidian-translations
order: 3
featured: true
---

Documentation and translation maintenance with a strong emphasis on editorial consistency.
```

- [ ] **Step 4: Run the project-order test and Astro type check**

Run: `npm test -- --run tests/project-order.test.ts`

Expected: PASS with `1 passed`.

Run: `npm run check`

Expected: PASS after Astro reads `src/content.config.ts` and validates the three project entries.

- [ ] **Step 5: Commit the content layer**

```bash
git add src/content.config.ts src/content/projects/lucasflatwhite-com.md src/content/projects/gstack-ko.md src/content/projects/obsidian-translations.md src/lib/projects.ts tests/project-order.test.ts
git commit -m "feat: add project content collection"
```

## Task 3: Build the Base Layout, Hero, Projects, and Links Sections

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Hero.astro`
- Create: `src/components/ProjectGrid.astro`
- Create: `src/components/FooterLinks.astro`
- Create: `src/pages/index.astro`
- Create: `src/styles/global.css`
- Modify: `src/lib/site.ts`

- [ ] **Step 1: Write the failing homepage-model test**

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
  getScrollCommandTargets
} from '../src/lib/site';

describe('site data', () => {
  it('exposes the expected homepage sections', () => {
    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('keeps the homepage section order stable', () => {
    expect(getHomepageSections()).toEqual([
      { id: 'hero', label: 'Intro' },
      { id: 'projects', label: 'Selected Projects' },
      { id: 'links', label: 'Links' }
    ]);
  });

  it('keeps primary links unique and non-empty', () => {
    const hrefs = primaryLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(primaryLinks.every((link) => link.label.length > 0)).toBe(true);
  });

  it('keeps scroll commands aligned with section ids', () => {
    expect(getScrollCommandTargets()).toEqual(['projects', 'links']);
  });

  it('keeps the profile copy populated', () => {
    expect(siteProfile.handle).toBe('lucas.flatwhite');
    expect(siteProfile.title.length).toBeGreaterThan(10);
  });

  it('keeps command ids unique', () => {
    const ids = recommendedCommands.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/site-data.test.ts`

Expected: FAIL because `getHomepageSections` is not exported yet.

- [ ] **Step 3: Implement the homepage shell and supporting helpers**

```ts
// src/lib/site.ts
import { recommendedCommands, type SectionId } from '../data/site';

const homepageSections = [
  { id: 'hero' as const, label: 'Intro' },
  { id: 'projects' as const, label: 'Selected Projects' },
  { id: 'links' as const, label: 'Links' }
];

export function getSectionIds(): SectionId[] {
  return homepageSections.map((section) => section.id);
}

export function getHomepageSections() {
  return homepageSections;
}

export function getScrollCommandTargets(): string[] {
  return recommendedCommands
    .filter((command) => command.kind === 'scroll')
    .map((command) => command.target);
}
```

```astro
--- 
// src/layouts/BaseLayout.astro
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/assets/flatwhite.svg" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// src/components/Hero.astro
import { primaryLinks, siteProfile } from '../data/site';
---

<section class="hero" id="hero">
  <div class="hero-copy">
    <p class="eyebrow">$ brew --portfolio</p>
    <h1>{siteProfile.handle}</h1>
    <p class="hero-title">{siteProfile.title}</p>
    <p class="hero-intro">{siteProfile.intro}</p>
    <p class="hero-availability">{siteProfile.availability}</p>
    <div class="hero-actions">
      {primaryLinks.map((link) => (
        <a
          class:list={['hero-link', { 'is-external': link.external }]}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noreferrer' : undefined}
        >
          {link.label}
        </a>
      ))}
      <button
        class="coffee-trigger"
        type="button"
        aria-expanded="false"
        aria-controls="command-menu"
      >
        <img src="/assets/flatwhite.svg" alt="" />
        <span>Recommended commands</span>
      </button>
    </div>
  </div>
</section>
```

```astro
---
// src/components/ProjectGrid.astro
import type { CollectionEntry } from 'astro:content';

interface Props {
  projects: CollectionEntry<'projects'>[];
}

const { projects } = Astro.props;
---

<section class="projects" id="projects" aria-labelledby="projects-title">
  <div class="section-heading">
    <p class="eyebrow">tree ./selected-work</p>
    <h2 id="projects-title">Selected Projects</h2>
  </div>
  <div class="project-grid">
    {projects.map((project) => (
      <article class="project-card">
        <div class="project-header">
          <h3>{project.data.title}</h3>
          <p>{project.data.summary}</p>
        </div>
        <ul class="project-tags" aria-label={`${project.data.title} stack`}>
          {project.data.tags.map((tag) => (
            <li>{tag}</li>
          ))}
        </ul>
        <div class="project-links">
          <a href={project.data.href} target="_blank" rel="noreferrer">
            Open
          </a>
          {project.data.repo && (
            <a href={project.data.repo} target="_blank" rel="noreferrer">
              Repo
            </a>
          )}
        </div>
      </article>
    ))}
  </div>
</section>
```

```astro
---
// src/components/FooterLinks.astro
import { primaryLinks } from '../data/site';

const footerLinks = primaryLinks.filter((link) => link.external);
---

<section class="links" id="links" aria-labelledby="links-title">
  <div class="section-heading">
    <p class="eyebrow">ls ./links</p>
    <h2 id="links-title">Links</h2>
  </div>
  <ul class="footer-links">
    {footerLinks.map((link) => (
      <li>
        <a href={link.href} target="_blank" rel="noreferrer">
          {link.label}
        </a>
      </li>
    ))}
  </ul>
</section>
```

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import FooterLinks from '../components/FooterLinks.astro';
import Hero from '../components/Hero.astro';
import ProjectGrid from '../components/ProjectGrid.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { siteProfile } from '../data/site';
import { sortFeaturedProjects } from '../lib/projects';

const projects = sortFeaturedProjects(await getCollection('projects'));
---

<BaseLayout title={siteProfile.handle} description={siteProfile.intro}>
  <main class="page-shell">
    <Hero />
    <ProjectGrid projects={projects} />
    <FooterLinks />
  </main>
</BaseLayout>
```

```css
/* src/styles/global.css */
@font-face {
  font-family: 'Roboto Slab';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('/assets/fonts/roboto-slab-300.ttf') format('truetype');
}

@font-face {
  font-family: 'Roboto Slab';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/assets/fonts/roboto-slab-700.ttf') format('truetype');
}

@font-face {
  font-family: 'Roboto Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/roboto-mono-400.ttf') format('truetype');
}

:root {
  --bg: #f4ecde;
  --panel: rgba(255, 250, 242, 0.84);
  --ink: #1f1a16;
  --muted: #665c55;
  --accent: #16717a;
  --accent-soft: #d9f0ef;
  --coffee: #8c5a3c;
  --line: rgba(31, 26, 22, 0.12);
  --shadow: 0 24px 60px rgba(73, 48, 31, 0.12);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.7), transparent 34%),
    linear-gradient(180deg, #f9f2e7 0%, var(--bg) 100%);
  font-family: 'Roboto Slab', serif;
}

.page-shell {
  width: min(1100px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0 96px;
}

.hero,
.projects,
.links {
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--panel);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.hero {
  min-height: min(78vh, 760px);
  display: grid;
  align-items: end;
}

.hero-copy h1,
.section-heading h2 {
  margin: 0;
  font-weight: 700;
  line-height: 0.95;
}

.hero-copy h1 {
  font-size: clamp(3rem, 9vw, 6.5rem);
}

.eyebrow,
.project-tags,
.footer-links,
.hero-link,
.coffee-trigger {
  font-family: 'Roboto Mono', monospace;
}
```

- [ ] **Step 4: Run the updated data test and the Astro build**

Run: `npm test -- --run tests/site-data.test.ts`

Expected: PASS with `6 passed`.

Run: `npm run build`

Expected: PASS with Astro generating `dist/index.html`.

- [ ] **Step 5: Commit the base page rendering**

```bash
git add src/lib/site.ts src/layouts/BaseLayout.astro src/components/Hero.astro src/components/ProjectGrid.astro src/components/FooterLinks.astro src/pages/index.astro src/styles/global.css tests/site-data.test.ts
git commit -m "feat: build Astro portfolio page shell"
```

## Task 4: Implement the Coffee-Triggered Recommended Commands Panel

**Files:**
- Create: `src/components/CommandShelf.astro`
- Create: `src/lib/command-actions.ts`
- Test: `tests/command-actions.test.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Write the failing command-resolution test**

```ts
// tests/command-actions.test.ts
import { describe, expect, it } from 'vitest';
import { resolveCommandAction } from '../src/lib/command-actions';
import type { RecommendedCommand } from '../src/data/site';

describe('resolveCommandAction', () => {
  it('resolves scroll commands to in-page anchors', () => {
    const command: RecommendedCommand = {
      id: 'view-projects',
      label: 'view projects',
      description: 'Jump to selected work.',
      kind: 'scroll',
      target: 'projects'
    };

    expect(resolveCommandAction(command, ['hero', 'projects', 'links'])).toEqual({
      kind: 'scroll',
      value: '#projects'
    });
  });

  it('rejects scroll commands that point to missing sections', () => {
    const command: RecommendedCommand = {
      id: 'contact',
      label: 'contact',
      description: 'Jump to links and contact options.',
      kind: 'scroll',
      target: 'links'
    };

    expect(() => resolveCommandAction(command, ['hero', 'projects'])).toThrow(
      'Unknown section target: links'
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/command-actions.test.ts`

Expected: FAIL with `Cannot find module '../src/lib/command-actions'`.

- [ ] **Step 3: Implement the command resolver and the UI component**

```ts
// src/lib/command-actions.ts
import type { RecommendedCommand } from '../data/site';

export function resolveCommandAction(
  command: RecommendedCommand,
  availableSections: string[]
) {
  if (command.kind === 'scroll') {
    if (!availableSections.includes(command.target)) {
      throw new Error(`Unknown section target: ${command.target}`);
    }

    return {
      kind: 'scroll' as const,
      value: `#${command.target}`
    };
  }

  return {
    kind: 'link' as const,
    value: command.href
  };
}
```

```astro
---
// src/components/CommandShelf.astro
import { recommendedCommands } from '../data/site';
import { resolveCommandAction } from '../lib/command-actions';
import { getSectionIds } from '../lib/site';

const actions = recommendedCommands.map((command) => ({
  command,
  resolved: resolveCommandAction(command, getSectionIds())
}));
---

<section class="command-shelf" aria-labelledby="command-menu-title">
  <div class="section-heading">
    <p class="eyebrow">cat ./recommended-commands</p>
    <h2 id="command-menu-title">Recommended Commands</h2>
  </div>
  <div class="command-panel" id="command-menu" hidden>
    <ul class="command-list">
      {actions.map(({ command, resolved }) => (
        <li>
          <a
            class="command-item"
            data-command-kind={resolved.kind}
            href={resolved.value}
            target={resolved.kind === 'link' ? '_blank' : undefined}
            rel={resolved.kind === 'link' ? 'noreferrer' : undefined}
          >
            <span class="command-label">$ {command.label}</span>
            <span class="command-description">{command.description}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
</section>

<script>
  const trigger = document.querySelector('.coffee-trigger');
  const menu = document.querySelector('#command-menu');

  if (trigger instanceof HTMLButtonElement && menu instanceof HTMLElement) {
    trigger.addEventListener('click', () => {
      const nextExpanded = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(nextExpanded));
      menu.hidden = !nextExpanded;
    });
  }
</script>
```

```astro
---
// src/components/Hero.astro
import { primaryLinks, siteProfile } from '../data/site';
---

<section class="hero" id="hero">
  <div class="hero-copy">
    <p class="eyebrow">$ brew --portfolio</p>
    <h1>{siteProfile.handle}</h1>
    <p class="hero-title">{siteProfile.title}</p>
    <p class="hero-intro">{siteProfile.intro}</p>
    <p class="hero-availability">{siteProfile.availability}</p>
    <div class="hero-actions">
      {primaryLinks.map((link) => (
        <a
          class:list={['hero-link', { 'is-external': link.external }]}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noreferrer' : undefined}
        >
          {link.label}
        </a>
      ))}
      <button
        class="coffee-trigger"
        type="button"
        aria-expanded="false"
        aria-controls="command-menu"
        aria-label="Open recommended commands"
      >
        <img src="/assets/flatwhite.svg" alt="" />
        <span>Brew commands</span>
      </button>
    </div>
  </div>
</section>
```

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import CommandShelf from '../components/CommandShelf.astro';
import FooterLinks from '../components/FooterLinks.astro';
import Hero from '../components/Hero.astro';
import ProjectGrid from '../components/ProjectGrid.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import { siteProfile } from '../data/site';
import { sortFeaturedProjects } from '../lib/projects';

const projects = sortFeaturedProjects(await getCollection('projects'));
---

<BaseLayout title={siteProfile.handle} description={siteProfile.intro}>
  <main class="page-shell">
    <Hero />
    <CommandShelf />
    <ProjectGrid projects={projects} />
    <FooterLinks />
  </main>
</BaseLayout>
```

- [ ] **Step 4: Run the command test and the production build**

Run: `npm test -- --run tests/command-actions.test.ts`

Expected: PASS with `2 passed`.

Run: `npm run build`

Expected: PASS with the command menu rendered into `dist/index.html`.

- [ ] **Step 5: Commit the command-shelf interaction**

```bash
git add src/components/CommandShelf.astro src/lib/command-actions.ts src/components/Hero.astro src/pages/index.astro tests/command-actions.test.ts
git commit -m "feat: add coffee-triggered command shelf"
```

## Task 5: Polish Styling, Migrate Assets, and Document the New Editing Flow

**Files:**
- Modify: `src/styles/global.css`
- Modify: `README.md`
- Remove: `index.html`
- Remove: `style.css`

- [ ] **Step 1: Write the failing accessibility-label test**

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
  getScrollCommandTargets
} from '../src/lib/site';

describe('site data', () => {
  it('exposes the expected homepage sections', () => {
    expect(getSectionIds()).toEqual(['hero', 'projects', 'links']);
  });

  it('keeps the homepage section order stable', () => {
    expect(getHomepageSections()).toEqual([
      { id: 'hero', label: 'Intro' },
      { id: 'projects', label: 'Selected Projects' },
      { id: 'links', label: 'Links' }
    ]);
  });

  it('keeps primary links unique and non-empty', () => {
    const hrefs = primaryLinks.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(primaryLinks.every((link) => link.label.length > 0)).toBe(true);
  });

  it('keeps scroll commands aligned with section ids', () => {
    expect(getScrollCommandTargets()).toEqual(['projects', 'links']);
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
});
```

- [ ] **Step 2: Run the test to verify it fails if any command copy is too short**

Run: `npm test -- --run tests/site-data.test.ts`

Expected: FAIL only if a command description was left too short during implementation. If the test already passes, keep it as a regression guard and continue to the styling step.

- [ ] **Step 3: Finish responsive styling, remove legacy files, and document editing**

```css
/* Append to src/styles/global.css */
.page-shell {
  display: grid;
  gap: 24px;
}

.hero-actions,
.project-links,
.footer-links,
.project-tags,
.command-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.hero-link,
.coffee-trigger,
.command-item,
.project-links a,
.footer-links a {
  border-radius: 999px;
  border: 1px solid var(--line);
  text-decoration: none;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.72);
  padding: 10px 14px;
}

.coffee-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.coffee-trigger img {
  width: 24px;
  height: 24px;
}

.command-panel {
  margin-top: 18px;
}

.command-item {
  width: 100%;
  justify-content: space-between;
  display: flex;
  gap: 16px;
}

.command-label {
  color: var(--accent);
}

.command-description,
.hero-title,
.hero-intro,
.hero-availability,
.project-card p {
  color: var(--muted);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.project-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--line);
}

.project-tags li {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.hero-link:hover,
.coffee-trigger:hover,
.command-item:hover,
.project-links a:hover,
.footer-links a:hover {
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100vw - 20px, 100%);
    padding: 20px 0 72px;
  }

  .hero,
  .projects,
  .links {
    padding: 22px;
    border-radius: 22px;
  }

  .command-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

```md
<!-- README.md -->
# lucasflatwhite-com

Astro-based personal portfolio with a playful terminal-cafe visual language.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run check`
- `npm test -- --run`

## Content Editing

- Update short profile, links, and recommended commands in `src/data/site.ts`.
- Update selected project cards in `src/content/projects/*.md`.
- Update layout and visual language in `src/components/*` and `src/styles/global.css`.
```

```bash
rm index.html style.css
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm test -- --run`

Expected: PASS with all Vitest files green.

Run: `npm run check`

Expected: PASS with no Astro or TypeScript errors.

Run: `npm run build`

Expected: PASS with a generated `dist/` site and no legacy-root HTML/CSS in use.

- [ ] **Step 5: Commit the migration cleanup**

```bash
git add README.md src/styles/global.css
git rm index.html style.css
git rm -r assets
git commit -m "feat: complete Astro portfolio migration"
```

## Final Verification

- [ ] Run `npm test -- --run`
- [ ] Run `npm run check`
- [ ] Run `npm run build`
- [ ] Run `git status --short` and confirm only expected files changed
- [ ] Open the homepage locally with `npm run dev` and verify:

```text
1. The hero shows intro, primary links, and the coffee button without requiring typing.
2. Clicking the coffee button opens the recommended commands panel.
3. The "view projects" and "contact" commands scroll to the right sections.
4. Project cards render in the order lucasflatwhite-com, gstack-ko, obsidian-translations.
5. The layout remains readable on both desktop and narrow mobile widths.
```
