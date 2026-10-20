import { describe, expect, it } from 'vitest';
import { embedFonts, usedText } from '../scripts/work-art/fonts.ts';
import { covers, fontFaces } from './support/font-faces';

const sample = '<svg xmlns="http://www.w3.org/2000/svg"><text>cat 고양이</text></svg>';

describe('usedText', () => {
  it('collects each character set in text once, in code point order, with the space', () => {
    expect(usedText(sample)).toBe(' act고양이');
  });
});

describe('embedFonts', () => {
  it('carries one Anybody face that keeps both of its axes', async () => {
    const anybody = fontFaces(await embedFonts(sample)).filter((face) => face.family === 'Anybody');

    expect(anybody).toHaveLength(1);
    expect(anybody[0].rule).toContain('font-weight:100 900');
    expect(anybody[0].rule).toContain('font-stretch:50% 150%');
    expect(anybody[0].rule).toContain('data:font/woff2;base64,');
  });

  it('carries the Noto Sans KR pieces that cover every Hangul syllable used', async () => {
    const noto = fontFaces(await embedFonts(sample)).filter((face) => face.family === 'Noto Sans KR');

    expect(noto.length).toBeGreaterThan(0);
    expect(noto.every((face) => face.ranges.length > 0)).toBe(true);
    expect(['고', '양', '이'].every((char) => covers(noto, char))).toBe(true);
  });

  it('leaves the document a standalone SVG', async () => {
    expect((await embedFonts(sample)).startsWith('<svg xmlns=')).toBe(true);
  });
});
