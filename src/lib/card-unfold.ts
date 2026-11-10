/*
 * The end of the /hi/ intro (CardIntro.astro): my card unfolds into the homepage. The real
 * board has been underneath the whole time, so nothing loads and nothing navigates.
 *
 * 1. The card turns face up and stands straight.
 * 2. What the board does not carry over (the QR, the address, the line about me, the yellow
 *    dot) steps back.
 * 3. The intro drops behind the board. A sheet of paper grows from the card to the whole
 *    screen while the board's own handle, name and Korean name travel from where they sat
 *    on the card to their places (FLIP).
 * 4. The rest of the board in view rises in, one piece after another.
 *
 * Then the address becomes the homepage's, focus goes to my name, and the board's motion
 * starts (HomeBoard.astro waits for card-intro:done).
 */
import { flipFrom, REDUCED_FADE, UNFOLD, type Box } from './card-intro';
import { withBase } from './paths';

const TRAVEL = 'cubic-bezier(0.7, 0, 0.2, 1)';
const RISE = 'cubic-bezier(0.16, 1, 0.3, 1)';
/** When the first piece of the board starts to rise, after the paper starts to grow. */
const RISE_AFTER = 420;

/** Card parts and the board elements they become. */
const TRAVELLERS = [
  ['handle', '.topbar-mark'],
  ['name', '#name'],
  ['ko', '.name-ko'],
] as const;

/** The board pieces that rise in once the paper is down, in reading order. */
const RISERS = '.topbar-actions, .intro, .name-links > li, .board-photos, .board-cards > li';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * The box around what an element shows: its text and pictures. A range over the whole
 * element would take in block children (the name's lines), which run the column's width.
 */
function contentBox(element: Element): Box {
  const range = document.createRange();
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      range.selectNodeContents(node);
      rects.push(range.getBoundingClientRect());
    } else if (node instanceof HTMLImageElement) {
      rects.push(node.getBoundingClientRect());
    }
  }

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return { left, top, width: right - left, height: bottom - top };
}

function finish(root: HTMLElement, board: HTMLElement): void {
  root.remove();
  document.body.style.removeProperty('background');
  board.inert = false;
  document.documentElement.classList.remove('has-intro');
  history.replaceState(null, '', withBase());
  // The intro held the scroll at the top (CardIntro.astro); the homepage remembers it again.
  history.scrollRestoration = 'auto';

  const name = document.querySelector<HTMLElement>('#name');

  if (name) {
    name.tabIndex = -1;
    name.focus({ preventScroll: true });
  }

  window.dispatchEvent(new Event('card-intro:done'));
}

export async function unfoldInto(root: HTMLElement, board: HTMLElement): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_FADE, easing: 'ease-out', fill: 'forwards' }).finished;
    finish(root, board);
    return;
  }

  const front = root.querySelector<HTMLElement>('[data-intro-front] .business-card')!;

  // 1 and 2: CardIntro.astro's styles turn the card over and set the parts aside.
  root.classList.add('is-unfolding');
  await wait(UNFOLD.flip);
  root.classList.add('is-retreating');
  await wait(UNFOLD.retreat);

  // 3: measure both ends, then put the board in front of the card in one frame.
  const card = front.getBoundingClientRect();
  const radius = getComputedStyle(front).borderRadius;
  const moves = TRAVELLERS.flatMap(([part, target]) => {
    const from = root.querySelector(`[data-card-part='${part}']`);
    const to = document.querySelector<HTMLElement>(target);

    if (!from || !to) {
      return [];
    }

    // The handle travels with the face beside it, as the board's mark does.
    const first = contentBox(part === 'handle' ? from.parentElement! : from);
    return [{ to, first, last: contentBox(to), box: to.getBoundingClientRect() }];
  });
  const risers = [...document.querySelectorAll<HTMLElement>(RISERS)].filter((element) => {
    const { top, bottom } = element.getBoundingClientRect();
    return bottom > 0 && top < window.innerHeight;
  });

  // The paper: a full-screen sheet, clipped to the card and opened out to the screen. Its
  // white face fades into the board's paper as it opens.
  const sheet = document.createElement('div');
  const face = document.createElement('div');
  sheet.className = 'intro-sheet';
  face.className = 'intro-sheet-face';
  sheet.append(face);
  root.append(sheet);
  // The intro sits behind the board now; the body's own paper would hide it.
  document.body.style.background = 'transparent';
  root.classList.add('is-behind');

  const inset = `${card.top}px ${window.innerWidth - card.right}px ${window.innerHeight - card.bottom}px ${card.left}px`;
  sheet.animate([{ clipPath: `inset(${inset} round ${radius})` }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], {
    duration: UNFOLD.unfold,
    easing: TRAVEL,
    fill: 'forwards',
  });
  face.animate([{ opacity: 1 }, { opacity: 0 }], { duration: UNFOLD.unfold, easing: TRAVEL, fill: 'forwards' });

  for (const { to, first, last, box } of moves) {
    const { x, y, scale } = flipFrom(first, last);
    to.style.transformOrigin = `${last.left - box.left}px ${last.top - box.top}px`;
    to.animate([{ transform: `translate(${x}px, ${y}px) scale(${scale})` }, { transform: 'none' }], {
      duration: UNFOLD.unfold,
      easing: TRAVEL,
      fill: 'backwards',
    }).finished.then(() => to.style.removeProperty('transform-origin'));
  }

  risers.forEach((element, index) => {
    element.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], {
      duration: UNFOLD.rise,
      delay: RISE_AFTER + index * UNFOLD.stagger,
      easing: RISE,
      fill: 'backwards',
    });
  });

  // 4: everything has landed.
  await wait(Math.max(UNFOLD.unfold, RISE_AFTER + (risers.length - 1) * UNFOLD.stagger + UNFOLD.rise));
  finish(root, board);
}
