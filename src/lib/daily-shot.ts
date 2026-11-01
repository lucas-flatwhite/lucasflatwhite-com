/*
 * The Daily Shot card is a still receipt. Its DATE and TIME read the visitor's clock: stamped on
 * load, then once a minute on the minute, and only while the card is on screen and the tab is
 * showing. The card's link opens the X profile in a new tab on its own, like every project card.
 */

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

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

export function bindDailyShot(card: HTMLElement): void {
  keepTime(card);
}
