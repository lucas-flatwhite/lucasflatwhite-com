export const NAME_REACH = 120;
export const NAME_PULL = 5;
export const NAME_WEIGHT_REST = 450;
export const NAME_WEIGHT_SPAN = 160;

export function letterResponse(dx: number, dy: number): { x: number; y: number; weight: number } {
  const dist = Math.hypot(dx, dy);
  const influence = Math.max(0, 1 - dist / NAME_REACH);
  const safe = dist || 1;
  const pull = influence * NAME_PULL;

  return {
    x: dist === 0 ? 0 : (dx / safe) * pull,
    y: dist === 0 ? 0 : (dy / safe) * pull,
    weight: Math.round(NAME_WEIGHT_REST + influence * NAME_WEIGHT_SPAN),
  };
}

export function restDelta(
  visualDx: number,
  visualDy: number,
  appliedX: number,
  appliedY: number,
): { dx: number; dy: number } {
  return { dx: visualDx + appliedX, dy: visualDy + appliedY };
}

export function bindNameMotion(root: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const letters = [...root.querySelectorAll<HTMLElement>('[data-name-letter]')];
  const offsets = new WeakMap<HTMLElement, { x: number; y: number }>();

  const reset = () => {
    for (const letter of letters) {
      letter.style.transform = '';
      letter.style.fontWeight = '';
      offsets.delete(letter);
    }
  };

  root.addEventListener('pointermove', (event) => {
    for (const letter of letters) {
      const rect = letter.getBoundingClientRect();
      const applied = offsets.get(letter) ?? { x: 0, y: 0 };
      const delta = restDelta(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
        applied.x,
        applied.y,
      );
      const response = letterResponse(delta.dx, delta.dy);
      offsets.set(letter, { x: response.x, y: response.y });
      letter.style.transform = `translate(${response.x}px, ${response.y}px)`;
      letter.style.fontWeight = String(response.weight);
    }
  });
  root.addEventListener('pointerleave', reset);
}
