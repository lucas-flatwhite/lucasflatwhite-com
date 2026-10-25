import { TextField, buildFieldText, loadFieldFonts, measureObstacles } from './text-field';

const MIN_STRETCH = 50;
const MAX_STRETCH = 150;
const CONDENSED_STRETCH = 78;

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
  const field = new TextField(canvas, {
    text: buildFieldText(11),
    fontSize: compact ? 13 : 15,
    lineHeight: compact ? 20 : 23,
    clearance: compact ? 8 : 14,
    minSpan: 44,
    inset: compact ? 12 : 20,
    restAlpha: 0.2,
  });

  // The words stand still: they are laid out around the name and the links once, and again
  // only when the page changes size.
  const paint = () => {
    field.resize();
    const elements = document.querySelectorAll('[data-field-obstacle~="hero"]');
    field.render(measureObstacles(canvas, elements));
  };

  paint();

  new ResizeObserver(() => {
    fitAll();
    // Resizing the canvas has just cleared it. Paint now, before the browser does, or the
    // field blinks out for a frame.
    paint();
  }).observe(root);
}
