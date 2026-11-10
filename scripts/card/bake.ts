/*
 * Bakes my card into public/card.png, the image the card dialog shares and saves. Run it
 * again whenever the card changes; the output is committed, and a test says when it is stale.
 *
 *     npm run card
 *
 * It builds the site, serves the build, opens /#card in the installed Google Chrome
 * (playwright-core drives it and downloads no browser), and photographs the card the
 * dialog shows, 1080px wide, without its corners or shadow: the image is the card.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'astro';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { hashInputs } from './inputs.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = new URL('../../public/card.png', import.meta.url);
const WIDTH = 1080;
const HEIGHT = 1944;
const PORT = 4329;

await build({ root: ROOT, logLevel: 'warn' });
const server = await preview({ root: ROOT, logLevel: 'warn', server: { port: PORT, host: '127.0.0.1' } });
const browser = await chromium.launch({ channel: 'chrome' });

try {
  const page = await browser.newPage({ viewport: { width: WIDTH + 120, height: HEIGHT + 156 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.goto(`http://127.0.0.1:${PORT}/#card`);
  await page.waitForSelector('[data-card-dialog][open] .business-card');
  await page.evaluate(async (width) => {
    document.documentElement.setAttribute('data-card-print', '');
    document.querySelector<HTMLElement>('[data-card-dialog] .business-card')!.style.setProperty('--card-width', `${width}px`);
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll<HTMLImageElement>('[data-card-dialog] img')].map((image) => image.decode()));
  }, WIDTH);

  const png = await page.locator('[data-card-dialog] .business-card').screenshot({ animations: 'disabled' });
  const { width, height } = await sharp(png).metadata();

  if (width !== WIDTH || height !== HEIGHT) {
    throw new Error(`The card came out ${width} by ${height}, not ${WIDTH} by ${HEIGHT}.`);
  }

  // 64 colors keep the paper, ink and yellow exactly and halve the file for conference wifi.
  await writeFile(OUT, await sharp(png).png({ palette: true, colors: 64, dither: 0, compressionLevel: 9 }).toBuffer());
  await writeFile(new URL('baked.json', import.meta.url), `${JSON.stringify({ hash: hashInputs(ROOT) }, null, 2)}\n`);
  console.log(`public/card.png ${WIDTH}x${HEIGHT}, ${(png.length / 1024).toFixed(0)}KB before compression`);
} finally {
  await browser.close();
  await server.stop();
}
