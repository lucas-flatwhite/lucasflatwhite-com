import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { introCopy } from '../src/data/card-intro';
import { flipFrom, introStep, REDUCED_FADE, UNFOLD, type IntroEvent, type IntroState } from '../src/lib/card-intro';

const events: IntroEvent[] = ['flip', 'flip-back', 'wave', 'wave-back', 'open', 'skip', 'unfolded'];

describe('the intro on /hi/', () => {
  it('says what the mockup says', () => {
    expect(introCopy).toEqual({
      handed: 'Lucas just handed you his card.',
      hint: 'Tap the card to flip it',
      flip: 'Flip the card',
      greeting: 'Nice to meet you.',
      rest: 'The rest of me lives on this board.',
      wave: 'Wave back at Lucas',
      open: 'Open the board',
      flipBack: 'Flip back',
      hi: 'Hi, Lucas!',
      turn: 'Turn your phone around. Tap to go back.',
      skip: 'Skip',
    });
  });

  it('flips the card, waves, and opens the board from the back', () => {
    expect(introStep('front', 'flip')).toBe('back');
    expect(introStep('back', 'flip-back')).toBe('front');
    expect(introStep('back', 'wave')).toBe('wave');
    expect(introStep('wave', 'wave-back')).toBe('back');
    expect(introStep('back', 'open')).toBe('unfolding');
    expect(introStep('unfolding', 'unfolded')).toBe('done');
  });

  it('skips to the unfold from anywhere the intro is still showing', () => {
    for (const state of ['front', 'back', 'wave'] as IntroState[]) {
      expect(introStep(state, 'skip')).toBe('unfolding');
    }
  });

  it('ignores anything that does not belong to where it is', () => {
    const allowed = new Set(['front:flip', 'back:flip-back', 'back:wave', 'wave:wave-back', 'back:open', 'unfolding:unfolded', 'front:skip', 'back:skip', 'wave:skip']);

    for (const state of ['front', 'back', 'wave', 'unfolding', 'done'] as IntroState[]) {
      for (const event of events) {
        if (!allowed.has(`${state}:${event}`)) {
          expect(introStep(state, event), `${state} + ${event}`).toBe(state);
        }
      }
    }
  });

  it('works out the transform that puts a board element back where it sat on the card', () => {
    const onCard = { left: 10, top: 20, width: 100, height: 50 };
    const onBoard = { left: 110, top: 220, width: 200, height: 100 };

    expect(flipFrom(onCard, onBoard)).toEqual({ x: -100, y: -200, scale: 0.5 });
    expect(flipFrom(onBoard, onBoard)).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it('keeps the mockup timing, about two seconds end to end', () => {
    expect(UNFOLD).toEqual({ flip: 600, retreat: 240, unfold: 720, rise: 560, stagger: 90 });
    expect(REDUCED_FADE).toBe(200);
  });
});

describe('the intro overlay', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const intro = read('src/components/CardIntro.astro');
  const hi = read('src/pages/hi/index.astro');

  it('covers /hi/ before the board is even parsed, and only when scripts run', () => {
    expect(hi.indexOf('<CardIntro />')).toBeGreaterThan(0);
    expect(hi.indexOf('<CardIntro />')).toBeLessThan(hi.indexOf('<HomeBoard />'));
    expect(intro).toMatch(/<script is:inline>[^<]*classList\.add\('has-intro'\)/);
    expect(intro).toMatch(/:global\(html:not\(\.has-intro\)\) \.card-intro\s*\{\s*display: none;/);
  });

  it('puts Skip first, as a link home that works before the intro script has loaded', () => {
    const markup = intro.slice(intro.indexOf('<div class="card-intro"'));
    const first = markup.search(/<(button|a)\b/);
    const tag = markup.slice(first, markup.indexOf('>', first));
    expect(tag).toMatch(/^<a\b/);
    expect(tag).toContain('data-intro-skip');
    expect(tag).toContain('href={withBase()}');
  });

  it('flips with a button over the front, and keeps the back buttons side by side', () => {
    expect(intro).toMatch(/<button[^>]*data-intro-flip[^>]*aria-label=\{introCopy\.flip\}/s);
    for (const hook of ['data-intro-wave', 'data-intro-open', 'data-intro-flip-back', 'data-intro-wave-back']) {
      expect(intro).toMatch(new RegExp(`<button[^>]*${hook}`, 's'));
    }
    expect(intro).toContain('<BusinessCard');
  });

  it('takes every word from the intro copy', () => {
    for (const key of Object.keys(introCopy)) {
      expect(intro).toContain(`introCopy.${key}`);
    }
  });

  it('keeps the command menu, the card and the book shut while the intro is up', () => {
    // /hi/#book or /hi/#card must not open a dialog over the intro.
    expect(read('src/components/CommandPalette.astro')).toContain("classList.contains('has-intro')");
    expect(read('src/lib/card.ts')).toContain("classList.contains('has-intro')");
    expect(read('src/lib/book.ts')).toContain("classList.contains('has-intro')");
  });

  it('puts the hidden board out of reach as soon as it is parsed, not when the intro script arrives', () => {
    // A slow script would otherwise leave the board's links in the Tab order behind the intro.
    expect(hi).toMatch(/<HomeBoard \/>\s*<script is:inline>[^<]*has-intro[^<]*\.inert = true/);
  });
});

describe('the unfold onto the board', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const board = read('src/components/HomeBoard.astro');
  const unfold = read('src/lib/card-unfold.ts');

  it('starts the name swap and the moving pictures only once the card has unfolded', () => {
    expect(board).toContain("'card-intro:done'");
    const ready = board.indexOf('ready.then(');
    expect(ready).toBeGreaterThan(0);
    expect(board.slice(ready)).toContain('bindNameSwap(name)');
    expect(board.slice(ready)).toContain('bindWorkMotion(');
    expect(board.slice(0, ready)).not.toMatch(/bindNameSwap\(name\)|bindWorkMotion\(/);
  });

  it('leaves the visitor on the homepage address, focused on my name', () => {
    expect(unfold).toContain("history.replaceState(null, '', withBase())");
    expect(unfold).toContain("'#name'");
    expect(unfold).toContain("new Event('card-intro:done')");
    // The intro pins the scroll to the top; the homepage entry must remember scroll again.
    expect(unfold.indexOf("history.scrollRestoration = 'auto'")).toBeGreaterThan(unfold.indexOf('history.replaceState'));
  });

  it('grows the paper by clipping it, so the unfold only animates what the compositor can', () => {
    expect(unfold).toContain('clipPath:');
    expect(unfold).not.toMatch(/\b(left|top|width|height|borderRadius|backgroundColor|boxShadow): `/);
  });

  it('moves the real board pieces with FLIP, not view transitions', () => {
    expect(unfold).toContain('flipFrom(');
    for (const part of ['name', 'ko']) {
      expect(unfold).toContain(`'${part}'`);
    }
    for (const source of [unfold, read('src/components/CardIntro.astro'), board]) {
      expect(source).not.toContain('view-transition-name');
    }
  });
});
