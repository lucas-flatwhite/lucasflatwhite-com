# lucasflatwhite.com

Personal site for **Lucas Flatwhite (루카스 플랫화이트)**. Endless curiosity. Spotting problems, then solving them. That's the kind of software engineer I am.

The homepage is a paper board: the name shares the first screen with two project boxes, the arcade box, and links. Newer featured projects take the upper slots.

- **Site**: [lucasflatwhite.com](https://lucasflatwhite.com)
- **GitHub**: [@lucas-flatwhite](https://github.com/lucas-flatwhite)
- **X**: [@lucas_flatwhite](https://x.com/lucas_flatwhite)

## Pages and Sections

- **Board (`/`, `#top`, `#work`)**: Paper page (`body.landing`). The name swaps one letter at a time for a cartoon picture of itself, and a pointer over a letter swaps it at once (`src/lib/name-swap.ts`). Featured projects with pictures fill the board through `placeProjects`. The two current pictures move: a crema ring spreads under glass panes, and a stack of glass windows turns from 2022 to 2026. They pause while off screen or in a hidden tab (`src/lib/work-motion.ts`) and stand still for visitors who ask for less motion. Every later picture stays still. The arcade box draws the lobby's paper handheld (`src/components/ArcadeHandheld.astro`) with a snake preview on its screen (`src/lib/snake-preview.ts`) and links to the lobby at `/arcade/`.
- **Arcade (`/arcade/`)**: Games live in [flatwhite-arcade](https://github.com/lucas-flatwhite/flatwhite-arcade), its own Vercel project. `vercel.json` rewrites `/arcade/*` to it, the way it serves `/ai-timeline-log/`. The snake game is at `/arcade/snake/`. The old `/play` address is gone.
- **Command menu (`Cmd/Ctrl + K`)**: Work, featured projects, Arcade (the lobby), then the profile links (`src/components/CommandPalette.astro`).

## Content and Code

- **Profile**: `src/data/site.ts` holds `siteProfile` and the homepage sections.
- **Links and icons**: `src/data/links.ts` defines external links. Each entry references a Phosphor icon from `src/lib/icons.ts` and a hover motion (`commit`, `cross`, `lift`). Links marked `featured: true` appear in the opening viewport; all links appear in the footer and command menu.
- **Projects**: `src/content/projects/*.md`. `placeProjects` sorts `featured` entries with the highest `order` first. A featured entry with `art` gets a board box. A featured entry without `art` appears only in the command menu. `motion` is `ripple` or `years` for the two current pictures and is omitted for every later project.
- **Work pictures**: Run `npm run art` to regenerate `src/assets/work/*.svg` from the generators in `scripts/work-art/`. It drives the installed Google Chrome through `playwright-core` and embeds subset fonts in the years picture. The glass is drawn inside each SVG with filters (`scripts/work-art/glass.js`), not with `backdrop-filter`. The output is committed, and a rerun with no changes writes the same bytes.
- **Styles and design contract**: Design tokens live in `src/styles/global.css`, page styles in `src/styles/landing.css`. `tests/anti-slop.test.ts` enforces the typography, icon, and styling constraints across `src/`.

## Structure

```text
├── public/           # Static assets
├── scripts/          # Build scripts: the Work pictures (`work-art/`)
├── src/
│   ├── assets/work/  # Generated Work pictures
│   ├── components/   # Astro UI components
│   ├── content/      # Project markdown entries
│   ├── data/         # Site profile and links
│   ├── layouts/      # Shared page layout
│   ├── lib/          # Name motion, board order, icons, and the snake preview
│   ├── pages/        # Route entry (/)
│   └── styles/       # Global tokens and landing styles
└── tests/            # Vitest source contracts and anti-slop checks
```

## Commands

```bash
npm install
npm run dev
npm run check
npm test -- --run
npm run build
npm run art
```
