import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { LONG_EDGE, MAX_BYTES } from '../scripts/photo/prepare.ts';
import { nextIndex } from '../src/lib/photo-deck';
import { newestFirst } from '../src/lib/photos';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const landing = read('src/pages/index.astro');
const photos = read('src/components/BoardPhotos.astro');
const landingStyles = read('src/styles/landing.css');
// Finder drops a .DS_Store into any folder it opens; git ignores it and so do these checks.
const listed = (dir: string) => readdirSync(resolve(process.cwd(), dir)).filter((name) => !name.startsWith('.'));
const masters = resolve(process.cwd(), 'src/assets/photos');
const masterNames = listed('src/assets/photos');
const entries = listed('src/content/photos').map((name) => ({ name, source: read(join('src/content/photos', name)) }));

describe('board photos', () => {
  it('sit between the name and the work', () => {
    const name = landing.indexOf('class="board-copy"');
    const strip = landing.indexOf('<BoardPhotos');
    const work = landing.indexOf('id="work"');

    expect(name).toBeGreaterThan(-1);
    expect(strip).toBeGreaterThan(name);
    expect(work).toBeGreaterThan(strip);
  });

  it('stack in one frame and cover it edge to edge whatever shape the board gives it', () => {
    // The frame's shape follows the rows beside the name, so a photo is cropped to it, never fitted.
    expect(landingStyles).toMatch(/\.photo-slide \{[^}]*position: absolute;[^}]*inset: 0;[^}]*opacity: 0;/);
    expect(landingStyles).toMatch(/\.photo-slide\.is-current \{[^}]*opacity: 1;/);
    expect(landingStyles).toMatch(
      /\.photo-slide img \{[^}]*width: 100%;[^}]*height: 100%;[^}]*object-fit: cover;/,
    );
  });

  it('show each photo with its caption and a dot to jump to it', () => {
    expect(photos).toContain('<figcaption class="photo-caption">{data.caption}</figcaption>');
    expect(photos).toContain('data-photo-dot');
    expect(photos).toContain("class:list={['photo-slide', { 'is-current': index === 0 }]}");
    expect(landing).toContain('bindPhotoDeck(deck)');
  });

  it('turn to the next photo and back to the first after the last', () => {
    expect([0, 1, 2].map((index) => nextIndex(index, 3))).toEqual([1, 2, 0]);
    expect(nextIndex(0, 1)).toBe(0);
  });

  it('load the first photo at once and cut AVIF and WebP copies for each screen', () => {
    expect(photos).toContain("formats={['avif', 'webp']}");
    expect(photos).toContain('priority={index === 0}');
    expect(photos).toContain('sizes={sizes}');
  });

  it('put the newest photo first and break a tie by name', () => {
    const photo = (id: string, date: string) => ({ id, data: { date: new Date(date) } });
    const sorted = newestFirst([photo('a', '2026-01-01'), photo('c', '2026-10-01'), photo('b', '2026-10-01')]);

    expect(sorted.map((entry) => entry.id)).toEqual(['b', 'c', 'a']);
  });
});

// Guards the rules `npm run photo` applies, so a photo dropped in by hand is caught too.
describe('photo masters', () => {
  it('give every photo a short caption', () => {
    for (const entry of entries) {
      const caption = entry.source.match(/^caption: "(.+)"$/m)?.[1] ?? '';

      expect(caption.length, entry.name).toBeGreaterThan(0);
      expect(caption.length, entry.name).toBeLessThanOrEqual(40);
    }
  });

  it('pair every master with one entry that points at it', () => {
    const pointedAt = entries.map((entry) => entry.source.match(/^image: \.\.\/\.\.\/assets\/photos\/(.+)$/m)?.[1]);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.name.endsWith('.yaml'))).toBe(true);
    expect([...pointedAt].sort()).toEqual([...masterNames].sort());
  });

  it('keep no metadata, so no place or camera leaves with a photo', async () => {
    for (const name of masterNames) {
      const meta = await sharp(join(masters, name)).metadata();

      expect(meta.format, name).toBe('jpeg');
      expect(meta.exif, name).toBeUndefined();
      expect(meta.xmp, name).toBeUndefined();
      expect(meta.iptc, name).toBeUndefined();
    }
  });

  it('keep the masters small enough to commit', async () => {
    for (const name of masterNames) {
      const { width = 0, height = 0 } = await sharp(join(masters, name)).metadata();

      expect(Math.max(width, height), name).toBeLessThanOrEqual(LONG_EDGE);
      expect(statSync(join(masters, name)).size, name).toBeLessThanOrEqual(MAX_BYTES);
    }
  });
});
