import {
  layout,
  layoutNextLine,
  layoutWithLines,
  prepare,
  prepareWithSegments,
  setLocale,
  walkLineRanges,
  type LayoutCursor,
  type PreparedText,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import {
  backgroundWordPool,
  burstPhrasePool,
  playfieldConfig,
} from '../data/site';

type Point = {
  x: number;
  y: number;
};

type Direction = Point;

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type BackgroundWord = {
  text: string;
  prepared: PreparedText;
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  size: number;
  hue: number;
  drift: number;
  avoidSnakeRadius: number;
};

type PreparedPhrase = (typeof burstPhrasePool)[number] & {
  prepared: PreparedTextWithSegments;
  compactPrepared: PreparedText;
};

type BurstLine = {
  text: string;
  width: number;
  y: number;
};

type BurstKeyframe = {
  progress: number;
  width: number;
  blockHeight: number;
  lines: BurstLine[];
};

type BurstCluster = {
  id: number;
  phrase: PreparedPhrase;
  x: number;
  y: number;
  bornAt: number;
  durationMs: number;
  looseWidth: number;
  tightWidth: number;
  lineHeight: number;
  rotation: number;
  twist: number;
  keyframes: BurstKeyframe[];
};

type FieldFoldState = {
  centerX: number;
  centerY: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  hueShift: number;
  shadowBoost: number;
  saturation: number;
  lightness: number;
};

type GameState = {
  cols: number;
  rows: number;
  cellSize: number;
  viewportScale: number;
  paused: boolean;
  pauseStartedAt: number;
  pausedDuration: number;
  snake: Point[];
  direction: Direction;
  queuedDirection: Direction;
  growth: number;
  food: Point;
  score: number;
  lastStepAt: number;
  lockUntil: number;
  words: BackgroundWord[];
  bursts: BurstCluster[];
  shimmerUntil: number;
  shimmerOrigin: Point | null;
  gameOverAt: number;
  gameOverOrigin: Point | null;
  over: boolean;
  burstId: number;
};

const ZERO_CURSOR: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
const WORD_FONT = '500 15px "Roboto Mono"';
const BURST_FONT = 'italic 700 22px "Roboto Slab"';
const BURST_LINE_HEIGHT = playfieldConfig.lineHeight;
const BURST_SWAY = 0.04;
const BURST_ECHO_OFFSET = 4;
const BACKGROUND_TEXT_SIZE = 13;
const BACKGROUND_TEXT_PADDING = 6;
const BACKGROUND_SNAKE_PADDING = 16;
const STEP_MS = 1000 / playfieldConfig.baseSpeed;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const satisfies Record<string, Direction>;

function createRandom(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function sameDirection(a: Direction, b: Direction): boolean {
  return a.x === b.x && a.y === b.y;
}

function isReverse(next: Direction, current: Direction): boolean {
  return next.x === -current.x && next.y === -current.y;
}

function createInitialSnake(cols: number, rows: number): Point[] {
  const startX = Math.floor(cols / 3);
  const startY = Math.floor(rows / 2);

  return [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
}

function measurePreparedWidth(text: string, font: string): number {
  const prepared = prepareWithSegments(text, font);
  let widest = 0;

  walkLineRanges(prepared, 100_000, (line) => {
    widest = Math.max(widest, line.width);
  });

  return Math.max(12, Math.ceil(widest));
}

function computeViewportScale(width: number, height: number): number {
  const widthScale = Math.min(1, Math.max(0.76, width / 1320));
  const heightScale = Math.min(1, Math.max(0.8, height / 920));

  return Math.max(0.76, Math.min(widthScale, heightScale));
}

function createBackgroundWords(
  width: number,
  height: number,
  random: () => number,
  viewportScale: number,
): BackgroundWord[] {
  const words: BackgroundWord[] = [];
  const total = playfieldConfig.backgroundWordCount;
  const safeWidth = Math.max(width - 8, 120);
  const safeHeight = Math.max(height - 8, 120);
  const rowCount = Math.max(
    14,
    Math.round(Math.sqrt((total * safeHeight) / safeWidth) * 1.3),
  );
  const colCount = Math.max(12, Math.ceil(total / rowCount));
  const laneWidth = safeWidth / colCount;
  const laneHeight = safeHeight / rowCount;
  const textSize = Math.max(10, Math.round(BACKGROUND_TEXT_SIZE * viewportScale));
  const font = WORD_FONT.replace('15px', `${textSize}px`);
  const lineHeight = Math.max(14, Math.ceil(textSize * 1.3));

  for (let index = 0; index < total; index += 1) {
    const text =
      backgroundWordPool[Math.floor(random() * backgroundWordPool.length)] ??
      '파동';
    const prepared = prepare(text, font);
    const wordWidth = measurePreparedWidth(text, font);
    const wordHeight = layout(prepared, wordWidth + 4, lineHeight).height;
    const row = Math.floor(index / colCount);
    const col = index % colCount;
    const baseX = 4 + col * laneWidth;
    const baseY = 6 + row * laneHeight;
    const jitterX = (random() - 0.5) * Math.max(3, laneWidth * 0.12);
    const jitterY = (random() - 0.5) * Math.max(3, laneHeight * 0.1);
    const x = Math.max(8, Math.min(width - wordWidth - 8, baseX + jitterX));
    const y = Math.max(
      wordHeight + 8,
      Math.min(height - 8, baseY + laneHeight * 0.74 + jitterY),
    );

    words.push({
      text,
      prepared,
      anchorX: x,
      anchorY: y,
      x,
      y,
      width: wordWidth,
      height: wordHeight,
      alpha: 0.16 + random() * 0.24,
      size: textSize,
      hue: 150 + random() * 220,
      drift: random() * Math.PI * 2,
      avoidSnakeRadius: (44 + random() * 28) * Math.max(0.86, viewportScale),
    });
  }

  return words;
}

function pickFreeCell(
  cols: number,
  rows: number,
  snake: readonly Point[],
  random: () => number,
): Point {
  for (let attempt = 0; attempt < 800; attempt += 1) {
    const candidate = {
      x: Math.floor(random() * cols),
      y: Math.floor(random() * rows),
    };

    if (!snake.some((segment) => samePoint(segment, candidate))) {
      return candidate;
    }
  }

  return { x: cols - 2, y: rows - 2 };
}

function choosePaletteColor(
  palette: PreparedPhrase['palette'],
  progress: number,
  lineIndex: number,
): string {
  const offset = Math.sin(progress * 9 + lineIndex * 0.65);

  switch (palette) {
    case 'flare':
      return `hsla(${18 + lineIndex * 12}, 100%, ${68 + offset * 8}%, ${0.92 - progress * 0.38})`;
    case 'mint':
      return `hsla(${162 + lineIndex * 10}, 98%, ${68 + offset * 10}%, ${0.9 - progress * 0.36})`;
    case 'heat':
      return `hsla(${332 - lineIndex * 14}, 100%, ${66 + offset * 8}%, ${0.95 - progress * 0.34})`;
    case 'sunset':
      return `hsla(${46 + lineIndex * 8}, 100%, ${68 + offset * 9}%, ${0.9 - progress * 0.35})`;
  }
}

function findTightWidth(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
): number {
  let widest = 0;

  walkLineRanges(prepared, maxWidth, (line) => {
    widest = Math.max(widest, line.width);
  });

  return Math.max(132, Math.ceil(widest + 10));
}

function createPreparedPhrases(): PreparedPhrase[] {
  setLocale('ko');

  return burstPhrasePool.map((phrase) => ({
    ...phrase,
    prepared: prepareWithSegments(phrase.text, BURST_FONT),
    compactPrepared: prepare(phrase.text, BURST_FONT),
  }));
}

function drawRoundedCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function buildVariableLines(
  prepared: PreparedTextWithSegments,
  width: number,
  lineHeight: number,
  twist: number,
  progress: number,
): BurstLine[] {
  const lines: BurstLine[] = [];
  let cursor = ZERO_CURSOR;
  let y = 0;
  let guard = 0;

  while (guard < 14) {
    const widthScale = 0.72 + 0.24 * Math.sin(progress * 8 + guard * 0.72 + twist);
    const line = layoutNextLine(prepared, cursor, Math.max(88, width * widthScale));

    if (line === null) {
      break;
    }

    lines.push({ text: line.text, width: line.width, y });
    cursor = line.end;
    y += lineHeight;
    guard += 1;
  }

  return lines;
}

function createBurstKeyframes(
  phrase: PreparedPhrase,
  looseWidth: number,
  tightWidth: number,
  lineHeight: number,
  twist: number,
): BurstKeyframe[] {
  const samples = [0, 0.18, 0.38, 0.62, 1];

  return samples.map((progress) => {
    const width = tightWidth + (looseWidth - tightWidth) * (1 - progress);
    const lines =
      progress < 0.48
        ? buildVariableLines(phrase.prepared, width, lineHeight, twist, progress)
        : layoutWithLines(phrase.prepared, width, lineHeight).lines.map((line, index) => ({
            text: line.text,
            width: line.width,
            y: index * lineHeight,
          }));
    const compact = layout(
      phrase.compactPrepared,
      Math.max(tightWidth, width * 0.92),
      lineHeight,
    );

    return {
      progress,
      width,
      blockHeight: Math.max(compact.height, lines.length * lineHeight),
      lines,
    };
  });
}

function interpolateBurstFrames(
  keyframes: readonly BurstKeyframe[],
  progress: number,
): {
  from: BurstKeyframe;
  to: BurstKeyframe;
  mix: number;
} {
  let from = keyframes[0]!;
  let to = keyframes[keyframes.length - 1]!;

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index]!;
    const next = keyframes[index + 1]!;

    if (progress >= current.progress && progress <= next.progress) {
      from = current;
      to = next;
      break;
    }
  }

  if (from === to) {
    return { from, to, mix: 0 };
  }

  const span = Math.max(0.0001, to.progress - from.progress);
  const mix = Math.min(1, Math.max(0, (progress - from.progress) / span));

  return { from, to, mix };
}

function createBurstClusters(
  origin: Point,
  cellSize: number,
  preparedPhrases: readonly PreparedPhrase[],
  random: () => number,
  startId: number,
  now: number,
): BurstCluster[] {
  const originX = (origin.x + 0.5) * cellSize;
  const originY = (origin.y + 0.5) * cellSize;
  const count = 3 + Math.floor(random() * 4);

  return Array.from({ length: count }, (_, index) => {
    const phrase =
      preparedPhrases[Math.floor(random() * preparedPhrases.length)] ??
      preparedPhrases[0];
    const looseWidth = 340 + random() * 220 + phrase.intensity * 54;
    const tightWidth = findTightWidth(phrase.prepared, looseWidth);
    const spread = 56 + index * 34 + random() * 56;
    const angle = random() * Math.PI * 2;
    const lineHeight = BURST_LINE_HEIGHT + phrase.intensity * 2;
    const twist = random() * Math.PI * 2;

    return {
      id: startId + index,
      phrase,
      x: originX + Math.cos(angle) * spread,
      y: originY + Math.sin(angle) * spread,
      bornAt: now,
      durationMs: playfieldConfig.burstDurationMs + phrase.intensity * 260,
      looseWidth,
      tightWidth,
      lineHeight,
      rotation: (random() - 0.5) * 0.22,
      twist,
      keyframes: createBurstKeyframes(phrase, looseWidth, tightWidth, lineHeight, twist),
    };
  });
}

function createSnakeRects(
  snake: readonly Point[],
  cellSize: number,
  padding = BACKGROUND_SNAKE_PADDING,
): Rect[] {
  return snake.map((segment) => ({
    x: segment.x * cellSize - padding,
    y: segment.y * cellSize - padding,
    width: cellSize + padding * 2,
    height: cellSize + padding * 2,
  }));
}

function createWordRect(word: BackgroundWord): Rect {
  return {
    x: word.x - BACKGROUND_TEXT_PADDING,
    y: word.y - word.height - BACKGROUND_TEXT_PADDING,
    width: word.width + BACKGROUND_TEXT_PADDING * 2,
    height: word.height + BACKGROUND_TEXT_PADDING * 2,
  };
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function intersectsSnakeBody(
  word: BackgroundWord,
  snakeRects: readonly Rect[],
): boolean {
  const wordRect = createWordRect(word);
  return snakeRects.some((rect) => rectsIntersect(wordRect, rect));
}

function pushWordOutsideRect(word: BackgroundWord, rect: Rect): void {
  const wordRect = createWordRect(word);
  const overlapLeft = wordRect.x + wordRect.width - rect.x;
  const overlapRight = rect.x + rect.width - wordRect.x;
  const overlapTop = wordRect.y + wordRect.height - rect.y;
  const overlapBottom = rect.y + rect.height - wordRect.y;
  const centerDx = word.x + word.width * 0.5 - (rect.x + rect.width * 0.5);
  const centerDy = word.y - word.height * 0.5 - (rect.y + rect.height * 0.5);

  const moves = [
    { axis: 'x', delta: -(overlapLeft + 2), weight: Math.abs(centerDx) },
    { axis: 'x', delta: overlapRight + 2, weight: Math.abs(centerDx) },
    { axis: 'y', delta: -(overlapTop + 2), weight: Math.abs(centerDy) },
    { axis: 'y', delta: overlapBottom + 2, weight: Math.abs(centerDy) },
  ].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta) || b.weight - a.weight);

  const move = moves[0];

  if (!move) {
    return;
  }

  if (move.axis === 'x') {
    word.x += move.delta;
    return;
  }

  word.y += move.delta;
}

