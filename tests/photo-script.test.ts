import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { captureDate, photoEntry, photoName, preparePhoto } from '../scripts/photo/prepare.ts';

// A camera shot: landscape pixels marked "rotate 90° clockwise", carrying a note and a place.
async function cameraShot(width: number, height: number, noise = false) {
  const base = noise
    ? sharp(Buffer.from(Array.from({ length: width * height * 3 }, () => Math.floor(Math.random() * 256))), {
        raw: { width, height, channels: 3 },
      })
    : sharp({ create: { width, height, channels: 3, background: '#7a9cc6' } });

  return base
    .withExif({
      IFD0: { Copyright: 'camera', DateTime: '2026:11:02 09:00:00' },
      IFD2: { DateTimeOriginal: '2026:10:28 15:23:11' },
      IFD3: { GPSLatitudeRef: 'N', GPSLongitudeRef: 'E' },
    })
    .withMetadata({ orientation: 6 })
    .jpeg({ quality: 95 })
    .toBuffer();
}

describe('photoName', () => {
  it('leads with the month the photo was taken', () => {
    expect(photoName(new Date(2026, 9, 28), 'podium')).toBe('2026-10-podium');
  });

  it('takes only a lowercase, dashed slug', () => {
    expect(() => photoName(new Date(2026, 9, 28), 'Podium Talk')).toThrow();
    expect(() => photoName(new Date(2026, 9, 28), '-podium')).toThrow();
  });
});

describe('captureDate', () => {
  it('reads the earliest stamp, the moment the shutter closed and not a later edit', async () => {
    const { exif } = await sharp(await cameraShot(40, 30)).metadata();
    const date = captureDate(exif);

    expect([date?.getFullYear(), date?.getMonth(), date?.getDate()]).toEqual([2026, 9, 28]);
  });

  it('says nothing for a photo without one', () => {
    expect(captureDate(undefined)).toBeUndefined();
  });
});

describe('preparePhoto', () => {
  it('stands the photo upright and fits its long edge in 2000px', async () => {
    const photo = await preparePhoto(await cameraShot(4000, 3000));

    expect([photo.width, photo.height]).toEqual([1500, 2000]);
  });

  it('never enlarges a small photo', async () => {
    const photo = await preparePhoto(await cameraShot(1360, 768));

    expect(Math.max(photo.width, photo.height)).toBe(1360);
  });

  it('strips every bit of metadata, the place included', async () => {
    const photo = await preparePhoto(await cameraShot(400, 300));
    const meta = await sharp(photo.data).metadata();

    expect(meta.format).toBe('jpeg');
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(meta.iptc).toBeUndefined();
  });

  it('lowers the quality until the photo fits the size limit', async () => {
    const input = await cameraShot(600, 400, true);
    const loose = await preparePhoto(input, { maxBytes: Infinity });
    const tight = await preparePhoto(input, { maxBytes: loose.data.length - 1 });

    expect(loose.quality).toBe(85);
    expect(tight.quality).toBeLessThan(85);
    expect(tight.data.length).toBeLessThan(loose.data.length);
  });

  it('gives up rather than ship a blurry photo', async () => {
    await expect(preparePhoto(await cameraShot(600, 400, true), { maxBytes: 1 })).rejects.toThrow();
  });
});

describe('photoEntry', () => {
  it('points at the master and leaves the alt and caption to fill when none is given', () => {
    const entry = photoEntry({ name: '2026-10-podium', date: new Date(2026, 9, 28) });

    expect(entry).toContain('image: ../../assets/photos/2026-10-podium.jpg\n');
    expect(entry).toContain('date: 2026-10-28\n');
    expect(entry).toContain("alt: ''\n");
    expect(entry).toContain("caption: ''\n");
  });

  it('writes the caption when one is given', () => {
    const entry = photoEntry({ name: 'x', date: new Date(2026, 9, 28), caption: 'Bamtori, on guard.' });

    expect(entry).toContain('caption: "Bamtori, on guard."\n');
  });

  it('quotes the alt so any sentence stays valid YAML', () => {
    const entry = photoEntry({ name: 'x', date: new Date(2026, 9, 28), alt: 'Lucas: "hello", #1' });

    expect(entry).toContain('alt: "Lucas: \\"hello\\", #1"\n');
  });
});
