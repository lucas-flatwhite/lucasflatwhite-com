/*
 * The Daily Shot card is a still receipt. Its DATE and TIME read the visitor's clock: stamped on
 * load, then once a minute on the minute, and only while the card is on screen and the tab is
 * showing. A click opens the X profile in a small window beside the board where the browser
 * allows one, and follows the link into a new tab everywhere else.
 */

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** The popup window's size, in CSS pixels. */
export const POPUP_SIZE = { width: 600, height: 760 } as const;

const pad = (value: number) => String(value).padStart(2, '0');

export function receiptStamp(now: Date): { date: string; time: string } {
  return {
    date: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${DAYS[now.getDay()]}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

/** Milliseconds until the next minute begins, plus a little so the clock has rolled over. */
export function untilNextMinute(now: number): number {
  return 60_000 - (now % 60_000) + 50;
}

type Frame = { screenX: number; screenY: number; outerWidth: number; outerHeight: number };

/** The window.open features for a popup centred on the browser window. */
export function popupFeatures(frame: Frame, size = POPUP_SIZE): string {
  const left = Math.round(frame.screenX + Math.max(0, frame.outerWidth - size.width) / 2);
  const top = Math.round(frame.screenY + Math.max(0, frame.outerHeight - size.height) / 2);

  return `popup,width=${size.width},height=${size.height},left=${left},top=${top}`;
}

function stampReceipt(card: HTMLElement): void {
  const { date, time } = receiptStamp(new Date());

  card.querySelectorAll('[data-receipt-date]').forEach((element) => {
    element.textContent = date;
  });
  card.querySelectorAll('[data-receipt-time]').forEach((element) => {
    element.textContent = time;
  });
}

function keepTime(card: HTMLElement): void {
  let onScreen = true;
  const tick = () => {
    if (onScreen && !document.hidden) {
      stampReceipt(card);
    }

    window.setTimeout(tick, untilNextMinute(Date.now()));
  };

  stampReceipt(card);
  window.setTimeout(tick, untilNextMinute(Date.now()));

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && onScreen) {
      stampReceipt(card);
    }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) {
        onScreen = entry.isIntersecting;

        if (onScreen && !document.hidden) {
          stampReceipt(card);
        }
      }
    }).observe(card);
  }
}

function openAsPopup(link: HTMLAnchorElement): void {
  link.addEventListener('click', (event) => {
    // A modified click or a phone keeps the browser's own way of opening a link.
    const wide = window.matchMedia('(min-width: 721px) and (hover: hover) and (pointer: fine)').matches;

    if (!wide || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const popup = window.open(link.href, 'daily-shot', popupFeatures(window));

    // A blocked popup returns null; the link then opens its new tab as usual.
    if (popup) {
      popup.opener = null;
      event.preventDefault();
    }
  });
}

export function bindDailyShot(card: HTMLElement): void {
  keepTime(card);

  const link = card.querySelector<HTMLAnchorElement>('[data-daily-shot-link]');

  if (link) {
    openAsPopup(link);
  }
}
