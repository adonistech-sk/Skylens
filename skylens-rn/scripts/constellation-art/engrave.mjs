// The SkyLens engraving renderer. It turns vector parts into a luminous, relief-lit
// figure in the style of the approved Orion: dark midnight form, fine light engraving lines
// that wrap the shape, a bright rim, and a little copper warmth. It is a printing press, not
// an artist: every shape it inks is set out point by point in a figure file, and no outside image
// goes into it. Parts are painted back to front. Every part is a raised surface, so overlaps cast
// shadows and read as depth. Plane units in, pixels out.

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Seeded, so the same figure always prints the same plate. */
export function random(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/**
 * A fair curve through points. Each point is [x, y, ...extra] and extras interpolate too, so a
 * limb's radius follows its spine. A point marked 'c' as its last element is a corner.
 */
export function spline(points, closed = false, step = 16) {
  const n = points.length;
  const isCorner = (p) => p[p.length - 1] === 'c';
  const P = points.map((p) => p.filter((v) => typeof v === 'number'));
  const dims = P[0].length;
  const at = (i) => P[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  const tangent = (i) => {
    if (isCorner(points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))])) return [0, 0];
    const a = at(i - 1), b = at(i + 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  };
  const out = [];
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const a = at(i), b = at(i + 1);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t0 = tangent(i), t1 = tangent(i + 1);
    for (let k = 0; k < step; k++) {
      const t = k / step, t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
      const p = [h00 * a[0] + h10 * t0[0] * len + h01 * b[0] + h11 * t1[0] * len, h00 * a[1] + h10 * t0[1] * len + h01 * b[1] + h11 * t1[1] * len];
      for (let d = 2; d < dims; d++) p.push(a[d] + (b[d] - a[d]) * (t * t * (3 - 2 * t)));
      out.push(p);
    }
  }
  if (!closed) out.push(P[n - 1].slice());
  return out;
}

/** Exact distance to the nearest zero, Felzenszwalb's lower-envelope transform. */
function distanceField(inside, w, h) {
  const INF = 1e12;
  const g = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = inside[i] ? INF : 0;
  const n = Math.max(w, h);
  const v = new Int32Array(n), z = new Float64Array(n + 1), f = new Float64Array(n), d = new Float64Array(n);
  const pass = (len) => {
    let k = 0;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s;
      do {
        const p = v[k];
        s = (f[q] + q * q - f[p] - p * p) / (2 * q - 2 * p);
        if (s <= z[k]) k--; else break;
      } while (k >= 0);
      k++;
      v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      const p = v[k];
      d[q] = (q - p) * (q - p) + f[p];
    }
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    pass(h);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    const r = y * w;
    for (let x = 0; x < w; x++) f[x] = g[r + x];
    pass(w);
    for (let x = 0; x < w; x++) g[r + x] = d[x];
  }
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = Math.sqrt(g[i]);
  return out;
}

/** Three passes of box blur approach a Gaussian. */
function blur(src, w, h, radius, passes = 3) {
  const r = Math.max(1, Math.round(radius));
  let a = src.slice(), b = new Float32Array(w * h);
  const norm = 1 / (2 * r + 1);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      const row = y * w;
      for (let x = -r; x <= r; x++) sum += a[row + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        b[row + x] = sum * norm;
        sum += a[row + clamp(x + r + 1, 0, w - 1)] - a[row + clamp(x - r, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) sum += b[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = sum * norm;
        sum += b[clamp(y + r + 1, 0, h - 1) * w + x] - b[clamp(y - r, 0, h - 1) * w + x];
      }
    }
  }
  return a;
}

const LIGHT = (() => { const l = Math.hypot(-0.5, -0.62, 0.6); return [-0.5 / l, -0.62 / l, 0.6 / l]; })();
const HALF = (() => { const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1], l = Math.hypot(...v); return v.map((c) => c / l); })();

