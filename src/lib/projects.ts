type Orderable = {
  data: {
    title: string;
    featured: boolean;
    order: number;
    art?: unknown;
  };
};

export function compareByOrder(
  left: { order: number; title: string },
  right: { order: number; title: string },
): number {
  return right.order - left.order || left.title.localeCompare(right.title);
}

export function sortFeaturedProjects<T extends Orderable>(entries: T[]): T[] {
  return entries
    .filter((entry) => entry.data.featured)
    .sort((left, right) =>
      compareByOrder(
        { order: left.data.order, title: left.data.title },
        { order: right.data.order, title: right.data.title },
      ),
    );
}

export function placeProjects<T extends Orderable>(entries: T[]): {
  palette: T[];
  board: T[];
} {
  const palette = sortFeaturedProjects(entries);

  return {
    palette,
    board: palette.filter((entry) => entry.data.art !== undefined),
  };
}

/**
 * The board is padded with numbered gaps up to this many slots while it is being laid out.
 * Set it to 0 and the gaps are gone.
 */
export const BOARD_SLOTS = 12;

/** What a gap says while its project is still on the way, taken in turn. */
export const GAP_NOTES = [
  'Grinding the beans',
  'Warming up',
  'Steaming the milk',
  'Still brewing',
  'Stretching first',
  'Pulling a shot',
  'Letting it bloom',
  'Sketched on a napkin',
  'Waiting on the kettle',
  'Tamping it down',
] as const;

export function gapNote(index: number): string {
  return GAP_NOTES[index % GAP_NOTES.length];
}

/**
 * One board slot: the book, a pictured project, Daily Shot, the arcade, the work badge, the
 * checklist, or a numbered gap. The checklist is still to be built; until it is, its place
 * shows as a gap with its own note.
 */
export type BoardSlot<T> =
  | { kind: 'book' }
  | { kind: 'project'; entry: T }
  | { kind: 'daily' }
  | { kind: 'arcade' }
  | { kind: 'work' }
  | { kind: 'checklist'; note: string }
  | { kind: 'gap'; note: string };

/**
 * The checklist keeps the number its place had as a gap, so the numbers, notes and shapes
 * around it stay as they were. Where it shows on the board is up to the rail, not this number.
 */
export const CHECKLIST_SLOT = 8;

/**
 * The gap notes were first handed out from slot 05 on, and each number keeps its note
 * however many cards land before it.
 */
const FIRST_NOTE_INDEX = 4;

/**
 * Lays the board out in reading order. The book leads, then every project without a pinned
 * `slot`, then Daily Shot, the arcade and the work badge; a project with a `slot` sits at that
 * number, the checklist holds `CHECKLIST_SLOT`, and the rest flow around them. Gaps pad the
 * board to `slots`, and each number keeps its own note, so a card taking a gap never shifts
 * the notes after it.
 */
export function arrangeBoard<T extends { data: { slot?: number } }>(
  projects: T[],
  slots = BOARD_SLOTS,
): BoardSlot<T>[] {
  const pinned = new Map<number, T>();

  for (const entry of projects) {
    const { slot } = entry.data;

    if (slot === undefined) {
      continue;
    }

    if (slot === CHECKLIST_SLOT) {
      throw new Error(`Board slot ${slot} is kept for the checklist`);
    }

    if (pinned.has(slot - 1)) {
      throw new Error(`Two projects are pinned to board slot ${slot}`);
    }

    pinned.set(slot - 1, entry);
  }

  const flow: BoardSlot<T>[] = [
    { kind: 'book' },
    ...projects.filter((entry) => entry.data.slot === undefined).map((entry) => ({ kind: 'project' as const, entry })),
    { kind: 'daily' },
    { kind: 'arcade' },
    { kind: 'work' },
  ];
  const board: (BoardSlot<T> | null)[] = [];
  let index = 0;

  const checklist = CHECKLIST_SLOT - 1;

  for (const item of flow) {
    while (pinned.has(index) || index === checklist) {
      index += 1;
    }

    board[index] = item;
    index += 1;
  }

  for (const [at, entry] of pinned) {
    board[at] = { kind: 'project', entry };
  }

  board[checklist] = { kind: 'checklist', note: gapNote(checklist - FIRST_NOTE_INDEX) };

  const length = Math.max(slots, board.length);

  return Array.from({ length }, (_, at) => board[at] ?? { kind: 'gap', note: gapNote(Math.max(0, at - FIRST_NOTE_INDEX)) });
}

