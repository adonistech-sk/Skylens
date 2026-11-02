// Small drawing aids shared by the figures. Each one still takes points chosen for that figure:
// these save repeating how a feather is cut, they don't decide where anything goes.
import { spline } from './engrave.mjs';

const lerp = (a, b, t) => a + (b - a) * t;

/** One flight feather from a base to a tip. */
export function feather(E, base, tip, width, o = {}) {
  const dx = tip[0] - base[0], dy = tip[1] - base[1];
  const bend = o.bend ?? 0.12;
  const nx = -dy * bend, ny = dx * bend;
  const a = [lerp(base[0], tip[0], 0.34) + nx, lerp(base[1], tip[1], 0.34) + ny];
  const b = [lerp(base[0], tip[0], 0.7) + nx * 0.8, lerp(base[1], tip[1], 0.7) + ny * 0.8];
  E.limb([[base[0], base[1], width * 0.4], [a[0], a[1], width * 0.86], [b[0], b[1], width], [tip[0], tip[1], width * 0.22]], {
    flat: 0.34, tone: o.tone ?? 1, hatch: (Math.atan2(-dy, dx) * 180) / Math.PI + 74, shadow: o.shadow ?? 0.42, warm: o.warm ?? 0,
    creases: [{ pts: [base, a, b, tip], w: width * 0.1, depth: width * 0.1 }],
  });
}

/**
 * A wing: feathers fanned from a leading edge out to tips chosen for the figure, outermost first so the
 * inner ones lie over them. tips are [x, y, width].
 */
export function wing(E, edge, tips, o = {}) {
  const line = spline(edge, false, 12);
  tips.forEach((tip, i) => {
    const t = (o.from ?? 0.98) + ((o.to ?? 0.1) - (o.from ?? 0.98)) * (i / Math.max(1, tips.length - 1));
    const base = line[Math.round(t * (line.length - 1))];
    feather(E, base, tip, tip[2], { bend: o.bend ?? 0.1, tone: (o.tone ?? 1) * (0.86 + 0.2 * (i / tips.length)), warm: o.warm });
  });
}

/** A row of short covert feathers along a line, laid like roof tiles. */
export function coverts(E, line, angle, length, width, o = {}) {
  const pts = spline(line, false, 10);
  const n = o.n ?? 12;
  for (let i = 0; i < n; i++) {
    const p = pts[Math.round((i / (n - 1)) * (pts.length - 1))];
    const a = ((angle + (o.turn ?? 0) * (i / (n - 1))) * Math.PI) / 180;
    const l = length * (o.grow ? 1 - (i / n) * o.grow : 1);
    feather(E, p, [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l], width, { bend: o.bend ?? 0.08, tone: o.tone ?? 1.04, shadow: 0.34 });
  }
}

/** A paw, grown out of the leg, with the toes cut in and small claws. */
export function paw(E, at, length, angle, o = {}) {
  const a = (angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const P = (u, v) => [at[0] + (c * u - s * v) * length, at[1] + (s * u + c * v) * length];
  const toes = [-0.3, -0.1, 0.1, 0.3];
  E.limb([[...P(-0.6, 0), length * 0.42], [...P(0.1, 0), length * 0.46], [...P(0.56, 0), length * 0.42]], {
    tone: o.tone ?? 1, shadow: 0.38, hatch: angle + 80, flat: 0.85, melt: length * 0.5,
    creases: toes.slice(0, 3).map((v, i) => ({ pts: [P(0.3, (v + toes[i + 1]) / 2), P(0.72, (v + toes[i + 1]) / 2 * 1.2), P(1.0, (v + toes[i + 1]) / 2 * 1.2)], w: length * 0.035, depth: length * 0.09 })),
  });
  for (const v of toes) E.line([P(0.88, v * 1.2), P(1.08, v * 1.26), P(1.22, v * 1.2)], { w: 0.05 * length, v: 0.62, warm: 0.3 });
}

/**
 * A figure's own upright frame, for drawing a pose the way an artist would and laying it on the
 * stars afterwards. origin is the hips, top is toward the head. L(f, u) gives the plane point,
 * f across the figure and u up it. L.back(p) reads a star back into the frame.
 */
export function frame(origin, top, flip = 1) {
  const ux = top[0] - origin[0], uy = top[1] - origin[1], len = Math.hypot(ux, uy);
  const U = [ux / len, uy / len];
  // Across the figure, a quarter turn from up. Mirror it with flip for a figure facing the other way.
  const F = [U[1] * flip, -U[0] * flip];
  const L = (f, u) => [origin[0] + F[0] * f + U[0] * u, origin[1] + F[1] * f + U[1] * u];
  L.back = (p) => { const x = p[0] - origin[0], y = p[1] - origin[1]; return [x * F[0] + y * F[1], x * U[0] + y * U[1]]; };
  L.angle = (Math.atan2(-U[1], U[0]) * 180) / Math.PI;
  return L;
}

/** Fur over a drawn region, flowing as the figure directs, lit by the print beneath. */
export function fur(E, region, o = {}) {
  E.strands(region, { inside: region, n: o.n ?? 1400, angle: o.angle ?? 180, flow: o.flow, len: o.len ?? 0.9, jitter: o.jitter ?? 16, v: o.v ?? 0.52, lit: o.lit ?? 0.05, curl: o.curl ?? 0, seed: o.seed ?? 3, warm: o.warm ?? 0, w: o.w ?? 0.03 });
}

/** A hoof. */
export function hoof(E, at, length, angle, o = {}) {
  const a = (angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const P = (u, v) => [at[0] + (c * u - s * v) * length, at[1] + (s * u + c * v) * length];
  E.blob([P(-0.3, 0.42), P(0.5, 0.56, 'c'), P(1.0, 0.62), [...P(1.05, -0.5), 'c'], P(0.4, -0.54), P(-0.3, -0.4)], { round: length * 0.34, tone: o.tone ?? 1.05, shadow: 0.42, hatch: angle + 60, warm: o.warm ?? 0.2, creases: [{ pts: [P(0.1, 0.5), P(0.15, 0), P(0.1, -0.46)], w: length * 0.05, depth: length * 0.08 }] });
}

/** A wave of hair or mane locks, each a list of points, drawn as long curved strokes. */
export function locks(E, list, o = {}) {
  for (const [i, pts] of list.entries()) {
    E.line(pts, { w: o.w ?? 0.13, v: o.v ?? 0.5, warm: o.warm ?? 0 });
    E.line(pts.map((p) => [p[0] + 0.1, p[1] - 0.08]), { w: (o.w ?? 0.13) * 0.36, v: (o.v ?? 0.5) * 1.3, warm: o.warm ?? 0 });
    if (i % 2 === 0) E.line(pts.map((p) => [p[0] - 0.1, p[1] + 0.07]), { w: (o.w ?? 0.13) * 0.3, v: (o.v ?? 0.5) * 0.7 });
  }
}
