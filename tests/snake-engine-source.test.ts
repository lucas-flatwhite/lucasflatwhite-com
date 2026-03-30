import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const engineSource = readFileSync(
  resolve(process.cwd(), 'src/lib/snake-experience.ts'),
  'utf8',
);

describe('snake engine source contract', () => {
  it('drives burst shimmer state without defeat buttons', () => {
    expect(engineSource).toContain('shimmerUntil');
    expect(engineSource).toContain('shimmerOrigin');
    expect(engineSource).toContain('renderBackground(');
    expect(engineSource).toContain('prepared: PreparedText');
    expect(engineSource).toContain('const BACKGROUND_TEXT_SIZE = 13;');
    expect(engineSource).toContain('resolveBackgroundLayout(');
    expect(engineSource).toContain('avoidSnakeRadius');
    expect(engineSource).toContain('intersectsSnakeBody(');
    expect(engineSource).toContain('const count = 3 + Math.floor(random() * 4);');
    expect(engineSource).toContain('const looseWidth = 340 + random() * 220 + phrase.intensity * 54;');
    expect(engineSource).toContain('const BURST_SWAY = 0.04;');
    expect(engineSource).toContain('const BURST_ECHO_OFFSET = 4;');
    expect(engineSource).toContain('function createBurstKeyframes(');
    expect(engineSource).toContain('keyframes: createBurstKeyframes(');
    expect(engineSource).toContain('function interpolateBurstFrames(');
    expect(engineSource).toContain('function computeViewportScale(');
    expect(engineSource).toContain('viewportScale');
    expect(engineSource).toContain('gameOverAt');
    expect(engineSource).toContain('gameOverOrigin');
    expect(engineSource).toContain('function computeFieldFoldState(');
    expect(engineSource).toContain('const layoutTime = gameOverAt > 0 ? gameOverAt : now;');
    expect(engineSource).toContain('resolveBackgroundLayout(words, snakeRects, width, height, layoutTime);');
    expect(engineSource).toContain('saturation: 0');
    expect(engineSource).toContain("event.key === 'Enter' || event.key === ' '");
    expect(engineSource).toContain('paused: boolean;');
    expect(engineSource).toContain('state.paused = !state.paused;');
    expect(engineSource).toContain('status.textContent = state.paused ?');
    expect(engineSource).toContain('state.gameOverAt = now');
    expect(engineSource).toContain('function drawCoffeeGlyph(');
    expect(engineSource).toContain('drawCoffeeGlyph(ctx, size, pulse);');
    expect(engineSource).toContain('const lidWidth = size * 0.54;');
    expect(engineSource).toContain('const bodyInset = size * 0.08;');
    expect(engineSource).toContain('const sleeveInset = size * 0.11;');
    expect(engineSource).toContain('function drawCatFace(');
    expect(engineSource).toContain('drawCatFace(ctx, size);');
    expect(engineSource).toContain('const earHeight = size * 0.22;');
    expect(engineSource).toContain('state.lockUntil = now + playfieldConfig.burstLockMs');
    expect(engineSource).not.toContain('document.createElement(\'button\')');
    expect(engineSource).not.toContain('overlay.append(');
    expect(engineSource).not.toContain('renderGameOverBackdrop(');
    expect(engineSource).not.toContain('foldGlow');
    expect(engineSource).not.toContain('foldBand');
  });
});
