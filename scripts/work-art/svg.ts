/*
 * Node side of the Work pictures: turns the engraver's raw cut lines into a lean SVG.
 * The engraver samples every 2px, so a plate's path runs to about 580KB. Nearly all of
 * those points sit on gentle curves, and dropping the ones within 0.15px of the line
 * through their neighbours leaves a plate that looks the same at 2x for a sixth the size.
 */

type Point = [number, number];

export const WIDTH = 720;
export const HEIGHT = 480;
const GROUND = '#16278a';
const CUT = '#f2f3f7';

/** Ramer-Douglas-Peucker: keeps the points that bend the line by more than `tolerance`. */
function reduce(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) {
    return points;
  }

  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let furthest = 0;
  let at = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const distance = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;

    if (distance > furthest) {
      furthest = distance;
      at = i;
    }
  }

  if (furthest <= tolerance) {
    return [points[0], points[points.length - 1]];
  }

  return reduce(points.slice(0, at + 1), tolerance).slice(0, -1).concat(reduce(points.slice(at), tolerance));
}

const half = (value: number) => Math.round(value * 2) / 2;
const print = (value: number) => String(value).replace(/^(-?)0\./, '$1.');

/**
 * Rewrites absolute `M x yL x y...Z` subpaths as `M x y` plus relative `l dx dy` steps on a
 * half-pixel grid. Each step is measured from the previous rounded point, so rounding never
 * drifts along a line.
 */
export function simplifyPath(d: string, tolerance: number): string {
  return d
    .split('M')
    .filter(Boolean)
    .map((subpath) => {
      const points = subpath
        .replace(/Z\s*$/, '')
        .split('L')
        .map((pair) => pair.trim().split(/\s+/).map(Number) as Point);
      const kept = reduce(points, tolerance).map(([x, y]) => [half(x), half(y)] as Point);
      let [px, py] = kept[0];
      let out = `M${print(px)} ${print(py)}`;

      for (const [x, y] of kept.slice(1)) {
        const dy = y - py;
        out += `l${print(x - px)}${dy < 0 ? '' : ' '}${print(dy)}`;
        [px, py] = [x, y];
      }

      return `${out}z`;
    })
    .join('');
}

/** The plate as a standalone document: one cut path on the deep blue ground. */
export function plateSvg(d: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${GROUND}"/>` +
    `<path d="${d}" fill="${CUT}"/>` +
    '</svg>\n'
  );
}
