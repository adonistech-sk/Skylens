// The Bull, charging east at Orion, shown as the old star maps show him: the forequarters only,
// rising out of the sky near the Pleiades. Aldebaran is the eye, the Hyades mark the face, and
// the horns end on Elnath and on Zeta, Tianguan.
import { fur, hoof } from '../kit.mjs';

export default {
  pixels: 1500,
  anchors: [['Aldebaran', 'eye'], ['Ain', 'brow'], ['Prima Hyadum', 'muzzle'], ['Elnath', 'horn tip'], ['Tianguan', 'horn tip'], ['λ Tau', 'chest'], ['ν Tau', 'knee'], [16852, 'hoof']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const ald = s('Aldebaran'), ain = s('Ain'), elf = s('Elnath'), tia = s('Tianguan'), nu = s('ν Tau'), hoofStar = s(16852), lam = s('λ Tau');

    // Far horn, sweeping to Zeta Tauri.
    limb([[-3.4, 7.0, 0.9], [-7.0, 8.4, 0.8], [-12.6, 8.6, 0.56], [-16.8, 7.8, 0.3], [tia[0], tia[1], 0.07]], { tone: 0.92, warm: 0.3, hatch: 12, shadow: 0.4 });

    // Far foreleg.
    limb([[8.4, -2.0, 2.5], [9.8, -6.6, 1.5], [10.2, -10.0, 1.0], [hoofStar[0], hoofStar[1] + 1.6, 0.78]], { tone: 0.8, hatch: 90, shadow: 0.5 });
    hoof(E, [hoofStar[0], hoofStar[1] + 1.2], 1.34, -98, { tone: 0.92 });

    // Body, huge through the shoulder, dissolving east of the Pleiades into the sky.
    blob([[-0.4, 8.4], [3.6, 11.4], [9.0, 12.6], [15.0, 12.0], [20.4, 10.4], [23.6, 8.6], [24.2, 5.0], [23.8, 1.4], [22.6, -0.8], [20.4, -1.8], [16.8, -2.0], [12.4, -3.6], [8.6, -5.4], [4.2, -5.8], [0.8, -4.4], [-1.0, -0.6], [-2.0, 4.0]], {
      round: 7.0, tone: 1.04, hatch: 18, shadow: 0.66,
      creases: [{ pts: [[9.0, 11.8], [6.8, 5.0], [8.2, -3.8]], w: 0.42, depth: 0.5 }, { pts: [[3.4, 10.4], [1.8, 5.0], [3.6, -3.8]], w: 0.34, depth: 0.42 }, { pts: [[15.0, 11.4], [14.4, 5.4], [15.4, -1.4]], w: 0.3, depth: 0.24 }],
      bumps: [{ at: [11.0, 7.0], r: [5.6, 5.0], h: 1.0 }, { at: [3.4, 4.4], r: [3.0, 5.0], h: 0.7 }],
    });
    // The rear edge falls away in strokes, not a hard cut.
    strands([[20.4, 10.8], [23.6, 8.0], [23.0, 4.0], [23.4, 0.0], [20.8, -1.8]], { n: 900, angle: 8, len: 2.1, jitter: 20, v: 0.42, spread: 0.6, seed: 31 });
    strands([[6.0, 11.8], [12.0, 12.8], [18.0, 11.2]], { n: 420, angle: 208, len: 1.2, jitter: 22, v: 0.3, spread: 0.6, seed: 33 });
    // Dewlap folds under the throat.
    blob([[-1.2, -0.6], [0.8, 0.8], [3.4, -0.2], [4.8, -3.4], [4.2, -7.2], [2.6, -8.4], [0.2, -5.8], [-0.8, -3.2]], { round: 1.6, tone: 0.96, hatch: 84, shadow: 0.5, creases: [{ pts: [[0.4, -0.8], [1.8, -3.6], [2.6, -7.4]], w: 0.2, depth: 0.28 }, { pts: [[2.6, -0.6], [3.2, -3.4], [3.0, -6.0]], w: 0.18, depth: 0.2 }], bumps: [{ at: [lam[0] - 1.0, lam[1] - 1.0], r: [1.6, 2.0], h: 0.3 }] });

    // Near foreleg, bent at the knee on nu Tauri, driving forward.
    limb([[3.8, -2.0, 3.0], [nu[0] + 0.5, -5.4, 2.0], [nu[0], nu[1], 1.42], [1.6, -10.8, 1.06], [-0.6, -12.6, 0.82]], {
      tone: 1.08, hatch: 100, shadow: 0.62, creases: [{ pts: [[6.0, -3.6], [5.2, -7.0], [4.4, -8.6]], w: 0.2, depth: 0.3 }],
      bumps: [{ at: [nu[0], nu[1]], r: [1.1, 1.1], h: 0.32 }],
    });
    hoof(E, [-1.0, -12.9], 1.46, -128);

    // Neck.
    limb([[3.0, 6.0, 5.6], [0.0, 5.2, 4.6]], { tone: 1.02, hatch: 34, shadow: 0.55 });

    // Head lowered for the charge, in profile, Aldebaran the glaring eye.
    blob([[0.8, 8.2], [-2.6, 7.2], [-5.2, 4.4], [-7.0, 1.6], [-8.8, -1.0], [-9.2, -2.4], [-8.2, -3.4], [-6.2, -3.6], [-3.4, -2.6], [-0.8, -0.2], [1.6, 3.4]], {
      round: 2.1, tone: 1.2, hatch: 48, shadow: 0.66, spacing: 0.9, band: 0.7,
      creases: [
        { pts: [[ald[0] - 1.4, ald[1] + 1.5], [ald[0] + 0.2, ald[1] + 1.0], [ald[0] + 1.5, ald[1] + 1.6]], w: 0.2, depth: 0.5 },
        { pts: [[ald[0] - 0.9, ald[1] - 0.5], [ald[0] + 0.3, ald[1] - 0.7], [ald[0] + 1.1, ald[1] - 0.1]], w: 0.09, depth: 0.14 },
        { pts: [[-9.0, -2.2], [-7.0, -1.9], [-4.8, -1.8]], w: 0.09, depth: 0.2 }, { pts: [[-8.2, -0.8], [-7.8, -1.1], [-7.4, -0.9]], w: 0.16, depth: 0.34 }, { pts: [[-6.4, 2.4], [-3.8, -0.4], [-1.6, -0.6]], w: 0.14, depth: 0.16 },
      ],
      bumps: [{ at: [ald[0], ald[1]], r: [0.9, 0.8], h: 0.3 }, { at: [-7.6, -1.6], r: [1.6, 1.3], h: 0.32 }, { at: [-2.0, 2.8], r: [2.6, 2.6], h: 0.4 }],
    });
    // Coat on the neck and shoulder, curling toward the head.
    fur(E, [[-0.4, 8.4], [3.6, 11.4], [9, 12.6], [15, 12], [20, 10.4], [20, -1.6], [12.4, -3.6], [8.6, -5.4], [4.2, -5.8], [0.8, -4.4], [1.4, 3]], { n: 4200, angle: 190, len: 0.76, seed: 34, jitter: 14, v: 0.5, flow: (x, y) => (y - 4) * 1.4 });
    fur(E, [[1.6, 6.6], [4.6, 9.4], [8, 9.4], [8, 0], [4.6, -3.4], [2, -1]], { n: 1200, angle: 200, len: 0.9, seed: 35, jitter: 40, v: 0.5, curl: 6 });
    // Curls on the brow.
    for (const [x, y, r] of [[-3.0, 6.0, 0.6], [-1.6, 6.6, 0.66], [-0.2, 6.8, 0.6], [-2.2, 5.0, 0.56], [-0.8, 5.4, 0.56]]) {
      line([[x - r, y], [x, y + r * 0.9], [x + r, y], [x + r * 0.2, y - r * 0.8], [x - r * 0.3, y - r * 0.1]], { w: 0.1, v: 0.5 });
    }
    // Ear.
    blob([[0.8, 7.2], [2.4, 8.2], [4.6, 8.6], [5.4, 7.6], [3.8, 6.4], [1.6, 5.8]], { round: 0.7, tone: 1, shadow: 0.42, creases: [{ pts: [[1.6, 6.8], [3.0, 7.4], [4.6, 7.8]], w: 0.2, depth: 0.25 }] });

    // Near horn, the great sweep to Elnath.
    limb([[-3.4, 7.4, 1.0], [-5.0, 9.2, 0.98], [-9.4, 10.0, 0.84], [-13.0, 11.2, 0.6], [-14.8, 13.2, 0.32], [elf[0], elf[1], 0.08]], { tone: 1.1, warm: 0.42, hatch: 18, shadow: 0.5 });
  },
};
