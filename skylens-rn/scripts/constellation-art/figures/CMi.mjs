// The Little Dog, a small fox-faced spitz bounding west after his master, all ruff and plume, the
// opposite of the lean Great Dog. Gomeisa sits on the shoulder and Procyon on the loin. Drawn level
// in its own frame and laid along the line of the two stars.
import { fur, paw } from '../kit.mjs';

const TILT = 34;
const c = Math.cos((TILT * Math.PI) / 180), n = Math.sin((TILT * Math.PI) / 180);
const T = (p) => [p[0] * c - p[1] * n, p[0] * n + p[1] * c, ...p.slice(2)];
const P = (list) => list.map(T);
const C = (list) => list.map((k) => ({ ...k, pts: P(k.pts) }));
const B = (list) => list.map((k) => ({ ...k, at: T(k.at), angle: (k.angle ?? 0) + TILT }));

export default {
  tier: 'extended',
  subject: 'The Little Dog',
  pixels: 1100,
  anchors: [['Gomeisa', 'shoulder'], ['Procyon', 'loin']],
  draw({ E }) {
    const { blob, limb, strands } = E;
    const L = (pts, o) => limb(P(pts), { ...o, creases: o.creases && C(o.creases), bumps: o.bumps && B(o.bumps) });
    const F = (pts, o) => blob(P(pts), { ...o, creases: o.creases && C(o.creases), bumps: o.bumps && B(o.bumps) });
    const pawAt = (p, len, angle, o) => paw(E, T(p), len, angle + TILT, o);

    // Far ear.
    F([[4.95, 3.3], [5.1, 4.1], [5.62, 5.0, 'c'], [5.95, 4.1], [5.95, 3.2]], { round: 0.3, tone: 0.86, hatch: 60, shadow: 0, creases: [{ pts: [[5.35, 3.6], [5.5, 4.2], [5.6, 4.7]], w: 0.07, depth: 0.1 }] });

    // Far legs.
    L([[2.6, -0.6, 1.0], [3.9, -1.5, 0.62], [5.3, -1.5, 0.4], [6.0, -1.2, 0.33]], { tone: 0.72, hatch: 150, shadow: 0.5 });
    pawAt([6.0, -1.2], 0.82, 12, { tone: 0.8 });
    L([[-3.2, -0.8, 1.2], [-3.6, -2.0, 0.8], [-5.0, -2.5, 0.4], [-5.9, -3.2, 0.32]], { tone: 0.72, hatch: 70, shadow: 0.5 });
    pawAt([-5.9, -3.2], 0.8, -135, { tone: 0.78 });

    // The plumed tail, curled forward over the back, drawn before the body.
    L([[-3.6, 1.2, 0.7], [-4.7, 2.3, 0.8], [-4.5, 3.6, 0.9], [-3.2, 4.2, 0.82], [-2.0, 3.8, 0.56], [-1.5, 3.0, 0.2]], { tone: 0.74, hatch: 40, shadow: 0.5, melt: 0.4, band: 0.14, edge: 0.25 });

    // Near hind leg, furred trousers and a hard small hock.
    L([[-2.6, -0.3, 1.8], [-2.8, -1.8, 1.3], [-3.5, -2.8, 0.66], [-3.3, -3.9, 0.42], [-2.9, -4.5, 0.36]], {
      tone: 1.02, hatch: 80, shadow: 0.6,
      creases: [{ pts: [[-1.4, -1.6], [-2.0, -2.6], [-2.9, -3.2]], w: 0.09, depth: 0.14 }, { pts: [[-4.3, -0.6], [-4.3, -1.8], [-4.0, -2.6]], w: 0.09, depth: 0.12 }],
      bumps: [{ at: [-2.8, -1.0], r: [1.4, 1.5], h: 0.36 }],
    });
    pawAt([-2.9, -4.5], 0.92, -4);

    // A compact barrel of a body.
    const body = [[2.0, 2.3], [0.2, 2.1], [-2.0, 2.0], [-3.8, 1.6], [-4.3, 0.2], [-3.4, -1.5], [-1.0, -1.4], [1.0, -1.5], [2.6, -2.0], [3.9, -0.8], [4.0, 1.2], [3.4, 2.4]];
    F(body, {
      round: 1.5, tone: 1.0, hatch: 10, shadow: 0.66, band: 0.26,
      creases: [{ pts: [[1.4, 2.0], [1.0, 0.2], [1.5, -1.4]], w: 0.14, depth: 0.2 }, { pts: [[-1.8, 1.9], [-2.2, 0.4], [-1.6, -1.2]], w: 0.12, depth: 0.16 }],
      bumps: [{ at: [2.4, 0.0], r: [1.6, 1.8], h: 0.4 }, { at: [-2.8, 0.4], r: [1.4, 1.4], h: 0.3 }],
    });

    // Near foreleg, feathered at the back.
    L([[2.4, -0.2, 1.3], [3.0, -1.7, 0.78], [4.2, -2.7, 0.44], [5.0, -3.0, 0.36]], {
      tone: 1.06, hatch: 140, shadow: 0.6,
      creases: [{ pts: [[2.1, -1.6], [2.9, -2.6], [3.8, -3.1]], w: 0.09, depth: 0.14 }],
      bumps: [{ at: [4.2, -2.7], r: [0.4, 0.4], h: 0.12 }],
    });
    pawAt([5.0, -3.0], 0.92, -6);

    // Coat, standing out and thrown back by the leap. The ruff first, then the rest.
    fur(E, P(body), { n: 2400, angle: 180 + TILT, len: 0.62, seed: 3, jitter: 18, v: 0.46, w: 0.017, flow: (x, y) => (y - x) * 2 });
    const A = (a) => a + TILT;
    strands(P([[-4.1, 1.2], [-2, 2.1], [0.4, 2.2], [2.2, 2.4]]), { n: 620, angle: A(162), len: 0.86, jitter: 20, v: 0.5, spread: 0.2, seed: 5, w: 0.017 });
    strands(P([[-3.4, -1.4], [-1.0, -1.4], [1.0, -1.5]]), { n: 460, angle: A(212), len: 0.8, jitter: 22, v: 0.44, spread: 0.15, seed: 6, w: 0.017 });
    strands(P([[-4.1, -0.6], [-3.9, -2.0], [-3.8, -2.8]]), { n: 220, angle: A(190), len: 0.7, jitter: 18, v: 0.46, spread: 0.1, seed: 7, w: 0.017 });
    strands(P([[2.2, -1.2], [2.6, -2.3], [3.2, -2.9]]), { n: 180, angle: A(200), len: 0.62, jitter: 18, v: 0.44, spread: 0.1, seed: 8, w: 0.017 });
    // Plume hairs fanning from the tail.
    strands(P([[-4.7, 2.3], [-4.5, 3.6], [-3.2, 4.2], [-2.0, 3.8]]), { n: 1300, angle: A(135), len: 1.0, jitter: 30, v: 0.54, spread: 0.5, seed: 9, curl: 1, w: 0.017 });
    strands(P([[-3.9, 2.6], [-3.3, 3.2], [-2.4, 3.2]]), { n: 800, angle: A(-60), len: 0.8, jitter: 30, v: 0.5, spread: 0.5, seed: 10, curl: 1, w: 0.017 });

    // The ruff, a thick collar of fur standing round the neck.
    const ruff = [[2.2, 3.0], [3.4, 3.7], [4.6, 3.2], [5.0, 1.4], [4.6, -0.4], [3.4, -1.6], [2.0, -1.0], [1.5, 1.0]];
    F(ruff, { round: 1.0, tone: 0.92, hatch: 60, shadow: 0.5, edge: 0, relief: 0.3 });
    const fromFace = (x, y) => { const f = T([6.0, 2.4]); return (Math.atan2(y - f[1], x - f[0]) * 180) / Math.PI; };
    fur(E, P(ruff), { n: 2200, angle: 0, flow: fromFace, len: 1.2, jitter: 16, curl: 0.8, seed: 11, v: 0.5, lit: 0.1, w: 0.017 });
    strands(P([[1.8, 2.8], [1.3, 1.0], [1.9, -0.8], [3.2, -2.0], [4.6, -1.2]]), { n: 640, angle: 0, flow: fromFace, len: 1.2, jitter: 20, v: 0.5, spread: 0.3, seed: 12, curl: 1, w: 0.017 });

    // Head: a neat fox wedge, wide at the cheek, fine at the nose, tilted up with the leap.
    F([[3.7, 2.9], [4.2, 3.6], [5.1, 3.75], [5.9, 3.45], [6.5, 2.9], [7.2, 2.7], [7.7, 2.55], [7.85, 2.2], [7.5, 1.9], [6.7, 1.68], [5.8, 1.55], [4.8, 1.3], [3.9, 1.7]], {
      round: 0.8, tone: 1.24, hatch: 24, shadow: 0.62, spacing: 0.88, band: 0.2,
      creases: [
        { pts: [[7.7, 2.05], [6.9, 2.02], [6.2, 2.15], [5.75, 2.42]], w: 0.07, depth: 0.15 },
        { pts: [[5.1, 3.0], [5.6, 3.14], [6.08, 2.86]], w: 0.09, depth: 0.16 },
        { pts: [[4.4, 2.9], [4.7, 2.2], [5.3, 1.7]], w: 0.08, depth: 0.1 },
        { pts: [[6.3, 2.75], [6.9, 2.5], [7.4, 2.4]], w: 0.05, depth: 0.06 },
      ],
      bumps: [{ at: [4.7, 2.4], r: [0.8, 0.9], h: 0.2 }],
    });
    fur(E, P([[3.8, 2.8], [4.3, 3.5], [5.2, 3.5], [5.4, 2.0], [4.6, 1.5], [3.9, 1.8]]), { n: 420, angle: A(190), len: 0.36, seed: 13, jitter: 22, v: 0.46, w: 0.015 });
    // A bright black eye.
    L([[5.45, 2.76, 0.07], [5.65, 2.75, 0.14], [5.92, 2.62, 0.05]], { tone: 0.5, shadow: 0.4, melt: 0, rim: 1 });
    L([[5.62, 2.8, 0.05], [5.63, 2.79, 0.05]], { tone: 1.6, warm: 0.5, shadow: 0, melt: 0, edge: 0 });
    // Nose.
    F([[7.5, 2.68], [7.9, 2.55], [8.0, 2.3], [7.8, 2.14], [7.5, 2.34]], { round: 0.14, tone: 0.8, shadow: 0.3 });

    // Near ear, a pricked triangle.
    F([[3.95, 3.2], [4.1, 4.1], [4.5, 5.15, 'c'], [5.1, 4.1], [5.2, 3.3], [4.6, 3.0]], {
      round: 0.36, tone: 1.14, hatch: 70, shadow: 0.5, band: 0.2,
      creases: [{ pts: [[4.5, 3.4], [4.55, 4.0], [4.55, 4.7]], w: 0.13, depth: 0.2 }],
    });
    strands(P([[4.3, 3.3], [4.5, 3.8]]), { n: 60, angle: A(80), len: 0.4, jitter: 26, v: 0.42, spread: 0.12, seed: 14, w: 0.017 });

    // A little bell at the throat, the warm note, half sunk in the ruff.
    L([[4.02, 0.9, 0.05], [4.05, 0.7, 0.2], [4.08, 0.56, 0.17]], { tone: 1.3, warm: 0.8, hatch: 40, shadow: 0.5, melt: 0, band: 0.08 });
  },
};
