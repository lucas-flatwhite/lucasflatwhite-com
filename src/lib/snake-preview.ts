import { motionState } from './work-motion';

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

/** The snake crawls only while its screen is in view and the tab is showing, on every screen size. */
export function mountSnakePreview(canvas: HTMLCanvasElement): void {
  let state = createPreview();
  drawPreview(canvas, state);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let onScreen = false;
  let timer: number | undefined;

  const stop = () => {
    window.clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    if (timer !== undefined || motionState(onScreen, document.hidden) === 'paused') {
      return;
    }

    timer = window.setInterval(() => {
      state = stepPreview(state);
      drawPreview(canvas, state);
    }, 180);
  };

  const update = () => (motionState(onScreen, document.hidden) === 'running' ? start() : stop());

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      update();
    }
  });
}
