/*
 * The /hi/ intro, as rules (CardIntro.astro draws it). The card lands face up; a tap flips
 * it; the back waves or opens the board; Skip opens it from anywhere. Opening unfolds the
 * card into the real homepage underneath, moving each piece of the card onto its twin on
 * the board (FLIP: measure both, then animate the inverse transform back to nothing).
 */
export type IntroState = 'front' | 'back' | 'wave' | 'unfolding' | 'done';
export type IntroEvent = 'flip' | 'flip-back' | 'wave' | 'wave-back' | 'open' | 'skip' | 'unfolded';

const steps: Partial<Record<IntroState, Partial<Record<IntroEvent, IntroState>>>> = {
  front: { flip: 'back', skip: 'unfolding' },
  back: { 'flip-back': 'front', wave: 'wave', open: 'unfolding', skip: 'unfolding' },
  wave: { 'wave-back': 'back', skip: 'unfolding' },
  unfolding: { unfolded: 'done' },
};

/** Where the intro goes from `state` on `event`; anything out of place leaves it as it is. */
export function introStep(state: IntroState, event: IntroEvent): IntroState {
  return steps[state]?.[event] ?? state;
}

export type Box = { left: number; top: number; width: number; height: number };

/**
 * The transform (origin top left) that draws an element measured at `last` where `first`
 * was. Animating it to none moves the element from the card to its place on the board.
 */
export function flipFrom(first: Box, last: Box): { x: number; y: number; scale: number } {
  return { x: first.left - last.left, y: first.top - last.top, scale: first.width / last.width };
}

/** The unfold, in milliseconds, as in the mockup (card-unfold.html). */
export const UNFOLD = { flip: 600, retreat: 240, unfold: 720, rise: 560, stagger: 90 } as const;

/** Under reduced motion the board simply fades in. */
export const REDUCED_FADE = 200;
