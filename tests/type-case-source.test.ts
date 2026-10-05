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

    for (const char of 'LucasFlatwhite') {
      expect(latin).toContain(char);
    }

    for (const char of '루카스플랫화이트') {
      expect(hangul).toContain(char);
    }

    expect(scene).toContain("{ text: 'Lucas', face: 'latin', size: 1 }");
    expect(scene).toContain("{ text: 'Flatwhite', face: 'latin', size: 1 }");
    expect(scene).toContain("{ text: '루카스 플랫화이트', face: 'hangul', size: 0.62 }");
  });

  it('loads three.js only when the section comes near, and only with WebGL', () => {
    expect(landing).not.toMatch(/from 'three'/);
    expect(loader).not.toMatch(/from 'three'/);
    expect(loader).toContain("await import('./type-case')");
    expect(loader).toContain('supportsWebGL()');
    expect(loader).toContain("rootMargin: '600px 0px'");
  });

  it('keeps a readable fallback and a real button', () => {
    expect(landing).toContain('class="case-fallback"');
    expect(landing).toContain('data-case-proof');
    expect(landing).toContain('role="img"');
  });

  it('renders on demand and stops off screen', () => {
    expect(scene).toContain('new IntersectionObserver');
    expect(scene).toContain("document.addEventListener('visibilitychange', wake)");
    expect(scene).toContain('Math.min(window.devicePixelRatio || 1, 2)');
  });
});
