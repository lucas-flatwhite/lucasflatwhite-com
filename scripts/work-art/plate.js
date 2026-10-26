import { compose, engrave, vignette } from './engrave.js';

/*
 * AI Timeline Log's plate for Work: "typing a question into an input became using AI."
 * A chat input with a caret and a send button, its grain cut in rings that spread out
 * from it. The sketch is drawn in black on white; the engraver turns density into cuts.
 */

const W = 720;
const H = 480;
const S = 6;
const BOX = { x: 96, y: 196, w: W - 192, h: 96 };
const CENTRE = { x: W / 2, y: BOX.y + BOX.h / 2 };

/* The log's border() leaves its top margin for a fixed bar; a Work plate is framed on all four sides. */
function frame(g) {
  const m = 8 + S;
  g.strokeStyle = 'rgba(0,0,0,.95)';
  g.lineWidth = S * 2.2;
  g.strokeRect(m, m, W - 2 * m, H - 2 * m);
}

function sketch(g) {
  const { x, y, w, h } = BOX;
  g.fillStyle = 'rgba(0,0,0,.08)';
  g.fillRect(0, 0, W, H);
  vignette(g, W, H, 0.15);
  g.fillStyle = 'rgba(0,0,0,.22)';
  g.beginPath();
  g.arc(CENTRE.x, CENTRE.y, 250, 0, 7);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.roundRect(x, y, w, h, 48);
  g.fill();
  g.strokeStyle = '#000';
  g.lineWidth = 20;
  g.beginPath();
  g.roundRect(x, y, w, h, 48);
  g.stroke();
  // The send button, an arrow pointing up out of a disc.
  g.fillStyle = '#000';
  g.beginPath();
  g.arc(x + w - 50, y + h / 2, 30, 0, 7);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(x + w - 50, y + h / 2 - 17);
  g.lineTo(x + w - 34, y + h / 2 + 1);
  g.lineTo(x + w - 66, y + h / 2 + 1);
  g.closePath();
  g.fill();
  g.fillRect(x + w - 55, y + h / 2, 10, 15);
  frame(g);
}

/* One recorder takes every bucket's cuts: a still print fills all 64 in the same colour. */
function recorder() {
  const parts = [];
  return {
    moveTo(x, y) { parts.push(`M${x.toFixed(1)} ${y.toFixed(1)}`); },
    lineTo(x, y) { parts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`); },
    closePath() { parts.push('Z'); },
    d() { return parts.join(''); },
  };
}

/** The plate's raw cut path, absolute and unsimplified. */
export function plate() {
  const src = compose(W, H, sketch);
  const cuts = recorder();
  engrave({ w: W, h: H, s: S, src, mode: 'rings', cx: CENTRE.x, cy: CENTRE.y, maxR: 0.9, seed: 5, sweep: 2.2 }, () => cuts);
  return cuts.d();
}
