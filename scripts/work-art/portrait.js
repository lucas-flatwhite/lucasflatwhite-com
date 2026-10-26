import { mulberry, nz } from './engrave.js';

/*
 * lucasflatwhite.com's picture for Work: the site's self-portrait as a cat seated in the
 * blue whorls of Van Gogh's 1889 self-portrait, painted in words instead of brushstrokes.
 * Every stroke is a stream of words set along the field; each word swells in weight and
 * width (Anybody's wght and wdth axes) the way a loaded brush does mid-stroke.
 *
 * The random stream is consumed in a fixed order (ground streams, ground words, cat
 * streams, cat words, outline), so seed 63 always paints the approved picture.
 */

const NS = 'http://www.w3.org/2000/svg';
const W = 720;
const H = 480;
const SEED = 63;
const C = {
  deep: '#16278a', ink: '#0e1a5e', foam: '#f2f3f7', dim: '#b8c1ee', crema: '#ffc457',
  b1: '#2b43c8', b2: '#3d57d9', b3: '#5b6fe0', b4: '#8494ea',
  c1: '#ffd27a', c2: '#f2a93b', c3: '#ffe7b0', c4: '#d98a2b',
  underpaint: '#5c3a1e',
};
const FAMILY = "Anybody, 'Noto Sans KR', sans-serif";

/* The sitter, seated three-quarter with the face turned to the viewer's left. */
const SITTER = {
  headX: 314,
  headY: 232,
  body(g) {
    g.translate(-36, 0);
    g.beginPath(); g.ellipse(350, 168, 80, 66, -0.05, 0, 7); g.fill();
    g.beginPath(); g.moveTo(281, 158); g.lineTo(290, 66); g.lineTo(342, 112); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(364, 108); g.lineTo(424, 72); g.lineTo(428, 160); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(362, 300, 86, 108, 0.08, 0, 7); g.fill();
    g.beginPath(); g.ellipse(430, 372, 124, 96, -0.1, 0, 7); g.fill();
    g.beginPath(); g.roundRect(312, 300, 38, 150, 18); g.fill();
    g.beginPath(); g.roundRect(360, 306, 38, 148, 18); g.fill();
    g.beginPath(); g.ellipse(328, 452, 28, 13, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(382, 455, 28, 13, 0, 0, 7); g.fill();
    g.lineWidth = 26;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(546, 418); g.bezierCurveTo(590, 466, 530, 476, 420, 469); g.stroke();
  },
  /* The pale chest and muzzle. */
  bib(g) {
    g.translate(-36, 0);
    g.beginPath(); g.ellipse(340, 292, 46, 84, 0.05, 0, 7); g.fill();
    g.beginPath(); g.ellipse(330, 206, 42, 26, 0, 0, 7); g.fill();
  },
  /* The whorls of the ground; s is the turning direction. */
  vort: [
    { x: 92, y: 96, r: 120, s: 1 }, { x: 636, y: 92, r: 130, s: -1 }, { x: 70, y: 392, r: 120, s: -1 },
    { x: 650, y: 396, r: 120, s: 1 }, { x: 196, y: 250, r: 80, s: 1 }, { x: 566, y: 236, r: 90, s: -1 },
  ],
};

const GROUND = {
  cell: 8, size: 10, weight: [250, 760],
  colours: [[C.b2, 4], [C.b3, 3], [C.b1, 2], [C.b4, 1.6], [C.dim, 0.8]],
};
const CAT = {
  cell: 6, size: 9.4, weight: [500, 900],
  colours: [[C.c1, 5], [C.crema, 4], [C.c2, 2.4], [C.c3, 1]],
  bib: [[C.c3, 4], [C.foam, 2.5], [C.c1, 1]],
};
const GROUND_WORDS = ['typeface', 'kerning', 'viewport', 'pretext', 'layout', 'render', 'canvas', 'repaint', 'spacing', 'motion', 'contrast', 'branch', 'commit', 'deploy', 'vector', 'grid', 'palette', 'ultramarine', 'impasto', 'brushstroke', 'swirl', 'van Gogh', 'pigment', 'gesso', 'atelier', '커밋', '여백', '붓터치', '물감', '캔버스', '소용돌이', '유화', '고흐', '타이포', '브랜치', '렌더링', '덧칠', '밑그림'];
const CAT_WORDS = ['cat', 'purr', 'whisker', 'nap', 'tabby', 'paw', 'meow', 'lucas', 'flatwhite', '고양이', '야옹', '수염', '낮잠', '꼬리', '골골', '식빵', '냥', '루카스', '플랫화이트'];

const at = (arr, x, y) => arr[Math.max(0, Math.min(H - 1, y | 0)) * W + Math.max(0, Math.min(W - 1, x | 0))];

function raster(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.fillStyle = g.strokeStyle = '#000';
  draw(g);
  const data = g.getImageData(0, 0, W, H).data;
  const alpha = new Float32Array(W * H);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] / 255;
  return alpha;
}

