type Dated = { id: string; data: { date: Date } };

/** The newest photo leads the strip; photos from the same day go by name. */
export function newestFirst<T extends Dated>(entries: T[]): T[] {
  return [...entries].sort(
    (left, right) => right.data.date.valueOf() - left.data.date.valueOf() || left.id.localeCompare(right.id),
  );
}
