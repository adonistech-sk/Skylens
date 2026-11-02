// The Hunting Dogs, Asterion and Chara, a pair of greyhounds flat out at the gallop with Boötes's
// copper leashes flying behind them. Chara, "joy", sits on the chest of the upper dog, and Cor
// Caroli, the brightest thing in this dark sky, on the collar of the lower.
import { fur, paw } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Hunting Dogs',
  pixels: 1100,
  anchors: [['Cor Caroli', 'collar'], ['Chara', 'chest']],
  draw({ E }) {
    const { blob, limb, line, strands } = E;

    // One hound, drawn in its own frame, u forward, v up, the chest at the origin.
    const hound = (ox, oy, tone, seed, spread = 0) => {
      const T = (p) => [ox + p[0], oy + p[1], ...p.slice(2)];
      const L = (pts, o) => limb(pts.map(T), { ...o, creases: o.creases?.map((k) => ({ ...k, pts: k.pts.map(T) })), bumps: o.bumps?.map((k) => ({ ...k, at: T(k.at) })) });
      const F = (pts, o) => blob(pts.map(T), { ...o, creases: o.creases?.map((k) => ({ ...k, pts: k.pts.map(T) })), bumps: o.bumps?.map((k) => ({ ...k, at: T(k.at) })) });
      const P = (p, len, angle, o) => paw(E, T(p), len, angle, o);
      const t = (v) => v * tone;

      // Far ear, folded back in the wind.
      F([[3.7, 3.3], [3.2, 3.9], [2.4, 4.1, 'c'], [2.9, 3.4], [3.5, 3.1]], { round: 0.14, tone: t(0.84), hatch: 20, shadow: 0, band: 0.08 });

      // Far legs: forelegs stretched right out ahead, hinds right out behind.
      L([[1.6, -0.2, 0.92], [3.4, -0.2 + spread, 0.5], [5.6, 0.1 + spread, 0.28], [6.9, 0.1 + spread, 0.24]], { tone: t(0.72), hatch: 174, shadow: 0.5 });
      P([6.9, 0.1 + spread], 0.64, 6, { tone: t(0.8) });
      L([[-4.4, -0.2, 1.1], [-4.8, -1.7, 0.7], [-6.4, -3.0, 0.36], [-7.4, -4.1, 0.24]], { tone: t(0.72), hatch: 44, shadow: 0.5 });
      P([-7.5, -4.2], 0.62, -130, { tone: t(0.78) });

      // The whip of a tail.
      L([[-6.0, 0.7, 0.36], [-7.8, 1.6, 0.21], [-9.8, 1.8, 0.12], [-11.4, 2.7, 0.03]], { tone: t(1), hatch: 16, shadow: 0.45, melt: 0.3, band: 0.1 });

      // Near hind leg, a great ham, a long lean shank.
      L([[-5.0, 0.2, 1.42], [-5.5, -1.2, 1.04], [-7.4, -2.0, 0.5], [-9.0, -3.0, 0.28], [-9.8, -3.6, 0.24]], {
        tone: t(1.04), hatch: 34, shadow: 0.6, melt: 0.7,
        creases: [{ pts: [[-3.8, -1.0], [-4.8, -2.0], [-6.8, -2.6]], w: 0.09, depth: 0.14 }, { pts: [[-6.6, -0.2], [-6.8, -0.9], [-7.2, -1.5]], w: 0.08, depth: 0.12 }],
        bumps: [{ at: [-5.2, -0.4], r: [1.2, 1.2], h: 0.34 }],
      });
      P([-9.9, -3.7], 0.66, -140, { tone: t(1) });

      // The body: a huge heart room, a wasp waist, a rising arch over the loin.
      const body = [[1.8, 1.3], [-1.0, 1.25], [-3.4, 1.3], [-5.4, 1.0], [-6.5, 0.2], [-5.8, -0.7], [-3.8, -0.3], [-2.2, -0.6], [-1.2, -1.2], [0.8, -1.9], [2.2, -1.1], [2.6, 0.3]];
      F(body, {
        round: 1.1, tone: t(1.1), hatch: 8, shadow: 0.66, band: 0.24,
        creases: [
          { pts: [[1.4, 1.2], [1.0, 0.0], [1.3, -1.6]], w: 0.09, depth: 0.14 }, { pts: [[0.2, 1.1], [-0.2, 0.0], [0.0, -1.5]], w: 0.07, depth: 0.1 }, { pts: [[-0.9, 1.1], [-1.2, 0.2], [-1.2, -1.0]], w: 0.07, depth: 0.1 }, { pts: [[-2.0, 1.2], [-2.2, 0.4], [-2.2, -0.5]], w: 0.06, depth: 0.08 },
        ],
        bumps: [{ at: [0.6, -0.2], r: [1.5, 1.5], h: 0.3 }],
      });
      fur(E, body.map(T), { n: 700, angle: 186, len: 0.3, seed, jitter: 12, v: 0.4, w: 0.012 });

      // Near foreleg, reaching.
      L([[1.0, -0.2, 1.14], [2.7, -1.2, 0.68], [5.0, -1.45, 0.34], [6.3, -1.6, 0.26]], {
        tone: t(1.08), hatch: 174, shadow: 0.62, melt: 0.7,
        creases: [{ pts: [[1.0, -1.4], [2.8, -1.8], [4.4, -1.8]], w: 0.08, depth: 0.12 }],
        bumps: [{ at: [2.4, -1.0], r: [0.9, 0.6], h: 0.2 }],
      });
      P([6.4, -1.6], 0.7, -2, { tone: t(1) });

      // The long arched neck.
      L([[1.2, 0.6, 1.46], [2.6, 1.7, 0.96], [3.7, 2.7, 0.74]], { tone: t(1.12), hatch: 40, shadow: 0.62, melt: 1, band: 0.18, creases: [{ pts: [[1.6, 2.2], [2.6, 2.8], [3.4, 3.2]], w: 0.05, depth: 0.08 }] });

      // The narrow head, all snout, flung forward.
      F([[2.9, 2.7], [3.3, 3.3], [4.2, 3.55], [5.0, 3.2], [6.0, 2.72], [7.0, 2.36], [7.42, 2.1], [7.3, 1.84], [6.5, 1.74], [5.4, 1.78], [4.4, 1.84], [3.4, 2.0]], {
        round: 0.5, tone: t(1.26), hatch: 18, shadow: 0.62, spacing: 0.88, band: 0.14,
        creases: [
          { pts: [[7.3, 2.0], [6.2, 1.96], [5.2, 2.1], [4.6, 2.34]], w: 0.05, depth: 0.12 },
          { pts: [[4.0, 3.0], [4.5, 3.06], [5.0, 2.76]], w: 0.07, depth: 0.14 },
          { pts: [[3.5, 2.8], [3.7, 2.2], [4.3, 2.0]], w: 0.05, depth: 0.07 },
        ],
      });
      L([[4.26, 2.78, 0.04], [4.5, 2.76, 0.13], [4.78, 2.6, 0.03]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.03 });
      L([[4.5, 2.78, 0.07], [4.52, 2.78, 0.07]], { tone: 1.6, warm: 0.4, shadow: 0, melt: 0, edge: 0 });
      L([[4.52, 2.78, 0.035], [4.53, 2.78, 0.035]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
      F([[7.1, 2.4], [7.5, 2.28], [7.6, 2.04], [7.4, 1.96], [7.14, 2.1]], { round: 0.08, tone: t(0.78), shadow: 0.3 });

      // Near ear, a greyhound's rose ear, laid flat back.
      F([[3.6, 3.3], [2.9, 3.74], [1.9, 3.74, 'c'], [2.5, 3.2], [3.1, 2.8], [3.6, 2.8]], { round: 0.16, tone: t(1.1), hatch: 16, shadow: 0.5, band: 0.08, creases: [{ pts: [[3.3, 3.1], [2.8, 3.3], [2.2, 3.56]], w: 0.06, depth: 0.1 }] });

      // The copper collar.
      L([[2.2, 2.9, 0.08], [2.74, 1.8, 0.11], [3.4, 1.06, 0.08]].map((p) => p), { tone: t(1.24), warm: 0.76, hatch: 60, shadow: 0.42, melt: 0, band: 0.05, flat: 0.5 });
      L([[2.28, 2.74, 0.15], [2.2, 2.86, 0.15]], { tone: t(1.3), warm: 0.8, shadow: 0.3, melt: 0, band: 0.04 });
      strands([[-6.2, 0.9], [-3.4, 1.4], [-1.0, 1.3], [1.6, 1.4]].map(T), { n: 150, angle: 174, len: 0.3, jitter: 18, v: 0.32, spread: 0.1, seed: seed + 1, w: 0.012 });
      return T([2.24, 2.82]);
    };

    // The upper dog, Chara on his chest, a shade further from us.
    const ringA = hound(1.9, 2.7, 0.96, 3, 0.2);
    // The lower dog, Cor Caroli on his collar, drawn over.
    const ringB = hound(-4.84, -3.3, 1.04, 7, -0.1);

    // The two leashes, slack and flying back to one ring, toward the Herdsman's hand.
    const join = [-15.4, 2.8];
    const leash = (a, mid1, mid2) => { line([a, mid1, mid2, join], { w: 0.026, v: 0.62, warm: 0.8, taper: false }); };
    leash(ringA, [0.4, 6.4], [-8.0, 5.8]);
    leash(ringB, [-5.4, 2.6], [-11.0, 1.2]);
    limb([[join[0] - 0.2, join[1] + 0.26, 0.15], [join[0] + 0.2, join[1] + 0.3, 0.15], [join[0] + 0.32, join[1], 0.15], [join[0] + 0.12, join[1] - 0.26, 0.15], [join[0] - 0.2, join[1] - 0.2, 0.15], [join[0] - 0.3, join[1] + 0.06, 0.15], [join[0] - 0.2, join[1] + 0.26, 0.15]], { tone: 1.3, warm: 0.8, hatch: 40, shadow: 0.3, melt: 0, band: 0.05 });
    line([[join[0] - 0.3, join[1] + 0.02], [-17.2, 3.5], [-18.6, 3.2]], { w: 0.028, v: 0.6, warm: 0.8 });
  },
};
