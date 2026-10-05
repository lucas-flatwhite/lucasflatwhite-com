import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import { backgroundWordPool, burstPhrasePoolEn, burstPhrasePoolKo } from '../data/site';

export type FieldObstacle =
  | { kind: 'rect'; x: number; y: number; width: number; height: number }
  | { kind: 'circle'; x: number; y: number; radius: number };

/** A crema ring that lights the words nearest the moving obstacle. */
export type FieldGlow = { x: number; y: number; radius: number };

export type TextFieldOptions = {
  text: string;
  fontSize: number;
  lineHeight: number;
  /** Clearance kept between text and every obstacle. */
  clearance: number;
  /** Spans narrower than this stay empty instead of breaking words apart. */
  minSpan: number;
  inset: number;
  /** Opacity of words far from the glow. */
  restAlpha: number;
};

type Span = [left: number, right: number];

const FONT_FAMILY = '"Anybody Variable", "Noto Sans KR Variable", system-ui, sans-serif';
const FOAM = '242, 243, 247';
const CREMA = '255, 196, 87';
const MAX_DEVICE_PIXEL_RATIO = 2;
const ZERO_CURSOR: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

export const FIELD_FONT_SAMPLES = [
  `400 16px "Anybody Variable"`,
  `400 16px "Noto Sans KR Variable"`,
] as const;

/** Resolves once both faces the canvas draws with are ready, so pretext measures real glyphs. */
export async function loadFieldFonts(): Promise<void> {
  if (!('fonts' in document)) {
    return;
  }

  await Promise.allSettled([
    document.fonts.load(FIELD_FONT_SAMPLES[0], 'Lucas'),
    document.fonts.load(FIELD_FONT_SAMPLES[1], '배포 로드맵'),
  ]);
}

