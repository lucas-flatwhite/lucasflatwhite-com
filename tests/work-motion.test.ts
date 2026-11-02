import { describe, expect, it, vi } from 'vitest';
import { motionState, steerFilm } from '../src/lib/work-motion';

describe('motionState', () => {
  it('runs only while the card is on screen and the tab is showing', () => {
    expect(motionState(true, false)).toBe('running');
    expect(motionState(false, false)).toBe('paused');
    expect(motionState(true, true)).toBe('paused');
    expect(motionState(false, true)).toBe('paused');
  });
});

describe('steerFilm', () => {
  const film = (play: () => Promise<void> = () => Promise.resolve()) => ({ play: vi.fn(play), pause: vi.fn() });

  it('plays a running film and holds a paused one', () => {
    const running = film();
    const paused = film();

    steerFilm(running, 'running');
    steerFilm(paused, 'paused');

    expect(running.play).toHaveBeenCalledOnce();
    expect(running.pause).not.toHaveBeenCalled();
    expect(paused.pause).toHaveBeenCalledOnce();
    expect(paused.play).not.toHaveBeenCalled();
  });

  it('swallows a refused play, so the still stays up without an error', async () => {
    const refused = film(() => Promise.reject(new DOMException('Low Power Mode', 'NotAllowedError')));
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    steerFilm(refused, 'running');
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off('unhandledRejection', unhandled);
    expect(refused.play).toHaveBeenCalledOnce();
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('does nothing for a card without a film', () => {
    expect(() => steerFilm(null, 'running')).not.toThrow();
  });
});
