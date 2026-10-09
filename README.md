# lucasflatwhite.com

Astro-based portfolio site for lucasflatwhite, with homepage content driven by structured data and project markdown entries.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run check
npm test -- --run
```

## Content Editing

- Add or edit links (GitHub, X, ...) in `src/data/links.ts`. Each link picks a Phosphor icon (registered in `src/lib/icons.ts`) and a hover motion; featured links appear in the first viewport, all links appear in the footer and the `Cmd/Ctrl+K` menu.
- Update the profile text and the game's word pools in `src/data/site.ts`.
- Edit project entries in `src/content/projects/*.md`. A `specimen` (source string, Korean translation, note) puts the project in the Work section.
- The landing lives in `src/pages/index.astro` with `src/styles/landing.css`; the game lives at `/play` (`src/pages/play/index.astro`, `src/styles/play.css`).
- Design tokens (colour, type, motion) are in `src/styles/global.css`. The design plan and anti-slop rules are in `docs/superpowers/specs/2026-10-05-landing-redesign-plan.md`.
