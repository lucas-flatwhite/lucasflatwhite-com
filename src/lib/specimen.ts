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

  const compact = window.matchMedia('(max-width: 720px)');
  const field = new TextField(canvas, {
    text: buildFieldText(11),
    fontSize: compact.matches ? 13 : 15,
    lineHeight: compact.matches ? 20 : 23,
    clearance: compact.matches ? 8 : 14,
    minSpan: 44,
    inset: compact.matches ? 12 : 20,
    restAlpha: 0.2,
  });

  let blocks: FieldObstacle[] = [];
  const pointer = { x: 0, y: 0, at: -Infinity };
  const lens = { x: 0, y: 0, radius: compact.matches ? 64 : 104 };
  let dirty = true;

  const measure = () => {
    field.resize();
    blocks = measureObstacles(canvas, document.querySelectorAll('[data-field-obstacle~="hero"]'));
    dirty = true;
  };

  const drift = (now: number) => ({
    x: field.width * (0.58 + 0.26 * Math.sin(now * 0.00019)),
    y: field.height * (0.34 + 0.2 * Math.sin(now * 0.00031 + 1.3)),
  });

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
  }).observe(root);

  runWhileVisible(canvas, (now) => {
    const target = now - pointer.at < REST_AFTER_POINTER_MS ? pointer : drift(now);
    const dx = target.x - lens.x;
    const dy = target.y - lens.y;

    if (!dirty && Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
      return;
    }

    lens.x += dx * 0.14;
    lens.y += dy * 0.14;
    dirty = false;

    field.render([...blocks, { kind: 'circle', ...lens }], lens);
  });
}
