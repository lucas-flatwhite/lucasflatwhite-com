import { glassDefs, glassPane, svgRoot } from './glass.js';

/*
 * AI Timeline Log's picture for Work: a stack of glass windows on a soft crema glow. The
 * front window turns from 2022 to 2026, each year dated by the log's first scene that
 * year. A window drops away below and the next springs forward out of the stack; 2026
 * rests, then drops, and 2022 comes round again. Without motion the 2026 window stands.
 */

export const YEARS = [
  ['2022', '2022.11.30'],
  ['2023', '2023.02.07'],
  ['2024', '2024.02.15'],
  ['2025', '2025.01.27'],
  ['2026', '2026.01.22'],
];

const FONT = "'Anybody', 'Anybody Variable', sans-serif";
const INK = '#171717';
const ROAST = '#5c3a1e';
const BACK = { x: 228, y: 136, w: 264, h: 132, r: 26 };
const MID = { x: 202, y: 158, w: 316, h: 132, r: 28 };
const FRONT = { x: 176, y: 182, w: 368, h: 132, r: 30 };

/* Seconds: each year holds for STEP, 2026 for HOLD; a window springs forward in POP and drops in SINK. */
const STEP = 0.62;
const HOLD = 2.4;
const POP = 0.46;
const SINK = 0.36;
const LAG = 0.16;
const LOOP = STEP * (YEARS.length - 1) + HOLD;

const STATES = {
  back: 'opacity: 0; transform: translateY(-24px) scale(0.86)',
  front: 'opacity: 1; transform: none',
  falling: 'opacity: 0.1; transform: translateY(26px) scale(0.985)',
  down: 'opacity: 0; transform: translateY(70px) scale(0.96)',
};
const EASES = {
  spring: 'cubic-bezier(0.3, 1.6, 0.55, 1)',
  drop: 'cubic-bezier(0.55, 0, 0.8, 0.4)',
  hold: 'linear',
};

/* When window i takes the front, and when it starts to drop. The last one hands back to 2022 just before the loop closes. */
const start = (i) => i * STEP;
const leave = (i) => (i === YEARS.length - 1 ? LOOP - POP - LAG : start(i + 1));

function keyframes(i) {
  const drop = (t) => [[t, 'front', 'drop'], [t + SINK / 2, 'falling', 'hold'], [t + SINK, 'down', 'hold']];
  const marks = i === 0
    ? [[0, 'front', 'hold'], ...drop(leave(0)), [leave(0) + SINK + 0.01, 'back', 'hold'], [LOOP - POP, 'back', 'spring'], [LOOP, 'front', 'hold']]
    : [[0, 'back', 'hold'], [start(i) + LAG, 'back', 'spring'], [start(i) + LAG + POP, 'front', 'hold'], ...drop(leave(i)), [LOOP, 'down', 'hold']];
  const at = (t) => `${((t / LOOP) * 100).toFixed(2)}%`;

  return `@keyframes years-y${i} { ${marks.map(([t, state, ease]) => `${at(t)} { ${STATES[state]}; animation-timing-function: ${EASES[ease]}; }`).join(' ')} }`;
}

const STYLE = `<style>
.years-yr { opacity: 0; transform-origin: 360px 248px; }
.years-last { opacity: 1; }
@media (prefers-reduced-motion: no-preference) {
${YEARS.map((_, i) => `.years-yr${i} { animation: years-y${i} ${+LOOP.toFixed(2)}s infinite both; }`).join('\n')}
${YEARS.map((_, i) => keyframes(i)).join('\n')}
}
</style>`;

function glow() {
  const pools = [
    [150, 90, 210, '#ffe6b0'],
    [600, 420, 240, '#ee9a35'],
    [560, 70, 150, '#fff3d6'],
    [120, 430, 180, '#f5ae4a'],
    [380, 250, 150, '#fff0cc'],
  ].map(([x, y, r, fill]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');

  return `<filter id="years-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>` +
    `<g id="years-bg"><rect width="720" height="480" fill="#ffc457"/><g filter="url(#years-soft)">${pools}</g></g>`;
}

function face(year, day) {
  return `<text x="206" y="220" font-family="${FONT}" font-size="15" font-weight="500" fill="${ROAST}" letter-spacing="0.6" style="font-stretch:88%">${day}</text>` +
    `<circle cx="510" cy="214" r="5" fill="${INK}"/>` +
    `<text x="203" y="293" font-family="${FONT}" font-size="76" font-weight="640" letter-spacing="-1.5" fill="${INK}" style="font-stretch:96%">${year}</text>`;
}

export function years() {
  const backdrop = '<use href="#years-bg"/>';
  const shade = { backdrop, shadowColor: ROAST, edge: 0.06 };
  // Only a strip of the two back windows shows above the front one, so their rim light is drawn at half density.
  const stack =
    glassDefs('years-back', BACK, { bezel: 22, shift: 18, frost: 1.6, shadowColor: ROAST, lightRes: 1 }) +
    glassPane('years-back', BACK, { ...shade, mag: 1.05, tint: 0.096, shadow: 0.175 }) +
    glassDefs('years-mid', MID, { bezel: 22, shift: 18, frost: 1.6, shadowColor: ROAST, lightRes: 1 }) +
    glassPane('years-mid', MID, { ...shade, mag: 1.05, tint: 0.128, shadow: 0.21 }) +
    glassDefs('years-front', FRONT, { bezel: 28, shift: 24, frost: 2, shadowColor: ROAST });
  // Later years sit lower, so the next window rises from behind the one dropping away.
  const windows = YEARS.map(([year, day], i) => {
    const last = i === YEARS.length - 1 ? ' years-last' : '';
    return `<g class="years-yr years-yr${i}${last}">` +
      glassPane('years-front', FRONT, { ...shade, mag: 1.07, tint: 0.34, shadow: 0.28, inner: face(year, day) }) +
      '</g>';
  }).reverse().join('');

  return svgRoot(`${STYLE}<g id="years"><defs>${glow()}</defs>${backdrop}${stack}${windows}</g>`);
}