/** The name heads the first column and takes this many rows before any card lands under it. */
export const NAME_ROWS = 5;

/** The photos span the second and third columns beside the name, as tall as the name. */
export const PHOTO_ROWS = NAME_ROWS;

/** Rows each shape spans; a column is four rows wide, so these read as 4:5, 4:3 and 1:1. */
const SHAPE_ROWS = { tall: 5, wide: 3, square: 4 } as const;
const SHAPE_CYCLE = ['tall', 'wide', 'square', 'square', 'tall', 'wide'] as const;

/**
 * The cards that stand under the name, top to bottom, on every board: where I work, and the
 * checklist under it. Each keeps its own shape: the badge hangs in a 4:5 card and the
 * checklist sits in a 4:3 one.
 */
export const RAIL = [
  { kind: 'work', rows: SHAPE_ROWS.tall },
  { kind: 'checklist', rows: SHAPE_ROWS.wide },
] as const;

export type RailSlot = { index: number; span: number };

/** Where the rail's cards are in the board's slots, in the rail's order. */
export function railOf<T>(slots: BoardSlot<T>[]): RailSlot[] {
  return RAIL.flatMap(({ kind, rows }) => {
    const index = slots.findIndex((slot) => slot.kind === kind);
    return index < 0 ? [] : [{ index, span: rows }];
  });
}

/**
 * The order the page lists the slots in, which is the order a phone shows them: the book,
 * then the rail, then the rest by number. The board places each slot by its number instead,
 * so this order never moves a card there.
 */
export function listOrder<T>(slots: BoardSlot<T>[]): number[] {
  const lead = [slots.findIndex((slot) => slot.kind === 'book'), ...railOf(slots).map((slot) => slot.index)]
    .filter((index) => index >= 0);

  return [...lead, ...slots.map((_, index) => index).filter((index) => !lead.includes(index))];
}

export type Slot = { column: number; row: number; span: number };

/**
 * Stands the rail's slots in the first column under the name, then drops every other slot,
 * in reading order, into the shortest column, so the first card sits beside the name and
 * the next ones fill across. Columns and rows are 1-based grid lines. The photos push the
 * cards under them down: a column under the photos still takes its turn across the first
 * row, and its first card lands below them. A rail slot keeps the shape `RAIL` gives it.
 * Every other slot takes its shape from its number, and the rail's slots still count toward
 * that numbering, so the rail never changes the shapes of the cards around it.
 */
export function stackBoard(
  count: number,
  columns: number,
  nameRows = NAME_ROWS,
  photoRows = 0,
  rail: readonly RailSlot[] = [],
): Slot[] {
  const heights = Array.from({ length: columns }, (_, column) => (column === 0 ? nameRows : 0));
  const floors = heights.map((_, column) => (column === 1 || column === 2 ? photoRows : 0));
  const placed = new Map<number, Slot>();

  for (const { index, span } of rail) {
    placed.set(index, { column: 1, row: heights[0] + 1, span });
    heights[0] += span;
  }

  return Array.from({ length: count }, (_, index) => {
    const pinned = placed.get(index);

    if (pinned) {
      return pinned;
    }

    const span = SHAPE_ROWS[SHAPE_CYCLE[index % SHAPE_CYCLE.length]];
    const column = heights.indexOf(Math.min(...heights));
    const row = Math.max(heights[column], floors[column]) + 1;
    heights[column] = row - 1 + span;
    return { column: column + 1, row, span };
  });
}
