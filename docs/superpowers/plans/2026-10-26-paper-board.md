# Paper Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage as a cool-paper board where the name shares the first screen with two project boxes, a snake preview, and links, while new featured projects extend the board and the command menu without moving those slots.

**Architecture:** One pure sort (`compareByOrder`) feeds both the board (`placeProjects`) and the command menu. Paper color lives on `body.landing` only. The play page keeps its game and gains the shared header. The type press, the homepage word field, and the homepage play band are deleted, including their dependencies.

**Tech Stack:** Astro 5, TypeScript, Vitest, existing Anybody and Noto Sans KR variable fonts, existing Phosphor icons. No new runtime dependency. `three` is removed.

**Spec:** `docs/superpowers/specs/2026-10-26-paper-board-design.md`

This is one plan. The header, the board, the menu, and the deletions ship together. A half-finished homepage would not be a working page.

---

### Task 1: Sort and place projects

**Files:**
- Modify: `src/lib/projects.ts`
- Test: `tests/project-order.test.ts`

- [ ] **Step 1: Replace the order test**

Replace the body of `tests/project-order.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { placeProjects, sortFeaturedProjects } from '../src/lib/projects';

const project = (
  title: string,
  order: number,
  featured = true,
  art: { alt: string } | undefined = { alt: title },
) => ({ data: { title, order, featured, art } });

describe('sortFeaturedProjects', () => {
  it('puts the highest order first and breaks ties by title', () => {
    const projects = [
      project('Third', 1),
      project('Hidden', 9, false),
      project('First', 3),
      project('Second', 2),
      project('Also two', 2),
    ];

    expect(sortFeaturedProjects(projects).map((entry) => entry.data.title)).toEqual([
      'First',
      'Also two',
      'Second',
      'Third',
    ]);
  });
});

describe('placeProjects', () => {
  it('keeps a featured project without art in the menu only', () => {
    const placed = placeProjects([
      project('Shown', 1),
      project('Draft', 5, true, undefined),
      project('Secret', 4, false),
    ]);

    expect(placed.palette.map((entry) => entry.data.title)).toEqual(['Draft', 'Shown']);
    expect(placed.lead.map((entry) => entry.data.title)).toEqual(['Shown']);
    expect(placed.rest).toEqual([]);
  });

  it('gives the first two pictured projects the lead slots', () => {
    const placed = placeProjects([
      project('One', 1),
      project('Two', 2),
      project('Three', 3),
      project('Four', 4),
      project('Five', 5),
    ]);

    expect(placed.lead.map((entry) => entry.data.title)).toEqual(['Five', 'Four']);
    expect(placed.rest.map((entry) => entry.data.title)).toEqual(['Three', 'Two', 'One']);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/project-order.test.ts`

Expected: FAIL because `placeProjects` is not exported and the old sort is ascending.

- [ ] **Step 3: Implement the sort**

Replace `src/lib/projects.ts` with:

```ts
type Orderable = {
  data: {
    title: string;
    featured: boolean;
    order: number;
    art?: unknown;
  };
};

export function compareByOrder(
  left: { order: number; title: string },
  right: { order: number; title: string },
): number {
  return right.order - left.order || left.title.localeCompare(right.title);
}

export function sortFeaturedProjects<T extends Orderable>(entries: T[]): T[] {
  return entries
    .filter((entry) => entry.data.featured)
    .sort((left, right) =>
      compareByOrder(
        { order: left.data.order, title: left.data.title },
        { order: right.data.order, title: right.data.title },
      ),
    );
}

export const LEAD_COUNT = 2;

export function placeProjects<T extends Orderable>(entries: T[]): {
  palette: T[];
  lead: T[];
  rest: T[];
} {
  const palette = sortFeaturedProjects(entries);
  const board = palette.filter((entry) => entry.data.art !== undefined);

  return {
    palette,
    lead: board.slice(0, LEAD_COUNT),
    rest: board.slice(LEAD_COUNT),
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/project-order.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/projects.ts tests/project-order.test.ts
git commit -m "feat: place newer featured projects above older ones"
```

### Task 2: Drop Play from the homepage section list

**Files:**
- Modify: `src/data/site.ts`
- Test: `tests/site-data.test.ts`

Play remains a page. It is no longer a homepage section, because the homepage play band is going away.

- [ ] **Step 1: Change the section expectation**

