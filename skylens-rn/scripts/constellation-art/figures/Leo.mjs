// The Lion, striding west. The Sickle is the mane and head, Regulus at the chest above the
// forepaw, Zosma on the haunch, and Denebola, "the lion's tail", ends the tail.
import { fur, paw } from '../kit.mjs';

export default {
  pixels: 1500,
  anchors: [['Regulus', 'chest'], [49583, 'breast'], ['Algieba', 'mane'], ['Adhafera', 'mane'], ['Rasalas', 'crown'], ['ε Leo', 'brow'], ['Zosma', 'haunch'], ['Chertan', 'thigh'], ['Denebola', 'tail tuft']],
  draw({ s, E }) {
    const { blob, limb, strands } = E;
    const reg = s('Regulus'), den = s('Denebola'), zos = s('Zosma'), che = s('Chertan');

    // Far legs.
    limb([[-7.8, -1.8, 2.6], [-6.4, -6.0, 1.6], [-7.2, -8.6, 1.14], [-6.0, -11.6, 0.82]], { tone: 0.72, hatch: 80, shadow: 0.5 });
    paw(E, [-6.2, -11.8], 1.7, -10, { tone: 0.78 });
    limb([[2.2, -4.2, 2.1], [2.2, -8.0, 1.3], [2.6, -11.4, 0.86]], { tone: 0.72, hatch: 92, shadow: 0.5 });
    paw(E, [2.2, -11.8], 1.7, -8, { tone: 0.78 });

    // Tail: low from the rump, lifting to the tuft on Denebola.
    limb([[-13.6, 0.2, 0.82], [-16.4, -3.6, 0.5], [-19.8, -6.8, 0.4], [-21.4, -5.6, 0.36], [den[0] - 0.1, den[1] + 0.2, 0.3]], { tone: 1, hatch: 58, shadow: 0.45 });
    strands([[den[0] - 0.4, den[1] - 0.2], [den[0] + 0.5, den[1] + 0.3]], { n: 240, angle: 72, len: 1.5, jitter: 26, v: 0.62, spread: 0.2, seed: 41, curl: 2, warm: 0.4 });

    // Near hind leg.
    limb([[-11.0, -0.8, 3.7], [che[0] - 0.8, che[1] - 0.6, 2.8], [-11.0, -7.4, 1.6], [-13.0, -9.0, 1.14], [-12.0, -12.2, 0.9]], {
      tone: 1.04, hatch: 72, shadow: 0.6, creases: [{ pts: [[-14.2, -3.0], [-14.0, -6.2], [-13.8, -8.6]], w: 0.2, depth: 0.3 }, { pts: [[-7.8, -3.6], [-9.0, -6.6], [-10.4, -8.4]], w: 0.2, depth: 0.28 }],
      bumps: [{ at: [-10.6, -2.4], r: [2.8, 3.0], h: 0.7 }],
    });
    paw(E, [-12.4, -12.4], 1.86, -10);

    // Body: long flank, deep chest, a slight sag behind the mane.
    blob([[-14.2, 0.0], [-13.4, 3.2], [-10.0, 3.8], [-5.0, 2.8], [-0.6, 2.8], [3.4, 2.4], [7.4, 0.8], [8.0, -3.2], [6.2, -6.2], [2.6, -6.4], [-1.8, -4.2], [-6.4, -3.4], [-10.8, -4.0], [-13.6, -2.6]], {
      round: 4.0, tone: 1.08, hatch: 14, shadow: 0.68,
      creases: [{ pts: [[-9.4, 3.2], [-8.0, -0.4], [-8.6, -3.6]], w: 0.26, depth: 0.32 }, { pts: [[-2.0, 2.4], [-2.8, -0.6], [-2.2, -4.0]], w: 0.2, depth: 0.2 }, { pts: [[-5.6, 2.2], [-5.4, -0.4], [-5.4, -3.2]], w: 0.16, depth: 0.14 }, { pts: [[0.4, 2.2], [0.0, -0.8], [0.8, -5.0]], w: 0.2, depth: 0.18 }],
      bumps: [{ at: [-10.6, 0.8], r: [3.4, 3.2], h: 0.7 }, { at: [3.2, -2.2], r: [3.6, 3.6], h: 0.7 }, { at: [-5.0, -0.6], r: [3.4, 1.6], h: 0.24 }],
    });
    // Near foreleg, Regulus above the paw.
    limb([[5.0, -3.2, 3.0], [reg[0] - 0.2, reg[1] + 0.6, 2.0], [6.4, -10.2, 1.18], [6.8, -12.0, 0.92]], {
      tone: 1.08, hatch: 96, shadow: 0.62, creases: [{ pts: [[8.0, -6.0], [7.6, -9.0], [7.4, -11.0]], w: 0.16, depth: 0.24 }, { pts: [[3.6, -7.0], [4.8, -9.6], [5.6, -11.0]], w: 0.16, depth: 0.22 }],
      bumps: [{ at: [reg[0], reg[1] + 1.2], r: [1.8, 2.6], h: 0.42 }],
    });
    paw(E, [6.6, -12.4], 1.9, -6);

    // Sleek short coat over the body.
    fur(E, [[-14.2, 0], [-13.4, 3.2], [-10, 3.8], [-5, 2.8], [0, 2.8], [0, -4.4], [-6.4, -3.4], [-10.8, -4], [-13.6, -2.6]], { n: 2400, angle: 186, len: 0.62, seed: 42, jitter: 12, v: 0.46 });
    fur(E, [[-14, -2], [-8, -2], [-9.6, -7.4], [-11.6, -9], [-13.6, -8]], { n: 700, angle: 256, len: 0.5, seed: 43, jitter: 12, v: 0.42 });

    // The mane: a shaggy mass that wraps the whole head, thrown back from the face.
    const mane = [[-2.4, 3.0], [-2.0, 6.4], [0.8, 8.8], [4.6, 10.4], [8.6, 11.0], [11.4, 10.4], [12.2, 8.0], [10.6, 6.0], [10.8, 2.0], [12.4, -0.4], [11.2, -3.2], [8.6, -6.2], [5.0, -6.8], [1.4, -5.2], [-1.2, -1.0]];
    blob(mane, { round: 2.4, tone: 0.62, warm: 0.34, hatch: 44, shadow: 0.68, relief: 0.26, edge: 0 });
    const fromFace = (x, y) => (Math.atan2(y - 3.2, x - 13.2) * 180) / Math.PI;
    fur(E, mane, { n: 5400, angle: 0, flow: fromFace, len: 2.3, jitter: 20, curl: 1.2, seed: 44, v: 0.42, lit: 0.12, warm: 0.54, w: 0.03 });
    strands([[-2.2, 5.6], [0.8, 8.8], [4.6, 10.4], [8.6, 11], [11.8, 10]], { n: 1100, angle: 0, flow: fromFace, len: 2.2, jitter: 24, v: 0.46, spread: 0.7, seed: 45, curl: 2, warm: 0.54 });
    strands([[-2.4, 2.6], [-1.2, -1], [1.4, -5.2], [5, -6.8], [8.6, -6.2], [11.2, -3.2]], { n: 1200, angle: 0, flow: fromFace, len: 2.3, jitter: 24, v: 0.42, spread: 0.7, seed: 46, curl: -2, warm: 0.54 });
    // Darker hairs give the ruff its depth.
    strands([[3, 8], [7, 8.4], [10, 7]], { n: 500, angle: 0, flow: fromFace, len: 2.6, jitter: 26, v: 0.3, spread: 1.4, seed: 47, curl: 1.6, warm: 0.3 });

    // Head in profile: a long flat brow, a heavy square muzzle, a deep jaw.
    blob([[9.0, 8.2], [11.0, 8.8], [12.8, 8.0], [13.96, 6.6], [15.24, 5.9], [16.36, 5.0], [16.84, 3.8], [16.68, 2.4], [16.04, 1.3], [14.6, 0.8], [13.0, 0.5], [11.2, 1.0], [9.6, 2.8], [8.6, 5.4]], {
      round: 1.5, tone: 1.26, hatch: 26, shadow: 0.66, spacing: 0.88, band: 0.6,
      creases: [
        { pts: [[12.9, 6.1], [13.64, 5.9], [14.28, 5.3]], w: 0.13, depth: 0.28 }, { pts: [[12.6, 6.8], [13.64, 6.5], [14.44, 5.8]], w: 0.09, depth: 0.14 },
        { pts: [[14.28, 2.4], [15.4, 2.2], [16.6, 2.6]], w: 0.09, depth: 0.2 }, { pts: [[15.08, 4.6], [15.08, 3.6], [15.72, 2.5]], w: 0.09, depth: 0.14 }, { pts: [[13.48, 4.8], [14.28, 3.8], [14.6, 2.6]], w: 0.09, depth: 0.12 },
      ],
      bumps: [{ at: [15.56, 3.5], r: [1.6, 1.3], h: 0.32 }, { at: [12.0, 3.6], r: [1.8, 2.0], h: 0.3 }, { at: [13.16, 6.9], r: [1.4, 0.6], angle: -24, h: 0.2 }],
    });
    limb([[16.28, 4.8, 0.28], [16.76, 4.2, 0.24]], { tone: 1.3, warm: 0.3, shadow: 0.2, melt: 0 });
    blob([[9.6, 8.0], [9.6, 9.6], [10.8, 10.2], [11.8, 9.2], [11.6, 8.0]], { round: 0.5, tone: 1.14, shadow: 0.42, creases: [{ pts: [[10.2, 8.5], [10.6, 9.2], [11.2, 8.7]], w: 0.1, depth: 0.2 }] });
    for (const [x, y] of [[14.84, 3.3], [15.32, 3.0], [14.6, 2.8], [15.16, 2.6]]) limb([[x, y, 0.06], [x + 0.5, y - 0.1, 0.03]], { tone: 0.2, shadow: 0, melt: 0, edge: 0 });
    if (zos[0]) return;
  },
};
