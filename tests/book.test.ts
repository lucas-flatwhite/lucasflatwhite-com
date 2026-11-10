import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { book } from '../src/data/book';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('the book', () => {
  it('goes by its English name on the board, with one line about it and no release date', () => {
    expect(book.name).toBe('Claude, Made Easy');
    expect(book.summary).toBe('I wrote a book on working with Claude.');
    const words = [book.name, book.summary, book.title, book.tagline, book.meta].join(' ');
    expect(words).not.toMatch(/November|2026|11\.10|출간/);
  });

  it('keeps the Korean title, tagline and details for the store list, with no price', () => {
    expect(book.title).toBe('루카스의 쉽게 배우고 바로 써먹는 클로드 완벽 활용법');
    expect(book.tagline).toBe('업무와 일상에서 AI를 제대로 쓰고 싶은 이들을 위한 클로드 실전 입문 가이드');
    expect(book.meta).toBe('배성율 지음 · 위키북스 · 452쪽');
    expect(JSON.stringify(book)).not.toMatch(/28,000|NEW BOOK/);
  });

  it('lists the five stores in order, the publisher first, all over https', () => {
    expect(book.stores.map((store) => [store.name, store.href])).toEqual([
      ['위키북스', 'https://wikibook.co.kr/lucas-claude/'],
      ['교보문고', 'https://product.kyobobook.co.kr/detail/S000221888560'],
      ['YES24', 'https://www.yes24.com/product/goods/199966065'],
      ['알라딘', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=406171287'],
      ['영풍문고', 'https://www.ypbooks.co.kr/books/202611060951599584'],
    ]);
    expect(book.stores[0].tag).toBe('출판사');
    expect(book.stores.every((store) => new URL(store.href).protocol === 'https:')).toBe(true);
    expect(book.stores.map((store) => store.host)).toEqual([
      'wikibook.co.kr',
      'kyobobook.co.kr',
      'yes24.com',
      'aladin.co.kr',
      'ypbooks.co.kr',
    ]);
  });
});

describe('the book card', () => {
  const landing = read('src/components/HomeBoard.astro');
  const stand = read('src/components/BookStand.astro');
  const styles = read('src/styles/landing.css');

  it('stands in the first slot and opens the store list instead of a link', () => {
    expect(landing).toContain("slot.kind === 'book'");
    expect(landing).toContain('<BookStand');
    expect(landing.indexOf('<BookStand')).toBeLessThan(landing.indexOf('<ProjectCard'));
    expect(landing).toMatch(/<button[^>]*data-book-open[^>]*aria-controls="book"/s);
    expect(landing).toMatch(/aria-haspopup="dialog"/);
  });

  it('puts the Claude mark before the name and keeps the title page copy', () => {
    expect(read('src/components/ClaudeMark.astro')).toContain('#D97757');
    expect(landing.match(/<ClaudeMark/g)?.length).toBeGreaterThanOrEqual(2);
    expect(stand).toContain('<ClaudeMark');
    expect(stand).toContain('Understand Claude,');
    expect(stand).toContain('then put it to work.');
    expect(stand).toContain('A friendly first book');
    expect(stand).toContain('on working with Claude.');
  });

  it('moves with the other Work pictures, and only for visitors who did not ask for less motion', () => {
    expect(stand).toMatch(/class="[^"]*project-motion[^"]*book-stand/);

    const motion = styles.slice(styles.indexOf('.book-art {'));
    const keyframes = [...motion.matchAll(/@keyframes (book-[\w-]+)/g)].map((match) => match[1]);
    expect(keyframes.length).toBeGreaterThan(0);

    for (const name of keyframes) {
      const uses = [...motion.matchAll(new RegExp(`animation:[^;]*\\b${name}\\b`, 'g'))];
      expect(uses.length).toBeGreaterThan(0);
    }

    const split = motion.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(split).toBeGreaterThan(0);
    for (const name of keyframes) {
      expect(motion.slice(0, split)).not.toMatch(new RegExp(`animation:[^;]*\\b${name}\\b`));
      expect(motion.slice(split)).toMatch(new RegExp(`animation:[^;]*\\b${name}\\b`));
    }
  });
});

describe('the store list', () => {
  const dialog = read('src/components/BookDialog.astro');
  const landing = read('src/components/HomeBoard.astro');

  it('opens from the address /#book and nothing else', async () => {
    const { BOOK_HASH, wantsBook } = await import('../src/lib/book');

    expect(BOOK_HASH).toBe('#book');
    expect(wantsBook('#book')).toBe(true);
    expect(wantsBook('#work')).toBe(false);
    expect(wantsBook('')).toBe(false);
  });

  it('follows the address: #book opens it, leaving #book closes it', async () => {
    const { addressAction } = await import('../src/lib/book');

    expect(addressAction('#book', false)).toBe('open');
    expect(addressAction('#book', true)).toBe('none');
    // Back from /#book leaves the book open on a bare address unless it closes too.
    expect(addressAction('', true)).toBe('close');
    expect(addressAction('#work', true)).toBe('close');
    expect(addressAction('', false)).toBe('none');
  });

  it('steps back over the #book entry it was opened with, instead of stacking the homepage twice', async () => {
    const { leaveAddress } = await import('../src/lib/book');

    // Opened by navigating to /#book (the command menu): that entry is ours to step back over.
    expect(leaveAddress('#book', true)).toBe('back');
    // Opened by a shared link: there is nothing of ours behind it, so only the hash goes.
    expect(leaveAddress('#book', false)).toBe('replace');
    // Already off #book (the back button closed it): the address is left alone.
    expect(leaveAddress('', true)).toBe('none');
    expect(leaveAddress('', false)).toBe('none');
  });

  it('is one dialog on the board, bound to the card', () => {
    expect(dialog).toMatch(/<dialog[^>]*id="book"/);
    expect(landing).toContain('<BookDialog />');
    expect(landing).toContain('bindBook(');
  });

  it('sends every store to a new tab without telling it where the visitor came from', () => {
    expect(dialog).toContain('book.stores.map(');
    expect(dialog).toMatch(/<a[^>]*href=\{store\.href\}[^>]*target="_blank"[^>]*rel="noopener noreferrer"/s);
  });

  it('has no drag handle, since the sheet closes with its button, Esc or a tap outside', () => {
    expect(dialog).not.toMatch(/grab handle|\.book-spread::before/);
  });

  it('says where to get the book, with no badge, no price and no redrawn shadow while it opens', () => {
    expect(dialog).toContain('WHERE TO GET IT');
    expect(dialog).toContain('구매처');
    expect(dialog).toContain('링크는 새 탭에서 열려요.');
    expect(dialog).toContain('{book.meta}');
    expect(dialog).not.toMatch(/NEW BOOK|28,000/);
    expect(dialog).not.toMatch(/drop-shadow|backdrop-filter/);
  });

  it('keeps the flip and slide for visitors who did not ask for less motion', () => {
    const split = dialog.indexOf('@media (prefers-reduced-motion: no-preference)');

    expect(split).toBeGreaterThan(0);
    expect(dialog.slice(0, split)).not.toMatch(/animation:\s*book-dialog-/);
    expect(dialog.slice(split)).toMatch(/animation:\s*book-dialog-open/);
  });

  it('closes the book before the command menu opens over it', () => {
    expect(read('src/components/CommandPalette.astro')).toContain("dialog[open]:not([data-palette])");
  });
});
