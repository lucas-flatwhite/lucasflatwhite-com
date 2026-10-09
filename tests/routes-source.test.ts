import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const landing = read('src/pages/index.astro');
const play = read('src/pages/play/index.astro');

describe('route source contract', () => {
  it('keeps the snake game on its own /play page', () => {
    expect(play).toContain("import SnakeExperience from '../../components/SnakeExperience.astro';");
    expect(play).toContain('<SnakeExperience />');
    expect(play).toContain('bodyClass="play"');
    expect(play).toContain("import '../../styles/play.css';");
    expect(play).toContain('<CommandPalette />');
  });

  it('builds the landing from the specimen, work, play band and colophon', () => {
    expect(landing).not.toContain('SnakeExperience');
    expect(landing).toContain('id="top"');
    expect(landing).toContain('id="work"');
    expect(landing).toContain('id="play"');
    expect(landing).toContain('class="colophon"');
    expect(landing).toContain('mountSpecimen');
    expect(landing).toContain('mountPlayBand');
    expect(landing).toContain('<CommandPalette />');
    expect(landing).toContain("withBase('play/')");
  });

  it('marks the moving canvases as decorative and keeps the name as real text', () => {
    expect(landing).toContain('<canvas class="field-canvas" data-field-canvas aria-hidden="true"></canvas>');
    expect(landing).toContain('<h1 id="name"');
    expect(landing).toContain('lang="ko"');
  });
});
