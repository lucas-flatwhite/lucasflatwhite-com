import { describe, expect, it } from 'vitest';
import { span, stepAt, STEPS, TIMELINE } from '../src/lib/press-timeline';

describe('press timeline', () => {
  it('runs ink, press, lift and turn in that order, one after another', () => {
    expect(STEPS).toEqual(['ink', 'press', 'lift', 'turn']);

    for (const [index, step] of STEPS.entries()) {
      const [from, to] = TIMELINE[step];
      expect(from).toBeGreaterThanOrEqual(0);
      expect(to).toBeGreaterThan(from);
      expect(to).toBeLessThanOrEqual(1);

      if (index > 0) {
        expect(from).toBeGreaterThanOrEqual(TIMELINE[STEPS[index - 1]][1]);
      }
    }
  });

  it('starts with the type bare and holds the finished proof at the end', () => {
    expect(TIMELINE.ink[0]).toBeGreaterThan(0);
    expect(1 - TIMELINE.turn[1]).toBeGreaterThanOrEqual(0.15);
  });

  it('brings the Korean in within the first two thirds of the scroll', () => {
    expect(TIMELINE.turn[0]).toBeLessThanOrEqual(2 / 3);
  });

  it('measures each step from 0 before it to 1 after it', () => {
    for (const step of STEPS) {
      const [from, to] = TIMELINE[step];
      expect(span(0, step)).toBe(0);
      expect(span(from, step)).toBe(0);
      expect(span((from + to) / 2, step)).toBeCloseTo(0.5);
      expect(span(to, step)).toBe(1);
      expect(span(1, step)).toBe(1);
    }
  });

  it('finishes each step before the next one starts', () => {
    // The scene never poses two steps at once.
    for (const [index, step] of STEPS.entries()) {
      const next = STEPS[index + 1];

      if (next) {
        expect(span(TIMELINE[next][0], step)).toBe(1);
      }
    }
  });

  it('names the step in view for every point of the scroll, never going backwards', () => {
    let previous = -1;

    for (let progress = 0; progress <= 1; progress += 0.01) {
      const index = STEPS.indexOf(stepAt(progress));
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }

    expect(stepAt(0)).toBe('ink');
    expect(stepAt(TIMELINE.press[0])).toBe('press');
    expect(stepAt(TIMELINE.lift[0])).toBe('lift');
    expect(stepAt(TIMELINE.turn[0])).toBe('turn');
    expect(stepAt(1)).toBe('turn');
  });
});
