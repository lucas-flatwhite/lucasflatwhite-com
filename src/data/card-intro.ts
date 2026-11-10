/*
 * The words of the /hi/ intro (CardIntro.astro): my card handed over, flipped, waved at.
 * They live apart from card.ts so a change here does not ask for a fresh card.png.
 */
export const introCopy = {
  handed: 'Lucas just handed you his card.',
  hint: 'Tap the card to flip it',
  flip: 'Flip the card',
  greeting: 'Nice to meet you.',
  rest: 'The rest of me lives on this board.',
  wave: 'Wave back at Lucas',
  open: 'Open the board',
  flipBack: 'Flip back',
  hi: 'Hi, Lucas!',
  turn: 'Turn your phone around. Tap to go back.',
  skip: 'Skip',
} as const;