/* Three box blurs, close enough to a Gaussian to read the silhouette's edge direction from. */
function blur(src, r) {
  const a = Float32Array.from(src);
  const b = new Float32Array(W * H);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[y * W + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        b[y * W + x] = s / (2 * r + 1);
        s += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        a[y * W + x] = s / (2 * r + 1);
        s += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x];
      }
    }
  }
  return a;
}

/* Ground the frame's edge can't reach, such as the gap a curled tail closes off, belongs to the cat. */
function filled(mask) {
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || mask[i] > 0.5) continue;
    seen[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * (H - 1)) stack.push(i + W);
  }
  for (let i = 0; i < mask.length; i++) if (!seen[i]) mask[i] = 1;
  return mask;
}

/* Strokes have no head or tail, so angles blend on the doubled circle. */
function mix(a, b, t) {
  const x = Math.cos(2 * a) * (1 - t) + Math.cos(2 * b) * t;
  const y = Math.sin(2 * a) * (1 - t) + Math.sin(2 * b) * t;
  return Math.atan2(y, x) / 2;
}

function scene() {
  const mask = filled(raster(SITTER.body));
  const bibMask = raster(SITTER.bib);
  const soft = blur(mask, 9);
  const inCat = (x, y) => at(mask, x, y) > 0.5;

  /* Fur runs down the body and out from the face; the ground whorls, and bends round the sitter as a halo. */
  function angle(x, y) {
    const gx = at(soft, x + 2, y) - at(soft, x - 2, y);
    const gy = at(soft, x, y + 2) - at(soft, x, y - 2);
    const tangent = Math.atan2(gy, gx) + Math.PI / 2;
    if (inCat(x, y)) {
      const fur = Math.PI / 2 + 0.5 * (nz(x * 0.02 + y * 0.01) - 0.5) + (y < SITTER.headY ? 0.9 * Math.sign(x - SITTER.headX) : 0);
      return mix(fur, tangent, Math.min(1, Math.hypot(gx, gy) * 9));
    }
    let vx = 0.18;
    let vy = -0.05;
    for (const v of SITTER.vort) {
      const dx = x - v.x;
      const dy = y - v.y;
      const d = Math.hypot(dx, dy) + 1;
      const w = v.s * Math.exp(-(d * d) / (v.r * v.r));
      vx += (-dy / d) * w;
      vy += (dx / d) * w;
    }
    let a = Math.atan2(vy, vx);
    const s = at(soft, x, y);
    if (s > 0.01) a = mix(a, tangent, Math.min(1, s * 4));
    return a + (nz(x * 0.021 + y * 0.013 + 7) - 0.5) * 0.6;
  }

  function trace(x, y, len, step, keep, dir) {
    const pts = [[x, y]];
    let hx = dir * Math.cos(angle(x, y));
    let hy = dir * Math.sin(angle(x, y));
    for (let i = 0; i < len / step; i++) {
      const a = angle(x, y);
      let dx = Math.cos(a);
      let dy = Math.sin(a);
      if (dx * hx + dy * hy < 0) {
        dx = -dx;
        dy = -dy;
      }
      x += dx * step;
      y += dy * step;
      hx = dx;
      hy = dy;
      if (x < 0 || y < 0 || x >= W || y >= H || !keep(x, y)) break;
      pts.push([x, y]);
    }
    return pts;
  }

  /* Evenly spaced streams, one occupancy grid per side of the silhouette so each side keeps its own density. */
  function streams(rng, inside, cell, minLen) {
    const gw = Math.ceil(W / cell);
    const gh = Math.ceil(H / cell);
    const owner = new Int32Array(gw * gh).fill(-1);
    const out = [];
    const free = (x, y, id) => {
      const cx = (x / cell) | 0;
      const cy = (y / cell) | 0;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const o = owner[Math.min(gh - 1, Math.max(0, cy + j)) * gw + Math.min(gw - 1, Math.max(0, cx + i))];
          if (o !== -1 && o !== id) return false;
        }
      }
      return true;
    };
    /* Each whorl keeps an empty eye, or its tightest turns pile the letters into a knot. */
    const eye = (x, y) => SITTER.vort.some((v) => Math.hypot(x - v.x, y - v.y) < 18);
    const seeds = [];
    const gap = cell * 1.6;
    for (let y = 0; y < H; y += gap) for (let x = 0; x < W; x += gap) seeds.push([x + rng() * gap, y + rng() * gap]);
    for (let i = seeds.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
    }
    for (const [sx, sy] of seeds) {
      if (inCat(sx, sy) !== inside || !free(sx, sy, -2) || eye(sx, sy)) continue;
      const id = out.length;
      const keep = (x, y) => inCat(x, y) === inside && free(x, y, id) && !eye(x, y);
      const pts = trace(sx, sy, 260, 2.5, keep, -1).reverse().concat(trace(sx, sy, 260, 2.5, keep, 1).slice(1));
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (len < minLen) continue;
      for (const [x, y] of pts) owner[((y / cell) | 0) * gw + ((x / cell) | 0)] = id;
      if (pts[pts.length - 1][0] < pts[0][0]) pts.reverse();
      out.push({ pts, len, onBib: at(bibMask, sx, sy) > 0.5 });
    }
    return out;
  }

  /* Short dark dashes along the silhouette, the way the painter ringed a figure in blue. */
  function outline(rng, width) {
    let d = '';
    for (let y = 4; y < H; y += 5) {
      for (let x = 4; x < W; x += 5) {
        const jx = x + (rng() - 0.5) * 4;
        const jy = y + (rng() - 0.5) * 4;
        const s = at(soft, jx, jy);
        if (s < 0.42 || s > 0.58 || rng() > 0.55) continue;
        const a = Math.atan2(at(soft, jx, jy + 2) - at(soft, jx, jy - 2), at(soft, jx + 2, jy) - at(soft, jx - 2, jy)) + Math.PI / 2;
        const l = 6 + rng() * 6;
        d += `M${(jx - Math.cos(a) * l).toFixed(1)} ${(jy - Math.sin(a) * l).toFixed(1)}L${(jx + Math.cos(a) * l).toFixed(1)} ${(jy + Math.sin(a) * l).toFixed(1)}`;
      }
    }
    return `<path d="${d}" stroke="${C.ink}" stroke-width="${width}" stroke-linecap="round" fill="none"/>`;
  }

  /* A warm ground laid under the cat's words in 4px bands, so the fur reads as one body. */
  function underpaint() {
    let rects = '';
    for (let y = 0; y < H; y += 4) {
      let run = -1;
      for (let x = 0; x <= W; x++) {
        const on = x < W && mask[y * W + x] > 0.5;
        if (on && run < 0) run = x;
        if (!on && run >= 0) {
          rects += `<rect x="${run}" y="${y}" width="${x - run}" height="4"/>`;
          run = -1;
        }
      }
    }
    return `<g fill="${C.underpaint}" fill-opacity="0.9">${rects}</g>`;
  }

  return { streams, outline, underpaint };
}

