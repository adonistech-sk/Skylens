// The Raven, Apollo's bird, perched on the coils of the Water Snake with his head dropped to peck.
// Gienah sits on the shoulder of the folded wing, Algorab on the hunched back, Epsilon by the eye,
// Alchiba in the heavy bill, and Kraz on the gripping foot.
import { coverts, feather, fur, wing } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Raven',
  pixels: 1100,
  anchors: [['Gienah', 'shoulder'], ['Algorab', 'back'], ['ε Crv', 'head'], ['Alchiba', 'bill'], ['Kraz', 'foot']],
  draw({ s, E }) {
    const { blob, limb, strands } = E;
    const kra = s('Kraz');

    // A foot: three toes forward, one back, each hooked over and ending in a claw.
    const foot = (x, y, tone) => {
      for (const pts of [[[x, y], [x + 0.56, y - 0.26], [x + 0.98, y - 0.72]], [[x, y], [x + 0.16, y - 0.46], [x + 0.28, y - 1.0]], [[x, y], [x - 0.3, y - 0.42], [x - 0.42, y - 0.96]], [[x, y], [x - 0.6, y + 0.02], [x - 1.0, y - 0.3]]]) {
        const d = [pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]];
        limb([[...pts[0], 0.2], [...pts[1], 0.15], [...pts[2], 0.12]], { tone, hatch: 60, shadow: 0.35, melt: 0, band: 0.08, creases: [{ pts: [pts[1], pts[2]], w: 0.03, depth: 0.04 }] });
        limb([[...pts[2], 0.1], [pts[2][0] + d[0] * 0.5, pts[2][1] + d[1] * 0.7, 0.07], [pts[2][0] + d[0] * 0.7 - 0.06, pts[2][1] + d[1] * 1.2, 0.01]], { tone: 1.34, shadow: 0.2, melt: 0, band: 0.05 });
      }
    };

    // Far leg and foot.
    limb([[-0.7, -1.0, 0.56], [-0.8, -1.9, 0.26], [-0.7, -2.8, 0.2]], { tone: 0.76, hatch: 84, shadow: 0.5, melt: 0.3 });
    foot(-0.7, -2.9, 0.8);

    // The tail, a long graduated wedge, the mark of a raven.
    wing(E, [[-5.4, 1.2], [-6.2, 0.2]], [[-11.2, 0.2, 0.68], [-12.4, -2.5, 0.68], [-11.9, -0.5, 0.72], [-12.5, -1.8, 0.72], [-12.4, -1.1, 0.74]], { tone: 1.02, from: 1, to: 0, bend: 0.03 });

    // Far wing, a sliver showing past the back.
    feather(E, [-1.6, 4.6], [-9.2, 3.2], 0.74, { bend: -0.04, tone: 0.8 });
    feather(E, [-1.4, 4.2], [-9.8, 2.2], 0.74, { bend: -0.04, tone: 0.78 });

    // Body, a heavy hunched barrel.
    const body = [[1.9, 3.4], [-0.4, 4.7], [-3.0, 5.1], [-5.6, 3.7], [-7.4, 1.0], [-6.4, -0.6], [-3.6, -1.9], [-0.8, -1.7], [1.5, -0.8], [3.1, 0.8], [3.2, 2.4]];
    blob(body, { round: 2.4, tone: 1.06, hatch: 40, shadow: 0.66, band: 0.3, bumps: [{ at: [1.2, 0.8], r: [2.0, 2.4], h: 0.5 }] });
    // Breast feathers, loose and scaled.
    coverts(E, [[2.8, 1.6], [2.0, 0.0], [0.6, -0.8]], 232, 1.6, 0.42, { n: 6, tone: 1.08 });
    coverts(E, [[1.6, 2.2], [0.6, 0.6], [-0.8, -0.2]], 226, 1.7, 0.44, { n: 6, tone: 1.04 });
    coverts(E, [[-0.8, -0.4], [-2.6, -1.0], [-4.6, -0.8]], 216, 1.5, 0.42, { n: 7, tone: 0.96 });

    // Near leg with its shaggy thigh, the foot on Kraz.
    strands([[-3.6, -1.2], [-2.8, -1.4], [-2.2, -1.2]], { n: 150, angle: 254, len: 0.7, jitter: 16, v: 0.5, spread: 0.3, seed: 2, w: 0.016 });
    limb([[-3.0, -1.2, 0.74], [-3.1, -2.0, 0.3], [kra[0] + 0.1, kra[1] + 0.2, 0.24]], { tone: 1.0, hatch: 84, shadow: 0.55, melt: 0.3, creases: [{ pts: [[-3.26, -2.0], [-3.1, -2.05], [-2.9, -2.0]], w: 0.03, depth: 0.05 }, { pts: [[-3.28, -2.2], [-3.1, -2.25], [-2.92, -2.2]], w: 0.03, depth: 0.05 }] });
    foot(kra[0] + 0.1, kra[1] + 0.05, 1.04);

    // The folded wing: primaries low, secondaries over them, tertials on top, then the coverts.
    const flights = [[[-1.2, 0.3], [-10.6, -1.3], 0.62], [[-0.9, 0.7], [-10.5, -0.6], 0.62], [[-0.6, 1.1], [-10.1, 0.1], 0.64], [[-0.2, 1.5], [-9.5, 0.7], 0.66], [[0.1, 1.9], [-8.7, 1.2], 0.68], [[0.2, 2.3], [-7.9, 1.8], 0.7], [[0.3, 2.7], [-7.1, 2.3], 0.72], [[0.3, 3.1], [-6.1, 2.8], 0.76], [[0.2, 3.5], [-5.0, 3.3], 0.8]];
    flights.forEach(([a, b, w], i) => feather(E, a, b, w, { bend: -0.035, tone: 0.98 + i * 0.022 }));
    coverts(E, [[-0.4, 4.2], [-1.2, 2.6], [-2.2, 0.8], [-3.0, -0.2]], 188, 3.0, 0.56, { n: 8, turn: 10, tone: 1.08 });
    coverts(E, [[1.0, 4.0], [0.4, 2.6], [-0.2, 1.2], [-1.0, 0.0]], 192, 2.7, 0.52, { n: 7, turn: 14, tone: 1.14 });
    coverts(E, [[2.0, 3.2], [1.5, 2.2], [0.9, 1.0], [0.2, 0.2]], 200, 1.9, 0.44, { n: 6, turn: 16, tone: 1.2 });

    // Neck, drawn down in a curve to the lowered head.
    limb([[1.7, 2.2, 2.1], [2.4, 0.6, 1.8], [2.6, -0.8, 1.42]], { tone: 1.1, hatch: 70, shadow: 0.6, melt: 1.4, band: 0.3, creases: [{ pts: [[3.3, 1.8], [3.8, 0.4], [3.8, -0.6]], w: 0.07, depth: 0.1 }] });
    strands([[3.4, 2.2], [3.9, 0.6], [3.6, -0.8]], { n: 220, angle: 92, flow: (x, y) => (x - 3.6) * 10, len: 0.56, jitter: 14, v: 0.5, spread: 0.5, seed: 3, w: 0.016 });

    // The shaggy throat hackles, a raven's own beard, hanging under the bill.
    for (const [x, y, a, l] of [[0.9, 1.2, 248, 2.2], [0.7, 0.3, 256, 2.3], [1.0, -0.5, 262, 2.4], [1.5, 0.6, 262, 2.3], [1.4, -1.0, 268, 2.2], [1.9, -0.4, 270, 2.2], [1.7, -1.8, 272, 1.7], [2.2, -1.5, 276, 1.4]]) {
      const t = (a * Math.PI) / 180, tip = [x + Math.cos(t) * l, y + Math.sin(t) * l], mid = [x + Math.cos(t) * l * 0.55 + 0.05, y + Math.sin(t) * l * 0.55];
      limb([[x, y, 0.14], [mid[0], mid[1], 0.27], [tip[0], tip[1], 0.015]], { flat: 0.4, tone: 1.12, hatch: a + 80, shadow: 0.36, melt: 0.1, band: 0.08, creases: [{ pts: [[x, y], mid, tip], w: 0.03, depth: 0.04 }] });
    }

    // Lower mandible, then the head, then the great arched bill on top.
    blob([[1.75, -2.6], [2.4, -2.9], [2.48, -3.5], [2.52, -4.2, 'c'], [2.0, -3.8], [1.6, -3.1]], { round: 0.22, tone: 0.84, warm: 0.34, hatch: 70, shadow: 0.4, band: 0.1 });
    blob([[1.7, -0.3], [2.9, 0.1], [3.75, -0.6], [3.95, -1.7], [3.55, -2.6], [2.85, -2.85], [2.0, -2.7], [1.5, -1.6]], {
      round: 0.7, tone: 1.2, hatch: 66, shadow: 0.5, spacing: 0.88, band: 0.2, edge: 0.45,
      creases: [
        { pts: [[3.5, -1.1], [3.25, -1.5], [3.1, -2.2]], w: 0.07, depth: 0.14 },
        { pts: [[2.44, -2.2], [2.6, -1.1], [2.4, -0.4]], w: 0.06, depth: 0.08 },
      ],
      bumps: [{ at: [3.4, -0.9], r: [0.9, 0.9], h: 0.24 }],
    });
    blob([[2.05, -2.56], [2.7, -2.66], [3.34, -2.42], [3.46, -3.2], [3.26, -4.0], [2.82, -4.8, 'c'], [2.5, -4.0], [2.36, -3.4], [2.14, -2.96]], {
      round: 0.26, tone: 0.98, warm: 0.42, hatch: 76, shadow: 0.5, band: 0.12,
      creases: [{ pts: [[3.0, -2.8], [3.0, -3.6], [2.86, -4.4]], w: 0.05, depth: 0.08 }, { pts: [[2.5, -2.84], [2.54, -3.04], [2.64, -3.2]], w: 0.05, depth: 0.1 }],
      bumps: [{ at: [3.2, -3.4], r: [0.4, 0.8], h: 0.12 }],
    });
    fur(E, [[1.8, -0.4], [2.9, 0.0], [3.7, -0.6], [3.85, -1.7], [3.5, -2.4], [2.1, -2.5], [1.6, -1.6]], { n: 420, angle: 96, flow: (x) => (x - 2.7) * 14, len: 0.34, seed: 6, jitter: 12, v: 0.46, lit: 0.1, w: 0.012 });
    // Bristles over the base of the bill.
    strands([[2.1, -2.5], [2.8, -2.6], [3.4, -2.4]], { n: 90, angle: 270, flow: (x) => (x - 3) * -8, len: 0.56, jitter: 10, v: 0.56, spread: 0.1, seed: 4, w: 0.014 });
    // The eye, bright and knowing.
    limb([[2.86, -1.26, 0.07], [2.84, -1.66, 0.3], [2.82, -2.06, 0.07]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.05 });
    limb([[2.84, -1.66, 0.2], [2.85, -1.67, 0.19]], { tone: 1.6, shadow: 0, melt: 0, edge: 0 });
    limb([[2.84, -1.66, 0.13], [2.85, -1.67, 0.12]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    limb([[2.9, -1.58, 0.05], [2.91, -1.58, 0.05]], { tone: 1.8, shadow: 0, melt: 0, edge: 0 });
    strands([[1.7, -0.4], [2.6, -0.1], [3.6, -0.5]], { n: 150, angle: 90, flow: (x) => (x - 2.6) * 12, len: 0.5, jitter: 12, v: 0.44, spread: 0.4, seed: 5, w: 0.014 });
  },
};