In `tests/site-data.test.ts`, replace every `['top', 'work', 'play']` with `['top', 'work']`.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/site-data.test.ts`

Expected: FAIL because `homepageSections` still includes `play`.

- [ ] **Step 3: Remove the play section**

In `src/data/site.ts`, change `homepageSections` to:

```ts
export const homepageSections = [
  { id: 'top', label: 'Intro' },
  { id: 'work', label: 'Work' },
] as const satisfies readonly HomepageSection[];
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/site-data.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/site.ts tests/site-data.test.ts
git commit -m "refactor: keep Play as a page instead of a homepage section"
```

### Task 3: Put projects in the command menu

**Files:**
- Modify: `src/lib/command-actions.ts`
- Test: `tests/command-actions.test.ts`

- [ ] **Step 1: Add the project menu test**

Append this describe block to `tests/command-actions.test.ts`. Leave the existing tests in place. They call `buildPaletteCommands` with three arguments, which must keep working.

```ts
describe('project commands', () => {
  const withProjects = buildPaletteCommands('/', '/play/', ['top', 'work'], [
    { id: 'old', title: 'Old', tags: ['Astro'], href: 'https://example.com/old', order: 1, featured: true },
    { id: 'new', title: 'New', tags: ['Canvas', 'TypeScript'], href: 'https://example.com/new', order: 3, featured: true },
    { id: 'draft', title: 'Draft', tags: ['Hidden'], href: 'https://example.com/draft', order: 9, featured: false },
    { id: 'mid', title: 'Mid', tags: ['One'], href: 'https://example.com/mid', order: 2, featured: true },
  ]);

  it('lists featured projects between Work and Play, highest order first', () => {
    expect(withProjects.map((command) => command.id)).toEqual([
      'work',
      'project-new',
      'project-mid',
      'project-old',
      'play',
      'github',
      'x',
      'email',
    ]);
  });

  it('opens a project in a new tab and uses its tags as the hint', () => {
    expect(withProjects.find((command) => command.id === 'project-new')).toMatchObject({
      label: 'New',
      hint: 'Canvas, TypeScript',
      href: 'https://example.com/new',
      external: true,
      copy: null,
      icon: 'arrow-up-right',
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/command-actions.test.ts`

Expected: FAIL because the fourth argument is ignored.

- [ ] **Step 3: Accept projects in the menu builder**

In `src/lib/command-actions.ts`, import `compareByOrder` from `./projects`. Add this type next to `PaletteCommand`:

```ts
export type PaletteProject = {
  id: string;
  title: string;
  tags: readonly string[];
  href: string;
  order: number;
  featured: boolean;
};
```

Change `buildPaletteCommands` to:

```ts
export function buildPaletteCommands(
  home: string,
  playHref: string,
  availableSections: readonly SectionId[],
  projects: readonly PaletteProject[] = [],
): PaletteCommand[] {
  const sections = sectionCommands.map((command) => {
    if (!availableSections.includes(command.section)) {
      throw new Error(`Unknown section target: ${command.section}`);
    }

    return {
      id: command.id,
      label: command.label,
      hint: command.hint,
      icon: command.icon,
      href: `${home}#${command.section}`,
      external: false,
      copy: null,
    };
  });

  const projectCommands = projects
    .filter((project) => project.featured)
    .sort(compareByOrder)
    .map((project) => ({
      id: `project-${project.id}`,
      label: project.title,
      hint: project.tags.join(', '),
      icon: 'arrow-up-right' as const,
      href: project.href,
      external: true,
      copy: null,
    }));

  return [
    ...sections,
    ...projectCommands,
    {
      id: 'play',
      label: 'Play',
      hint: 'Snake, in a field of words',
      icon: 'game-controller',
      href: playHref,
      external: false,
      copy: null,
    },
    ...siteLinks.map((link) => ({
      id: link.id,
      label: link.label,
      hint: link.handle,
      icon: link.icon,
      href: link.href,
      external: link.copy === null,
      copy: link.copy,
    })),
  ];
}
```

Update the doc comment to say the menu is sections, featured projects, the game, then every link.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/command-actions.test.ts`

Expected: PASS, including the older three-argument tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/command-actions.ts tests/command-actions.test.ts
git commit -m "feat: list featured projects in the command menu"
```

### Task 4: Record which two pictures move

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/projects/ai-timeline-log.md`
- Modify: `src/content/projects/lucasflatwhite-com.md`

Do not rewrite either project's title, summary, tags, or URLs. The site project's summary still mentions the press. That rewrite is out of scope.

- [ ] **Step 1: Add the optional field**

In `src/content.config.ts`, add this property to the project object, after `featured`:

```ts
motion: z.enum(['caret', 'strokes']).optional(),
```

- [ ] **Step 2: Mark the two existing projects**

In `src/content/projects/ai-timeline-log.md`, add `motion: caret` on the line after `featured: true`.

In `src/content/projects/lucasflatwhite-com.md`, add `motion: strokes` on the line after `featured: true`.

- [ ] **Step 3: Confirm the collection still typechecks**

Run: `npx astro check`

Expected: no error in `src/content.config.ts` or the two project files.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/projects/ai-timeline-log.md src/content/projects/lucasflatwhite-com.md
git commit -m "feat: mark the caret and stroke pictures"
```

### Task 5: Give the plate its own caret

**Files:**
- Modify: `scripts/work-art/plate.js`
- Modify: `scripts/work-art/svg.ts`
- Test: `tests/work-art-svg.test.ts`

The engraved path stays one path. The blinking caret is a separate rect, so it must not also be cut into that path.

- [ ] **Step 1: Expect the caret rect**

In `tests/work-art-svg.test.ts`, inside the `plateSvg` test, add:

```ts
expect(svg).toContain('<rect id="caret" x="150" y="220" width="14" height="48" fill="#f2f3f7"/>');
```

The numbers are the sketch caret: box `x = 96`, `y = 196`, then `x + 54`, `y + 24`, width `14`, height `96 - 48`.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/work-art-svg.test.ts`

Expected: FAIL because `plateSvg` has no caret rect.

- [ ] **Step 3: Draw the caret in the document, not in the cut**

In `scripts/work-art/plate.js`, delete these three lines from `sketch`:

```js
  // The caret.
  g.fillStyle = '#000';
  g.fillRect(x + 54, y + 24, 14, h - 48);
```

Replace `plateSvg` in `scripts/work-art/svg.ts` with:

```ts
/** The plate as a standalone document. The caret is its own element so the page can blink it. */
export function plateSvg(d: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${GROUND}"/>` +
    `<path d="${d}" fill="${CUT}"/>` +
    '<rect id="caret" x="150" y="220" width="14" height="48" fill="#f2f3f7"/>' +
    '</svg>\n'
  );
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/work-art-svg.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/work-art/plate.js scripts/work-art/svg.ts tests/work-art-svg.test.ts
git commit -m "feat: keep the plate caret as its own SVG element"
```

### Task 6: Group the portrait strokes and regenerate both pictures

**Files:**
- Modify: `scripts/work-art/portrait.js`
- Modify: `tests/work-art.test.ts`
- Modify: `src/assets/work/ai-timeline-log.svg`
- Modify: `src/assets/work/lucasflatwhite-com.svg`

- [ ] **Step 1: Assert the hooks on the committed files**

In `tests/work-art.test.ts`, add:

```ts
it('keeps a blinkable caret on the plate and one stroke group on the portrait', () => {
  expect(pictures.plate).toContain('id="caret"');
  expect(pictures.portrait).toContain('id="strokes"');
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/work-art.test.ts`

Expected: FAIL because the committed portrait has no `id="strokes"`. The plate also fails until Step 4 regenerates it.

- [ ] **Step 3: Wrap the portrait words in one group**

In `scripts/work-art/portrait.js`, the per-word `font-weight` on each `tspan` would block the group animation. Change the span return to set stretch only:

```js
return `<tspan style="font-stretch:${Math.round(70 + 60 * p)}%">${esc(word)} </tspan>`;
```

Replace the `svg.innerHTML` assignment with one group. The ground words, the underpaint, and the cat words stay in that paint order. The underpaint is paths, so a `font-weight` animation on `#strokes` does not change it. The outline and the face stay outside the group.

```js
svg.innerHTML =
  `<rect width="${W}" height="${H}" fill="${C.deep}"/><defs>${defs}</defs>` +
  `<g id="strokes" font-family="${FAMILY}">` +
  `${ground}${sc.underpaint()}${cat}` +
  `</g>${sc.outline(rng, 2.4)}${face()}`;
```

- [ ] **Step 4: Regenerate the pictures**

Run: `npm run art`

Expected: the command prints sizes for `ai-timeline-log.svg` and `lucasflatwhite-com.svg` and exits 0. This needs the installed Google Chrome. If Chrome is missing, stop and say so. Do not hand-edit the portrait SVG.

- [ ] **Step 5: Run the picture tests**

Run: `npx vitest run tests/work-art.test.ts tests/work-art-svg.test.ts tests/work-art-fonts.test.ts`

Expected: PASS, including the existing gzip budgets of 40KB for the plate and 100KB for the portrait.

- [ ] **Step 6: Commit**

```bash
git add scripts/work-art/portrait.js src/assets/work/ai-timeline-log.svg src/assets/work/lucasflatwhite-com.svg tests/work-art.test.ts
git commit -m "feat: regenerate work pictures with caret and stroke hooks"
```

### Task 7: Name reaction

**Files:**
- Create: `src/lib/name-motion.ts`
- Test: `tests/name-motion.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/name-motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { letterResponse } from '../src/lib/name-motion';

describe('letterResponse', () => {
  it('stays still when the pointer is on the letter', () => {
    expect(letterResponse(0, 0)).toEqual({ x: 0, y: 0, weight: 610 });
  });

  it('pulls at most five pixels toward the pointer', () => {
    expect(letterResponse(120, 0)).toEqual({ x: 0, y: 0, weight: 450 });
    expect(letterResponse(0, 60)).toEqual({ x: 0, y: 2.5, weight: 530 });
  });

  it('ignores a pointer outside the reach', () => {
    expect(letterResponse(240, 0)).toEqual({ x: 0, y: 0, weight: 450 });
  });
});
```

`letterResponse(0, 0)` has influence 1, so the weight is `450 + 160 = 610` and the pull direction is zero because both deltas are zero. `letterResponse(0, 60)` has influence `0.5`, so `y` is `2.5` and the weight is `530`.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/name-motion.test.ts`

Expected: FAIL with a missing module.

- [ ] **Step 3: Implement the response and the binder**

Create `src/lib/name-motion.ts`:

```ts
export const NAME_REACH = 120;
export const NAME_PULL = 5;
export const NAME_WEIGHT_REST = 450;
export const NAME_WEIGHT_SPAN = 160;

export function letterResponse(dx: number, dy: number): { x: number; y: number; weight: number } {
  const dist = Math.hypot(dx, dy);
  const influence = Math.max(0, 1 - dist / NAME_REACH);
  const safe = dist || 1;
  const pull = influence * NAME_PULL;

  return {
    x: dist === 0 ? 0 : (dx / safe) * pull,
    y: dist === 0 ? 0 : (dy / safe) * pull,
    weight: Math.round(NAME_WEIGHT_REST + influence * NAME_WEIGHT_SPAN),
  };
}

export function bindNameMotion(root: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const letters = [...root.querySelectorAll<HTMLElement>('[data-name-letter]')];

  const reset = () => {
    for (const letter of letters) {
      letter.style.transform = '';
      letter.style.fontWeight = '';
    }
  };

  root.addEventListener('pointermove', (event) => {
    for (const letter of letters) {
      const rect = letter.getBoundingClientRect();
      const response = letterResponse(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
      letter.style.transform = `translate(${response.x}px, ${response.y}px)`;
      letter.style.fontWeight = String(response.weight);
    }
  });
  root.addEventListener('pointerleave', reset);
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/name-motion.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/name-motion.ts tests/name-motion.test.ts
git commit -m "feat: pull the name toward the pointer by a few pixels"
```

### Task 8: Snake preview stepper

**Files:**
- Create: `src/lib/snake-preview.ts`
- Test: `tests/snake-preview.test.ts`

This is not the game. It does not import `snake-experience.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/snake-preview.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createPreview, stepPreview } from '../src/lib/snake-preview';

describe('snake preview', () => {
  it('starts as a short snake facing right', () => {
    expect(createPreview()).toEqual({
      cols: 8,
      rows: 5,
      dir: { x: 1, y: 0 },
      body: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ],
    });
  });

  it('turns right before it would leave the grid', () => {
    let state = createPreview();

    for (let i = 0; i < 6; i++) {
      state = stepPreview(state);
    }

    expect(state.body[0]).toEqual({ x: 7, y: 3 });
    expect(state.dir).toEqual({ x: 0, y: 1 });
    expect(state.body).toHaveLength(3);
  });
});
```

The head starts at `(2, 2)`. Five steps reach `(7, 2)` still facing right. The sixth step would land on `x = 8`, so it turns down and lands on `(7, 3)`.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/snake-preview.test.ts`

Expected: FAIL with a missing module.

- [ ] **Step 3: Implement the stepper and one frame of drawing**

Create `src/lib/snake-preview.ts`:

```ts
export type Cell = { x: number; y: number };

export type Preview = {
  cols: number;
  rows: number;
  dir: Cell;
  body: Cell[];
};

const TURNS: Cell[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export function createPreview(): Preview {
  return {
    cols: 8,
    rows: 5,
    dir: { x: 1, y: 0 },
    body: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  };
}

function inside(state: Preview, cell: Cell): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < state.cols && cell.y < state.rows;
}

export function stepPreview(state: Preview): Preview {
  let dir = state.dir;
  const head = state.body[0];
  let next = { x: head.x + dir.x, y: head.y + dir.y };

  if (!inside(state, next)) {
    const index = TURNS.findIndex((turn) => turn.x === dir.x && turn.y === dir.y);
    dir = TURNS[(index + 1) % TURNS.length];
    next = { x: head.x + dir.x, y: head.y + dir.y };
  }

  return {
    ...state,
    dir,
    body: [next, ...state.body.slice(0, -1)],
  };
}

export function drawPreview(canvas: HTMLCanvasElement, state: Preview): void {
  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const cell = Math.floor(Math.min(width / state.cols, height / state.rows));
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#fafafa';

  for (const part of state.body) {
    context.fillRect(part.x * cell + 1, part.y * cell + 1, cell - 2, cell - 2);
  }
}

export function mountSnakePreview(canvas: HTMLCanvasElement): void {
  let state = createPreview();
  drawPreview(canvas, state);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const timer = window.setInterval(() => {
    state = stepPreview(state);
    drawPreview(canvas, state);
  }, 180);

  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/snake-preview.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/snake-preview.ts tests/snake-preview.test.ts
git commit -m "feat: add a small snake preview that is not the game"
```

### Task 9: Allow the paper corner and scope the paper color

**Files:**
- Modify: `tests/anti-slop.test.ts`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro`

The old contract forbids every radius except the avatar. This spec replaces that with a 6px corner on the paper page. Do not change the `:root` blue tokens. Do not add `overflow: hidden` to the global `body` rule.

- [ ] **Step 1: Allow only 0 and 6px**

In `tests/anti-slop.test.ts`, replace the radius assertion:

```ts
expect(source).not.toMatch(/border-radius:\s*(?!0(?:px)?[;\s]|6px)[^;]+/);
```

Update the comment at the top of the file so it points at `docs/superpowers/specs/2026-10-26-paper-board-design.md` instead of the 2026-10-05 plan.

- [ ] **Step 2: Paint the document paper only when the body is the landing**

Add this at the end of `src/styles/global.css`:

```css
html:has(body.landing) {
  background: #fafafa;
  scrollbar-color: #ebebeb #fafafa;
}

body.landing {
  --paper: #fafafa;
  --ink: #171717;
  --ink-dim: #4d4d4d;
  --line: #ebebeb;
  --radius: 6px;
  color-scheme: light;
  background: var(--paper);
  color: var(--ink);
}
```

- [ ] **Step 3: Let each page set its theme color**

In `src/layouts/BaseLayout.astro`, add `themeColor?: string` to `Props`. Default it:

```ts
const { title, description, bodyClass, themeColor = '#1f35b5' } = Astro.props;
```

Change the theme-color tag to:

```html
<meta name="theme-color" content={themeColor} />
```

- [ ] **Step 4: Run the contract test**

Run: `npx vitest run tests/anti-slop.test.ts tests/experience-styles-source.test.ts`

Expected: PASS. The experience test still sees `height: 100dvh` and `view-transition-name: text-field` in `play.css`, and it still sees no `overflow: hidden` on the global `body` rule.

- [ ] **Step 5: Commit**

```bash
git add tests/anti-slop.test.ts src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat: scope the paper page without recoloring the game"
```

### Task 10: Shared header

**Files:**
- Create: `src/components/SiteHeader.astro`

- [ ] **Step 1: Create the header**

Create `src/components/SiteHeader.astro`:

```astro
---
import { siteProfile } from '../data/site';
import { withBase } from '../lib/paths';

type Props = {
  href: string;
};

const { href } = Astro.props;
---

<header class="topbar">
  <a class="topbar-mark" href={href}>
    <img class="topbar-avatar" src={withBase('avatar.png')} alt="" width="32" height="32" />
    {siteProfile.handle}
  </a>
  <button
    class="palette-trigger"
    type="button"
    data-palette-open
    aria-haspopup="dialog"
    aria-keyshortcuts="Meta+K Control+K"
    hidden
  >
    <span class="sr-only">Open command menu</span>
    <kbd aria-hidden="true" data-palette-key>Ctrl K</kbd>
  </button>
</header>

<style is:global>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 4.5rem;
    padding: 12px var(--gutter);
  }

  .topbar-mark {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: inherit;
    font-weight: 560;
    text-decoration: none;
  }

  .topbar-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  body.play {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }

  body.play .experience-shell {
    height: 100%;
    min-height: 0;
  }
</style>
```

`body.play` stays `overflow: hidden` from `play.css`. The grid gives the header its own row and gives the existing game shell the remaining height. Do not edit `play.css`. Do not give the header or the snake box `view-transition-name`.

The avatar radius stays outside the anti-slop check because that test already strips `.topbar-avatar`.

- [ ] **Step 2: Commit**

```bash
git add src/components/SiteHeader.astro
git commit -m "feat: add the shared paper header"
```

There is no unit test for this markup. Task 12 locks it through the route source test.

### Task 11: Homepage board

**Files:**
- Create: `src/components/ProjectCard.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/landing.css`
- Modify: `src/components/CommandPalette.astro`
- Test: `tests/routes-source.test.ts`
- Test: `tests/work-art.test.ts`

- [ ] **Step 1: Rewrite the route contract before the page**

Replace the second and third tests in `tests/routes-source.test.ts` with:

```ts
it('builds the landing as the paper board', () => {
  expect(landing).not.toContain('SnakeExperience');
  expect(landing).not.toContain('mountSpecimen');
  expect(landing).not.toContain('mountPlayBand');
  expect(landing).not.toContain('type-case');
  expect(landing).not.toContain('id="play"');
  expect(landing).not.toContain('field-canvas');
  expect(landing).not.toContain('Every line of moving text is laid out with pretext.');
  expect(landing).toContain('id="top"');
  expect(landing).toContain('id="work"');
  expect(landing).toContain('class="colophon"');
  expect(landing).toContain('<SiteHeader');
  expect(landing).toContain('<CommandPalette />');
  expect(landing).toContain('themeColor="#fafafa"');
  expect(landing).toContain('data-snake-preview');
  expect(landing).not.toContain('view-transition-name');
});

it('keeps the name as real text', () => {
  expect(landing).toContain('<h1 id="name"');
  expect(landing).toContain('lang="ko"');
  expect(landing).toContain('data-name-letter');
});
```

In `tests/work-art.test.ts`, replace the test named `shows the pictures in Work as sized, lazy images instead of excerpts` with:

```ts
it('inlines a moving picture and uses an img when a picture does not move', () => {
  const card = read('src/components/ProjectCard.astro');

  expect(card).toContain('set:html={svg}');
  expect(card).toContain('loading="lazy"');
  expect(card).toContain('width={art.image.width}');
  expect(card).toContain('height={art.image.height}');
  expect(read('src/pages/index.astro')).not.toContain('excerpt');
  expect(read('src/styles/landing.css')).not.toContain('excerpt');
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run tests/routes-source.test.ts tests/work-art.test.ts`

Expected: FAIL because the homepage still mounts the specimen and `ProjectCard.astro` does not exist.

- [ ] **Step 3: Create the project card**

Create `src/components/ProjectCard.astro`:

```astro
---
import Glyph from './Glyph.astro';

type Art = {
  image: { src: string; width: number; height: number };
  alt: string;
};

type Props = {
  title: string;
  summary: string;
  tags: readonly string[];
  href: string;
  repo?: string;
  art: Art;
  motion?: 'caret' | 'strokes';
  svg?: string;
  wide?: boolean;
};

const { title, summary, tags, href, repo, art, motion, svg, wide = false } = Astro.props;
const ready =
  svg !== undefined &&
  ((motion === 'caret' && svg.includes('id="caret"')) ||
    (motion === 'strokes' && svg.includes('id="strokes"')));
---

<li class:list={['project-card', { 'is-wide': wide }]}>
  <div class="project-art">
    {ready ? <div set:html={svg} /> : (
      <img
        src={art.image.src}
        width={art.image.width}
        height={art.image.height}
        alt={art.alt}
        loading="lazy"
        decoding="async"
      />
    )}
  </div>
  <h3 class="project-title">
    <a href={href} target="_blank" rel="noreferrer">
      {title}
      <Glyph icon="arrow-up-right" class="project-out" />
    </a>
  </h3>
  <p class="project-summary">{summary}</p>
  <p class="project-tags">{tags.join(', ')}</p>
  {repo && (
    <a class="project-source glyph-host" href={repo} target="_blank" rel="noreferrer">
      <Glyph icon="github-logo" motion="commit" />
      Source
    </a>
  )}
</li>
```

When `motion` is set but the SVG string lacks the promised id, `ready` is false and the card shows the still image. It does not render an empty box.

- [ ] **Step 4: Replace the homepage**

Replace `src/pages/index.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import CommandPalette from '../components/CommandPalette.astro';
import ProjectCard from '../components/ProjectCard.astro';
import SiteHeader from '../components/SiteHeader.astro';
import CopyMark from '../components/CopyMark.astro';
import CopyRoll from '../components/CopyRoll.astro';
import Glyph from '../components/Glyph.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
import timelineSvg from '../assets/work/ai-timeline-log.svg?raw';
import portraitSvg from '../assets/work/lucasflatwhite-com.svg?raw';
import { featuredLinks, siteLinks } from '../data/links';
import { siteProfile } from '../data/site';
import { placeProjects } from '../lib/projects';
import { withBase } from '../lib/paths';
import '../styles/landing.css';

const placed = placeProjects(await getCollection('projects'));
const playHref = withBase('play/');
const year = new Date().getFullYear();
const rawById: Record<string, string> = {
  'ai-timeline-log': timelineSvg,
  'lucasflatwhite-com': portraitSvg,
};
---

<BaseLayout
  title={siteProfile.name}
  description={siteProfile.description}
  bodyClass="landing"
  themeColor="#fafafa"
>
  <SiteHeader href="#top" />
  <main id="top">
    <section class="board">
      <div class="board-copy">
        <h1 id="name" class="name" data-name>
          <span class="name-line">
            {'Lucas'.split('').map((letter) => <span data-name-letter>{letter}</span>)}
          </span>
          <span class="name-line">
            {'Flatwhite'.split('').map((letter) => <span data-name-letter>{letter}</span>)}
          </span>
        </h1>
        <p class="name-ko" lang="ko">{siteProfile.nameKo}</p>
        <p class="intro">{siteProfile.intro}</p>
        <ul class="name-links">
          {featuredLinks.map((link) => (
            <li>
              {link.copy !== null ? (
                <a class="glyph-host" href={link.href} data-copy={link.copy}>
                  <CopyMark icon={link.icon} motion={link.motion} />
                  <CopyRoll text={link.label} />
                </a>
              ) : (
                <a class="glyph-host" href={link.href} target="_blank" rel="noreferrer me">
                  <Glyph icon={link.icon} motion={link.motion} />
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ol class="board-lead" id="work" data-count={placed.lead.length}>
        {placed.lead.map((entry) => (
          <ProjectCard
            title={entry.data.title}
            summary={entry.data.summary}
            tags={entry.data.tags}
            href={entry.data.href}
            repo={entry.data.repo}
            art={entry.data.art!}
            motion={entry.data.motion}
            svg={entry.data.motion ? rawById[entry.id] : undefined}
          />
        ))}
        <li class="snake-slot">
          <a class="snake-box" href={playHref} aria-label="Play Snake, in a field of words">
            <canvas data-snake-preview width="160" height="96" aria-hidden="true"></canvas>
            <span>Snake</span>
          </a>
        </li>
      </ol>
    </section>

    {placed.rest.length > 0 && (
      <ol class="work-rest">
        {placed.rest.map((entry, index) => (
          <ProjectCard
            title={entry.data.title}
            summary={entry.data.summary}
            tags={entry.data.tags}
            href={entry.data.href}
            repo={entry.data.repo}
            art={entry.data.art!}
            motion={entry.data.motion}
            svg={entry.data.motion ? rawById[entry.id] : undefined}
            wide={(index + 3) % 3 === 0}
          />
        ))}
      </ol>
    )}
  </main>

  <footer class="colophon">
    <ul class="colophon-links">
      {siteLinks.map((link) => (
        <li>
          {link.copy !== null ? (
            <a class="colophon-link glyph-host" href={link.href} data-copy={link.copy}>
              <CopyMark icon={link.icon} motion={link.motion} />
              <CopyRoll text={link.label} />
              <span class="colophon-blurb">{link.blurb}</span>
            </a>
          ) : (
            <a class="colophon-link glyph-host" href={link.href} target="_blank" rel="noreferrer me">
              <Glyph icon={link.icon} motion={link.motion} />
              <span>{link.label}</span>
              <span class="colophon-blurb">{link.blurb}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
    <div class="colophon-meta">
      <p>Set in Anybody and Noto Sans KR.</p>
      <p class="colophon-shortcut">Press <kbd data-palette-key>Ctrl K</kbd> to jump anywhere.</p>
      <p>&copy; {year} {siteProfile.name}</p>
    </div>
  </footer>
  <CommandPalette />
</BaseLayout>

<script>
  import { mountCopyLinks } from '../lib/copy-link';
  import { bindNameMotion } from '../lib/name-motion';
  import { mountSnakePreview } from '../lib/snake-preview';

  const name = document.querySelector<HTMLElement>('[data-name]');
  const preview = document.querySelector<HTMLCanvasElement>('[data-snake-preview]');

  if (name) {
    bindNameMotion(name);
  }

  if (preview) {
    mountSnakePreview(preview);
  }

  mountCopyLinks();
</script>
```

The rest-list index is 0-based. Board item 3 is rest index 0, board item 6 is rest index 3, board item 9 is rest index 6. `(index + 3) % 3 === 0` is true for 0, 3, and 6. Pass `wide` for those. The CSS uses `.is-wide`, not `nth-child`, so the snake slot is not part of the count.

- [ ] **Step 5: Replace the landing stylesheet**

Replace `src/styles/landing.css` with:

```css
.board {
  display: grid;
  gap: 24px;
  padding: 0 var(--gutter) 48px;
}

.board-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.name {
  margin: 0;
  font-size: clamp(48px, 6.5vw, 120px);
  font-weight: 450;
  letter-spacing: -0.055em;
  line-height: 0.86;
}

.name-line {
  display: block;
}

.name [data-name-letter] {
  display: inline-block;
  font-weight: 450;
}

.name-ko,
.intro,
.project-summary,
.project-tags,
.colophon-blurb {
  color: var(--ink-dim);
}

.name-ko,
.intro,
.project-summary,
.project-tags,
.colophon-meta,
.project-source {
  margin: 0;
}

.intro {
  max-width: 34ch;
}

.name-links,
.board-lead,
.work-rest,
.colophon-links {
  margin: 0;
  padding: 0;
  list-style: none;
}

.name-links {
  display: grid;
  gap: 8px;
}

.name-links a,
.project-title a,
.project-source,
.colophon-link {
  color: inherit;
  text-decoration: none;
}

.board-lead,
.work-rest {
  display: grid;
  gap: 12px;
}

.project-card,
.snake-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.project-art {
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #16278a;
}

.project-art img,
.project-art svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 560;
}

.project-tags {
  font-size: 0.92rem;
}

.project-source {
  display: inline-flex;
  gap: 0.4em;
  align-items: center;
}

.snake-box {
  justify-content: space-between;
  height: 100%;
  padding: 12px;
  border-radius: 6px;
  background: #171717;
  color: #fff;
  text-decoration: none;
}

.snake-box canvas {
  width: 100%;
  height: auto;
  background: transparent;
}

.work-rest {
  padding: 0 var(--gutter) 64px;
}

.colophon {
  display: grid;
  gap: 28px;
  padding: 24px var(--gutter) var(--gutter);
}

.colophon-link {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 0.6rem;
  align-items: baseline;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}

.colophon-blurb {
  justify-self: end;
  text-align: right;
}

.colophon-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  color: var(--ink-dim);
  font-size: 0.95rem;
}

@media (min-width: 721px) {
  .board {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    align-items: stretch;
    min-height: calc(100svh - 4.5rem);
  }

  .board-lead[data-count='2'] {
    grid-template-rows: 1.35fr 0.9fr 0.7fr;
  }

  .board-lead[data-count='1'] {
    grid-template-rows: 1.35fr 0.7fr;
  }

  .board-lead[data-count='0'] {
    grid-template-rows: 0.7fr;
  }

  .work-rest {
    grid-template-columns: 1.3fr 0.7fr;
  }

  .project-card.is-wide {
    grid-row: span 2;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .project-art [id='caret'] {
    animation: caret-blink 1.1s steps(1) infinite;
  }

  .project-art [id='strokes'] {
    font-weight: 450;
    animation: stroke-weight 2.8s ease-in-out infinite;
  }
}

@keyframes caret-blink {
  50% { opacity: 0; }
}

@keyframes stroke-weight {
  50% { font-weight: 700; }
}

@media (hover: none), (pointer: coarse) {
  .colophon-shortcut,
  .topbar .palette-trigger {
    display: none;
  }
}
```

Do not use `#000` or `#000000`. Do not add a radius other than `6px` via `var(--radius)`. Do not set `view-transition-name`.

- [ ] **Step 6: Feed projects into the menu**

In `src/components/CommandPalette.astro`, import `getCollection` from `astro:content` and `placeProjects` from `../lib/projects`. Build the fourth argument:

```ts
const projects = placeProjects(await getCollection('projects')).palette.map((entry) => ({
  id: entry.id,
  title: entry.data.title,
  tags: entry.data.tags,
  href: entry.data.href,
  order: entry.data.order,
  featured: entry.data.featured,
}));

const commands = buildPaletteCommands(withBase(), withBase('play/'), sectionIds, projects);
```

Leave the script block unchanged.

Replace the palette surface rules so the dialog no longer uses the blue tokens:

```css
.palette-trigger {
  border: 1px solid var(--line, #ebebeb);
  border-radius: 6px;
  background: transparent;
  color: inherit;
}

.palette {
  border-radius: 6px;
  background: #fff;
  color: #171717;
  box-shadow: 0 0 0 1px #ebebeb;
}

.palette::backdrop {
  background: rgba(23, 23, 23, 0.4);
}

.palette-field {
  border-bottom: 1px solid #ebebeb;
}

.palette-field input {
  color: #171717;
  caret-color: #171717;
}

.palette-field:focus-within {
  box-shadow: inset 0 -2px 0 #171717;
}

.palette-esc,
.palette-hint,
.palette-empty {
  color: #4d4d4d;
}

.palette-option[aria-selected='true'] {
  background: #171717;
  color: #fff;
}

.palette-option[aria-selected='true'] .palette-hint,
.palette-option[aria-selected='true'] .copy-roll-done,
.palette-option[aria-selected='true'] .copy-mark-check {
  color: #fff;
}

.palette-option .copy-roll-done,
.palette-option .copy-mark-check {
  color: #171717;
}
```

Remove the old declarations that set `.palette` background to `var(--foam)`, the blue shadow, `border-radius: 0` on `.palette`, the blue selected row, and the crema copied color. Keep the open animation, the list grid, and the glyph opacity rules.

- [ ] **Step 7: Run the homepage tests**

Run: `npx vitest run tests/routes-source.test.ts tests/work-art.test.ts tests/anti-slop.test.ts tests/command-actions.test.ts`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/ProjectCard.astro src/pages/index.astro src/styles/landing.css src/components/CommandPalette.astro tests/routes-source.test.ts tests/work-art.test.ts
git commit -m "feat: lay the homepage out as a paper board"
```

### Task 12: Header on the play page

**Files:**
- Modify: `src/pages/play/index.astro`
- Test: `tests/routes-source.test.ts`

- [ ] **Step 1: Extend the play route test**

Inside the existing test `keeps the snake game on its own /play page`, add:

```ts
expect(play).toContain('<SiteHeader');
expect(play).toContain('<SnakeExperience />');
expect(play).not.toContain('themeColor="#fafafa"');
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run tests/routes-source.test.ts`

Expected: FAIL because the play page has no `SiteHeader`.

- [ ] **Step 3: Add the header**

In `src/pages/play/index.astro`, import `SiteHeader` and `withBase`. Render `<SiteHeader href={withBase()} />` immediately inside `<body>`'s layout, before `<main>`. Do not pass `themeColor`. Do not edit `SnakeExperience.astro` or `play.css`.

```astro
<BaseLayout
  title={`Play | ${siteProfile.name}`}
  description={siteProfile.playDescription}
  bodyClass="play"
>
  <SiteHeader href={withBase()} />
  <main class="experience-page">
    <SnakeExperience />
  </main>
  <CommandPalette />
</BaseLayout>
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run tests/routes-source.test.ts tests/experience-styles-source.test.ts tests/snake-experience-source.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/play/index.astro tests/routes-source.test.ts
git commit -m "feat: put the paper header on the play page"
```

### Task 13: Delete the press, the word field, and the homepage play band

**Files:**
- Delete the files listed in the spec section 10
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`

- [ ] **Step 1: Confirm nothing else imports the condemned modules**

Run:

```bash
rg -n "type-case|press-timeline|type-sorts|specimen|play-band|text-field|build-type-sorts|from 'three'" src tests scripts package.json
```

Expected: matches only in the files this task deletes, plus `README.md`, plus `tests/type-case-source.test.ts`, `tests/press-timeline.test.ts`, and `tests/specimen-source.test.ts`. `src/pages` must not match. `@chenglou/pretext` must still be imported from `src/lib/snake-experience.ts`.

- [ ] **Step 2: Delete the files and the Three dependency**

```bash
rm src/lib/type-case.ts src/lib/type-case-loader.ts src/lib/press-timeline.ts \
  src/lib/specimen.ts src/lib/play-band.ts src/lib/text-field.ts \
  src/data/type-sorts.json scripts/build-type-sorts.py \
  tests/type-case-source.test.ts tests/press-timeline.test.ts tests/specimen-source.test.ts
npm uninstall three @types/three
```

- [ ] **Step 3: Rewrite the README sections that describe the deleted page**

Replace the Pages and Sections list and the Metal type outlines bullet in `README.md`.

The opening paragraph becomes:

```md
The homepage is a paper board: the name shares the first screen with two project boxes, a small snake preview, and links. Newer featured projects take the upper slots.
```

The section list becomes:

```md
- **Board (`/`, `#top`, `#work`)**: Paper page (`body.landing`). The name uses Anybody's weight axis and moves a few pixels toward the pointer (`src/lib/name-motion.ts`). Featured projects with pictures fill the board through `placeProjects`. The two current pictures blink a caret or shift stroke weight. Later pictures stay still. The snake box is a preview (`src/lib/snake-preview.ts`) and links to `/play`.
- **Play (`/play`)**: The full-screen snake game (`src/lib/snake-experience.ts`). Its field, rules, and identity strip are unchanged. The page adds the same header and command menu as the homepage.
- **Command menu (`Cmd/Ctrl + K`)**: Work, featured projects, Play, then the profile links (`src/components/CommandPalette.astro`).
```

Replace the Projects bullet with:

```md
- **Projects**: `src/content/projects/*.md`. `placeProjects` sorts `featured` entries with the highest `order` first. A featured entry with `art` gets a board box. A featured entry without `art` appears only in the command menu. `motion` is `caret` or `strokes` for the two current pictures and is omitted for every later project.
```

Delete the Metal type outlines bullet. In the Structure tree, change the scripts comment from "metal type outlines and the Work pictures" to "the Work pictures (`work-art/`)".

- [ ] **Step 4: Run the whole test suite and the type check**

Run: `npx vitest run && npx astro check`

Expected: both exit 0. If a test still reads a deleted file, delete that assertion only when it required the deleted feature. Do not weaken `tests/snake-experience-source.test.ts` or `tests/experience-styles-source.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove the homepage word field and the type press"
```

Before `git add -A`, run `git status` and do not stage `.superpowers/` or anything outside this feature.

---

## Self-review

Spec coverage:

- Paper tokens, 6px radius, landing-only color: Task 9 and Task 11.
- First screen, two lead slots, snake, links: Task 11.
- Higher `order` first, ties by title, artless featured projects in the menu only: Tasks 1 and 3.
- Rest grid wide boxes at board positions 3, 6, and 9: Task 11 (`wide` when `(index + 3) % 3 === 0`).
- Name size, weight, 5px pull, 120px reach, reduced motion: Task 7 and Task 11 CSS.
- Motion schema, caret id, strokes group, still fallback: Tasks 4, 5, 6, and `ProjectCard`.
- Press and homepage play band removed, Three removed, pretext kept: Task 13.
- Shared header and paper menu, including on `/play`: Tasks 10, 11, and 12.
- Footer copy and the removed pretext sentence: Task 11.
- `720px` breakpoint and row tracks `1.35fr 0.9fr 0.7fr`: Task 11 CSS.
- View transition left on the play page and not applied to the snake box: Tasks 9 and 11.
- Tests named in the spec: Tasks 1, 2, 3, 6, 11, 12, and 13.

The project summary for this site still mentions the press. The spec says not to rewrite project copy.
