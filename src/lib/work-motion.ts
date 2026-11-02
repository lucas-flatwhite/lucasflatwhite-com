/*
 * The Work pictures move only while their card is on screen and the tab is showing. The
 * baked layers follow the CSS rule on [data-motion='paused'], which holds each animation
 * where it is; a filmed picture is played and paused here, and loads on its first play.
 */

export type Film = Pick<HTMLVideoElement, 'play' | 'pause'>;

export function motionState(onScreen: boolean, hidden: boolean): 'running' | 'paused' {
  return onScreen && !hidden ? 'running' : 'paused';
}

/** Plays or holds a film. A browser may refuse to play (iOS Low Power Mode); the still stays up. */
export function steerFilm(film: Film | null, state: 'running' | 'paused'): void {
  if (!film) {
    return;
  }

  if (state === 'running') {
    film.play().catch(() => {});
  } else {
    film.pause();
  }
}

export function bindWorkMotion(cards: Iterable<HTMLElement>): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const onScreen = new Map<HTMLElement, boolean>();
  const update = (card: HTMLElement) => {
    const state = motionState(onScreen.get(card) ?? false, document.hidden);
    card.dataset.motion = state;
    steerFilm(card.querySelector('video'), state);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target as HTMLElement;
      onScreen.set(card, entry.isIntersecting);
      update(card);
    }
  });

  for (const card of cards) {
    // The film shows once it has a frame up; until then the still underneath is the picture.
    card.querySelector('video')?.addEventListener('playing', () => {
      card.dataset.film = 'playing';
    }, { once: true });
    onScreen.set(card, false);
    observer.observe(card);
  }

  document.addEventListener('visibilitychange', () => {
    for (const card of onScreen.keys()) {
      update(card);
    }
  });
}
