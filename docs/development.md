# Development notes

[Back to the overview](../README.md)

File paths below are relative to the repository root.

## Pages and Sections

- **Board (`/`, `#top`, `#work`)**: Paper page (`body.landing`). The name swaps one letter at a time for a cartoon picture of itself, every 1.4 seconds on every screen, and a pointer over a letter swaps it at once (`src/lib/name-swap.ts`). Featured projects with pictures fill the board through `placeProjects`. The two current pictures move: a crema ring spreads under glass panes, and a stack of glass windows turns from 2022 to 2026. They move on phones too, since neither redraws its glass: the windows are baked layers (`src/components/WorkYears.astro`) and the ring is a film (`src/components/WorkRipple.astro`) that loads after the page and only once its card is on screen, in AV1 where the device decodes it in hardware and H.264 elsewhere. They pause while off screen or in a hidden tab (`src/lib/work-motion.ts`) and stand still for visitors who ask for less motion, who never load the film. Every later picture stays still. After the projects comes Daily Shot, then the arcade box. Daily Shot is a still thermal receipt (`src/components/DailyShotReceipt.astro`) for the AI notes I post every day; its DATE and TIME print as blank fields until the browser stamps the visitor's clock on load, then again each minute while it is on screen (`src/lib/daily-shot.ts`). The command menu leaves Daily Shot out, since Twitter there already opens the same profile. A click opens my X profile in a new tab, as the project cards do. The arcade box draws the lobby's paper handheld (`src/components/ArcadeHandheld.astro`) with a snake preview crawling on its screen while it is in view (`src/lib/snake-preview.ts`) and links to the lobby at `/arcade/`.
- **Arcade (`/arcade/`)**: Games live in [flatwhite-arcade](https://github.com/lucas-flatwhite/flatwhite-arcade), its own Vercel project. `vercel.json` rewrites `/arcade/*` to it, the way it serves `/ai-timeline-log/`. Snake is at `/arcade/snake/`. Beach Ball Merge is at `/arcade/suika/`, served by the independent [suika-balls](https://github.com/lucas-flatwhite/suika-balls) deployment at `suika-balls.vercel.app`. Its entry and asset rewrites precede the Arcade wildcard rules, and `/arcade/suika` redirects to `/arcade/suika/` so Godot resolves relative asset URLs correctly. Cache headers come from Suika, so successful release files keep their immutable cache while missing files can return no-store. The old `/play` address is gone.
- **Command menu (`Cmd/Ctrl + K`)**: Work, featured projects, Arcade (the lobby), then the profile links (`src/components/CommandPalette.astro`). `src/lib/palette-commands.ts` builds the list once. `/commands.json` (`src/pages/commands.json.ts`) publishes the same list with absolute links and icons as path data, and the arcade lobby's menu reads it, so its links change with this site's deploy. `vercel.json` lets other origins read that one file, so the lobby also works on `flatwhite-arcade.vercel.app`. Changing the file's shape means raising `PUBLIC_COMMANDS_VERSION` in `src/lib/command-actions.ts` together with the arcade.

## Content and Code

- **Profile**: `src/data/site.ts` holds `siteProfile` and the homepage sections.
- **Links and icons**: `src/data/links.ts` defines external links. Each entry references a Phosphor icon from `src/lib/icons.ts` and a hover motion (`commit`, `cross`, `lift`). Links marked `featured: true` appear in the opening viewport; all links appear in the footer and command menu.
- **Photos**: Add one with `npm run photo -- <file> <slug> [--alt "..."] [--caption "..."] [--date YYYY-MM-DD]` on your own machine, then commit. `scripts/photo/` stands the photo upright, fits its long edge in 2000px, saves a JPEG of at most 600 kB, and strips all metadata, so no place or camera leaves with it. It writes the master to `src/assets/photos/` and an entry to `src/content/photos/`, both named after the month the photo was taken (`2026-10-podium`), and leaves the original where it is. Write the `alt` and `caption` in the entry if you did not pass them; the build stops while either is empty, and a caption is at most 40 characters, so it fits one line on a phone. `position` (`x% y%`) picks where the crop keeps its middle. The newest photo comes first. The card holds each photo for five seconds and fades to the next with its caption (`src/lib/photo-deck.ts`); the dots jump to a photo and a click on the card moves to the next. It pauses while a mouse or focus rests on it, off screen, and in a background tab, and stays still with reduced motion. The build cuts AVIF and WebP copies from each master, and the first photo loads at once because it is in the first screen. `tests/board-photos.test.ts` checks every master against the same rules, so run `npm test` before a pull request. Anything pushed stays in the public history, even after it is deleted.
- **Projects**: `src/content/projects/*.md`. `placeProjects` sorts `featured` entries with the highest `order` first. A featured entry with `art` gets a board box. A featured entry without `art` appears only in the command menu. `motion` is `ripple` or `years` for the two current pictures and is omitted for every later project.
- **Work pictures**: Run `npm run art` to regenerate `src/assets/work/*.svg` from the generators in `scripts/work-art/`. It drives the installed Google Chrome through `playwright-core` and embeds subset fonts in the years picture. The glass is drawn inside each SVG with filters (`scripts/work-art/glass.js`), not with `backdrop-filter`. The SVGs are the pictures' source; the page shows what `scripts/work-art/motion.ts` bakes from them into `src/assets/work/motion/`: the years picture as layers plus `years.css`, and the ripple as a still and a film per card size listed in `ripple.json`. Baking needs `ffmpeg` with `libsvtav1` and `libx264`; `npm run art:motion` runs it alone. The output is committed. A rerun with no changes writes the same SVGs, layers and CSS; the films differ by a few bytes.
- **Styles and design contract**: Design tokens live in `src/styles/global.css`, page styles in `src/styles/landing.css`. `tests/anti-slop.test.ts` enforces the typography, icon, and styling constraints across `src/`.

## Structure

```text
├── public/           # Static assets
├── scripts/          # The Work pictures (`work-art/`) and adding photos (`photo/`)
├── src/
│   ├── assets/photos/ # Photos beside the name
│   ├── assets/work/  # Generated Work pictures
│   ├── components/   # Astro UI components
│   ├── content/      # Project markdown and photo entries
│   ├── data/         # Site profile and links
│   ├── layouts/      # Shared page layout
│   ├── lib/          # Name swap, board and photo order, icons, and the snake preview
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
npm run photo -- <file> <slug>
```
