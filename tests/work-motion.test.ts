import { describe, expect, it } from 'vitest';
import { motionState } from '../src/lib/work-motion';

describe('motionState', () => {
  it('runs only while the card is on screen and the tab is showing', () => {
    expect(motionState(true, false)).toBe('running');
    expect(motionState(false, false)).toBe('paused');
    expect(motionState(true, true)).toBe('paused');
    expect(motionState(false, true)).toBe('paused');
  });
});
