/*
 * Cartoon pictures of one letter of the name. Each picture is plain SVG: outlines, flat
 * fills and patterns, with no filters or images, so drawing one costs almost nothing.
 * A theme picks the colours and props (a balloon string, cat ears), a style picks how
 * the body is inked, and the whole picture is tilted by one of a few fixed angles.
 */

export const GLYPH_THEMES = ['coffee', 'balloon', 'cat', 'bulb', 'phone', 'music', 'lounge'] as const;
export const GLYPH_STYLES = ['ink', 'pop', 'block', 'sticker'] as const;
export const GLYPH_ANGLES = [-12, -8, -4, 4, 8, 12] as const;
export const GLYPH_WEIGHT = 760;

export type GlyphTheme = (typeof GLYPH_THEMES)[number];
export type GlyphStyle = (typeof GLYPH_STYLES)[number];
export type Glyph = { theme: GlyphTheme; style: GlyphStyle; angle: number };

type Attrs = Record<string, string | number>;
type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };
type Palette = { base: string; shade: string };

type Ctx = {
  ch: string;
  fs: number;
  ow: number;
  style: GlyphStyle;
  id: string;
  n: number;
  defs: SVGDefsElement;
  text: Attrs;
  bb: Box;
  clip?: string;
  topAt(f: number): Point;
  botAt(f: number): Point;
  lowest(): Point;
};

type Theme = {
  palette(c: Ctx): Palette;
  back?(c: Ctx, g: SVGGElement, p: Palette): void;
  detail?(c: Ctx, g: SVGGElement, p: Palette): void;
  front?(c: Ctx, g: SVGGElement, p: Palette): void;
  noGlint?: boolean;
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = '#151515';
const TRACKING = 0.055;
let count = 0;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  parent?.appendChild(node);
  return node;
}

function nextId(c: Ctx): string {
  c.n += 1;
  return `${c.id}-${c.n}`;
}

function dotPattern(c: Ctx, size: number): string {
  const id = nextId(c);
  const p = el('pattern', { id, width: size, height: size, patternUnits: 'userSpaceOnUse' }, c.defs);
  el('circle', { cx: size / 2, cy: size / 2, r: size * 0.28, fill: INK, opacity: 0.45 }, p);
  return `url(#${id})`;
}

function hardSplit(c: Ctx, a: string, b: string): string {
  const id = nextId(c);
  const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, c.defs);
  for (const [offset, colour] of [[0, a], [0.5, a], [0.5, b], [1, b]] as const) {
    el('stop', { offset, 'stop-color': colour }, g);
  }
  return `url(#${id})`;
}

function letter(c: Ctx, parent: Element, attrs: Attrs = {}): SVGTextElement {
  const t = el('text', { ...c.text, ...attrs }, parent);
  t.textContent = c.ch;
  return t;
}

function clipped(c: Ctx, parent: Element): SVGGElement {
  if (!c.clip) {
    const id = nextId(c);
    letter(c, el('clipPath', { id }, c.defs));
    c.clip = `url(#${id})`;
  }
  return el('g', { 'clip-path': c.clip }, parent);
}

function inked(c: Ctx, extra: Attrs = {}): Attrs {
  return { stroke: INK, 'stroke-width': c.ow, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra };
}

function star(x: number, y: number, r: number): string {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`;
}

/* Where the heavy glyph has ink, column by column, so props land on the letter itself. */
type Ink = { ox: number; oy: number; top: (number | null)[]; bot: (number | null)[]; x0: number; x1: number; y0: number; y1: number };
const inkCache = new Map<string, Ink>();

function inkOf(ch: string, fs: number, family: string): Ink | null {
  const key = `${ch}|${fs}|${family}`;
  const cached = inkCache.get(key);
  if (cached) {
    return cached;
  }

  const w = Math.ceil(fs * 2);
  const h = Math.ceil(fs * 2);
  const ox = w / 2;
  const oy = Math.round(fs * 1.4);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return null;
  }
  ctx.font = `${GLYPH_WEIGHT} ${fs}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(ch, ox, oy);

  const data = ctx.getImageData(0, 0, w, h).data;
  const top: (number | null)[] = new Array(w).fill(null);
  const bot: (number | null)[] = new Array(w).fill(null);
  let x0 = w;
  let x1 = -1;
  let y0 = h;
  let y1 = -1;
  for (let i = 0; i < w; i += 1) {
    for (let j = 0; j < h; j += 1) {
      if (data[(j * w + i) * 4 + 3] > 128) {
        top[i] ??= j;
        bot[i] = j;
        x0 = Math.min(x0, i);
        x1 = Math.max(x1, i);
        y0 = Math.min(y0, j);
        y1 = Math.max(y1, j);
      }
    }
  }
  if (x1 < 0) {
    return null;
  }

  const ink = { ox, oy, top, bot, x0, x1, y0, y1 };
  inkCache.set(key, ink);
  return ink;
}

