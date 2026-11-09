import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { work } from '../src/data/work';
import { artCells, commonStart, lastWordSplit } from '../src/lib/work-badge';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('the work badge', () => {
  it('names the company and says what I do, in my words', () => {
    expect(work.company).toBe('Kakao Pay Insurance');
    expect(work.summary).toBe('From backend engineering to full-stack development and tech strategy');
    expect(work.scenes.map((scene) => [scene.question, scene.answer])).toEqual([
      ['What do you do here?', 'Backend engineering.'],
      ['What are you building lately?', 'Full-stack development.'],
      ['What else?', 'Tech strategy.'],
    ]);
    expect([work.visitor.question, work.visitor.answer]).toEqual(['How do you see insurance?', "Tap, and I'll tell you."]);
  });

  it('draws every picture on a 16 by 16 grid of dots and paper', () => {
    for (const art of [...work.scenes.map((scene) => scene.art), work.visitor.art]) {
      expect(art).toHaveLength(16);
      expect(art.every((row) => /^[#.]{16}$/.test(row))).toBe(true);
    }
    expect(artCells(['#.', '.#'])).toEqual([[0, 0], [1, 1]]);
  });

  it('keeps the part two questions share, so a question is edited rather than swapped', () => {
    expect(commonStart('What do you do here?', 'What are you building lately?')).toBe(5);
    expect(commonStart('What else?', 'How do you see insurance?')).toBe(0);
    expect(commonStart('', 'What')).toBe(0);
  });

  it('keeps the caret with the last word, so it never wraps onto a line alone', () => {
    expect(lastWordSplit('Full-stack development.')).toEqual(['Full-stack ', 'development.']);
    expect(lastWordSplit('Backe')).toEqual(['', 'Backe']);
    expect(lastWordSplit('')).toEqual(['', '']);
  });

  it('writes no middle dots, which read as machine made', () => {
    expect(read('src/data/work.ts')).not.toContain('·');
    expect(read('src/components/WorkBadge.astro')).not.toContain('·');
  });

  it('sits in the work slot and opens the letter from a button over the whole card', () => {
    const landing = read('src/pages/index.astro');

    expect(landing).toContain("slot.kind === 'work'");
    expect(landing).toContain('<WorkBadge');
    expect(landing).toMatch(/<button[^>]*data-work-open[^>]*aria-controls="work-letter"/s);
  });

  it('moves only transforms and opacity, and only for visitors who did not ask for less motion', () => {
    const styles = read('src/styles/landing.css');
    const block = styles.slice(styles.indexOf('.work-art {'));
    const split = block.indexOf('@media (prefers-reduced-motion: no-preference)');

    expect(split).toBeGreaterThan(0);
    expect(block).not.toMatch(/filter:/);
    for (const name of [...block.matchAll(/@keyframes (work-[\w-]+)/g)].map((match) => match[1])) {
      expect(block.slice(0, split)).not.toMatch(new RegExp(`animation:[^;]*\\b${name}\\b`));
      expect(block.slice(split)).toMatch(new RegExp(`animation:[^;]*\\b${name}\\b`));
    }
  });

  it('keeps the badge window from making the page lay out again as its words change', () => {
    expect(read('src/styles/landing.css')).toMatch(/\.work-window \{[^}]*contain: strict/s);
  });
});
