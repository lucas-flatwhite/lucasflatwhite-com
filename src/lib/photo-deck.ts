/*
 * The photos beside the name take turns in one frame: each holds for HOLD_MS, then the
 * next fades in over it with its caption. The dots beside the caption jump to a photo, and
 * a click on the frame moves to the next one. The turn runs only while the frame is on
 * screen, the tab is showing, and no mouse or keyboard focus rests on it; with reduced motion
 * there is no turn and a jump is instant.
 */
import { motionState } from './work-motion';

export const HOLD_MS = 5000;

/** The photo after `current`, back to the first after the last. */
export function nextIndex(current: number, count: number): number {
  return count > 0 ? (current + 1) % count : 0;
}

export function bindPhotoDeck(root: HTMLElement): void {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-photo-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-photo-dot]')];

  if (slides.length < 2) {
    return;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer: number | undefined;
  let onScreen = false;
  let held = false;

  const show = (index: number) => {
    current = index;
    slides.forEach((slide, at) => {
      const shown = at === index;
      slide.classList.toggle('is-current', shown);
      slide.toggleAttribute('inert', !shown);
      slide.setAttribute('aria-hidden', String(!shown));
    });
    dots.forEach((dot, at) => dot.setAttribute('aria-current', String(at === index)));
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = undefined;

    if (reduced || held || motionState(onScreen, document.hidden) === 'paused') {
      return;
    }

    timer = window.setTimeout(() => {
      show(nextIndex(current, slides.length));
      schedule();
    }, HOLD_MS);
  };

  const hold = (value: boolean) => {
    held = value;
    schedule();
  };

  dots.forEach((dot, index) =>
    dot.addEventListener('click', (event) => {
      event.stopPropagation();
      show(index);
      schedule();
    }),
  );

  root.addEventListener('click', () => {
    show(nextIndex(current, slides.length));
    schedule();
  });
  root.addEventListener('pointerenter', (event) => event.pointerType === 'mouse' && hold(true));
  root.addEventListener('pointerleave', () => hold(false));
  // A tapped dot keeps focus on a phone, so only keyboard focus holds the turn.
  root.addEventListener('focusin', (event) => (event.target as Element).matches(':focus-visible') && hold(true));
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      hold(false);
    }
  });

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    schedule();
  }).observe(root);
  document.addEventListener('visibilitychange', schedule);

  show(0);
}
