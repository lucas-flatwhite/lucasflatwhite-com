/*
 * My card's dialog (CardDialog.astro). The header button, the command menu (through the
 * address /#card) and a shared link all open it, and it follows the address the way the book
 * does (hash-address.ts): Back, or a swipe back on a phone, closes the sheet.
 *
 * While it is open the screen stays awake, so the QR does not dim while someone lines up a
 * camera. The image is fetched as soon as the dialog opens: Safari only shares a file from a
 * tap if the share starts inside that tap, so the click must not wait for a download.
 */
import { addressActionFor, leaveAddressFor } from './hash-address';
import { withBase } from './paths';

export const CARD_HASH = '#card';
/** The baked card (npm run card), under the deploy base. */
export const CARD_IMAGE = 'card.png';
export const CARD_FILE_NAME = 'lucas-flatwhite-card.png';

type CanShare = (data: { files: File[] }) => boolean;

/** Share the image when it is in hand and the browser takes files; otherwise only save it. */
export function shareMode(file: File | null, canShare: CanShare | undefined): 'share' | 'save' {
  return file !== null && canShare !== undefined && canShare({ files: [file] }) ? 'share' : 'save';
}

export function bindCard(dialog: HTMLDialogElement, triggers: Iterable<HTMLElement>): void {
  const share = dialog.querySelector<HTMLButtonElement>('[data-card-share]');
  const opener = [...triggers][0];
  let navigatedHere = false;
  let file: File | null = null;
  let fetching = false;
  let lock: WakeLockSentinel | null = null;

  const prefetch = async () => {
    if (file || fetching) {
      return;
    }

    fetching = true;

    try {
      const response = await fetch(withBase(CARD_IMAGE));

      if (response.ok) {
        file = new File([await response.blob()], CARD_FILE_NAME, { type: 'image/png' });
      }
    } catch {
      // Offline: Save image still links to the file.
    } finally {
      fetching = false;
    }

    if (share && shareMode(file, navigator.canShare?.bind(navigator)) === 'share') {
      share.hidden = false;
    }
  };

  const holdScreen = async () => {
    if (!('wakeLock' in navigator) || !dialog.open || document.visibilityState !== 'visible' || lock) {
      return;
    }

    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => {
        lock = null;
      });
    } catch {
      // Refused (low battery, a frame without permission): the screen dims as usual.
    }
  };

  const releaseScreen = () => {
    lock?.release().catch(() => {});
    lock = null;
  };

  const open = () => {
    if (dialog.open) {
      return;
    }

    // Another dialog (the book, the command menu) gives way, so two never stack.
    for (const other of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) {
      other.close();
    }

    dialog.showModal();
    void prefetch();
    void holdScreen();
  };

  for (const trigger of triggers) {
    trigger.addEventListener('click', () => {
      // Opening through the address gives Back something to close.
      if (window.location.hash === CARD_HASH) {
        open();
      } else {
        window.location.hash = CARD_HASH;
      }
    });
  }

  share?.addEventListener('click', () => {
    if (!file) {
      return;
    }

    navigator.share({ files: [file] }).catch(() => {
      // Dismissing the share sheet rejects with AbortError; nothing to do either way.
    });
  });

  dialog.addEventListener('click', (event) => {
    const target = event.target as Element;

    if (target === dialog || target.closest('[data-card-close]')) {
      dialog.close();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void holdScreen();
    }
  });

  // However it closed (Esc, the button, Back, or the command menu taking over), the screen
  // may dim again, focus returns to the header button and the address leaves #card.
  dialog.addEventListener('close', () => {
    releaseScreen();
    opener?.focus({ preventScroll: true });

    const step = leaveAddressFor(CARD_HASH, window.location.hash, navigatedHere);
    navigatedHere = false;

    if (step === 'back') {
      history.back();
    } else if (step === 'replace') {
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
    }
  });

  const followAddress = (navigated: boolean) => {
    const action = addressActionFor(CARD_HASH, window.location.hash, dialog.open);

    if (action === 'open') {
      navigatedHere = navigated;
      open();
    } else if (action === 'close') {
      // The address already left #card, so there is nothing to step back over.
      navigatedHere = false;
      dialog.close();
    }
  };

  window.addEventListener('hashchange', () => followAddress(true));
  followAddress(false);
}
