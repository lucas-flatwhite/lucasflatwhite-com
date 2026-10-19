import { clamp01, STEPS, stepAt, TIMELINE, type Step } from './press-timeline';

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
        // The meter follows the press as drawn, not the scroll, so the two never disagree.
        const meter = root.querySelector<HTMLElement>('[data-case-meter]');
        const labels = [...root.querySelectorAll<HTMLElement>('[data-case-step]')];
        let shown: Step | null = null;
        const follow = (progress: number) => {
          meter?.style.setProperty('--case-progress', String(clamp01(progress / TIMELINE.turn[1])));
          const step = stepAt(progress);

          if (step === shown) {
            return;
          }

          shown = step;
          const current = STEPS.indexOf(step);

          for (const label of labels) {
            const at = STEPS.indexOf(label.dataset.caseStep as Step);
            label.dataset.state = at < current ? 'done' : at === current ? 'active' : 'upcoming';
          }
        };
        const typeCase = mountTypeCase(canvas, follow);
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
