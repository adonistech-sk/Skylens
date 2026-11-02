// The Lynx, springing up and west along the whole diagonal of its faint line, thrown at something
// out of sight. The top star sits under the eye, the next on the back of the skull, then the chest,
// the belly and the haunch, and the two bright stars at the foot on the hock and the driving foot.
// Tufted ears, a flared ruff, big padded paws and a stub of a tail make the animal.
import { fur, paw } from '../kit.mjs';

const R = [10.6, 13.0], A = [0.91, 0.41], N = [-0.41, 0.91];
const Z = 1.34;
const H = (p) => [R[0] + (p[0] * A[0] + p[1] * N[0]) * Z, R[1] + (p[0] * A[1] + p[1] * N[1]) * Z, ...p.slice(2).map((v) => (typeof v === 'number' ? v * Z : v))];
const HL = (l) => l.map(H);
const HC = (l) => l.map((k) => ({ ...k, pts: HL(k.pts) }));

export default {
  tier: 'extended',
  subject: 'The Lynx',
  pixels: 1100,
  anchors: [[30060, 'cheek under the eye'], [33449, 'back of the skull'], [36145, 'chest'], ['Alsciaukat', 'belly'], [44248, 'haunch'], [45688, 'hock'], ['α Lyn', 'hind foot']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const hock = s(45688), foot = s('α Lyn');

    // Far ear with its long black tuft.
    blob(HL([[1.9, 1.9], [2.2, 3.6], [3.3, 5.1, 'c'], [3.8, 3.4], [3.7, 2.0]]), { round: 0.4, tone: 0.86, hatch: 60, shadow: 0, band: 0.2, creases: HC([{ pts: [[2.8, 2.2], [3.0, 3.4], [3.2, 4.6]], w: 0.1, depth: 0.16 }]) });
    strands(HL([[3.2, 4.7], [3.3, 5.1]]), { n: 90, angle: 112, len: 2.2, jitter: 6, v: 0.7, spread: 0.1, seed: 2, w: 0.03 });

    // Far foreleg, reaching highest, the paw spread.
    limb([[8.2, 5.4, 2.8], [12.4, 6.4, 1.8], [16.4, 8.8, 1.14], [18.3, 10.2, 0.96]], { tone: 0.74, hatch: 140, shadow: 0.5 });
    paw(E, [18.1, 10.0], 1.9, 36, { tone: 0.82 });

    // Far hind leg, under the body.
    limb([[-6.0, -3.4, 3.1], [-4.6, -8.2, 2.0], [-7.2, -11.0, 1.04], [-8.2, -13.8, 0.8], [-8.4, -14.6, 0.74]], { tone: 0.72, hatch: 66, shadow: 0.5 });
    paw(E, [-8.5, -14.8], 1.7, -104, { tone: 0.78 });

    // The bob tail, short, blunt and black at the tip.
    limb([[-9.8, -0.4, 1.3], [-11.2, 0.5, 1.2], [-12.2, 1.4, 1.06], [-12.8, 2.0, 0.92]], { tone: 1.0, hatch: 30, shadow: 0.45, melt: 0.4, band: 0.3 });
    limb([[-12.1, 1.3, 1.08], [-12.7, 1.9, 1.0], [-13.1, 2.4, 0.74]], { tone: 0.4, hatch: 30, shadow: 0.3, melt: 0, band: 0.2 });
    strands([[-10.2, 0.6], [-12.6, 2.4]], { n: 420, angle: 140, len: 0.9, jitter: 22, v: 0.5, spread: 1.8, seed: 3, w: 0.028 });

    // Near hind leg: the heavy thigh, the knee, a long shank to the hock, the foot on Alpha.
    limb([[-7.6, -2.4, 4.0], [-7.4, -6.4, 3.0], [-9.4, -8.2, 1.8], [hock[0] + 0.1, hock[1], 1.06], [foot[0] + 0.2, foot[1] + 0.3, 0.92]], {
      tone: 1.04, hatch: 56, shadow: 0.6, melt: 1.6,
      creases: [{ pts: [[-4.2, -5.0], [-5.8, -8.0], [-8.4, -9.4]], w: 0.18, depth: 0.28 }, { pts: [[-11.2, -3.8], [-11.0, -6.2], [-11.4, -8.2]], w: 0.14, depth: 0.2 }],
      bumps: [{ at: [-7.8, -3.6], r: [3.0, 3.0], h: 0.7 }, { at: hock, r: [0.7, 0.8], h: 0.18 }],
    });
    paw(E, [foot[0] - 0.2, foot[1] - 0.5], 2.0, -108);

    // Long body, the back arched by the spring.
    const body = [[6.6, 7.8], [3.0, 5.6], [-2.0, 3.8], [-7.0, 2.4], [-10.4, 0.2], [-11.6, -3.0], [-10.6, -6.0], [-7.6, -7.2], [-4.0, -6.6], [-0.8, -5.4], [3.0, -2.6], [6.8, -1.6], [10.0, 0.4], [10.8, 3.8], [9.0, 6.4]];
    blob(body, {
      round: 3.2, tone: 1.06, hatch: 24, shadow: 0.68, band: 0.7,
      creases: [{ pts: [[3.0, 5.0], [1.8, 2.0], [2.8, -2.2]], w: 0.22, depth: 0.28 }, { pts: [[-2.6, 3.4], [-3.0, 0.0], [-2.0, -5.0]], w: 0.15, depth: 0.16 }, { pts: [[0.2, 4.2], [-0.4, 1.0], [0.2, -3.4]], w: 0.13, depth: 0.14 }],
      bumps: [{ at: [5.8, 2.4], r: [3.4, 3.4], h: 0.7 }, { at: [-8.0, -2.4], r: [3.0, 3.2], h: 0.6 }],
    });

    // Near foreleg, the great paw flung forward with the claws out.
    limb([[6.8, 2.6, 3.2], [10.0, 0.6, 2.0], [14.2, 1.8, 1.26], [16.8, 3.4, 1.06]], {
      tone: 1.08, hatch: 124, shadow: 0.62, melt: 1.8,
      creases: [{ pts: [[7.0, -1.0], [10.4, -1.2], [13.4, 0.4]], w: 0.16, depth: 0.24 }, { pts: [[10.4, 2.8], [12.6, 3.4], [14.8, 3.4]], w: 0.12, depth: 0.16 }],
      bumps: [{ at: [9.4, 0.8], r: [2.0, 1.6], h: 0.4 }],
    });
    paw(E, [16.7, 3.3], 2.1, 28);

    // Coat, then the spots of it: a broken pattern of short dark dabs along the flank.
    fur(E, body, { n: 3200, angle: 200, len: 0.9, seed: 4, jitter: 16, v: 0.5, w: 0.028 });
    fur(E, [[-11.2, -2.0], [-7.6, 0.4], [-4.4, -5.0], [-6.6, -8.0], [-9.6, -9.0], [-11.2, -6.0]], { n: 900, angle: 232, len: 0.76, seed: 5, jitter: 16, v: 0.46, lit: 0.1, w: 0.028 });
    fur(E, [[6.8, 5.2], [11, 2.4], [15.6, 3.6], [15.6, 1.2], [11, -1.0], [6.8, -1.0]], { n: 700, angle: 196, len: 0.7, seed: 6, jitter: 16, v: 0.46, lit: 0.1, w: 0.028 });
    strands([[-10.4, 0.2], [-7.0, 2.4], [-2.0, 3.8], [3.0, 5.6], [6.6, 7.8]], { n: 900, angle: 164, len: 1.2, jitter: 18, v: 0.44, spread: 0.3, seed: 7, w: 0.028 });
    strands([[-7.6, -7.2], [-4.0, -6.6], [-0.8, -5.4], [3.0, -2.6]], { n: 700, angle: 236, len: 1.3, jitter: 16, v: 0.4, spread: 0.3, seed: 8, w: 0.028 });
    for (const [x, y] of [[4.8, 3.4], [2.4, 3.2], [0.0, 2.2], [-2.6, 1.8], [-5.0, 0.8], [-7.6, -0.2], [3.4, 1.0], [1.0, -0.2], [-1.4, -0.4], [-3.8, -1.6], [-6.2, -2.4], [-9.0, -2.0], [2.2, -1.4], [-0.2, -2.6], [-2.8, -3.6], [-5.4, -4.6], [-8.2, -4.4], [-7.0, -6.2], [-9.6, -5.8], [6.2, 0.4], [9.4, -0.2], [12.0, 1.0], [-9.4, -7.8], [5.6, -0.9]]) {
      line([[x - 0.26, y - 0.1], [x, y + 0.03], [x + 0.26, y + 0.1]], { w: 0.13, v: 0.46, dark: true });
    }

    // The neck, thick with fur.
    limb([[5.2, 3.2, 4.6], [7.8, 7.0, 3.5], [9.6, 10.4, 2.9], [10.6, 12.6, 2.5]], { tone: 1.1, hatch: 60, shadow: 0.62, band: 0.7, melt: 2.2 });
    fur(E, [[5, 6], [6.6, 8.6], [8.6, 12.4], [12.8, 11.0], [12.8, 7.0], [10, 3.0], [8, 1.0]], { n: 1500, angle: 240, len: 0.9, seed: 9, jitter: 16, v: 0.5, w: 0.028 });

    // The ruff: long flared sideburns, the lynx's whole face.
    const ruff = HL([[-1.4, 1.0], [-1.8, -1.2], [-1.0, -3.4], [0.8, -5.0, 'c'], [1.6, -3.4], [3.0, -5.0, 'c'], [3.8, -3.0], [4.6, -1.8], [3.4, -0.6], [1.2, 0.4]]);
    blob(ruff, { round: 0.8, tone: 0.92, hatch: 80, shadow: 0.5, edge: 0.2 });
    const fromEye = (x, y) => { const f = H([3.4, 0.6]); return (Math.atan2(y - f[1], x - f[0]) * 180) / Math.PI; };
    fur(E, ruff, { n: 2200, angle: 0, flow: fromEye, len: 1.9, jitter: 12, curl: 0.5, seed: 10, v: 0.6, w: 0.03 });
    strands(HL([[-1.6, 0.8], [-1.8, -1.4], [-0.6, -3.6], [1.0, -4.4], [3.0, -4.4], [4.0, -2.6]]), { n: 1300, angle: 0, flow: fromEye, len: 2.0, jitter: 14, v: 0.56, spread: 0.3, seed: 11, curl: 0.5, w: 0.03 });

    // Head, a short cat's face: domed skull, a blunt muzzle, a square chin.
    blob(HL([[-1.0, 0.0], [-0.4, 1.6], [0.9, 2.35], [2.6, 2.45], [3.7, 2.0], [4.3, 1.3], [5.0, 1.0], [5.45, 0.55], [5.55, -0.1], [5.3, -0.8], [4.7, -1.2], [3.4, -1.45], [1.4, -1.35], [-0.2, -1.0]]), {
      round: 0.8, tone: 1.26, hatch: 34, shadow: 0.62, spacing: 0.9, band: 0.3, edge: 0.4,
      creases: HC([
        { pts: [[5.5, -0.2], [5.0, -0.3], [4.6, -0.7], [3.9, -0.5]], w: 0.08, depth: 0.18 },
        { pts: [[5.0, -0.3], [5.08, 0.1], [5.16, 0.44]], w: 0.06, depth: 0.12 },
        { pts: [[2.1, 1.86], [3.0, 1.62], [3.8, 0.98]], w: 0.15, depth: 0.34 },
        { pts: [[3.6, 0.4], [3.9, 0.0], [4.0, -0.5]], w: 0.07, depth: 0.12 },
        { pts: [[1.2, 2.3], [1.3, 1.2], [2.0, 0.4]], w: 0.08, depth: 0.1 },
        { pts: [[2.6, 2.5], [2.6, 2.1], [2.8, 1.9]], w: 0.05, depth: 0.08 },
      ]),
      bumps: [{ at: H([4.6, -0.3]), r: [1.0, 0.9], h: 0.34 }, { at: H([1.6, -0.8]), r: [1.6, 1.2], h: 0.3 }],
    });
    fur(E, HL([[-0.8, 0.2], [0.8, 2.4], [2.4, 2.4], [2.4, 0.8], [3.2, -1.4], [1.2, -1.4], [-0.2, -1.0]]), { n: 500, angle: 240, flow: (x) => 0, len: 0.42, seed: 12, jitter: 28, v: 0.48, w: 0.022 });
    // The amber eye, the warm note: a slanted almond, a round pupil, a dark rim.
    limb(HL([[2.5, 1.26, 0.07], [3.04, 1.08, 0.24], [3.62, 0.72, 0.05]]), { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.05 });
    limb(HL([[3.0, 1.08, 0.17], [3.06, 1.06, 0.16]]), { tone: 1.5, warm: 0.8, shadow: 0, melt: 0, edge: 0 });
    limb(HL([[3.05, 1.07, 0.09], [3.06, 1.07, 0.09]]), { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    limb(HL([[3.1, 1.13, 0.04], [3.11, 1.13, 0.04]]), { tone: 1.8, shadow: 0, melt: 0, edge: 0 });
    // Dark tear line from the eye, stripes on the brow, and the ruff thrown over the jaw in points.
    line(HL([[3.56, 0.68], [3.9, 0.3], [4.0, -0.3]]), { w: 0.1, v: 0.6, dark: true });
    for (const [a, b, c, d] of [[1.6, 2.2, 2.2, 1.8], [2.2, 2.4, 2.7, 2.0], [2.9, 2.3, 3.2, 1.9]]) line(HL([[a, b], [c, d]]), { w: 0.08, v: 0.5, dark: true });
    strands(HL([[0.9, 1.4], [0.8, 0.2], [1.5, -0.8], [2.8, -1.1], [3.9, -1.1], [4.6, -1.0]]), { n: 1300, angle: 0, flow: fromEye, len: 2.4, jitter: 9, v: 0.66, spread: 0.3, seed: 15, curl: 0.4, w: 0.032 });
    strands(HL([[0.4, 0.8], [0.3, -0.4], [1.0, -1.2], [2.6, -1.5], [4.0, -1.5]]), { n: 900, angle: 0, flow: fromEye, len: 2.8, jitter: 8, v: 0.6, spread: 0.2, seed: 16, curl: 0.3, w: 0.032 });
    // Nose pad and whiskers.
    blob(HL([[4.95, 1.1], [5.46, 0.98], [5.66, 0.6], [5.36, 0.4], [5.0, 0.66]]), { round: 0.16, tone: 0.8, shadow: 0.3 });
    for (const [a, b, c, d] of [[4.5, -0.1, 7.6, 0.6], [4.4, -0.3, 7.9, -0.4], [4.3, -0.5, 7.6, -1.4], [4.2, -0.7, 6.8, -2.2]]) line(HL([[a, b], [(a + c) / 2, (b + d) / 2 + 0.1], [c, d]]), { w: 0.03, v: 0.6 });

    // Near ear, tall and pointed, with the long black tuft that names the animal.
    blob(HL([[-0.1, 1.6], [0.0, 3.4], [0.9, 5.5, 'c'], [2.0, 3.6], [2.1, 2.1], [1.0, 1.5]]), {
      round: 0.46, tone: 1.14, hatch: 66, shadow: 0.5, band: 0.2,
      creases: HC([{ pts: [[0.9, 2.2], [0.9, 3.4], [0.95, 4.8]], w: 0.16, depth: 0.28 }]),
    });
    strands(HL([[0.8, 2.3], [0.9, 3.2]]), { n: 90, angle: 104, len: 0.7, jitter: 24, v: 0.5, spread: 0.3, seed: 13, w: 0.024 });
    strands(HL([[0.82, 5.0], [0.9, 5.5]]), { n: 110, angle: 108, len: 2.6, jitter: 6, v: 0.8, spread: 0.1, seed: 14, w: 0.034 });
  },
};
