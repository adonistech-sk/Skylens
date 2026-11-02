// The Centaur, old bearded Chiron, thrusting a spear two-handed east at the Wolf. Menkent is his
// shoulder, as its name says, Iota the other, Nu and Mu the breast, Zeta the waist. The spear runs
// the length of the real line through Nu, Eta in his fist, and Kappa. Epsilon is the horse's chest,
// Hadar the planted knee, Toliman the lifted hoof, Gamma the back, Rho the thigh, Omicron the hock.
import { hoof, locks } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Centaur',
  pixels: 1100,
  anchors: [['Menkent', 'shoulder'], ['ι Cen', 'shoulder'], ['ν Cen', 'breast'], ['μ Cen', 'breast'], ['ζ Cen', 'waist'], ['η Cen', 'fist'], ['κ Cen', 'spear'], ['ε Cen', 'chest of the horse'], ['Hadar', 'knee'], ['Toliman', 'hoof'], ['γ Cen', 'back'], ['σ Cen', 'croup'], ['δ Cen', 'rump'], ['ρ Cen', 'thigh'], ['π Cen', 'tail'], [56243, 'hock']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const had = s('Hadar'), tol = s('Toliman'), omi = s(56243), pi = s('π Cen'), eta = s('η Cen');
    const sy = (x) => eta[1] + (x - eta[0]) * 0.25; // the spear's line, laid through the real stars.

    // Far hind leg.
    limb([[6.8, -5.4, 3.1], [6.9, -9.6, 1.6], [8.6, -12.2, 0.84], [7.6, -14.6, 0.56], [7.2, -15.6, 0.56]], { tone: 0.7, hatch: 80, shadow: 0.5, creases: [{ pts: [[5.6, -8.0], [6.2, -10.6], [7.8, -12.6]], w: 0.14, depth: 0.2 }] });
    hoof(E, [7.2, -15.7], 1.04, -100, { tone: 0.86 });

    // Far foreleg, lifted high and bent at the knee, the hoof on Toliman.
    limb([[-5.8, -5.0, 2.5], [-8.0, -7.2, 1.5], [-10.4, -8.4, 1.0], [-10.2, -10.0, 0.72], [tol[0] - 0.3, tol[1] + 1.1, 0.56]], { tone: 0.78, hatch: 130, shadow: 0.5, bumps: [{ at: [-10.4, -8.4], r: [0.8, 0.8], h: 0.2 }] });
    hoof(E, [tol[0] - 0.14, tol[1] + 0.62], 1.06, -66, { tone: 0.9 });

    // The tail, streaming out through Pi.
    strands([[13.4, -0.6], [15.8, -2.6], [17.0, -5.6], [pi[0] + 0.4, pi[1] - 0.2], [17.4, -12.0]], { n: 1200, angle: 272, flow: (x, y) => (y + 6) * 6, len: 2.6, jitter: 12, v: 0.58, spread: 1.1, seed: 2, w: 0.03 });
    limb([[12.8, 0.2, 0.86], [15.0, -0.8, 0.8], [16.6, -3.6, 0.74], [pi[0], pi[1], 0.56], [17.6, -12.4, 0.2]], { tone: 0.96, hatch: 66, shadow: 0.4, band: 0.6, creases: [{ pts: [[15.0, -1.4], [16.4, -4.0], [17.0, -8.0]], w: 0.09, depth: 0.12 }] });

    // Near hind leg: the big thigh, a sharp gaskin, the hock on Omicron, cannon and hoof.
    limb([[9.8, -3.4, 4.4], [10.4, -7.6, 2.8], [12.2, -10.6, 1.46], [omi[0] - 0.1, omi[1] + 0.3, 0.92], [13.0, -14.4, 0.62], [13.0, -15.6, 0.62]], {
      tone: 1.02, hatch: 70, shadow: 0.6, melt: 1.6,
      creases: [{ pts: [[7.6, -6.4], [9.2, -9.6], [11.8, -12.0]], w: 0.2, depth: 0.32 }, { pts: [[13.6, -5.6], [13.6, -8.4], [13.8, -10.4]], w: 0.17, depth: 0.26 }, { pts: [[11.4, -9.4], [12.2, -11.0], [13.2, -12.0]], w: 0.09, depth: 0.14 }, { pts: [[13.3, -13.2], [13.5, -13.9], [13.5, -14.6]], w: 0.07, depth: 0.1 }],
      bumps: [{ at: [10.4, -5.4], r: [3.2, 3.0], h: 0.7 }, { at: [omi[0], omi[1] + 0.3], r: [0.7, 0.7], h: 0.2 }, { at: [13.0, -14.9], r: [0.5, 0.4], h: 0.14 }],
    });
    hoof(E, [13.0, -15.6], 1.2, -98);

    // The horse: deep chest, the long barrel, a rounded croup.
    blob([[-7.8, 1.4], [-4.4, 2.2], [-0.8, 1.8], [3.6, 0.9], [7.4, 1.7], [10.8, 2.2], [13.4, 0.8], [14.6, -2.4], [13.6, -6.0], [9.8, -7.2], [5.0, -8.3], [0.6, -8.4], [-3.2, -8.0], [-6.8, -6.4], [-8.4, -2.4]], {
      round: 3.8, tone: 1.06, hatch: 16, shadow: 0.68, band: 0.9,
      creases: [
        { pts: [[3.6, 0.6], [2.4, -3.4], [3.6, -7.8]], w: 0.22, depth: 0.28 }, { pts: [[0.0, 1.0], [-0.8, -3.6], [0.2, -8.0]], w: 0.2, depth: 0.24 },
        { pts: [[7.4, 1.2], [6.2, -2.6], [7.2, -7.0]], w: 0.24, depth: 0.32 }, { pts: [[-3.6, 1.2], [-3.0, -3.4], [-3.4, -7.6]], w: 0.18, depth: 0.22 },
      ],
      bumps: [{ at: [-4.8, -3.4], r: [3.0, 3.6], h: 0.7 }, { at: [10.2, -1.4], r: [3.6, 3.2], h: 0.7 }, { at: [2.8, -6.6], r: [5.4, 1.8], h: 0.3 }],
    });

    // Near foreleg, planted, the knee on Hadar.
    limb([[-4.2, -5.0, 3.0], [-4.6, -8.0, 1.9], [had[0], had[1] + 0.2, 1.06], [-5.1, -13.0, 0.62], [-5.1, -14.8, 0.58], [-5.1, -15.6, 0.6]], {
      tone: 1.06, hatch: 92, shadow: 0.62, melt: 1.6,
      creases: [{ pts: [[-2.2, -7.0], [-3.4, -9.4], [-4.2, -11.4]], w: 0.16, depth: 0.24 }, { pts: [[-6.8, -7.2], [-6.0, -9.4], [-5.8, -11.0]], w: 0.14, depth: 0.2 }, { pts: [[-4.8, -12.0], [-4.7, -13.6], [-4.7, -14.8]], w: 0.07, depth: 0.1 }],
      bumps: [{ at: [had[0], had[1] + 0.2], r: [0.96, 0.96], h: 0.28 }, { at: [-5.1, -14.9], r: [0.54, 0.44], h: 0.14 }],
    });
    hoof(E, [-5.1, -15.6], 1.2, -94);

    // The back arm, drawn behind the shoulder, elbow out, far hand on the shaft.
    limb([[5.1, 10.3, 0.94], [3.4, 9.92, 0.84], [2.0, 9.7, 0.6]], { tone: 1.02, hatch: 10, shadow: 0.55, melt: 0.3, bumps: [{ at: [4.0, 10.0], r: [0.9, 0.5], h: 0.2 }] });
    limb([[1.0, 12.4, 1.86], [3.2, 11.5, 1.38], [5.2, 10.3, 0.98]], { tone: 1.08, hatch: 150, shadow: 0.6, melt: 0.7, bumps: [{ at: [3.1, 11.5], r: [1.3, 0.8], angle: -24, h: 0.26 }], creases: [{ pts: [[1.8, 10.5], [3.4, 10.3], [4.6, 9.6]], w: 0.09, depth: 0.12 }] });

    // The man's torso, turned to us: broad shoulders on Menkent and Iota, narrowing to the waist.
    blob([[-9.6, 12.2], [-8.0, 13.8], [-5.6, 14.2], [-2.2, 14.2], [0.4, 14.1], [1.9, 12.8], [1.2, 9.6], [-0.3, 6.4], [-1.2, 3.2], [-1.2, -0.2], [-4.6, -1.0], [-8.0, -0.2], [-8.6, 2.6], [-8.4, 5.4], [-9.0, 8.6]], {
      round: 2.2, tone: 1.14, hatch: 30, shadow: 0.66, band: 0.6,
      creases: [
        // Breast, sternum and the arch of the ribs.
        { pts: [[-4.5, 12.4], [-4.5, 9.4], [-4.5, 6.8]], w: 0.13, depth: 0.2 },
        { pts: [[-8.6, 10.6], [-6.6, 8.6], [-4.6, 8.8]], w: 0.14, depth: 0.24 }, { pts: [[0.4, 10.8], [-2.2, 8.6], [-4.4, 8.8]], w: 0.14, depth: 0.24 },
        // The abdomen.
        { pts: [[-4.5, 6.8], [-4.5, 4.4], [-4.5, 1.4]], w: 0.1, depth: 0.16 },
        { pts: [[-6.4, 6.6], [-4.6, 6.0], [-2.4, 6.6]], w: 0.09, depth: 0.12 }, { pts: [[-6.6, 4.8], [-4.6, 4.3], [-2.4, 4.8]], w: 0.09, depth: 0.12 }, { pts: [[-6.8, 3.0], [-4.6, 2.6], [-2.2, 3.0]], w: 0.09, depth: 0.12 },
        // Flanks.
        { pts: [[-8.4, 7.6], [-7.6, 5.4], [-7.4, 2.4]], w: 0.11, depth: 0.16 }, { pts: [[0.0, 8.0], [-1.6, 5.4], [-2.0, 2.4]], w: 0.11, depth: 0.16 },
      ],
      bumps: [{ at: [-6.8, 10.4], r: [2.4, 1.8], h: 0.4 }, { at: [-2.2, 10.4], r: [2.4, 1.8], h: 0.4 }, { at: [-4.6, 4.4], r: [2.4, 2.8], h: 0.26 }],
    });
    // Where the man ends the horse's hair begins, a falling fringe that hides the join.
    strands([[-8.8, 0.8], [-6.4, 0.0], [-4.4, -0.2], [-2.2, -0.2], [-0.4, 0.8]], { n: 1200, angle: 268, flow: (x) => (x + 4.5) * 2.2, len: 2.0, jitter: 13, v: 0.52, spread: 0.7, seed: 3, w: 0.03 });
    strands([[-8.6, 1.0], [-4.6, 0.2], [-0.8, 1.0]], { n: 600, angle: 90, len: 0.7, jitter: 26, v: 0.42, spread: 0.2, seed: 4, w: 0.03 });

    // The shaft, from behind him through Nu and Eta and on past Kappa.
    limb([[8.6, sy(8.6), 0.16], [-5, sy(-5), 0.17], [-20.0, sy(-20), 0.15]], { tone: 1.2, hatch: 14, shadow: 0.5, melt: 0, band: 0.14 });

    // Back hand, gripped round the shaft.
    blob([[0.4, 10.3], [1.6, 10.5], [2.2, 9.9], [2.1, 9.1], [1.0, 8.9], [0.3, 9.4]], { round: 0.5, tone: 1.14, hatch: 80, shadow: 0.5, band: 0.2, creases: [{ pts: [[0.8, 10.4], [0.8, 9.8], [0.72, 9.1]], w: 0.05, depth: 0.08 }, { pts: [[1.28, 10.46], [1.3, 9.8], [1.2, 9.0]], w: 0.05, depth: 0.08 }, { pts: [[1.7, 10.4], [1.74, 9.8], [1.66, 9.06]], w: 0.05, depth: 0.08 }] });

    // The leading arm, from Menkent down to the fist on Eta.
    limb([[-8.2, 12.5, 1.9], [-10.7, 11.5, 1.44], [-12.6, 10.1, 1.06], [-13.3, 8.4, 0.9], [-13.3, 7.2, 0.66]], {
      tone: 1.1, hatch: 40, shadow: 0.62, melt: 1.0,
      creases: [{ pts: [[-9.4, 10.2], [-11.0, 9.6], [-12.0, 8.8]], w: 0.09, depth: 0.14 }, { pts: [[-12.2, 12.0], [-13.6, 11.0], [-14.2, 9.4]], w: 0.09, depth: 0.12 }],
      bumps: [{ at: [-9.4, 12.4], r: [1.4, 1.2], h: 0.36 }, { at: [-10.9, 11.0], r: [1.2, 0.8], angle: -30, h: 0.24 }, { at: [-13.2, 9.0], r: [0.7, 1.0], h: 0.2 }],
    });
    blob([[-14.1, 7.2], [-12.5, 7.4], [-12.2, 6.4], [-12.4, 5.6], [-13.5, 5.3], [-14.2, 5.9]], { round: 0.5, tone: 1.16, hatch: 80, shadow: 0.5, band: 0.2, creases: [{ pts: [[-13.6, 7.2], [-13.7, 6.3], [-13.8, 5.5]], w: 0.05, depth: 0.08 }, { pts: [[-13.1, 7.3], [-13.2, 6.3], [-13.3, 5.4]], w: 0.05, depth: 0.08 }, { pts: [[-12.7, 7.3], [-12.7, 6.3], [-12.8, 5.5]], w: 0.05, depth: 0.08 }] });

    // The spearhead, the warm note: a long leaf with its midrib and socket.
    blob([[-19.7, sy(-19.7) + 0.26], [-20.8, sy(-20.8) + 0.58], [-22.6, sy(-22.6) + 0.34], [-24.8, sy(-24.8), 'c'], [-22.6, sy(-22.6) - 0.34], [-20.8, sy(-20.8) - 0.58], [-19.7, sy(-19.7) - 0.26]], { round: 0.26, tone: 1.26, warm: 0.76, hatch: 14, shadow: 0.42, band: 0.1, creases: [{ pts: [[-20, sy(-20)], [-22, sy(-22)], [-24.4, sy(-24.4)]], w: 0.04, depth: 0.08 }] });
    limb([[-19.0, sy(-19), 0.22], [-19.9, sy(-19.9), 0.24]], { tone: 1.2, warm: 0.76, shadow: 0.3, melt: 0, band: 0.06 });

    // Neck.
    limb([[-3.8, 13.0, 1.5], [-3.6, 14.8, 1.14], [-3.4, 15.8, 1.08]], { tone: 1.06, hatch: 80, shadow: 0.55, melt: 0.8 });
    // Thick hair thrown back behind the head.
    const hair = [[-3.2, 19.8], [-1.0, 19.6], [0.8, 18.2], [1.0, 16.0], [0.4, 14.2], [-1.4, 14.0], [-2.2, 15.6], [-2.2, 18.0]];
    blob(hair, { round: 0.8, tone: 0.7, hatch: 70, shadow: 0.5, edge: 0.25 });
    strands([[-3.4, 19.7], [-1.0, 19.4], [0.6, 18.0]], { n: 620, angle: 292, flow: (x) => -x * 5, len: 3.6, jitter: 6, v: 0.62, spread: 0.6, seed: 6, curl: -1, w: 0.03 });
    strands([[-2.4, 19.4], [-2.2, 17.4], [-2.0, 16]], { n: 300, angle: 280, len: 2.4, jitter: 8, v: 0.56, spread: 0.5, seed: 7, curl: -1, w: 0.03 });

    // Head in profile toward the spear: high brow, straight nose, a thinker's face.
    blob([[-3.2, 19.3], [-4.6, 19.1], [-5.4, 18.2], [-5.5, 17.7], [-6.2, 16.8], [-6.0, 16.4], [-5.5, 16.3], [-5.5, 15.9], [-5.6, 15.5], [-5.3, 15.0], [-4.2, 14.8], [-2.8, 15.4], [-1.9, 16.8], [-2.0, 18.4]], {
      round: 0.9, tone: 1.2, hatch: 34, shadow: 0.55, spacing: 0.9, band: 0.3,
      creases: [
        { pts: [[-4.1, 17.9], [-4.7, 18.0], [-5.3, 17.7]], w: 0.09, depth: 0.2 },
        { pts: [[-4.4, 17.4], [-4.8, 17.3], [-5.2, 17.34]], w: 0.05, depth: 0.1 },
        { pts: [[-5.6, 15.92], [-5.2, 15.95], [-4.8, 15.86]], w: 0.05, depth: 0.1 },
        { pts: [[-5.5, 16.5], [-5.2, 16.4]], w: 0.05, depth: 0.08 },
        { pts: [[-4.3, 17.0], [-4.5, 16.7], [-4.9, 16.6]], w: 0.05, depth: 0.07 },
        { pts: [[-3.0, 17.2], [-3.3, 17.5], [-2.9, 17.9], [-2.6, 17.5], [-2.9, 17.1]], w: 0.05, depth: 0.08 },
      ],
      bumps: [{ at: [-4.8, 18.5], r: [0.8, 0.5], h: 0.12 }],
    });
    // The eye.
    limb([[-4.9, 17.5, 0.04], [-4.68, 17.52, 0.1], [-4.42, 17.5, 0.04]], { tone: 1.5, shadow: 0, melt: 0, edge: 0 });
    // Crown of hair over the brow, and the long full beard of the old teacher.
    locks(E, [[[-5.2, 18.8], [-4.2, 19.7], [-2.8, 19.8]], [[-4.8, 19.2], [-3.4, 20.0], [-2.0, 19.6]], [[-4.0, 19.5], [-2.6, 19.9], [-1.4, 19.0]]], { w: 0.16, v: 0.62 });
    const beard = [[-5.7, 15.7], [-6.1, 14.4], [-5.9, 13.0], [-4.9, 11.4, 'c'], [-3.9, 12.4], [-3.0, 13.4], [-2.8, 15.2], [-3.8, 15.7], [-4.8, 15.3]];
    blob(beard, { round: 0.7, tone: 0.72, hatch: 80, shadow: 0.5, edge: 0.2 });
    strands([[-5.7, 15.5], [-4.7, 15.1], [-3.0, 15.4]], { n: 620, angle: 268, flow: (x) => (x + 4.4) * -3, len: 3.0, jitter: 7, v: 0.66, spread: 0.3, seed: 5, curl: 0.3, w: 0.03 });
    strands([[-5.0, 14.6], [-4.0, 14.2]], { n: 200, angle: 268, len: 2.2, jitter: 8, v: 0.6, spread: 0.5, seed: 8, w: 0.03 });
    line([[-6.0, 15.8], [-5.6, 15.65], [-5.2, 15.75]], { w: 0.04, v: 0.5 });
  },
};
