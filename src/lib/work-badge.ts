/*
 * The work badge's window answers like an AI: the question is edited the way a person would
 * (back to the part both share, then the rest typed), three dots think, the answer streams in
 * a few letters at a time, and a dot picture prints under it. A pointer that comes over the
 * badge asks its own question instead. It all runs only while the card is on screen and the
 * tab is showing (src/lib/work-motion.ts marks the picture), and not at all for visitors who
 * asked for less motion.
 *
 * The badge also reacts like the real thing on its cord: a pointer brushing it leans it away,
 * a click presses it back. Both are damped swings sampled into keyframes and added onto the
 * .work-press layer, so neither cuts the other off.
 */
import type { DotArt, WorkScene } from '../data/work';

/** How many leading characters two strings share. */
export function commonStart(a: string, b: string): number {
  let at = 0;
  while (at < a.length && at < b.length && a[at] === b[at]) {
    at += 1;
  }
  return at;
}

/** The dots of a picture, as [column, row], in reading order. */
export function artCells(rows: DotArt): [number, number][] {
  return rows.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === '#' ? [[x, y] as [number, number]] : [])));
}

/** Splits text before its last word, so the caret can travel with that word. */
export function lastWordSplit(text: string): [string, string] {
  const at = text.lastIndexOf(' ') + 1;
  return [text.slice(0, at), text.slice(at)];
}

/** A damped swing in degrees at `t` seconds, starting `delay` seconds in. */
function damped(amplitude: number, period: number, decay: number, t: number, delay = 0): number {
  const s = Math.max(0, t - delay);
  return amplitude * Math.exp(-s / decay) * Math.sin((2 * Math.PI * s) / period);
}

/** A swing on the cord: the badge tips back, twists a little, and leans, then settles. */
function swing(ms: number, tip: number, twist: number, lean: number): Keyframe[] {
  const steps = Math.round(ms / 40);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * (ms / 1000);
    const x = -damped(tip, 1.1, 0.75, t);
    const y = damped(twist, 1.7, 1.1, t, 0.08);
    const z = damped(lean, 1.25, 0.9, t);
    return { transform: `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg) rotateZ(${z.toFixed(3)}deg)` };
  });
}

const BRUSH_MS = 2600;
const PRESS_MS = 3200;
const PRESS = swing(PRESS_MS, 15, 4, 0.9);
/** The letter rises a quarter swing in, at the deepest push. */
const LETTER_AFTER_MS = 280;

type Run = { stop: boolean; timers: number[] };

