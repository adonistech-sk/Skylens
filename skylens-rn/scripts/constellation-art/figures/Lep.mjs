// The Hare, in full flight west from the Great Dog. Mu sits by the wide eye, Kappa and Lambda stand
// in the two tall ears, Arneb on the shoulder, Nihal at the elbow, Epsilon on the reaching forepaw,
// Delta at the hock, Gamma along the long hind foot, and Theta in the white scut.
import { fur, paw } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Hare',
  pixels: 1100,
  anchors: [['μ Lep', 'cheek'], ['κ Lep', 'far ear'], ['λ Lep', 'near ear'], ['Arneb', 'shoulder'], ['Nihal', 'elbow'], ['ε Lep', 'forepaw'], ['ζ Lep', 'back'], ['η Lep', 'rump'], ['θ Lep', 'scut'], ['δ Lep', 'hock'], ['γ Lep', 'hind foot']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const eps = s('ε Lep'), nih = s('Nihal'), del = s('δ Lep'), gam = s('γ Lep'), the = s('θ Lep');

    // Far ear, its dark tip the hare's own mark.
    blob([[4.5, 2.2], [4.72, 4.2], [5.1, 5.8], [5.72, 6.85], [6.12, 5.9], [5.98, 4.2], [5.6, 2.3]], {
      round: 0.56, tone: 0.86, hatch: 76, shadow: 0, band: 0.26,
      creases: [{ pts: [[5.1, 2.8], [5.3, 4.2], [5.62, 5.9]], w: 0.12, depth: 0.2 }, { pts: [[5.25, 6.0], [5.7, 5.7], [6.05, 5.85]], w: 0.05, depth: 0.08 }],
    });
    fur(E, [[5.2, 5.9], [5.72, 6.8], [6.05, 5.9]], { n: 130, angle: 70, len: 0.34, seed: 2, v: 0.2, w: 0.024 });

    // Far legs: the hind foot swung right under the body, the forepaw stretched ahead.
    limb([[-3.0, 0.4, 2.3], [-1.3, -2.1, 1.2], [-1.6, -3.5, 0.6], [0.6, -5.0, 0.46], [2.4, -5.9, 0.36]], { tone: 0.72, hatch: 58, shadow: 0.5, creases: [{ pts: [[-2.2, -2.4], [-1.8, -3.0], [-1.0, -3.8]], w: 0.09, depth: 0.14 }] });
    paw(E, [2.3, -5.9], 1.0, -26, { tone: 0.78 });
    limb([[2.4, -0.9, 1.5], [4.2, -2.3, 0.74], [6.2, -3.0, 0.42], [7.5, -2.9, 0.33]], { tone: 0.72, hatch: 150, shadow: 0.5 });
    paw(E, [7.4, -2.92], 0.92, 2, { tone: 0.8 });

    // The scut, a white tuft on Theta.
    blob([[-7.3, 2.0], [-7.2, 3.1], [-8.2, 3.5], [-9.0, 2.9], [-8.9, 1.9], [-8.0, 1.5]], { round: 0.7, tone: 1.2, hatch: 30, shadow: 0, edge: 0.3 });
    fur(E, [[-7.2, 1.9], [-7.2, 3.2], [-8.3, 3.6], [-9.1, 2.9], [-8.9, 1.8], [-8.0, 1.4]], { n: 420, angle: 160, flow: (x, y) => (y - 2.5) * 34, len: 0.56, seed: 3, jitter: 24, v: 0.72, w: 0.024 });

    // Body: the arched run of the back, high rump, a small waist behind the ribs.
    const body = [[3.0, 2.2], [0.4, 2.7], [-2.8, 3.3], [-5.6, 3.9], [-7.4, 3.1], [-8.1, 1.0], [-7.2, -1.2], [-4.6, -1.6], [-2.2, -1.5], [0.4, -2.3], [2.6, -2.0], [3.8, -0.4], [4.0, 1.0]];
    blob(body, {
      round: 2.3, tone: 1.08, hatch: 16, shadow: 0.66, band: 0.5,
      creases: [
        { pts: [[1.8, 2.3], [2.4, 0.4], [1.6, -1.8]], w: 0.16, depth: 0.2 }, { pts: [[-0.4, 2.6], [-0.8, 0.8], [-0.2, -1.6]], w: 0.12, depth: 0.14 },
        { pts: [[-1.8, 2.9], [-2.2, 1.2], [-1.8, -1.1]], w: 0.11, depth: 0.12 },
      ],
      bumps: [{ at: [1.2, 0.2], r: [2.2, 2.0], h: 0.5 }, { at: [-5.0, 1.4], r: [2.8, 2.4], h: 0.6 }],
    });
    fur(E, body, { n: 3000, angle: 186, len: 0.56, seed: 4, jitter: 14, v: 0.48, flow: (x, y) => (y - 1) * 3 });
    strands([[-7.0, 3.4], [-3, 3.3], [0.6, 2.7], [3.0, 2.2]], { n: 520, angle: 170, len: 0.7, jitter: 20, v: 0.44, spread: 0.2, seed: 5 });
    strands([[-7.0, -1.2], [-2.6, -1.5], [0.6, -2.3], [2.6, -2.0]], { n: 420, angle: 228, len: 0.7, jitter: 20, v: 0.4, spread: 0.2, seed: 6 });

    // Near hind leg, the hare's engine: huge haunch, knee, sharp hock on Delta, the long foot along Gamma.
    limb([[-5.2, 1.0, 3.0], [-3.8, -0.7, 2.5], [-2.9, -2.3, 1.3], [del[0] + 0.5, del[1] + 0.1, 0.66], [gam[0] - 0.1, gam[1] + 0.14, 0.52], [-0.5, -5.9, 0.44]], {
      tone: 1.08, hatch: 56, shadow: 0.62, melt: 1.2,
      creases: [{ pts: [[-7.4, 1.6], [-6.4, -1.2], [-4.2, -3.0]], w: 0.18, depth: 0.26 }, { pts: [[-4.2, 2.4], [-2.2, 0.8], [-1.8, -1.4]], w: 0.15, depth: 0.2 }, { pts: [[-3.6, -2.2], [-3.1, -3.0], [-3.3, -3.8]], w: 0.09, depth: 0.14 }],
      bumps: [{ at: [-4.8, 0.2], r: [2.2, 2.4], h: 0.6 }, { at: del, r: [0.5, 0.5], h: 0.16 }],
    });
    fur(E, [[-7.4, 1.4], [-5, 3.0], [-2.6, 0.8], [-2.0, -1.6], [-3.4, -3.2], [-5.4, -1.6]], { n: 1100, angle: 232, len: 0.5, seed: 7, jitter: 14, v: 0.46 });
    // Furred sole and blunt toes.
    blob([[-1.6, -5.0], [-0.4, -5.3], [0.6, -5.75], [0.95, -6.25], [0.4, -6.5], [-0.6, -6.42], [-1.8, -5.9]], { round: 0.4, tone: 1.04, hatch: 150, shadow: 0.5, creases: [{ pts: [[-0.1, -6.05], [0.4, -6.1], [0.85, -6.15]], w: 0.05, depth: 0.08 }, { pts: [[-0.1, -5.75], [0.3, -5.85], [0.75, -6.0]], w: 0.05, depth: 0.08 }] });
    strands([[-3.4, -4.4], [-2, -5.5], [-0.4, -6.2]], { n: 170, angle: 215, len: 0.44, jitter: 20, v: 0.42, spread: 0.1, seed: 8 });

    for (const [x, y] of [[0.8, -6.0], [0.9, -6.2], [0.82, -6.38]]) limb([[x, y, 0.08], [x + 0.32, y - 0.1, 0.03]], { tone: 1.3, shadow: 0.2, melt: 0, band: 0.05 });

    // Near foreleg, slim, reaching through Nihal to the paw on Epsilon.
    limb([[1.6, -0.5, 1.9], [nih[0] + 0.3, nih[1] + 0.2, 0.96], [3.6, -4.3, 0.54], [5.2, -4.75, 0.4], [6.1, -4.95, 0.36]], {
      tone: 1.06, hatch: 136, shadow: 0.6, melt: 1,
      creases: [{ pts: [[0.8, -2.6], [1.8, -4.0], [3.2, -4.8]], w: 0.1, depth: 0.14 }, { pts: [[2.8, -1.6], [3.2, -2.8], [3.8, -3.6]], w: 0.09, depth: 0.12 }],
    });
    paw(E, [eps[0] - 0.1, eps[1] - 0.02], 1.02, -12);

    // Head in profile: high round brow, long blunt face, the split lip.
    blob([[3.1, 2.1], [4.3, 2.75], [5.7, 2.55], [6.9, 1.8], [7.75, 1.05], [8.15, 0.5], [8.1, 0.05], [7.5, -0.28], [6.7, -0.5], [5.4, -0.86], [4.1, -0.5], [3.1, 0.4]], {
      round: 1.15, tone: 1.24, hatch: 28, shadow: 0.62, spacing: 0.88, band: 0.4,
      creases: [
        // The cleft lip and mouth.
        { pts: [[8.1, 0.3], [7.8, 0.1], [7.72, -0.2]], w: 0.07, depth: 0.14 },
        { pts: [[7.8, 0.1], [7.2, -0.02], [6.7, 0.1]], w: 0.06, depth: 0.12 },
        // Bony orbit round the great eye.
        { pts: [[4.9, 2.1], [5.6, 2.26], [6.4, 1.8]], w: 0.09, depth: 0.16 },
        { pts: [[5.0, 0.95], [5.7, 0.84], [6.4, 1.2]], w: 0.07, depth: 0.1 },
        // Cheek and the long nasal line.
        { pts: [[3.9, 1.3], [4.1, 0.2], [5.2, -0.5]], w: 0.09, depth: 0.12 },
        { pts: [[6.6, 1.6], [7.2, 1.1], [7.7, 0.7]], w: 0.05, depth: 0.06 },
      ],
      bumps: [{ at: [4.9, 0.3], r: [1.2, 1.0], h: 0.3 }, { at: [5.65, 1.55], r: [0.8, 0.7], h: 0.22 }, { at: [7.4, 0.3], r: [0.7, 0.6], h: 0.2 }],
    });
    fur(E, [[3.3, 2.0], [4.4, 2.5], [5.0, 1.0], [5.6, 0.4], [6.4, 0], [5.4, -0.7], [4, -0.4], [3.2, 0.4]], { n: 620, angle: 196, len: 0.34, seed: 9, jitter: 18, v: 0.48, w: 0.022 });
    // The great wide eye, set high, ringed, one warm iris.
    limb([[5.2, 1.57, 0.08], [5.66, 1.6, 0.36], [6.14, 1.46, 0.08]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.1 });
    limb([[5.64, 1.58, 0.21], [5.66, 1.58, 0.2]], { tone: 1.1, warm: 0.7, shadow: 0, melt: 0, edge: 0 });
    limb([[5.67, 1.58, 0.1], [5.68, 1.58, 0.1]], { tone: 0.1, shadow: 0, melt: 0, edge: 0 });
    limb([[5.59, 1.67, 0.05], [5.6, 1.67, 0.05]], { tone: 1.6, shadow: 0, melt: 0, edge: 0 });
    // Nose, whiskers.
    blob([[7.9, 0.74], [8.2, 0.56], [8.26, 0.36], [8.04, 0.3], [7.86, 0.46]], { round: 0.1, tone: 0.86, shadow: 0.3 });
    for (const [x, y, a, b] of [[7.5, 0.34, 9.1, 0.86], [7.4, 0.2, 9.3, -0.1], [7.3, 0.06, 8.9, -0.86]]) line([[x, y], [(x + a) / 2, (y + b) / 2 + 0.06], [a, b]], { w: 0.02, v: 0.55 });

    // Near ear, the tall spoon of it, Lambda at the middle.
    blob([[3.3, 2.2], [3.0, 4.0], [2.92, 5.7], [3.34, 6.95], [3.96, 6.1], [4.26, 4.4], [4.65, 2.5], [4.0, 2.0]], {
      round: 0.6, tone: 1.14, hatch: 84, shadow: 0.5, band: 0.26,
      creases: [{ pts: [[3.8, 2.7], [3.55, 4.3], [3.45, 6.0]], w: 0.17, depth: 0.3 }, { pts: [[2.98, 5.95], [3.4, 5.7], [3.92, 6.0]], w: 0.05, depth: 0.08 }],
    });
    fur(E, [[2.96, 5.95], [3.34, 6.9], [3.92, 6.05], [3.4, 5.72]], { n: 130, angle: 95, len: 0.34, seed: 10, v: 0.24, w: 0.024 });
    strands([[3.85, 2.6], [3.62, 3.6], [3.5, 4.8]], { n: 100, angle: 262, len: 0.4, jitter: 24, v: 0.4, spread: 0.2, seed: 11, w: 0.024 });
    if (the[0]) return;
  },
};
