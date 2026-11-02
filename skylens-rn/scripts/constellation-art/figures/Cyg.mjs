// The Swan in flight down the Milky Way: Deneb, "the tail", at the tail, Sadr at the breast,
// Albireo at the beak, the wings spread through Fawaris and Aljanah to Kappa and Zeta.
import { coverts, wing } from '../kit.mjs';

export default {
  pixels: 1500,
  anchors: [['Deneb', 'tail'], ['Sadr', 'breast'], [98110, 'neck'], ['Albireo', 'beak'], ['Fawaris', 'wing'], [95853, 'wing'], [94779, 'wing tip'], ['Aljanah', 'wing'], [104732, 'wing tip']],
  draw({ s, E }) {
    const { blob, limb } = E;
    const den = s('Deneb'), sad = s('Sadr'), eta = s(98110), alb = s('Albireo'), faw = s('Fawaris'), io2 = s(95853), kap = s(94779), alj = s('Aljanah'), zet = s(104732);

    // The tail fan past Deneb.
    wing(E, [[den[0] + 0.6, den[1] - 1.6], [den[0], den[1]]], [[-6.2, 11.6, 0.8], [-8.6, 10.8, 0.8], [-10.8, 9.2, 0.8], [-3.8, 11.0, 0.8], [-1.8, 9.4, 0.76], [-12.0, 7.4, 0.76]], { tone: 0.92 });

    // Far wing, reaching through Fawaris to Kappa, primaries sweeping north.
    wing(E, [[0.4, 1.6], [faw[0], faw[1]], [io2[0] - 0.4, io2[1] - 0.4], [kap[0] - 0.5, kap[1] - 0.6]], [
      [kap[0], kap[1], 0.74], [11.2, 15.0, 0.74], [13.2, 13.8, 0.76], [14.6, 11.6, 0.76], [15.4, 9.2, 0.76], [15.4, 6.8, 0.76], [14.8, 4.6, 0.76], [13.6, 2.8, 0.74], [12.0, 1.4, 0.72], [10.2, 0.6, 0.7], [8.2, 0.2, 0.68], [6.2, 0.2, 0.64],
    ], { tone: 0.96, from: 1, to: 0.04 });
    coverts(E, [[1.4, 2.4], [4.2, 5.2], [6.4, 9.4], [7.6, 12.6]], -20, 3.6, 0.46, { n: 14, turn: 62, grow: 0.5, tone: 1.02 });
    limb([[-0.4, 1.0, 1.1], [faw[0] - 0.4, faw[1] + 0.2, 0.86], [io2[0] - 0.2, io2[1] - 0.2, 0.58], [kap[0] - 0.4, kap[1] - 0.6, 0.3]], { tone: 1.1, hatch: 76, shadow: 0.42 });

    // Near wing, through Aljanah to Zeta.
    wing(E, [[-3.0, -2.4], [alj[0] + 0.2, alj[1] + 0.2], [zet[0] + 0.4, zet[1] + 0.4]], [
      [zet[0], zet[1], 0.74], [-14.0, -11.8, 0.76], [-13.4, -14.0, 0.78], [-12.0, -16.0, 0.78], [-10.0, -17.2, 0.78], [-7.8, -17.6, 0.76], [-5.8, -17.0, 0.76], [-4.0, -15.6, 0.74], [-2.8, -13.6, 0.72], [-2.2, -11.2, 0.7], [-2.2, -8.8, 0.66], [-2.4, -6.4, 0.6],
    ], { tone: 1.02, from: 1, to: 0.04 });
    coverts(E, [[-3.0, -3.0], [-5.6, -5.0], [-8.8, -7.0], [-11.6, -8.2]], -80, 3.5, 0.46, { n: 13, turn: -44, grow: 0.5, tone: 1.08 });
    limb([[-2.0, -1.6, 1.16], [alj[0] + 0.3, alj[1] + 0.3, 0.86], [-11.0, -8.0, 0.56], [zet[0] + 0.6, zet[1] + 0.4, 0.28]], { tone: 1.14, hatch: 12, shadow: 0.42 });

    // Body, tail to breast.
    blob([[den[0] - 0.8, den[1] + 1.6], [den[0] + 1.2, den[1] + 1.2], [-1.2, 2.8], [1.0, 0.4], [2.2, -2.6], [2.4, -4.8], [0.8, -5.0], [-1.6, -3.8], [-3.8, -1.8], [-5.8, 1.6]], {
      round: 2.2, tone: 1.12, hatch: 50, shadow: 0.64,
      creases: [{ pts: [[-3.8, 3.6], [-1.6, 0.6], [0.4, -2.4]], w: 0.14, depth: 0.14 }],
      bumps: [{ at: [sad[0] + 1.0, sad[1] - 1.2], r: [2.0, 2.4], h: 0.5 }],
    });

    // The long neck, stretched to the beak on Albireo.
    limb([[1.2, -3.4, 1.34], [eta[0], eta[1], 0.86], [4.4, -8.4, 0.6], [6.2, -10.6, 0.5], [7.2, -11.4, 0.46]], { tone: 1.14, hatch: 112, shadow: 0.58 });
    blob([[6.2, -10.4], [7.2, -10.2], [7.9, -11.0], [8.1, -11.5], [9.5, -12.9, 'c'], [7.9, -12.3], [7.0, -12.4], [6.2, -11.6]], { round: 0.5, tone: 1.2, hatch: 34, shadow: 0.5, creases: [{ pts: [[7.6, -11.6], [7.3, -11.3], [7.0, -11.5]], w: 0.05, depth: 0.14 }] });
    limb([[8.0, -11.7, 0.26], [8.9, -12.4, 0.14], [alb[0] + 0.5, alb[1] - 0.6, 0.03]], { tone: 1.2, warm: 0.8, shadow: 0.2, flat: 0.6 });
  },
};
