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

export type BoardSlot<T> =
  | { kind: 'book' }
  | { kind: 'project'; entry: T }
  | { kind: 'daily' }
  | { kind: 'arcade' }
  | { kind: 'work' };

/** Fill unpinned positions in reading order, then discard unused numbers between pins. */
export function arrangeBoard<T extends { data: { slot?: number } }>(projects: T[]): BoardSlot<T>[] {
  const board = new Map<number, BoardSlot<T>>();
  for (const entry of projects) {
    const { slot } = entry.data;
    if (slot === undefined) continue;
    if (board.has(slot)) throw new Error(`Two projects are pinned to board slot ${slot}`);
    board.set(slot, { kind: 'project', entry });
  }

  const flow: BoardSlot<T>[] = [
    { kind: 'book' },
    ...projects.filter((entry) => entry.data.slot === undefined).map((entry) => ({ kind: 'project' as const, entry })),
    { kind: 'daily' },
    { kind: 'arcade' },
    { kind: 'work' },
  ];
  let position = 1;
  for (const item of flow) {
    while (board.has(position)) position += 1;
    board.set(position++, item);
  }
  return [...board.entries()].sort(([left], [right]) => left - right).map(([, item]) => item);
}

/** Estimated profile height for assigning slots to columns. CSS measures its actual height. */
export const NAME_ROWS = 5;

/** The photos span the second and third columns beside the name. */
export const PHOTO_ROWS = 5;

/** Rows each shape spans; a column is four rows wide, so these read as 4:5, 4:3 and 1:1. */
const SHAPE_ROWS = { tall: 5, wide: 3, square: 4 } as const;
const SHAPE_CYCLE = ['tall', 'wide', 'square', 'square', 'tall', 'wide'] as const;

export type RailSlot = { index: number; span: number };

/** The tall work badge hangs directly under the profile. */
export function railOf<T>(slots: BoardSlot<T>[]): RailSlot[] {
  const index = slots.findIndex((slot) => slot.kind === 'work');
  return index < 0 ? [] : [{ index, span: SHAPE_ROWS.tall }];
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

/** CSS measures the first column from the bottom of the profile and the others from the board top. */
export function slotPositionStyle({ column, row }: Slot, columns: 3 | 4) {
  const underProfile = column === 1;
  const firstRow = underProfile ? NAME_ROWS + 1 : 1;

  return [
    `--c${columns}: ${column}`,
    `--r${columns}: ${underProfile ? '2' : '1 / 3'}`,
    `--offset${columns}: ${row - firstRow}`,
  ].join('; ');
}

/**
 * Stands the rail's slots in the first column under the name, then drops every other slot,
 * in reading order, into the shortest column, so the first card sits beside the name and
 * the next ones fill across. Columns and rows are 1-based grid lines. The photos push the
 * cards under them down: a column under the photos still takes its turn across the first
 * row, and its first card lands below them. A rail slot keeps its assigned shape.
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
