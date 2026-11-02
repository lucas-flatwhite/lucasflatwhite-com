/*
 * Bakes the motion of the two Work pictures into files the browser can move without
 * redrawing a single glass filter, into src/assets/work/motion/. `npm run art` runs it
 * after drawing the pictures; run it alone when only the baking changes:
 *
 *     npm run art:motion
 *
 * - years: each window already carries its own glass and backdrop, so it moves as one piece.
 *   The ground and the two back windows become one image, each year's window another, and
 *   years.css plays the picture's own keyframes on them.
 * - ripple: the ring bends differently under every pane as it spreads, so it is filmed.
 *   One film per card size, because the ring is always drawn 3px wide on screen. Each film
 *   starts on the still picture, so nothing jumps when it begins to play.
 *
 * Needs the installed Google Chrome and ffmpeg (with libsvtav1 and libx264) on the PATH.
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium, type Page } from 'playwright-core';
import sharp from 'sharp';
import { DURATION, keyframes, ORIGIN, YEARS } from './years.js';

const run = promisify(execFile);
const ART = new URL('../../src/assets/work/', import.meta.url);
const OUT = new URL('motion/', ART);
const W = 720;
const H = 480;

/* Picture units to pixels for the years layers: enough for a tall card on a 2x screen. */
const LAYER_RES = 2;
const FPS = 30;
const RIPPLE_LOOP_MS = 6400;
/* The ring rests at this scale in the still picture; each film starts there. */
const RIPPLE_REST = 1.35;
/* The ring's width on screen. The films bake it in at the card size each one is for. */
const RING_PX = 3;

type Tier = { name: string; media: string; width: number; height: number; square: boolean; cardScale: number };

/*
 * cardScale is the card's CSS pixels per picture unit the film is tuned for; the card shows
 * the picture's full 480 units of height. Measured on the board: phones show a 158 to 192px
 * square; the board's ripple card is a tall one, 357 to 454px high from 1024 to 1599px wide
 * and 554 (1920) to 754px (2560) beyond. A tall or square card never shows more than the
 * middle 480 units across, so every film is that square, which keeps them small.
 */
const TIERS: Tier[] = [
  { name: 'phone', media: '(max-width: 720px)', width: 576, height: 576, square: true, cardScale: 0.36 },
  { name: 'desk', media: '(max-width: 1599px)', width: 816, height: 816, square: true, cardScale: 0.82 },
  { name: 'wide', media: '', width: 1024, height: 1024, square: true, cardScale: 1.3 },
];

export type RippleTier = {
  name: string;
  media: string;
  width: number;
  height: number;
  still: string;
  sources: { file: string; type: string }[];
};

async function open(svg: string, width: number, height: number, scale: number, slice = false): Promise<Page> {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on('close', () => browser.close());
  const root = slice ? svg.replace(/^<svg /, '<svg preserveAspectRatio="xMidYMid slice" ') : svg;
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;background:transparent}#c{width:${width}px;height:${height}px}#c>svg{display:block;width:100%;height:100%}</style><div id="c">${root}</div>`,
  );
  await page.evaluate(() => document.fonts.ready);
  return page;
}

const shot = (page: Page, transparent = false) => page.locator('#c').screenshot({ omitBackground: transparent });

/** The smallest box, in pixels, around everything in a transparent RGBA picture. */
async function inked(png: Buffer) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [left, top, right, bottom] = [info.width, info.height, 0, 0];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
      }
    }
  }
  return { left, top, right, bottom };
}

const pct = (n: number) => `${+n.toFixed(4)}%`;

async function bakeYears(svg: string): Promise<void> {
  const page = await open(svg, W, H, LAYER_RES);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // Show one part of the picture at a time: the ground and back windows, or a single year.
  const only = (year: number | null) =>
    page.evaluate((year) => {
      for (const part of document.querySelector('#years')!.children as HTMLCollectionOf<SVGElement>) {
        const window = part.classList.contains('years-yr');
        const shown = part.tagName === 'defs' || (year === null ? !window : part.classList.contains(`years-yr${year}`));
        part.style.display = shown ? '' : 'none';
        part.style.opacity = window && shown ? '1' : '';
      }
    }, year);

  await only(null);
  await sharp(await shot(page)).webp({ quality: 90, effort: 6 }).toFile(fileURLToPath(new URL('years-base.webp', OUT)));

  const windows: Buffer[] = [];
  for (let i = 0; i < YEARS.length; i++) {
    await only(i);
    windows.push(await shot(page, true));
  }
  await page.close();

  // Every year's window has the same glass and shadow, so one box (on whole picture units) holds them all.
  const boxes = await Promise.all(windows.map(inked));
  const unit = (n: number, round: (n: number) => number) => round(n / LAYER_RES) * LAYER_RES;
  const box = {
    left: unit(Math.min(...boxes.map((b) => b.left)), Math.floor),
    top: unit(Math.min(...boxes.map((b) => b.top)), Math.floor),
    right: unit(Math.max(...boxes.map((b) => b.right)), Math.ceil),
    bottom: unit(Math.max(...boxes.map((b) => b.bottom)), Math.ceil),
  };
  const crop = { left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top };

  for (const [i, png] of windows.entries()) {
    await sharp(png)
      .extract(crop)
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(fileURLToPath(new URL(`years-${i}.webp`, OUT)));
  }

  // The same timeline as the picture, with each lift and the turning point given as a share of the layer.
  const [x, y, w, h] = [crop.left, crop.top, crop.width, crop.height].map((n) => n / LAYER_RES);
  const lift = (units: number) => pct((units / h) * 100);
  const css = `/* Generated by scripts/work-art/motion.ts from years.js; run npm run art:motion instead of editing. */
.work-frame .years-window { position: absolute; max-width: none; left: ${pct((x / W) * 100)}; top: ${pct((y / H) * 100)}; width: ${pct((w / W) * 100)}; height: ${pct((h / H) * 100)}; opacity: 0; transform-origin: ${pct(((ORIGIN.x - x) / w) * 100)} ${pct(((ORIGIN.y - y) / h) * 100)}; }
.work-frame .years-last { opacity: 1; }
@media (prefers-reduced-motion: no-preference) {
${YEARS.map((_, i) => `.work-frame .years-window${i} { animation: years-layer${i} ${DURATION} infinite both; }`).join('\n')}
${YEARS.map((_, i) => keyframes(i, 'years-layer', lift)).join('\n')}
}
`;
  await writeFile(new URL('years.css', OUT), css);
}

