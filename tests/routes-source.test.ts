import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const landing = read('src/pages/index.astro');
const vercel = JSON.parse(read('vercel.json'));

// Resolve this config's literal and :path* rules in declaration order.
function destinationFor(path: string): string | undefined {
  for (const rule of vercel.rewrites) {
    const match = path.match(new RegExp(`^${rule.source.replace(':path*', '(.*)')}$`));
    if (match) return rule.destination.replace(':path*', match[1] ?? '');
  }
}

describe('route source contract', () => {
  it('normalizes the Suika entry to a directory so Godot asset URLs resolve below it', () => {
    expect(vercel.redirects).toContainEqual({source: '/arcade/suika', destination: '/arcade/suika/', permanent: true});
  });

  it.each(['', 'index.js', 'index.wasm', 'index.pck', 'loader-duck.webp', 'mushies.webmanifest', 'assets/share/og.png'])(
    'sends Suika %s to its own deployment before any Arcade wildcard', (asset) => {
      expect(destinationFor(`/arcade/suika/${asset}`)).toBe(`https://suika-balls.vercel.app/${asset || 'index.html'}`);
    },
  );

  it('preserves the existing lobby, Snake and timeline destinations', () => {
    expect(destinationFor('/arcade/')).toBe('https://flatwhite-arcade.vercel.app/arcade/index.html');
    expect(destinationFor('/arcade/snake/')).toBe('https://flatwhite-arcade.vercel.app/arcade/snake/index.html');
    expect(destinationFor('/arcade/assets/snake.js')).toBe('https://flatwhite-arcade.vercel.app/arcade/assets/snake.js');
    expect(destinationFor('/ai-timeline-log/')).toBe('https://ai-timeline-log.vercel.app/ai-timeline-log/index.html');
  });
  it('sends the board to the arcade lobby and leaves /play behind', () => {
    expect(existsSync(resolve(process.cwd(), 'src/pages/play'))).toBe(false);
    expect(landing).toContain("const arcadeHref = withBase('arcade/');");
    expect(vercel.redirects.filter((redirect: { source: string }) => redirect.source.startsWith('/play'))).toEqual([]);
    expect(vercel.rewrites).toEqual(
      expect.arrayContaining([
        { source: '/arcade/', destination: 'https://flatwhite-arcade.vercel.app/arcade/index.html' },
        { source: '/arcade/:path*', destination: 'https://flatwhite-arcade.vercel.app/arcade/:path*' },
      ]),
    );
  });

  it('builds the landing as the paper board', () => {
    expect(landing).not.toContain('SnakeExperience');
    expect(landing).not.toContain('mountSpecimen');
    expect(landing).not.toContain('mountPlayBand');
    expect(landing).not.toContain('type-case');
    expect(landing).not.toContain('id="play"');
    expect(landing).not.toContain('field-canvas');
    expect(landing).not.toContain('Every line of moving text is laid out with pretext.');
    expect(landing).toContain('id="top"');
    expect(landing).toContain('id="work"');
    expect(landing).toContain('class="colophon"');
    expect(landing).toContain('<SiteHeader');
    expect(landing).toContain('<CommandPalette />');
    expect(landing).toContain('themeColor="#fafafa"');
    expect(landing).toContain('<ArcadeHandheld />');
    expect(landing).not.toContain('view-transition-name');
  });

  it('keeps the name as real text', () => {
    expect(landing).toContain('<h1 id="name"');
    expect(landing).toContain('lang="ko"');
    expect(landing).toContain('data-name-letter');
  });
});
