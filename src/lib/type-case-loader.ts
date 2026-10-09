type Phase = 'idle' | 'inking' | 'pressing' | 'lifting' | 'proofed' | 'distributing';

const LABELS: Record<Phase, string> = {
  idle: 'Pull a proof',
  inking: 'Inking',
  pressing: 'Pressing',
  lifting: 'Pressing',
  proofed: 'Distribute the type',
  distributing: 'Distributing',
};

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
  const button = root.querySelector<HTMLButtonElement>('[data-case-proof]');

  if (!canvas || !button || !supportsWebGL()) {
    return;
  }

  const observer = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      observer.disconnect();

      try {
        const { mountTypeCase } = await import('./type-case');
        const typeCase = mountTypeCase(canvas, (phase) => {
          button.textContent = LABELS[phase];
          button.disabled = phase !== 'idle' && phase !== 'proofed';
          root.dataset.phase = phase;
        });

        root.dataset.ready = 'true';
        button.hidden = false;
        button.disabled = false;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        button.addEventListener('click', () => {
          // Bring the whole stage into view so the press is seen from start to finish.
          const stage = canvas.getBoundingClientRect();

          if (stage.top < 0 || stage.bottom > window.innerHeight) {
            canvas.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
          }

          if (typeCase.phase() === 'proofed') {
            typeCase.distribute();
          } else {
            typeCase.proof();
          }
        });
      } catch (error) {
        console.error('Type case failed to start', error);
      }
    },
    { rootMargin: '600px 0px' },
  );

  observer.observe(root);
}
