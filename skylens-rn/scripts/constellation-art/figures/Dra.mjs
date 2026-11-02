// The Dragon, Ladon of the golden apples, coiled round the pole of the ecliptic. Eltanin on the
// snout, Grumium on the crown, Nu at the hinge of the jaw and Rastaban on the dropped lower jaw, so
// the Lozenge is his open mouth. The body runs by Altais, a crook through Epsilon and Chi, Aldhibah,
// Athebyne, Edasich and Thuban, and the tail ends in a spade past Giausar.
import { spline } from '../engrave.mjs';

// The head is drawn in its own frame, u from the back of the skull to the nose, v up the face.
const R = [-6.8, -9.2], A = [-0.73, -0.68], N = [-0.68, 0.73];
const H = (p) => [R[0] + p[0] * A[0] + p[1] * N[0], R[1] + p[0] * A[1] + p[1] * N[1], ...p.slice(2)];
const HL = (l) => l.map(H);
const HC = (l) => l.map((k) => ({ ...k, pts: HL(k.pts) }));

export default {
  tier: 'extended',
  subject: 'The Dragon',
  pixels: 1100,
  anchors: [['Eltanin', 'snout'], ['Grumium', 'crown'], ['Rastaban', 'lower jaw'], [85829, 'hinge of the jaw'], ['Altais', 'neck'], [97433, 'coil'], [89937, 'coil'], [89908, 'coil'], ['Aldhibah', 'body'], ['Athebyne', 'body'], [78527, 'body'], ['Edasich', 'body'], ['Thuban', 'tail'], [61281, 'tail'], ['Giausar', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const q = (k, r) => [...s(k), r];
    const path = [
      [-7.4, -8.0, 1.2], [-8.9, -5.6, 1.08], [-11.4, -2.6, 1.14], [-12.7, 1.0, 1.26], q('Altais', 1.4), q(97433, 1.46), [-11.3, 12.2, 1.52], [-8.0, 10.9, 1.56],
      [-6.6, 7.8, 1.66], [-5.2, 4.6, 1.8], q('Aldhibah', 2.0), q('Athebyne', 2.1), q(78527, 2.0), [8.9, -8.5, 1.9], [11.8, -7.0, 1.76], [14.0, -2.2, 1.56], q('Thuban', 1.26),
      [18.3, 9.0, 1.0], q(61281, 0.76), [19.6, 17.0, 0.54], q('Giausar', 0.36), [22.8, 20.4, 0.16],
    ];
    // Walk the spine at even steps, for the spines, plates and scales.
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

    // Far horn, behind the skull.
    limb(HL([[0.2, 1.5, 0.42], [-1.6, 2.7, 0.36], [-3.6, 3.0, 0.22], [-5.2, 2.5, 0.04]]), { tone: 0.84, warm: 0.3, hatch: 40, shadow: 0, melt: 0 });

    // Dorsal spines: a saw of swept-back fins the length of the back, tallest over the coil.
    for (let d = 3.2, i = 0; d < total - 5; i++) {
      const p = at(d), h = p.r * 1.0 + 0.3, w = 0.5 + p.r * 0.42;
      const a = off(p, -w, p.r * 0.7), b = off(p, w, p.r * 0.7), tip = off(p, w * 1.5, p.r + h), mid = off(p, -w * 0.2, p.r + h * 0.5), mid2 = off(p, w * 1.0, p.r + h * 0.3);
      blob([a, mid, [...tip, 'c'], mid2, b], { round: 0.3, tone: 0.92, hatch: 60, shadow: 0, band: 0.2, creases: [{ pts: [off(p, 0, p.r * 0.9), off(p, w * 0.7, p.r + h * 0.5), off(p, w * 1.3, p.r + h * 0.86)], w: 0.05, depth: 0.08 }] });
      d += w * 2 + 0.1;
    }

    // Lower jaw and the open mouth behind the head, so the skull sits over them.
    blob(HL([[0.6, -1.6], [4.6, -1.0], [3.8, -3.4], [1.4, -3.0]]), { round: 0.3, tone: 0.34, hatch: 30, shadow: 0, edge: 0 });

    // The body, a long tapering tube, its lines following it round the coils.
    limb(path, { tone: 1.14, hatch: 30, shadow: 0.6, band: 2.0, melt: 0, spacing: 1.08, bumps: [{ at: [2.0, -3.6], r: [3.4, 2.4], angle: -40, h: 0.4 }] });

    // Scales: staggered rows of crescents across the back.
    for (let d = 2, i = 0; d < total - 3; d += 0.92, i++) {
      const p = at(d);
      for (const [k, v] of [[-0.05, 0.58], [0.3, 0.52], [0.64, 0.44]]) {
        const sh = (i % 2) * 0.46, c = off(p, sh, p.r * k), z = 0.46 * (0.5 + p.r * 0.5);
        line([off(p, sh + z, p.r * k + z * 0.62), off(p, sh + z * 1.4, p.r * k), off(p, sh + z, p.r * k - z * 0.62)], { w: 0.05, v: v * 0.62 });
        if (!c) return;
      }
    }
    // Belly plates on the inside of every curve, cut square across.
    for (let d = 1.4; d < total - 2; d += 0.84) {
      const p = at(d);
      line([off(p, -0.1, -p.r * 0.98), off(p, 0.1, -p.r * 0.7), off(p, 0.08, -p.r * 0.32)], { w: 0.055, v: 0.5, dark: true });
      line([off(p, -0.2, -p.r * 0.96), off(p, -0.02, -p.r * 0.7), off(p, -0.04, -p.r * 0.34)], { w: 0.022, v: 0.6 });
    }
    const belly = [];
    for (let d = 1; d < total - 2; d += 1.6) { const p = at(d); belly.push(off(p, 0, -p.r * 0.3)); }
    line(belly, { w: 0.07, v: 0.6, dark: true, taper: false });

    // The spade at the end of the tail, the warm note.
    const end = at(total - 0.2);
    const e = (a, b) => off(end, a, b);
    blob([e(-1.0, 0.16), e(0.1, 0.42), [...e(-0.5, 1.9), 'c'], e(1.1, 1.12), e(2.3, 0.44), [...e(4.2, 0.0), 'c'], e(2.3, -0.44), e(1.1, -1.12), [...e(-0.5, -1.9), 'c'], e(0.1, -0.42), e(-1.0, -0.16)], {
      round: 0.26, tone: 1.14, warm: 0.42, hatch: 50, shadow: 0.4, band: 0.2,
      creases: [{ pts: [e(-0.4, 0), e(1.4, 0), e(3.4, 0)], w: 0.06, depth: 0.1 }, { pts: [e(0.5, 0.3), e(0.4, 0.9), e(0.0, 1.4)], w: 0.04, depth: 0.06 }, { pts: [e(0.5, -0.3), e(0.4, -0.9), e(0.0, -1.4)], w: 0.04, depth: 0.06 }],
    });

    // The frill behind the jaw: a fan of bony rays with skin between.
    for (const [a, b, c] of [[[-0.3, -0.8], [-2.6, 0.4], [-4.8, 0.3]], [[-0.3, -1.3], [-2.8, -1.0], [-5.0, -1.8]], [[-0.1, -1.8], [-2.4, -2.4], [-4.2, -3.8]], [[0.3, -2.4], [-1.6, -3.6], [-2.6, -5.4]]]) {
      blob(HL([a, [b[0], b[1] + 0.7], [...c, 'c'], [b[0] + 0.3, b[1] - 0.7], [a[0] + 0.8, a[1] - 0.4]]), { round: 0.3, tone: 1.0, hatch: 44, shadow: 0.5, band: 0.16, creases: HC([{ pts: [a, b, c], w: 0.06, depth: 0.12 }]) });
    }

    // Lower jaw, heavy and hanging, with Rastaban on it.
    blob(HL([[-0.4, -1.3], [0.9, -1.5], [2.4, -2.5], [4.2, -3.5], [5.8, -4.1], [6.9, -4.3, 'c'], [6.0, -5.5], [3.4, -5.3], [1.4, -4.6], [0.0, -3.2]]), {
      round: 0.56, tone: 1.34, hatch: 50, shadow: 0.55, band: 0.3,
      creases: HC([{ pts: [[0.8, -2.2], [2.6, -3.5], [5.0, -4.5]], w: 0.08, depth: 0.14 }, { pts: [[1.0, -3.5], [2.4, -4.2], [3.8, -4.7]], w: 0.06, depth: 0.1 }]),
    });
    // Lower teeth.
    for (const [u, v, l] of [[3.0, -2.9, 0.6], [3.9, -3.4, 0.5], [4.8, -3.75, 0.72], [5.6, -4.0, 0.6]]) {
      limb(HL([[u - 0.1, v - 0.1, 0.18], [u + 0.1, v + l * 0.5, 0.11], [u + 0.3, v + l, 0.02]]), { tone: 1.3, shadow: 0.2, melt: 0, band: 0.08 });
    }
    // Tongue, forked, the second small warm note.
    limb(HL([[1.0, -2.0, 0.26], [2.8, -2.0, 0.24], [4.6, -2.6, 0.17], [6.0, -2.7, 0.1]]), { tone: 1.1, warm: 0.6, hatch: 40, shadow: 0.42, melt: 0 });
    limb(HL([[5.9, -2.7, 0.09], [6.9, -2.5, 0.05], [7.6, -2.1, 0.02]]), { tone: 1.1, warm: 0.6, shadow: 0.3, melt: 0 });
    limb(HL([[5.9, -2.7, 0.09], [6.8, -3.2, 0.05], [7.5, -3.3, 0.02]]), { tone: 1.1, warm: 0.6, shadow: 0.3, melt: 0 });
    // Upper teeth.
    for (const [u, v, l] of [[2.6, -1.2, 0.8], [3.5, -1.0, 0.62], [4.3, -0.96, 1.0], [5.2, -0.96, 0.66], [6.0, -0.96, 0.6], [6.8, -0.86, 1.1]]) {
      limb(HL([[u - 0.1, v + 0.1, 0.2], [u + 0.05, v - l * 0.5, 0.12], [u + 0.2, v - l, 0.02]]), { tone: 1.3, shadow: 0.2, melt: 0, band: 0.08 });
    }

    // The skull: heavy brow, long flat muzzle, a raised nostril at the end.
    blob(HL([[-0.9, 1.4], [0.8, 2.5], [2.4, 2.2], [3.6, 1.2], [5.4, 0.86], [6.8, 1.2], [7.7, 0.9], [8.1, 0.1], [7.8, -0.6], [6.6, -1.0], [4.0, -1.0], [2.0, -1.3], [0.6, -2.1], [-0.8, -1.0]]), {
      round: 0.85, tone: 1.46, hatch: 44, shadow: 0.62, spacing: 0.9, band: 0.4,
      creases: HC([
        { pts: [[0.7, 1.5], [2.0, 1.6], [3.2, 0.8]], w: 0.13, depth: 0.28 },
        { pts: [[0.1, 0.1], [1.0, -0.8], [2.6, -0.8]], w: 0.1, depth: 0.16 },
        { pts: [[3.4, 0.4], [5.2, 0.2], [7.0, 0.3]], w: 0.07, depth: 0.1 },
        { pts: [[3.0, -0.4], [4.4, -0.4], [6.0, -0.4]], w: 0.06, depth: 0.08 },
        { pts: [[6.9, 0.7], [7.3, 0.56], [7.6, 0.3]], w: 0.09, depth: 0.2 },
      ]),
      bumps: [{ at: H([1.6, 1.3]), r: [1.4, 0.9], angle: 40, h: 0.24 }, { at: H([0.6, -0.5]), r: [1.2, 1.1], h: 0.26 }, { at: H([7.0, 0.5]), r: [0.8, 0.6], h: 0.22 }],
    });
    // Eye.
    limb(HL([[1.4, 0.92, 0.09], [2.0, 0.94, 0.3], [2.7, 0.7, 0.07]]), { tone: 0.5, shadow: 0.4, melt: 0, rim: 1, band: 0.06 });
    limb(HL([[1.95, 0.92, 0.19], [2.0, 0.92, 0.18]]), { tone: 1.2, warm: 0.76, shadow: 0, melt: 0, edge: 0 });
    limb(HL([[2.02, 1.1, 0.03], [2.0, 0.74, 0.03]]), { tone: 0.05, shadow: 0, melt: 0, edge: 0 });

    // Near horn, the long back-swept sweep from the brow, ringed.
    limb(HL([[0.8, 1.9, 0.56], [-1.0, 3.3, 0.5], [-3.4, 4.1, 0.34], [-5.9, 3.8, 0.17], [-7.8, 2.9, 0.03]]), {
      tone: 1.1, warm: 0.3, hatch: 40, shadow: 0.5, melt: 0, band: 0.3,
      creases: HC([{ pts: [[0.5, 1.6], [0.1, 2.2], [0.1, 2.6]], w: 0.05, depth: 0.08 }, { pts: [[-0.5, 2.3], [-0.8, 2.9], [-0.7, 3.5]], w: 0.05, depth: 0.08 }, { pts: [[-1.6, 2.9], [-1.7, 3.4], [-1.6, 3.9]], w: 0.05, depth: 0.08 }]),
    });
  },
};
