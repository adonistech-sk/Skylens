// The Great Bear, walking west, the Plough on its back and rump. The long tail is the Plough's
// handle, as the classical figure has it. Nose near Muscida, paws at Talitha, Tania and Alula.
import { fur, paw } from '../kit.mjs';

export default {
  pixels: 1500,
  anchors: [['Dubhe', 'shoulder'], ['Merak', 'flank'], ['Phecda', 'haunch'], ['Megrez', 'root of the tail'], ['Alioth', 'tail'], ['Mizar', 'tail'], ['Alkaid', 'tip of the tail'], ['Muscida', 'muzzle'], ['Talitha', 'forepaw'], ['Tania Australis', 'hind paw'], ['Alula Australis', 'hind paw']],
  draw({ s, E }) {
    const { blob, limb, strands } = E;
    const alk = s('Alkaid'), miz = s('Mizar'), ali = s('Alioth'), meg = s('Megrez');

    // Far hind leg, stepping forward to Tania.
    limb([[-5.0, 1.0, 3.6], [-3.4, -4.0, 2.7], [-1.4, -8.0, 1.75], [3.0, -9.6, 1.4], [5.8, -10.0, 1.2]], { tone: 0.72, shadow: 0.5, hatch: 70, creases: [{ pts: [[-1.8, -5.0], [-0.6, -8.4], [2.8, -8.6]], w: 0.3, depth: 0.3 }] });
    paw(E, [5.2, -10.0], 2.4, -6, { tone: 0.78 });
    // Far foreleg.
    limb([[5.0, 3.2, 3.2], [7.0, -1.0, 2.3], [7.8, -4.6, 1.7], [8.2, -6.6, 1.4]], { tone: 0.72, shadow: 0.5, hatch: 96 });
    paw(E, [7.9, -6.6], 2.3, -10, { tone: 0.78 });

    // Tail, the Plough's handle, thick with fur at the root.
    limb([[-9.6, 6.0, 2.0], [meg[0] - 1.0, meg[1] + 0.2, 1.66], [ali[0], ali[1], 1.26], [miz[0], miz[1], 0.98], [-24.2, 6.8, 0.74], [alk[0], alk[1], 0.46]], { tone: 0.98, hatch: 82, shadow: 0.5 });

    // Near hind leg, to Alula.
    limb([[-9.8, 2.2, 5.2], [-9.0, -3.6, 3.9], [-7.2, -9.2, 2.5], [-5.9, -14.2, 1.95], [-5.4, -18.4, 1.55]], {
      tone: 1, hatch: 64, creases: [{ pts: [[-13.0, -0.4], [-11.2, -5.8], [-8.6, -10.4]], w: 0.34, depth: 0.5 }, { pts: [[-6.2, -3.0], [-5.8, -7.4], [-5.2, -10.8]], w: 0.3, depth: 0.42 }],
      bumps: [{ at: [-10.0, -1.0], r: [3.6, 4.4], h: 0.9 }, { at: [-6.6, -12.0], r: [1.2, 2.6], angle: 10, h: 0.4 }],
    });
    paw(E, [-5.8, -19.0], 2.6, -68);

    // Body, Dubhe on the shoulder, Merak on the flank. A high shoulder hump, a falling back.
    const body = [[-13.8, 1.4], [-13.6, 5.4], [-11.0, 8.6], [-6.4, 9.8], [-2.4, 11.8], [1.4, 13.4], [5.0, 13.0], [9.0, 13.8], [11.8, 11.0], [11.4, 6.4], [10.0, 2.4], [6.6, -0.6], [1.6, -1.4], [-3.6, -1.4], [-8.6, -2.4], [-12.2, -1.4]];
    blob(body, {
      round: 3.4, tone: 1.1, hatch: 18, shadow: 0.7, band: 1.1,
      creases: [{ pts: [[8.2, 12.8], [5.2, 7.6], [5.2, 0.4]], w: 0.26, depth: 0.42 }, { pts: [[-8.6, 7.8], [-7.2, 3.2], [-8.4, -1.6]], w: 0.26, depth: 0.32 }, { pts: [[0.6, 12.2], [-1.0, 6.0], [0.8, -0.2]], w: 0.2, depth: 0.2 }],
      bumps: [{ at: [2.0, 10.0], r: [5.0, 3.0], angle: 8, h: 0.8 }, { at: [-9.0, 4.4], r: [4.0, 4.4], h: 0.6 }, { at: [6.8, 6.4], r: [3.0, 4.4], h: 0.5 }],
    });

    // Near foreleg, reaching to Talitha.
    limb([[7.8, 4.8, 4.2], [11.4, 2.8, 3.0], [14.8, 0.6, 2.0], [17.6, -1.0, 1.5]], {
      tone: 1.02, hatch: 112, shadow: 0.6, creases: [{ pts: [[8.0, 1.0], [12.0, -0.2], [15.4, -0.8]], w: 0.3, depth: 0.4 }],
      bumps: [{ at: [10.0, 4.0], r: [3.2, 2.4], angle: -26, h: 0.6 }],
    });
    paw(E, s('Talitha', -1.6, -0.6), 2.5, -14);

    // Head: broad skull, short heavy muzzle, the nose past Muscida.
    blob([[8.6, 13.6], [10.8, 16.0], [13.4, 16.6], [15.6, 15.6], [16.6, 14.2], [18.4, 14.0], [19.6, 13.2], [19.8, 12.2], [19.0, 11.4], [17.4, 10.8], [15.8, 10.2], [14.2, 8.8], [11.4, 7.8], [9.0, 8.8], [8.2, 11.0]], {
      round: 1.9, tone: 1.2, hatch: 30, shadow: 0.62, spacing: 0.9, band: 0.6,
      creases: [{ pts: [[16.8, 13.2], [18.0, 12.7], [19.4, 12.4]], w: 0.09, depth: 0.14 }, { pts: [[16.9, 11.6], [18.2, 11.6], [19.4, 11.9]], w: 0.09, depth: 0.18 }, { pts: [[14.6, 14.2], [15.1, 14.0], [15.6, 14.2]], w: 0.13, depth: 0.32 }, { pts: [[13.0, 15.0], [13.8, 15.2], [14.6, 15.0]], w: 0.11, depth: 0.16 }],
      bumps: [{ at: [18.0, 12.6], r: [1.5, 1.1], h: 0.28 }, { at: [13.2, 12.0], r: [2.2, 2.4], h: 0.3 }],
    });
    limb([[19.4, 12.9, 0.26], [19.75, 12.6, 0.22]], { tone: 1.3, shadow: 0.2, melt: 0 });
    // Ears, small and round.
    blob([[10.6, 15.6], [10.2, 17.0], [11.2, 17.8], [12.4, 17.4], [12.8, 16.2]], { round: 0.6, tone: 1.08, shadow: 0.42, creases: [{ pts: [[11.0, 16.2], [11.3, 16.9], [11.9, 16.6]], w: 0.14, depth: 0.25 }] });

    // Fur over the whole animal, lying back from the head.
    fur(E, body, { n: 5200, angle: 188, len: 1.05, seed: 2, jitter: 15, flow: (x, y) => (y - 5) * 0.8, v: 0.56 });
    fur(E, [[8.6, 13.6], [12, 16.4], [15.6, 15.4], [15, 10.4], [12, 8], [8.6, 9]], { n: 1100, angle: 186, len: 0.62, seed: 5, v: 0.5 });
    fur(E, [[-13.6, 2], [-8.6, 2], [-6.6, -8], [-4.4, -17.6], [-6.8, -17.8], [-8.8, -9.4]], { n: 1500, angle: 262, len: 0.8, seed: 6, v: 0.5 });
    fur(E, [[7, 7], [12, 5.4], [17.6, 0.4], [17, -1.6], [11, -0.6], [6.4, 1.6]], { n: 900, angle: 200, len: 0.72, seed: 7, v: 0.5 });
    fur(E, [[-9.8, 7.8], [-16.4, 8.2], [-21, 8.8], [-21, 7], [-16.4, 5.4], [-9.8, 4.6]], { n: 800, angle: 186, len: 0.72, seed: 9, v: 0.46 });
    strands([[-13, 7.2], [-6, 10.0], [1.4, 13.4], [8.6, 13.9]], { n: 620, angle: 182, len: 1.3, jitter: 22, v: 0.46, spread: 0.5, seed: 12 });
    strands([[-12, -1.6], [-3, -1.6], [3, -1.2], [9, 1.6]], { n: 640, angle: 256, len: 1.4, jitter: 20, v: 0.42, spread: 0.4, seed: 14, lit: 0.1 });
  },
};
