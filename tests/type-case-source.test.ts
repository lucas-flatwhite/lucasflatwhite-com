import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import sortData from '../src/data/type-sorts.json';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const scene = read('src/lib/type-case.ts');
const loader = read('src/lib/type-case-loader.ts');
const landing = read('src/pages/index.astro');

describe('type case', () => {
  it('has an outline for every letter the forme sets', () => {
    const latin = Object.keys(sortData.latin.glyphs);

    for (const char of 'Makeitwork,makeitright,makeitfast.') {
      expect(latin).toContain(char);
    }

    expect(scene).toContain("{ text: 'Make it work,', face: 'latin', size: 1 }");
    expect(scene).toContain("{ text: 'make it right,', face: 'latin', size: 1 }");
    expect(scene).toContain("{ text: 'make it fast.', face: 'latin', size: 1 }");
  });

  it('prints the rule as it was set, in the one face it was cast in', () => {
    expect(Object.keys(sortData)).toEqual(['latin']);
    expect(scene).not.toMatch(/translat/i);
    expect(landing).not.toContain('Translate');
  });

  it('loads three.js only when the section comes near, and only with WebGL', () => {
    expect(landing).not.toMatch(/from 'three'/);
    expect(loader).not.toMatch(/from 'three'/);
    expect(loader).toContain("await import('./type-case')");
    expect(loader).toContain('supportsWebGL()');
    expect(loader).toContain("rootMargin: '600px 0px'");
  });

  it('keeps a readable fallback and credits the quote in the intro, not on the stage', () => {
    expect(landing).toContain('class="case-fallback"');
    expect(landing).toContain('role="img"');
    expect(landing).toContain("Kent Beck's three steps");
    expect(landing).not.toContain('case-credit');
  });

  it('runs the press from the scroll, and shows the finished proof to reduced motion', () => {
    expect(landing).toContain('data-case-track');
    expect(landing).toContain('data-case-stage');
    expect(loader).toContain("window.addEventListener('scroll', update, { passive: true })");
    expect(loader).toContain('typeCase.scrub(1)');
    expect(scene).toContain('scrub: (next) =>');
  });

  it('keeps the timeline out of three.js and lets the meter follow the press', () => {
    expect(read('src/lib/press-timeline.ts')).not.toMatch(/from 'three'/);
    expect(scene).toContain("from './press-timeline'");
    expect(loader).toContain('mountTypeCase(canvas, follow)');
    expect(landing).toContain('data-case-meter');
  });

  it('renders on demand and stops off screen', () => {
    expect(scene).toContain('new IntersectionObserver');
    expect(scene).toContain("document.addEventListener('visibilitychange', wake)");
    expect(scene).toContain('Math.min(window.devicePixelRatio || 1, 2)');
  });
});
