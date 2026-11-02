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
    expect(moving).toMatch(/animation-name: years-layer0; animation-duration: 4\.88s; animation-iteration-count: infinite; animation-fill-mode: both;/);
    // The shorthand would reset animation-play-state, which the off-screen pause relies on.
    expect(css).not.toMatch(/\banimation:/);
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

describe('ripple films', () => {
  type Tier = { name: string; media: string; still: string; framerate: number; start: number; sources: { file: string; type: string; bitrate: number }[] };
  const { tiers } = JSON.parse(read('src/assets/work/motion/ripple.json')) as { tiers: Tier[] };

  it('films the ripple once per card size, the widest without a media query', () => {
    expect(tiers.map((tier) => tier.name)).toEqual(['phone', 'desk', 'wide']);
    expect(tiers[0].media).toBe('(max-width: 720px)');
    expect(tiers.at(-1)!.media).toBe('');
  });

  it('offers AV1 first and H.264 after it, each typed with its codec, beside a still', () => {
    for (const tier of tiers) {
      expect(tier.sources.map((source) => source.type.match(/codecs="(\w+)\./)![1])).toEqual(['av01', 'avc1']);
      for (const file of [tier.still, ...tier.sources.map((source) => source.file)]) {
        expect(existsSync(motion(file)), file).toBe(true);
      }
    }
  });

  it('keeps every film light enough to fetch when its card comes on screen, and records its bitrate', () => {
    for (const tier of tiers) {
      expect(tier.framerate).toBe(30);
      for (const { file, bitrate } of tier.sources) {
        const bytes = readFileSync(motion(file)).length;
        expect(bytes, file).toBeLessThanOrEqual(400 * 1024);
        expect(bitrate, file).toBe(Math.round((bytes * 8) / 6.4));
      }
    }
  });

  it('starts each film inside the loop, on a frame, so it can loop where the ring has faded', () => {
    for (const tier of tiers) {
      expect(tier.start).toBeGreaterThan(0);
      expect(tier.start).toBeLessThan(6.4);
      expect((tier.start * tier.framerate) % 1).toBeCloseTo(0.25, 2);
    }
    expect(read('src/components/WorkRipple.astro')).toContain('#t=${tier.start}');
  });

  it('loads the film only on play, keeps it out of the accessibility tree, and never autoplays', () => {
    const card = read('src/components/WorkRipple.astro');

    expect(card).toContain('preload="none"');
    expect(card).toMatch(/<video muted loop playsinline/);
    expect(card).not.toContain('autoplay');
    expect(card).toContain('aria-hidden="true"');
    expect(card).toContain('role="img"');
  });
});

describe('phones', () => {
  it('play the pictures like every other screen, since nothing is redrawn as they move', () => {
    expect(read('src/styles/landing.css')).not.toMatch(/\.project-motion[^{]*\{[^}]*animation: none/);
    expect(read('src/lib/work-motion.ts')).not.toContain('max-width: 720px');
  });

  it('swap the name at the same pace and keep the snake crawling, as every other screen does', () => {
    for (const path of ['src/lib/name-swap.ts', 'src/lib/snake-preview.ts']) {
      expect(read(path), path).not.toMatch(/max-width: 720px|PHONE_/);
    }
    // The snake still rests off screen and in a hidden tab, like the Work pictures.
    expect(read('src/lib/snake-preview.ts')).toContain('IntersectionObserver');
    expect(read('src/lib/snake-preview.ts')).toContain('visibilitychange');
  });
});
