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
