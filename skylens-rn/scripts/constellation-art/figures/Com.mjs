// Berenice's Hair, the single long tress the queen cut and gave to the gods. It is gathered at the
// Diadem star in a small gold clasp, rises in a long wave through Beta, then turns west and
// fans out in loosening curls past Gamma. Line alone makes this figure, as hair should be.
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: "Berenice's Hair",
  pixels: 1100,
  anchors: [['Diadem', 'clasp'], ['β Com', 'crest of the tress'], ['γ Com', 'curling ends']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const dia = s('Diadem'), bet = s('β Com'), gam = s('γ Com');

    // The spine of the tress, and its half-width along the way.
    const raw = [[dia[0], dia[1], 0.3], [-5.0, -4.8, 1.0], [-5.6, -2.0, 1.8], [-4.8, 0.8, 2.5], [bet[0] + 0.1, bet[1] - 0.2, 3.0], [-0.8, 4.9, 3.0], [2.4, 4.8, 2.7], [5.2, 3.6, 2.6], [gam[0] + 1.3, gam[1] - 0.4, 2.3], [9.8, 3.2, 1.3], [11.6, 3.0, 0.4]];
    const path = spline(raw, false, 16);
    const at = (t) => {
      const x = t * (path.length - 1), i = Math.min(path.length - 2, Math.floor(x)), f = x - i, a = path[i], b = path[i + 1];
      const j = Math.max(0, i - 2), k = Math.min(path.length - 1, i + 3), dx = path[k][0] - path[j][0], dy = path[k][1] - path[j][1], l = Math.hypot(dx, dy) || 1;
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], n: [-dy / l, dx / l], r: a[2] + (b[2] - a[2]) * f };
    };

    /** One strand of the tress: offset is -1 to 1 across it, wave is its own ripple. */
    const strand = (offset, from, to, wave, phase, steps = 26) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = from + (to - from) * (i / steps), q = at(t);
        const ripple = wave * Math.sin(t * 15 + phase) * Math.min(1, t * 3);
        const o = offset * q.r * 0.96 + ripple;
        pts.push([q.p[0] + q.n[0] * o, q.p[1] + q.n[1] * o]);
      }
      return pts;
    };

    // A dark body under the hair, soft-edged, that catches the stars and carries the shading.
    const left = [], right = [];
    for (let i = 0; i <= 24; i++) { const q = at(i / 24 * 0.97); left.push([q.p[0] + q.n[0] * q.r * 0.92, q.p[1] + q.n[1] * q.r * 0.92]); right.push([q.p[0] - q.n[0] * q.r * 0.92, q.p[1] - q.n[1] * q.r * 0.92]); }
    blob([...left.filter((_, i) => i % 2 === 0), ...right.filter((_, i) => i % 2 === 0).reverse()], { round: 2.2, tone: 0.78, hatch: 40, shadow: 0, edge: 0, spacing: 1.2, band: 0.2 });

    // Groups of locks, each swelling and tapering, so it reads as locks and not as a comb.
    const groups = [-0.78, -0.42, -0.06, 0.32, 0.7];
    for (const [g, centre] of groups.entries()) {
      const from = 0.012 + g * 0.006;
      const main = strand(centre, from, 0.985 - Math.abs(g - 2) * 0.05, 0.3, g * 1.4);
      const r = [0.12, 0.32, 0.46, 0.52, 0.5, 0.42, 0.3, 0.1];
      limb(main.filter((_, i) => i % 4 === 0).map((p, i, list) => [p[0], p[1], r[Math.min(7, Math.round((i / (list.length - 1)) * 7))]]), {
        tone: 1.02 + (g % 2) * 0.1, hatch: 24 + g * 12, shadow: 0.4, melt: 0, flat: 0.5, edge: 0.7, spacing: 0.72, band: 0.3,
        creases: [-0.5, 0, 0.5].map((d) => ({ pts: strand(centre + d * 0.14, from + 0.02, 0.96 - Math.abs(g - 2) * 0.05, 0.3, g * 1.4, 18), w: 0.05, depth: 0.08 })),
      });
    }

    // Fine strands over all of it, following the same current.
    for (let i = 0; i < 64; i++) {
      const o = -0.95 + 1.9 * ((i * 0.618034) % 1), a = 0.03 + 0.5 * ((i * 0.381966) % 1), b = a + 0.25 + 0.28 * ((i * 0.7548) % 1);
      line(strand(o, a, Math.min(0.97, b), 0.26, i * 0.7), { w: 0.045, v: 0.5 + 0.34 * ((i * 0.5698) % 1) });
    }

    // Loose curls at the ends, each a long stroke that turns back on itself.
    const curl = (x, y, a, size, turn, v) => {
      const pts = [];
      let d = a, cx = x, cy = y, step = size * 0.34;
      for (let i = 0; i < 18; i++) { pts.push([cx, cy]); cx += Math.cos((d * Math.PI) / 180) * step; cy += Math.sin((d * Math.PI) / 180) * step; d += turn * (i > 5 ? 26 : 8); step *= i > 5 ? 0.9 : 1; }
      line(pts, { w: 0.07, v });
      line(pts.map((p) => [p[0] + 0.1, p[1] - 0.08]), { w: 0.03, v: v * 0.8 });
    };
    curl(7.4, 4.9, 10, 1.9, 1, 0.8);
    curl(8.6, 3.9, 0, 1.9, 1, 0.84);
    curl(8.8, 2.6, -8, 1.9, -1, 0.82);
    curl(7.8, 1.7, -14, 1.9, -1, 0.74);
    curl(5.8, 5.6, 14, 1.7, 1, 0.74);
    curl(6.0, 1.3, -20, 1.8, -1, 0.68);

    // The clasp that gathers the tress, gold, with the Diadem star on it.
    limb([[dia[0] - 0.9, dia[1] + 0.3, 0.26], [dia[0], dia[1] + 0.1, 0.32], [dia[0] + 0.9, dia[1] - 0.1, 0.26]], { tone: 1.28, warm: 0.8, hatch: 80, shadow: 0.46, melt: 0, flat: 0.7, creases: [{ pts: [[dia[0] - 0.84, dia[1] + 0.3], [dia[0], dia[1] + 0.1], [dia[0] + 0.84, dia[1] - 0.1]], w: 0.03, depth: 0.05 }] });
    // The cut ends below the clasp, a short clipped fringe.
    for (const [dx, h] of [[-0.6, 1.0], [-0.3, 1.3], [0, 1.4], [0.3, 1.3], [0.6, 1.0]]) line([[dia[0] + dx, dia[1] - 0.1], [dia[0] + dx * 0.9, dia[1] - h * 0.6], [dia[0] + dx * 1.3, dia[1] - h]], { w: 0.07, v: 0.74 });
  },
};
