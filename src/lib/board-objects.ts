/** Top inset for the artwork, measured from the top of its grid area. */
export function decorationTop(
  space: Pick<DOMRect, 'left' | 'right' | 'top'>,
  cards: readonly Pick<DOMRect, 'left' | 'right' | 'bottom'>[],
): number {
  let bottom = space.top;
  for (const card of cards) {
    if (card.left < space.right && card.right > space.left) {
      bottom = Math.max(bottom, card.bottom);
    }
  }
  return Math.ceil(bottom - space.top) + 16;
}
