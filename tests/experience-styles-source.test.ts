import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalStyles = readFileSync(
  resolve(process.cwd(), 'src/styles/play.css'),
  'utf8',
);
const siteStyles = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

describe('experience styles source contract', () => {
  it('defines the one-screen game surface and identity overlay hooks', () => {
    expect(globalStyles).toContain('.experience-shell');
    expect(globalStyles).toContain('.game-panel');
    expect(globalStyles).toContain('.identity-strip');
    expect(globalStyles).toContain('.experience-stage');
    expect(globalStyles).toContain('touch-action: none;');
    expect(globalStyles).toContain('height: 100dvh;');
    expect(globalStyles).toContain('overflow: hidden;');
    expect(globalStyles).toContain('border-radius: 0;');
    expect(globalStyles).not.toContain('.experience-copy');
    expect(globalStyles).toContain('.identity-links a {');
    expect(globalStyles).toContain('display: inline-block;');
    expect(globalStyles).toContain('background: none;');
    expect(globalStyles).toContain('font-size: clamp(0.7rem, calc(0.82rem * var(--experience-scale)), 0.82rem);');
    expect(globalStyles).toContain('color: rgba(255, 255, 255, 0.78);');
    expect(globalStyles).toContain('letter-spacing: 0.08em;');
    expect(globalStyles).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);');
    expect(globalStyles).toContain("grid-template-areas: 'label score links';");
    expect(globalStyles).toContain('grid-area: label;');
    expect(globalStyles).toContain('grid-area: score;');
    expect(globalStyles).toContain('grid-area: links;');
    expect(globalStyles).toContain('@media (max-width: 720px)');
    expect(globalStyles).toContain("grid-template-areas:\n      'label links'\n      'score score';");
    expect(globalStyles).not.toContain('.fallback-copy');
    expect(globalStyles).not.toContain('.experience-hud');
  });

  it('locks scrolling only on the game page and loads fonts through the bundler', () => {
    expect(globalStyles).toContain('body.play {\n  overflow: hidden;');
    expect(siteStyles).not.toMatch(/body\s*\{[^}]*overflow:\s*hidden/);
    expect(globalStyles).toContain("url('../assets/fonts/roboto-mono-400.ttf')");
    expect(globalStyles).not.toContain("url('/assets/");
    expect(globalStyles).toContain('view-transition-name: text-field;');
  });
});
