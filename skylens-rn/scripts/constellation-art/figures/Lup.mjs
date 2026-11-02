// The Wolf, seated and watchful, facing the Scorpion, a heavy ruff on his shoulders. Theta is the
// nose, Eta the jaw, Chi and Psi the tips of the two ears, Phi the nape, Gamma and Delta the chest
// and shoulder, Epsilon and Mu the straight foreleg, Zeta the forepaw, Beta the back, Alpha the haunch.
import { fur, paw } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Wolf',
  pixels: 1100,
  anchors: [['θ Lup', 'nose'], ['η Lup', 'jaw'], ['χ Lup', 'far ear'], ['ψ¹ Lup', 'near ear'], ['φ¹ Lup', 'nape'], ['δ Lup', 'shoulder'], ['γ Lup', 'chest'], ['ε Lup', 'foreleg'], ['μ Lup', 'foreleg'], ['ζ Lup', 'forepaw'], ['β Lup', 'back'], ['α Lup', 'haunch']],
  draw({ s, E }) {
    const { blob, limb, strands } = E;
    const zet = s('ζ Lup'), mu = s('μ Lup'), chi = s('χ Lup'), psi = s('ψ¹ Lup');

    // The brush, lying out along the ground and lifting at the end.
    const brush = [[7.8, -9.8], [10.2, -9.0], [13.0, -9.2], [15.6, -8.4], [17.8, -6.8, 'c'], [17.2, -9.2], [15.4, -11.2], [12.4, -12.2], [9.4, -12.2], [7.8, -11.4]];
    blob(brush, { round: 1.0, tone: 0.8, hatch: 10, shadow: 0, edge: 0.3 });
    fur(E, brush, { n: 1600, angle: 8, flow: (x) => (x - 8) * 4, len: 1.2, seed: 2, jitter: 13, v: 0.56, lit: 0.2, w: 0.026 });
    strands([[8.6, -9.2], [12, -8.8], [15.4, -8.0], [17.4, -6.8]], { n: 480, angle: 20, len: 1.0, jitter: 18, v: 0.5, spread: 0.3, seed: 3, w: 0.026 });
    strands([[8.8, -12.2], [12.4, -12.2], [15.4, -11.2], [17.2, -9.0]], { n: 460, angle: 342, len: 1.1, jitter: 18, v: 0.42, spread: 0.3, seed: 4, w: 0.026 });

    // Far foreleg, standing straight, just ahead of the near one.
    limb([[-1.2, -1.6, 1.8], [-1.0, -5.0, 1.0], [-0.8, -8.0, 0.74], [-0.7, -10.2, 0.64]], { tone: 0.72, hatch: 88, shadow: 0.5 });
    paw(E, [-1.0, -10.8], 1.56, 184, { tone: 0.8 });

    // Body, the long fall of the back from the neck to the haunch.
    const body = [[-1.2, 6.3], [1.8, 6.2], [4.0, 3.8], [6.0, 0.6], [8.2, -2.8], [9.8, -6.2], [10.2, -9.2], [8.4, -11.3], [5.0, -11.4], [3.4, -9.0], [2.4, -6.2], [0.4, -3.6], [-2.0, -1.8], [-3.8, 0.6], [-4.2, 2.8], [-3.0, 4.6]];
    blob(body, {
      round: 2.8, tone: 1.06, hatch: 44, shadow: 0.66, band: 0.6,
      creases: [{ pts: [[3.0, 3.4], [3.4, 0.6], [2.8, -2.6]], w: 0.2, depth: 0.28 }, { pts: [[5.2, 0.4], [5.0, -1.8], [4.6, -3.8]], w: 0.14, depth: 0.18 }],
      bumps: [{ at: [1.8, 0.2], r: [2.8, 3.2], h: 0.6 }],
    });

    // Near haunch: a folded hind leg, Alpha on the great thigh, the long foot flat on the ground.
    limb([[6.8, -5.2, 3.6], [7.0, -7.8, 3.5], [6.4, -9.6, 2.2], [4.6, -10.8, 1.1], [3.2, -11.1, 0.84]], {
      tone: 1.08, hatch: 72, shadow: 0.62, melt: 1.6,
      creases: [{ pts: [[3.4, -6.4], [3.2, -8.8], [4.6, -9.8]], w: 0.2, depth: 0.32 }, { pts: [[4.6, -9.6], [6.6, -9.8], [8.4, -10.2]], w: 0.13, depth: 0.2 }, { pts: [[6.0, -4.0], [4.6, -6.0], [4.4, -8.0]], w: 0.13, depth: 0.16 }],
      bumps: [{ at: [6.8, -6.8], r: [2.8, 3.0], h: 0.7 }],
    });

    // Near foreleg, straight as a post, the elbow high, Epsilon and Mu down it.
    limb([[1.4, -0.6, 2.4], [1.0, -3.2, 1.56], [mu[0] - 0.3, mu[1], 1.02], [2.0, -8.8, 0.78], [2.3, -10.4, 0.7]], {
      tone: 1.08, hatch: 84, shadow: 0.62, melt: 1.2,
      creases: [{ pts: [[2.3, -2.6], [2.4, -4.6], [2.4, -6.6]], w: 0.13, depth: 0.2 }, { pts: [[-0.4, -3.6], [0.4, -6.0], [1.2, -8.2]], w: 0.13, depth: 0.16 }, { pts: [[1.6, -8.7], [2.0, -9.0], [2.5, -8.9]], w: 0.06, depth: 0.1 }],
      bumps: [{ at: [2.1, -8.9], r: [0.7, 0.5], h: 0.16 }],
    });
    paw(E, [zet[0] + 0.1, zet[1] - 0.14], 1.7, 184);

    // The coat: thick and rough, lying down the back, standing along the spine.
    fur(E, body, { n: 3000, angle: 300, len: 0.86, seed: 5, jitter: 16, v: 0.5, w: 0.026 });
    fur(E, [[3.4, -4.6], [6, -2.6], [9.8, -6.2], [10.2, -9.2], [8.4, -10.8], [5, -9.8], [3.8, -7.4]], { n: 1100, angle: 276, len: 0.76, seed: 6, jitter: 16, v: 0.46, lit: 0.1, w: 0.026 });
    strands([[1.8, 6.2], [4.0, 3.8], [6.0, 0.6], [8.2, -2.8], [9.8, -6.2], [10.2, -8.8]], { n: 1100, angle: 300, flow: (x, y) => -x * 3, len: 1.2, jitter: 20, v: 0.46, spread: 0.3, seed: 7, w: 0.026 });
    strands([[-0.2, -4.6], [0.8, -7.0], [1.2, -8.2]], { n: 150, angle: 240, len: 0.76, jitter: 18, v: 0.4, spread: 0.12, seed: 8, w: 0.024 });

    // The ruff: long hairs thrown back and down from the face, the wolf's whole character.
    const ruff = [[-1.4, 7.0], [1.0, 7.2], [3.2, 5.6], [4.4, 2.8], [3.6, -0.4], [1.2, -1.6], [-1.6, -2.8], [-3.4, -1.0], [-4.6, 1.0], [-4.0, 2.8], [-2.4, 4.6]];
    blob(ruff, { round: 1.4, tone: 0.84, hatch: 60, shadow: 0.56, edge: 0, relief: 0.28 });
    const fromFace = (x, y) => (Math.atan2(y - 4.4, x + 5.0) * 180) / Math.PI;
    fur(E, ruff, { n: 3600, angle: 0, flow: fromFace, len: 1.8, jitter: 15, curl: 0.8, seed: 9, v: 0.54, lit: 0.1, w: 0.028 });
    strands([[-1.4, 7.0], [1.0, 7.2], [3.2, 5.6], [4.4, 2.8], [3.6, -0.4]], { n: 760, angle: 0, flow: fromFace, len: 1.9, jitter: 20, v: 0.5, spread: 0.5, seed: 10, curl: 1, w: 0.028 });
    strands([[-4.6, 1.0], [-3.4, -1.0], [-1.6, -2.8], [1.2, -1.8]], { n: 620, angle: 0, flow: fromFace, len: 1.9, jitter: 20, v: 0.48, spread: 0.5, seed: 11, curl: -1, w: 0.028 });

    // Far ear, to Chi.
    blob([[-5.1, 5.8], [-5.1, 7.0], [chi[0] - 0.1, chi[1] + 0.56, 'c'], [-3.7, 7.1], [-3.3, 5.9]], { round: 0.5, tone: 0.92, hatch: 78, shadow: 0.4, band: 0.24, creases: [{ pts: [[-4.4, 6.0], [-4.6, 6.8], [-4.6, 7.6]], w: 0.09, depth: 0.14 }] });

    // Lower jaw, a little dropped, showing the teeth.
    blob([[-3.6, 3.2], [-5.0, 2.6], [-6.4, 2.5], [-7.7, 2.9], [-7.9, 3.25], [-6.8, 3.35], [-5.0, 3.5]], { round: 0.36, tone: 1.1, hatch: 16, shadow: 0.45, band: 0.2 });
    limb([[-7.46, 3.42, 0.14], [-7.42, 3.12, 0.1], [-7.34, 2.88, 0.02]], { tone: 1.36, shadow: 0.2, melt: 0, band: 0.06 });
    limb([[-6.94, 2.9, 0.1], [-6.9, 3.2, 0.07], [-6.86, 3.5, 0.02]], { tone: 1.36, shadow: 0.2, melt: 0, band: 0.06 });

    // Head in profile: a broad flat skull, a slight stop, the long straight muzzle.
    blob([[-1.6, 5.4], [-2.8, 6.4], [-4.2, 6.5], [-5.2, 5.75], [-6.4, 5.05], [-7.5, 4.82], [-8.3, 4.6], [-8.56, 4.2], [-8.3, 3.72], [-7.5, 3.4], [-6.2, 3.3], [-5.0, 3.1], [-3.6, 2.6], [-2.2, 3.0], [-1.3, 4.2]], {
      round: 0.95, tone: 1.26, hatch: 26, shadow: 0.62, spacing: 0.88, band: 0.4,
      creases: [
        // The mouth, running far back and lifted in a snarl over the fang.
        { pts: [[-8.3, 3.82], [-7.4, 3.72], [-6.6, 3.92], [-5.6, 3.84], [-4.8, 3.5]], w: 0.09, depth: 0.2 },
        // Wrinkles of the lifted lip.
        { pts: [[-7.5, 4.4], [-7.3, 4.2], [-7.1, 4.0]], w: 0.05, depth: 0.1 }, { pts: [[-7.0, 4.56], [-6.8, 4.3], [-6.6, 4.1]], w: 0.05, depth: 0.1 },
        // Brow and the long cheek.
        { pts: [[-3.2, 5.66], [-4.1, 5.42], [-5.1, 4.86]], w: 0.15, depth: 0.32 },
        { pts: [[-2.5, 4.9], [-2.7, 4.1], [-2.7, 3.2]], w: 0.09, depth: 0.12 },
        { pts: [[-5.6, 5.0], [-6.6, 4.7], [-7.6, 4.56]], w: 0.05, depth: 0.08 },
      ],
      bumps: [{ at: [-3.2, 4.3], r: [1.1, 1.2], h: 0.26 }, { at: [-6.9, 4.2], r: [1.1, 0.5], angle: 6, h: 0.14 }],
    });
    fur(E, [[-1.7, 5.3], [-2.9, 6.2], [-4.0, 6.2], [-3.6, 4.6], [-4.2, 3.4], [-3.4, 2.8], [-2.2, 3.2], [-1.5, 4.2]], { n: 420, angle: 20, len: 0.4, seed: 12, jitter: 26, v: 0.5, w: 0.022 });
    strands([[-5.2, 3.4], [-4.2, 3.0], [-3.4, 2.6]], { n: 120, angle: 260, len: 0.7, jitter: 22, v: 0.46, spread: 0.14, seed: 13, w: 0.024 });
    // Fang.
    limb([[-7.0, 3.88, 0.12], [-7.05, 3.52, 0.09], [-7.14, 3.16, 0.02]], { tone: 1.4, shadow: 0.25, melt: 0, band: 0.06 });
    limb([[-6.42, 3.82, 0.07], [-6.44, 3.6, 0.05], [-6.46, 3.4, 0.02]], { tone: 1.36, shadow: 0.2, melt: 0, band: 0.06 });
    // Nose leather.
    blob([[-7.9, 4.86], [-8.5, 4.74], [-8.74, 4.34], [-8.5, 4.08], [-8.0, 4.2], [-7.76, 4.54]], { round: 0.16, tone: 0.78, shadow: 0.3, creases: [{ pts: [[-8.5, 4.48], [-8.3, 4.42]], w: 0.05, depth: 0.1 }] });
    // The eye, slanted and pale, the warm note.
    limb([[-3.72, 5.2, 0.07], [-4.2, 4.96, 0.24], [-4.76, 4.66, 0.06]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.05 });
    limb([[-4.18, 4.96, 0.16], [-4.22, 4.96, 0.15]], { tone: 1.5, warm: 0.8, shadow: 0, melt: 0, edge: 0 });
    limb([[-4.22, 4.95, 0.07], [-4.23, 4.95, 0.07]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });

    // Near ear, to Psi, thick at the root and furred inside.
    blob([[-3.2, 5.8], [-3.1, 6.9], [psi[0] + 0.04, psi[1] + 0.66, 'c'], [-1.5, 6.8], [-1.0, 5.6], [-2.0, 5.0]], {
      round: 0.5, tone: 1.14, hatch: 66, shadow: 0.5, band: 0.24,
      creases: [{ pts: [[-2.3, 5.5], [-2.3, 6.3], [-2.25, 7.2]], w: 0.13, depth: 0.22 }],
    });
    strands([[-2.5, 5.5], [-2.4, 6.2]], { n: 70, angle: 86, len: 0.5, jitter: 26, v: 0.46, spread: 0.2, seed: 14, w: 0.022 });
  },
};
