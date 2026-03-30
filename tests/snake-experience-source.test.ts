import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const experienceSource = readFileSync(
  resolve(process.cwd(), 'src/components/SnakeExperience.astro'),
  'utf8',
);

describe('snake experience source contract', () => {
  it('keeps only the compact top strip and removes the left intro panel', () => {
    expect(experienceSource).toContain('<span class="identity-label">/lucas-flatwhite</span>');
    expect(experienceSource).toContain('class="identity-strip"');
    expect(experienceSource).toContain('class="identity-score" data-experience-score');
    expect(experienceSource).not.toContain('class="experience-copy"');
    expect(experienceSource).not.toContain('experience-kicker');
    expect(experienceSource).not.toContain('id="experience-title"');
    expect(experienceSource).not.toContain('collision detected');
    expect(experienceSource).not.toContain('data-experience-restart');
    expect(experienceSource).not.toContain('data-experience-overlay-copy');
    expect(experienceSource).not.toContain('The field folded shut');
    expect(experienceSource).not.toContain('class="identity-spacer"');
    expect(experienceSource).not.toContain('fallback-copy');
    expect(experienceSource).not.toContain('class="experience-overlay"');
    expect(experienceSource).not.toContain('data-experience-overlay');
  });
});