/** When the ring passes its resting scale, found by seeking the picture's own animation. */
async function rippleRest(svg: string): Promise<number> {
  const page = await open(svg, W, H, 1);
  const at = (ms: number) =>
    page.evaluate((ms) => {
      const wave = document.querySelector('.ripple-wave')!;
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = ms;
      }
      const style = getComputedStyle(wave);
      return { scale: new DOMMatrix(style.transform).a, opacity: +style.opacity };
    }, ms);

  let [low, high] = [0, RIPPLE_LOOP_MS / 2];
  while (high - low > 0.5) {
    const mid = (low + high) / 2;
    if ((await at(mid)).scale < RIPPLE_REST) low = mid;
    else high = mid;
  }
  const rest = await at(low);
  await page.close();
  if (rest.opacity !== 1) throw new Error(`The ring is at opacity ${rest.opacity} where it rests; the films would start faded.`);
  return low;
}

async function codec(file: string): Promise<string> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,profile,level', '-of', 'csv=p=0', file]);
  const [name, profile, level] = stdout.trim().split(',');
  if (name === 'av1' && profile === 'Main') return `av01.0.${level.padStart(2, '0')}M.08`;
  if (name === 'h264' && profile === 'High') return `avc1.6400${Number(level).toString(16).padStart(2, '0')}`;
  throw new Error(`No codec string for ${name} ${profile} in ${file}`);
}

async function bakeRipple(svg: string): Promise<RippleTier[]> {
  const rest = await rippleRest(svg);
  const tiers: RippleTier[] = [];

  for (const tier of TIERS) {
    // The ring has vector-effect="non-scaling-stroke": its width is in film pixels, so set it for this card size.
    const filmPerUnit = tier.square ? tier.width / H : tier.width / W;
    const ring = +((RING_PX / tier.cardScale) * filmPerUnit).toFixed(2);
    const drawn = svg.replaceAll('stroke="#ffc457" stroke-width="3"', `stroke="#ffc457" stroke-width="${ring}"`);
    if (drawn === svg) throw new Error('The ripple ring is no longer drawn 3 wide; update motion.ts.');

    const page = await open(drawn, tier.width, tier.height, 1, tier.square);
    const frames = await mkdtemp(join(tmpdir(), `ripple-${tier.name}-`));
    const count = (RIPPLE_LOOP_MS / 1000) * FPS;

    for (let i = 0; i < count; i++) {
      const ms = (rest + (i * 1000) / FPS) % RIPPLE_LOOP_MS;
      await page.evaluate(
        (ms) =>
          new Promise<void>((done) => {
            for (const animation of document.getAnimations()) {
              animation.pause();
              animation.currentTime = ms;
            }
            requestAnimationFrame(() => requestAnimationFrame(() => done()));
          }),
        ms,
      );
      await page.locator('#c').screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`) });
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const still = `ripple-${tier.name}.webp`;
    await sharp(await shot(page)).webp({ quality: 90, effort: 6 }).toFile(fileURLToPath(new URL(still, OUT)));
    await page.close();

    const film = (codecArgs: string[], file: string) =>
      run('ffmpeg', [
        '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'),
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', ...codecArgs,
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-an', '-movflags', '+faststart', fileURLToPath(new URL(file, OUT)),
      ]);
    // AV1 first: the smallest film for the same picture. H.264 plays everywhere else.
    const av1 = `ripple-${tier.name}.av1.mp4`;
    const h264 = `ripple-${tier.name}.h264.mp4`;
    await film(['-c:v', 'libsvtav1', '-preset', '5', '-crf', '36', '-svtav1-params', 'loglevel=0'], av1);
    await film(['-c:v', 'libx264', '-preset', 'slow', '-crf', '18'], h264);
    await rm(frames, { recursive: true });

    const sources = [];
    for (const file of [av1, h264]) {
      sources.push({ file, type: `video/mp4; codecs="${await codec(fileURLToPath(new URL(file, OUT)))}"` });
    }
    tiers.push({ name: tier.name, media: tier.media, width: tier.width, height: tier.height, still, sources });
    console.log(`ripple ${tier.name}: ring ${ring}px in a ${tier.width}x${tier.height} film`);
  }

  return tiers;
}

export async function bakeMotion(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const [years, ripple] = await Promise.all(
    ['ai-timeline-log.svg', 'lucasflatwhite-com.svg'].map((name) => readFile(new URL(name, ART), 'utf8')),
  );
  await bakeYears(years.trim());
  const tiers = await bakeRipple(ripple.trim());
  await writeFile(new URL('ripple.json', OUT), `${JSON.stringify({ tiers }, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await bakeMotion();
}
