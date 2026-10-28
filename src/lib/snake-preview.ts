export type Cell = { x: number; y: number };

export type Preview = {
  cols: number;
  rows: number;
  dir: Cell;
  body: Cell[];
};

const TURNS: Cell[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export function createPreview(): Preview {
  return {
    cols: 8,
    rows: 6,
    dir: { x: 1, y: 0 },
    body: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  };
}

function inside(state: Preview, cell: Cell): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < state.cols && cell.y < state.rows;
}

export function stepPreview(state: Preview): Preview {
  let dir = state.dir;
  const head = state.body[0];
  let next = { x: head.x + dir.x, y: head.y + dir.y };

  if (!inside(state, next)) {
    const index = TURNS.findIndex((turn) => turn.x === dir.x && turn.y === dir.y);
    dir = TURNS[(index + 1) % TURNS.length];
    next = { x: head.x + dir.x, y: head.y + dir.y };
  }

  return {
    ...state,
    dir,
    body: [next, ...state.body.slice(0, -1)],
  };
}

export function drawPreview(canvas: HTMLCanvasElement, state: Preview): void {
  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const cell = Math.floor(Math.min(width / state.cols, height / state.rows));
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#171717';

  for (const part of state.body) {
    context.beginPath();
    context.roundRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4, cell / 5);
    context.fill();
  }
}

export function mountSnakePreview(canvas: HTMLCanvasElement): void {
  let state = createPreview();
  drawPreview(canvas, state);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // On a phone the snake rests where it starts, so only the name moves on the first screen.
  const phone = window.matchMedia('(max-width: 720px)');
  let timer: number | undefined;

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    if (timer !== undefined || phone.matches) {
      return;
    }

    timer = window.setInterval(() => {
      state = stepPreview(state);
      drawPreview(canvas, state);
    }, 180);
  };

  start();
  phone.addEventListener('change', () => (phone.matches ? stop() : start()));
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      start();
    }
  });
}