const PALETTE = [[0, 0, 0, 0], [0.04, 6, 9, 26], [0.14, 13, 20, 58], [0.32, 28, 43, 104], [0.55, 54, 80, 160], [0.78, 108, 140, 212], [0.92, 170, 196, 240], [1, 226, 236, 252]];
const WARM = [[0, 0, 0, 0], [0.04, 16, 9, 12], [0.14, 58, 28, 26], [0.32, 128, 66, 46], [0.55, 204, 122, 80], [0.78, 244, 176, 126], [0.92, 255, 214, 176], [1, 255, 240, 222]];

function ramp(table, v, out) {
  for (let i = 1; i < table.length; i++) {
    if (v <= table[i][0]) {
      const a = table[i - 1], b = table[i], t = (v - a[0]) / (b[0] - a[0]);
      out[0] = a[1] + (b[1] - a[1]) * t; out[1] = a[2] + (b[2] - a[2]) * t; out[2] = a[3] + (b[3] - a[3]) * t;
      return;
    }
  }
  const l = table[table.length - 1];
  out[0] = l[1]; out[1] = l[2]; out[2] = l[3];
}

export class Plate {
  /** extent is [left, bottom, right, top] in plane degrees. */
  constructor(extent, ppd) {
    this.extent = extent;
    this.ppd = ppd;
    this.w = Math.ceil((extent[2] - extent[0]) * ppd);
    this.h = Math.ceil((extent[3] - extent[1]) * ppd);
    this.V = new Float32Array(this.w * this.h);
    this.W = new Float32Array(this.w * this.h);
    this.C = new Float32Array(this.w * this.h);
    this.spacing = 4.4;
  }

  px(x, y) { return [(x - this.extent[0]) * this.ppd, (this.extent[3] - y) * this.ppd]; }

