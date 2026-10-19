/**
 * Where each step of the type case's press falls along its scroll: 0 as the stage pins,
 * 1 as it leaves. Kept apart from three.js so the page can follow the press without it.
 * The run after the last step holds the finished Korean proof, so nobody scrolls past
 * the point of it.
 */
export const TIMELINE = {
  ink: [0.03, 0.2],
  press: [0.22, 0.34],
  lift: [0.36, 0.56],
  turn: [0.6, 0.8],
} as const satisfies Record<string, readonly [number, number]>;

export type Step = keyof typeof TIMELINE;

export const STEPS = Object.keys(TIMELINE) as Step[];

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** How far through one step the press is: 0 before it starts, 1 once it is done. */
export function span(progress: number, step: Step): number {
  const [from, to] = TIMELINE[step];
  return clamp01((progress - from) / (to - from));
}

/** The step the press is in, or the last one it finished: the one worth watching. */
export function stepAt(progress: number): Step {
  let current: Step = STEPS[0];

  for (const step of STEPS) {
    if (progress >= TIMELINE[step][0]) {
      current = step;
    }
  }

  return current;
}