function createRandom(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/**
 * One long run of the game's vocabulary: mostly English, with Korean words and the
 * burst phrases woven in, so the landing and the game read as the same field.
 */
export function buildFieldText(seed = 7): string {
  const random = createRandom(seed);
  const words = [...backgroundWordPool];
  const phrases = [...burstPhrasePoolEn, ...burstPhrasePoolKo].map((phrase) => phrase.text);

  for (let index = words.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [words[index], words[swap]] = [words[swap], words[index]];
  }

  const out: string[] = [];
  let phraseIndex = 0;

  words.forEach((word, index) => {
    out.push(word);

    if (index % 17 === 16) {
      out.push(phrases[phraseIndex % phrases.length]);
      phraseIndex += 1;
    }
  });

  return out.join(' ');
}

function blockedSpan(
  obstacle: FieldObstacle,
  top: number,
  bottom: number,
  clearance: number,
): Span | null {
  if (obstacle.kind === 'rect') {
    if (obstacle.y - clearance >= bottom || obstacle.y + obstacle.height + clearance <= top) {
      return null;
    }

    return [obstacle.x - clearance, obstacle.x + obstacle.width + clearance];
  }

  const radius = obstacle.radius + clearance;
  const dy = obstacle.y < top ? top - obstacle.y : obstacle.y > bottom ? obstacle.y - bottom : 0;

  if (dy >= radius) {
    return null;
  }

  const half = Math.sqrt(radius * radius - dy * dy);
  return [obstacle.x - half, obstacle.x + half];
}

/** The free stretches of one text line after every obstacle has taken its share. */
export function freeSpans(
  top: number,
  bottom: number,
  left: number,
  right: number,
  obstacles: readonly FieldObstacle[],
  clearance: number,
): Span[] {
  let spans: Span[] = [[left, right]];

  for (const obstacle of obstacles) {
    const blocked = blockedSpan(obstacle, top, bottom, clearance);

    if (!blocked) {
      continue;
    }

    const [blockLeft, blockRight] = blocked;
    const next: Span[] = [];

    for (const [spanLeft, spanRight] of spans) {
      if (blockRight <= spanLeft || blockLeft >= spanRight) {
        next.push([spanLeft, spanRight]);
        continue;
      }

      if (blockLeft > spanLeft) {
        next.push([spanLeft, blockLeft]);
      }

      if (blockRight < spanRight) {
        next.push([blockRight, spanRight]);
      }
    }

    spans = next;
  }

  return spans;
}

export class TextField {
  readonly canvas: HTMLCanvasElement;
  width = 0;
  height = 0;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly options: TextFieldOptions;
  private readonly font: string;
  private readonly prepared: PreparedTextWithSegments;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement, options: TextFieldOptions) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.options = options;
    this.font = `400 ${options.fontSize}px ${FONT_FAMILY}`;
    // keep-all stops Hangul words from splitting between syllables, like `word-break: keep-all`.
    this.prepared = prepareWithSegments(options.text, this.font, { wordBreak: 'keep-all' });
  }

  /** Matches the backing store to the element's box. Returns true when the size changed. */
  resize(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (width === this.width && height === this.height && dpr === this.dpr) {
      return false;
    }

    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    return true;
  }

  private fillFor(glow: FieldGlow | null): string | CanvasGradient {
    const rest = `rgba(${FOAM}, ${this.options.restAlpha})`;

    if (!glow) {
      return rest;
    }

    const reach = glow.radius * 3.4;
    const gradient = this.ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, reach);
    const edge = glow.radius / reach;
    gradient.addColorStop(0, `rgba(${CREMA}, 1)`);
    gradient.addColorStop(edge, `rgba(${CREMA}, 0.95)`);
    gradient.addColorStop(Math.min(1, edge * 1.55), `rgba(${FOAM}, 0.82)`);
    gradient.addColorStop(1, rest);
    return gradient;
  }

  render(obstacles: readonly FieldObstacle[], glow: FieldGlow | null): void {
    const { ctx, options, width, height } = this;
    const { lineHeight, inset, minSpan, clearance, fontSize } = options;
    const baseline = Math.round((lineHeight + fontSize * 0.72) / 2);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = this.font;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = this.fillFor(glow);

    let cursor = ZERO_CURSOR;

    for (let top = inset; top + lineHeight <= height - inset * 0.5; top += lineHeight) {
      const spans = freeSpans(top, top + lineHeight, inset, width - inset, obstacles, clearance);

      for (const [left, right] of spans) {
        const spanWidth = right - left;

        if (spanWidth < minSpan) {
          continue;
        }

        let line = layoutNextLine(this.prepared, cursor, spanWidth);

        if (!line) {
          cursor = ZERO_CURSOR;
          line = layoutNextLine(this.prepared, cursor, spanWidth);
        }

        // A line that ends inside a word means the span was too narrow for it; leave the gap.
        if (!line || line.end.graphemeIndex !== 0) {
          continue;
        }

        ctx.fillText(line.text, left, top + baseline);
        cursor = line.end;
      }
    }
  }
}

/** Element boxes in the canvas's coordinate space, ready to use as obstacles. */
export function measureObstacles(
  canvas: HTMLCanvasElement,
  elements: Iterable<Element>,
): FieldObstacle[] {
  const origin = canvas.getBoundingClientRect();
  const obstacles: FieldObstacle[] = [];

  for (const element of elements) {
    const rect = element.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      continue;
    }

    obstacles.push({
      kind: 'rect',
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    });
  }

  return obstacles;
}

/**
 * Runs `frame` on animation frames only while the canvas is on screen and the tab is
 * visible. Returns a stop function.
 */
export function runWhileVisible(
  canvas: HTMLCanvasElement,
  frame: (now: number) => void,
): () => void {
  let onScreen = false;
  let handle = 0;

  const tick = (now: number) => {
    handle = 0;

    if (!onScreen || document.hidden) {
      return;
    }

    frame(now);
    handle = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!handle && onScreen && !document.hidden) {
      handle = requestAnimationFrame(tick);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    wake();
  });

  observer.observe(canvas);
  document.addEventListener('visibilitychange', wake);

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', wake);

    if (handle) {
      cancelAnimationFrame(handle);
    }
  };
}
