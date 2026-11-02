import { describe, expect, it, vi } from 'vitest';
import { dropCostlyFilms, motionState, steerFilm, type DecodeCheck } from '../src/lib/work-motion';

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

describe('dropCostlyFilms', () => {
  const source = (codec: string) => ({
    type: `video/mp4; codecs="${codec}"`,
    dataset: { width: '576', height: '576', bitrate: '150000', framerate: '30' },
    remove: vi.fn(),
  });
  const decodes = (efficient: boolean, supported = true): DecodeCheck => vi.fn(async () => ({ supported, powerEfficient: efficient }));

  it('keeps AV1 where the device decodes it in hardware', async () => {
    const [av1, h264] = [source('av01.0.04M.08'), source('avc1.64001e')];
    const check = decodes(true);

    expect(await dropCostlyFilms([av1, h264], check)).toBe(false);
    expect(av1.remove).not.toHaveBeenCalled();
    expect(check).toHaveBeenCalledWith({
      type: 'file',
      video: { contentType: av1.type, width: 576, height: 576, bitrate: 150000, framerate: 30 },
    });
  });

  it('drops AV1 for H.264 where it would be decoded in software or not at all', async () => {
    for (const check of [decodes(false), decodes(false, false)]) {
      const [av1, h264] = [source('av01.0.04M.08'), source('avc1.64001e')];

      expect(await dropCostlyFilms([av1, h264], check)).toBe(true);
      expect(av1.remove).toHaveBeenCalledOnce();
      expect(h264.remove).not.toHaveBeenCalled();
    }
  });

  it('never asks about or drops H.264, and drops AV1 when the browser cannot answer', async () => {
    const [av1, h264] = [source('av01.0.04M.08'), source('avc1.64001e')];
    const check: DecodeCheck = vi.fn(async () => {
      throw new TypeError('unsupported configuration');
    });

    expect(await dropCostlyFilms([av1, h264], check)).toBe(true);
    expect(check).toHaveBeenCalledOnce();
    expect(av1.remove).toHaveBeenCalledOnce();
    expect(h264.remove).not.toHaveBeenCalled();
  });
});
