// The Eagle, Zeus's bird, climbing north-east up the Milky Way with his broad wings open. Altair
// sits on the neck, Tarazed and Alshain on the two shoulders, Okab at the wrist of the north wing,
// Theta at the wrist of the south wing, Delta on the breast, and Lambda in the spread tail.
import { coverts, wing } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Eagle',
  pixels: 1100,
  anchors: [['Altair', 'neck'], ['Tarazed', 'shoulder'], ['Alshain', 'shoulder'], ['Okab', 'wrist'], ['θ Aql', 'wrist'], ['η Aql', 'wing'], ['δ Aql', 'breast'], ['λ Aql', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const tar = s('Tarazed'), alt = s('Altair'), oka = s('Okab');

    // The tail, a broad fan through Lambda.
    wing(E, [[4.6, -5.0], [6.0, -5.4]], [[12.4, -8.6, 1.02], [7.0, -13.2, 1.02], [11.5, -10.2, 1.06], [8.7, -12.6, 1.06], [10.2, -11.6, 1.1]], { tone: 1, from: 1, to: 0, bend: 0.04 });

    // North wing: long fingered primaries from the wrist by Okab, secondaries back to the body.
    wing(E, [[-1.0, 4.4], [2.6, 8.0], [5.6, 9.8], [oka[0] + 0.6, oka[1] + 0.6]], [
      [14.4, 14.0, 0.92], [16.2, 11.8, 0.98], [17.0, 9.0, 1.02], [16.6, 6.2, 1.04], [15.4, 3.6, 1.06], [13.6, 1.4, 1.06], [11.8, -0.4, 1.04], [10.0, -1.8, 1.0], [8.2, -3.0, 0.98], [6.4, -3.8, 0.92],
    ], { tone: 1, from: 1, to: 0.06, bend: 0.08 });
    coverts(E, [[0.6, 4.2], [3.2, 6.2], [6.0, 7.4], [9.6, 8.2]], -46, 5.0, 0.62, { n: 13, turn: 46, tone: 0.98 });
    coverts(E, [[-0.4, 4.8], [2.6, 7.4], [5.6, 9.0], [9.0, 9.4]], -56, 3.4, 0.5, { n: 14, turn: 62, tone: 1.08 });
    limb([[-1.2, 4.6, 1.0], [2.4, 7.9, 0.84], [5.4, 9.7, 0.7], [oka[0] + 0.3, oka[1] + 0.4, 0.5], [10.2, 9.8, 0.2]], { tone: 1.16, hatch: 40, shadow: 0.44 });

    // South wing, the near one, through Alshain and over Eta to its wrist past Theta.
    wing(E, [[-2.6, 1.8], [-5.8, 0.0], [-8.8, -2.0], [-11.0, -3.8]], [
      [-16.4, -4.6, 0.92], [-17.2, -7.2, 0.98], [-17.0, -9.8, 1.02], [-16.0, -12.2, 1.04], [-14.4, -14.2, 1.06], [-12.2, -15.6, 1.06], [-9.8, -16.0, 1.06], [-7.2, -15.4, 1.04], [-4.6, -14.0, 1.0], [-2.2, -12.4, 0.98], [0.0, -10.6, 0.92],
    ], { tone: 1.04, from: 1, to: 0.04, bend: -0.08 });
    coverts(E, [[-1.8, 0.0], [-4.8, -2.0], [-8.0, -4.0], [-10.4, -5.4]], -52, 4.8, 0.62, { n: 13, turn: -60, tone: 1.02 });
    coverts(E, [[-2.6, 1.2], [-5.6, -0.6], [-8.6, -2.4], [-10.8, -4.0]], -48, 3.3, 0.5, { n: 13, turn: -68, tone: 1.12 });
    limb([[-2.4, 2.0, 1.1], [-5.8, -0.1, 0.9], [-8.8, -2.2, 0.72], [-11.0, -3.9, 0.46], [-12.4, -4.2, 0.18]], { tone: 1.2, hatch: 150, shadow: 0.44 });

    // Feathered thigh and a clenched foot, carried under the tail.
    limb([[2.6, -3.0, 1.5], [2.0, -5.4, 1.0], [1.6, -6.9, 0.52]], { tone: 0.96, hatch: 96, shadow: 0.55, creases: [{ pts: [[1.4, -4.2], [1.3, -5.2], [1.3, -6.2]], w: 0.09, depth: 0.14 }] });
    strands([[1.2, -3.6], [1.4, -5], [1.5, -6.2]], { n: 160, angle: 250, len: 0.8, jitter: 16, v: 0.5, spread: 0.7, seed: 3 });
    limb([[1.6, -6.9, 0.46], [1.5, -7.6, 0.56]], { tone: 1.14, warm: 0.5, shadow: 0.4, melt: 0.1 });
    for (const pts of [[[1.1, -7.5], [0.46, -8.0], [0.7, -8.8]], [[1.4, -7.8], [1.14, -8.5], [1.5, -9.1]], [[1.8, -7.7], [2.2, -8.4], [1.9, -9.0]], [[2.0, -7.4], [2.7, -7.8], [2.6, -8.4]]]) {
      limb([[...pts[0], 0.2], [...pts[1], 0.15], [...pts[2], 0.02]], { tone: 1.2, warm: 0.5, shadow: 0.3, melt: 0, band: 0.1 });
    }

    // The body, broad at the breast, drawing in to the tail.
    blob([[-1.5, 5.2], [2.05, 2.9], [4.3, -0.5], [5.45, -3.4], [6.2, -5.4], [4.6, -6.7], [2.8, -5.6], [0.1, -3.8], [-2.6, -0.9], [-4.1, 3.0]], {
      round: 2.2, tone: 1.1, hatch: 40, shadow: 0.66,
      bumps: [{ at: [0.6, 0.6], r: [3.0, 3.6], angle: 40, h: 0.6 }],
    });
    // The breast laid over with rows of feathers, like tiles.
    coverts(E, [[4.4, -4.6], [3.0, -3.4], [1.4, -2.2]], -54, 2.2, 0.5, { n: 6, tone: 1.02 });
    coverts(E, [[4.0, -2.4], [2.0, -1.2], [-0.4, -1.6]], -54, 2.4, 0.56, { n: 7, tone: 1.06 });
    coverts(E, [[3.0, 0.2], [0.6, 0.6], [-1.8, -0.2]], -54, 2.5, 0.6, { n: 8, tone: 1.1 });
    coverts(E, [[1.2, 2.6], [-0.8, 2.2], [-3.0, 1.8]], -54, 2.6, 0.62, { n: 8, tone: 1.14 });

    // Neck, a ruff of pointed hackles running from the head over Altair onto the shoulders.
    limb([[-1.4, 2.8, 2.6], [alt[0] + 0.2, alt[1] + 0.3, 1.86], [-3.9, 6.2, 1.6], [-4.7, 7.2, 1.5]], { tone: 1.08, hatch: 60, shadow: 0.6, melt: 1.4 });
    for (const [x, y, a, l] of [
      [-5.0, 7.0, 330, 2.2], [-3.9, 7.3, 318, 2.3], [-2.9, 6.9, 312, 2.4], [-4.9, 5.8, 322, 2.3], [-3.8, 5.8, 316, 2.5], [-2.6, 5.7, 306, 2.5], [-1.6, 5.8, 300, 2.3],
      [-4.8, 4.5, 310, 2.4], [-3.6, 4.4, 310, 2.6], [-2.4, 4.3, 305, 2.6], [-1.2, 4.3, 300, 2.5], [-4.2, 3.2, 300, 2.4], [-3.0, 2.9, 304, 2.6], [-1.6, 2.8, 300, 2.5], [-0.2, 3.0, 296, 2.4],
    ]) {
      const t = (a * Math.PI) / 180, tip = [x + Math.cos(t) * l, y + Math.sin(t) * l], mid = [x + Math.cos(t) * l * 0.5 - 0.1, y + Math.sin(t) * l * 0.5 - 0.1];
      limb([[x, y, 0.22], [mid[0], mid[1], 0.5], [tip[0], tip[1], 0.03]], { flat: 0.4, tone: 1.14, hatch: a + 70, shadow: 0.4, melt: 0.2, band: 0.16, creases: [{ pts: [[x, y], mid, tip], w: 0.05, depth: 0.06 }] });
    }

    // Lower mandible and the great hooked bill.
    blob([[-7.0, 7.1], [-8.0, 6.92], [-8.55, 6.62, 'c'], [-7.9, 6.34], [-7.0, 6.3]], { round: 0.26, tone: 0.92, warm: 0.42, hatch: 16, shadow: 0.4 });
    // Head: a flat, heavy skull, feathers tight over it.
    blob([[-2.9, 8.2], [-4.2, 9.1], [-5.7, 9.3], [-6.8, 8.95], [-7.45, 8.2], [-7.5, 7.3], [-6.9, 6.3], [-5.4, 5.7], [-3.8, 5.9], [-2.8, 7.0]], {
      round: 1.1, tone: 1.22, hatch: 24, shadow: 0.62, spacing: 0.9, band: 0.4,
      creases: [
        { pts: [[-7.3, 7.0], [-6.5, 7.0], [-5.7, 7.35]], w: 0.09, depth: 0.2 },
        { pts: [[-4.7, 8.5], [-4.6, 7.4], [-5.0, 6.4]], w: 0.09, depth: 0.12 },
      ],
      bumps: [{ at: [-5.0, 7.3], r: [1.3, 1.3], h: 0.26 }],
    });
    strands([[-3.5, 8.6], [-4.3, 7.4], [-4.6, 6.2]], { n: 260, angle: 318, flow: (x, y) => (y - 7) * 8, len: 0.8, jitter: 14, v: 0.34, spread: 1.1, seed: 8 });
    blob([[-6.85, 8.5], [-7.7, 8.42], [-8.5, 7.95], [-9.0, 7.25], [-9.08, 6.3, 'c'], [-8.55, 6.86], [-7.9, 7.1], [-7.1, 7.14], [-6.85, 7.8]], {
      round: 0.36, tone: 1.02, warm: 0.46, hatch: 30, shadow: 0.5, band: 0.2,
      creases: [{ pts: [[-7.3, 8.5], [-7.5, 7.9], [-7.3, 7.15]], w: 0.07, depth: 0.14 }, { pts: [[-7.7, 8.1], [-7.98, 8.02]], w: 0.07, depth: 0.16 }],
      bumps: [{ at: [-8.3, 7.7], r: [0.6, 0.4], angle: -40, h: 0.12 }],
    });
    // The fierce eye, under a hard brow that overhangs it.
    limb([[-5.62, 8.18, 0.09], [-6.0, 8.08, 0.27], [-6.4, 7.94, 0.07]], { tone: 0.5, shadow: 0.4, melt: 0, rim: 1, band: 0.06 });
    limb([[-6.0, 8.07, 0.16], [-6.02, 8.07, 0.15]], { tone: 1.1, warm: 0.7, shadow: 0, melt: 0, edge: 0 });
    limb([[-6.04, 8.06, 0.08], [-6.05, 8.06, 0.08]], { tone: 0.1, shadow: 0, melt: 0, edge: 0 });
    limb([[-4.9, 8.6, 0.12], [-5.8, 8.54, 0.2], [-6.6, 8.2, 0.13], [-7.0, 7.96, 0.05]], { tone: 1.3, hatch: 20, shadow: 0.6, melt: 0, band: 0.1 });
    line([[-5.7, 9.3], [-6.4, 9.1], [-6.9, 8.8]], { w: 0.03, v: 0.4 });
    if (tar[0]) return;
  },
};
