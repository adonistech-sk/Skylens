// The River, the longest course in the sky. It pours from a tipped bronze urn at Cursa, by Orion's
// foot, loops west through Zaurak and Azha, doubles back through the Tau stars and winds away
// south past Acamar to break in curling water at Achernar, "the end of the river". Every line
// star lies in the stream. The water is drawn entirely by its currents; the urn is the warm note.
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: 'The River',
  pixels: 1100,
  anchors: [['Achernar', 'end of the river'], ['Cursa', 'source'], ['Acamar', 'stream'], ['Zaurak', 'bend of the river'], ['Rana', 'stream'], ['Azha', 'bend of the river'], ['Theemin', 'bend of the river'], ['Beid', 'stream']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const cur = s('Cursa'), ach = s('Achernar');

    // The course, laid by hand through the stars, with the river's half-width growing downstream.
    const course = [
      [cur[0] - 0.2, cur[1] - 0.2, 1.0], [-21.8, 22.0, 1.3], [-18.8, 22.9, 1.5], [-15.9, 22.9, 1.6], [-12.4, 21.6, 1.7], [s('Beid')[0], 19.2, 1.75], [-8.2, 15.8, 1.8], [-6.6, 13.3, 1.8], [-3.7, 13.4, 1.8], [-2.4, 16.1, 1.8], [0.4, 17.4, 1.8], [5.0, 17.9, 1.85], [9.6, 17.0, 1.9], [12.0, 14.0, 1.95], [12.1, 9.6, 1.95], [10.2, 4.8, 2.0], [7.2, 2.9, 2.0], [3.4, 4.3, 2.0], [0.0, 4.6, 2.0], [-3.2, 3.0, 2.05], [-8.2, -0.6, 2.1], [-12.6, -3.8, 2.15], [-13.8, -6.5, 2.15], [-11.4, -8.3, 2.2], [-7.6, -8.2, 2.2], [-3.2, -10.0, 2.25], [-0.4, -13.8, 2.3], [2.8, -16.4, 2.3], [6.8, -15.0, 2.35], [10.0, -14.6, 2.4], [11.9, -17.6, 2.4], [11.8, -22.4, 2.45], [12.9, -26.6, 2.5], [15.2, -29.0, 2.6], [16.6, -32.0, 3.0], [ach[0], ach[1] - 1.0, 3.9],
    ];
    const raw = spline(course, false, 8);

    // Resample the course by distance, so strokes can be placed by degrees downstream.
    const dist = [0];
    for (let i = 1; i < raw.length; i++) dist.push(dist[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const total = dist[dist.length - 1];
    const at = (d) => {
      const v = Math.max(0, Math.min(total - 0.001, d));
      let lo = 0, hi = dist.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (dist[m] <= v) lo = m; else hi = m; }
      const f = (v - dist[lo]) / (dist[hi] - dist[lo] || 1), a = raw[lo], b = raw[hi];
      const j = Math.max(0, lo - 3), k = Math.min(raw.length - 1, hi + 3), dx = raw[k][0] - raw[j][0], dy = raw[k][1] - raw[j][1], l = Math.hypot(dx, dy) || 1;
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, r: a[2] + (b[2] - a[2]) * f, nx: -dy / l, ny: dx / l, tx: dx / l, ty: dy / l };
    };
    /** A run of current: lane is -1 to 1 across the stream, and it wanders as it goes. */
    const run = (lane, d0, d1, wander, phase) => {
      const pts = [];
      for (let d = d0; d <= d1; d += 0.9) {
        const q = at(d), o = (lane + wander * Math.sin(d * 0.42 + phase)) * q.r * 0.92;
        pts.push([q.x + q.nx * o, q.y + q.ny * o]);
      }
      return pts;
    };

    // The body of the water. A wide band makes its engraved lines follow the banks all the way.
    const body = [];
    for (let d = 0; d <= total; d += 1.6) { const q = at(d); body.push([q.x, q.y, q.r]); }
    limb(body, { tone: 0.92, flat: 0.34, band: 6, spacing: 1.1, hatch: 30, shadow: 0, melt: 0, rim: 0.6 });

    // Long currents, staggered between the lanes. Golden-ratio steps keep them from lining up.
    const lanes = [-0.76, -0.52, -0.28, -0.06, 0.16, 0.4, 0.64, 0.84];
    let golden = 0.37;
    for (const [i, lane] of lanes.entries()) {
      let d = 1 + i * 2.3;
      while (d < total - 4) {
        golden = (golden + 0.618034) % 1;
        const len = 7 + golden * 11, gap = 1.6 + ((golden * 7.3) % 1) * 3.4;
        const pts = run(lane, d, Math.min(total - 1, d + len), 0.09, i * 1.7 + d * 0.1);
        if (pts.length > 2) line(pts, { w: 0.07 + golden * 0.09, v: 0.46 + ((golden * 3.1) % 1) * 0.36, taperPower: 1 });
        d += len + gap;
      }
    }

    // Breaking crests, small hooks that ride the current down the middle of the stream.
    for (let d = 5; d < total - 5; d += 3.1) {
      const q = at(d), side = Math.round(d * 7) % 3 - 1, o = side * q.r * 0.46, c = [q.x + q.nx * o, q.y + q.ny * o];
      const P = (u, v) => [c[0] + q.tx * u + q.nx * v, c[1] + q.ty * u + q.ny * v];
      line([P(-1.1, 0.0), P(-0.2, 0.2), P(0.5, 0.42), P(0.86, 0.14), P(0.54, -0.1)], { w: 0.09, v: 0.92 });
    }

    // Eddies thrown off by the outside of each bend, each a tight curl turning against the flow.
    for (const [d, side, size] of [[17, 1, 1], [29, -1, 1], [33, -1, 0.9], [52, 1, 1], [64, -1, 1.1], [88, -1, 1.1], [100, 1, 1.1], [121, -1, 1.1], [134, 1, 1.1]]) {
      const q = at(d), o = side * q.r * 0.5, c = [q.x + q.nx * o, q.y + q.ny * o], pts = [];
      for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI * 3.4, r = size * 0.92 * (1 - (i / 18) * 0.86); pts.push([c[0] + Math.cos(a + d) * r, c[1] + Math.sin(a + d) * r * side]); }
      line(pts, { w: 0.09, v: 0.86, taperPower: 0.5 });
    }

    // Banks: a broken line down each side, with reeds growing out here and there.
    for (const side of [-1, 1]) {
      for (let d = 1, k = 0; d < total - 3; k++) {
        const len = 9 + (k * 5.3) % 8;
        line(run(side * 1.08, d, Math.min(total - 3, d + len), 0.02, k), { w: 0.1, v: 0.74, taperPower: 0.5 });
        d += len + 1.6;
      }
    }
    for (const [d, side] of [[12, 1], [24, 1], [43, -1], [58, 1], [70, 1], [82, -1], [108, -1], [127, -1], [140, 1]]) {
      const q = at(d), base = [q.x + q.nx * side * q.r * 1.04, q.y + q.ny * side * q.r * 1.04];
      for (const [u, h, lean] of [[-0.5, 1.4, -0.3], [-0.16, 2.0, -0.1], [0.16, 1.7, 0.16], [0.5, 1.2, 0.34]]) {
        const a = [base[0] + q.tx * u, base[1] + q.ty * u];
        line([a, [a[0] + q.nx * side * h * 0.6 + q.tx * lean * 0.3, a[1] + q.ny * side * h * 0.6 + q.ty * lean * 0.3], [a[0] + q.nx * side * h + q.tx * lean, a[1] + q.ny * side * h + q.ty * lean]], { w: 0.08, v: 0.62 });
      }
    }

    // The end of the river: the stream opens into wide water, rows of small waves spreading south.
    for (const [row, y, half, n] of [[0, ach[1] - 2.9, 4.2, 7], [1, ach[1] - 4.2, 5.4, 9], [2, ach[1] - 5.5, 6.6, 11], [3, ach[1] - 6.8, 7.2, 12]]) {
      const w = (half * 2) / n;
      for (let i = 0; i < n; i++) {
        const x = ach[0] - half + (i + (row % 2 ? 0.25 : 0)) * w, bend = -0.018 * (x - ach[0]) ** 2;
        line([[x, y + bend], [x + w * 0.3, y + bend + 0.5], [x + w * 0.62, y + bend + 0.44], [x + w * 0.82, y + bend + 0.12], [x + w * 0.66, y + bend - 0.04]], { w: 0.11 - row * 0.012, v: 0.9 - row * 0.1, taperPower: 0.5 });
      }
    }

    // The stream falling from the urn.
    for (const [o, v] of [[-0.3, 0.8], [0, 0.94], [0.3, 0.8]]) line([[cur[0] - 2.2, cur[1] + 1.1 + o * 0.5], [cur[0] - 0.9, cur[1] + 0.4 + o], [cur[0] + 1.0, cur[1] + 0.9 + o * 1.8]], { w: 0.12, v, taperPower: 0.5 });

    // The urn, tipped to pour, lying behind the source.
    const L = (u, v) => [cur[0] - 4.9 + 0.88 * u + 0.47 * v, cur[1] + 3.0 - 0.47 * u + 0.88 * v];
    limb([L(1.2, 1.0).concat(0.22), L(0.2, 2.4).concat(0.2), L(-1.8, 1.9).concat(0.18)], { tone: 1.16, warm: 0.76, hatch: 40, shadow: 0, melt: 0, flat: 0.7 });
    blob([L(-3.2, -0.3), L(-3.1, 0.3), L(-2.3, 1.1), L(-0.8, 1.7), L(0.6, 1.3), L(1.5, 0.7), L(2.5, 0.54), [...L(3.3, 0.86), 'c'], [...L(3.5, -0.86), 'c'], L(2.5, -0.54), L(1.5, -0.7), L(0.6, -1.3), L(-0.8, -1.7), L(-2.3, -1.1), L(-3.1, -0.3)], {
      round: 1.2, tone: 1.2, warm: 0.74, hatch: 62, shadow: 0.4, band: 0.3,
      creases: [{ pts: [L(-0.4, -1.7), L(-0.2, 0), L(-0.4, 1.7)], w: 0.08, depth: 0.14 }, { pts: [L(0.5, -1.4), L(0.7, 0), L(0.5, 1.4)], w: 0.08, depth: 0.14 }, { pts: [L(-2.4, -1.1), L(-2.2, 0), L(-2.4, 1.1)], w: 0.06, depth: 0.1 }],
      bumps: [{ at: L(-0.4, 0), r: [1.4, 1.2], h: 0.3 }],
    });
    limb([L(3.4, -0.96).concat(0.15), L(3.56, 0).concat(0.17), L(3.4, 0.96).concat(0.15)], { tone: 1.3, warm: 0.84, hatch: 20, shadow: 0.34, melt: 0, flat: 0.6 });
  },
};