function nearestColumn(target: number, column: (number | null)[]): number {
  for (let d = 0; d < column.length; d += 1) {
    for (const i of [target - d, target + d]) {
      if (column[i] != null) {
        return i;
      }
    }
  }
  return target;
}

const BALLOONS = [
  ['#ff4d4d', '#c2182b'],
  ['#3b74ff', '#1c3fb0'],
  ['#ffc21f', '#d98a00'],
  ['#ff6fb4', '#c42a76'],
  ['#2cc48a', '#118057'],
] as const;

const THEMES: Record<GlyphTheme, Theme> = {
  coffee: {
    palette: () => ({ base: '#9a5426', shade: '#5e2d10' }),
    detail(c, g) {
      const { bb, fs, ow } = c;
      const y = bb.y + bb.height * 0.3;
      const waves = 5;
      const w = (bb.width + fs * 0.2) / waves;
      let d = `M${bb.x - fs * 0.1} ${bb.y - fs * 0.1} V${y}`;
      for (let i = 0; i < waves; i += 1) {
        d += ` q ${w / 2} ${(i % 2 ? -1 : 1) * fs * 0.04} ${w} 0`;
      }
      d += ` V${bb.y - fs * 0.1} Z`;
      el('path', { d, fill: '#f2c68b', ...inked(c, { 'stroke-width': ow * 0.8 }) }, g);
    },
    front(c, g) {
      const { fs, ow } = c;
      [0.25, 0.55, 0.85].forEach((f, i) => {
        const p = c.topAt(f);
        const rise = fs * 0.28;
        const d = `M${p.x} ${p.y - fs * 0.06} c ${-fs * 0.07} ${-rise * 0.3} ${fs * 0.07} ${-rise * 0.6} 0 ${-rise}`;
        const wisp = el('g', { class: 'name-glyph-float', style: `animation-delay: ${-i * 0.4}s` }, g);
        el('path', { d, fill: 'none', ...inked(c, { 'stroke-width': ow * 3.2 }) }, wisp);
        el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': ow * 1.4, 'stroke-linecap': 'round' }, wisp);
      });
    },
  },
  balloon: {
    palette: () => {
      const [base, shade] = BALLOONS[Math.floor(Math.random() * BALLOONS.length)];
      return { base, shade };
    },
    back(c, g, p) {
      const { fs, ow } = c;
      const k = c.lowest();
      const string = `M${k.x} ${k.y + fs * 0.04} q ${fs * 0.1} ${fs * 0.14} ${-fs * 0.02} ${fs * 0.26} t ${fs * 0.02} ${fs * 0.2}`;
      el('path', { d: string, fill: 'none', ...inked(c, { 'stroke-width': ow * 0.8 }), class: 'name-glyph-float' }, g);
      el('path', { d: `M${k.x - fs * 0.04} ${k.y + fs * 0.06} L${k.x} ${k.y - fs * 0.01} L${k.x + fs * 0.04} ${k.y + fs * 0.06} Z`, fill: p.shade, ...inked(c) }, g);
    },
  },
  cat: {
    palette: () => ({ base: '#f59c3f', shade: '#c9661a' }),
    back(c, g, p) {
      const { fs, ow } = c;
      const t = c.botAt(0.95);
      const tail = `M${t.x - fs * 0.05} ${t.y - fs * 0.05} c ${fs * 0.18} ${fs * 0.02} ${fs * 0.23} ${-fs * 0.2} ${fs * 0.11} ${-fs * 0.33}`;
      el('path', { d: tail, fill: 'none', stroke: INK, 'stroke-width': fs * 0.075 + ow * 2, 'stroke-linecap': 'round' }, g);
      el('path', { d: tail, fill: 'none', stroke: p.base, 'stroke-width': fs * 0.075, 'stroke-linecap': 'round' }, g);
      [0.2, 0.8].forEach((f, i) => {
        const top = c.topAt(f);
        const side = i ? 1 : -1;
        const h = fs * 0.19;
        const w = fs * 0.17;
        const y = top.y + fs * 0.07;
        el('path', { d: `M${top.x - w / 2} ${y} L${top.x + side * w * 0.12} ${y - h} L${top.x + w / 2} ${y} Z`, fill: p.base, ...inked(c) }, g);
        el('path', { d: `M${top.x - w * 0.2} ${y - h * 0.15} L${top.x + side * w * 0.08} ${y - h * 0.65} L${top.x + w * 0.2} ${y - h * 0.15} Z`, fill: '#ffb3c1' }, g);
      });
    },
    detail(c, g, p) {
      const { bb, fs } = c;
      for (let x = bb.x + fs * 0.02; x < bb.x + bb.width; x += fs * 0.13) {
        el('path', { d: `M${x} ${bb.y - fs * 0.05} l ${fs * 0.05} ${fs * 0.14} l ${-fs * 0.05} ${fs * 0.02} Z`, fill: p.shade }, g);
      }
    },
    front(c, g) {
      const { bb, fs, ow } = c;
      const y = bb.y + bb.height * 0.62;
      for (const [side, x] of [[-1, bb.x], [1, bb.x + bb.width]] as const) {
        for (const dy of [-0.05, 0, 0.05]) {
          el('line', { x1: x - side * fs * 0.03, y1: y + fs * dy * 0.6, x2: x + side * fs * 0.11, y2: y + fs * dy, ...inked(c, { 'stroke-width': ow * 0.7 }) }, g);
        }
      }
    },
  },
  bulb: {
    palette: () => ({ base: '#ffd83d', shade: '#f0a400' }),
    back(c, g) {
      const { bb, fs, ow } = c;
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height * 0.35;
      const r = bb.height * 0.45;
      for (const deg of [-155, -125, -90, -55, -25]) {
        const a = (deg * Math.PI) / 180;
        el('line', {
          x1: cx + Math.cos(a) * (r + fs * 0.04),
          y1: cy + Math.sin(a) * (r + fs * 0.04),
          x2: cx + Math.cos(a) * (r + fs * 0.15),
          y2: cy + Math.sin(a) * (r + fs * 0.15),
          ...inked(c, { 'stroke-width': ow * 1.2 }),
        }, g);
      }
      const k = c.lowest();
      const bw = fs * 0.15;
      el('rect', { x: k.x - bw / 2, y: k.y - fs * 0.02, width: bw, height: fs * 0.12, rx: fs * 0.02, fill: '#b9b9b9', ...inked(c) }, g);
      for (const dy of [0.025, 0.055]) {
        el('line', { x1: k.x - bw / 2, x2: k.x + bw / 2, y1: k.y + fs * dy, y2: k.y + fs * dy, ...inked(c, { 'stroke-width': ow * 0.7 }) }, g);
      }
    },
    detail(c, g) {
      const { bb, fs, ow } = c;
      let d = `M${bb.x + bb.width / 2} ${bb.y + bb.height} V${bb.y + bb.height * 0.4}`;
      for (let i = 0; i < 4; i += 1) {
        d += ` l ${(i % 2 ? 1 : -1) * fs * 0.03} ${-fs * 0.03}`;
      }
      el('path', { d, fill: 'none', stroke: '#e0590b', 'stroke-width': ow * 0.9, 'stroke-linejoin': 'round' }, g);
    },
  },
  phone: {
    palette: (c) => ({ base: hardSplit(c, '#8b6bff', '#ff7ab6'), shade: '#4c35b5' }),
    detail(c, g) {
      const { bb, fs } = c;
      const top = c.topAt(0.5);
      el('rect', { x: top.x - fs * 0.06, y: top.y + fs * 0.05, width: fs * 0.12, height: fs * 0.038, rx: fs * 0.019, fill: INK }, g);
      const d = `M${bb.x} ${bb.y + bb.height * 0.7} L${bb.x + bb.width} ${bb.y + bb.height * 0.1} l 0 ${fs * 0.06} L${bb.x} ${bb.y + bb.height * 0.7 + fs * 0.06} Z`;
      el('path', { d, fill: '#fff', opacity: 0.55 }, g);
    },
  },
  music: {
    noGlint: true,
    palette: () => ({ base: '#262626', shade: '#0d0d0d' }),
    detail(c, g) {
      const { bb, fs, ow } = c;
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height / 2;
      for (let r = fs * 0.16; r < fs; r += fs * 0.04) {
        el('circle', { cx, cy, r, fill: 'none', stroke: '#4a4a4a', 'stroke-width': ow * 0.45 }, g);
      }
      const sheen = `M${cx - fs * 0.5} ${cy - fs * 0.25} A ${fs * 0.55} ${fs * 0.55} 0 0 1 ${cx + fs * 0.1} ${cy - fs * 0.55}`;
      el('path', { d: sheen, fill: 'none', stroke: '#fff', 'stroke-width': ow * 1.2, 'stroke-linecap': 'round', opacity: 0.8 }, g);
      el('circle', { cx, cy, r: fs * 0.12, fill: '#ff4d4d', ...inked(c, { 'stroke-width': ow * 0.8 }) }, g);
      el('circle', { cx, cy, r: fs * 0.018, fill: '#fff' }, g);
    },
    front(c, g) {
      const { bb, fs, ow } = c;
      const notes = [
        ['♪', bb.x + bb.width + fs * 0.02, bb.y + fs * 0.1, 0.32, 0],
        ['♫', bb.x + bb.width * 0.2, bb.y - fs * 0.06, 0.26, -0.5],
      ] as const;
      for (const [note, x, y, size, delay] of notes) {
        const t = el('text', {
          x,
          y,
          'font-size': fs * size,
          'font-family': 'system-ui, sans-serif',
          fill: '#ff4d4d',
          'paint-order': 'stroke',
          class: 'name-glyph-float',
          style: `animation-delay: ${delay}s`,
          ...inked(c, { 'stroke-width': ow * 1.4 }),
        }, g);
        t.textContent = note;
      }
    },
  },
  lounge: {
    palette: () => ({ base: '#1f8a63', shade: '#0e5a3f' }),
    detail(c, g) {
      letter(c, g, { fill: 'none', stroke: '#f2c14e', 'stroke-width': c.ow * 2.2 });
    },
    front(c, g) {
      const { bb, fs, ow } = c;
      const stars = [
        [bb.x + bb.width + fs * 0.05, bb.y + fs * 0.08, fs * 0.09],
        [bb.x - fs * 0.06, bb.y + bb.height * 0.75, fs * 0.06],
      ] as const;
      for (const [x, y, r] of stars) {
        el('path', { d: star(x, y, r), fill: '#f2c14e', ...inked(c, { 'stroke-width': ow * 0.8 }) }, g);
      }
    },
  },
};

