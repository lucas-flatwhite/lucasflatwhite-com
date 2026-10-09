import {
  TextField,
  buildFieldText,
  loadFieldFonts,
  measureObstacles,
  runWhileVisible,
  type FieldObstacle,
} from './text-field';

type Cell = { col: number; row: number };

const CREMA = '#ffc457';
const STEP_MS = 120;
const SNAKE_LENGTH = 14;
const DIRECTIONS: readonly Cell[] = [
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
  { col: 0, row: -1 },
];

/**
 * A self-driving snake that wanders the band toward a crema pellet. The words part
 * around its body the same way they part around the cursor in the first viewport.
 */
export async function mountPlayBand(root: HTMLElement): Promise<void> {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-field-canvas]');

  if (!canvas) {
    return;
  }

  await loadFieldFonts();

  const compact = window.matchMedia('(max-width: 720px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cellSize = compact ? 16 : 22;
  const field = new TextField(canvas, {
    text: buildFieldText(29),
    fontSize: compact ? 13 : 15,
    lineHeight: compact ? 20 : 23,
    clearance: 6,
    minSpan: 40,
    inset: compact ? 12 : 20,
    restAlpha: 0.26,
  });
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  let cols = 0;
  let rows = 0;
  let blocks: FieldObstacle[] = [];
  let snake: Cell[] = [];
  let heading = DIRECTIONS[0];
  let food: Cell = { col: 0, row: 0 };
  let lastStep = 0;

  const blockedByCopy = (cell: Cell) => {
    const x = cell.col * cellSize;
    const y = cell.row * cellSize;

    return blocks.some(
      (block) =>
        block.kind === 'rect' &&
        x + cellSize > block.x - 8 &&
        x < block.x + block.width + 8 &&
        y + cellSize > block.y - 8 &&
        y < block.y + block.height + 8,
    );
  };

  const isFree = (cell: Cell) =>
    cell.col >= 0 &&
    cell.row >= 0 &&
    cell.col < cols &&
    cell.row < rows &&
    !snake.some((part) => part.col === cell.col && part.row === cell.row) &&
    !blockedByCopy(cell);

  const placeFood = () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const cell = {
        col: Math.floor(Math.random() * cols),
        row: Math.floor(Math.random() * rows),
      };

      if (isFree(cell)) {
        food = cell;
        return;
      }
    }
  };

  const reset = () => {
    field.resize();
    blocks = measureObstacles(canvas, root.querySelectorAll('[data-field-obstacle]'));
    cols = Math.floor(field.width / cellSize);
    rows = Math.floor(field.height / cellSize);
    // Start along the second row from the top, well away from the copy in the bottom-left.
    const row = 1;
    const head = Math.min(cols - 1, Math.floor(cols * 0.35) + SNAKE_LENGTH);
    snake = Array.from({ length: SNAKE_LENGTH }, (_, index) => ({
      col: Math.max(0, head - index),
      row,
    }));
    heading = DIRECTIONS[0];
    placeFood();
  };

  const step = () => {
    const head = snake[0];
    const options = DIRECTIONS.filter(
      (direction) => direction.col !== -heading.col || direction.row !== -heading.row,
    )
      .map((direction) => ({
        direction,
        next: { col: head.col + direction.col, row: head.row + direction.row },
      }))
      .filter(({ next }) => isFree(next));

    if (options.length === 0) {
      reset();
      return;
    }

    // Mostly greedy toward the pellet, with enough noise to wander like a player would.
    options.sort((a, b) => {
      const score = (cell: Cell) =>
        Math.abs(cell.col - food.col) + Math.abs(cell.row - food.row) + Math.random() * 2.4;
      return score(a.next) - score(b.next);
    });

    heading = options[0].direction;
    snake.unshift(options[0].next);

    if (options[0].next.col === food.col && options[0].next.row === food.row) {
      placeFood();
    }

    snake.pop();
  };

  const draw = () => {
    const obstacles: FieldObstacle[] = [
      ...blocks,
      ...snake.map((cell) => ({
        kind: 'rect' as const,
        x: cell.col * cellSize,
        y: cell.row * cellSize,
        width: cellSize,
        height: cellSize,
      })),
      { kind: 'rect', x: food.col * cellSize, y: food.row * cellSize, width: cellSize, height: cellSize },
    ];

    field.render(obstacles, null);

    const inset = Math.round(cellSize * 0.14);
    ctx.fillStyle = CREMA;

    for (const cell of snake) {
      ctx.fillRect(
        cell.col * cellSize + inset,
        cell.row * cellSize + inset,
        cellSize - inset * 2,
        cellSize - inset * 2,
      );
    }

    ctx.strokeStyle = CREMA;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      food.col * cellSize + inset + 1,
      food.row * cellSize + inset + 1,
      cellSize - inset * 2 - 2,
      cellSize - inset * 2 - 2,
    );
  };

  reset();
  draw();

  if (reduceMotion) {
    window.addEventListener('resize', () => {
      reset();
      draw();
    });
    return;
  }

  new ResizeObserver(() => {
    reset();
    draw();
  }).observe(root);

  runWhileVisible(canvas, (now) => {
    if (now - lastStep < STEP_MS) {
      return;
    }

    lastStep = now;
    step();
    draw();
  });
}
