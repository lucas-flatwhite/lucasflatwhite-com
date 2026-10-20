/*
 * Builds the two Work pictures into src/assets/work/. Run it again only when a generator
 * changes; the output is committed.
 *
 *     npm run art
 *
 * The generators draw on canvas and serialize SVG, so they run in the installed Google
 * Chrome (playwright-core drives it and downloads no browser). This script then thins the
 * plate's path and embeds the portrait's fonts.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright-core';
import { embedFonts } from './fonts.ts';
import { plateSvg, simplifyPath } from './svg.ts';

type Art = { plate: string; portrait: string };

const HERE = new URL('.', import.meta.url);
const OUT = new URL('../../src/assets/work/', import.meta.url);
const TYPES: Record<string, string> = { html: 'text/html', js: 'text/javascript' };

/* Module scripts won't load from file://, so the generators are served from their own folder. */
const server = createServer(async (request, response) => {
  const name = (request.url ?? '/').split('?')[0].slice(1) || 'index.html';
  const type = TYPES[name.split('.').pop() ?? ''];

  if (!/^[\w-]+\.(html|js)$/.test(name) || !type) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, { 'content-type': type }).end(await readFile(new URL(name, HERE)));
});

async function render(): Promise<Art> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const browser = await chromium.launch({ channel: 'chrome' });

  try {
    const page = await browser.newPage();
    // A generator that throws ends the build with its error instead of a two-minute wait.
    const failed = new Promise<never>((_, reject) => page.on('pageerror', reject));
    await page.goto(`http://127.0.0.1:${port}/`);
    await Promise.race([page.waitForFunction(() => 'workArt' in window, null, { timeout: 120_000 }), failed]);

    return await page.evaluate(() => (window as unknown as { workArt: Art }).workArt);
  } finally {
    await browser.close();
    server.close();
  }
}

async function save(name: string, svg: string): Promise<void> {
  await writeFile(new URL(name, OUT), svg);
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;
  console.log(`${name}: ${kb(Buffer.byteLength(svg))} raw, ${kb(gzipSync(svg).length)} gzip`);
}

const art = await render();
await mkdir(OUT, { recursive: true });
await save('ai-timeline-log.svg', plateSvg(simplifyPath(art.plate, 0.15)));
await save('lucasflatwhite-com.svg', `${await embedFonts(art.portrait)}\n`);
