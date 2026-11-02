// The Sea-Goat, a goat in front and a fish behind, swimming west with its forelegs folded. Dabih
// and Alpha sit on the head and horn, theta and iota along the back, Deneb Algedi at the root of
// the tail fin, and the belly line runs down through psi and omega to zeta. Scales take over
// from the goat's coat at the waist. The warm note is the horns.
import { fur, hoof, feather } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Sea-Goat',
  pixels: 1100,
  anchors: [['α¹ Cap', 'horn'], ['Dabih', 'brow'], ['ρ Cap', 'throat'], ['ψ Cap', 'knee'], ['ω Cap', 'hoof'], ['ζ Cap', 'belly'], ['Deneb Algedi', 'root of the tail'], ['Nashira', 'tail'], ['ι Cap', 'back'], ['θ Cap', 'back']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α¹ Cap'), dab = s('Dabih'), rho = s('ρ Cap'), psi = s('ψ Cap'), ome = s('ω Cap'), zet = s('ζ Cap'), den = s('Deneb Algedi');

    // Tail flukes, the fish's end, swept up behind Deneb Algedi. Rays are feathers.
    for (const [tip, w] of [[[-20.4, 8.6], 0.86], [[-20.0, 6.4], 0.9], [[-19.0, 4.6], 0.9], [[-17.6, 3.2], 0.8]]) feather(E, [den[0] - 1.2, den[1] + 0.4], tip, w, { tone: 0.98, bend: 0.1 });
    for (const [tip, w] of [[[-15.8, -3.8], 0.8], [[-17.2, -2.4], 0.9], [[-18.8, -1.4], 0.9], [[-20.0, -1.0], 0.8]]) feather(E, [den[0] - 1.2, den[1] - 0.4], tip, w, { tone: 0.9, bend: -0.1 });

    // Far foreleg, thrown forward in the stroke.
    limb([[6.6, -1.8, 1.4], [8.8, -3.6, 0.92], [10.2, -5.0, 0.54], [9.0, -6.6, 0.4], [9.8, -8.0, 0.32]], { tone: 0.86, hatch: 130, shadow: 0.4, creases: [{ pts: [[7.8, -2.6], [9.0, -3.8], [9.8, -4.6]], w: 0.09, depth: 0.12 }], bumps: [{ at: [10.2, -5.0], r: [0.56, 0.56], h: 0.2 }] });
    hoof(E, [9.85, -8.1], 0.74, -70, { tone: 0.98, warm: 0.14 });

    // Far horn, behind the head.
    limb([[9.0, 6.8, 0.46], [8.2, 8.4, 0.42], [6.8, 10.0, 0.26], [5.0, 10.6, 0.05]], { tone: 0.84, warm: 0.3, hatch: 40, shadow: 0.3, melt: 0 });

    // The long body: a goat's chest and barrel narrowing to a fish's waist, curling at the tail.
    const outline = [[8.4, 5.2], [6.0, 3.8], [3.2, 3.6], [-1.0, 3.2], [-5.2, 3.3], [-8.8, 3.3], [-12.0, 2.4], [-14.8, 1.2], [-13.2, -0.6], [-10.6, -1.6], [-7.8, -3.0], [zet[0] - 0.4, zet[1] - 1.8], [-3.6, -6.2], [0.0, -6.6], [3.4, -5.4], [6.0, -3.0], [8.4, -1.2], [9.6, 1.6]];
    blob(outline, {
      round: 2.8, tone: 1.2, hatch: 14, shadow: 0, band: 0.9,
      creases: [
        { pts: [[3.0, 3.2], [2.4, 0.0], [3.6, -4.8]], w: 0.22, depth: 0.32 }, { pts: [[-1.4, 2.8], [-1.8, -1.6], [-0.8, -6.0]], w: 0.18, depth: 0.24 },
        { pts: [[8.6, 3.4], [6.4, 0.6], [6.0, -2.4]], w: 0.18, depth: 0.24 }, { pts: [[-4.6, -5.2], [-1.0, -3.4], [3.4, -3.8]], w: 0.14, depth: 0.2 },
        { pts: [[0.8, 3.0], [0.2, 0.6], [0.8, -1.8]], w: 0.12, depth: 0.16 }, { pts: [[-3.4, 2.9], [-3.8, 0.8], [-3.2, -1.6]], w: 0.12, depth: 0.14 }, { pts: [[6.2, 3.2], [4.8, 1.4], [4.6, -1.4]], w: 0.13, depth: 0.18 },
      ],
      bumps: [{ at: [4.8, 0.0], r: [2.8, 3.0], h: 0.7 }, { at: [-1.8, 0.0], r: [3.2, 3.0], h: 0.5 }],
    });
    // Coat over the forequarters, combed back.
    fur(E, [[8.4, 5.2], [6.0, 3.8], [3.2, 3.6], [-1.0, 3.2], [-3.4, 3.2], [-4.8, -0.4], [-3.8, -5.8], [0.0, -6.6], [3.4, -5.4], [6.0, -3.0], [8.4, -1.2], [9.6, 1.6]], { n: 3000, angle: 186, len: 0.92, jitter: 14, v: 0.82, lit: 0.34, seed: 5, w: 0.03, flow: (x, y) => (y - 1) * 2.6 });

    // Scales on the fish half, row by row, tail end first so each laps the one behind.
    const rows = 15;
    for (let i = 0; i < rows; i++) {
      const t = i / (rows - 1), x = -14.0 + t * 11.4;
      const top = 2.0 + 1.3 * Math.sin(t * 1.5), low = -0.4 - 4.6 * t * t * (1.2 - 0.4 * t), n = Math.round(2 + t * 5), r = 0.56 + 0.32 * t;
      for (let k = 0; k <= n; k++) {
        const y = low + (top - low) * ((k + (i % 2) * 0.5) / (n + 0.5));
        line([[x - r * 0.2, y + r * 0.9], [x + r * 0.7, y + r * 0.4], [x + r * 0.84, y - r * 0.1], [x + r * 0.3, y - r * 0.8], [x - r * 0.3, y - r * 0.9]], { w: 0.06, v: 0.74 });
        line([[x + r * 0.2, y + r * 0.4], [x + r * 0.42, y - r * 0.1], [x + r * 0.1, y - r * 0.5]], { w: 0.03, v: 0.44 });
      }
    }
    // Back fin along the waist, the mark of the fish.
    const fin = [[-3.6, 3.1], [-5.0, 5.4], [-7.8, 6.0, 'c'], [-7.8, 4.2], [-8.8, 3.1]];
    blob(fin, { round: 0.4, tone: 1.02, hatch: 84, shadow: 0.44, band: 0.3, creases: [{ pts: [[-4.6, 3.3], [-5.4, 4.4], [-6.4, 5.4]], w: 0.07, depth: 0.1 }, { pts: [[-5.8, 3.3], [-6.2, 4.2], [-7.0, 5.2]], w: 0.07, depth: 0.1 }, { pts: [[-7.0, 3.3], [-7.2, 4.0], [-7.6, 4.8]], w: 0.07, depth: 0.1 }] });

    // Tail root, narrowing through Nashira and Deneb Algedi.
    limb([[-11.8, 1.4, 1.5], [-14.0, 1.0, 1.1], [den[0] - 1.8, den[1] - 0.4, 0.74], [-15.8, 1.0, 0.6]], { tone: 1.08, hatch: 80, shadow: 0.4, band: 0.3, melt: 1.2 });

    // Near foreleg, knee on psi, hoof on omega.
    limb([[4.6, -2.4, 1.7], [3.4, -5.0, 1.04], [psi[0] + 0.1, psi[1] - 0.6, 0.62], [ome[0] + 0.8, ome[1] + 0.2, 0.42], [ome[0] + 0.1, ome[1] - 0.1, 0.34]], {
      tone: 1.1, hatch: 110, shadow: 0.6,
      creases: [{ pts: [[5.0, -4.2], [4.2, -5.8], [3.8, -6.8]], w: 0.1, depth: 0.14 }, { pts: [[2.0, -3.8], [2.2, -5.2], [2.8, -6.4]], w: 0.1, depth: 0.12 }],
      bumps: [{ at: [psi[0] + 0.1, psi[1] - 0.6], r: [0.68, 0.68], h: 0.24 }],
    });
    hoof(E, [ome[0] - 0.1, ome[1] - 0.15], 0.82, -130);

    // Neck, arched, with a short ridge of mane.
    limb([[6.4, 0.6, 3.1], [7.6, 3.2, 2.5], [9.0, 5.0, 1.9]], { tone: 1.16, hatch: 62, shadow: 0.5, creases: [{ pts: [[10.0, 2.0], [10.2, 3.6], [10.4, 4.4]], w: 0.12, depth: 0.18 }, { pts: [[6.8, 4.4], [7.4, 2.0], [7.0, -0.4]], w: 0.12, depth: 0.16 }] });
    fur(E, [[5.6, 4.4], [7.6, 6.0], [10.0, 5.0], [10.6, 2.2], [9.2, 0.0], [6.4, -1.0], [4.4, 1.0]], { n: 800, angle: 232, len: 1.0, jitter: 16, v: 0.66, lit: 0.14, seed: 7, w: 0.03 });

    // Head, long and narrow, looking west. Dabih on the brow, the muzzle out past rho's line.
    blob([[7.8, 6.8], [9.4, 7.0], [10.8, 5.8], [12.4, 4.4], [14.0, 2.8], [14.9, 1.8], [14.8, 0.8], [13.8, 0.5], [12.2, 1.0], [10.6, 1.6], [9.4, 2.8], [8.2, 4.6]], {
      round: 0.9, tone: 1.5, hatch: 42, shadow: 0.6, band: 0.5, spacing: 0.86,
      creases: [
        { pts: [[dab[0] - 0.7, dab[1] + 0.3], [dab[0] + 0.1, dab[1] + 0.56], [dab[0] + 0.86, dab[1] + 0.1]], w: 0.11, depth: 0.26 },
        { pts: [[14.7, 1.2], [13.4, 1.5], [12.2, 1.9]], w: 0.07, depth: 0.14 }, { pts: [[14.4, 2.1], [14.0, 1.9], [13.9, 2.3]], w: 0.07, depth: 0.14 },
        { pts: [[10.8, 3.6], [11.6, 2.8], [12.6, 2.6]], w: 0.08, depth: 0.1 },
      ],
      bumps: [{ at: [dab[0] + 0.1, dab[1]], r: [0.5, 0.42], h: 0.16 }, { at: [14.2, 1.4], r: [0.6, 0.6], h: 0.16 }, { at: [10.4, 2.8], r: [0.9, 0.8], h: 0.2 }],
    });
    line([[dab[0] - 0.36, dab[1] + 0.04], [dab[0] + 0.14, dab[1] + 0.14], [dab[0] + 0.56, dab[1] - 0.06]], { w: 0.06, v: 1 });
    // Beard, the goat's sign.
    E.strands([[12.0, 1.0], [12.8, 0.7], [13.4, 0.5]], { n: 120, angle: 262, len: 2.0, jitter: 7, v: 0.74, spread: 0.12, seed: 9, w: 0.035, curl: -1.2 });
    // Ear.
    blob([[8.2, 5.6], [7.2, 5.2], [5.6, 4.4, 'c'], [6.4, 5.6], [7.8, 6.4]], { round: 0.3, tone: 1.2, hatch: 20, shadow: 0.4, creases: [{ pts: [[7.8, 5.8], [6.8, 5.3], [6.0, 4.8]], w: 0.07, depth: 0.1 }] });

    // Near horn, swept back through Alpha.
    limb([[9.8, 6.8, 0.56], [alp[0] + 0.2, alp[1] + 0.2, 0.5], [9.2, 8.2, 0.42], [8.8, 9.6, 0.3], [7.6, 11.0, 0.05]], { tone: 1.2, warm: 0.46, hatch: 46, shadow: 0.42, melt: 0 });
  },
};
