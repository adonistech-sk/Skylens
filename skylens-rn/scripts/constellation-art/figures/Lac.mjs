// The Lizard, seen from above as it runs down the zigzag of its stars, an S of body between splayed
// legs. Beta is on the head, Alpha on the neck, the middle stars down the spine, the star to the
// east on the hind thigh, and the two south stars on the tail, which curls away at the end.
import { spline } from '../engrave.mjs';

export default {
  tier: 'extended',
  subject: 'The Lizard',
  pixels: 1100,
  anchors: [['β Lac', 'head'], ['α Lac', 'neck'], [110609, 'neck'], [111022, 'shoulder'], [110351, 'back'], [111104, 'hips'], [111944, 'hind thigh'], [109754, 'tail'], [109937, 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const t1 = s(109754), t2 = s(109937);
    const path = [[0.1, 5.8, 0.9], [-0.3, 4.6, 0.9], [-0.4, 2.8, 1.16], [0.1, 0.9, 1.4], [-0.2, -1.0, 1.32], [-0.6, -2.4, 1.12], [0.2, -4.0, 0.84], [t1[0] - 0.1, t1[1] + 0.2, 0.62], [t2[0] + 0.1, t2[1], 0.5], [0.5, -9.5, 0.38], [-1.8, -10.0, 0.28], [-3.6, -8.8, 0.18], [-3.9, -7.2, 0.1], [-3.0, -6.6, 0.03]];
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

    // A foot: five long clawed toes fanned from the wrist.
    const foot = (x, y, angle, tone) => {
      [-52, -24, 2, 28, 54].forEach((d, i) => {
        const a = ((angle + d) * Math.PI) / 180, l = [0.6, 0.92, 1.1, 0.98, 0.7][i], bend = d * 0.3;
        const b = ((angle + d + bend) * Math.PI) / 180;
        const m = [x + Math.cos(a) * l * 0.55, y + Math.sin(a) * l * 0.55], e = [m[0] + Math.cos(b) * l * 0.45, m[1] + Math.sin(b) * l * 0.45];
        limb([[x, y, 0.13], [...m, 0.085], [...e, 0.07]], { tone, hatch: angle + d + 60, shadow: 0.35, melt: 0.05, band: 0.05, flat: 0.8 });
        limb([[...e, 0.06], [e[0] + Math.cos(b) * 0.28, e[1] + Math.sin(b) * 0.28, 0.01]], { tone: 1.34, shadow: 0.15, melt: 0, band: 0.03 });
      });
    };

    // Forked tongue, the warm note.
    limb([[0.72, 9.3, 0.06], [0.84, 10.0, 0.05]], { tone: 1.2, warm: 0.8, shadow: 0, melt: 0, band: 0.03 });
    limb([[0.84, 10.0, 0.05], [0.72, 10.5, 0.02]], { tone: 1.2, warm: 0.8, shadow: 0, melt: 0, band: 0.03 });
    limb([[0.84, 10.0, 0.05], [1.12, 10.42, 0.02]], { tone: 1.2, warm: 0.8, shadow: 0, melt: 0, band: 0.03 });

    // Legs, splayed out flat and bent at elbow and knee, under the body.
    const legs = [
      [[[-1.0, 2.8, 0.56], [-2.7, 3.9, 0.42], [-3.2, 2.7, 0.34], [-3.7, 1.9, 0.24]], [-3.75, 1.85], 232],
      [[[0.6, 3.0, 0.56], [2.2, 4.3, 0.42], [3.1, 3.4, 0.34], [3.8, 2.7, 0.24]], [3.85, 2.65], 318],
      [[[-1.2, -1.5, 0.76], [-3.2, -0.7, 0.56], [-4.0, -2.2, 0.38], [-4.6, -3.1, 0.25]], [-4.65, -3.15], 236],
      [[[0.4, -2.2, 0.76], [2.6, -1.0, 0.56], [3.7, -2.2, 0.38], [4.4, -3.1, 0.25]], [4.45, -3.15], 306],
    ];
    legs.forEach(([spine, wrist, angle], i) => {
      limb(spine, { tone: 1.02 + (i % 2) * 0.04, hatch: 60, shadow: 0.55, melt: 0.5, band: 0.3, creases: [{ pts: [spine[1], [(spine[1][0] + spine[2][0]) / 2 + 0.05, (spine[1][1] + spine[2][1]) / 2], spine[2]], w: 0.04, depth: 0.06 }] });
      for (let k = 0; k < spine.length - 1; k++) {
        const a = spine[k], b = spine[k + 1];
        for (let t = 0.1; t < 0.95; t += 0.22) line([[a[0] + (b[0] - a[0]) * t - 0.14, a[1] + (b[1] - a[1]) * t + 0.1], [a[0] + (b[0] - a[0]) * t + 0.1, a[1] + (b[1] - a[1]) * t + 0.14], [a[0] + (b[0] - a[0]) * t + 0.14, a[1] + (b[1] - a[1]) * t - 0.1]], { w: 0.022, v: 0.4 });
      }
      foot(wrist[0], wrist[1], angle, 1.04);
    });

    // Body and tail, one long supple form narrowing to a thread.
    limb(path, { tone: 1.16, hatch: 30, shadow: 0.62, band: 0.9, melt: 0, spacing: 1.0, bumps: [{ at: [0.0, 0.9], r: [1.2, 2.0], h: 0.3 }] });

    // Rows of keeled scales across the back, a darker band every few rows.
    for (let d = 0.3, i = 0; d < total - 1.4; i++) {
      const p = at(d), z = 0.16 + p.r * 0.11;
      const rows = p.r > 0.8 ? [-0.82, -0.56, -0.28, 0, 0.28, 0.56, 0.82] : p.r > 0.4 ? [-0.6, -0.2, 0.2, 0.6] : [0];
      for (const k of rows) {
        const sh = (i % 2) * z * 0.6;
        line([off(p, sh - z * 0.5, p.r * k + z * 0.5), off(p, sh + z * 0.5, p.r * k), off(p, sh - z * 0.5, p.r * k - z * 0.5)], { w: 0.022, v: 0.58 });
      }
      d += z * 1.15;
    }
    // A broken zigzag down the spine.
    const zig = [];
    for (let d = 0.6, f = 1; d < total - 5; d += 0.52, f = -f) { const p = at(d); zig.push(off(p, 0, f * p.r * 0.22)); }
    line(zig, { w: 0.07, v: 0.62, dark: true, taper: false });
    for (const k of [-0.62, 0.62]) {
      const run = [];
      for (let d = 1; d < total - 8; d += 0.7) { const p = at(d); run.push(off(p, 0, p.r * k)); }
      line(run, { w: 0.06, v: 0.42, dark: true });
    }

    // Head from above: a blunt arrow, the jaw muscles swelling behind the eyes.
    blob([[-1.0, 5.4], [-1.28, 6.4], [-1.0, 7.5], [-0.36, 8.6], [0.34, 9.3], [0.92, 9.3], [1.26, 8.4], [1.6, 7.3], [1.56, 6.2], [0.86, 5.3], [-0.2, 5.0]], {
      round: 0.7, tone: 1.28, hatch: 66, shadow: 0.62, spacing: 0.88, band: 0.18,
      creases: [
        { pts: [[-0.3, 6.1], [0.3, 6.4], [0.86, 6.0]], w: 0.05, depth: 0.08 }, { pts: [[0.3, 6.4], [0.42, 7.2], [0.56, 8.2]], w: 0.05, depth: 0.08 },
        { pts: [[-0.5, 7.2], [0.0, 7.1], [0.5, 7.2], [1.0, 7.3]], w: 0.05, depth: 0.08 }, { pts: [[-0.2, 8.0], [0.5, 8.0], [1.0, 8.1]], w: 0.04, depth: 0.07 },
        { pts: [[-0.9, 6.0], [-0.5, 5.6], [-0.1, 5.5]], w: 0.05, depth: 0.08 }, { pts: [[1.4, 6.3], [1.0, 5.7], [0.6, 5.6]], w: 0.05, depth: 0.08 },
      ],
      bumps: [{ at: [-0.6, 6.0], r: [0.6, 0.7], h: 0.14 }, { at: [1.2, 6.2], r: [0.6, 0.7], h: 0.14 }],
    });
    // Eyes on the sides of the head, brow plates over them, nostrils at the tip.
    for (const [x, y, gx] of [[-0.74, 7.3, 0.04], [1.32, 7.5, -0.04]]) {
      limb([[x, y + 0.2, 0.08], [x, y, 0.24], [x + 0.02, y - 0.2, 0.08]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.04 });
      limb([[x + gx, y + 0.03, 0.12], [x + gx, y + 0.02, 0.11]], { tone: 1.6, shadow: 0, melt: 0, edge: 0 });
      limb([[x + gx, y + 0.02, 0.06], [x + gx, y + 0.01, 0.06]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    }
    for (const [x, y] of [[0.28, 8.86], [0.86, 8.9]]) limb([[x, y, 0.05], [x, y + 0.02, 0.05]], { tone: 0.15, shadow: 0, melt: 0, edge: 0 });
  },
};
