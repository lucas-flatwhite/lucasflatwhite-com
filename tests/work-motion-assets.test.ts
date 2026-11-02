import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { YEARS } from '../scripts/work-art/years.js';

// Guards the baked motion from scripts/work-art/motion.ts: the moving pictures reach the page
// as layers and films the compositor moves, never as inline SVG redrawn every frame.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const motion = (name: string) => resolve(root, 'src/assets/work/motion', name);

describe('years layers', () => {
  const css = read('src/assets/work/motion/years.css');

  it('bakes the ground and one window per year', () => {
    expect(existsSync(motion('years-base.webp'))).toBe(true);
    YEARS.forEach((_: unknown, i: number) => expect(existsSync(motion(`years-${i}.webp`)), `years-${i}`).toBe(true));
    expect(existsSync(motion(`years-${YEARS.length}.webp`))).toBe(false);
  });

  it('plays one keyframe track per window, only when motion is welcome', () => {
    const [still, moving] = css.split('@media (prefers-reduced-motion: no-preference)');

    expect(still).not.toMatch(/animation:/);
    expect(still).toMatch(/\.years-last \{ opacity: 1; \}/);
    expect(moving.match(/@keyframes years-layer\d/g)).toHaveLength(YEARS.length);
    expect(moving).toMatch(/animation: years-layer0 4\.88s infinite both/);
  });

  it('moves the windows with transform and opacity alone', () => {
    const properties = [...css.matchAll(/@keyframes[^{]+\{([\s\S]*?\})\s*\}/g)]
      .flatMap(([, body]) => [...body.matchAll(/([a-z-]+):/g)].map(([, property]) => property));

    expect(new Set(properties)).toEqual(new Set(['opacity', 'transform', 'animation-timing-function']));
  });

  it('draws the years card from the layers, not from inline SVG', () => {
    const card = read('src/components/WorkYears.astro');

    expect(card).toContain("import '../assets/work/motion/years.css'");
    expect(card).toContain('role="img"');
    expect(card).toContain('alt=""');
    expect(read('src/components/ProjectCard.astro')).toContain("motion === 'years' ? <WorkYears");
    expect(read('src/pages/index.astro')).not.toContain('ai-timeline-log.svg?raw');
  });
});
