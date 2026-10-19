// A copy link writes its text to the clipboard instead of following its href, then rolls a
// "Copied" line over the text for a moment. The markup comes from CopyMark and CopyRoll.

export const COPIED_MS = 1600;

const timers = new WeakMap<HTMLElement, number>();
let status: HTMLElement | null = null;

/** Resolves false when the browser refuses: no clipboard on an insecure page, or denied access. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Shows the copied state on `host` and says so once to screen readers. */
export function showCopied(host: HTMLElement, message: string) {
  window.clearTimeout(timers.get(host));
  host.dataset.copied = '';
  timers.set(
    host,
    window.setTimeout(() => {
      delete host.dataset.copied;
    }, COPIED_MS),
  );
  announce(message);
}

export function clearCopied(host: HTMLElement) {
  window.clearTimeout(timers.get(host));
  delete host.dataset.copied;
}

function announce(message: string) {
  if (!status) {
    status = document.createElement('p');
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    document.body.append(status);
  }

  // Clearing first lets the same message be read again on a second copy.
  status.textContent = '';
  const region = status;
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/** Wires every `a[data-copy]` under `root`. Where copying fails the href (a mailto) still opens. */
export function mountCopyLinks(root: ParentNode = document) {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-copy]')) {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const text = link.dataset.copy ?? '';

      if (await copyText(text)) {
        showCopied(link, `Copied ${text}`);
      } else {
        window.location.href = link.href;
      }
    });
  }
}
