# lucasflatwhite.com

Personal site for **Lucas Flatwhite (루카스 플랫화이트)**. I build for the web, translate developer software into Korean, and make text move.

The site is built as a working type specimen rather than a grid of static cards: every section uses English and Korean text as its primary material.

- **Site**: [lucasflatwhite.com](https://lucasflatwhite.com)
- **GitHub**: [@lucas-flatwhite](https://github.com/lucas-flatwhite)
- **X**: [@lucas_flatwhite](https://x.com/lucas_flatwhite)

## Pages and Sections

- **Specimen (`/`, `#top`)**: A field of Korean and English words laid out line by line on canvas with `@chenglou/pretext` (`src/lib/text-field.ts`). The text reflows around the cursor and the heading in real time without touching the DOM. The display name is fitted to the viewport using the width and weight axes of `Anybody Variable` alongside `Noto Sans KR Variable` (`src/lib/specimen.ts`).
- **Work (`#work`)**: Korean localization projects such as `gstack-ko` and `obsidian-translations`. Each entry shows a real English string from the project paired with its Korean translation and a brief note (`src/content/projects/*.md`).
- **Set by hand (`#type`)**: A 3D metal type galley built with Three.js (`src/lib/type-case.ts`) that sets Kent Beck's "Make it work, make it right, make it fast." Each sort is extruded in mirror image from glyph outlines extracted by `scripts/build-type-sorts.py` into `src/data/type-sorts.json`. The stage pins while the section scrolls past, and the scroll runs the press: a roller inks the sorts, a sheet comes down, and the lifted proof turns into its Korean translation line by line. Scrolling back runs it in reverse; sorts can still be pushed around by pointer or touch. On a portrait stage each line breaks before its last word so the sorts stay large. A meter along the foot of the stage names the step in view and fills as the proof is finished; the steps themselves live in `src/lib/press-timeline.ts`, apart from three.js. Three.js is loaded only when the section nears the viewport and pauses when idle or off-screen. With reduced motion the stage stays unpinned and shows the finished proof.
- **Play (`/play`, `#play`)**: A full-screen snake game running inside the word field (`src/lib/snake-experience.ts`).
  - Words drift and clear a path around the snakes, using bounding-box culling and cached `pretext` measurements to keep frame times bounded.
  - A CPU snake competes for the same food. Blocking the CPU into your body drops bonus pellets and triggers rival defeat bursts.
  - Eating pellets in quick succession builds a combo multiplier, and periodic espresso or cold brew cups grant extra growth or slow the CPU rival.
- **Command menu (`Cmd/Ctrl + K`)**: Keyboard palette for jumping to sections, `/play`, or external profiles (`src/components/CommandPalette.astro`).

## Content and Code

- **Profile and word pools**: `src/data/site.ts` holds `siteProfile`, `playfieldConfig`, `backgroundWordPool`, and the Korean/English burst phrase pools.
- **Links and icons**: `src/data/links.ts` defines external links. Each entry references a Phosphor icon from `src/lib/icons.ts` and a hover motion (`commit`, `cross`, `lift`). Links marked `featured: true` appear in the opening viewport and the `/play` top strip; all links appear in the footer and command menu.
- **Projects**: `src/content/projects/*.md`. Entries with a `specimen` block (`source`, `target`, `note`) are listed in the Work section.
- **Metal type outlines**: Run `python3 scripts/build-type-sorts.py` to regenerate `src/data/type-sorts.json` if the display name or font files change.
- **Styles and design contract**: Design tokens live in `src/styles/global.css`, page styles in `src/styles/landing.css` and `src/styles/play.css`. `tests/anti-slop.test.ts` enforces the typography, icon, and styling constraints across `src/`.

## Structure

```text
├── public/           # Static assets
├── scripts/          # Build script for 3D metal type glyph outlines
├── src/
│   ├── assets/fonts/ # Bundled font files
│   ├── components/   # Astro UI components
│   ├── content/      # Project markdown entries
│   ├── data/         # Site profile, links, word pools, and type sort outlines
│   ├── layouts/      # Shared page layout
│   ├── lib/          # Canvas text layout, 3D galley, and snake engine modules
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
```
