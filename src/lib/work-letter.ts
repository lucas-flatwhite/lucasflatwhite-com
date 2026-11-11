/** Plays a conversation inside a fixed frame, with space reserved for each message. */
import { workLetters, type WorkLanguage } from '../data/work';

export function workLetterLanguage(language: string): WorkLanguage {
  return language.toLowerCase().split('-')[0] === 'ko' ? 'ko' : 'en';
}

/** Aborting resolves pending waits too, so a closed or replaced conversation can finish. */
function wait(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(false); return; }
    const cancel = () => { window.clearTimeout(timer); resolve(false); };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve(true);
    }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
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
  let controller = new AbortController();
  let animations: Animation[] = [];
  let closeTimer: number | undefined;
  let following = true;
  const panel = () => panels.find((panel) => !panel.hidden)!;

  const stop = () => {
    controller.abort();
    animations.forEach((animation) => animation.cancel());
    animations = [];
  };
  const finish = () => {
    dialog.classList.remove('is-playing');
  };
  const showAll = () => {
    stop();
    panel().querySelectorAll<HTMLElement>('[hidden]').forEach((element) => { element.hidden = false; });
    panel().querySelectorAll('.is-thinking').forEach((row) => row.classList.remove('is-thinking'));
    panel().querySelectorAll<HTMLElement>('[data-work-text]').forEach((element) => {
      element.textContent = element.dataset.workText!;
    });
    finish();
  };
  // Follow a new message once, rather than scrolling on every typed character.
  // A manual scroll keeps the reader in control until the conversation is replayed.
  const follow = (element: HTMLElement) => {
    if (!sheet || !following) return;
    const bottom = element.getBoundingClientRect().bottom;
    // Where the company bar is pinned over the bottom of the sheet, read up to its top edge.
    const foot = panel().querySelector<HTMLElement>('.work-letter-foot');
    const pinned = foot && foot !== element && getComputedStyle(foot).position === 'sticky';
    const edge = pinned ? foot.getBoundingClientRect().top : sheet.getBoundingClientRect().bottom;
    if (bottom > edge - 24) sheet.scrollBy({ top: bottom - edge + 24, behavior: 'smooth' });
  };
  sheet?.addEventListener('wheel', () => { following = false; }, { passive: true });
  sheet?.addEventListener('touchstart', () => { following = false; }, { passive: true });
  dialog.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) following = false;
  });

  // The untyped rest is laid out but invisible, so every line already breaks where it will end.
  const type = async (element: HTMLElement, signal: AbortSignal, interval: number) => {
    const characters = Array.from(element.dataset.workText!);
    const typed = document.createTextNode('');
    const rest = document.createElement('span');
    rest.style.visibility = 'hidden';
    rest.textContent = characters.join('');
    element.replaceChildren(typed, rest);
    for (const [i, character] of characters.entries()) {
      if (!await wait(interval, signal)) return false;
      typed.data += character;
      rest.textContent = characters.slice(i + 1).join('');
    }
    element.textContent = element.dataset.workText!; // one text node again, as reduced motion shows it
    return true;
  };
  const play = async () => {
    stop();
    if (reduced.matches) { showAll(); return; }
    controller = new AbortController();
    const { signal } = controller;
    const active = panel();
    const rows = [...active.querySelectorAll<HTMLElement>('.work-letter-turn')];
    const steps = [...active.querySelectorAll<HTMLElement>('[data-work-letter-step]')];
    rows.forEach((row) => { row.hidden = true; row.classList.remove('is-thinking'); });
    steps.forEach((step) => { step.hidden = true; });
    active.querySelectorAll<HTMLElement>('[data-work-text]').forEach((element) => { element.textContent = ''; });
    following = true;
    if (sheet) sheet.scrollTop = 0;
    dialog.classList.add('is-playing');
    if (!await wait(200, signal)) return;
    for (const row of rows) {
      row.hidden = false;
      follow(row);
      if (!await type(row.querySelector<HTMLElement>('.work-letter-q [data-work-text]')!, signal, 28)) return;
      row.classList.add('is-thinking');
      if (!await wait(300, signal)) return;
      row.classList.remove('is-thinking');
      if (!await type(row.querySelector<HTMLElement>('.work-letter-a [data-work-text]')!, signal, 20)) return;
      if (!await wait(400, signal)) return;
    }
    for (const step of steps) {
      step.hidden = false;
      follow(step);
      step.querySelectorAll<HTMLElement>('.work-letter-mark').forEach((mark, i) => {
        animations.push(mark.animate(
          [{ backgroundSize: '0% 0.48em' }, { backgroundSize: '100% 0.48em' }],
          { duration: 500, delay: i * 100, easing: 'ease-out', fill: 'backwards' },
        ));
      });
      if (!await wait(step.classList.contains('work-letter-pledge') ? 1000 : 400, signal)) return;
    }
    finish();
    // On a short screen the bar rests at the end, so bring it up beside Meet again.
    const foot = active.querySelector<HTMLElement>('.work-letter-foot');
    if (foot) follow(foot);
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
    if (sheet) sheet.scrollTop = 0;
  };
  setLanguage(language);

  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    stop();
    if (reduced.matches) { dialog.close(); return; }
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
      if ((next === 'en' || next === 'ko') && next !== language) {
        setLanguage(next);
        void play();
      }
    } else if (target.closest('[data-work-letter-replay]')) {
      void play();
      if (!reduced.matches) {
        buttons.find((button) => button.dataset.workLanguage === language)?.focus({ preventScroll: true });
      }
    }
  });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => {
    stop();
    window.clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');
    finish();
    returnTo?.focus({ preventScroll: true });
  });
  reduced.addEventListener('change', () => { if (reduced.matches && dialog.open) showAll(); });

  return () => {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    // Close carries autofocus, so a stray Enter cannot switch language, and the browser decides
    // whether to ring it: from the keyboard, not after a click or tap.
    dialog.showModal();
    void play();
  };
}
