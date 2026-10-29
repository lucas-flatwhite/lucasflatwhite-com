/*
 * Adds a photo to the board. Run it on your own machine before committing:
 *
 *     npm run photo -- <file> <slug> [--alt "..."] [--date YYYY-MM-DD]
 *
 * It writes the master to src/assets/photos/ and its entry to src/content/photos/, both
 * named after the month the photo was taken, and leaves the original where it is. The
 * date comes from --date, then the photo's own EXIF, then today. HEIC from an iPhone
 * goes through macOS sips first, since sharp's prebuilt binaries cannot read it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { SLUG, captureDate, photoEntry, photoName, preparePhoto } from './prepare.ts';

const MASTERS = new URL('../../src/assets/photos/', import.meta.url);
const ENTRIES = new URL('../../src/content/photos/', import.meta.url);
const USAGE = 'Usage: npm run photo -- <file> <slug> [--alt "..."] [--date YYYY-MM-DD]';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function read(path: string): Buffer {
  if (!/^\.hei[cf]$/i.test(extname(path))) return readFileSync(path);

  const dir = mkdtempSync(join(tmpdir(), 'photo-'));
  try {
    const out = join(dir, 'photo.jpg');
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', path, '--out', out], {
      stdio: 'ignore',
    });
    return readFileSync(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { alt: { type: 'string' }, date: { type: 'string' } },
});
const [source, slug] = positionals;

if (!source || !slug || positionals.length > 2) fail(USAGE);
if (!SLUG.test(slug)) fail(`"${slug}" is not a slug: use lowercase letters, digits and single dashes.`);
if (!existsSync(source)) fail(`No file at ${source}`);
if (values.date && !/^\d{4}-\d\d-\d\d$/.test(values.date)) fail(`--date takes YYYY-MM-DD, not ${values.date}`);

const input = read(source);
const original = await sharp(input).metadata();
const taken = captureDate(original.exif);
const date = values.date ? new Date(`${values.date}T00:00`) : (taken ?? new Date());
const name = photoName(date, slug);
const master = new URL(`${name}.jpg`, MASTERS);
const entry = new URL(`${name}.yaml`, ENTRIES);
const shown = (url: URL) => relative(process.cwd(), fileURLToPath(url));

for (const target of [master, entry]) {
  if (existsSync(target)) fail(`${shown(target)} already exists. Pick another slug or remove it first.`);
}

const photo = await preparePhoto(input);
const stripped = (['exif', 'xmp', 'iptc'] as const).filter((key) => original[key] !== undefined);

mkdirSync(MASTERS, { recursive: true });
mkdirSync(ENTRIES, { recursive: true });
writeFileSync(master, photo.data);
writeFileSync(entry, photoEntry({ name, date, alt: values.alt }));

console.log(
  [
    `${shown(master)}  ${photo.width}x${photo.height}, ${Math.round(photo.data.length / 1024)} kB, quality ${photo.quality}`,
    shown(entry),
    stripped.length > 0
      ? `Removed the original's ${stripped.join(', ').toUpperCase()} (place, camera and the like).`
      : 'The original carried no metadata.',
    `Dated from ${values.date ? '--date' : taken ? 'the photo' : 'today, since the photo has no date'}.`,
    values.alt ? '' : 'Write the alt in the entry next; the build stops while it is empty.',
  ]
    .filter(Boolean)
    .join('\n'),
);
