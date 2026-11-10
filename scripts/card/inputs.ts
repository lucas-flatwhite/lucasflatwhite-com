/*
 * What public/card.png is baked from. bake.ts records their hash in baked.json, and
 * tests/card-image.test.ts fails when they change without a fresh bake.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const CARD_INPUTS = [
  'src/components/BusinessCard.astro',
  'src/data/card.ts',
  'src/lib/qr.ts',
  'src/assets/card/avatar.png',
];

export function hashInputs(root: string): string {
  const hash = createHash('sha256');

  for (const path of CARD_INPUTS) {
    hash.update(path);
    hash.update('\0');
    hash.update(readFileSync(resolve(root, path)));
    hash.update('\0');
  }

  return hash.digest('hex');
}
