// The Giraffe, the old "camel-leopard", standing tall in the empty sky by the pole and reaching
// east to browse. Alpha sits on the chest, Beta on the knee, the star below it in the near forefoot,
// Gamma on the loin, the two west stars on the thigh and the hock, and the long neck rises through
// the star at its base and the highest star of the line, with the head carried on above them.
import { fur, hoof } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Giraffe',
  pixels: 1100,
  anchors: [['α Cam', 'chest'], ['β Cam', 'knee'], [23040, 'forefoot'], ['γ Cam', 'loin'], [17884, 'thigh'], [16228, 'hock'], [29997, 'base of the neck'], [33694, 'upper neck']],
  draw({ s, E }) {
    const { blob, limb, line, strands } = E;
    const bet = s('β Cam'), fore = s(23040), hock = s(16228), thigh = s(17884);

    // One coat patch, an irregular rounded polygon, each laid by hand on the form.
    const patch = (x, y, r, turn = 0, tone = 0.6) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = ((i / 6) * 360 + turn + 14 * Math.sin(x * 7 + i * 2.1)) * (Math.PI / 180), k = 1.2 * r * (0.92 + 0.2 * Math.sin(y * 5 + i * 1.7));
        pts.push([x + Math.cos(a) * k, y + Math.sin(a) * k * 0.92]);
      }
      blob(pts, { round: r * 0.34, tone, hatch: 60, shadow: 0, band: 0.14, edge: 0.3, spacing: 0.9 });
    };

    // Far legs.
    limb([[3.8, 1.8, 2.3], [4.0, -2.6, 1.14], [5.8, -5.3, 0.78], [5.3, -9.6, 0.5], [5.0, -11.6, 0.46]], { tone: 0.72, hatch: 80, shadow: 0.5, bumps: [{ at: [5.8, -5.3], r: [0.7, 0.7], h: 0.2 }] });
    hoof(E, [5.0, -11.7], 0.92, -96, { tone: 0.86 });
    limb([[-4.4, 0.4, 1.5], [-5.6, -4.8, 0.8], [-5.6, -6.4, 0.66], [-5.6, -10.6, 0.46], [-5.6, -11.6, 0.46]], { tone: 0.72, hatch: 88, shadow: 0.5, bumps: [{ at: [-5.6, -6.2], r: [0.7, 0.7], h: 0.2 }] });
    hoof(E, [-5.6, -11.7], 0.92, -92, { tone: 0.86 });

    // Tail, thin as a rope, with its long dark tuft.
    limb([[8.2, 4.8, 0.32], [9.8, 2.6, 0.2], [10.6, -0.8, 0.14], [10.8, -2.2, 0.12]], { tone: 1, hatch: 60, shadow: 0.4, melt: 0.3, band: 0.1 });
    strands([[10.6, -1.8], [10.9, -2.6]], { n: 210, angle: 262, len: 2.4, jitter: 9, v: 0.6, spread: 0.26, seed: 2, curl: 0.3, w: 0.03 });

    // Near hind leg, the thigh on the west star, the hock sharp on the last.
    limb([[5.8, 3.0, 3.2], [thigh[0] + 0.4, thigh[1] - 0.4, 2.2], [7.5, -2.8, 1.3], [hock[0] - 0.4, hock[1], 0.86], [9.0, -8.2, 0.54], [8.8, -11.6, 0.48]], {
      tone: 1.02, hatch: 76, shadow: 0.6, melt: 1.2,
      creases: [{ pts: [[3.6, 0.2], [5.4, -2.6], [7.6, -4.6]], w: 0.14, depth: 0.22 }, { pts: [[9.6, -1.0], [9.4, -2.6], [9.8, -4.2]], w: 0.12, depth: 0.16 }, { pts: [[8.8, -6.0], [8.8, -8.0], [8.6, -10.0]], w: 0.06, depth: 0.08 }],
      bumps: [{ at: [6.2, 1.2], r: [2.2, 2.6], h: 0.5 }, { at: hock, r: [0.7, 0.8], h: 0.22 }],
    });
    hoof(E, [8.8, -11.7], 1.04, -94);

    // The body, high in the shoulder, the back falling sharply to a small croup.
    const body = [[-4.4, 8.0], [-1.6, 8.2], [1.6, 7.4], [4.8, 6.9], [7.2, 6.2], [8.8, 4.2], [9.0, 1.6], [7.2, -0.2], [3.4, -0.9], [-0.6, -1.1], [-3.4, -0.9], [-5.6, 1.2], [-6.2, 4.2]];
    blob(body, {
      round: 2.6, tone: 1.1, hatch: 16, shadow: 0.68, band: 0.5,
      creases: [{ pts: [[-1.6, 7.6], [-2.2, 3.4], [-1.0, -0.8]], w: 0.2, depth: 0.28 }, { pts: [[3.0, 7.0], [2.4, 3.4], [3.0, -0.6]], w: 0.15, depth: 0.18 }],
      bumps: [{ at: [-1.6, 3.6], r: [3.0, 3.6], h: 0.6 }, { at: [6.0, 3.2], r: [2.4, 2.6], h: 0.5 }],
    });

    // Near foreleg, long and straight, the knee on Beta, the hoof on the last star.
    limb([[-1.6, 0.0, 2.0], [-2.0, -3.2, 1.2], [bet[0] + 0.1, bet[1], 0.86], [-1.9, -9.0, 0.5], [fore[0], fore[1] + 0.8, 0.46]], {
      tone: 1.08, hatch: 88, shadow: 0.62, melt: 1.2,
      creases: [{ pts: [[-0.5, -1.6], [-1.0, -3.6], [-1.2, -5.0]], w: 0.12, depth: 0.18 }, { pts: [[-1.5, -6.8], [-1.5, -8.4], [-1.5, -10.2]], w: 0.06, depth: 0.08 }],
      bumps: [{ at: bet, r: [0.8, 0.86], h: 0.26 }],
    });
    hoof(E, [fore[0], fore[1] + 0.56], 1.04, -92);

    // The neck, tremendous and tapered, rising from the chest to the head.
    limb([[-2.8, 3.8, 3.7], [-5.8, 5.7, 2.84], [-7.2, 9.0, 2.0], [-7.6, 12.8, 1.44], [-7.7, 16.0, 1.14], [-7.5, 17.8, 1.08]], {
      tone: 1.12, hatch: 74, shadow: 0.62, band: 0.5, melt: 2.0,
      creases: [{ pts: [[-5.4, 8.8], [-3.8, 7.6], [-2.4, 7.6]], w: 0.13, depth: 0.16 }],
    });

    // The coat: patches large on the body, small up the neck and down the legs.
    for (const [x, y, r, t] of [
      [-3.2, 6.6, 1.0, 12], [-0.9, 6.5, 1.04, 40], [1.4, 5.8, 1.02, 18], [3.6, 5.4, 0.98, 44], [5.8, 5.0, 0.9, 20], [7.5, 3.8, 0.76, 50],
      [-1.8, 4.4, 1.04, 30], [0.5, 3.8, 1.06, 8], [2.8, 3.4, 1.04, 36], [5.0, 2.9, 1.02, 14], [7.0, 1.9, 0.82, 34],
      [-3.4, 2.6, 0.96, 22], [-1.2, 2.0, 1.0, 44], [1.4, 1.5, 0.98, 16], [3.6, 1.0, 0.94, 40], [5.7, 0.7, 0.86, 20],
      [-2.8, 0.5, 0.74, 34], [-0.6, -0.1, 0.72, 12], [1.4, -0.3, 0.6, 40], [3.2, -0.5, 0.56, 22], [-4.6, 0.7, 0.54, 10],
      [-5.0, 2.9, 0.84, 40], [-4.2, 4.6, 0.86, 18], [-6.4, 3.5, 0.72, 30], [-6.6, 5.4, 0.82, 44], [-5.0, 6.6, 0.78, 14], [-7.8, 4.6, 0.5, 20],
      [-6.3, 7.6, 0.72, 34], [-7.9, 7.0, 0.58, 12], [-7.4, 9.0, 0.66, 44], [-8.5, 8.9, 0.42, 26], [-6.3, 9.6, 0.5, 8], [-7.8, 10.6, 0.6, 22], [-6.6, 11.2, 0.5, 40], [-8.4, 12.0, 0.42, 10], [-7.2, 12.4, 0.56, 20], [-6.6, 13.4, 0.36, 46], [-7.9, 13.6, 0.5, 34], [-7.0, 14.6, 0.44, 12], [-8.2, 15.0, 0.36, 28], [-7.3, 15.9, 0.4, 40],
      [-1.8, -2.0, 0.62, 18], [-2.0, -3.6, 0.46, 40], [6.2, -1.2, 0.78, 16], [7.3, -2.8, 0.5, 40], [4.6, -0.9, 0.42, 30],
    ]) patch(x, y, r, t);

    // The stiff short mane, standing up the back of the neck.
    strands([[-2.4, 7.8], [-4.4, 8.4], [-5.5, 10.0], [-6.1, 12.6], [-6.5, 15.0], [-6.4, 17.8]], { n: 1200, angle: 62, flow: (x, y) => (y - 8) * -3, len: 0.72, jitter: 10, v: 0.62, spread: 0.2, seed: 3, w: 0.028 });

    // Far ossicone, then the near one, each with a warm bald knob.
    limb([[-6.8, 18.6, 0.32], [-6.3, 19.7, 0.22], [-6.1, 20.7, 0.22]], { tone: 0.94, hatch: 76, shadow: 0, melt: 0, band: 0.1 });
    limb([[-6.1, 20.65, 0.3], [-6.05, 20.9, 0.3]], { tone: 1.2, warm: 0.6, shadow: 0.3, melt: 0, band: 0.08 });

    // The far ear, then the head: long and narrow, a soft thick muzzle and a high bony brow.
    blob([[-6.6, 17.9], [-5.4, 18.6], [-3.9, 19.7, 'c'], [-3.7, 18.6], [-5.0, 17.7]], { round: 0.3, tone: 0.9, hatch: 30, shadow: 0.42, band: 0.16 });
    blob([[-6.1, 17.7], [-6.7, 18.8], [-7.8, 19.2], [-9.2, 18.7], [-10.6, 18.2], [-12.2, 17.9], [-13.4, 17.3], [-13.7, 16.6], [-13.0, 16], [-11.8, 15.8], [-10.4, 16.3], [-8.8, 16.1], [-7.2, 16.2]], {
      round: 0.9, tone: 1.24, hatch: 16, shadow: 0.62, spacing: 0.88, band: 0.3,
      creases: [
        { pts: [[-13.5, 16.6], [-12.6, 16.6], [-11.8, 16.9]], w: 0.07, depth: 0.16 },
        { pts: [[-8.2, 18], [-9.0, 18], [-9.7, 17.5]], w: 0.1, depth: 0.2 },
        { pts: [[-12.5, 17.4], [-12.2, 17.2], [-12.1, 17]], w: 0.06, depth: 0.14 },
        { pts: [[-7.9, 17.2], [-8.6, 16.6], [-9.8, 16.4]], w: 0.07, depth: 0.1 },
      ],
      bumps: [{ at: [-12.6, 16.9], r: [1.0, 0.9], h: 0.26 }, { at: [-8.6, 18.2], r: [0.8, 0.5], h: 0.16 }],
    });
    patch(-7.2, 16.9, 0.42, 20, 0.76); patch(-6.8, 17.9, 0.3, 40, 0.76);
    // The eye, big and mild, with its long lashes.
    limb([[-8.72, 17.56, 0.06], [-9.04, 17.48, 0.2], [-9.42, 17.32, 0.05]], { tone: 0.5, shadow: 0.42, melt: 0, rim: 1, band: 0.05 });
    limb([[-9.02, 17.5, 0.11], [-9.04, 17.5, 0.1]], { tone: 1.5, warm: 0.5, shadow: 0, melt: 0, edge: 0 });
    limb([[-9.04, 17.48, 0.05], [-9.05, 17.48, 0.05]], { tone: 0.05, shadow: 0, melt: 0, edge: 0 });
    for (const [x, y, dx, dy] of [[-9.1, 17.66, -0.3, 0.32], [-9.3, 17.56, -0.36, 0.26], [-9.45, 17.4, -0.4, 0.14]]) line([[x, y], [x + dx, y + dy]], { w: 0.018, v: 0.8 });

    // Near ossicone and near ear.
    limb([[-7.8, 18.9, 0.36], [-7.7, 20, 0.25], [-7.55, 21.1, 0.25]], { tone: 1.1, hatch: 80, shadow: 0.42, melt: 0.1, band: 0.1 });
    limb([[-7.55, 21.1, 0.34], [-7.52, 21.32, 0.34]], { tone: 1.3, warm: 0.66, shadow: 0.35, melt: 0, band: 0.08 });
    blob([[-6.9, 18.2], [-5.8, 19.1], [-4.2, 20.5, 'c'], [-4.1, 19.2], [-5.2, 18.2], [-6.2, 17.6]], { round: 0.36, tone: 1.14, hatch: 34, shadow: 0.45, band: 0.16, creases: [{ pts: [[-6.2, 18.2], [-5.2, 18.9], [-4.4, 19.9]], w: 0.09, depth: 0.16 }] });
    fur(E, [[-7, 18.5], [-7.8, 18.9], [-9, 18.5], [-8.6, 17.9], [-7.4, 17.7]], { n: 120, angle: 330, len: 0.26, seed: 4, jitter: 26, v: 0.46, w: 0.018 });
  },
};
