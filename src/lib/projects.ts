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

export const LEAD_COUNT = 2;

export function placeProjects<T extends Orderable>(entries: T[]): {
  palette: T[];
  lead: T[];
  rest: T[];
} {
  const palette = sortFeaturedProjects(entries);
  const board = palette.filter((entry) => entry.data.art !== undefined);

  return {
    palette,
    lead: board.slice(0, LEAD_COUNT),
    rest: board.slice(LEAD_COUNT),
  };
}
