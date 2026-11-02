// The Great Dog, a lean prick-eared hound of the Nile rearing west after the Hare. Sirius sits on
// the long muzzle, Theta is the tip of the tall ear, Mirzam the reaching forepaw, Wezen the loin,
// Adhara the stifle, Furud the far-reaching hind paw, and the whip tail runs out through Aludra.
import { fur, paw } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Great Dog',
  pixels: 1100,
  anchors: [['Sirius', 'muzzle'], [33160, 'ear tip'], ['Muliphein', 'nape'], [33347, 'jaw'], ['Mirzam', 'forepaw'], [33977, 'ribs'], ['Wezen', 'loin'], ['Nganurganity', 'thigh'], ['Adhara', 'stifle'], ['Aludra', 'tail'], ['Furud', 'hind paw']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const fur1 = s('Furud'), mir = s('Mirzam'), alu = s('Aludra'), adh = s('Adhara'), the = s(33160);

    // Far ear, behind the skull.
    blob([[0.7, 8.0], [1.05, 9.2], [1.75, 10.5, 'c'], [2.1, 9.1], [1.9, 7.8]], { round: 0.5, tone: 0.84, hatch: 80, shadow: 0, creases: [{ pts: [[1.3, 8.2], [1.55, 9.0], [1.7, 9.9]], w: 0.09, depth: 0.14 }] });

    // Far foreleg, reaching lower than the near one.
    limb([[0.8, 0.8, 2.0], [3.0, -0.6, 1.08], [5.0, 0.0, 0.62], [6.4, 0.7, 0.46], [7.2, 1.1, 0.42]], { tone: 0.74, hatch: 120, shadow: 0.5, bumps: [{ at: [5.0, 0.0], r: [0.5, 0.5], h: 0.14 }] });
    paw(E, [7.1, 1.05], 1.14, 24, { tone: 0.8 });

    // Far hind leg, trailing down from the hip.
    limb([[-3.4, -5.8, 2.2], [-2.6, -8.2, 1.3], [-3.7, -10.5, 0.62], [-2.5, -12.2, 0.44], [-1.5, -12.9, 0.4]], { tone: 0.72, hatch: 70, shadow: 0.5, creases: [{ pts: [[-1.5, -7.6], [-2.2, -9.2], [-3.2, -10.4]], w: 0.12, depth: 0.16 }] });
    paw(E, [-1.6, -12.85], 1.1, -32, { tone: 0.78 });

    // Whip tail, in line with the spine, through Aludra, with a lift at the tip.
    limb([[-5.6, -4.8, 0.82], [-6.1, -6.1, 0.56], [alu[0], alu[1], 0.46], [-7.5, -8.9, 0.34], [-9.2, -10.2, 0.24], [-11.0, -10.1, 0.14], [-12.4, -9.1, 0.06]], { tone: 0.98, hatch: 60, shadow: 0.45, melt: 0.5 });

    // Near hind leg: a heavy thigh, the stifle on Adhara, a long shank, a sprung hock, the paw on Furud.
    limb([[-3.6, -4.8, 2.1], [-2.4, -5.9, 2.2], [adh[0] + 0.2, adh[1] - 0.5, 1.56], [1.0, -8.4, 0.92], [2.7, -9.7, 0.56], [4.6, -9.2, 0.44], [6.7, -8.3, 0.42]], {
      tone: 1.02, hatch: 52, shadow: 0.6,
      creases: [{ pts: [[-4.4, -7.2], [-1.8, -8.4], [0.8, -9.0]], w: 0.15, depth: 0.22 }, { pts: [[-2.4, -3.8], [-0.4, -5.2], [0.8, -6.6]], w: 0.13, depth: 0.18 }, { pts: [[-3.2, -5.2], [-1.8, -6.2], [-0.6, -7.8]], w: 0.13, depth: 0.2 }, { pts: [[2.0, -9.0], [2.6, -9.3], [3.1, -9.2]], w: 0.07, depth: 0.1 }],
      bumps: [{ at: [-2.8, -5.6], r: [2.2, 1.8], angle: -30, h: 0.5 }, { at: [2.7, -9.7], r: [0.5, 0.5], h: 0.16 }],
    });
    paw(E, [fur1[0] - 0.1, fur1[1] - 0.04], 1.26, 16);

    // Body: deep brisket, then the lean tuck up to the loin that a hound must have.
    const body = [[-3.7, 3.9], [-4.3, 1.0], [-5.2, -2.2], [-6.0, -4.6], [-5.4, -6.2], [-3.4, -6.2], [-2.0, -4.6], [-1.0, -3.8], [0.2, -3.0], [1.6, -1.4], [2.5, 0.8], [2.3, 3.0], [0.8, 4.4], [-1.6, 4.8]];
    blob(body, {
      round: 2.1, tone: 1.1, hatch: 62, shadow: 0.66, band: 0.8,
      creases: [
        { pts: [[-3.4, 2.8], [-1.7, 1.2], [-0.2, -1.8]], w: 0.13, depth: 0.2 }, { pts: [[-4.2, 0.0], [-2.3, -1.0], [-0.8, -2.8]], w: 0.13, depth: 0.2 },
        { pts: [[-4.8, -1.8], [-3.4, -2.6], [-1.8, -3.8]], w: 0.13, depth: 0.2 }, { pts: [[-5.4, -3.6], [-4.4, -4.0], [-3.4, -4.4]], w: 0.1, depth: 0.14 },
        { pts: [[-3.2, 3.4], [-0.6, 3.0], [1.2, 0.6]], w: 0.18, depth: 0.3 },
      ],
      bumps: [{ at: [-1.0, 2.0], r: [2.0, 2.4], angle: 20, h: 0.5 }, { at: [0.6, 0.2], r: [1.6, 2.0], h: 0.4 }, { at: [-2.4, -1.8], r: [2.0, 2.0], h: 0.25 }],
    });

    // Near foreleg, the shoulder through a sharp elbow to the paw on Mirzam.
    limb([[-0.2, 2.8, 2.2], [1.9, 1.3, 1.5], [3.8, 2.2, 0.9], [5.4, 3.3, 0.56], [6.9, 4.05, 0.46]], {
      tone: 1.06, hatch: 118, shadow: 0.6,
      creases: [{ pts: [[0.6, 0.2], [2.4, 0.6], [3.8, 1.6]], w: 0.13, depth: 0.18 }, { pts: [[1.4, 2.8], [2.6, 3.0], [3.6, 3.0]], w: 0.1, depth: 0.14 }],
      bumps: [{ at: [1.7, 1.1], r: [0.9, 0.9], h: 0.24 }, { at: [5.5, 3.4], r: [0.5, 0.5], h: 0.14 }],
    });
    paw(E, [mir[0] - 0.1, mir[1] - 0.04], 1.26, 22);

    // Long arched neck, Muliphein on the nape.
    limb([[-1.2, 2.4, 3.0], [-1.3, 4.3, 2.0], [-0.9, 5.9, 1.62], [-0.4, 6.9, 1.5]], {
      tone: 1.12, hatch: 72, shadow: 0.62, melt: 1.4,
      creases: [{ pts: [[-2.4, 6.6], [-1.6, 5.0], [-1.9, 3.2]], w: 0.13, depth: 0.16 }, { pts: [[0.4, 5.6], [0.1, 4.2], [0.6, 3.0]], w: 0.12, depth: 0.16 }],
    });

    // Fine short coat, lying back along the body.
    fur(E, body, { n: 1900, angle: 244, len: 0.46, seed: 3, jitter: 13, v: 0.42 });
    fur(E, [[-5.2, -3.4], [-2.2, -3.8], [0.6, -7.2], [-1.2, -8.2], [-4.4, -6.8]], { n: 520, angle: 224, len: 0.4, seed: 4, jitter: 12, v: 0.4 });
    strands([[-5.8, -3.6], [-4.4, 0.6], [-3.8, 3.8], [-2.6, 6.2]], { n: 240, angle: 236, len: 0.5, jitter: 20, v: 0.36, spread: 0.2, seed: 6 });

    // A narrow collar, the warm note, with its small stud.
    limb([[-2.95, 4.8, 0.1], [-1.3, 4.1, 0.13], [0.72, 3.85, 0.1]], { tone: 1.24, warm: 0.7, hatch: 20, shadow: 0.42, melt: 0, flat: 0.5 });
    limb([[0.34, 3.72, 0.17], [0.42, 3.36, 0.1]], { tone: 1.3, warm: 0.8, shadow: 0.2, melt: 0 });

    // Head in profile, a long lean wedge: flat skull, slight stop, fine muzzle, tight lips.
    blob([[-2.7, 7.0], [-1.6, 8.2], [0.0, 8.5], [1.0, 8.2], [1.8, 7.5], [2.9, 6.8], [3.9, 6.25], [4.5, 5.8], [4.6, 5.3], [4.0, 4.95], [2.6, 4.75], [1.0, 4.8], [-0.4, 4.7], [-1.4, 5.2], [-2.6, 5.9]], {
      round: 1.0, tone: 1.24, hatch: 30, shadow: 0.62, spacing: 0.86, band: 0.5,
      creases: [
        // Mouth, long and shut, turning up at the corner.
        { pts: [[4.5, 5.32], [3.1, 5.24], [1.7, 5.4], [0.7, 5.75]], w: 0.09, depth: 0.2 },
        // Brow over the eye, the jaw muscle, the line of the nasal bone.
        { pts: [[0.1, 7.5], [0.9, 7.68], [1.6, 7.25]], w: 0.1, depth: 0.2 },
        { pts: [[-1.0, 7.2], [-0.5, 6.0], [0.4, 5.3]], w: 0.1, depth: 0.14 },
        { pts: [[1.9, 7.0], [2.9, 6.4], [3.9, 5.9]], w: 0.06, depth: 0.08 },
      ],
      bumps: [{ at: [-0.5, 6.4], r: [1.1, 1.3], h: 0.3 }, { at: [3.5, 5.8], r: [1.0, 0.5], angle: 20, h: 0.12 }],
    });
    // The eye: a dark almond with a bright glint, set under the brow.
    limb([[0.5, 7.14, 0.1], [0.82, 7.12, 0.2], [1.2, 6.96, 0.06]], { tone: 0.5, shadow: 0.4, melt: 0, rim: 1 });
    limb([[0.78, 7.17, 0.075], [0.8, 7.16, 0.07]], { tone: 1.6, warm: 0.5, shadow: 0, melt: 0, edge: 0 });
    // Nose leather and nostril.
    blob([[4.0, 6.0], [4.55, 5.85], [4.72, 5.45], [4.5, 5.28], [4.08, 5.5]], { round: 0.2, tone: 0.8, shadow: 0.3, creases: [{ pts: [[4.3, 5.62], [4.5, 5.6]], w: 0.05, depth: 0.08 }] });

    // Near ear, tall and upright, its tip on Theta.
    blob([[-1.7, 7.6], [-1.5, 8.9], [-0.5, 10.1], [the[0] + 0.08, the[1] + 0.62, 'c'], [0.5, 10.0], [0.7, 9.1], [0.55, 8.2], [0.1, 7.5], [-0.9, 7.1]], {
      round: 0.6, tone: 1.14, hatch: 76, shadow: 0.5, band: 0.3,
      creases: [{ pts: [[-0.9, 7.8], [-0.7, 8.9], [-0.1, 10.0]], w: 0.16, depth: 0.28 }, { pts: [[-0.1, 7.9], [0.05, 8.8], [0.1, 9.6]], w: 0.1, depth: 0.16 }],
    });
    strands([[-0.4, 7.9], [-0.25, 8.8], [-0.1, 9.6]], { n: 90, angle: 250, len: 0.4, jitter: 26, v: 0.44, spread: 0.2, seed: 8 });
    line([[-2.1, 7.5], [-1.5, 8.5]], { w: 0.04, v: 0.3 });
  },
};
