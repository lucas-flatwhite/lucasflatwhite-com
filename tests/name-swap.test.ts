import { describe, expect, it } from 'vitest';
import { GLYPH_ANGLES, GLYPH_STYLES, GLYPH_THEMES } from '../src/lib/name-glyphs';
import { GAP_MS, gapAfterSwap, PHONE_CYCLE_MS, pickOther, rollGlyph, SHOW_MS } from '../src/lib/name-swap';

const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('pickOther', () => {
  it('never hands back the previous item twice in a row', () => {
    const items = ['a', 'b', 'c'];
    for (const r of [0, 0.34, 0.67, 0.99]) {
      expect(pickOther(items, 'a', () => r)).not.toBe('a');
      expect(pickOther(items, 'c', () => r)).not.toBe('c');
    }
  });

  it('can land on every other item', () => {
    const items = ['a', 'b', 'c'];
    expect(pickOther(items, 'a', () => 0)).toBe('b');
    expect(pickOther(items, 'a', () => 0.99)).toBe('c');
  });

  it('picks from the whole list when there is no previous item', () => {
    expect(pickOther(['a', 'b'], undefined, () => 0)).toBe('a');
    expect(pickOther(['a', 'b'], undefined, () => 0.99)).toBe('b');
  });

  it('returns the only item rather than nothing', () => {
    expect(pickOther(['a'], 'a', () => 0.5)).toBe('a');
  });
});

describe('rollGlyph', () => {
  it('draws theme, style and angle from the fixed sets', () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      const glyph = rollGlyph(undefined, () => r);
      expect(GLYPH_THEMES).toContain(glyph.theme);
      expect(GLYPH_STYLES).toContain(glyph.style);
      expect(GLYPH_ANGLES).toContain(glyph.angle);
    }
  });

  it('never repeats the previous theme', () => {
    for (const theme of GLYPH_THEMES) {
      expect(rollGlyph(theme, sequence(0, 0, 0)).theme).not.toBe(theme);
    }
  });

  it('never leaves the letter upright', () => {
    expect(GLYPH_ANGLES).not.toContain(0);
  });
});

describe('gapAfterSwap', () => {
  it('keeps the quick cycle on a wide screen', () => {
    expect(gapAfterSwap(false)).toBe(GAP_MS);
  });

  it('shows one picture every four seconds on a phone', () => {
    expect(PHONE_CYCLE_MS).toBe(4000);
    expect(SHOW_MS + gapAfterSwap(true)).toBe(PHONE_CYCLE_MS);
  });
});
