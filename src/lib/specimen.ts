import {
  TextField,
  buildFieldText,
  loadFieldFonts,
  measureObstacles,
  runWhileVisible,
  type FieldObstacle,
} from './text-field';

const MIN_STRETCH = 50;
const MAX_STRETCH = 150;
const CONDENSED_STRETCH = 78;
const REST_AFTER_POINTER_MS = 2400;
// Below this the lens is too small to read as a circle, and a phone's field stands still.
const MIN_LANE_RADIUS = 24;
const CREMA = '#ffc457';

function measureLineWidth(line: HTMLElement, stretch: number): number {
  line.style.setProperty('font-stretch', `${stretch}%`);
  return line.getBoundingClientRect().width;
}

/**
 * Sets every `[data-fit-line]` in a block to the same width, the way a specimen sets a
 * justified display block: the longest line is condensed to fix the size, then each
 * shorter line is widened on the font's width axis until its edges meet the block.
 */
export function fitSpecimenBlock(
  block: HTMLElement,
  maxFontSize = Infinity,
  probeStretch = CONDENSED_STRETCH,
): void {
  const lines = [...block.querySelectorAll<HTMLElement>('[data-fit-line]')];
  const target = block.clientWidth;

  if (lines.length === 0 || target === 0) {
    return;
  }

  const probeSize = 100;

  for (const line of lines) {
    line.style.fontSize = `${probeSize}px`;
    line.style.letterSpacing = '0px';
    line.style.marginRight = '0px';
  }

  const longest = Math.max(...lines.map((line) => measureLineWidth(line, probeStretch)));
  const fontSize = Math.min(maxFontSize, (probeSize * target) / longest);
  block.style.setProperty('--fit-size', `${fontSize.toFixed(2)}px`);

  for (const line of lines) {
    line.style.fontSize = `${fontSize}px`;
    let low = MIN_STRETCH;
    let high = MAX_STRETCH;

    for (let step = 0; step < 9; step += 1) {
      const middle = (low + high) / 2;

      if (measureLineWidth(line, middle) > target) {
        high = middle;
      } else {
        low = middle;
      }
    }

    const width = measureLineWidth(line, low);
    const letters = Math.max(1, [...(line.textContent ?? '')].length - 1);
    const gap = target - width;

    // Tracking also lands after the last letter; pull it back so the ink meets the edge.
    if (gap > 1) {
      const tracking = gap / letters;
      line.style.letterSpacing = `${tracking.toFixed(2)}px`;
      line.style.marginRight = `${(-tracking).toFixed(2)}px`;
    }
  }
}

