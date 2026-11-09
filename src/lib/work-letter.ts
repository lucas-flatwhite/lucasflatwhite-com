/*
 * Plays the letter the work badge opens (WorkLetter.astro). Each doubt types into a bubble,
 * three dots think, the answer streams in; then "정말이요." settles, the pledge gets its
 * highlighter one word at a time, and the line about meeting again waits with its caret.
 * A click on the letter shows the rest at once, the replay button plays it again, and closing
 * stops every timer. Visitors who asked for less motion get the whole letter at once.
 */

type Run = { stop: boolean; timers: number[] };

const FADE_MS = 170;

export function bindWorkLetter(
  dialog: HTMLDialogElement,
  turns: readonly (readonly [string, string])[],
  returnTo?: HTMLElement | null,
): () => void {
  const sheet = dialog.querySelector<HTMLElement>('[data-work-letter-sheet]');
  const turnRows = [...dialog.querySelectorAll<HTMLElement>('.work-letter-turn')];
  const steps = [...dialog.querySelectorAll<HTMLElement>('[data-work-letter-step]')];
  const marks = [...dialog.querySelectorAll<HTMLElement>('.work-letter-mark')];
  const replay = dialog.querySelector<HTMLElement>('[data-work-letter-replay]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let run: Run = { stop: true, timers: [] };

  const sleep = (ms: number, r: Run) =>
    new Promise<void>((resolve) => {
      r.timers.push(window.setTimeout(resolve, ms));
    });
  const halt = () => {
    run.stop = true;
    run.timers.forEach((timer) => window.clearTimeout(timer));
  };

  // As the letter grows past the screen, the line being written stays in view.
  const follow = (element: Element) => {
    if (!sheet) {
      return;
    }
    const box = element.getBoundingClientRect();
    const view = sheet.getBoundingClientRect();
    if (box.bottom > view.bottom - 24) {
      sheet.scrollBy({ top: box.bottom - view.bottom + 64, behavior: 'smooth' });
    }
  };

  const write = (element: HTMLElement, text: string, caret: boolean) => {
    element.textContent = text;
    if (caret) {
      const mark = document.createElement('span');
      mark.className = 'work-letter-caret';
      element.append(mark);
    }
  };

  const showAll = () => {
    halt();
    turnRows.forEach((row, i) => {
      row.hidden = false;
      row.classList.remove('is-thinking');
      write(row.querySelector('.work-letter-q')!, turns[i][0], false);
      write(row.querySelector('.work-letter-a')!, turns[i][1], false);
    });
    steps.forEach((step) => step.classList.add('is-on'));
    marks.forEach((mark) => mark.classList.add('is-marked'));
    replay?.classList.add('is-on');
    dialog.classList.remove('is-playing');
  };

  const reset = () => {
    turnRows.forEach((row) => {
      row.hidden = true;
      row.classList.remove('is-thinking');
      write(row.querySelector('.work-letter-q')!, '', false);
      write(row.querySelector('.work-letter-a')!, '', false);
    });
    steps.forEach((step) => step.classList.remove('is-on'));
    marks.forEach((mark) => mark.classList.remove('is-marked'));
    replay?.classList.remove('is-on');
    if (sheet) {
      sheet.scrollTop = 0;
    }
  };

  const play = async () => {
    halt();
    if (reduced.matches) {
      showAll();
      return;
    }

    const r: Run = { stop: false, timers: [] };
    run = r;
    reset();
    dialog.classList.add('is-playing');
    await sleep(500, r);

    for (const [i, [question, answer]] of turns.entries()) {
      if (r.stop) return;
      const row = turnRows[i];
      const bubble = row.querySelector<HTMLElement>('.work-letter-q')!;
      const line = row.querySelector<HTMLElement>('.work-letter-a')!;
      row.hidden = false;
      follow(row);
      for (let at = 1; at <= question.length && !r.stop; at += 1) {
        write(bubble, question.slice(0, at), true);
        await sleep(50 + Math.random() * 40, r);
      }
      write(bubble, question, false);
      row.classList.add('is-thinking');
      await sleep(700, r);
      row.classList.remove('is-thinking');
      for (let at = 0; at < answer.length && !r.stop; ) {
        at = Math.min(answer.length, at + 1 + Math.floor(Math.random() * 2));
        write(line, answer.slice(0, at), true);
        await sleep(55 + Math.random() * 50, r);
      }
      write(line, answer, false);
      await sleep(500, r);
    }

    const [really, pledge, waiting] = steps;
    if (r.stop) return;
    await sleep(500, r);
    really?.classList.add('is-on');
    if (really) follow(really);
    await sleep(1200, r);
    if (r.stop) return;
    pledge?.classList.add('is-on');
    if (pledge) follow(pledge);
    await sleep(800, r);
    for (const mark of marks) {
      if (r.stop) return;
      mark.classList.add('is-marked');
      await sleep(420, r);
    }
    await sleep(700, r);
    if (r.stop) return;
    waiting?.classList.add('is-on');
    await sleep(900, r);
    if (r.stop) return;
    replay?.classList.add('is-on');
    if (replay) follow(replay);
    dialog.classList.remove('is-playing');
  };

  // A highlighted word is marked again when a pointer comes over it.
  for (const mark of marks) {
    mark.addEventListener('pointerenter', () => {
      if (reduced.matches || !mark.classList.contains('is-marked')) {
        return;
      }
      mark.classList.remove('is-marked');
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => mark.classList.add('is-marked')));
    });
  }

  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) {
      return;
    }
    halt();
    if (reduced.matches) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    window.setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, FADE_MS);
  };

  dialog.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target === dialog || target.closest('[data-work-letter-close]')) {
      close();
    } else if (target.closest('[data-work-letter-replay]')) {
      void play();
    } else if (dialog.classList.contains('is-playing') && !target.closest('.work-letter-mark')) {
      showAll();
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    halt();
    dialog.classList.remove('is-playing');
    // Back to the card's button, even when the click landed on the picture and focused nothing.
    returnTo?.focus({ preventScroll: true });
  });

  return () => {
    // The letter rises a moment after the click; if the command menu or another dialog opened
    // in that moment, it stays shut rather than landing on top.
    if (dialog.open || document.querySelector('dialog[open]')) {
      return;
    }
    dialog.showModal();
    void play();
  };
}
