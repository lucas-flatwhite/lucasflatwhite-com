import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../src/lib/copy-link';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('lucas.flatwhite@gmail.com')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('lucas.flatwhite@gmail.com');
  });

  it('reports a refused clipboard so the caller can fall back', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    await expect(copyText('x')).resolves.toBe(false);
  });

  it('reports a missing clipboard on an insecure page', async () => {
    vi.stubGlobal('navigator', {});
    await expect(copyText('x')).resolves.toBe(false);
  });
});

describe('copy link source contract', () => {
  it('copies from the landing link box instead of opening a new tab', () => {
    const landing = read('src/pages/index.astro');

    expect(landing).toContain('mountCopyLinks()');
    expect(landing.match(/data-copy=\{link\.copy\}/g)).toHaveLength(1);
    expect(landing.match(/<CopyRoll text=\{link\.label\} \/>/g)).toHaveLength(1);
  });

  it('copies from the command menu, then closes it after the roll', () => {
    const palette = read('src/components/CommandPalette.astro');

    expect(palette).toContain('data-copy={command.copy ?? undefined}');
    expect(palette).toContain('showCopied(option');
    expect(palette).toContain('COPY_CLOSE_MS');
  });

  it('rolls the line only when motion is welcome', () => {
    const roll = read('src/components/CopyRoll.astro');
    const motion = roll.slice(roll.indexOf('@media (prefers-reduced-motion: no-preference)'));

    expect(roll).toContain('[data-copied] .copy-roll-text');
    expect(roll.replace(motion, '')).not.toContain('transition');
    expect(motion).toContain('transition: translate');
  });
});
