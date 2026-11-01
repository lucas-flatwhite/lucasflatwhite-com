import type { APIRoute } from 'astro';
import { toPublicCommands } from '../lib/command-actions';
import { icons } from '../lib/icons';
import { loadPaletteCommands } from '../lib/palette-commands';

// The homepage's command menu as data. The arcade lobby fetches it, so a link changed in
// src/data/links.ts or a new featured project reaches both menus with one deploy.
export const GET: APIRoute = async ({ site }) => {
  const body = toPublicCommands(await loadPaletteCommands(), site ?? 'https://lucasflatwhite.com', (name) => icons[name].regular);

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
