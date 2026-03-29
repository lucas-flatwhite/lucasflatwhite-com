import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalStyles = readFileSync(
  resolve(process.cwd(), 'src/styles/global.css'),
  'utf8',
);

describe('Hero style contract', () => {
  it('defines the graphite hero tokens and hooks', () => {
    expect(globalStyles).toContain('--bg: #0b0d10');
    expect(globalStyles).toContain('--surface: #11161d');
    expect(globalStyles).toContain('--text: #f5f7fa');
    expect(globalStyles).toContain('--muted: #8e99a8');
    expect(globalStyles).toContain('.hero-stage');
    expect(globalStyles).toContain('.hero-spinner-wrap');
    expect(globalStyles).toContain('.hero-spinner');
    expect(globalStyles).toContain('.hero-tagline');
    expect(globalStyles).toContain('.sr-only');
    expect(globalStyles).toContain('.command-shelf-trigger');
    expect(globalStyles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('lays out the hero spinner beside the title block on desktop and stacks on mobile', () => {
    expect(globalStyles).toContain('grid-template-columns: auto minmax(0, 1fr);');
    expect(globalStyles).toContain('align-items: start;');
    expect(globalStyles).toContain('.hero-spinner-wrap');
    expect(globalStyles).toContain('.hero h1');
    expect(globalStyles).toContain('.hero-actions');
    expect(globalStyles).toContain('margin-left: calc(3.5rem + 1.4rem);');
    expect(globalStyles).toContain('@media (max-width: 640px)');
    expect(globalStyles).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(globalStyles).toContain('margin-left: 0;');
  });
});