export async function mountSpecimen(root: HTMLElement): Promise<void> {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-field-canvas]');
  const fitBlocks = [...document.querySelectorAll<HTMLElement>('[data-fit-block]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  await loadFieldFonts();

  const fitAll = () => {
    for (const block of fitBlocks) {
      fitSpecimenBlock(
        block,
        Number(block.dataset.fitMax) || Infinity,
        Number(block.dataset.fitStretch) || CONDENSED_STRETCH,
      );
    }
  };

  fitAll();
  document.documentElement.dataset.fitted = 'true';

  if (!canvas) {
    window.addEventListener('resize', fitAll);
    return;
  }

  const compact = window.matchMedia('(max-width: 720px)').matches;
  const lineHeight = compact ? 20 : 23;
  const clearance = compact ? 8 : 14;
  const field = new TextField(canvas, {
    text: buildFieldText(11),
    fontSize: compact ? 13 : 15,
    lineHeight,
    clearance,
    minSpan: 44,
    inset: compact ? 12 : 20,
    restAlpha: 0.2,
  });

  let blocks: FieldObstacle[] = [];
  const pointer = { x: 0, y: 0, at: -Infinity };
  const lensRadius = compact ? 64 : 104;
  const lens = { x: 0, y: 0, radius: lensRadius };
  // On a phone the name leaves the words only a strip under the top bar. The lens is sized
  // to that strip and drifts inside it, so it is always seen whole instead of sinking
  // behind the name, where there are no words for it to push aside.
  let lane: { left: number; top: number; width: number; height: number } | null = null;
  let dirty = true;

  const measure = () => {
    field.resize();
    blocks = measureObstacles(canvas, document.querySelectorAll('[data-field-obstacle~="hero"]'));
    dirty = true;

    if (!compact) {
      return;
    }

    // With so few words per line, a reflow of the whole field reads as flicker. Pinned,
    // only the lines the lens crosses move.
    field.anchor(blocks);
    const band = field.openBand(blocks);
    const radius = band ? Math.min(lensRadius, (band.bottom - band.top - lineHeight) / 2 - clearance) : 0;

    if (!band || radius < MIN_LANE_RADIUS) {
      lane = null;
      lens.radius = lensRadius;
      return;
    }

    const reach = radius + clearance;
    lens.radius = radius;
    lane = {
      left: reach,
      top: band.top + reach,
      width: Math.max(0, field.width - reach * 2),
      height: Math.max(0, band.bottom - band.top - reach * 2),
    };
  };

  const drift = (now: number) =>
    lane
      ? {
          x: lane.left + lane.width * (0.5 + 0.5 * Math.sin(now * 0.00019)),
          y: lane.top + lane.height * (0.5 + 0.5 * Math.sin(now * 0.00031 + 1.3)),
        }
      : {
          x: field.width * (0.58 + 0.26 * Math.sin(now * 0.00019)),
          y: field.height * (0.34 + 0.2 * Math.sin(now * 0.00031 + 1.3)),
        };

  const ctx = canvas.getContext('2d');
  const paint = () => {
    // A phone too short to leave the lens a strip of its own keeps its words still.
    if (compact && !lane) {
      field.render(blocks, null);
      return;
    }

    field.render([...blocks, { kind: 'circle', ...lens }], lens);

    // A handful of words a line cannot trace a circle on their own, so on a phone its
    // edge is drawn: a crema ring the words make way for.
    if (compact && ctx) {
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, lens.radius, 0, Math.PI * 2);
      ctx.strokeStyle = CREMA;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // On a phone the lens stays in its strip even where a mouse steers it.
  const steer = (point: { x: number; y: number }) =>
    lane
      ? {
          x: Math.min(lane.left + lane.width, Math.max(lane.left, point.x)),
          y: Math.min(lane.top + lane.height, Math.max(lane.top, point.y)),
        }
      : point;

  measure();
  const start = drift(performance.now());
  lens.x = start.x;
  lens.y = start.y;

  if (reduceMotion.matches) {
    field.render(blocks, null);
    window.addEventListener('resize', () => {
      fitAll();
      measure();
      field.render(blocks, null);
    });
    return;
  }

  root.addEventListener('pointermove', (event) => {
    // A finger here is scrolling the page, not steering. Followed, it would tug the lens
    // to where each scroll began and let it spring back, reflowing the words both times.
    if (event.pointerType === 'touch') {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.at = performance.now();
  });

  root.addEventListener('pointerleave', () => {
    pointer.at = -Infinity;
  });

  new ResizeObserver(() => {
    fitAll();
    measure();
    // Resizing the canvas has just cleared it. Paint now, before the browser does, or the
    // field blinks out for a frame.
    paint();
  }).observe(root);

  runWhileVisible(canvas, (now) => {
    if (compact && !lane) {
      if (dirty) {
        dirty = false;
        paint();
      }

      return;
    }

    const target = now - pointer.at < REST_AFTER_POINTER_MS ? steer(pointer) : drift(now);
    const dx = target.x - lens.x;
    const dy = target.y - lens.y;

    if (!dirty && Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
      return;
    }

    lens.x += dx * 0.14;
    lens.y += dy * 0.14;
    dirty = false;

    paint();
  });
}
