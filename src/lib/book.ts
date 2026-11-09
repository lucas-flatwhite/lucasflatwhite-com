/*
 * The book's store list. The card's button, the command menu (through the address /#book)
 * and a shared link all open the same dialog. On a wide screen it opens like the book: the
 * closed cover lies in the middle of the screen, swings open to the left, and shuts again on
 * the way out. The address and the book follow each other: going to #book opens it, going
 * back from #book closes it, and closing it leaves #book, so a reload does not reopen it.
 */

export const BOOK_HASH = '#book';

export function wantsBook(hash: string): boolean {
  return hash === BOOK_HASH;
}

/** What the book does when the address changes, given whether it is open. */
export function addressAction(hash: string, open: boolean): 'open' | 'close' | 'none' {
  if (wantsBook(hash)) {
    return open ? 'none' : 'open';
  }

  return open ? 'close' : 'none';
}

/**
 * How the address leaves #book once the book has closed. If the visitor navigated to #book
 * (the command menu does), that history entry is ours: stepping back over it keeps the
 * homepage from appearing twice in a row. A shared link has nothing of ours behind it, so
 * only the hash is replaced.
 */
export function leaveAddress(hash: string, navigatedHere: boolean): 'back' | 'replace' | 'none' {
  if (!wantsBook(hash)) {
    return 'none';
  }

  return navigatedHere ? 'back' : 'replace';
}

/** How long the cover takes to shut, then how long the book takes to fade (BookDialog.astro). */
const SHUT_MS = 620;
const FADE_MS = 170;

export function bindBook(dialog: HTMLDialogElement, triggers: Iterable<HTMLElement>): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // The same query BookDialog.astro uses to lay the book open instead of showing a sheet.
  const spread = window.matchMedia('(min-width: 721px) and (min-height: 561px)');
  let closing = 0;

  const open = () => {
    if (dialog.open) {
      return;
    }

    window.clearTimeout(closing);
    dialog.classList.remove('is-shutting', 'is-closing');
    dialog.showModal();
  };

  const finish = () => {
    dialog.classList.remove('is-shutting', 'is-closing');
    dialog.close();
  };

  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-shutting') || dialog.classList.contains('is-closing')) {
      return;
    }

    if (reduced.matches) {
      finish();
      return;
    }

    const fade = () => {
      dialog.classList.add('is-closing');
      closing = window.setTimeout(finish, FADE_MS);
    };

    if (spread.matches) {
      dialog.classList.add('is-shutting');
      closing = window.setTimeout(fade, SHUT_MS);
    } else {
      fade();
    }
  };

  for (const trigger of triggers) {
    trigger.addEventListener('click', open);
  }

  dialog.addEventListener('click', (event) => {
    const target = event.target as Element;

    if (target === dialog || target.closest('[data-book-close]')) {
      close();
    }
  });

  // Esc runs the same closing as the button, instead of the dialog vanishing at once.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  // However it closed (here, by the back button, or by the command menu taking over), the
  // address leaves #book too.
  let navigatedHere = false;

  // Focus goes back to the book card, wherever the book was opened from: a browser that does
  // not focus a pressed button (Safari) would otherwise send it to the top of the page.
  const card = [...triggers][0];
  dialog.addEventListener('close', () => {
    card?.focus({ preventScroll: true });
  });

  dialog.addEventListener('close', () => {
    const step = leaveAddress(window.location.hash, navigatedHere);
    navigatedHere = false;

    if (step === 'back') {
      history.back();
    } else if (step === 'replace') {
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
    }
  });

  const followAddress = (navigated: boolean) => {
    const action = addressAction(window.location.hash, dialog.open);

    if (action === 'open') {
      navigatedHere = navigated;
      open();
    } else if (action === 'close') {
      // The address already left #book, so there is nothing to step back over.
      navigatedHere = false;
      close();
    }
  };

  window.addEventListener('hashchange', () => followAddress(true));
  followAddress(false);
}
