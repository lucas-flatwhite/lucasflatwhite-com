/*
 * Draws my card's QR as an inline SVG at build time. `qrcode` only hands over the module
 * matrix; the drawing is ours: round dots, finder eyes with soft corners (they keep the
 * 1:1:3:1:1 ratio scanners look for), and an empty middle where my face goes. Error
 * correction H covers the face with room to spare. Dark on light only: some scanners do not
 * read an inverted code.
 *
 * The viewBox is in modules, so the SVG takes whatever size the card gives it.
 */
import QRCode from 'qrcode';

export type QrMatrix = { size: number; dark(row: number, column: number): boolean };

export function qrMatrix(text: string): QrMatrix {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'H' });

  return { size: modules.size, dark: (row, column) => modules.get(row, column) === 1 };
}

type QrOptions = {
  /** Light modules around the code, inside the SVG. The card's padding adds to it. */
  quiet?: number;
  /** A dot's diameter, as a share of one module. */
  dot?: number;
  /** Modules left empty in the middle, on each side. */
  clear?: number;
  dark?: string;
  /** The tile behind the code, or null for none. */
  light?: string | null;
};

const f = (value: number) => value.toFixed(2);

function roundedRect(x: number, y: number, side: number, r: number): string {
  const s = side - 2 * r;
  return `M${f(x + r)},${f(y)}h${f(s)}a${f(r)},${f(r)} 0 0 1 ${f(r)},${f(r)}v${f(s)}a${f(r)},${f(r)} 0 0 1 -${f(r)},${f(r)}h-${f(s)}a${f(r)},${f(r)} 0 0 1 -${f(r)},-${f(r)}v-${f(s)}a${f(r)},${f(r)} 0 0 1 ${f(r)},-${f(r)}z`;
}

/** Finder corner radii in modules: the outer ring, its hole, the center square. */
const EYE = { ring: 2.3, hole: 1.5, center: 1.1 };

export function qrSvg(
  text: string,
  { quiet = 3, dot = 0.86, clear = 7, dark = '#171717', light = '#ffffff' }: QrOptions = {},
): { svg: string; size: number; unit: number } {
  const { size, dark: isDark } = qrMatrix(text);
  const total = size + quiet * 2;
  const inFinder = (row: number, column: number) =>
    (row < 7 && column < 7) || (row < 7 && column >= size - 7) || (row >= size - 7 && column < 7);
  const start = Math.floor((size - clear) / 2);
  const inClear = (row: number, column: number) =>
    clear > 0 && row >= start && row < start + clear && column >= start && column < start + clear;

  const r = dot / 2;
  let dots = '';

  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (!isDark(row, column) || inFinder(row, column) || inClear(row, column)) {
        continue;
      }

      const cx = column + quiet + 0.5;
      const cy = row + quiet + 0.5;
      dots += `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1 0 ${f(dot)},0a${f(r)},${f(r)} 0 1 0 -${f(dot)},0z`;
    }
  }

  const parts: string[] = [];

  if (light) {
    parts.push(`<rect width="${total}" height="${total}" fill="${light}"/>`);
  }

  parts.push(`<path d="${dots}" fill="${dark}"/>`);

  for (const [row, column] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    const x = column + quiet;
    const y = row + quiet;
    parts.push(`<path d="${roundedRect(x, y, 7, EYE.ring)}${roundedRect(x + 1, y + 1, 5, EYE.hole)}" fill="${dark}" fill-rule="evenodd"/>`);
    parts.push(`<path d="${roundedRect(x + 2, y + 2, 3, EYE.center)}" fill="${dark}"/>`);
  }

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="QR code to lucasflatwhite.com">${parts.join('')}</svg>`,
    size,
    unit: 1,
  };
}
