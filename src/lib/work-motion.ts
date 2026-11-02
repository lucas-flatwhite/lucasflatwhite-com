/*
 * The Work pictures move only while their card is on screen and the tab is showing. The
 * baked layers follow the CSS rule on [data-motion='paused'], which holds each animation
 * where it is; a filmed picture is played and paused here, and loads on its first play.
 */

export type Film = Pick<HTMLVideoElement, 'play' | 'pause'>;

/* What a film's <source> tells the page about itself (see WorkRipple.astro). */
export type FilmSource = { type: string; dataset: DOMStringMap; remove(): void };
export type DecodeCheck = (config: MediaDecodingConfiguration) => Promise<Pick<MediaCapabilitiesDecodingInfo, 'supported' | 'powerEfficient'>>;

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

/**
 * Removes the AV1 films this device would decode in software, which costs battery and heat;
 * the H.264 film after each one is decoded in hardware almost everywhere. Says whether any
 * source went, so the video can choose again.
 */
export async function dropCostlyFilms(sources: FilmSource[], check: DecodeCheck): Promise<boolean> {
  const costly = await Promise.all(
    sources.map(async (source) => {
      if (!source.type.includes('av01')) {
        return false;
      }

      const { width, height, bitrate, framerate } = source.dataset;
      try {
        const info = await check({
          type: 'file',
          video: { contentType: source.type, width: Number(width), height: Number(height), bitrate: Number(bitrate), framerate: Number(framerate) },
        });
        return !info.supported || !info.powerEfficient;
      } catch {
        return true;
      }
    }),
  );

  sources.forEach((source, i) => costly[i] && source.remove());
  return costly.includes(true);
}

async function prepareFilm(video: HTMLVideoElement): Promise<void> {
  // The cards can sit in the first screen; a film fetched before the page has loaded would
  // share the network with the photo and fonts. The still is up meanwhile.
  if (document.readyState !== 'complete') {
    await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  }

  if (!('mediaCapabilities' in navigator)) {
    return;
  }

  const sources = [...video.querySelectorAll('source')];
  if (await dropCostlyFilms(sources, (config) => navigator.mediaCapabilities.decodingInfo(config))) {
    video.load();
  }
}

export function bindWorkMotion(cards: Iterable<HTMLElement>): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const onScreen = new Map<HTMLElement, boolean>();
  const prepared = new Map<HTMLElement, Promise<void>>();
  const update = (card: HTMLElement) => {
    card.dataset.motion = motionState(onScreen.get(card) ?? false, document.hidden);
    const video = card.querySelector('video');
    // The film's sources are settled before its first play; by then the card may have left the screen.
    prepared.get(card)?.then(() => steerFilm(video, motionState(onScreen.get(card) ?? false, document.hidden)));
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target as HTMLElement;
      onScreen.set(card, entry.isIntersecting);
      update(card);
    }
  });

  for (const card of cards) {
    const video = card.querySelector('video');
    if (video) {
      // The film shows once it has a frame up; until then the still underneath is the picture.
      video.addEventListener('playing', () => {
        card.dataset.film = 'playing';
      }, { once: true });
      prepared.set(card, prepareFilm(video).catch(() => {}));
    }
    onScreen.set(card, false);
    observer.observe(card);
  }

  document.addEventListener('visibilitychange', () => {
    for (const card of onScreen.keys()) {
      update(card);
    }
  });
}
