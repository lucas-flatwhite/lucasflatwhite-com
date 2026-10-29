/*
 * The rules a photo meets before it goes into src/assets/photos: upright, its long edge at
 * most LONG_EDGE, a JPEG of at most MAX_BYTES, and no metadata, so no place or camera
 * leaves with it. add.ts applies them; tests/board-photos.test.ts checks every master.
 */
import sharp from 'sharp';

export const LONG_EDGE = 2000;
export const MAX_BYTES = 600 * 1024;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Quality starts here and steps down by five until the photo fits, never below the floor.
const QUALITY = 85;
const QUALITY_FLOOR = 70;

export type PreparedPhoto = { data: Buffer; width: number; height: number; quality: number };

const pad = (value: number) => String(value).padStart(2, '0');

/** The file name: the month it was taken, then the slug, so the folder reads in order. */
export function photoName(date: Date, slug: string): string {
  if (!SLUG.test(slug)) {
    throw new Error(`"${slug}" is not a slug: use lowercase letters, digits and single dashes.`);
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${slug}`;
}

/** EXIF keeps its stamps as "YYYY:MM:DD HH:MM:SS"; the earliest is when the photo was taken. */
export function captureDate(exif: Buffer | undefined): Date | undefined {
  const stamps = [...(exif?.toString('latin1') ?? '').matchAll(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/g)]
    .map(([, ...parts]) => {
      const [year, month, day, hour, minute, second] = parts.map(Number);
      return new Date(year, month - 1, day, hour, minute, second);
    })
    // Cameras without a clock write zeros.
    .filter((date) => date.getFullYear() > 1900);

  return stamps.length > 0 ? new Date(Math.min(...stamps.map(Number))) : undefined;
}

export async function preparePhoto(input: Buffer, { maxBytes = MAX_BYTES } = {}): Promise<PreparedPhoto> {
  // rotate() turns the pixels the way the EXIF says; sharp writes none of the metadata back out.
  const upright = sharp(input)
    .rotate()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true });

  for (let quality = QUALITY; quality >= QUALITY_FLOOR; quality -= 5) {
    const { data, info } = await upright
      .clone()
      .jpeg({ quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    if (data.length <= maxBytes) {
      return { data, width: info.width, height: info.height, quality };
    }
  }

  throw new Error(
    `Even at quality ${QUALITY_FLOOR} the photo is over ${Math.round(maxBytes / 1024)} kB. Crop it or start from a smaller copy.`,
  );
}

/** The collection entry for a master. An empty alt or caption stops the build until it is written. */
export function photoEntry({
  name,
  date,
  alt,
  caption,
}: {
  name: string;
  date: Date;
  alt?: string;
  caption?: string;
}): string {
  const quoted = (text?: string) => (text ? JSON.stringify(text) : "''");

  return [
    `image: ../../assets/photos/${name}.jpg`,
    `alt: ${quoted(alt)}`,
    '# A few words shown on the photo, at most 40 characters.',
    `caption: ${quoted(caption)}`,
    `date: ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    '# Where the crop keeps its middle when the frame is narrower than the photo.',
    '# position: 50% 50%',
    '',
  ].join('\n');
}
