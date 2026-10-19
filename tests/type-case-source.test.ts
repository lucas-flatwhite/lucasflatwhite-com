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
    const hangul = Object.keys(sortData.hangul.glyphs);

    for (const char of 'Makeitwork,makeitright,makeitfast.') {
      expect(latin).toContain(char);
    }

    for (const char of '돌아가게,바르게,빠르게.') {
      expect(hangul).toContain(char);
    }

    expect(scene).toContain("{ text: 'Make it work,', face: 'latin', size: 1 }");
    expect(scene).toContain("{ text: 'make it right,', face: 'latin', size: 1 }");
    expect(scene).toContain("{ text: 'make it fast.', face: 'latin', size: 1 }");
    expect(scene).toContain("const TRANSLATION: readonly string[] = ['돌아가게,', '바르게,', '빠르게.'];");
  });

  it('loads three.js only when the section comes near, and only with WebGL', () => {
    expect(landing).not.toMatch(/from 'three'/);
    expect(loader).not.toMatch(/from 'three'/);
    expect(loader).toContain("await import('./type-case')");
    expect(loader).toContain('supportsWebGL()');
    expect(loader).toContain("rootMargin: '600px 0px'");
  });

  it('keeps a readable fallback', () => {
    expect(landing).toContain('class="case-fallback"');
    expect(landing).toContain('role="img"');
  });

  it('runs the press from the scroll, and shows the finished proof to reduced motion', () => {
    expect(landing).toContain('data-case-track');
    expect(landing).toContain('data-case-stage');
    expect(loader).toContain("window.addEventListener('scroll', update, { passive: true })");
    expect(loader).toContain('typeCase.scrub(1)');
    expect(scene).toContain('scrub: (next) =>');
  });

  it('renders on demand and stops off screen', () => {
    expect(scene).toContain('new IntersectionObserver');
    expect(scene).toContain("document.addEventListener('visibilitychange', wake)");
    expect(scene).toContain('Math.min(window.devicePixelRatio || 1, 2)');
  });
});
