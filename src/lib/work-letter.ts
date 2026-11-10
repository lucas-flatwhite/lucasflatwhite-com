/** A readable letter with a stable frame. Only its highlights animate. */
import { workLetters, type WorkLanguage } from '../data/work';

export function workLetterLanguage(language: string): WorkLanguage {
  return language.toLowerCase().split('-')[0] === 'ko' ? 'ko' : 'en';
}

export function bindWorkLetter(
  dialog: HTMLDialogElement,
  returnTo?: HTMLElement | null,
): () => void {
  const sheet = dialog.querySelector<HTMLElement>('[data-work-letter-sheet]');
  const panels = [...dialog.querySelectorAll<HTMLElement>('[data-work-language-panel]')];
  const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('[data-work-language]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let language = workLetterLanguage(navigator.language);
  let animations: Animation[] = [];
  let closeTimer: number | undefined;

  const stop = () => {
    animations.forEach((animation) => animation.cancel());
    animations = [];
  };
  const highlight = () => {
    stop();
    if (reduced.matches) return;
    const panel = panels.find((panel) => !panel.hidden);
    panel?.querySelectorAll<HTMLElement>('.work-letter-mark-ink').forEach((mark, i) => {
      animations.push(mark.animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: 650, delay: 200 + i * 140, easing: 'ease-out', fill: 'backwards' },
      ));
    });
  };
  const setLanguage = (next: WorkLanguage) => {
    stop();
    language = next;
    dialog.lang = language;
    dialog.setAttribute('aria-labelledby', `work-letter-title-${language}`);
    panels.forEach((panel) => { panel.hidden = panel.dataset.workLanguagePanel !== language; });
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.workLanguage === language));
    });
    dialog.querySelector('[data-work-letter-close]')?.setAttribute('aria-label', workLetters[language].close);
    dialog.querySelector('[data-work-language-group]')?.setAttribute('aria-label', workLetters[language].languageLabel);
    // Keep language changes predictable; never move the reader down the letter.
    if (sheet) sheet.scrollTop = 0;
  };
  setLanguage(language);

  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    stop();
    if (reduced.matches) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    closeTimer = window.setTimeout(() => dialog.close(), 170);
  };

  dialog.addEventListener('click', (event) => {
    const target = event.target as Element;
    const toggle = target.closest<HTMLElement>('[data-work-language]');
    if (target === dialog || target.closest('[data-work-letter-close]')) {
      close();
    } else if (toggle) {
      const next = toggle.dataset.workLanguage;
      if (next === 'en' || next === 'ko') setLanguage(next);
    } else if (target.closest('[data-work-letter-replay]')) {
      highlight();
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    stop();
    window.clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    returnTo?.focus({ preventScroll: true });
  });
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });

  return () => {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    if (sheet) sheet.scrollTop = 0;
    dialog.showModal();
    highlight();
  };
}
