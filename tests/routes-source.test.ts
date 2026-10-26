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
    expect(landing).toContain('data-snake-preview');
    expect(landing).not.toContain('view-transition-name');
  });

  it('keeps the name as real text', () => {
    expect(landing).toContain('<h1 id="name"');
    expect(landing).toContain('lang="ko"');
    expect(landing).toContain('data-name-letter');
  });
});
