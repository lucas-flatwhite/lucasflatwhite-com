function supportsWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Loads three.js only when the type case comes near the viewport. Without WebGL the
 * section keeps its printed fallback, so the page never shows an empty stage.
 */
export function mountTypeCaseWhenNear(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-case-canvas]');
  const track = root.querySelector<HTMLElement>('[data-case-track]');
  const stage = root.querySelector<HTMLElement>('[data-case-stage]');

  if (!canvas || !track || !stage || !supportsWebGL()) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lengthen the section up front, so the page does not grow under the reader once
  // three.js arrives. With reduced motion the stage just shows the finished proof.
  if (!reduceMotion) {
    root.dataset.scrub = 'true';
  }

  const observer = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      observer.disconnect();

      try {
        const { mountTypeCase } = await import('./type-case');
        const typeCase = mountTypeCase(canvas);
        root.dataset.ready = 'true';

        if (reduceMotion) {
          typeCase.scrub(1);
          return;
        }

        // The stage stays pinned while the track scrolls past; how far it has gone is how
        // far the press has run.
        const update = () => {
          const travel = track.offsetHeight - stage.offsetHeight;
          const top = track.getBoundingClientRect().top;
          typeCase.scrub(travel > 0 ? -top / travel : 1);
        };

        // Only measure while the track is near; anywhere else the press is parked at an end.
        new IntersectionObserver(
          (entries) => {
            update();

            if (entries.some((entry) => entry.isIntersecting)) {
              window.addEventListener('scroll', update, { passive: true });
              window.addEventListener('resize', update);
            } else {
              window.removeEventListener('scroll', update);
              window.removeEventListener('resize', update);
            }
          },
          { rootMargin: '100px 0px' },
        ).observe(track);
      } catch (error) {
        console.error('Type case failed to start', error);
      }
    },
    { rootMargin: '600px 0px' },
  );

  observer.observe(root);
}
