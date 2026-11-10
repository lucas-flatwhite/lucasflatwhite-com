import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { card } from '../src/data/card';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('my business card', () => {
  const source = read('src/components/BusinessCard.astro');

  it('keeps the line about me from the mockup', () => {
    expect(card.role).toBe('Software engineer. Spots problems, then solves them.');
    expect(card.url).toBe('lucasflatwhite.com');
    expect(card.scan).toBe('Scan');
  });

  it('marks every part the intro moves or sets aside', () => {
    for (const part of ['avatar', 'handle', 'name', 'ko', 'role', 'dot', 'qr', 'url']) {
      expect(source).toContain(`data-card-part="${part}"`);
    }
  });

  it('draws the QR to the /HI address from the one shared drawing', () => {
    expect(source).toContain('qrSvg(CARD_QR_TEXT');
  });

  it('sizes everything from its own width, so one card serves the dialog, the image and the intro', () => {
    const style = source.slice(source.indexOf('<style>'));
    expect(style).toContain('container-type: inline-size');
    expect(style).toContain('aspect-ratio: 5 / 9');
    const lengths = style
      .replace(/box-shadow:[^;]+;/g, '')
      .replace(/--card-width:[^;]+;/g, '')
      .replace(/var\(--card-width, 330px\)/g, '');
    expect(lengths.match(/\d+px/g) ?? []).toEqual([]);
  });

  it('drops its corners and shadow when it is baked into an image', () => {
    expect(source).toMatch(/\[data-card-print\][^{]*\.business-card[^{]*\{[^}]*border-radius: 0;[^}]*box-shadow: none;/s);
  });
});