function drawBackgroundWord(
  ctx: CanvasRenderingContext2D,
  word: BackgroundWord,
  sparkle: number,
  foldState: FieldFoldState | null,
): void {
  ctx.font = WORD_FONT.replace('15px', `${word.size}px`);
  ctx.shadowBlur =
    sparkle > 0 || foldState
      ? 14 + sparkle * 20 + (foldState?.shadowBoost ?? 0)
      : 0;
  ctx.shadowColor = `hsla(${(word.hue + 40 + (foldState?.hueShift ?? 0)) % 360}, 100%, 76%, ${Math.min(0.92, sparkle * 0.8 + (foldState?.alpha ?? 0) * 0.18)})`;
  ctx.fillStyle = `hsla(${(word.hue + sparkle * 42 + (foldState?.hueShift ?? 0)) % 360}, ${foldState?.saturation ?? 96}%, ${foldState?.lightness ?? 72 + sparkle * 16 - (1 - (foldState?.alpha ?? 1)) * 18}%, ${Math.min(0.96, (word.alpha + sparkle * 0.85) * (foldState?.alpha ?? 1))})`;

  if (foldState) {
    ctx.save();
    ctx.translate(foldState.centerX, foldState.centerY);
    ctx.scale(foldState.scaleX, foldState.scaleY);
    ctx.fillText(word.text, -word.width * 0.5, word.height * 0.42);
    ctx.restore();
    return;
  }

  ctx.fillText(word.text, word.x, word.y);
}

