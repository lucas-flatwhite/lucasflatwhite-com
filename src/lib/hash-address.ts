/*
 * A dialog that lives at an address on the homepage (#book, #card). Going to the address
 * opens it, going back from it closes it, and closing it leaves the address, so a reload
 * does not reopen it. book.ts and card.ts share these rules.
 */

/** What the dialog at `target` does when the address changes, given whether it is open. */
export function addressActionFor(target: string, hash: string, open: boolean): 'open' | 'close' | 'none' {
  if (hash === target) {
    return open ? 'none' : 'open';
  }

  return open ? 'close' : 'none';
}

/**
 * How the address leaves `target` once the dialog has closed. If the visitor navigated to it
 * (the command menu does), that history entry is ours: stepping back over it keeps the
 * homepage from appearing twice in a row. A shared link has nothing of ours behind it, so
 * only the hash is replaced.
 */
export function leaveAddressFor(target: string, hash: string, navigatedHere: boolean): 'back' | 'replace' | 'none' {
  if (hash !== target) {
    return 'none';
  }

  return navigatedHere ? 'back' : 'replace';
}
