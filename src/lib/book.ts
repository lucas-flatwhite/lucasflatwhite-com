/*
 * The book's store list. The card's button, the command menu (through the address /#book)
 * and a shared link all open the same dialog. On a wide screen it opens like the book: the
 * closed cover lies in the middle of the screen, swings open to the left, and shuts again on
 * the way out. Closing clears #book from the address, so a reload does not reopen it.
 */

export const BOOK_HASH = '#book';

export function wantsBook(hash: string): boolean {
  return hash === BOOK_HASH;
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

  // However it closed (here, or by the command menu taking over), the address forgets #book.
  dialog.addEventListener('close', () => {
    if (wantsBook(window.location.hash)) {
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
    }
  });

  const openFromAddress = () => {
    if (wantsBook(window.location.hash)) {
      open();
    }
  };

  window.addEventListener('hashchange', openFromAddress);
  openFromAddress();
}