function isDynamicWord(
  word: BackgroundWord,
  snakeRects: readonly Rect[],
  shimmerOrigin: Point | null,
  shimmer: number,
  cellSize: number,
): boolean {
  if (intersectsSnakeBody(word, snakeRects)) {
    return true;
  }

  if (shimmer <= 0 || !shimmerOrigin) {
    return false;
  }

  return (
    Math.hypot(
      word.x + word.width * 0.5 - (shimmerOrigin.x + 0.5) * cellSize,
      word.y - word.height * 0.5 - (shimmerOrigin.y + 0.5) * cellSize,
    ) <
    playfieldConfig.pulseRadius * 1.35
  );
}

function computeFieldFoldState(
  word: BackgroundWord,
  now: number,
  gameOverAt: number,
  gameOverOrigin: Point | null,
  cellSize: number,
  width: number,
  height: number,
): FieldFoldState | null {
  if (!gameOverOrigin || gameOverAt <= 0) {
    return null;
  }

  const progress = Math.min(1, Math.max(0, (now - gameOverAt) / 960));

  if (progress <= 0) {
    return null;
  }

  const originX = (gameOverOrigin.x + 0.5) * cellSize;
  const originY = (gameOverOrigin.y + 0.5) * cellSize;
  const centerX = word.x + word.width * 0.5;
  const centerY = word.y - word.height * 0.42;
  const dx = centerX - originX;
  const dy = centerY - originY;
  const distance = Math.hypot(dx, dy);
  const maxReach = Math.max(width, height) * 0.78;
  const influence = Math.max(0, 1 - distance / maxReach);

  if (influence <= 0.01) {
    return {
      centerX,
      centerY,
      scaleX: 1,
      scaleY: 1,
      alpha: 1 - progress * 0.14,
      hueShift: 0,
      shadowBoost: 0,
      saturation: 0,
      lightness: 66 - progress * 14,
    };
  }

  const curve = influence * influence;

  return {
    centerX,
    centerY,
    scaleX: 1,
    scaleY: 1,
    alpha: Math.max(0.24, 1 - progress * (0.2 + curve * 0.3)),
    hueShift: 0,
    shadowBoost: curve * (1 - progress) * 4,
    saturation: 0,
    lightness: 64 - progress * 18 - curve * 6,
  };
}

