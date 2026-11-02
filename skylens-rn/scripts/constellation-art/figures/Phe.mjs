// The Phoenix rising, wings thrown up and open, head turned east over its shoulder. Beta is at the
// breast, Ankaa and Gamma at the wrists, Epsilon and Delta on the trailing feathers, and the tail
// streams down to Wurren in the flames. The warm note is the fire's small tongues and the beak.
import { feather } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Phoenix',
  pixels: 1000,
  anchors: [['β Phe', 'breast'], ['Ankaa', 'wing'], ['γ Phe', 'wing'], ['ε Phe', 'wing feather'], ['δ Phe', 'wing feather'], ['Wurren', 'tail in the fire']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β Phe'), ank = s('Ankaa'), gam = s('γ Phe'), eps = s('ε Phe'), del = s('δ Phe'), wur = s('Wurren');

    const flame = (x, y, h, lean, tone, warm) => blob([[x - h * 0.22, y], [x - h * 0.27, y + h * 0.22], [x - h * 0.12 + lean * 0.3, y + h * 0.5], [x - h * 0.05 + lean * 0.72, y + h * 0.74], [x + lean, y + h, 'c'], [x + h * 0.05 + lean * 0.42, y + h * 0.66], [x + h * 0.15 + lean * 0.05, y + h * 0.46], [x + h * 0.27 + lean * 0.06, y + h * 0.2], [x + h * 0.18, y]], {
      round: h * 0.11, tone, warm, hatch: 84 + lean * 7, shadow: 0.18,
      creases: [{ pts: [[x, y + h * 0.08], [x + lean * 0.15, y + h * 0.38], [x + lean * 0.7, y + h * 0.76]], w: 0.06, depth: 0.08 }],
    });

    // The fire, at the back.
    for (const [x, h, lean, t] of [[-7.8, 4.6, -1.6, 0.92], [-5.2, 6.6, 1.3, 0.98], [2.2, 7.0, -1.4, 0.98], [5.0, 4.8, 1.8, 0.92], [-3.0, 8.0, -1.5, 1.0], [0.0, 8.2, 1.5, 1.0]]) flame(x - 0.8, -14.0 + Math.abs(x + 1.6) * 0.14, h, lean, t, 0.34);

    // Tail: long streaming plumes, each one a slow S ending in a lobe.
    const plumes = [
      [[-1.8, -2.2, 0.3], [-3.4, -5.2, 0.42], [-5.4, -7.2, 0.52], [-6.4, -9.8, 0.4], [-5.2, -11.4, 0.1]],
      [[-1.6, -2.2, 0.3], [-2.4, -5.6, 0.44], [-3.6, -8.2, 0.54], [-3.8, -10.8, 0.4], [-2.6, -12.2, 0.1]],
      [[-1.0, -2.2, 0.3], [0.8, -5.2, 0.42], [2.8, -7.2, 0.52], [3.6, -9.8, 0.4], [2.4, -11.4, 0.1]],
      [[-1.2, -2.2, 0.3], [-0.4, -5.6, 0.44], [0.6, -8.2, 0.54], [0.8, -10.6, 0.4], [-0.4, -12.2, 0.1]],
    ];
    plumes.forEach((pts, i) => limb(pts, { flat: 0.42, tone: 1.02 + i * 0.02, hatch: 70 + i * 8, shadow: 0.4, melt: 0, creases: [{ pts: pts.map((p) => [p[0], p[1]]), w: 0.06, depth: 0.07 }] }));
    limb([[-1.4, -2.2, 0.42], [-1.7, -5.0, 0.56], [wur[0] - 0.1, wur[1], 0.62], [-1.5, -10.4, 0.46], [-1.1, -12.6, 0.1]], { flat: 0.42, tone: 1.16, hatch: 84, shadow: 0.44, melt: 0, creases: [{ pts: [[-1.4, -2.6], [-1.6, -5], [-1.6, -8], [-1.4, -10.6]], w: 0.07, depth: 0.08 }] });

    // Small tongues of fire in front of the tail.
    for (const [x, y, h, lean] of [[-6.2, -14.0, 3.0, -0.9], [-3.8, -14.3, 4.0, 0.9], [-1.4, -14.5, 4.8, -0.9], [0.8, -14.3, 3.8, 0.9], [3.2, -14.0, 3.0, 1.0]]) flame(x, y, h, lean, 1.2, 0.72);
    // The nest of crossed spice boughs.
    for (const [a, b, c] of [[[-10.0, -13.6, 0.26], [-3.0, -14.7, 0.34], [3.6, -15.8, 0.2]], [[7.2, -13.6, 0.26], [0.2, -14.7, 0.34], [-6.4, -15.8, 0.2]], [[-8.4, -14.9, 0.24], [-1.4, -15.2, 0.32], [5.8, -14.9, 0.24]]]) {
      limb([a, b, c], { tone: 0.98, hatch: 8, shadow: 0.3, melt: 0, creases: [{ pts: [[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]], w: 0.05, depth: 0.08 }] });
    }

    const fan = (root, tips, width, tone, turn) => tips.forEach((t, i) => feather(E, [root[0] + (i * turn[0]) / tips.length, root[1] + (i * turn[1]) / tips.length], t, width, { tone, bend: 0.08 * Math.sign(root[0] + 1.4 + 0.01) * -1 }));

    // East wing (right on the plan): primaries up, then secondaries falling through Epsilon.
    fan([ank[0] + 1.6, ank[1] + 1.4], [[16.0, 15.0], [17.6, 13.0], [18.6, 10.6], [18.8, 8.0], [18.2, 5.6], [17.0, 3.4], [15.0, 1.6], [12.8, 0.4], [eps[0] + 0.6, eps[1] - 0.8]], 0.8, 1.0, [-5.0, -3.2]);
    for (const [x, y, tx, ty] of [[2.4, 2.0, 2.2, -5.2], [3.2, 2.4, 4.0, -4.8], [4.2, 2.8, 5.8, -3.8], [5.2, 3.2, 7.6, -2.6]]) feather(E, [x, y], [tx, ty], 0.82, { tone: 1.0, bend: -0.07 });
    // West wing, the same gesture, through Gamma to Delta.
    fan([gam[0] - 1.6, gam[1] + 1.6], [[-15.6, 15.6], [-17.4, 13.8], [-18.6, 11.4], [-19.0, 8.8], [-18.6, 6.2], [-17.4, 4.0], [-15.4, 2.2], [-13.0, 0.6], [-10.6, -0.8]], 0.8, 1.04, [5.0, -3.4]);
    for (const [x, y, tx, ty] of [[-3.8, 2.0, -3.6, -4.6], [-4.8, 2.2, del[0], del[1] - 0.8], [-5.8, 2.6, -7.4, -3.4], [-6.8, 3.0, -9.2, -2.4]]) feather(E, [x, y], [tx, ty], 0.82, { tone: 1.02, bend: 0.07 });

    // The coverts, tiled along each arm.
    const row = (a, b, c, n, len, ang0, ang1, w, tone) => {
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), x = (1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * b[0] + t * t * c[0], y = (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * b[1] + t * t * c[1];
        const q = ((ang0 + (ang1 - ang0) * t) * Math.PI) / 180;
        feather(E, [x, y], [x + Math.cos(q) * len, y + Math.sin(q) * len], w, { tone, bend: 0.08 });
      }
    };
    row([1.0, 3.4], [ank[0] - 1.0, ank[1] + 0.8], [12.4, 9.4], 11, 3.0, -100, 8, 0.56, 1.12);
    row([-3.4, 3.4], [gam[0] + 0.2, gam[1] + 1.4], [-12.6, 9.8], 11, 3.0, -80, -172, 0.56, 1.14);
    // The wing arms.
    limb([[0.4, 3.0, 1.08], [ank[0] - 0.4, ank[1] + 0.4, 0.72], [ank[0] + 3.4, ank[1] + 3.0, 0.46], [13.2, 10.4, 0.2]], { tone: 1.2, hatch: 40, shadow: 0.42 });
    limb([[-3.2, 3.0, 1.08], [gam[0] + 0.4, gam[1] + 0.4, 0.72], [gam[0] - 3.4, gam[1] + 3.2, 0.46], [-13.2, 10.8, 0.2]], { tone: 1.2, hatch: 140, shadow: 0.42 });

    // Body.
    blob([[-1.4, 6.6], [0.3, 5.0], [1.4, 2.6], [1.0, 0.0], [-0.2, -2.2], [-1.4, -3.4, 'c'], [-2.8, -2.2], [-3.8, 0.0], [-4.2, 2.6], [-3.0, 5.0]], {
      round: 1.8, tone: 1.14, hatch: 66, shadow: 0.6,
      creases: [
        { pts: [[-3.6, 1.4], [-2.8, 0.7], [-2.0, 1.3], [-1.2, 0.7], [-0.4, 1.3], [0.6, 0.8]], w: 0.09, depth: 0.1 },
        { pts: [[-3.2, -0.2], [-2.4, -0.9], [-1.5, -0.3], [-0.6, -0.9], [0.4, -0.3]], w: 0.09, depth: 0.1 },
        { pts: [[-2.4, -1.6], [-1.4, -2.2], [-0.6, -1.6]], w: 0.09, depth: 0.1 },
        { pts: [[-3.2, 3.0], [-2.4, 2.3], [-1.5, 2.9], [-0.6, 2.3], [0.5, 2.9]], w: 0.09, depth: 0.1 },
      ],
      bumps: [{ at: [bet[0], bet[1] + 1.6], r: [1.8, 1.8], h: 0.3 }],
    });

    // Neck and turned head: a proud arch, hooked beak, a crest blown back.
    limb([[-1.6, 5.0, 1.3], [-1.0, 7.4, 0.86], [-0.4, 9.2, 0.72], [0.5, 10.0, 0.74]], { tone: 1.16, hatch: 28, shadow: 0.5 });
    for (const pts of [[[-0.6, 10.6], [-1.8, 11.8], [-3.4, 12.0]], [[-0.3, 11.0], [-1.2, 12.6], [-2.6, 13.4]], [[0.1, 11.1], [-0.5, 12.8], [-1.6, 14.2]], [[0.5, 11.1], [0.3, 12.6], [-0.4, 14.0]]]) limb([[...pts[0], 0.2], [...pts[1], 0.17], [...pts[2], 0.02]], { tone: 1.2, hatch: 50, shadow: 0.3, melt: 0 });
    blob([[-0.4, 9.6], [-0.7, 10.4], [-0.2, 11.2], [0.7, 11.3], [1.5, 10.8], [2.0, 10.3], [3.0, 9.2, 'c'], [2.0, 9.5], [1.2, 9.1], [0.3, 9.0]], {
      round: 0.56, tone: 1.26, hatch: 20, shadow: 0.46,
      creases: [{ pts: [[0.2, 10.5], [0.7, 10.7], [1.1, 10.4]], w: 0.05, depth: 0.1 }, { pts: [[1.4, 10.2], [1.9, 9.9], [2.5, 9.5]], w: 0.05, depth: 0.08 }],
    });
    limb([[1.9, 10.2, 0.2], [2.5, 9.8, 0.12], [3.0, 9.25, 0.015]], { tone: 1.3, warm: 0.84, shadow: 0, flat: 0.6, melt: 0 });
    line([[0.3, 9.0], [-0.4, 8.0]], { w: 0.04, v: 0.3 });
  },
};
