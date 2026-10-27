/*
 * Liquid glass drawn inside an SVG, for the Work pictures. A pane redraws whatever lies
 * behind it, a little magnified, and bends it near the rim with feDisplacementMap. The
 * refraction map and the rim light come from the pane's signed distance field; the mask
 * and the shadow are the rounded rectangle itself. Nothing here uses backdrop-filter.
 */

export const W = 720;
export const H = 480;

/* Light falls from the upper left. */
const LIGHT = [-0.62, -0.78];
/* Pixels per SVG unit: the refraction map is smooth and stays sharp at half the rim light's density. */
const MAP_RES = 1;
const LIGHT_RES = 2;
/* Room around the pane for the rim light. */
const PAD = 6;

export function svgRoot(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
}

/** Signed distance to a rounded rectangle: negative inside, zero on the edge. */
export function roundedBox({ x, y, w, h, r }) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  return (px, py) => {
    const qx = Math.abs(px - cx) - (w / 2 - r);
    const qy = Math.abs(py - cy) - (h / 2 - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
}

export function radialField(id, [inner, mid, outer], cx, cy) {
  return `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="0.95">` +
    `<stop offset="0" stop-color="${inner}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${outer}"/>` +
    `</radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
}

const area = (box) => ({ x: box.x - PAD, y: box.y - PAD, w: box.w + PAD * 2, h: box.h + PAD * 2 });
const place = ({ x, y, w, h }) => `x="${x}" y="${y}" width="${w}" height="${h}"`;
const shape = ({ x, y, w, h, r }) => `x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"`;

/* The refraction map (R, G = how far to shift x, y) or the rim light, drawn as a PNG. */
function paint(box, res, shade) {
  const sdf = roundedBox(box);
  const a = area(box);
  const cw = Math.ceil(a.w * res);
  const ch = Math.ceil(a.h * res);
  const cv = document.createElement('canvas');
  cv.width = cw;
  cv.height = ch;
  const g = cv.getContext('2d');
  const img = g.createImageData(cw, ch);

  for (let j = 0; j < ch; j++) {
    for (let i = 0; i < cw; i++) {
      const px = a.x + (i + 0.5) / res;
      const py = a.y + (j + 0.5) / res;
      const d = sdf(px, py);
      let nx = sdf(px + 0.5, py) - sdf(px - 0.5, py);
      let ny = sdf(px, py + 0.5) - sdf(px, py - 0.5);
      const n = Math.hypot(nx, ny) || 1;
      img.data.set(shade(d, nx / n, ny / n, res), (j * cw + i) * 4);
    }
  }

  g.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}

/* A circular bezel: no bend in the flat middle, the most at the rim. */
const bend = (bezel) => (d, nx, ny) => {
  const t = d < 0 && d > -bezel ? 1 + d / bezel : 0;
  const m = t ? 1 - Math.sqrt(Math.max(0, 1 - t * t)) : 0;
  return [Math.round(127.5 + nx * m * 127), Math.round(127.5 + ny * m * 127), 128, 255];
};

/* A bright hairline where the light grazes the rim, a soft band just inside it. */
const shine = (bezel, light) => (d, nx, ny, res) => {
  if (d >= 1) return [255, 255, 255, 0];
  const cover = Math.min(1, Math.max(0, 0.5 - d * res));
  const facing = nx * LIGHT[0] + ny * LIGHT[1];
  const spec = Math.max(0, facing) ** 1.6 + 0.55 * Math.max(0, -facing) ** 2.2;
  const edge = Math.exp(-((d + 1.1) ** 2) / 1.1);
  const band = d < 0 ? Math.exp(-((d + bezel * 0.18) ** 2) / (bezel * 0.9)) : 0;
  const alpha = Math.round(Math.min(1, (edge * (0.22 + 0.9 * spec) + band * (0.08 + 0.35 * spec)) * light) * cover * 255);
  // Below 3/255 the light can't be seen, and leaving those pixels empty keeps the PNG small.
  return [255, 255, 255, alpha < 3 ? 0 : alpha];
};

/** The filters, mask and rim light one pane shape needs. Panes of the same shape share them. */
export function glassDefs(id, box, { bezel, shift, frost, shadowColor, light = 1, lightRes = LIGHT_RES }) {
  const map = paint(box, MAP_RES, bend(bezel));
  const lit = paint(box, lightRes, shine(bezel, light));
  const a = area(box);
  const room = `x="${a.x - 80}" y="${a.y - 80}" width="${a.w + 160}" height="${a.h + 160}"`;

  return `<defs>` +
    `<image id="${id}-li" href="${lit}" ${place(a)} preserveAspectRatio="none"/>` +
    `<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect ${shape(box)} fill="#fff"/></mask>` +
    `<filter id="${id}-f" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" ${room} color-interpolation-filters="sRGB">` +
    `<feImage href="${map}" ${place(a)} preserveAspectRatio="none" result="map"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${shift * 2}" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feGaussianBlur stdDeviation="${frost}"/></filter>` +
    `<filter id="${id}-s" filterUnits="userSpaceOnUse" ${room}><feGaussianBlur stdDeviation="${Math.max(6, Math.min(box.w, box.h) * 0.09)}"/></filter>` +
    `</defs>`;
}

/** One pane: its shadow, the backdrop redrawn and bent inside it, a tint, anything set on it, the rim light. */
export function glassPane(id, box, { backdrop, mag, tint, tintColor = '#ffffff', shadow, shadowColor, edge = 0, inner = '' }) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const drop = Math.min(box.w, box.h) * 0.1;
  const rim = edge
    ? `<rect x="${box.x + 0.5}" y="${box.y + 0.5}" width="${box.w - 1}" height="${box.h - 1}" rx="${box.r}" fill="none" stroke="#171717" stroke-opacity="${edge}"/>`
    : '';

  return `<rect ${shape(box)} fill="${shadowColor}" filter="url(#${id}-s)" opacity="${shadow}" transform="translate(0 ${drop})"/>` +
    `<g mask="url(#${id}-m)">` +
    `<g filter="url(#${id}-f)"><g transform="translate(${cx} ${cy}) scale(${mag}) translate(${-cx} ${-cy})">${backdrop}</g></g>` +
    `<rect ${shape(box)} fill="${tintColor}" fill-opacity="${tint}"/>${inner}</g>` +
    `<use href="#${id}-li"/>${rim}`;
}
