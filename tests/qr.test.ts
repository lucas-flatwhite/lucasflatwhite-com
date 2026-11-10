import jsQR from 'jsqr';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CARD_QR_TEXT } from '../src/data/card';
import { qrMatrix, qrSvg } from '../src/lib/qr';

/** Rasterizes the SVG at `width` px wide and reads it back the way a phone camera would. */
async function decode(svg: string, width: number): Promise<string | null> {
  const viewBox = Number(svg.match(/viewBox="0 0 ([\d.]+)/)![1]);
  const { data, info } = await sharp(Buffer.from(svg), { density: (72 * width * 2) / viewBox })
    .resize(width)
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}

describe('the QR on my card', () => {
  it('fits version 3 because the text is upper case', () => {
    expect(qrMatrix(CARD_QR_TEXT).size).toBe(29);
    expect(qrMatrix('https://lucasflatwhite.com/hi/').size).toBe(33);
  });

  it('draws three round finder rings and dots, sized in modules', () => {
    const { svg, size } = qrSvg(CARD_QR_TEXT);
    expect(size).toBe(29);
    expect(svg).toContain('viewBox="0 0 35 35"');
    expect(svg).not.toMatch(/<svg[^>]*\swidth=/);
    expect(svg.match(/fill-rule="evenodd"/g)?.length).toBe(3);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="QR code to lucasflatwhite.com"');
  });

  it('leaves the center 7 by 7 modules empty for my face', () => {
    const { svg } = qrSvg(CARD_QR_TEXT);
    const dots = svg.match(/<path d="([^"]+)" fill="#171717"\/>/)![1];
    // Each dot starts at its left edge: M(cx - r),cy a r,r ...
    const centers = [...dots.matchAll(/M([\d.]+),([\d.]+)a([\d.]+),/g)].map((m) => [Number(m[1]) + Number(m[3]), Number(m[2])]);
    expect(centers.length).toBeGreaterThan(200);
    // Modules 11 to 17 of 29, plus the 3-module quiet zone, span 14 to 21 in the viewBox.
    const inside = centers.filter(([x, y]) => x > 14 && x < 21 && y > 14 && y < 21);
    expect(inside).toEqual([]);
  });

  it('draws each dot 0.86 of a module across', () => {
    const { svg } = qrSvg(CARD_QR_TEXT);
    expect(svg).toMatch(/a0\.43,0\.43 0 1 0 0\.86,0/);
  });

  it.each([300, 150])('reads back as my address at %ipx', async (width) => {
    expect(await decode(qrSvg(CARD_QR_TEXT).svg, width)).toBe(CARD_QR_TEXT);
  });

  it('still reads with a dark disc over the center, where my face sits', async () => {
    const { svg } = qrSvg(CARD_QR_TEXT);
    const covered = svg.replace('</svg>', '<circle cx="17.5" cy="17.5" r="3.5" fill="#171717"/></svg>');
    expect(await decode(covered, 300)).toBe(CARD_QR_TEXT);
  });
});
