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
});
