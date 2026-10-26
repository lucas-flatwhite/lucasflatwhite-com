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

export function boardGaps(filled: number): number {
  return Math.max(0, BOARD_SLOTS - filled);
}

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

/** The name heads the first column and takes this many rows before any card lands under it. */
export const NAME_ROWS = 5;

/** Rows each shape spans; a column is four rows wide, so these read as 4:5, 4:3 and 1:1. */
const SHAPE_ROWS = { tall: 5, wide: 3, square: 4 } as const;
const SHAPE_CYCLE = ['tall', 'wide', 'square', 'square', 'tall', 'wide'] as const;

export type Slot = { column: number; row: number; span: number };

/**
 * Drops each slot, in reading order, into the shortest column, so the first card sits
 * beside the name and the next ones fill across. Columns and rows are 1-based grid lines.
 */
export function stackBoard(count: number, columns: number, nameRows = NAME_ROWS): Slot[] {
  const heights = Array.from({ length: columns }, (_, column) => (column === 0 ? nameRows : 0));

  return Array.from({ length: count }, (_, index) => {
    const span = SHAPE_ROWS[SHAPE_CYCLE[index % SHAPE_CYCLE.length]];
    const column = heights.indexOf(Math.min(...heights));
    const row = heights[column] + 1;
    heights[column] += span;
    return { column: column + 1, row, span };
  });
}
