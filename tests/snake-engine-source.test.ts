import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const engineSource = readFileSync(
  resolve(process.cwd(), 'src/lib/snake-experience.ts'),
  'utf8',
);

describe('snake engine source contract', () => {
  it('drives linear burst state without defeat buttons', () => {
    expect(engineSource).toContain('renderBackground(');
    expect(engineSource).toContain('prepared: PreparedText');
    expect(engineSource).toContain('const BACKGROUND_TEXT_SIZE = 13;');
    expect(engineSource).toContain('const MOBILE_BACKGROUND_WORD_COUNT = 220;');
    expect(engineSource).toContain('const TABLET_BACKGROUND_WORD_COUNT = 520;');
    expect(engineSource).toContain('resolveBackgroundLayout(');
    expect(engineSource).toContain('avoidSnakeRadius');
    expect(engineSource).toContain('intersectsSnakeBody(');
    expect(engineSource).toContain('const count = 3 + Math.floor(random() * 4);');
    expect(engineSource).toContain('const looseWidth = 340 + random() * 220 + phrase.intensity * 54;');
    expect(engineSource).toContain('const laneOffset = index - (count - 1) / 2;');
    expect(engineSource).toContain('const lateral = laneOffset * (136 + random() * 32);');
    expect(engineSource).toContain('const vertical = (random() - 0.5) * 68 + ((index % 2) * 2 - 1) * 34;');
    expect(engineSource).toContain('const BURST_SWAY = 0.04;');
    expect(engineSource).toContain('const BURST_ECHO_OFFSET = 4;');
    expect(engineSource).toContain('type PreparedPhraseGroups = {');
    expect(engineSource).toContain('ko: PreparedPhrase[];');
    expect(engineSource).toContain('en: PreparedPhrase[];');
    expect(engineSource).toContain('const startWithEnglish = random() > 0.5;');
    expect(engineSource).toContain('const useEnglish = (index % 2 === 0) === startWithEnglish;');
    expect(engineSource).toContain('const pool = useEnglish ? preparedPhrases.en : preparedPhrases.ko;');
    expect(engineSource).toContain('function createBurstKeyframes(');
    expect(engineSource).toContain('keyframes: createBurstKeyframes(');
    expect(engineSource).toContain('function interpolateBurstFrames(');
    expect(engineSource).toContain('function computeViewportScale(');
    expect(engineSource).toContain('function getBackgroundWordCount(');
    expect(engineSource).toContain('viewportScale');
    expect(engineSource).toContain('gameOverAt');
    expect(engineSource).toContain('gameOverOrigin');
    expect(engineSource).toContain('function renderGameOverOverlay(');
    expect(engineSource).toContain("const title = '퇴근';");
    expect(engineSource).toContain("const subtitle = 'get off work';");
    expect(engineSource).toContain('ctx.fillText(title, centerX, centerY + scoreSize * 0.88);');
    expect(engineSource).toContain('ctx.fillText(subtitle, centerX, centerY + scoreSize * 1.08);');
    expect(engineSource).toContain('if (state.over) {');
    expect(engineSource).toContain('renderSnake(ctx, state.snake, state.cellSize, worldNow);');
    expect(engineSource).toContain('renderGameOverOverlay(');
    expect(engineSource).toContain(
      "updateScoreText(state.over ? '' : `length ${state.score} · cpu ${state.cpu.score}`);",
    );
    expect(engineSource).toContain('if (lastScoreText !== text) {');
    expect(engineSource).toContain("event.key === 'Enter' || event.key === ' '");
    expect(engineSource).toContain('paused: boolean;');
    expect(engineSource).toContain('state.paused = !state.paused;');
    expect(engineSource).toContain('type SwipeState = {');
    expect(engineSource).toContain('pointerId: number;');
    expect(engineSource).toContain('pointerType: string;');
    expect(engineSource).toContain('function getSwipeDirection(');
    expect(engineSource).toContain("event.pointerType === 'mouse'");
    expect(engineSource).toContain("root.addEventListener('pointerdown', handlePointerDown);");
    expect(engineSource).toContain("root.addEventListener('pointerup', handlePointerUp);");
    expect(engineSource).toContain("root.addEventListener('pointercancel', handlePointerCancel);");
    expect(engineSource).toContain('const restartOnTap = state.over');
    expect(engineSource).toContain('state.gameOverAt = now');
    expect(engineSource).toContain('function drawDotCell(');
    expect(engineSource).toContain('drawDotCell(ctx, x, y, size);');
    expect(engineSource).toContain('function drawTakeoutCupGlyph(');
    expect(engineSource).toContain('drawTakeoutCupGlyph(ctx, x, y, size);');
    expect(engineSource).toContain('const FOOD_DOT_INSET = 4;');
    expect(engineSource).toContain('const SNAKE_DOT_INSET = 4;');
    expect(engineSource).toContain('state.lockUntil = now + playfieldConfig.burstLockMs');
    expect(engineSource).not.toContain('document.createElement(\'button\')');
    expect(engineSource).not.toContain('overlay.append(');
    expect(engineSource).not.toContain('renderGameOverBackdrop(');
    expect(engineSource).not.toContain('foldGlow');
    expect(engineSource).not.toContain('foldBand');
    expect(engineSource).not.toContain('drawCatFace');
    expect(engineSource).not.toContain('shimmerUntil');
    expect(engineSource).not.toContain('shimmerOrigin');
    expect(engineSource).not.toContain('createRadialGradient');
    expect(engineSource).not.toContain('function computeFieldFoldState(');
    expect(engineSource).not.toContain('Math.cos(angle) * spread');
    expect(engineSource).not.toContain('Math.sin(angle) * spread');
  });

  it('ramps the step speed with snake length', () => {
    expect(engineSource).toContain('function currentStepMs(');
    expect(engineSource).toContain('playfieldConfig.maxSpeed');
    expect(engineSource).toContain('playfieldConfig.speedRampEvery');
    expect(engineSource).toContain('let stepMs = currentStepMs(state.snake.length);');
    expect(engineSource).toContain('stepMs = currentStepMs(state.snake.length);');
    expect(engineSource).not.toContain('const STEP_MS');
  });

  it('persists the best length and shows it on game over', () => {
    expect(engineSource).toContain("const BEST_SCORE_KEY = 'lucas-flatwhite:best-length';");
    expect(engineSource).toContain('function loadBestScore(');
    expect(engineSource).toContain('function saveBestScore(');
    expect(engineSource).toContain('const recordBestScore = (): void => {');
    expect(engineSource).toContain("isNewBest ? `new record! best ${bestScore}` : `best ${bestScore}`");
    expect(engineSource).toContain("'enter / tap → restart'");
  });

  it('shows a pause overlay and accepts wasd controls', () => {
    expect(engineSource).toContain('function renderPauseOverlay(');
    expect(engineSource).toContain("'일시정지'");
    expect(engineSource).toContain('const KEY_DIRECTIONS: Record<string, Direction>');
    expect(engineSource).toContain('w: DIRECTIONS.up');
    expect(engineSource).toContain('d: DIRECTIONS.right');
  });

  it('keeps per-frame rendering costs bounded', () => {
    expect(engineSource).toContain('const WORD_SEPARATION_INTERVAL = 3;');
    expect(engineSource).toContain('frame % WORD_SEPARATION_INTERVAL');
    expect(engineSource).toContain('const MAX_DEVICE_PIXEL_RATIO = 2;');
    expect(engineSource).toContain('Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)');
    expect(engineSource).toContain('function getBackgroundGradient(');
    expect(engineSource).toContain('color: `hsla(');
    expect(engineSource).toContain('ctx.fillStyle = word.color;');
  });

  it('runs a rival cpu snake competing for the same food', () => {
    expect(engineSource).toContain('type CpuSnake = {');
    expect(engineSource).toContain('function createCpuSnake(');
    expect(engineSource).toContain('function respawnCpu(');
    expect(engineSource).toContain('function chooseCpuDirection(');
    expect(engineSource).toContain('function stepCpu(');
    expect(engineSource).toContain('function renderCpuSnake(');
    expect(engineSource).toContain('playfieldConfig.cpuRespawnMs');
    expect(engineSource).toContain('if (random() < 0.12) {');
    expect(engineSource).toContain('state.cpu.alive &&');
    expect(engineSource).toContain('state.cpu.body.some((segment) => samePoint(segment, nextHead))');
    expect(engineSource).toContain("const duel = score > cpuScore ? '승' : score < cpuScore ? '패' : '무';");
    expect(engineSource).toContain('`vs cpu ${cpuScore} · ${duel}`');
    expect(engineSource).toContain('renderCpuSnake(ctx, state.cpu, state.cellSize, worldNow);');
  });

  it('ignores height-only mobile url bar resizes', () => {
    expect(engineSource).toContain('const RESIZE_HEIGHT_TOLERANCE = 140;');
    expect(engineSource).toContain('if (width === lastWidth && heightDelta < RESIZE_HEIGHT_TOLERANCE) {');
  });
});
