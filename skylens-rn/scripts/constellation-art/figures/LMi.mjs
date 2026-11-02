// The Lion Cub, a young lion in a springing bound above the great Lion, long-legged and big-headed,
// the mane just coming in. The west star sits on the broad muzzle, the next on the shoulder, Beta
// on the back, the fainter star on the belly, and Praecipua on the haunch.
import { fur, paw } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Lion Cub',
  pixels: 1100,
  anchors: [[46952, 'muzzle'], [49593, 'shoulder'], ['β LMi', 'back'], [51056, 'belly'], ['Praecipua', 'haunch']],
  draw({ E }) {
    const { blob, limb, line, strands } = E;

    // Far legs.
    limb([[-5.6, -0.6, 2.2], [-4.2, -3.0, 1.4], [-5.2, -5.0, 0.8], [-4.4, -6.7, 0.58], [-4.1, -7.1, 0.54]], { tone: 0.72, hatch: 60, shadow: 0.5 });
    paw(E, [-4.0, -7.2], 1.16, -56, { tone: 0.78 });
    limb([[3.4, 0.6, 1.8], [5.6, -1.0, 1.04], [8.2, -1.3, 0.62], [9.2, -1.1, 0.54]], { tone: 0.74, hatch: 150, shadow: 0.5 });
    paw(E, [9.3, -1.1], 1.16, 12, { tone: 0.8 });

    // The tail, thrown up by the leap, the dark tuft on the end.
    limb([[-8.2, 1.4, 0.56], [-10.6, 3.2, 0.38], [-12.8, 4.1, 0.31], [-14.3, 5.4, 0.27], [-14.6, 6.8, 0.24]], { tone: 1.0, hatch: 40, shadow: 0.45, melt: 0.5, band: 0.2 });
    strands([[-14.7, 6.6], [-14.5, 7.1]], { n: 260, angle: 86, len: 1.5, jitter: 22, v: 0.62, spread: 0.2, seed: 2, curl: 1, warm: 0.4, w: 0.026 });

    // Near hind leg, stretched out behind at the end of the spring.
    limb([[-7.0, 0.2, 2.7], [-6.6, -2.0, 2.0], [-8.2, -3.5, 1.04], [-9.8, -4.9, 0.64], [-10.5, -5.5, 0.56]], {
      tone: 1.04, hatch: 44, shadow: 0.6, melt: 1,
      creases: [{ pts: [[-4.6, -1.6], [-5.6, -3.4], [-7.6, -4.6]], w: 0.15, depth: 0.22 }, { pts: [[-9.4, -1.6], [-9.0, -2.6], [-9.2, -3.6]], w: 0.13, depth: 0.18 }],
      bumps: [{ at: [-6.8, -0.8], r: [2.2, 2.2], h: 0.6 }],
    });
    paw(E, [-10.6, -5.6], 1.26, -138);

    // Lean long-barrelled young body.
    const body = [[3.2, 2.7], [0.6, 2.8], [-2.0, 2.4], [-5.0, 2.6], [-7.6, 2.5], [-8.9, 0.6], [-8.2, -1.6], [-6.0, -2.4], [-3.4, -2.2], [-0.6, -2.5], [2.0, -2.7], [4.0, -1.4], [4.6, 0.8]];
    blob(body, {
      round: 2.3, tone: 1.08, hatch: 12, shadow: 0.68, band: 0.46,
      creases: [{ pts: [[-5.0, 2.4], [-5.4, 0.2], [-4.6, -2.2]], w: 0.17, depth: 0.22 }, { pts: [[0.8, 2.6], [0.4, 0.2], [0.8, -2.4]], w: 0.15, depth: 0.2 }],
      bumps: [{ at: [2.4, 0.0], r: [2.2, 2.4], h: 0.6 }, { at: [-6.6, 0.4], r: [2.0, 2.2], h: 0.5 }],
    });

    // Near foreleg, reaching, a big soft young paw.
    limb([[2.4, -0.4, 2.3], [4.0, -2.6, 1.34], [6.4, -3.4, 0.76], [7.7, -3.4, 0.62]], {
      tone: 1.08, hatch: 126, shadow: 0.62, melt: 1,
      creases: [{ pts: [[1.6, -2.6], [3.4, -3.8], [5.6, -4.2]], w: 0.13, depth: 0.18 }, { pts: [[4.4, -1.0], [5.2, -2.0], [6.2, -2.6]], w: 0.1, depth: 0.14 }],
    });
    paw(E, [7.8, -3.4], 1.4, 2);

    // Sleek coat.
    fur(E, body, { n: 3400, angle: 186, len: 0.62, seed: 3, jitter: 13, v: 0.48, w: 0.02 });
    strands([[-8.0, 2.6], [-5, 2.7], [-2, 2.5], [0.6, 2.9]], { n: 460, angle: 172, len: 0.7, jitter: 18, v: 0.4, spread: 0.2, seed: 11, w: 0.02 });
    strands([[-6, -2.4], [-3.4, -2.2], [-0.6, -2.5], [2, -2.7]], { n: 420, angle: 228, len: 0.7, jitter: 18, v: 0.38, spread: 0.2, seed: 12, w: 0.02 });
    fur(E, [[-8.8, 0.6], [-7, 2.0], [-5, 0.4], [-5.4, -2.4], [-7.6, -4.2], [-8.4, -2]], { n: 500, angle: 240, len: 0.46, seed: 4, jitter: 14, v: 0.42, w: 0.02 });

    // The new mane, a short warm scruff round the neck and down the chest, not yet a lion's.
    const mane = [[1.0, 3.2], [2.2, 5.0], [4.0, 5.8], [5.2, 4.8], [5.8, 1.6], [5.0, -0.6], [3.4, -1.6], [1.6, -0.6], [0.8, 1.2]];
    blob(mane, { round: 1.2, tone: 0.66, warm: 0.3, hatch: 44, shadow: 0.6, relief: 0.26, edge: 0 });
    const fromFace = (x, y) => (Math.atan2(y - 2.0, x - 7.2) * 180) / Math.PI;
    fur(E, mane, { n: 2400, angle: 0, flow: fromFace, len: 1.5, jitter: 18, curl: 0.8, seed: 5, v: 0.44, lit: 0.12, warm: 0.5, w: 0.024 });
    strands([[1.0, 3.0], [2.2, 5.0], [4.0, 5.8]], { n: 620, angle: 0, flow: fromFace, len: 1.5, jitter: 22, v: 0.46, spread: 0.4, seed: 6, curl: 1, warm: 0.5, w: 0.024 });
    strands([[1.0, 1.0], [1.6, -0.6], [3.4, -1.6]], { n: 620, angle: 0, flow: fromFace, len: 1.5, jitter: 22, v: 0.44, spread: 0.4, seed: 7, curl: -1, warm: 0.5, w: 0.024 });

    // Round ear behind.
    blob([[5.2, 4.3], [5.2, 5.1], [5.8, 5.5], [6.4, 5.1], [6.3, 4.3]], { round: 0.4, tone: 0.9, hatch: 60, shadow: 0.42, band: 0.12, creases: [{ pts: [[5.5, 4.5], [5.75, 4.95], [6.1, 4.7]], w: 0.08, depth: 0.12 }] });

    // Head: big for the body, a long flat brow running straight into the nose, a square muzzle.
    blob([[3.6, 2.8], [4.0, 4.0], [5.0, 4.65], [6.3, 4.5], [7.3, 3.8], [8.2, 3.15], [9.0, 2.75], [9.36, 2.15], [9.34, 1.3], [8.9, 0.55], [8.1, 0.05], [6.8, -0.15], [5.4, 0.2], [4.1, 1.1]], {
      round: 0.9, tone: 1.26, hatch: 26, shadow: 0.66, spacing: 0.88, band: 0.24, edge: 0.5,
      creases: [
        // Mouth, cut straight then dropping at the corner, no smile in it.
        { pts: [[9.3, 1.3], [8.6, 1.16], [8.0, 1.2], [7.5, 0.9]], w: 0.08, depth: 0.2 },
        { pts: [[8.72, 2.06], [8.66, 1.6], [8.62, 1.16]], w: 0.06, depth: 0.12 },
        // Hard brow, then the fold from the inner eye down beside the nose.
        { pts: [[5.4, 3.6], [6.2, 3.56], [7.0, 2.96]], w: 0.14, depth: 0.32 },
        { pts: [[7.1, 2.8], [7.5, 2.3], [7.6, 1.7]], w: 0.08, depth: 0.14 },
        { pts: [[6.0, 4.3], [6.1, 4.0], [6.3, 3.8]], w: 0.05, depth: 0.08 }, { pts: [[6.5, 4.1], [6.6, 3.8], [6.7, 3.6]], w: 0.05, depth: 0.08 },
      ],
      bumps: [{ at: [8.4, 1.8], r: [1.0, 0.9], h: 0.3 }, { at: [5.6, 1.4], r: [1.3, 1.2], h: 0.26 }],
    });
    fur(E, [[3.7, 2.8], [4.1, 3.9], [5.1, 4.5], [6.2, 4.3], [6.6, 2.4], [7.2, 0.3], [5.4, 0.3], [4.2, 1.1]], { n: 900, angle: 194, flow: (x, y) => (y - 2) * 8, len: 0.42, seed: 8, jitter: 18, v: 0.46, lit: 0.14, w: 0.016 });
    fur(E, [[7.2, 3.6], [8.8, 2.7], [9.2, 2.0], [9.1, 1.3], [8.8, 0.6], [7.8, 0.2], [7.0, 1.6]], { n: 420, angle: 214, len: 0.26, seed: 9, jitter: 22, v: 0.42, lit: 0.14, w: 0.014 });
    // The ruff grows over the back of the jaw in short points, so the head sits in it.
    strands([[4.1, 3.2], [4.4, 1.8], [5.4, 0.7], [6.6, 0.1], [7.5, 0.0]], { n: 760, angle: 0, flow: (x, y) => (Math.atan2(y - 2.6, x - 7.4) * 180) / Math.PI, len: 1.1, jitter: 12, v: 0.54, spread: 0.2, seed: 10, curl: 0.5, warm: 0.5, w: 0.022 });
    // The eye, narrow and level.
    limb([[5.76, 3.12, 0.05], [6.24, 3.04, 0.17], [6.74, 2.76, 0.04]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.04 });
    limb([[6.22, 3.04, 0.12], [6.26, 3.04, 0.11]], { tone: 1.5, warm: 0.8, shadow: 0, melt: 0, edge: 0 });
    limb([[6.25, 3.04, 0.06], [6.26, 3.04, 0.06]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    // Nose, whisker spots, whiskers.
    blob([[8.5, 2.86], [9.0, 2.74], [9.4, 2.3], [9.2, 2.0], [8.76, 2.14]], { round: 0.12, tone: 0.8, shadow: 0.3 });
    for (const [x, y] of [[7.9, 1.8], [8.2, 1.56], [8.1, 2.06], [8.4, 1.84]]) limb([[x, y, 0.045], [x + 0.02, y, 0.045]], { tone: 0.2, shadow: 0, melt: 0, edge: 0 });
    for (const [x, y, a2, b2] of [[7.9, 1.7, 10.6, 1.8], [7.8, 1.5, 10.4, 0.7], [7.8, 1.9, 10.5, 2.7]]) line([[x, y], [(x + a2) / 2, (y + b2) / 2 + 0.08], [a2, b2]], { w: 0.02, v: 0.6 });

    // Near ear, round, set wide and half lost in the scruff.
    blob([[3.8, 3.7], [3.6, 4.6], [4.2, 5.2], [5.0, 4.9], [5.1, 4.2], [4.6, 3.7]], { round: 0.42, tone: 1.1, hatch: 56, shadow: 0.5, band: 0.14, creases: [{ pts: [[4.0, 4.1], [4.2, 4.6], [4.7, 4.5]], w: 0.11, depth: 0.2 }] });
  },
};
