# lucasflatwhite.com

Personal site for **Lucas Flatwhite (루카스 플랫화이트)**. Endless curiosity. Spotting problems, then solving them. That's the kind of software engineer I am.

The homepage is a paper board: the name shares the first screen with two project boxes, a small snake preview, and links. Newer featured projects take the upper slots.

- **Site**: [lucasflatwhite.com](https://lucasflatwhite.com)
- **GitHub**: [@lucas-flatwhite](https://github.com/lucas-flatwhite)
- **X**: [@lucas_flatwhite](https://x.com/lucas_flatwhite)

## Pages and Sections

- **Board (`/`, `#top`, `#work`)**: Paper page (`body.landing`). The name uses Anybody's weight axis and moves a few pixels toward the pointer (`src/lib/name-motion.ts`). Featured projects with pictures fill the board through `placeProjects`. The two current pictures blink a caret or shift stroke weight. Later pictures stay still. The snake box is a preview (`src/lib/snake-preview.ts`) and links to `/play`.
- **Play (`/play`)**: The full-screen snake game (`src/lib/snake-experience.ts`). Its field, rules, and identity strip are unchanged. The page adds the same header and command menu as the homepage.
- **Command menu (`Cmd/Ctrl + K`)**: Work, featured projects, Play, then the profile links (`src/components/CommandPalette.astro`).

## Content and Code

- **Profile and word pools**: `src/data/site.ts` holds `siteProfile`, `playfieldConfig`, `backgroundWordPool`, and the Korean/English burst phrase pools.
- **Links and icons**: `src/data/links.ts` defines external links. Each entry references a Phosphor icon from `src/lib/icons.ts` and a hover motion (`commit`, `cross`, `lift`). Links marked `featured: true` appear in the opening viewport and the `/play` top strip; all links appear in the footer and command menu.
- **Projects**: `src/content/projects/*.md`. `placeProjects` sorts `featured` entries with the highest `order` first. A featured entry with `art` gets a board box. A featured entry without `art` appears only in the command menu. `motion` is `caret` or `strokes` for the two current pictures and is omitted for every later project.
- **Work pictures**: Run `npm run art` to regenerate `src/assets/work/*.svg` from the generators in `scripts/work-art/`. It drives the installed Google Chrome through `playwright-core`, thins the plate's path, and embeds subset fonts in the portrait. The output is committed, and a rerun with no changes writes the same bytes.
- **Styles and design contract**: Design tokens live in `src/styles/global.css`, page styles in `src/styles/landing.css` and `src/styles/play.css`. `tests/anti-slop.test.ts` enforces the typography, icon, and styling constraints across `src/`.

## Structure

```text
├── public/           # Static assets
├── scripts/          # Build scripts: the Work pictures (`work-art/`)
├── src/
│   ├── assets/fonts/ # Bundled font files
│   ├── assets/work/  # Generated Work pictures
│   ├── components/   # Astro UI components
│   ├── content/      # Project markdown entries
│   ├── data/         # Site profile, links, and word pools
│   ├── layouts/      # Shared page layout
│   ├── lib/          # Name motion, board order, icons, and the snake
│   ├── pages/        # Route entries (/ and /play)
│   └── styles/       # Global tokens, landing, and game styles
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
