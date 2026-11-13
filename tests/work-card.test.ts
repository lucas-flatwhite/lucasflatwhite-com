import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { work } from '../src/data/work';
import { artCells, commonStart, lastWordSplit } from '../src/lib/work-badge';
import { FINAL_STAGE, turnStage } from '../src/lib/work-letter';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('the work badge', () => {
  it('names the company and says what I do, in my words', () => {
    expect(work.company).toBe('KakaoPay Insurance');
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
    const landing = read('src/components/HomeBoard.astro');

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

describe('the letter on how I see insurance', () => {
  const letter = () => read('src/components/WorkLetter.astro');

  it('keeps my words, with the doubts the visitor might have', () => {
    expect(work.letter.title).toBe('보험에 대한 새로운 시각');
    expect(work.letter.turns).toEqual([
      ['보험, 어렵지 않나요?', '보험은 어렵지 않아요.'],
      ['필요할 땐 오래 걸리잖아요?', '당신이 필요할 때 더 빨리 다가갈게요.'],
      ['막상 일이 생기면요?', '그 순간에 가장 가까이 있어야 해요.'],
    ]);
    expect(work.letter.really).toBe('정말이요.');
    expect(work.letter.pledge.map(([text]) => text).join('')).toBe('보험은 쉽고, 친근하고, 정확하고, 꼭 필요한 때 찾아가야 하고, 빨라야 해요.');
    expect(work.letter.pledge.filter(([, marked]) => marked).map(([text]) => text)).toEqual(['쉽고', '친근하고', '정확하고', '꼭 필요한 때', '빨라야']);
    expect(work.letter.waiting).toBe('그리고 다시 만나고 싶어져야 해요');
    // "막상" opens one doubt only.
    expect(work.letter.turns.filter(([question]) => question.includes('막상'))).toHaveLength(1);
  });

  it('opens one dialog with a company website link instead of a signature', () => {
    const source = letter();

    expect(source).toMatch(/<dialog[^>]*id="work-letter"/);
    expect(source).not.toContain('<KakaoPayInsuranceMark');
    expect(source).not.toContain('letter.signature');
    expect(source).not.toContain('data-work-letter-skip');
    expect(source).toMatch(/<a[^>]*href="https:\/\/kakaopayinscorp\.co\.kr\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>\s*<span class="work-letter-company-text">kakaopayinscorp\.co\.kr<\/span>/);
    // The arrow beside it is decoration; the link reads as the address alone.
    expect(source).toMatch(/<span class="work-letter-company-arrow" aria-hidden="true">/);
    expect(source).not.toMatch(/Backend Engineering|·/);
    expect(read('src/components/HomeBoard.astro')).toContain('<WorkLetter />');
  });

  it('reserves message dimensions and keeps the complete conversation accessible', () => {
    const source = letter();
    expect(source).toContain('data-work-language-panel={language} hidden={language !== \'en\'}');
    expect(source).toContain('class="work-letter-reserve">{question}</span>');
    expect(source).toContain('class="work-letter-reserve">{answer}</span>');
    expect(source).toContain('class="sr-only"');
    expect(source).toContain('class="work-letter-thread" aria-hidden="true"');
  });

  it('unfolds only for visitors who did not ask for less motion', () => {
    const source = letter();
    const split = source.indexOf('@media (prefers-reduced-motion: no-preference)');

    expect(split).toBeGreaterThan(0);
    expect(source.slice(0, split)).not.toMatch(/animation:\s*work-letter-/);
    expect(read('src/lib/work-letter.ts')).toMatch(/prefers-reduced-motion: reduce/);
  });

  it('ends on its last line, under a soft light that never covers its text or controls', () => {
    const source = letter();
    const rule = (selector: string) => {
      const start = source.indexOf(`\n  ${selector} {`);
      expect(start, selector).toBeGreaterThan(0);
      return source.slice(start, source.indexOf('\n  }', start));
    };

    // No glass, in the flow or in the light: the letter ends on "and make you want to meet again".
    expect(source).not.toMatch(/work-letter-(?:glass|rings|pane|sheen)/);
    expect(source).toMatch(/<p class="work-letter-waiting"[^>]*>\{letter\.waiting\}<\/p>\s*<div class="work-letter-foot">/);
    // One decorative layer, inside the dialog and outside the scrolling sheet, shared by both languages.
    expect(source).toMatch(/<div class="work-letter-glow" aria-hidden="true" data-work-letter-glow data-stage="0">/);
    expect(source.indexOf('data-work-letter-glow')).toBeLessThan(source.indexOf('data-work-letter-sheet'));
    expect(source.match(/class="work-letter-glow"/g)).toHaveLength(1);
    const glow = rule('.work-letter-glow');
    for (const declaration of ['position: absolute', 'z-index: 0', 'inset: 44px 0 0', 'overflow: hidden', 'contain: strict', 'pointer-events: none']) {
      expect(glow).toContain(declaration);
    }
    // Every text and control sits in the sheet, above the light; the bar keeps its solid paper.
    expect(rule('.work-letter-sheet')).toMatch(/position: relative;\s*z-index: 1;/);
    const foot = rule('.work-letter-foot');
    expect(foot).toMatch(/position: sticky;\s*z-index: 1;/);
    expect(foot).toContain('margin: auto -40px 0');
    expect(foot).toContain('padding: 0 40px env(safe-area-inset-bottom)');
    expect(foot).toContain('background: #fbfaf6');
    // No live blur, mask or layer hints anywhere in the letter.
    expect(source).not.toMatch(/backdrop-filter|filter:\s*blur|mask-image|will-change/);
  });

  it('moves the light by stage, with transform and opacity alone', () => {
    const source = letter();
    // The turns bring in the cool glow, the sun rising and the crema light; the pledge ends it.
    expect([0, 1, 2].map(turnStage)).toEqual([1, 2, 3]);
    expect(turnStage(5)).toBe(FINAL_STAGE - 1);
    expect(FINAL_STAGE).toBe(4);
    for (const stage of [2, 3, 4]) expect(source).toContain(`[data-stage="${stage}"] .is-sun`);
    expect(source).toContain('.work-letter-glow:not([data-stage="0"]) .is-cool');
    // The light is already there, faint, when the letter opens.
    for (const light of ['is-cool', 'is-sun', 'is-crema']) {
      const start = source.indexOf(`.work-letter-light.${light} {`);
      const opacity = Number(source.slice(start, source.indexOf('}', start)).match(/opacity: ([\d.]+)/)?.[1]);
      expect(opacity, light).toBeGreaterThan(0);
      expect(opacity, light).toBeLessThan(1);
    }    // Each stage changes only transform and opacity.
    for (const [, body] of source.matchAll(/\[data-stage[^{]*\{([^}]*)\}/g)) {
      const properties = body.split(';').map((part) => part.split(':')[0].trim()).filter(Boolean);
      expect(properties.every((property) => ['transform', 'opacity'].includes(property)), body).toBe(true);
    }
    // Its transitions run only for visitors who did not ask for less motion, on transform and opacity.
    const motion = source.slice(source.indexOf('@media (prefers-reduced-motion: no-preference)'));
    const before = source.slice(0, source.indexOf('@media (prefers-reduced-motion: no-preference)'));
    expect(before).not.toMatch(/transition:/);
    const declaration = motion.match(/\n    \.work-letter-light \{ transition: ([^}]*)\}/)?.[1] ?? '';
    expect(declaration).not.toBe('');
    const properties = declaration.split(/,(?![^(]*\))/).map((part) => part.trim().split(/\s+/)[0]);
    expect(properties.every((property) => ['transform', 'opacity'].includes(property)), declaration).toBe(true);
    // Replay and a language switch ease back to the start, a closed letter is reset out of
    // sight, and reduced motion jumps to the end.
    const script = read('src/lib/work-letter.ts');
    expect(script).toContain('stage(0);');
    expect(script).toContain('stage(0, true)');
    expect(script).toContain('stage(FINAL_STAGE, true)');
    expect(script).not.toMatch(/\.animate\([^)]*light/);
  });
});
