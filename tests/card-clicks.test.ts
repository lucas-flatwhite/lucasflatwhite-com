import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('a card takes a click anywhere on it, even while its veil rises', () => {
  const styles = read('src/styles/landing.css');

  it('never moves the title, whose link stretches over the whole card', () => {
    // A transform on the title, or on everything in the veil, would make the title the box its
    // stretched link fills, so a click on the picture would land on the veil instead.
    expect(styles).not.toMatch(/\.project-text > \*\s*\{[^}]*transform/);
    expect(styles).not.toMatch(/\.project-title\s*\{[^}]*transform/);
    expect(styles).toMatch(/\.project-summary\s*\{[^}]*transform: translateY\(10px\)/);
  });
});

describe('closing a dialog hands focus back to the card that opened it', () => {
  it('returns to the book card and the work card, not the top of the page', () => {
    expect(read('src/lib/book.ts')).toMatch(/\.focus\(\{ preventScroll: true \}\)/);
    expect(read('src/lib/work-letter.ts')).toMatch(/\.focus\(\{ preventScroll: true \}\)/);
  });
});

describe('the letter never opens over another dialog', () => {
  it('stays shut when the command menu opened first', () => {
    expect(read('src/lib/work-letter.ts')).toContain("document.querySelector('dialog[open]')");
  });
});