  /** A working window around a pixel-space shape. */
  window(points, pad) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of points) { const r = (p[2] ?? 0) + pad; x0 = Math.min(x0, p[0] - r); y0 = Math.min(y0, p[1] - r); x1 = Math.max(x1, p[0] + r); y1 = Math.max(y1, p[1] + r); }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(this.w, Math.ceil(x1)); y1 = Math.min(this.h, Math.ceil(y1));
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    return { x0, y0, w, h, cov: new Float32Array(w * h), H: new Float32Array(w * h), U: new Float32Array(w * h), E: new Float32Array(w * h).fill(1e6) };
  }

  /** A closed organic form, raised like a pillow. */
  blob(points, o = {}) {
    const poly = spline(points, true, 14).map((p) => this.px(p[0], p[1]));
    const round = (o.round ?? 2) * this.ppd;
    const box = this.window(poly, 6);
    const { x0, y0, w, h } = box;
    const inside = new Uint8Array(w * h);
    // Even-odd scanline fill.
    for (let y = 0; y < h; y++) {
      const sy = y + y0 + 0.5, xs = [];
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a[1] > sy) !== (b[1] > sy)) xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.max(0, Math.ceil(xs[k] - x0 - 0.5)), e = Math.min(w - 1, Math.floor(xs[k + 1] - x0 - 0.5)); x <= e; x++) inside[y * w + x] = 1;
      }
    }
    const d = distanceField(inside, w, h);
    for (let i = 0; i < w * h; i++) {
      if (!inside[i]) continue;
      box.cov[i] = clamp(d[i] - 0.5 + 0.5);
      box.E[i] = d[i];
      const t = 1 - Math.min(d[i] / round, 1);
      box.H[i] = round * Math.sqrt(1 - t * t);
    }
    const soft = blur(box.H, w, h, Math.max(2, round * 0.16));
    for (let i = 0; i < w * h; i++) if (inside[i]) box.H[i] = box.H[i] * 0.5 + soft[i] * 0.5;
    this.finish(box, o);
  }

  /** A tube along a spine of [x, y, radius] points: an arm, a leg, a tail, a horn. */
  limb(points, o = {}) {
    const spine = spline(points, false, 28).map((p) => { const q = this.px(p[0], p[1]); return [q[0], q[1], p[2] * this.ppd]; });
    // Resample evenly so the tube never shows scallops.
    const samples = [];
    let along = 0;
    for (let i = 0; i < spine.length - 1; i++) {
      const a = spine[i], b = spine[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.ceil(len / 0.8));
      for (let k = 0; k < steps; k++) { const t = k / steps; samples.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, along + len * t]); }
      along += len;
    }
    const box = this.window(samples, 4);
    const { x0, y0, w, h } = box;
    const flat = o.flat ?? 1;
    box.length = along;
    box.isLimb = true;
    for (const [sx, sy, r, u] of samples) {
      const lx = Math.max(0, Math.floor(sx - r - x0 - 1)), hx = Math.min(w - 1, Math.ceil(sx + r - x0 + 1));
      const ly = Math.max(0, Math.floor(sy - r - y0 - 1)), hy = Math.min(h - 1, Math.ceil(sy + r - y0 + 1));
      for (let y = ly; y <= hy; y++) {
        for (let x = lx; x <= hx; x++) {
          const dx = x + x0 + 0.5 - sx, dy = y + y0 + 0.5 - sy, dd = dx * dx + dy * dy;
          if (dd > (r + 1) * (r + 1)) continue;
          const i = y * w + x, edge = r - Math.sqrt(dd);
          const v = Math.sqrt(Math.max(0, r * r - dd)) * flat;
          const cover = clamp(edge + 0.5);
          if (cover > box.cov[i]) box.cov[i] = cover;
          if (v > box.H[i]) { box.H[i] = v; box.U[i] = u; }
          if (edge > 0 && (box.E[i] === 1e6 || edge > box.E[i])) box.E[i] = edge;
        }
      }
    }
    this.finish(box, o);
  }

  /** Grooves, swellings, shadow and lit shading for one finished form. */
  finish(box, o) {
    const { x0, y0, w, h, cov, H, U, E } = box;
    for (const c of o.creases ?? []) this.groove(box, c);
    for (const b of o.bumps ?? []) this.swell(box, b);
    if (o.shadow !== 0) this.shadow(box, o.shadow ?? 0.62);

    const tone = o.tone ?? 1, warm = o.warm ?? 0, rimK = o.rim ?? 0.5;
    const angle = ((o.hatch ?? 28) * Math.PI) / 180, ca = Math.cos(angle), sa = Math.sin(angle);
    const curve = o.curve ?? 0.1, spacing = (o.spacing ?? 1) * this.spacing;
    // Low relief: a carved plate, not a balloon. The lines do the modelling.
    const relief = o.relief ?? 0.42;
    const near = blur(H, w, h, this.ppd * 0.16, 2), wide = blur(H, w, h, this.ppd * 0.42, 2);
    const unit = this.ppd * 0.07;
    // Near an edge the burin follows the edge. Further in, it settles to the part's own angle.
    const band = this.ppd * (o.band ?? 0.85);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x, c = cov[i];
        if (c <= 0) continue;
        const dx = (H[i + 1] - H[i - 1]) * 0.5 * relief, dy = (H[i + w] - H[i - w]) * 0.5 * relief;
        const l = Math.sqrt(dx * dx + dy * dy + 1);
        const nx = -dx / l, ny = -dy / l, nz = 1 / l;
        const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
        const spec = Math.pow(Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]), 40);
        const rim = Math.pow(1 - nz, 2.4);
        const back = Math.max(0, -nx * 0.6 - ny * 0.75) * rim;
        const cavity = E[i] > 3 ? clamp((near[i] - H[i]) / unit) * 0.7 + clamp((wide[i] - H[i]) / (unit * 3)) * 0.5 : 0;
        const ridge = E[i] > 3 ? clamp((H[i] - near[i]) / unit) : 0;
        const px = x + x0, py = y + y0;
        const fall = 1.14 - 0.46 * (py / this.h);
        const lit = (0.03 + 1.05 * diff * diff * diff + 0.14 * spec) * fall;
        const t = clamp(tone * (lit * (1 - 0.9 * clamp(cavity)) + 0.34 * ridge) + rimK * (0.1 * rim + 0.9 * back));
        const wander = 0.3 * Math.sin(px * 0.009 + py * 0.013) + 0.2 * Math.sin(px * 0.027 - py * 0.019);
        const phase = (px * ca + py * sa + curve * wide[i]) / spacing + wander;
        const q = Math.abs((phase - Math.floor(phase)) - 0.5) * 2;
        const width = 0.08 + 0.66 * t;
        const set1 = 1 - smooth(width - 0.3, width + 0.3, q);
        const e = E[i] === 1e6 ? 0 : E[i];
        const phaseE = e / (spacing * 1.25) + wander * 0.4;
        const qe = Math.abs((phaseE - Math.floor(phaseE)) - 0.5) * 2;
        const set2 = 1 - smooth(width - 0.26, width + 0.26, qe);
        const hug = 1 - smooth(band * 0.35, band, e);
        const phase3 = (px * sa - py * ca - curve * wide[i] * 0.6) / (spacing * 1.2) + wander;
        const q3 = Math.abs((phase3 - Math.floor(phase3)) - 0.5) * 2;
        const cross = t > 0.46 ? smooth(0.46, 0.76, t) * (1 - smooth(0.1, 0.48, q3)) : 0;
        const base = 0.03 + 0.11 * t;
        let v = base + (0.04 + 0.78 * t) * Math.max(set1 * (1 - hug), set2 * hug, cross * 0.7);
        // The inked edge. Bright toward the light, cool on the far side, quiet elsewhere.
        const edge = e < 2.2 ? (1 - e / 2.2) : 0;
        v = Math.max(v, edge * (o.edge ?? 1) * (0.07 + 0.6 * clamp(diff * diff * 1.5 + back * 1.5)));
        const j = (y + y0) * this.w + x + x0;
        let a = c * (o.alpha ?? 1);
        // A limb's ends melt into what they join, so joints don't read as sausages.
        if (box.isLimb && o.melt !== 0 && this.C[j] > 0.3) {
          const end = Math.min(U[i], box.length - U[i]);
          a *= smooth(0, (o.melt ?? 0.75) * this.ppd, end);
        }
        this.V[j] = this.V[j] * (1 - a) + v * a;
        this.W[j] = this.W[j] * (1 - a) + warm * a;
        this.C[j] = Math.max(this.C[j], c);
      }
    }
    // Every crease is also drawn: a dark cut with a lit lip, as a burin leaves it.
    for (const c of o.creases ?? []) {
      this.line(c.pts, { w: (c.w ?? 0.14) * 0.34, v: 0.62, dark: true });
      this.line(c.pts.map((p) => [p[0] - (c.w ?? 0.14) * 0.42, p[1] + (c.w ?? 0.14) * 0.42]), { w: (c.w ?? 0.14) * 0.16, v: (o.lineV ?? 0.42) * clamp(tone), warm });
    }
  }

  /** Cuts a tapered groove into a form, for folds, muscle edges and feather lines. */
  groove(box, c) {
    const pts = spline(c.pts, false, 18).map((p) => this.px(p[0], p[1]));
    const { x0, y0, w, h, H } = box;
    const width = (c.w ?? 0.14) * this.ppd, depth = (c.depth ?? 0.22) * this.ppd;
    const cut = new Float32Array(w * h);
    let total = 0;
    const lens = [0];
    for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(total); }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.ceil(len / 1.2));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps, sx = a[0] + (b[0] - a[0]) * t, sy = a[1] + (b[1] - a[1]) * t;
        const s = (lens[i] + len * t) / (total || 1), taper = Math.sin(Math.PI * clamp(s)) ** 0.6;
        const r = width * (0.25 + 0.75 * taper) * 2.2;
        const lx = Math.max(0, Math.floor(sx - r - x0)), hx = Math.min(w - 1, Math.ceil(sx + r - x0));
        const ly = Math.max(0, Math.floor(sy - r - y0)), hy = Math.min(h - 1, Math.ceil(sy + r - y0));
        for (let y = ly; y <= hy; y++) {
          for (let x = lx; x <= hx; x++) {
            const dx = x + x0 - sx, dy = y + y0 - sy, e = (dx * dx + dy * dy) / (width * width * (0.25 + 0.75 * taper) ** 2);
            const v = Math.exp(-e) * taper;
            if (v > cut[y * w + x]) cut[y * w + x] = v;
          }
        }
      }
    }
    for (let i = 0; i < w * h; i++) H[i] -= cut[i] * depth;
  }

  /** Adds a soft swelling: a muscle, a kneecap, a cheek. */
  swell(box, b) {
    const [cx, cy] = this.px(b.at[0], b.at[1]);
    const rx = (b.r[0] ?? b.r) * this.ppd, ry = (b.r[1] ?? b.r[0] ?? b.r) * this.ppd;
    const a = ((b.angle ?? 0) * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), rise = (b.h ?? 0.4) * this.ppd;
    const { x0, y0, w, h, H } = box;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x + x0 - cx, dy = y + y0 - cy;
        const u = (dx * ca + dy * sa) / rx, v = (-dx * sa + dy * ca) / ry;
        const e = u * u + v * v;
        if (e < 6) H[y * w + x] += rise * Math.exp(-e * 1.6);
      }
    }
  }

  /** Darkens what lies under a form, offset away from the light. */
  shadow(box, strength) {
    const { x0, y0, w, h, cov } = box;
    const pad = Math.round(this.ppd * 0.7);
    const W = w + pad * 2, H = h + pad * 2;
    const m = new Float32Array(W * H);
    const off = Math.round(pad * 0.4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = cov[y * w + x]; if (c > 0) m[(y + pad + off) * W + x + pad + off] = c; }
    const b = blur(m, W, H, pad * 0.34, 2);
    for (let y = 0; y < H; y++) {
      const py = y + y0 - pad;
      if (py < 0 || py >= this.h) continue;
      for (let x = 0; x < W; x++) {
        const px = x + x0 - pad;
        if (px < 0 || px >= this.w) continue;
        const s = b[y * W + x];
        if (s > 0.004) this.V[py * this.w + px] *= 1 - strength * clamp(s * 1.3);
      }
    }
  }

  /** One tapered stroke of the burin, light or dark, over what is already printed. */
  line(points, o = {}) {
    const pts = spline(points, false, 18).map((p) => this.px(p[0], p[1]));
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const s = i / (n - 1);
      const taper = o.taper === false ? 1 : Math.sin(Math.PI * clamp(s * 0.94 + 0.03)) ** (o.taperPower ?? 0.7);
      this.stamp(pts[i], pts[i + 1], (o.w ?? 0.05) * this.ppd * taper, o.v ?? 0.7, o.warm ?? 0, o.dark ?? false);
    }
  }

  stamp(a, b, r, value, warm, dark) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.ceil(len / 0.8));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, sx = a[0] + (b[0] - a[0]) * t, sy = a[1] + (b[1] - a[1]) * t;
      const R = Math.max(0.5, r);
      const lx = Math.max(0, Math.floor(sx - R - 1)), hx = Math.min(this.w - 1, Math.ceil(sx + R + 1));
      const ly = Math.max(0, Math.floor(sy - R - 1)), hy = Math.min(this.h - 1, Math.ceil(sy + R + 1));
      for (let y = ly; y <= hy; y++) {
        for (let x = lx; x <= hx; x++) {
          const d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy);
          const c = clamp(R - d + 0.5);
          if (c <= 0) continue;
          const j = y * this.w + x;
          if (dark) { this.V[j] *= 1 - c * value; continue; }
          const v = value * c;
          if (v > this.V[j]) { this.V[j] = v; this.W[j] = Math.max(this.W[j], warm); }
          this.C[j] = Math.max(this.C[j], c * 0.5);
        }
      }
    }
  }

  /**
   * Many fine strokes grown from a base line: fur, hair, a mane, the barbs of a feather. The
   * base and the flow are set by the figure. Only the individual hairs are scattered.
   */
  strands(base, o = {}) {
    const rnd = random(o.seed ?? 7);
    const line = spline(base, false, 18);
    const region = o.inside ? spline(o.inside, true, 8) : null;
    const hit = (x, y) => {
      let inside = false;
      for (let i = 0, j = region.length - 1; i < region.length; j = i++) {
        const a = region[i], b = region[j];
        if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      return inside;
    };
    let box = null;
    if (region) { box = [Math.min(...region.map((p) => p[0])), Math.min(...region.map((p) => p[1])), Math.max(...region.map((p) => p[0])), Math.max(...region.map((p) => p[1]))]; }
    const count = o.n ?? 200;
    const baseAngle = o.angle ?? 270;
    const length = o.len ?? 1.5, jitter = o.jitter ?? 18, curl = o.curl ?? 0;
    for (let i = 0; i < count; i++) {
      let x, y;
      if (region) {
        let tries = 0;
        do { x = box[0] + rnd() * (box[2] - box[0]); y = box[1] + rnd() * (box[3] - box[1]); } while (!hit(x, y) && ++tries < 40);
      } else {
        const k = Math.floor(rnd() * (line.length - 1));
        const p = line[k], q = line[k + 1];
        const u = rnd();
        x = p[0] + (q[0] - p[0]) * u + (rnd() - 0.5) * (o.spread ?? 0.2); y = p[1] + (q[1] - p[1]) * u + (rnd() - 0.5) * (o.spread ?? 0.2);
      }
      let a = baseAngle + (o.flow ? o.flow(x, y) : 0) + (rnd() - 0.5) * 2 * jitter;
      const steps = 10, seg = (length * (0.45 + 0.75 * rnd())) / steps;
      let value = (o.v ?? 0.6) * (0.5 + 0.6 * rnd());
      // Fur takes its light from what is printed under it, so shadow stays shadow.
      if (o.lit !== undefined) { const [lx, ly] = this.px(x, y); const under = this.V[Math.floor(ly) * this.w + Math.floor(lx)] ?? 0; value *= clamp(o.lit + under * 3.2); }
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        pts.push(this.px(x, y));
        x += Math.cos((a * Math.PI) / 180) * seg;
        y += Math.sin((a * Math.PI) / 180) * seg;
        a += curl + (rnd() - 0.5) * 7;
      }
      for (let k = 0; k < steps; k++) {
        const taper = 1 - k / steps;
        this.stamp(pts[k], pts[k + 1], (o.w ?? 0.022) * this.ppd * (0.3 + 0.7 * taper), value * (0.4 + 0.6 * taper), o.warm ?? 0, false);
      }
    }
  }

  /** Finishes the plate: a little bloom, then the palette. Black is transparent in the sky. */
  toRGB() {
    const { w, h, V, W } = this;
    const glow = blur(V, w, h, this.ppd * 0.3, 2);
    const out = Buffer.alloc(w * h * 3);
    const a = [0, 0, 0], b = [0, 0, 0];
    for (let i = 0; i < w * h; i++) {
      const v = clamp(V[i] + glow[i] * 0.2);
      if (v < 0.004) continue;
      ramp(PALETTE, v, a);
      const warm = W[i];
      if (warm > 0) { ramp(WARM, v, b); a[0] += (b[0] - a[0]) * warm; a[1] += (b[1] - a[1]) * warm; a[2] += (b[2] - a[2]) * warm; }
      out[i * 3] = a[0]; out[i * 3 + 1] = a[1]; out[i * 3 + 2] = a[2];
    }
    return out;
  }

  /** A soft, tiny print of the figure: the haze that sits behind it in the sky. */
  toGlow(size = 96) {
    const { w, h, C } = this;
    const m = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) m[i] = C[i] > 0.4 ? 1 : 0;
    const soft = blur(m, w, h, Math.max(w, h) * 0.035, 3);
    const scale = size / Math.max(w, h);
    const gw = Math.max(8, Math.round(w * scale)), gh = Math.max(8, Math.round(h * scale));
    const out = Buffer.alloc(gw * gh * 3);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const v = soft[Math.min(h - 1, Math.floor((y + 0.5) / scale)) * w + Math.min(w - 1, Math.floor((x + 0.5) / scale))];
        const i = (y * gw + x) * 3;
        out[i] = 20 * v; out[i + 1] = 34 * v; out[i + 2] = 92 * v;
      }
    }
    return { rgb: out, width: gw, height: gh };
  }

  /** The figure's outline as closed loops in plane degrees, for the trace animation. */
  contours(step = 3, tolerance = 0.09) {
    const gw = Math.floor(this.w / step), gh = Math.floor(this.h / step);
    const on = (x, y) => x >= 0 && y >= 0 && x < gw && y < gh && this.C[y * step * this.w + x * step] > 0.6;
    // Walks the edges between filled and empty cells, keeping the filled side on the right.
    const next = new Map();
    const key = (x, y) => (y + 2) * (gw + 4) + x + 2;
    const edge = (ax, ay, bx, by) => { next.set(key(ax, ay), [bx, by]); };
    for (let y = -1; y <= gh; y++) {
      for (let x = -1; x <= gw; x++) {
        if (!on(x, y)) continue;
        if (!on(x, y - 1)) edge(x, y, x + 1, y);
        if (!on(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
        if (!on(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
        if (!on(x - 1, y)) edge(x, y + 1, x, y);
      }
    }
    const loops = [];
    while (next.size) {
      const [first] = next.keys();
      let k = first, x = (k % (gw + 4)) - 2, y = Math.floor(k / (gw + 4)) - 2;
      const loop = [];
      while (next.has(k)) {
        const to = next.get(k);
        next.delete(k);
        loop.push([x * step / this.ppd + this.extent[0], this.extent[3] - y * step / this.ppd]);
        [x, y] = to;
        k = key(x, y);
      }
      loops.push(loop);
    }
    const simplify = (pts) => {
      const keep = new Uint8Array(pts.length);
      keep[0] = keep[pts.length - 1] = 1;
      const stack = [[0, pts.length - 1]];
      while (stack.length) {
        const [a, b] = stack.pop();
        let best = 0, at = -1;
        const dx = pts[b][0] - pts[a][0], dy = pts[b][1] - pts[a][1], l = Math.hypot(dx, dy) || 1;
        for (let i = a + 1; i < b; i++) {
          const d = Math.abs((pts[i][0] - pts[a][0]) * dy - (pts[i][1] - pts[a][1]) * dx) / l;
          if (d > best) { best = d; at = i; }
        }
        if (best > tolerance) { keep[at] = 1; stack.push([a, at], [at, b]); }
      }
      return pts.filter((_, i) => keep[i]);
    };
    return loops.filter((l) => l.length * step / this.ppd > 3).sort((a, b) => b.length - a.length).slice(0, 6).map(simplify);
  }

  covers(x, y) {
    const [px, py] = this.px(x, y);
    const i = Math.floor(py) * this.w + Math.floor(px);
    return i >= 0 && i < this.C.length && this.C[i] > 0.4;
  }
}