function face() {
  const o = (x) => x - 36;
  return [
    `<g stroke="${C.ink}" stroke-width="3" stroke-linejoin="round">`,
    `<path d="M${o(296)} 160 Q${o(314)} 146 ${o(334)} 158 Q${o(314)} 172 ${o(296)} 160Z" fill="${C.dim}"/>`,
    `<path d="M${o(350)} 156 Q${o(370)} 142 ${o(390)} 154 Q${o(370)} 169 ${o(350)} 156Z" fill="${C.dim}"/>`,
    '</g>',
    `<ellipse cx="${o(315)}" cy="159" rx="3.6" ry="8" fill="${C.ink}"/>`,
    `<ellipse cx="${o(370)}" cy="155.5" rx="3.6" ry="8" fill="${C.ink}"/>`,
    `<circle cx="${o(318)}" cy="155" r="1.6" fill="${C.foam}"/><circle cx="${o(373)}" cy="151.5" r="1.6" fill="${C.foam}"/>`,
    `<path d="M${o(326)} 190 L${o(342)} 190 L${o(334)} 199Z" fill="${C.c4}" stroke="${C.ink}" stroke-width="2"/>`,
    `<path d="M${o(334)} 199 L${o(334)} 206 M${o(334)} 206 Q${o(326)} 214 ${o(318)} 208 M${o(334)} 206 Q${o(342)} 214 ${o(350)} 208" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`,
    `<g stroke="${C.foam}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".9">`,
    `<path d="M${o(312)} 202 Q${o(280)} 192 ${o(246)} 190"/><path d="M${o(312)} 207 Q${o(278)} 205 ${o(244)} 208"/><path d="M${o(314)} 212 Q${o(284)} 218 ${o(252)} 228"/>`,
    `<path d="M${o(356)} 200 Q${o(392)} 188 ${o(426)} 186"/><path d="M${o(357)} 205 Q${o(394)} 203 ${o(430)} 206"/><path d="M${o(356)} 210 Q${o(388)} 218 ${o(420)} 228"/>`,
    '</g>',
  ].join('');
}