/** Prints a picture dot by dot, top row first, and lifts it bottom row first. */
function dotCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  let size = 0;
  let frame = 0;
  let shown: [number, number][] = [];

  const fit = () => {
    const px = Math.round(canvas.getBoundingClientRect().width * window.devicePixelRatio);
    if (px > 0 && px !== size) {
      size = px;
      canvas.width = px;
      canvas.height = px;
    }
  };
  const dot = (x: number, y: number, on: boolean) => {
    if (!context) {
      return;
    }
    const cell = size / 16;
    if (on) {
      const gap = Math.max(1, cell * 0.14);
      context.fillStyle = '#1b1b1b';
      context.fillRect(x * cell + gap / 2, y * cell + gap / 2, cell - gap, cell - gap);
    } else {
      context.clearRect(x * cell, y * cell, cell, cell);
    }
  };
  const run = (cells: [number, number][], perFrame: number, on: boolean) =>
    new Promise<void>((resolve) => {
      window.cancelAnimationFrame(frame);
      let i = 0;
      const step = () => {
        for (let n = 0; n < perFrame && i < cells.length; n += 1, i += 1) {
          dot(cells[i][0], cells[i][1], on);
        }
        if (i < cells.length) {
          frame = window.requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      frame = window.requestAnimationFrame(step);
    });

  return {
    draw(rows: DotArt) {
      fit();
      context?.clearRect(0, 0, size, size);
      shown = artCells(rows);
      return run(shown, 4, true);
    },
    wipe() {
      const cells = [...shown].sort((p, q) => q[1] - p[1] || q[0] - p[0]);
      shown = [];
      return run(cells, 10, false);
    },
    still(rows: DotArt) {
      fit();
      context?.clearRect(0, 0, size, size);
      shown = artCells(rows);
      shown.forEach(([x, y]) => dot(x, y, true));
    },
    clear() {
      window.cancelAnimationFrame(frame);
      fit();
      context?.clearRect(0, 0, size, size);
      shown = [];
    },
    stop() {
      window.cancelAnimationFrame(frame);
    },
  };
}

export function bindWorkBadge(card: HTMLElement, scenes: readonly WorkScene[], visitor: WorkScene, onPress: () => void): void {
  const stand = card.querySelector<HTMLElement>('.work-stand');
  const box = card.querySelector<HTMLElement>('.work-ai');
  const question = card.querySelector<HTMLElement>('[data-work-question]');
  const questionTail = card.querySelector<HTMLElement>('[data-work-question-tail]');
  const answer = card.querySelector<HTMLElement>('[data-work-answer]');
  const answerTail = card.querySelector<HTMLElement>('[data-work-answer-tail]');
  const canvas = card.querySelector<HTMLCanvasElement>('.work-dots');
  const press = card.querySelector<HTMLElement>('.work-press');
  const steps = [...card.querySelectorAll<HTMLElement>('.work-step')];

  if (!stand || !box || !question || !questionTail || !answer || !answerTail || !canvas || !press) {
    return;
  }

  const art = dotCanvas(canvas);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shownQuestion = '';
  let shownAnswer = '';

  // The last word and its caret stay together, so the caret never wraps onto a line alone.
  // Each line is two text nodes made once: the words before the last, then the last word,
  // which sits with the caret in a span that does not wrap.
  const text = (parent: HTMLElement) => {
    const node = document.createTextNode('');
    parent.prepend(node);
    return node;
  };
  const questionHead = text(question);
  const questionLast = text(questionTail);
  const answerHead = text(answer);
  const answerLast = text(answerTail);
  const setQuestion = (next: string) => {
    shownQuestion = next;
    [questionHead.data, questionLast.data] = lastWordSplit(next);
  };
  const setAnswer = (next: string) => {
    shownAnswer = next;
    [answerHead.data, answerLast.data] = lastWordSplit(next);
  };
  const mark = (index: number) => steps.forEach((step, k) => step.classList.toggle('is-on', k === index));

  if (reduced) {
    setQuestion(scenes[0].question);
    setAnswer(scenes[0].answer);
    mark(0);
    art.still(scenes[0].art);
    card.addEventListener('click', onPress);
    return;
  }

  let run: Run = { stop: true, timers: [] };
  const sleep = (ms: number, r: Run) =>
    new Promise<void>((resolve) => {
      r.timers.push(window.setTimeout(resolve, ms));
    });
  const halt = () => {
    run.stop = true;
    run.timers.forEach((timer) => window.clearTimeout(timer));
    art.stop();
    box.classList.remove('is-thinking', 'is-holding', 'is-asking');
  };

  const editQuestion = async (next: string, r: Run) => {
    box.classList.add('is-asking');
    const keep = commonStart(shownQuestion, next);
    while (shownQuestion.length > keep && !r.stop) {
      setQuestion(shownQuestion.slice(0, -1));
      await sleep(34, r);
    }
    await sleep(180, r);
    for (let at = keep; at < next.length && !r.stop; at += 1) {
      setQuestion(next.slice(0, at + 1));
      await sleep(next[at] === ' ' ? 120 + Math.random() * 60 : 55 + Math.random() * 45, r);
    }
    await sleep(260, r);
    box.classList.remove('is-asking');
  };
  const streamAnswer = async (text: string, r: Run) => {
    box.classList.add('is-thinking');
    await sleep(850, r);
    box.classList.remove('is-thinking');
    for (let at = 0; at < text.length && !r.stop; ) {
      at = Math.min(text.length, at + 1 + Math.floor(Math.random() * 3));
      setAnswer(text.slice(0, at));
      await sleep(45 + Math.random() * 60, r);
    }
  };
  const eraseAnswer = async (r: Run) => {
    while (shownAnswer.length && !r.stop) {
      setAnswer(shownAnswer.slice(0, -1));
      await sleep(18, r);
    }
  };
  const scene = async (next: WorkScene, r: Run) => {
    await Promise.all([eraseAnswer(r), art.wipe()]);
    if (r.stop) return;
    await editQuestion(next.question, r);
    if (r.stop) return;
    await streamAnswer(next.answer, r);
    if (r.stop) return;
    await sleep(120, r);
    if (r.stop) return;
    await art.draw(next.art);
    if (r.stop) return;
    box.classList.add('is-holding');
    await sleep(2600, r);
    box.classList.remove('is-holding');
  };

  let index = 0;
  let pointing = false;
  const loop = async () => {
    halt();
    const r: Run = { stop: false, timers: [] };
    run = r;
    while (!r.stop) {
      mark(index);
      await scene(scenes[index], r);
      if (!r.stop) {
        index = (index + 1) % scenes.length;
      }
    }
  };
  const answerVisitor = async () => {
    halt();
    const r: Run = { stop: false, timers: [] };
    run = r;
    mark(-1);
    await scene(visitor, r);
    if (!r.stop) {
      box.classList.add('is-holding');
    }
  };

  // Words move only while work-motion.ts says the picture is running. A scene cut short
  // starts over when the card comes back, from a clean window.
  const running = () => stand.dataset.motion === 'running';
  const follow = () => {
    if (!running()) {
      halt();
      return;
    }
    if (run.stop) {
      if (pointing) {
        void answerVisitor();
      } else {
        void loop();
      }
    }
  };
  new MutationObserver(follow).observe(stand, { attributes: true, attributeFilter: ['data-motion'] });

  card.addEventListener('pointerenter', (event) => {
    pointing = true;
    const bounds = card.getBoundingClientRect();
    const side = event.clientX < bounds.left + bounds.width / 2 ? 1 : -1;
    press.animate(swing(BRUSH_MS, 4, 2.2 * side, 2.4 * side), { duration: BRUSH_MS, easing: 'linear', composite: 'add' });
    if (running()) {
      void answerVisitor();
    }
  });
  card.addEventListener('pointerleave', () => {
    pointing = false;
    index = (index + 1) % scenes.length;
    if (running()) {
      void loop();
    } else {
      halt();
    }
  });
  card.addEventListener('click', () => {
    press.animate(PRESS, { duration: PRESS_MS, easing: 'linear', composite: 'add' });
    window.setTimeout(onPress, LETTER_AFTER_MS);
  });
}
