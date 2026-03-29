import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const heroSource = readFileSync(
  resolve(process.cwd(), 'src/components/Hero.astro'),
  'utf8',
);

describe('Hero source contract', () => {
  it('uses the Quiet Monument composition markers', () => {
    expect(heroSource).toContain('siteProfile.heroTitle');
    expect(heroSource).toContain('siteProfile.heroTagline');
    expect(heroSource).toContain('siteProfile.heroSpinnerLabel');
    expect(heroSource).toContain('class="hero-stage"');
    expect(heroSource).toContain('class="hero-spinner-wrap" aria-hidden="true"');
    expect(heroSource).toContain('class="hero-spinner"');
    expect(heroSource).toContain('class="hero-tagline"');
    expect(heroSource).not.toContain('coffee-trigger');
    expect(heroSource).not.toContain('Brew commands');
  });
});
