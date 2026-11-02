// The Fox with the Goose, as Hevelius named it, Vulpecula cum Ansere, drawn fresh: a lean fox at a
// flat run west with the goose slung from his jaws. Anser, "the goose", sits on the bird's neck,
// the last star on its body, then the shoulder, the back and the rump, and the great brush streams
// out behind.
import { coverts, feather, fur, paw } from '../kit.mjs';

const R = [0.2, 2.2], A = [0.92, -0.39], N = [0.39, 0.92];
const H = (p) => [R[0] + p[0] * A[0] + p[1] * N[0], R[1] + p[0] * A[1] + p[1] * N[1], ...p.slice(2)];
const HL = (l) => l.map(H);
const HC = (l) => l.map((k) => ({ ...k, pts: HL(k.pts) }));

export default {
  tier: 'extended',
  subject: 'The Fox and the Goose',
  pixels: 1100,
  anchors: [['Anser', 'neck of the goose'], [94703, 'body of the goose'], [97886, 'shoulder'], [98543, 'back'], [99874, 'rump']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const ans = s('Anser');

    // Far ear.
    blob(HL([[0.9, 1.0], [1.0, 1.9], [1.6, 2.9, 'c'], [2.1, 1.9], [2.0, 1.0]]), { round: 0.28, tone: 0.86, hatch: 60, shadow: 0, band: 0.14, creases: HC([{ pts: [[1.4, 1.2], [1.5, 1.8], [1.56, 2.4]], w: 0.08, depth: 0.12 }]) });

    // The brush, the fox's glory: huge, tapering, streaming back, with its white tip.
    const brush = [[-6.4, 3.0], [-8.6, 4.0], [-11.0, 4.7], [-13.6, 5.2], [-16.6, 6.2, 'c'], [-15.2, 3.8], [-13.4, 2.0], [-11.0, 1.2], [-8.6, 0.9], [-6.8, 1.0]];
    blob(brush, { round: 1.0, tone: 0.86, hatch: 8, shadow: 0, edge: 0.25 });
    fur(E, brush, { n: 2200, angle: 170, flow: (x, y) => (y - 3) * 3, len: 1.1, seed: 2, jitter: 13, v: 0.56, lit: 0.2, w: 0.022 });
    strands([[-7.4, 3.6], [-10.4, 4.7], [-13.6, 5.3], [-16.0, 5.9]], { n: 600, angle: 176, len: 1.0, jitter: 18, v: 0.5, spread: 0.3, seed: 3, w: 0.02 });
    strands([[-7.6, 0.9], [-10.8, 1.1], [-13.4, 1.9], [-15.2, 3.6]], { n: 600, angle: 200, len: 1.1, jitter: 18, v: 0.42, spread: 0.3, seed: 4, w: 0.02 });
    // The white tip, brighter hairs with a clear break.
    const tip = [[-13.2, 4.9], [-14.6, 5.5], [-16.8, 6.4, 'c'], [-15.3, 3.7], [-13.8, 2.8], [-13.0, 3.4]];
    fur(E, tip, { n: 900, angle: 160, flow: (x, y) => (y - 4) * 8, len: 1.0, seed: 5, jitter: 12, v: 0.92, w: 0.022 });

    // Far legs: the hind reaching forward under him, the fore trailing back.
    limb([[-5.0, -0.6, 1.9], [-3.6, -2.6, 1.06], [-3.6, -4.2, 0.54], [-2.2, -5.8, 0.34], [-1.5, -6.3, 0.3]], { tone: 0.7, hatch: 56, shadow: 0.5 });
    paw(E, [-1.5, -6.3], 0.8, -26, { tone: 0.76 });
    limb([[-0.8, -0.8, 1.4], [-1.8, -3.0, 0.72], [-3.6, -4.9, 0.36]], { tone: 0.66, hatch: 118, shadow: 0.5, melt: 0.3 });
    limb([[-3.6, -4.9, 0.36], [-5.0, -5.7, 0.3], [-5.5, -6.0, 0.28]], { tone: 0.66, hatch: 40, shadow: 0.4, melt: 0.2 });
    paw(E, [-5.6, -6.05], 0.76, 206, { tone: 0.74 });

    // Near hind leg, driven out behind.
    limb([[-6.2, 0.8, 2.3], [-5.8, -1.8, 1.7], [-6.8, -3.4, 0.9], [-8.6, -4.2, 0.46], [-9.8, -5.0, 0.34], [-10.3, -5.6, 0.32]], {
      tone: 1.02, hatch: 44, shadow: 0.6, melt: 1,
      creases: [{ pts: [[-4.2, -1.4], [-4.8, -3.0], [-6.2, -4.0]], w: 0.11, depth: 0.16 }, { pts: [[-8.2, -1.2], [-8.0, -2.4], [-8.2, -3.4]], w: 0.1, depth: 0.14 }],
      bumps: [{ at: [-6.0, -0.4], r: [1.8, 2.0], h: 0.5 }, { at: [-8.6, -4.2], r: [0.4, 0.4], h: 0.1 }],
    });
    paw(E, [-10.4, -5.65], 0.86, -128);

    // The long low body, a slim run of back and a tucked belly.
    const body = [[1.4, 3.0], [-1.4, 3.5], [-4.2, 3.4], [-6.6, 3.2], [-8.0, 1.8], [-7.8, -0.4], [-5.6, -1.0], [-3.2, -0.9], [-0.8, -1.8], [1.2, -1.8], [2.6, -0.4], [2.6, 1.6]];
    blob(body, {
      round: 2.0, tone: 1.08, hatch: 12, shadow: 0.66, band: 0.4,
      creases: [{ pts: [[0.2, 3.1], [-0.6, 1.0], [0.0, -1.5]], w: 0.14, depth: 0.2 }, { pts: [[-4.2, 3.2], [-4.6, 1.2], [-4.0, -0.8]], w: 0.13, depth: 0.16 }, { pts: [[-2.2, 3.3], [-2.4, 1.4], [-2.0, -1.0]], w: 0.09, depth: 0.1 }],
      bumps: [{ at: [0.2, 0.8], r: [1.8, 2.0], h: 0.4 }, { at: [-6.0, 1.2], r: [1.8, 1.8], h: 0.4 }],
    });
    fur(E, body, { n: 3000, angle: 186, len: 0.64, seed: 6, jitter: 13, v: 0.5, w: 0.02 });
    strands([[-7.8, 3.0], [-4.2, 3.5], [-1.4, 3.6], [1.2, 3.2]], { n: 600, angle: 170, len: 0.8, jitter: 18, v: 0.46, spread: 0.2, seed: 7, w: 0.02 });
    // The pale belly fringe.
    strands([[-5.6, -1.0], [-3.2, -0.9], [-0.8, -1.8], [1.2, -1.8]], { n: 600, angle: 232, len: 0.76, jitter: 16, v: 0.62, spread: 0.2, seed: 8, w: 0.02 });

    // Near foreleg, folded under at the run, a dark stocking on it.
    limb([[0.4, -0.4, 1.8], [1.0, -2.4, 1.12], [0.4, -4.0, 0.54], [-0.1, -5.4, 0.36], [0.5, -6.3, 0.32]], {
      tone: 1.04, hatch: 96, shadow: 0.6, melt: 1,
      creases: [{ pts: [[-0.3, -2.2], [-0.1, -3.2], [-0.3, -4.2]], w: 0.09, depth: 0.12 }],
    });
    limb([[0.25, -4.5, 0.46], [-0.1, -5.4, 0.38], [0.5, -6.3, 0.33]], { tone: 0.48, hatch: 96, shadow: 0.3, melt: 0.6, band: 0.12 });
    paw(E, [0.5, -6.35], 0.86, -12, { tone: 0.6 });

    // The goose, slung limp. Far wing first, hanging open.
    for (const [a, b, w] of [[[8.2, -2.6], [10.4, -6.2], 0.36], [[8.0, -2.2], [11.0, -5.2], 0.36], [[7.6, -2.0], [11.4, -3.9], 0.36], [[7.2, -1.8], [11.2, -2.6], 0.34]]) feather(E, a, b, w, { bend: -0.05, tone: 0.76 });
    // Feet trailing from under the tail, webbed.
    for (const [x, y] of [[8.0, -6.2], [6.6, -6.4]]) {
      limb([[x - 0.3, y + 1.0, 0.13], [x, y, 0.09]], { tone: 1.1, warm: 0.5, shadow: 0.4, melt: 0, band: 0.05 });
      blob([[x - 0.04, y + 0.1], [x + 0.56, y - 0.5, 'c'], [x + 0.12, y - 0.42], [x - 0.08, y - 0.86, 'c'], [x - 0.26, y - 0.42], [x - 0.68, y - 0.46, 'c']], { round: 0.1, tone: 1.14, warm: 0.5, shadow: 0.3, band: 0.04 });
    }
    // Body of the goose, full and soft.
    blob([[4.6, -1.4], [6.4, -1.0], [8.2, -1.9], [9.2, -3.6], [9.0, -5.0], [7.8, -5.5], [6.2, -5.4], [4.9, -4.4], [4.2, -2.8]], {
      round: 1.5, tone: 1.2, hatch: 34, shadow: 0.6, band: 0.26,
      bumps: [{ at: [6.2, -3.4], r: [1.6, 1.4], h: 0.4 }],
    });
    coverts(E, [[4.8, -2.8], [5.4, -4.2], [6.6, -5.0]], 306, 1.1, 0.26, { n: 7, tone: 1.14 });
    coverts(E, [[5.4, -2.2], [6.4, -3.6], [7.8, -4.2]], 310, 1.2, 0.28, { n: 7, tone: 1.18 });
    // The near wing, half fallen open across the body.
    for (const [a, b, w] of [[[5.4, -1.4], [9.2, -5.2], 0.34], [[5.6, -1.3], [9.7, -4.5], 0.34], [[5.9, -1.3], [10.0, -3.8], 0.34], [[6.2, -1.3], [10.1, -3.1], 0.34], [[6.6, -1.4], [9.8, -2.5], 0.32]]) feather(E, a, b, w, { bend: -0.06, tone: 1.08 });
    coverts(E, [[5.2, -1.6], [6.2, -1.5], [7.4, -2.0]], 318, 1.5, 0.3, { n: 7, turn: 16, tone: 1.2 });

    // The fox's lower jaw, under the neck of the goose.
    blob(HL([[1.8, -0.7], [3.4, -0.9], [4.3, -1.15], [4.4, -1.42], [3.4, -1.5], [2.0, -1.4], [1.0, -1.1]]), { round: 0.24, tone: 1.06, hatch: 18, shadow: 0.45, band: 0.1 });
    // Neck of the goose, limp over the jaw: one way to its body through Anser, the other to its dangling head.
    limb([[5.2, -1.9, 0.6], [ans[0] + 0.1, ans[1], 0.34], [H([3.2, -0.7])[0], H([3.2, -0.7])[1], 0.28], [2.4, -0.7, 0.26], [1.7, -2.2, 0.27], [1.9, -3.5, 0.3]], { tone: 1.2, hatch: 60, shadow: 0.5, melt: 0.4, band: 0.1 });
    // Its head, hanging, the bill the warm note.
    blob([[1.5, -3.2], [2.0, -3.1], [2.45, -3.5], [2.4, -4.0], [2.0, -4.3], [1.6, -4.0]], { round: 0.3, tone: 1.2, hatch: 50, shadow: 0.4, band: 0.1 });
    limb([[2.15, -4.15, 0.24], [2.3, -4.7, 0.15], [2.3, -5.1, 0.05]], { tone: 1.2, warm: 0.76, hatch: 80, shadow: 0.35, melt: 0, band: 0.06 });
    line([[2.0, -3.7], [2.15, -3.68]], { w: 0.04, v: 0.3, dark: true });

    // Neck of the fox.
    limb([[-0.4, 1.2, 2.3], [0.8, 1.8, 1.7]], { tone: 1.08, hatch: 30, shadow: 0.55, melt: 1.4, band: 0.3 });
    fur(E, [[-1, 3.3], [1, 3.4], [2.2, 1.6], [2.4, -0.6], [0.6, -1.4], [-1, 0.2]], { n: 1200, angle: 200, len: 0.74, seed: 9, jitter: 14, v: 0.5, w: 0.02 });

    // Head, long and narrow, a sharp wedge from the wide cheek to the fine nose.
    blob(HL([[-0.7, 0.2], [-0.1, 1.0], [0.8, 1.4], [1.7, 1.3], [2.4, 0.76], [3.4, 0.44], [4.5, 0.2], [4.72, -0.1], [4.5, -0.4], [3.4, -0.56], [2.2, -0.82], [0.8, -1.2], [-0.5, -0.8]]), {
      round: 0.74, tone: 1.26, hatch: 26, shadow: 0.62, spacing: 0.9, band: 0.24,
      creases: HC([
        { pts: [[4.6, -0.32], [3.5, -0.3], [2.5, -0.3], [1.8, -0.1]], w: 0.06, depth: 0.14 },
        { pts: [[1.1, 0.74], [1.6, 0.86], [2.2, 0.5]], w: 0.08, depth: 0.16 },
        { pts: [[0.2, 0.6], [0.5, -0.4], [1.4, -0.6]], w: 0.07, depth: 0.1 },
      ]),
      bumps: [{ at: H([0.8, -0.3]), r: [0.8, 0.7], h: 0.2 }],
    });
    fur(E, HL([[-0.6, 0.2], [0.2, 1.1], [1.2, 1.2], [1.2, 0.2], [2.0, -0.6], [0.8, -1.1], [-0.4, -0.7]]), { n: 500, angle: 200, len: 0.34, seed: 10, jitter: 22, v: 0.46, w: 0.016 });
    // White cheek tuft, bright hairs flaring back.
    strands(HL([[0.6, -0.9], [1.6, -0.8], [2.4, -0.7]]), { n: 340, angle: 200, len: 0.8, jitter: 18, v: 0.8, spread: 0.2, seed: 11, w: 0.02 });
    strands(HL([[-0.4, -0.8], [0.4, -1.1]]), { n: 180, angle: 240, len: 0.8, jitter: 18, v: 0.7, spread: 0.2, seed: 12, w: 0.02 });
    // Upper fang over the goose's neck.
    limb(HL([[3.34, -0.5, 0.08], [3.32, -0.78, 0.05], [3.26, -1.02, 0.01]]), { tone: 1.4, shadow: 0.2, melt: 0, band: 0.04 });
    // The sly amber eye.
    limb(HL([[1.2, 0.54, 0.05], [1.56, 0.5, 0.14], [1.96, 0.34, 0.04]]), { tone: 0.5, shadow: 0.4, melt: 0, rim: 1, band: 0.04 });
    limb(HL([[1.54, 0.5, 0.09], [1.57, 0.5, 0.09]]), { tone: 1.4, warm: 0.5, shadow: 0, melt: 0, edge: 0 });
    limb(HL([[1.56, 0.5, 0.05], [1.57, 0.5, 0.05]]), { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    // Black nose.
    blob(HL([[4.3, 0.26], [4.74, 0.16], [4.92, -0.1], [4.74, -0.28], [4.4, -0.14]]), { round: 0.1, tone: 0.76, shadow: 0.3 });

    // Near ear, tall and sharp, dark at the back.
    blob(HL([[-0.3, 0.8], [-0.2, 1.8], [0.46, 3.1, 'c'], [1.1, 1.9], [1.2, 1.0], [0.5, 0.7]]), {
      round: 0.3, tone: 1.14, hatch: 64, shadow: 0.5, band: 0.14,
      creases: HC([{ pts: [[0.42, 1.1], [0.46, 1.8], [0.46, 2.6]], w: 0.1, depth: 0.18 }]),
    });
    strands(HL([[0.34, 1.1], [0.4, 1.7]]), { n: 70, angle: 80, len: 0.4, jitter: 26, v: 0.6, spread: 0.2, seed: 13, w: 0.016 });
  },
};
