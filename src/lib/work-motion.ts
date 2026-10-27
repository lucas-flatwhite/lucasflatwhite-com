/*
 * The Work pictures move under glass filters, so every frame redraws the filters. A picture
 * runs only while its card is on screen and the tab is showing; otherwise the CSS rule on
 * [data-motion='paused'] holds each animation where it is, and it resumes from there.
 */

export function motionState(onScreen: boolean, hidden: boolean): 'running' | 'paused' {
  return onScreen && !hidden ? 'running' : 'paused';
}

export function bindWorkMotion(cards: Iterable<HTMLElement>): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const onScreen = new Map<HTMLElement, boolean>();
  const update = (card: HTMLElement) => {
    card.dataset.motion = motionState(onScreen.get(card) ?? false, document.hidden);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target as HTMLElement;
      onScreen.set(card, entry.isIntersecting);
      update(card);
    }
  });

  for (const card of cards) {
    onScreen.set(card, false);
    observer.observe(card);
  }

  document.addEventListener('visibilitychange', () => {
    for (const card of onScreen.keys()) {
      update(card);
    }
  });
}
