import { describe, expect, it } from 'vitest';
import { decorationTop } from '../src/lib/board-objects';

describe('decorationTop', () => {
  const space = { left: 100, right: 300, top: 50 };
  it('clears the lowest card across both columns and rounds up fractional pixels', () => {
    const cards = [
      { left: 80, right: 180, bottom: 172 },
      { left: 230, right: 340, bottom: 220.25 },
    ];
    expect(decorationTop(space, cards)).toBe(187);
  });

  it('ignores taller cards in adjacent columns, including shared edges', () => {
    const cards = [
      { left: 0, right: 100, bottom: 400 },
      { left: 300, right: 450, bottom: 500 },
      { left: 100, right: 300, bottom: 150 },
    ];
    expect(decorationTop(space, cards)).toBe(116);
  });

  it('keeps the gutter when the space has no cards below its top edge', () => {
    expect(decorationTop(space, [])).toBe(16);
    expect(decorationTop(space, [{ left: 110, right: 200, bottom: 10 }])).toBe(16);
  });
});
