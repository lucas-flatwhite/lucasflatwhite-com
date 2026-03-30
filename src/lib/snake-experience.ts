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
  burstPhrasePoolEn,
  burstPhrasePoolKo,
  playfieldConfig,
} from '../data/site';
import type { BurstPhrase } from '../data/site';

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

type BurstPhraseSource = BurstPhrase;

type PreparedPhrase = BurstPhraseSource & {
  prepared: PreparedTextWithSegments;
  compactPrepared: PreparedText;
};

type PreparedPhraseGroups = {
  ko: PreparedPhrase[];
  en: PreparedPhrase[];
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

type SwipeState = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
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
const MOBILE_BACKGROUND_WORD_COUNT = 220;
const TABLET_BACKGROUND_WORD_COUNT = 520;
const FOOD_DOT_INSET = 4;
const SNAKE_DOT_INSET = 4;
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

function getSwipeDirection(
  dx: number,
  dy: number,
  threshold: number,
): Direction | null {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    return null;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? DIRECTIONS.right : DIRECTIONS.left;
  }

  return dy > 0 ? DIRECTIONS.down : DIRECTIONS.up;
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

function getBackgroundWordCount(width: number): number {
  if (width <= 720) {
    return MOBILE_BACKGROUND_WORD_COUNT;
  }

  if (width <= 1080) {
    return TABLET_BACKGROUND_WORD_COUNT;
  }

  return playfieldConfig.backgroundWordCount;
}

function createBackgroundWords(
  width: number,
  height: number,
  random: () => number,
  viewportScale: number,
): BackgroundWord[] {
  const words: BackgroundWord[] = [];
  const total = getBackgroundWordCount(width);
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

function createPreparedPhrases(): PreparedPhraseGroups {
  setLocale('ko');

  const prepareGroup = (phrases: readonly BurstPhraseSource[]): PreparedPhrase[] =>
    phrases.map((phrase) => ({
      ...phrase,
      prepared: prepareWithSegments(phrase.text, BURST_FONT),
      compactPrepared: prepare(phrase.text, BURST_FONT),
    }));

  return {
    ko: prepareGroup(burstPhrasePoolKo),
    en: prepareGroup(burstPhrasePoolEn),
  };
}

function drawDotCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.fillRect(x, y, size, size);
}

function drawTakeoutCupGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const centerX = x + size * 0.5;
  const topY = y + size * 0.18;
  const lidTop = topY;
  const lidBottom = y + size * 0.3;
  const cupTop = y + size * 0.32;
  const cupBottom = y + size * 0.8;
  const topWidth = size * 0.46;
  const bottomWidth = size * 0.28;
  const sleeveTop = y + size * 0.46;
  const sleeveBottom = y + size * 0.63;
  const sleeveWidth = size * 0.34;

  ctx.save();
  ctx.lineWidth = Math.max(1.2, size * 0.06);
  ctx.lineJoin = 'miter';
  ctx.strokeStyle = 'rgba(84, 42, 18, 0.95)';
  ctx.fillStyle = 'rgba(255, 248, 239, 0.96)';

  ctx.beginPath();
  ctx.moveTo(centerX - topWidth * 0.7, lidTop);
  ctx.lineTo(centerX + topWidth * 0.7, lidTop);
  ctx.lineTo(centerX + topWidth * 0.56, lidBottom);
  ctx.lineTo(centerX - topWidth * 0.56, lidBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - topWidth * 0.5, cupTop);
  ctx.lineTo(centerX + topWidth * 0.5, cupTop);
  ctx.lineTo(centerX + bottomWidth * 0.5, cupBottom);
  ctx.lineTo(centerX - bottomWidth * 0.5, cupBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(205, 150, 96, 0.95)';
  ctx.beginPath();
  ctx.moveTo(centerX - sleeveWidth * 0.5, sleeveTop);
  ctx.lineTo(centerX + sleeveWidth * 0.5, sleeveTop);
  ctx.lineTo(centerX + sleeveWidth * 0.36, sleeveBottom);
  ctx.lineTo(centerX - sleeveWidth * 0.36, sleeveBottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
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
  preparedPhrases: PreparedPhraseGroups,
  random: () => number,
  startId: number,
  now: number,
): BurstCluster[] {
  const originX = (origin.x + 0.5) * cellSize;
  const originY = (origin.y + 0.5) * cellSize;
  const count = 3 + Math.floor(random() * 4);
  const startWithEnglish = random() > 0.5;

  return Array.from({ length: count }, (_, index) => {
    const useEnglish = (index % 2 === 0) === startWithEnglish;
    const pool = useEnglish ? preparedPhrases.en : preparedPhrases.ko;
    const fallbackPool = useEnglish ? preparedPhrases.ko : preparedPhrases.en;
    const phrase =
      pool[Math.floor(random() * pool.length)] ??
      fallbackPool[Math.floor(random() * fallbackPool.length)] ??
      preparedPhrases.ko[0] ??
      preparedPhrases.en[0];
    const looseWidth = 340 + random() * 220 + phrase.intensity * 54;
    const tightWidth = findTightWidth(phrase.prepared, looseWidth);
    const laneOffset = index - (count - 1) / 2;
    const lateral = laneOffset * (136 + random() * 32);
    const vertical = (random() - 0.5) * 68 + ((index % 2) * 2 - 1) * 34;
    const lineHeight = BURST_LINE_HEIGHT + phrase.intensity * 2;
    const twist = random() * Math.PI * 2;

    return {
      id: startId + index,
      phrase,
      x: originX + lateral,
      y: originY + vertical,
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
): void {
  ctx.font = WORD_FONT.replace('15px', `${word.size}px`);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = `hsla(${word.hue % 360}, 96%, 72%, ${Math.min(0.96, word.alpha)})`;
  ctx.fillText(word.text, word.x, word.y);
}

function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  words: BackgroundWord[],
  now: number,
  cellSize: number,
  snake: readonly Point[],
  drawWords = true,
): void {
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#07040f');
  background.addColorStop(0.4, '#12071c');
  background.addColorStop(1, '#041c1e');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  if (!drawWords) {
    return;
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const snakeRects = createSnakeRects(snake, cellSize);
  resolveBackgroundLayout(words, snakeRects, width, height, now);

  for (const word of words) {
    if (intersectsSnakeBody(word, snakeRects)) {
      continue;
    }

    drawBackgroundWord(ctx, word);
  }

  ctx.shadowBlur = 0;
}

function renderGameOverOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  score: number,
): void {
  const scoreSize = Math.max(72, Math.floor(Math.min(width, height) * 0.25));
  const titleSize = Math.max(22, Math.floor(scoreSize * 0.18));
  const subtitleSize = Math.max(14, Math.floor(titleSize * 0.72));
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  const title = '퇴근';
  const subtitle = 'get off work';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(255, 244, 210, 0.96)';
  ctx.font = `700 ${scoreSize}px "Roboto Mono"`;
  ctx.fillText(String(score), centerX, centerY - titleSize * 0.75);

  ctx.fillStyle = 'rgba(255, 244, 210, 0.9)';
  ctx.font = `700 ${titleSize}px "Roboto Mono"`;
  ctx.fillText(title, centerX, centerY + scoreSize * 0.88);

  ctx.fillStyle = 'rgba(255, 244, 210, 0.62)';
  ctx.font = `500 ${subtitleSize}px "Roboto Mono"`;
  ctx.fillText(subtitle, centerX, centerY + scoreSize * 1.08);
  ctx.restore();
}

function renderFood(
  ctx: CanvasRenderingContext2D,
  food: Point,
  cellSize: number,
  now: number,
): void {
  const pulse = 0.4 + (Math.sin(now * 0.012) + 1) * 0.3;
  const pulseInset = Math.round((1 - pulse) * 2);
  const x = food.x * cellSize + FOOD_DOT_INSET + pulseInset;
  const y = food.y * cellSize + FOOD_DOT_INSET + pulseInset;
  const size = Math.max(6, cellSize - FOOD_DOT_INSET * 2 - pulseInset * 2);

  ctx.save();
  ctx.shadowBlur = 24;
  ctx.shadowColor = 'rgba(255, 84, 147, 0.9)';
  ctx.fillStyle = `rgba(255, 222, 87, ${0.75 + pulse * 0.2})`;
  drawDotCell(ctx, x, y, size);
  drawTakeoutCupGlyph(ctx, x, y, size);
  ctx.restore();
}

function renderSnake(
  ctx: CanvasRenderingContext2D,
  snake: readonly Point[],
  cellSize: number,
  now: number,
): void {
  snake.forEach((segment, index) => {
    const x = segment.x * cellSize + SNAKE_DOT_INSET;
    const y = segment.y * cellSize + SNAKE_DOT_INSET;
    const size = Math.max(6, cellSize - SNAKE_DOT_INSET * 2);
    const lightness = 76 - index * 2.5;
    const hue = 184 + Math.sin(now * 0.003 + index * 0.35) * 34;

    ctx.save();
    ctx.shadowBlur = index === 0 ? 18 : 0;
    ctx.shadowColor = 'rgba(117, 255, 206, 0.55)';
    ctx.fillStyle = `hsl(${hue}, 96%, ${Math.max(lightness, 42)}%)`;
    drawDotCell(ctx, x, y, size);
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
    gameOverAt: 0,
    gameOverOrigin: null,
    over: false,
    burstId: 1,
  };
}

function stepSnake(
  state: GameState,
  random: () => number,
  preparedPhrases: PreparedPhraseGroups,
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
  const score = document.querySelector<HTMLElement>('[data-experience-score]');

  if (!canvas || !score) {
    return;
  }

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  const random = createRandom(240330);
  let animationFrame = 0;
  let preparedPhrases: PreparedPhraseGroups = { ko: [], en: [] };
  let swipe: SwipeState | null = null;
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
    score.textContent = `length ${state.score}`;
    swipe = null;
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
      state.cellSize,
      state.snake,
      !state.over,
    );

    if (state.over) {
      renderSnake(ctx, state.snake, state.cellSize, worldNow);
      renderGameOverOverlay(
        ctx,
        root.clientWidth,
        root.clientHeight,
        state.score,
      );
      score.textContent = state.over ? '' : `length ${state.score}`;
      animationFrame = window.requestAnimationFrame(render);
      return;
    }

    renderFood(ctx, state.food, state.cellSize, worldNow);
    renderSnake(ctx, state.snake, state.cellSize, worldNow);
    renderBursts(ctx, state.bursts, worldNow);
    score.textContent = state.over ? '' : `length ${state.score}`;

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

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      return;
    }

    swipe = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    swipe.lastX = event.clientX;
    swipe.lastY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    const threshold = Math.max(18, Math.min(root.clientWidth, root.clientHeight) * 0.05);
    const restartOnTap = state.over && Math.hypot(dx, dy) < threshold * 0.65;

    if (restartOnTap) {
      syncCanvas();
      swipe = null;
      return;
    }

    if (state.over || state.paused) {
      swipe = null;
      return;
    }

    const nextDirection = getSwipeDirection(dx, dy, threshold);

    if (
      nextDirection &&
      !sameDirection(nextDirection, state.direction) &&
      !isReverse(nextDirection, state.direction)
    ) {
      state.queuedDirection = nextDirection;
    }

    swipe = null;
  };

  const handlePointerCancel = (): void => {
    swipe = null;
  };

  const handleResize = (): void => {
    syncCanvas();
  };

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  root.addEventListener('pointerdown', handlePointerDown);
  root.addEventListener('pointermove', handlePointerMove);
  root.addEventListener('pointerup', handlePointerUp);
  root.addEventListener('pointercancel', handlePointerCancel);

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
      root.removeEventListener('pointerdown', handlePointerDown);
      root.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerup', handlePointerUp);
      root.removeEventListener('pointercancel', handlePointerCancel);
    },
    { once: true },
  );
}