function drawBody(c: Ctx, g: SVGGElement, theme: Theme): void {
  const { fs, ow, bb, style } = c;
  const p = theme.palette(c);
  const thick = inked(c, { 'stroke-width': ow * 2 });

  if (style === 'sticker') {
    letter(c, g, { fill: '#000', stroke: '#000', 'stroke-width': ow * 6, 'stroke-linejoin': 'round', opacity: 0.12, transform: `translate(${fs * 0.02} ${fs * 0.03})` });
    letter(c, g, { fill: '#fff', stroke: '#fff', 'stroke-width': ow * 6, 'stroke-linejoin': 'round' });
  }
  theme.back?.(c, g, p);
  if (style === 'pop') {
    letter(c, g, { fill: INK, ...thick, transform: `translate(${fs * 0.055} ${fs * 0.065})` });
  }
  if (style === 'block') {
    const steps = 6;
    const step = fs * 0.013;
    for (let i = steps; i >= 1; i -= 1) {
      letter(c, g, { fill: 'none', ...thick, transform: `translate(${i * step} ${i * step})` });
    }
    for (let i = steps; i >= 1; i -= 1) {
      letter(c, g, { fill: p.shade, transform: `translate(${i * step} ${i * step})` });
    }
  }

  // The outline sits under the clipped body, so only its outer half shows.
  letter(c, g, { fill: 'none', ...thick });
  const body = clipped(c, g);
  const cover = { x: bb.x - fs * 0.1, y: bb.y - fs * 0.1, width: bb.width + fs * 0.2, height: bb.height + fs * 0.2 };
  el('rect', { ...cover, fill: p.shade }, body);
  if (style === 'pop') {
    el('rect', { ...cover, fill: dotPattern(c, fs * 0.045) }, body);
  }
  // The lit face is the letter nudged up and left; what it leaves uncovered reads as cel shade.
  letter(c, body, { fill: p.base, transform: `translate(${-fs * 0.03} ${-fs * 0.04})` });
  theme.detail?.(c, body, p);
  if (!theme.noGlint) {
    const x = bb.x + bb.width * 0.2;
    const y = bb.y + bb.height * 0.2;
    el('ellipse', { cx: x, cy: y, rx: fs * 0.025, ry: fs * 0.06, fill: '#fff', transform: `rotate(35 ${x} ${y})` }, body);
    el('circle', { cx: x + fs * 0.05, cy: y - fs * 0.045, r: fs * 0.015, fill: '#fff' }, body);
  }
  theme.front?.(c, g, p);
}

