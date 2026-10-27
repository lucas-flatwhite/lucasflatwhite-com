import { glassDefs, glassPane, radialField, svgRoot } from './glass.js';

/*
 * lucasflatwhite.com's picture for Work: three glass panes, shaped like the tall, wide and
 * square cards on the board, over fine grey ripples on paper. One crema ring rolls out from
 * the centre and bends as it passes under each pane. Without motion the ring rests where
 * it crosses the panes.
 */

const CENTRE = { x: 300, y: 330 };
const PANES = [
  { x: 188, y: 70, w: 164, h: 205, r: 26 },
  { x: 368, y: 70, w: 164, h: 123, r: 26 },
  { x: 368, y: 209, w: 164, h: 164, r: 26 },
];

const STYLE = `<style>
.ripple-wave { transform-origin: ${CENTRE.x}px ${CENTRE.y}px; transform: scale(1.35); }
@media (prefers-reduced-motion: no-preference) {
.ripple-wave { animation: ripple-wave 6.4s cubic-bezier(0.3, 0.55, 0.4, 1) infinite; }
@keyframes ripple-wave { 0% { transform: scale(0.12); opacity: 0; } 6% { opacity: 1; } 72% { opacity: 1; } 100% { transform: scale(4.4); opacity: 0; } }
}
</style>`;

function rings() {
  return Array.from({ length: 34 }, (_, i) => {
    const opacity = Math.max(0.06, 0.3 - i * 0.008).toFixed(3);
    return `<circle cx="${CENTRE.x}" cy="${CENTRE.y}" r="${18 + i * 13}" fill="none" stroke="#171717" stroke-opacity="${opacity}" stroke-width="1.4"/>`;
  }).join('');
}

export function ripple() {
  const still = `<g id="ripple-bg">${radialField('ripple-field', ['#fafafa', '#f2f2f2', '#e4e4e4'], 0.5, 0.15)}${rings()}</g>`;
  // Chrome drops frames of a moving shape seen through <use>, so the ring is drawn again in every pane.
  const wave = `<circle class="ripple-wave" cx="${CENTRE.x}" cy="${CENTRE.y}" r="100" fill="none" stroke="#ffc457" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
  const backdrop = `<use href="#ripple-bg"/>${wave}`;
  const panes = PANES.map((box, i) => {
    const id = `ripple-pane${i}`;
    return glassDefs(id, box, { bezel: 26, shift: 22, frost: 0.6, shadowColor: '#171717' }) +
      glassPane(id, box, { backdrop, mag: 1.12, tint: 0.3, shadow: 0.2, shadowColor: '#171717', edge: 0.1 });
  }).join('');

  return svgRoot(`${STYLE}<g id="ripple"><defs>${still}</defs>${backdrop}${panes}</g>`);
}
