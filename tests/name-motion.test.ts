import { describe, expect, it } from 'vitest';
import { letterResponse } from '../src/lib/name-motion';

describe('letterResponse', () => {
  it('stays still when the pointer is on the letter', () => {
    expect(letterResponse(0, 0)).toEqual({ x: 0, y: 0, weight: 610 });
  });

  it('pulls at most five pixels toward the pointer', () => {
    expect(letterResponse(120, 0)).toEqual({ x: 0, y: 0, weight: 450 });
    expect(letterResponse(0, 60)).toEqual({ x: 0, y: 2.5, weight: 530 });
  });

  it('ignores a pointer outside the reach', () => {
    expect(letterResponse(240, 0)).toEqual({ x: 0, y: 0, weight: 450 });
  });
});