function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  words: BackgroundWord[],
  now: number,
  shimmerUntil: number,
  shimmerOrigin: Point | null,
  cellSize: number,
  snake: readonly Point[],
  gameOverAt: number,
  gameOverOrigin: Point | null,
): void {
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#07040f');
  background.addColorStop(0.4, '#12071c');
  background.addColorStop(1, '#041c1e');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const halo = ctx.createRadialGradient(width * 0.2, height * 0.16, 0, width * 0.2, height * 0.16, width * 0.5);
  halo.addColorStop(0, 'rgba(255, 112, 87, 0.18)');
  halo.addColorStop(0.45, 'rgba(18, 202, 255, 0.12)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  const shimmer = shimmerOrigin ? Math.max(0, (shimmerUntil - now) / 1100) : 0;

  if (shimmer > 0 && shimmerOrigin) {
    const shimmerX = (shimmerOrigin.x + 0.5) * cellSize;
    const shimmerY = (shimmerOrigin.y + 0.5) * cellSize;
    const burstGlow = ctx.createRadialGradient(
      shimmerX,
      shimmerY,
      0,
      shimmerX,
      shimmerY,
      playfieldConfig.pulseRadius * (0.95 + shimmer * 0.95),
    );
    burstGlow.addColorStop(0, `rgba(255, 237, 160, ${0.18 + shimmer * 0.28})`);
    burstGlow.addColorStop(0.35, `rgba(255, 96, 140, ${0.16 + shimmer * 0.22})`);
    burstGlow.addColorStop(0.7, `rgba(83, 246, 224, ${0.1 + shimmer * 0.16})`);
    burstGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = burstGlow;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const snakeRects = createSnakeRects(snake, cellSize);
  const layoutTime = gameOverAt > 0 ? gameOverAt : now;
  resolveBackgroundLayout(words, snakeRects, width, height, layoutTime);

  for (const word of words) {
    if (intersectsSnakeBody(word, snakeRects)) {
      continue;
    }

    const distanceBoost =
      shimmer > 0 && shimmerOrigin
        ? Math.max(
            0,
            1 -
              Math.hypot(
                word.x + word.width * 0.5 - (shimmerOrigin.x + 0.5) * cellSize,
                word.y - word.height * 0.5 - (shimmerOrigin.y + 0.5) * cellSize,
              ) /
                (playfieldConfig.pulseRadius * 1.7),
          )
        : 0;
    const sparkle = shimmer * distanceBoost;
    const foldState = computeFieldFoldState(
      word,
      now,
      gameOverAt,
      gameOverOrigin,
      cellSize,
      width,
      height,
    );
    drawBackgroundWord(
      ctx,
      word,
      isDynamicWord(word, snakeRects, shimmerOrigin, shimmer, cellSize)
        ? sparkle
        : 0,
      foldState,
    );
  }

  ctx.shadowBlur = 0;
}

function drawCoffeeGlyph(
  ctx: CanvasRenderingContext2D,
  size: number,
  pulse: number,
): void {
  const lidWidth = size * 0.54;
  const lidHeight = size * 0.12;
  const cupTopWidth = size * 0.46;
  const cupBottomWidth = size * 0.34;
  const cupHeight = size * 0.42;
  const lidX = size * 0.5 - lidWidth * 0.5;
  const lidY = size * 0.22;
  const bodyTopY = lidY + lidHeight * 0.8;
  const bodyBottomY = bodyTopY + cupHeight;
  const bodyLeftX = size * 0.5 - cupTopWidth * 0.5;
  const bodyRightX = size * 0.5 + cupTopWidth * 0.5;
  const bodyBottomLeftX = size * 0.5 - cupBottomWidth * 0.5;
  const bodyBottomRightX = size * 0.5 + cupBottomWidth * 0.5;
  const bodyInset = size * 0.08;
  const sleeveInset = size * 0.11;
  const steamBaseY = lidY - size * 0.06;
  const steamWobble = Math.sin(pulse * Math.PI) * size * 0.012;

  ctx.save();
  ctx.strokeStyle = '#34131f';
  ctx.lineWidth = Math.max(1.25, size * 0.045);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(lidX, lidY + lidHeight * 0.2);
  ctx.lineTo(lidX + lidWidth, lidY + lidHeight * 0.2);
  ctx.lineTo(lidX + lidWidth * 0.92, lidY + lidHeight);
  ctx.lineTo(lidX + lidWidth * 0.08, lidY + lidHeight);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 248, 238, 0.98)';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bodyLeftX, bodyTopY);
  ctx.lineTo(bodyRightX, bodyTopY);
  ctx.lineTo(bodyBottomRightX, bodyBottomY);
  ctx.lineTo(bodyBottomLeftX, bodyBottomY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 244, 228, 0.96)';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bodyLeftX + sleeveInset + bodyInset * 0.18, bodyTopY + cupHeight * 0.2);
  ctx.lineTo(bodyRightX - sleeveInset - bodyInset * 0.18, bodyTopY + cupHeight * 0.2);
  ctx.lineTo(bodyRightX - sleeveInset * 1.18, bodyBottomY - cupHeight * 0.18);
  ctx.lineTo(bodyLeftX + sleeveInset * 1.18, bodyBottomY - cupHeight * 0.18);
  ctx.closePath();
  ctx.fillStyle = 'rgba(212, 164, 96, 0.9)';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.5 - size * 0.06, bodyTopY + cupHeight * 0.38);
  ctx.lineTo(size * 0.5 + size * 0.06, bodyTopY + cupHeight * 0.38);
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.strokeStyle = 'rgba(109, 73, 36, 0.82)';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(88, 44, 29, 0.88)';
  ctx.lineWidth = Math.max(1.05, size * 0.035);
  ctx.beginPath();
  ctx.moveTo(lidX + lidWidth * 0.16, lidY + lidHeight * 0.1);
  ctx.lineTo(lidX + lidWidth * 0.84, lidY + lidHeight * 0.1);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(88, 44, 29, 0.9)';
  ctx.lineWidth = Math.max(1.05, size * 0.034);

  for (let index = 0; index < 2; index += 1) {
    const offsetX = size * (0.43 + index * 0.12);
    const sway = (index === 0 ? -1 : 1) * size * 0.012;

    ctx.beginPath();
    ctx.moveTo(offsetX, steamBaseY + size * 0.1);
    ctx.quadraticCurveTo(
      offsetX - size * 0.03 + steamWobble + sway,
      steamBaseY + size * 0.045,
      offsetX + steamWobble * 0.4,
      steamBaseY - size * 0.02,
    );
    ctx.quadraticCurveTo(
      offsetX + size * 0.03 - steamWobble - sway,
      steamBaseY - size * 0.075,
      offsetX,
      steamBaseY - size * 0.12,
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawCatFace(
  ctx: CanvasRenderingContext2D,
  size: number,
): void {
  const earHeight = size * 0.22;
  const whiskerY = size * 0.56;

  ctx.save();
  ctx.fillStyle = 'rgba(140, 255, 218, 0.98)';

  ctx.beginPath();
  ctx.moveTo(size * 0.18, size * 0.16);
  ctx.lineTo(size * 0.31, -earHeight * 0.2);
  ctx.lineTo(size * 0.41, size * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.59, size * 0.2);
  ctx.lineTo(size * 0.69, -earHeight * 0.2);
  ctx.lineTo(size * 0.82, size * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 187, 214, 0.88)';
  ctx.beginPath();
  ctx.moveTo(size * 0.25, size * 0.18);
  ctx.lineTo(size * 0.31, size * 0.03);
  ctx.lineTo(size * 0.37, size * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.63, size * 0.2);
  ctx.lineTo(size * 0.69, size * 0.03);
  ctx.lineTo(size * 0.75, size * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#140f1c';
  ctx.beginPath();
  ctx.arc(size * 0.34, size * 0.4, 1.8, 0, Math.PI * 2);
  ctx.arc(size * 0.66, size * 0.4, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 188, 208, 0.94)';
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.5);
  ctx.lineTo(size * 0.45, size * 0.56);
  ctx.lineTo(size * 0.55, size * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#140f1c';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(size * 0.47, size * 0.59);
  ctx.quadraticCurveTo(size * 0.5, size * 0.63, size * 0.53, size * 0.59);
  ctx.moveTo(size * 0.18, whiskerY);
  ctx.lineTo(size * 0.39, whiskerY - size * 0.04);
  ctx.moveTo(size * 0.18, whiskerY + size * 0.08);
  ctx.lineTo(size * 0.39, whiskerY + size * 0.03);
  ctx.moveTo(size * 0.61, whiskerY - size * 0.04);
  ctx.lineTo(size * 0.82, whiskerY);
  ctx.moveTo(size * 0.61, whiskerY + size * 0.03);
  ctx.lineTo(size * 0.82, whiskerY + size * 0.08);
  ctx.stroke();
  ctx.restore();
}

function renderFood(
  ctx: CanvasRenderingContext2D,
  food: Point,
  cellSize: number,
  now: number,
): void {
  const pulse = 0.4 + (Math.sin(now * 0.012) + 1) * 0.3;
  const x = food.x * cellSize;
  const y = food.y * cellSize;
  const size = cellSize - 6;

  ctx.save();
  ctx.translate(x + 3, y + 3);
  ctx.shadowBlur = 28;
  ctx.shadowColor = 'rgba(255, 84, 147, 0.9)';
  ctx.fillStyle = `rgba(255, 222, 87, ${0.75 + pulse * 0.2})`;
  drawRoundedCell(ctx, 0, 0, size, 8);
  ctx.fill();
  drawCoffeeGlyph(ctx, size, pulse);
  ctx.restore();
}

function renderSnake(
  ctx: CanvasRenderingContext2D,
  snake: readonly Point[],
  cellSize: number,
  now: number,
): void {
  snake.forEach((segment, index) => {
    const x = segment.x * cellSize + 4;
    const y = segment.y * cellSize + 4;
    const size = cellSize - 8;
    const lightness = 76 - index * 2.5;
    const hue = 184 + Math.sin(now * 0.003 + index * 0.35) * 34;

    ctx.save();
    ctx.translate(x, y);
    ctx.shadowBlur = index === 0 ? 18 : 0;
    ctx.shadowColor = 'rgba(117, 255, 206, 0.55)';
    ctx.fillStyle = `hsl(${hue}, 96%, ${Math.max(lightness, 42)}%)`;
    drawRoundedCell(ctx, 0, 0, size, 8);
    ctx.fill();

    if (index === 0) {
      drawCatFace(ctx, size);
    }

    ctx.restore();
  });
}

function renderBursts(
  ctx: CanvasRenderingContext2D,
  bursts: readonly BurstCluster[],
  now: number,
): void {
  for (const cluster of bursts) {
    const elapsed = now - cluster.bornAt;
    const progress = Math.min(elapsed / cluster.durationMs, 1);
    const energy = 1 - progress;

    if (energy <= 0) {
      continue;
    }

    const { from, to, mix } = interpolateBurstFrames(cluster.keyframes, progress);
    const width = from.width + (to.width - from.width) * mix;
    const blockHeight =
      from.blockHeight + (to.blockHeight - from.blockHeight) * mix;
    const fade = Math.max(0.24, energy);
    const isPrimaryCluster = cluster.id % 3 === 0;

    ctx.save();
    ctx.translate(cluster.x, cluster.y);
    ctx.rotate(cluster.rotation * (0.7 + fade * 0.45));
    ctx.scale(1 + fade * 0.2, 1 + fade * 0.12);

    const glow = ctx.createLinearGradient(-width * 0.75, -blockHeight * 0.2, width * 0.75, blockHeight * 1.1);
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.06 + fade * 0.16})`);
    glow.addColorStop(0.35, `rgba(255, 120, 68, ${0.12 + fade * 0.22})`);
    glow.addColorStop(0.65, `rgba(255, 98, 188, ${0.08 + fade * 0.18})`);
    glow.addColorStop(1, `rgba(84, 232, 201, ${0.08 + fade * 0.16})`);
    ctx.fillStyle = glow;
    ctx.fillRect(-width * 0.72, -blockHeight * 0.72, width * 1.44, blockHeight * 1.42);

    ctx.font = BURST_FONT;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.shadowBlur = isPrimaryCluster ? 20 + fade * 18 : 10 + fade * 8;

    const renderFrame = (frame: BurstKeyframe, alpha: number): void => {
      if (alpha <= 0.01) {
        return;
      }

      ctx.save();
      ctx.globalAlpha *= alpha;

      for (let lineIndex = 0; lineIndex < frame.lines.length; lineIndex += 1) {
        const line = frame.lines[lineIndex]!;
        const y = -blockHeight * 0.48 + line.y + cluster.lineHeight * 0.82;
        const x =
          -line.width *
          (0.48 + Math.sin(progress * 7 + lineIndex * 0.7) * BURST_SWAY);
        ctx.fillStyle = choosePaletteColor(cluster.phrase.palette, progress, lineIndex);
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillText(line.text, x, y);

        if (isPrimaryCluster || lineIndex === 0) {
          ctx.fillText(line.text, x + fade * BURST_ECHO_OFFSET, y - fade * 2.5);
        }
      }

      ctx.restore();
    };

    renderFrame(from, 1 - mix);
    renderFrame(to, mix);

    ctx.restore();
  }
}

function resolveBackgroundLayout(
  words: BackgroundWord[],
  snakeRects: readonly Rect[],
  width: number,
  height: number,
  now: number,
): void {
  for (const word of words) {
    let targetX = word.anchorX + Math.sin(now * 0.00055 + word.drift) * 10;
    let targetY = word.anchorY + Math.cos(now * 0.00042 + word.drift) * 6;
    const centerX = targetX + word.width * 0.5;
    const centerY = targetY - word.height * 0.5;

    for (const rect of snakeRects) {
      const nearestX = Math.max(rect.x, Math.min(centerX, rect.x + rect.width));
      const nearestY = Math.max(rect.y, Math.min(centerY, rect.y + rect.height));
      const dx = centerX - nearestX;
      const dy = centerY - nearestY;
      const distance = Math.hypot(dx, dy) || 0.001;

      if (distance < word.avoidSnakeRadius) {
        const push = (word.avoidSnakeRadius - distance) * 0.85;
        targetX += (dx / distance) * push;
        targetY += (dy / distance) * push;
      }
    }

    word.x += (targetX - word.x) * 0.16;
    word.y += (targetY - word.y) * 0.16;

    for (let pushAttempt = 0; pushAttempt < 4; pushAttempt += 1) {
      const collision = snakeRects.find((rect) => rectsIntersect(createWordRect(word), rect));

      if (!collision) {
        break;
      }

      pushWordOutsideRect(word, collision);
    }
  }

  const sorted = [...words].sort((a, b) => a.y - b.y || a.x - b.x);

  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < sorted.length; index += 1) {
      const word = sorted[index]!;

      for (let otherIndex = index + 1; otherIndex < sorted.length; otherIndex += 1) {
        const other = sorted[otherIndex]!;

        if (other.y - word.y > Math.max(word.height, other.height) + 18) {
          break;
        }

        const dx = other.x - word.x;
        const dy = other.y - word.y;
        const overlapX = word.width * 0.5 + other.width * 0.5 + 10 - Math.abs(dx);
        const overlapY = word.height * 0.5 + other.height * 0.5 + 6 - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (Math.abs(dx) > Math.abs(dy)) {
            const pushX = overlapX * 0.08 * Math.sign(dx || 1);
            word.x -= pushX;
            other.x += pushX;
          } else {
            const pushY = overlapY * 0.12 * Math.sign(dy || 1);
            word.y -= pushY;
            other.y += pushY;
          }
        }
      }

      word.x = Math.max(10, Math.min(width - word.width - 10, word.x));
      word.y = Math.max(word.height + 12, Math.min(height - 8, word.y));

      for (let pushAttempt = 0; pushAttempt < 3; pushAttempt += 1) {
        const collision = snakeRects.find((rect) => rectsIntersect(createWordRect(word), rect));

        if (!collision) {
          break;
        }

        pushWordOutsideRect(word, collision);
        word.x = Math.max(10, Math.min(width - word.width - 10, word.x));
        word.y = Math.max(word.height + 12, Math.min(height - 8, word.y));
      }
    }
  }
}

function createGameState(
  width: number,
  height: number,
  random: () => number,
): GameState {
  const viewportScale = computeViewportScale(width, height);
  const cellSize = Math.max(
    14,
    Math.floor(
      Math.min(width / playfieldConfig.columns, height / playfieldConfig.rows) *
        viewportScale,
    ),
  );
  const cols = Math.max(12, Math.floor(width / cellSize));
  const rows = Math.max(10, Math.floor(height / cellSize));
  const snake = createInitialSnake(cols, rows);

  return {
    cols,
    rows,
    cellSize,
    viewportScale,
    paused: false,
    pauseStartedAt: 0,
    pausedDuration: 0,
    snake,
    direction: DIRECTIONS.right,
    queuedDirection: DIRECTIONS.right,
    growth: 0,
    food: pickFreeCell(cols, rows, snake, random),
    score: snake.length,
    lastStepAt: 0,
    lockUntil: 0,
    words: createBackgroundWords(width, height, random, viewportScale),
    bursts: [],
    shimmerUntil: 0,
    shimmerOrigin: null,
    gameOverAt: 0,
    gameOverOrigin: null,
    over: false,
    burstId: 1,
  };
}

function stepSnake(
  state: GameState,
  random: () => number,
  preparedPhrases: readonly PreparedPhrase[],
  now: number,
): void {
  if (state.over) {
    return;
  }

  if (!isReverse(state.queuedDirection, state.direction)) {
    state.direction = state.queuedDirection;
  }

  const nextHead = {
    x: state.snake[0]!.x + state.direction.x,
    y: state.snake[0]!.y + state.direction.y,
  };

  if (
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.cols ||
    nextHead.y >= state.rows ||
    state.snake.some((segment) => samePoint(segment, nextHead))
  ) {
    state.over = true;
    state.gameOverAt = now;
    state.gameOverOrigin = nextHead;
    return;
  }

  state.snake.unshift(nextHead);

  if (samePoint(nextHead, state.food)) {
    state.growth += 2;
    state.score = state.snake.length;
    state.lockUntil = now + playfieldConfig.burstLockMs;
    state.shimmerUntil = now + 1150;
    state.shimmerOrigin = nextHead;
    state.bursts.push(
      ...createBurstClusters(
        nextHead,
        state.cellSize,
        preparedPhrases,
        random,
        state.burstId,
        now,
      ),
    );
    state.burstId += 6;
    state.food = pickFreeCell(state.cols, state.rows, state.snake, random);
  }

  if (state.growth > 0) {
    state.growth -= 1;
  } else {
    state.snake.pop();
  }

  state.score = state.snake.length;
  state.bursts = state.bursts.filter(
    (cluster) => now - cluster.bornAt < cluster.durationMs,
  );
}

export function mountSnakeExperience(): void {
  const root = document.querySelector<HTMLElement>('[data-experience-root]');

  if (!root || root.dataset.ready === 'true') {
    return;
  }

  root.dataset.ready = 'true';

  const canvas = root.querySelector<HTMLCanvasElement>('[data-experience-canvas]');
  const status = root.querySelector<HTMLElement>('[data-experience-status]');
  const score = document.querySelector<HTMLElement>('[data-experience-score]');

  if (!canvas || !status || !score) {
    return;
  }

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    status.textContent = 'Canvas is unavailable in this browser.';
    return;
  }

  const random = createRandom(240330);
  let animationFrame = 0;
  let preparedPhrases: PreparedPhrase[] = [];
  let state = createGameState(root.clientWidth, root.clientHeight, random);

  const syncCanvas = (): void => {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(root.clientWidth, 320);
    const height = Math.max(root.clientHeight, 320);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    state = createGameState(width, height, random);
    root.style.setProperty('--experience-scale', state.viewportScale.toFixed(3));
    status.textContent = 'Arrow keys move. Collect the lit word.';
    score.textContent = `length ${state.score}`;
  };

  const render = (now: number): void => {
    const worldNow = state.paused
      ? state.pauseStartedAt - state.pausedDuration
      : now - state.pausedDuration;

    if (state.lastStepAt === 0) {
      state.lastStepAt = worldNow;
    }

    if (!state.over && !state.paused && worldNow >= state.lockUntil) {
      while (worldNow - state.lastStepAt >= STEP_MS) {
        stepSnake(state, random, preparedPhrases, worldNow);
        state.lastStepAt += STEP_MS;
      }
    }

    renderBackground(
      ctx,
      root.clientWidth,
      root.clientHeight,
      state.words,
      worldNow,
      state.shimmerUntil,
      state.shimmerOrigin,
      state.cellSize,
      state.snake,
      state.gameOverAt,
      state.gameOverOrigin,
    );
    renderFood(ctx, state.food, state.cellSize, worldNow);
    renderSnake(ctx, state.snake, state.cellSize, worldNow);
    renderBursts(ctx, state.bursts, worldNow);
    score.textContent = `length ${state.score}`;

    if (state.over) {
      status.textContent = 'Collision detected.';
    } else if (state.paused) {
      status.textContent = state.paused ? 'Paused.' : 'Arrow keys move. Collect the lit word.';
    } else if (worldNow < state.lockUntil) {
      const activeBursts = state.bursts.length;
      status.textContent = `reflow burst x${activeBursts}`;
    } else {
      status.textContent = 'Arrow keys move. Collect the lit word.';
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (state.over) {
        syncCanvas();
        return;
      }

      state.paused = !state.paused;

      if (state.paused) {
        state.pauseStartedAt = performance.now();
      } else if (state.pauseStartedAt > 0) {
        state.pausedDuration += performance.now() - state.pauseStartedAt;
        state.pauseStartedAt = 0;
      }

      status.textContent = state.paused ? 'Paused.' : 'Arrow keys move. Collect the lit word.';
      return;
    }

    const nextDirection =
      event.key === 'ArrowUp'
        ? DIRECTIONS.up
        : event.key === 'ArrowDown'
          ? DIRECTIONS.down
          : event.key === 'ArrowLeft'
            ? DIRECTIONS.left
            : event.key === 'ArrowRight'
              ? DIRECTIONS.right
              : null;

    if (!nextDirection || state.paused) {
      return;
    }

    event.preventDefault();

    if (!sameDirection(nextDirection, state.direction) && !isReverse(nextDirection, state.direction)) {
      state.queuedDirection = nextDirection;
    }
  };

  const handleResize = (): void => {
    syncCanvas();
  };

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);

  const start = async (): Promise<void> => {
    if ('fonts' in document) {
      await document.fonts.ready;
    }

    preparedPhrases = createPreparedPhrases();
    syncCanvas();
    animationFrame = window.requestAnimationFrame(render);
  };

  void start();

  window.addEventListener(
    'pagehide',
    () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', handleResize);
    },
    { once: true },
  );
}
