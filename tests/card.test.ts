import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARD_FILE_NAME, CARD_HASH, CARD_IMAGE, shareMode } from '../src/lib/card';
import { addressActionFor, leaveAddressFor } from '../src/lib/hash-address';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('the card dialog', () => {
  it('opens from /#card and hands out card.png under my name', () => {
    expect(CARD_HASH).toBe('#card');
    expect(CARD_IMAGE).toBe('card.png');
    expect(CARD_FILE_NAME).toBe('lucas-flatwhite-card.png');
  });

  it('follows the address the way the book does', () => {
    expect(addressActionFor('#card', '#card', false)).toBe('open');
    expect(addressActionFor('#card', '#card', true)).toBe('none');
    expect(addressActionFor('#card', '', true)).toBe('close');
    expect(addressActionFor('#card', '#book', true)).toBe('close');
    expect(addressActionFor('#card', '', false)).toBe('none');
    expect(leaveAddressFor('#card', '#card', true)).toBe('back');
    expect(leaveAddressFor('#card', '#card', false)).toBe('replace');
    expect(leaveAddressFor('#card', '', true)).toBe('none');
  });

  it('offers Share only once the image is in hand and the browser can share files', () => {
    const file = new File([new Uint8Array([1])], CARD_FILE_NAME, { type: 'image/png' });

    // Waiting for the image inside the click would lose the tap in Safari (NotAllowedError).
    expect(shareMode(null, () => true)).toBe('save');
    expect(shareMode(file, undefined)).toBe('save');
    expect(shareMode(file, () => false)).toBe('save');
    expect(shareMode(file, (data) => data.files[0] === file)).toBe('share');
  });

  it('is drawn on the board and opened from a header button every device shows', () => {
    const board = read('src/components/HomeBoard.astro');
    const header = read('src/components/SiteHeader.astro');

    expect(board).toContain('<CardDialog />');
    expect(board).toContain('bindCard(');
    expect(header).toMatch(/<button[^>]*data-card-open[^>]*aria-controls="card"/s);
    const button = header.slice(header.lastIndexOf('<', header.indexOf('data-card-open')));
    expect(button.slice(0, button.indexOf('>'))).not.toContain('hidden');
    expect(header).toContain('Card');
  });

  it('saves the image with a plain download link, and shares it when it can', () => {
    const dialog = read('src/components/CardDialog.astro');

    expect(dialog).toContain('<BusinessCard');
    expect(dialog).toMatch(/<a[^>]*download=\{CARD_FILE_NAME\}/s);
    expect(dialog).toMatch(/<button[^>]*data-card-share[^>]*hidden/s);
  });
});
