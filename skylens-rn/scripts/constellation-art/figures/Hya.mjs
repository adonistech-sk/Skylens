// The Water Snake, the longest figure in the sky, a quarter of the way round it. The broad viper
// head holds the ring of Ashlesha, Rho, Delta, Eta and Sigma, Alphard, "the solitary one", lies on
// the first heavy coil, and the body winds east through every star of the line to a fine tail.
import { spline } from '../engrave.mjs';

const R = [20.8, 17.3], A = [0.87, -0.5], N = [0.5, 0.87];
const Z = 1.22;
const H = (p) => [R[0] + (p[0] * A[0] + p[1] * N[0]) * Z, R[1] + (p[0] * A[1] + p[1] * N[1]) * Z, ...p.slice(2).map((v) => (typeof v === 'number' ? v * Z : v))];
const HL = (l) => l.map(H);
const HC = (l) => l.map((k) => ({ ...k, pts: HL(k.pts) }));

export default {
  tier: 'extended',
  subject: 'The Water Snake',
  pixels: 1100,
  anchors: [['Ashlesha', 'head'], ['δ Hya', 'head'], ['η Hya', 'head'], ['Minchir', 'head'], ['ζ Hya', 'neck'], ['Alphard', 'coil'], ['λ Hya', 'coil'], ['ν Hya', 'body'], ['ξ Hya', 'body'], ['γ Hya', 'body'], ['π Hya', 'tail'], [72571, 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const q = (k, r) => [...s(k), r];
    const path = [
      [22.2, 17.0, 1.1], q('ζ Hya', 1.0), [18.2, 15.6, 1.06], q('θ Hya', 1.12), [12.6, 12.6, 1.2], q('Ukdah', 1.32), [8.0, 7.6, 1.4], [10.2, 5.4, 1.46], q('Alphard', 1.6), [9.8, -1.6, 1.7], q('Zhang', 1.76),
      [3.2, -2.8, 1.76], q('λ Hya', 1.8), [-0.8, -3.5, 1.84], q('μ Hya', 1.84), [-5.4, -6.8, 1.84], q('ν Hya', 1.84), [-12.0, -8.2, 1.84], [-15.2, -15.6, 1.8], q('ξ Hya', 1.72), q('β Hya', 1.66), [-27.0, -25.0, 1.6], [-34.0, -19.6, 1.5],
      [-40.0, -17.0, 1.4], q('γ Hya', 1.3), [-50.0, -22.6, 1.1], q('π Hya', 0.9), [-61.0, -27.6, 0.68], q(72571, 0.36), [-70.6, -36.6, 0.1],
    ];
    for (const p of path) p[2] *= 1.34;
    const pts = spline(path, false, 16);
    const lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = lens[lens.length - 1];
    const at = (d) => {
      let i = 1;
      while (i < pts.length - 1 && lens[i] < d) i++;
      const a = pts[i - 1], b = pts[i], t = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l;
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, r: a[2] + (b[2] - a[2]) * t, tx, ty, nx: -ty, ny: tx };
    };
    const off = (p, along, across) => [p.x + p.tx * along + p.nx * across, p.y + p.ty * along + p.ny * across];

    // Forked tongue, flickering out, the warm note.
    limb(HL([[8.0, 0, 0.16], [10.2, 0.1, 0.1], [11.1, 0.0, 0.08]]), { tone: 1.2, warm: 0.76, shadow: 0, melt: 0, band: 0.1 });
    limb(HL([[11.0, 0.0, 0.07], [12.0, 0.5, 0.05], [12.8, 1.2, 0.02]]), { tone: 1.2, warm: 0.76, shadow: 0, melt: 0, band: 0.1 });
    limb(HL([[11.0, 0.0, 0.07], [12.0, -0.5, 0.05], [12.8, -1.2, 0.02]]), { tone: 1.2, warm: 0.76, shadow: 0, melt: 0, band: 0.1 });

    // The body: lines follow it through the bends.
    limb(path, { tone: 1.18, hatch: 30, shadow: 0.6, band: 2.5, melt: 0, spacing: 1.0 });

    // The diamond chain down the back, a snake's own pattern.
    const zig = [];
    let flip = 1;
    for (let d = 2; d < total - 6; d += 0) {
      const p = at(d), size = 1.4 + p.r * 0.9;
      zig.push([p, flip]);
      flip = -flip;
      d += size;
    }
    for (let i = 0; i + 2 < zig.length; i += 2) {
      const [a] = zig[i], [b] = zig[i + 1], [c] = zig[i + 2];
      const na = off(a, 0, a.r * 0.08), nb1 = off(b, 0, b.r * 0.62), nb2 = off(b, 0, -b.r * 0.46), nc = off(c, 0, c.r * 0.08);
      line([na, nb1, nc], { w: 0.09, v: 0.74 });
      line([na, nb2, nc], { w: 0.09, v: 0.74 });
      line([off(a, 0.2, a.r * 0.08), off(b, 0, b.r * 0.3), off(c, -0.2, c.r * 0.08)], { w: 0.05, v: 0.42 });
      line([off(a, 0.2, a.r * 0.08), off(b, 0, -b.r * 0.2), off(c, -0.2, c.r * 0.08)], { w: 0.05, v: 0.42 });
      const dot = off(b, 0, b.r * 0.07);
      limb([[dot[0] - 0.05, dot[1], 0.2], [dot[0] + 0.05, dot[1], 0.2]], { tone: 1.3, shadow: 0, melt: 0, band: 0.06 });
    }
    // Belly plates along the inner side.
    for (let d = 1.4; d < total - 3; d += 1.5) {
      const p = at(d);
      line([off(p, -0.15, -p.r * 0.98), off(p, 0.1, -p.r * 0.78), off(p, 0.08, -p.r * 0.56)], { w: 0.09, v: 0.56, dark: true });
    }
    const belly = [];
    for (let d = 1; d < total - 2; d += 2.6) { const p = at(d); belly.push(off(p, 0, -p.r * 0.56)); }
    line(belly, { w: 0.09, v: 0.56, dark: true, taper: false });

    // The head from above, a broad arrow, heavy jaw muscles and a narrow snout.
    blob(HL([[0.3, 0.9], [1.6, 2.1], [3.2, 2.75], [4.8, 2.5], [6.4, 1.6], [7.7, 0.9], [8.4, 0.3], [8.5, -0.3], [7.7, -0.9], [6.4, -1.6], [4.8, -2.5], [3.2, -2.75], [1.6, -2.1], [0.3, -0.9]]), {
      round: 1.05, tone: 1.3, hatch: 30, shadow: 0.62, spacing: 0.9, band: 0.5,
      creases: HC([
        { pts: [[1.0, 0.1], [3.6, 0.05], [6.4, 0.0]], w: 0.08, depth: 0.12 },
        { pts: [[0.7, 1.4], [2.8, 0.8], [4.4, 1.2]], w: 0.14, depth: 0.2 },
        { pts: [[0.7, -1.4], [2.8, -0.8], [4.4, -1.2]], w: 0.14, depth: 0.2 },
        { pts: [[4.0, 1.9], [5.6, 1.5], [7.2, 0.8]], w: 0.1, depth: 0.14 },
        { pts: [[4.0, -1.9], [5.6, -1.5], [7.2, -0.8]], w: 0.1, depth: 0.14 },
      ]),
      bumps: [{ at: H([2.6, 1.7]), r: [1.4, 0.9], angle: 10, h: 0.22 }, { at: H([2.6, -1.7]), r: [1.4, 0.9], angle: 50, h: 0.22 }],
    });
    // Brow plates and eyes, the warm slit of each set under its shield.
    for (const v of [1, -1]) {
      limb(HL([[3.6, 1.36 * v, 0.16], [4.5, 1.44 * v, 0.46], [5.3, 1.3 * v, 0.14]]), { tone: 0.56, shadow: 0.42, melt: 0, rim: 1, band: 0.1 });
      limb(HL([[4.5, 1.46 * v, 0.27], [4.54, 1.46 * v, 0.26]]), { tone: 1.2, warm: 0.7, shadow: 0, melt: 0, edge: 0 });
      limb(HL([[4.2, 1.46 * v, 0.06], [4.84, 1.46 * v, 0.06]]), { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
      limb(HL([[3.4, 0.84 * v, 0.14], [4.4, 0.92 * v, 0.24], [5.5, 0.72 * v, 0.1]]), { tone: 1.36, hatch: 40, shadow: 0.5, melt: 0, band: 0.1 });
      limb(HL([[7.4, 0.42 * v, 0.14], [7.5, 0.42 * v, 0.14]]), { tone: 0.2, shadow: 0, melt: 0, edge: 0 });
    }
    // Crown plates.
    for (const pts of [[[5.6, 0.5], [6.5, 0.3], [7.2, 0.14]], [[5.6, -0.5], [6.5, -0.3], [7.2, -0.14]]]) line(HL(pts), { w: 0.05, v: 0.5 });
  },
};
