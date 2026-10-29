/*
 * The name swaps one letter at a time for a cartoon picture of itself, holds it a beat,
 * then lets the letter spring back upright from the picture's tilt. A pointer over a
 * letter swaps it at once. The cycle runs only while the name is on screen and the tab
 * is showing, and on a phone it comes round once every PHONE_CYCLE_MS, since redrawing the
 * pictures is what keeps a phone busy; with reduced motion there is no cycle and the swaps
 * are instant.
 */
import { drawGlyph, GLYPH_ANGLES, GLYPH_STYLES, GLYPH_THEMES, GLYPH_WEIGHT, type Glyph, type GlyphTheme } from './name-glyphs';
import { motionState } from './work-motion';

export const SHOW_MS = 950;
export const GAP_MS = 450;
export const LEAVE_DELAY_MS = 250;
export const PHONE_CYCLE_MS = 4000;
const EXIT_MS = 160;

export function pickOther<T>(items: readonly T[], previous: T | undefined, random: () => number = Math.random): T {
  const pool = items.length > 1 ? items.filter((item) => item !== previous) : items;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export function rollGlyph(previous: GlyphTheme | undefined, random: () => number = Math.random): Glyph {
  return {
    theme: pickOther(GLYPH_THEMES, previous, random),
    style: pickOther(GLYPH_STYLES, undefined, random),
    angle: pickOther(GLYPH_ANGLES, undefined, random),
  };
}

/** The pause after a picture goes, so a phone sees one picture every PHONE_CYCLE_MS. */
export function gapAfterSwap(phone: boolean): number {
  return phone ? PHONE_CYCLE_MS - SHOW_MS : GAP_MS;
}

type Letter = {
  host: HTMLElement;
  ch: string;
  glyph: SVGSVGElement | null;
  owner: 'cycle' | 'pointer' | null;
  hovered: boolean;
  timer?: number;
};

export function bindNameSwap(root: HTMLElement): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The same breakpoint that stills the snake and the Work pictures on a phone.
  const phone = window.matchMedia('(max-width: 720px)');
  const letters: Letter[] = [...root.querySelectorAll<HTMLElement>('[data-name-letter]')].map((host) => ({
    host,
    ch: host.textContent?.trim() ?? '',
    glyph: null,
    owner: null,
    hovered: false,
  }));
  let lastTheme: GlyphTheme | undefined;
  let lastLetter: Letter | undefined;
  let cycle: number | undefined;
  let running = false;
  let ready = false;
  let onScreen = false;

  const drop = (letter: Letter) => {
    for (const node of letter.host.querySelectorAll('.name-glyph')) {
      node.remove();
    }
    letter.host.classList.remove('is-swapped', 'is-returning');
    letter.glyph = null;
    letter.owner = null;
  };

  const show = (letter: Letter, owner: 'cycle' | 'pointer') => {
    window.clearTimeout(letter.timer);
    drop(letter);
    const glyph = rollGlyph(lastTheme);
    const svg = drawGlyph(letter.host, letter.ch, glyph);
    if (!svg) {
      return;
    }
    lastTheme = glyph.theme;
    letter.host.style.setProperty('--name-tilt', `${glyph.angle}deg`);
    letter.host.classList.add('is-swapped');
    letter.glyph = svg;
    letter.owner = owner;
  };

  const hide = (letter: Letter) => {
    window.clearTimeout(letter.timer);
    const svg = letter.glyph;
    if (!svg) {
      return;
    }
    letter.glyph = null;
    letter.owner = null;
    svg.classList.add('is-leaving');
    letter.host.classList.remove('is-swapped');
    letter.host.classList.add('is-returning');
    window.setTimeout(() => svg.remove(), reduced ? 0 : EXIT_MS);
  };

  const step = () => {
    const free = letters.filter((letter) => letter.owner === null && !letter.hovered);
    if (free.length > 0) {
      lastLetter = pickOther(free, lastLetter);
      show(lastLetter, 'cycle');
    }
    cycle = window.setTimeout(() => {
      for (const letter of letters) {
        if (letter.owner === 'cycle') {
          hide(letter);
        }
      }
      cycle = window.setTimeout(step, gapAfterSwap(phone.matches));
    }, SHOW_MS);
  };

  const update = () => {
    const next = ready && !reduced && motionState(onScreen, document.hidden) === 'running';
    if (next === running) {
      return;
    }
    running = next;
    window.clearTimeout(cycle);
    if (running) {
      cycle = window.setTimeout(step, GAP_MS);
      return;
    }
    for (const letter of letters) {
      if (letter.owner === 'cycle') {
        hide(letter);
      }
    }
  };

  for (const letter of letters) {
    letter.host.querySelector('.name-letter-face')?.addEventListener('animationend', () => {
      letter.host.classList.remove('is-returning');
    });
    letter.host.addEventListener('pointerenter', (event) => {
      if (!ready) {
        return;
      }
      show(letter, 'pointer');
      // A tap fires pointerleave straight after, so touch holds the picture like the cycle does.
      if (event.pointerType === 'mouse') {
        letter.hovered = true;
      } else {
        letter.timer = window.setTimeout(() => hide(letter), SHOW_MS);
      }
    });
    letter.host.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') {
        return;
      }
      letter.hovered = false;
      letter.timer = window.setTimeout(() => hide(letter), LEAVE_DELAY_MS);
    });
  }

  new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    update();
  }).observe(root);
  document.addEventListener('visibilitychange', update);

  // The ink map is measured from the heavy weight, so it must be loaded before the first picture.
  const { fontFamily, fontSize } = getComputedStyle(root);
  document.fonts
    .load(`${GLYPH_WEIGHT} ${fontSize} ${fontFamily}`)
    .then(() => document.fonts.ready)
    .then(() => {
      ready = true;
      update();
    })
    .catch(() => {});
}
