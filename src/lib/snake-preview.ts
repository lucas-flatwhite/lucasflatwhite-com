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
    rows: 5,
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
  context.fillStyle = '#fafafa';

  for (const part of state.body) {
    context.fillRect(part.x * cell + 1, part.y * cell + 1, cell - 2, cell - 2);
  }
}

export function mountSnakePreview(canvas: HTMLCanvasElement): void {
  drawPreview(canvas, createPreview());
}
