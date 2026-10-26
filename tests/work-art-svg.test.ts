import { describe, expect, it } from 'vitest';
import { plateSvg, simplifyPath } from '../scripts/work-art/svg.ts';

describe('simplifyPath', () => {
  it('drops the points that sit on a straight run', () => {
    expect(simplifyPath('M0 0L1 0L2 0L3 0Z', 0.15)).toBe('M0 0l3 0z');
  });

  it('keeps a corner', () => {
    expect(simplifyPath('M0 0L10 0L10 10Z', 0.15)).toBe('M0 0l10 0l0 10z');
  });

  it('rounds to the half pixel and drops the leading zero', () => {
    expect(simplifyPath('M0.26 0L4.74 0Z', 0.15)).toBe('M.5 0l4 0z');
  });
});

describe('plateSvg', () => {
  it('prints the plate as a standalone document on the deep blue ground', () => {
    const svg = plateSvg('M0 0l1 0z');

    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480" width="720" height="480">')).toBe(true);
    expect(svg).toContain('fill="#16278a"');
    expect(svg).toContain('<path d="M0 0l1 0z" fill="#f2f3f7"/>');
    expect(svg).toContain('<rect id="caret" x="150" y="220" width="14" height="48" fill="#f2f3f7"/>');
  });
});
