type Dated = { id: string; data: { date: Date; pinned?: boolean } };

/** A pinned photo leads the deck, then the newest; photos from the same day go by name. */
export function deckOrder<T extends Dated>(entries: T[]): T[] {
  return [...entries].sort(
    (left, right) =>
      Number(right.data.pinned ?? false) - Number(left.data.pinned ?? false) ||
      right.data.date.valueOf() - left.data.date.valueOf() ||
      left.id.localeCompare(right.id),
  );
}