const pick = (rng, list) => {
  let r = rng() * list.reduce((sum, [, w]) => sum + w, 0);
  for (const [colour, w] of list) if ((r -= w) <= 0) return colour;
  return list[0][0];
};

/* Enough words to run a stream's length, estimated from character count at the side's size. */
const wordsFor = (rng, pool, len, per) => {
  const out = [];
  let used = 0;
  while (used < len) {
    const word = pool[(rng() * pool.length) | 0];
    out.push(word);
    used += (word.length + 1) * per;
  }
  return out;
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The portrait as a standalone SVG document, before its fonts are embedded. */
export function portrait() {
  const sc = scene();
  const rng = mulberry(SEED);
  let defs = '';
  let n = 0;

  /* Lays words along each stream; within a stream each word swells by p = sin(pi t), like brush pressure. */
  const lay = (list, side, pool) => {
    let body = '';
    for (const stream of list) {
      const d = 'M' + stream.pts
        .filter((_, k) => k % 2 === 0 || k === stream.pts.length - 1)
        .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
        .join('L');
      defs += `<path id="s${n}" d="${d}"/>`;
      const fill = pick(rng, stream.onBib && side.bib ? side.bib : side.colours);
      const words = wordsFor(rng, pool, stream.len * 1.15, side.size * 0.56);
      const spans = words.map((word, k) => {
        const t = words.length > 1 ? k / (words.length - 1) : 0.5;
        const p = Math.sin(Math.PI * t) * (0.6 + 0.4 * rng());
        return `<tspan style="font-stretch:${Math.round(70 + 60 * p)}%">${esc(word)} </tspan>`;
      });
      body += `<text font-size="${side.size}" fill="${fill}"><textPath href="#s${n}">${spans.join('')}</textPath></text>`;
      n++;
    }
    return body;
  };

  const ground = lay(sc.streams(rng, false, GROUND.cell, 34), GROUND, GROUND_WORDS);
  const cat = lay(sc.streams(rng, true, CAT.cell, 20), CAT, CAT_WORDS);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  svg.innerHTML =
    `<rect width="${W}" height="${H}" fill="${C.deep}"/><defs>${defs}</defs>` +
    `<g id="strokes" font-family="${FAMILY}">` +
    `${ground}${sc.underpaint()}${cat}` +
    `</g>${sc.outline(rng, 2.4)}${face()}`;
  return new XMLSerializer().serializeToString(svg);
}
