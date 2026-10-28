import { describe, expect, it } from 'vitest';
import { createPreview, stepPreview } from '../src/lib/snake-preview';

describe('snake preview', () => {
  it('starts as a short snake facing right', () => {
    expect(createPreview()).toEqual({
      cols: 8,
      rows: 6,
      dir: { x: 1, y: 0 },
      body: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ],
    });
  });

  it('turns right before it would leave the grid', () => {
    let state = createPreview();

    for (let i = 0; i < 6; i++) {
      state = stepPreview(state);
    }

    expect(state.body[0]).toEqual({ x: 7, y: 3 });
    expect(state.dir).toEqual({ x: 0, y: 1 });
    expect(state.body).toHaveLength(3);
  });
});
