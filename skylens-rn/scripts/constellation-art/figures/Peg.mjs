// The Winged Horse, shown as the forequarters only, as tradition has him, flying upside-down in a
// north-up plan. The Great Square is his body, Enif his nose, the neck arches through Homam and
// Biham, the forelegs reach through Matar and Sadalbari, and the wing rises from his back.
import { coverts, hoof, locks, wing } from '../kit.mjs';

export default {
  pixels: 1500,
  anchors: [['Markab', 'withers'], ['Scheat', 'chest'], ['Algenib', 'flank'], ['Alpheratz', 'navel'], ['Enif', 'muzzle'], ['Biham', 'cheek'], ['Homam', 'neck'], ['Matar', 'knee'], [109410, 'hoof'], ['κ Peg', 'hoof']],
  draw({ s, E }) {
    const { blob, limb, strands } = E;
    const mar = s('Markab'), sch = s('Scheat'), alg = s('Algenib'), alp = s('Alpheratz'), eni = s('Enif'), bih = s('Biham'), hom = s('Homam'), xi = s('ξ Peg'), mat = s('Matar'), pi2 = s(109410), sad = s('Sadalbari'), iot = s('ι Peg'), kap = s('κ Peg');

    // The great wing, rising south from the back.
    wing(E, [[-3.4, -6.6], [-8.6, -9.4], [-14.0, -12.6], [-19.0, -18.0]], [
      [-23.4, -25.4, 1.02], [-19.0, -27.6, 1.06], [-14.6, -28.6, 1.08], [-10.2, -28.4, 1.1], [-6.0, -27.0, 1.1], [-2.6, -25.0, 1.06], [0.0, -22.6, 1.02], [1.6, -19.8, 0.98], [2.4, -17.0, 0.94], [2.4, -14.2, 0.88], [1.8, -11.6, 0.8],
    ], { tone: 1, from: 1, to: 0.02, bend: 0.1 });
    coverts(E, [[-4.0, -7.0], [-8.6, -9.6], [-13.4, -12.8], [-17.6, -17.0]], -60, 5.4, 0.66, { n: 13, turn: -48, grow: 0.5, tone: 1.08 });
    limb([[-3.0, -6.2, 1.4], [-8.6, -9.2, 1.2], [-14.0, -12.6, 0.9], [-19.2, -18.2, 0.42]], { tone: 1.14, hatch: 26, shadow: 0.42 });

    // Far foreleg through Matar to the far hoof.
    limb([[-6.0, 6.4, 2.4], [-1.8, 8.4, 1.5], [mat[0], mat[1], 1.0], [3.6, 11.2, 0.72], [pi2[0] - 0.8, pi2[1] - 0.2, 0.56]], { tone: 0.82, hatch: 116, shadow: 0.5 });
    hoof(E, [pi2[0] - 0.9, pi2[1] - 0.1], 1.2, 8, { tone: 0.92 });

    // Body, the Great Square, fading east into stars.
    blob([[-3.0, 7.6], [-8.0, 9.6], [-14.0, 10.2], [alp[0] - 1.6, alp[1] + 0.8], [-23.4, 8.2], [-24.6, 3.0], [-24.2, -2.0], [alg[0] - 0.4, alg[1] - 2.2], [-15.0, -6.8], [-8.6, -8.0], [-3.2, -7.0], [-1.0, -3.0], [-1.6, 3.0]], {
      round: 4.2, tone: 1.08, hatch: 16, shadow: 0.66, band: 1.2,
      creases: [{ pts: [[-5.0, -7.0], [-7.0, -1.0], [-4.8, 8.6]], w: 0.38, depth: 0.5 }, { pts: [[-11.4, -7.4], [-12.2, 0.0], [-11.2, 10.0]], w: 0.3, depth: 0.28 }, { pts: [[-17.8, -6.0], [-18.4, 1.0], [-17.8, 10.2]], w: 0.26, depth: 0.2 }],
      bumps: [{ at: [-3.8, 1.0], r: [4.6, 6.0], h: 0.9 }, { at: [-14.0, 1.0], r: [8.0, 6.0], h: 0.5 }],
    });
    strands([[-23.6, 8.4], [-25.4, 5.2], [-24.0, 1.0], [-25.0, -3.6], [-22.0, -5.6]], { n: 1300, angle: 182, len: 2.8, jitter: 16, v: 0.46, spread: 0.7, seed: 51 });

    // Near foreleg, through Sadalbari to iota and kappa.
    limb([[-2.6, 4.2, 2.8], [sad[0] - 0.6, sad[1] + 0.2, 1.8], [3.0, 4.2, 1.2], [iot[0] - 0.2, iot[1], 0.92], [11.2, 4.8, 0.72]], {
      tone: 1.06, hatch: 92, shadow: 0.62, creases: [{ pts: [[-2.0, 1.4], [2.0, 2.8], [7.0, 3.6]], w: 0.2, depth: 0.28 }],
      bumps: [{ at: [iot[0] - 0.2, iot[1]], r: [0.9, 0.9], h: 0.24 }, { at: [-0.4, 3.8], r: [2.6, 2.0], h: 0.5 }],
    });
    hoof(E, [kap[0] - 2.0, kap[1] - 0.3], 1.4, 2);

    // Neck, arched through xi, Homam and Biham, deep at the shoulder.
    limb([[mar[0] + 1.6, mar[1] + 2.4, 5.2], [xi[0] - 0.6, xi[1] + 1.4, 4.0], [hom[0] + 0.2, hom[1] - 0.4, 3.0], [bih[0] - 1.8, bih[1] + 0.6, 2.0], [bih[0] + 0.6, bih[1] + 0.4, 1.7]], {
      tone: 1.14, hatch: 54, shadow: 0.62, band: 1.1, melt: 2.2,
      creases: [{ pts: [[xi[0] + 1.4, xi[1] + 3.0], [hom[0] + 1.0, hom[1] + 1.6], [bih[0] - 0.6, bih[1] + 1.6]], w: 0.2, depth: 0.26 }, { pts: [[xi[0] - 3.0, xi[1] + 0.8], [hom[0] - 2.0, hom[1] - 1.0], [bih[0] - 2.4, bih[1] - 0.8]], w: 0.16, depth: 0.16 }],
    });
    // Mane along the crest, blown toward the wing.
    locks(E, [
      [[bih[0] + 0.4, bih[1] - 1.8], [hom[0] + 3.0, hom[1] - 5.0], [hom[0] + 1.2, hom[1] - 7.0]], [[hom[0] + 3.8, hom[1] - 3.6], [hom[0] + 1.0, hom[1] - 5.8], [hom[0] - 1.8, hom[1] - 7.0]], [[hom[0] + 1.4, hom[1] - 3.2], [hom[0] - 1.0, hom[1] - 5.2], [hom[0] - 3.8, hom[1] - 5.8]],
      [[hom[0] - 1.0, hom[1] - 3.0], [hom[0] - 3.4, hom[1] - 4.4], [hom[0] - 6.0, hom[1] - 4.6]], [[hom[0] - 3.2, hom[1] - 2.6], [hom[0] - 5.0, hom[1] - 3.6], [hom[0] - 7.6, hom[1] - 3.2]], [[bih[0] - 0.8, bih[1] - 2.0], [hom[0] + 5.2, hom[1] - 6.4], [hom[0] + 3.6, hom[1] - 8.4]],
    ], { w: 0.2, v: 0.56 });
    strands([[bih[0] - 1.0, bih[1] - 2.2], [hom[0] + 1.6, hom[1] - 3.4], [hom[0] - 3.4, hom[1] - 2.8]], { n: 520, angle: 242, len: 2.4, jitter: 24, v: 0.5, spread: 0.5, seed: 52, curl: -2 });

    // Head, nose on Enif.
    blob([[bih[0] - 0.6, bih[1] - 2.2], [bih[0] + 2.0, bih[1] - 2.2], [bih[0] + 4.2, bih[1] - 0.6], [eni[0] - 0.4, eni[1] - 2.4], [eni[0] + 1.2, eni[1] - 1.2], [eni[0] + 1.3, eni[1] + 0.2], [eni[0] + 0.2, eni[1] + 0.9], [eni[0] - 1.6, eni[1] + 0.3], [bih[0] + 2.6, bih[1] + 2.8], [bih[0] + 0.8, bih[1] + 2.6], [bih[0] - 0.4, bih[1] + 1.0]], {
      round: 1.5, tone: 1.18, hatch: 30, shadow: 0.58, spacing: 0.88,
      creases: [{ pts: [[bih[0] + 1.6, bih[1] - 0.8], [bih[0] + 2.0, bih[1] - 0.6], [bih[0] + 2.4, bih[1] - 0.8]], w: 0.12, depth: 0.26 }, { pts: [[eni[0] - 0.6, eni[1] + 0.2], [eni[0] + 0.4, eni[1] + 0.3], [eni[0] + 1.1, eni[1] - 0.2]], w: 0.09, depth: 0.15 }, { pts: [[eni[0], eni[1] - 0.8], [eni[0] + 0.3, eni[1] - 0.7], [eni[0] + 0.5, eni[1] - 0.9]], w: 0.1, depth: 0.2 }],
      bumps: [{ at: [bih[0] + 0.8, bih[1] + 0.6], r: [1.5, 1.5], h: 0.3 }],
    });
    blob([[bih[0] - 0.2, bih[1] - 2.0], [bih[0] - 0.6, bih[1] - 3.8, 'c'], [bih[0] + 1.0, bih[1] - 2.6], [bih[0] + 1.2, bih[1] - 2.0]], { round: 0.4, tone: 1.1, shadow: 0.34 });
    if (sch[0]) return;
  },
};
