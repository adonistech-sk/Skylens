// The Unicorn, springing west through the winter Milky Way, neck arched and long mane flying. The
// star at the crest of the neck and the two below it run down the head to Epsilon on the muzzle,
// Delta sits on the shoulder, Zeta on the rump, Alpha at the hock, Beta at the bent knee and Gamma
// in the cloven hoof. The spiral horn takes the warm note.
import { fur, hoof, locks } from '../kit.mjs';

const R = [4.4, 9.0], A = [0.665, -0.747], N = [0.747, 0.665];
const H = (p) => [R[0] + p[0] * A[0] + p[1] * N[0], R[1] + p[0] * A[1] + p[1] * N[1], ...p.slice(2)];
const HL = (l) => l.map(H);
const HC = (l) => l.map((k) => ({ ...k, pts: HL(k.pts) }));

export default {
  tier: 'extended',
  subject: 'The Unicorn',
  pixels: 1100,
  anchors: [[31978, 'crest of the neck'], [31216, 'cheek'], ['ε Mon', 'muzzle'], [32578, 'throat'], ['δ Mon', 'shoulder'], ['β Mon', 'knee'], ['γ Mon', 'hoof'], ['α Mon', 'hock'], ['ζ Mon', 'rump']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const bet = s('β Mon'), gam = s('γ Mon'), alp = s('α Mon');

    // Far hind leg, driving off behind.
    limb([[-15.6, -2.6, 3.0], [-17.2, -7.2, 1.6], [-20.0, -9.8, 0.86], [-21.8, -12.6, 0.54], [-22.5, -13.6, 0.5]], { tone: 0.72, hatch: 56, shadow: 0.5 });
    hoof(E, [-22.6, -13.7], 1.0, -124, { tone: 0.86 });

    // Far foreleg, lifted higher.
    limb([[0.4, -0.4, 2.6], [3.4, -0.6, 1.5], [6.6, -0.4, 0.94], [8.3, -1.7, 0.6], [8.9, -2.4, 0.52]], { tone: 0.74, hatch: 120, shadow: 0.5, bumps: [{ at: [6.6, -0.4], r: [0.8, 0.8], h: 0.2 }] });
    hoof(E, [9.0, -2.6], 1.0, -56, { tone: 0.88 });

    // The tail, long, whipped out behind and ending in a tuft.
    strands([[-19.0, 0.4], [-23.0, 2.0], [-26.6, 0.2], [-28.4, -4.0], [-29.0, -8.0]], { n: 1500, angle: 250, flow: (x, y) => (y + 2) * 7, len: 2.6, jitter: 12, v: 0.6, spread: 1.0, seed: 2, curl: 0.5, w: 0.03 });
    limb([[-18.2, 0.6, 0.82], [-20.8, 1.8, 0.7], [-24.0, 1.4, 0.56], [-26.6, -1.6, 0.4], [-28.2, -5.4, 0.16]], { tone: 1.0, hatch: 30, shadow: 0.4, band: 0.5 });

    // Near hind leg, the great gaskin, the sharp hock on Alpha, a long fine cannon.
    limb([[-15.0, -1.2, 4.0], [-13.4, -4.8, 3.0], [-12.2, -7.4, 1.76], [alp[0] + 0.1, alp[1] + 0.1, 0.96], [-12.8, -12.0, 0.62], [-13.6, -13.8, 0.56]], {
      tone: 1.04, hatch: 66, shadow: 0.6, melt: 1.6,
      creases: [{ pts: [[-16.8, -3.6], [-15.0, -7.0], [-13.4, -9.0]], w: 0.18, depth: 0.28 }, { pts: [[-10.8, -4.0], [-10.8, -6.2], [-10.8, -8.6]], w: 0.14, depth: 0.2 }, { pts: [[-12.8, -10.2], [-13.0, -11.4], [-13.6, -12.8]], w: 0.07, depth: 0.1 }],
      bumps: [{ at: [-14.2, -3.2], r: [3.0, 2.8], h: 0.7 }, { at: [alp[0], alp[1]], r: [0.8, 0.8], h: 0.22 }],
    });
    hoof(E, [-13.7, -14.0], 1.16, -108);

    // The body, deep through the heart, a lifted line from the croup to the withers.
    const body = [[-19.4, -2.6], [-18.8, 0.9], [-15.6, 3.0], [-11.0, 3.2], [-6.8, 3.9], [-3.4, 5.4], [0.4, 4.8], [2.0, 1.2], [1.2, -2.4], [-1.6, -4.6], [-6.0, -4.6], [-10.6, -3.8], [-14.6, -5.0], [-18.0, -5.0]];
    blob(body, {
      round: 3.4, tone: 1.08, hatch: 14, shadow: 0.68, band: 0.8,
      creases: [
        { pts: [[-13.4, 3.0], [-12.4, -0.6], [-13.0, -4.2]], w: 0.2, depth: 0.28 }, { pts: [[-7.4, 3.6], [-8.2, 0.0], [-7.4, -4.2]], w: 0.17, depth: 0.2 },
        { pts: [[-2.6, 5.0], [-4.0, 0.8], [-2.6, -4.2]], w: 0.22, depth: 0.32 }, { pts: [[-10.4, 3.0], [-10.8, 0.0], [-10.4, -3.4]], w: 0.13, depth: 0.14 },
      ],
      bumps: [{ at: [-15.4, -0.8], r: [3.4, 3.2], h: 0.7 }, { at: [-1.4, 0.2], r: [3.0, 3.6], h: 0.7 }],
    });
    fur(E, body, { n: 1800, angle: 186, len: 0.5, seed: 3, jitter: 12, v: 0.36, w: 0.024 });

    // Near foreleg, the knee on Beta, the cannon folded forward, the hoof on Gamma.
    limb([[-1.0, -1.6, 3.0], [1.6, -3.6, 1.94], [4.2, -5.6, 1.22], [bet[0], bet[1], 0.96], [8.0, -6.5, 0.6], [gam[0] - 0.9, gam[1] + 0.05, 0.54]], {
      tone: 1.08, hatch: 130, shadow: 0.62, melt: 1.6,
      creases: [{ pts: [[-0.6, -4.2], [2.0, -5.8], [4.6, -7.2]], w: 0.15, depth: 0.22 }, { pts: [[2.0, -1.8], [3.6, -3.2], [5.0, -4.6]], w: 0.13, depth: 0.18 }],
      bumps: [{ at: bet, r: [0.84, 0.84], h: 0.24 }, { at: [1.4, -3.2], r: [1.6, 1.3], angle: -30, h: 0.3 }],
    });
    hoof(E, [gam[0] - 0.56, gam[1] + 0.04], 1.14, 6);

    // The neck, a tall arch.
    limb([[-3.2, 2.0, 4.4], [-0.9, 5.0, 3.3], [1.3, 7.6, 2.4], [3.4, 9.0, 1.9], [4.8, 9.0, 1.7]], {
      tone: 1.12, hatch: 52, shadow: 0.62, band: 0.8, melt: 2.2,
      creases: [{ pts: [[1.6, 4.0], [2.8, 6.0], [4.6, 7.2]], w: 0.14, depth: 0.2 }, { pts: [[-1.4, 1.6], [1.0, 3.2], [2.8, 4.8]], w: 0.09, depth: 0.1 }],
      bumps: [{ at: [0.2, 4.4], r: [2.2, 2.8], angle: 40, h: 0.3 }],
    });
    fur(E, [[-2, 4], [1, 7.6], [3.4, 8.4], [3.6, 6.6], [1, 2.4], [-1, 0.6]], { n: 500, angle: 210, len: 0.5, seed: 4, jitter: 12, v: 0.34, w: 0.024 });

    // The mane, thrown back along the neck, long tresses blowing out behind him.
    locks(E, [
      [[5.0, 10.6], [1.8, 11.8], [-1.6, 10.8], [-5.4, 11.4]], [[3.8, 10.8], [0.4, 10.6], [-3.4, 9.0], [-7.4, 9.4]], [[2.6, 10.4], [-0.6, 9.4], [-4.0, 7.6], [-8.8, 7.2]], [[1.4, 9.8], [-1.4, 8.0], [-4.4, 6.4], [-8.4, 5.4]],
      [[0.2, 8.8], [-2.2, 6.8], [-4.6, 5.4], [-7.4, 4.6]], [[4.4, 11.0], [1.6, 12.8], [-2.0, 12.2], [-4.8, 13.2]], [[-0.8, 7.8], [-3.0, 6.0], [-5.0, 4.8]],
    ], { w: 0.2, v: 0.6 });
    strands([[5.0, 10.8], [2.8, 10.6], [0.8, 9.4], [-1.0, 7.8]], { n: 900, angle: 186, flow: (x, y) => (x - 4) * 1.4, len: 3.8, jitter: 9, v: 0.56, spread: 0.7, seed: 5, curl: -0.6, w: 0.03 });
    strands([[3.6, 11.2], [0.4, 10.4], [-2.8, 8.4]], { n: 500, angle: 180, flow: (x, y) => (y - 9) * 3, len: 3.0, jitter: 12, v: 0.5, spread: 1.0, seed: 6, curl: 0.5, w: 0.03 });

    // The horn, long and true, cut in a spiral.
    const b0 = H([1.2, 1.5]), tip = [13.9, 15.2];
    const dx = tip[0] - b0[0], dy = tip[1] - b0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const spiral = [];
    for (let k = 0.06; k < 0.96; k += 0.078) {
      const r = 0.5 * (1 - k), m = [b0[0] + dx * k, b0[1] + dy * k];
      spiral.push({ pts: [[m[0] - uy * r, m[1] + ux * r], [m[0] + ux * 0.1, m[1] + uy * 0.1], [m[0] + uy * r + ux * 0.5, m[1] - ux * r + uy * 0.5]], w: 0.05, depth: 0.1 });
    }
    limb([[...b0, 0.56], [b0[0] + dx * 0.5, b0[1] + dy * 0.5, 0.3], [...tip, 0.02]], { tone: 1.2, warm: 0.56, hatch: 80, shadow: 0.5, melt: 0, band: 0.14, creases: spiral });

    // The goat's beard that marks him for what he is.
    strands(HL([[4.8, -0.9], [5.5, -1.0]]), { n: 160, angle: 252, len: 1.8, jitter: 10, v: 0.6, spread: 0.1, seed: 7, curl: -1, w: 0.03 });

    // The ear, pricked forward.
    blob(HL([[-0.6, -0.3], [-1.3, 0.4], [-2.2, 1.8, 'c'], [-0.7, 1.4], [0.3, 0.9]]), { round: 0.34, tone: 1.1, hatch: 44, shadow: 0.42, band: 0.16, creases: HC([{ pts: [[-0.4, 0.3], [-1.0, 0.8], [-1.8, 1.6]], w: 0.1, depth: 0.18 }]) });

    // The head: a fine dished face, a wide jaw, the nostril flared.
    blob(HL([[-0.5, 1.2], [1.2, 1.74], [2.8, 1.3], [4.4, 0.9], [5.6, 1.0], [6.35, 0.42], [6.4, -0.46], [5.7, -1.0], [4.3, -0.9], [2.8, -1.5], [1.1, -2.0], [-0.5, -1.2]]), {
      round: 1.0, tone: 1.24, hatch: 40, shadow: 0.62, spacing: 0.9, band: 0.3,
      creases: HC([
        { pts: [[1.2, 1.05], [1.95, 1.18], [2.6, 0.72]], w: 0.09, depth: 0.2 },
        { pts: [[6.3, -0.28], [5.7, -0.26], [5.0, -0.4]], w: 0.07, depth: 0.14 },
        { pts: [[4.9, 0.72], [5.4, 0.86], [5.9, 0.6]], w: 0.07, depth: 0.14 },
        { pts: [[-0.1, -1.2], [1.4, -1.0], [2.8, -1.2]], w: 0.09, depth: 0.14 },
        { pts: [[2.4, 0.3], [3.6, 0.2], [4.8, 0.1]], w: 0.06, depth: 0.08 },
      ]),
      bumps: [{ at: H([1.0, -0.8]), r: [1.2, 1.1], h: 0.3 }, { at: H([5.6, 0.1]), r: [0.8, 0.8], h: 0.2 }],
    });
    // The eye, dark and large.
    limb(HL([[1.5, 0.74, 0.07], [1.96, 0.76, 0.22], [2.4, 0.56, 0.06]]), { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.05 });
    limb(HL([[1.92, 0.78, 0.14], [1.95, 0.78, 0.13]]), { tone: 1.3, warm: 0.5, shadow: 0, melt: 0, edge: 0 });
    limb(HL([[1.95, 0.78, 0.07], [1.96, 0.78, 0.07]]), { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    limb(HL([[5.34, 0.48, 0.06], [5.56, 0.42, 0.13], [5.74, 0.22, 0.05]]), { tone: 0.3, shadow: 0.4, melt: 0, band: 0.05 });

    // Forelock, falling across the brow.
    locks(E, [[[-0.4, 1.3], [0.5, 2.1], [1.6, 2.3]], [[-0.2, 1.2], [0.8, 1.7], [2.0, 1.5]], [[-0.1, 1.0], [0.9, 1.1], [1.6, 0.6]]].map(HL), { w: 0.14, v: 0.6 });
    line(HL([[-0.4, -0.4], [-0.5, 0.2], [-0.4, 0.8]]), { w: 0.03, v: 0.4 });
  },
};