/*
 * Draws the picture over a letter element. The SVG takes the letter's own box and
 * baseline, so with overflow visible the picture lines up with the text it covers.
 */
export function drawGlyph(host: HTMLElement, ch: string, glyph: Glyph): SVGSVGElement | null {
  const style = getComputedStyle(host);
  const fs = parseFloat(style.fontSize);
  const family = style.fontFamily;
  const ink = inkOf(ch, fs, family);
  if (!ink) {
    return null;
  }

  const w = host.offsetWidth;
  const h = host.offsetHeight;
  const probe = document.createElement('i');
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  host.appendChild(probe);
  const base = probe.offsetTop;
  probe.remove();

  // letter-spacing trails the glyph, so its centre sits half the tracking right of the box centre.
  const cx = (w + TRACKING * fs) / 2;
  const x = (i: number) => cx + i - ink.ox;
  const y = (j: number) => base + j - ink.oy;
  const column = (f: number) => Math.round(ink.x0 + f * (ink.x1 - ink.x0));

  count += 1;
  const svg = el('svg', { class: 'name-glyph', width: w, height: h, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true', focusable: 'false' });
  const c: Ctx = {
    ch,
    fs,
    ow: Math.max(1.5, fs * 0.028),
    style: glyph.style,
    id: `name-glyph-${count}`,
    n: 0,
    defs: el('defs', {}, svg),
    text: { x: cx, y: base, 'text-anchor': 'middle', 'font-family': family, 'font-size': fs, 'font-weight': GLYPH_WEIGHT },
    bb: { x: x(ink.x0), y: y(ink.y0), width: ink.x1 - ink.x0, height: ink.y1 - ink.y0 },
    topAt(f) {
      const i = nearestColumn(column(f), ink.top);
      return { x: x(i), y: y(ink.top[i] ?? ink.y0) };
    },
    botAt(f) {
      const i = nearestColumn(column(f), ink.bot);
      return { x: x(i), y: y(ink.bot[i] ?? ink.y1) };
    },
    lowest() {
      let best = ink.ox;
      let found = false;
      for (let i = ink.x0; i <= ink.x1; i += 1) {
        const b = ink.bot[i];
        if (b != null && b >= ink.y1 - 2 && (!found || Math.abs(i - ink.ox) < Math.abs(best - ink.ox))) {
          best = i;
          found = true;
        }
      }
      return { x: x(best), y: y(ink.bot[best] ?? ink.y1) };
    },
  };

  const tilt = el('g', { transform: `rotate(${glyph.angle} ${c.bb.x + c.bb.width / 2} ${c.bb.y + c.bb.height / 2})` }, svg);
  drawBody(c, el('g', {}, tilt), THEMES[glyph.theme]);
  host.appendChild(svg);
  return svg;
}
