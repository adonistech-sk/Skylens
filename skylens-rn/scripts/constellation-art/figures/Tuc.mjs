// The Toucan on its branch, facing west. Alpha is at the root of the great bill, Gamma on the
// shoulder, Delta on the bib, Epsilon at the vent, Zeta and Beta along the tail. The bill carries
// the figure and its tip is the warm note.
export default {
  tier: 'extended',
  subject: 'The Toucan',
  pixels: 1000,
  anchors: [['α Tuc', 'bill root'], ['γ Tuc', 'shoulder'], ['δ Tuc', 'bib'], ['ε Tuc', 'vent'], ['ζ Tuc', 'tail'], ['β¹ Tuc', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Tuc'), bet = s('β¹ Tuc');

    // The branch, with a leaf spray.
    limb([[-14.0, -9.6, 0.34], [-7.0, -8.2, 0.5], [0.4, -7.2, 0.58], [8.0, -7.8, 0.5], [14.4, -6.6, 0.3], [18.0, -5.0, 0.12]], {
      tone: 1.0, hatch: 8, shadow: 0, melt: 0,
      creases: [{ pts: [[-11, -9.0], [-5, -8.0], [1, -7.1]], w: 0.07, depth: 0.08 }, { pts: [[3, -7.3], [8, -7.9], [13, -7.0]], w: 0.07, depth: 0.08 }],
      bumps: [{ at: [6.6, -7.7], r: [0.8, 0.7], h: 0.2 }],
    });
    const leaf = (a, b, w, tone = 0.98) => {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), n = [-d[1] / l, d[0] / l];
      blob([[...a, 'c'], [m[0] + n[0] * w, m[1] + n[1] * w], [...b, 'c'], [m[0] - n[0] * w, m[1] - n[1] * w]], {
        round: w * 0.7, tone, hatch: (Math.atan2(-d[1], d[0]) * 180) / Math.PI + 56, shadow: 0.3,
        creases: [{ pts: [a, m, b], w: 0.07, depth: 0.08 }, { pts: [[m[0] - d[0] * 0.2, m[1] - d[1] * 0.2], [m[0] + n[0] * w * 0.7 + d[0] * 0.06, m[1] + n[1] * w * 0.7 + d[1] * 0.06]], w: 0.04, depth: 0.05 }, { pts: [[m[0] - d[0] * 0.2, m[1] - d[1] * 0.2], [m[0] - n[0] * w * 0.7 + d[0] * 0.06, m[1] - n[1] * w * 0.7 + d[1] * 0.06]], w: 0.04, depth: 0.05 }],
      });
    };
    leaf([12.0, -7.0], [15.4, -10.6], 1.1);
    leaf([9.6, -7.6], [11.0, -11.8], 1.1, 0.94);
    leaf([14.6, -6.6], [18.0, -8.4], 1.0, 0.94);
    leaf([-10.6, -8.9], [-13.0, -12.6], 1.1, 0.94);
    leaf([-7.0, -8.2], [-6.4, -12.0], 1.0);

    // The tail, four long square-ended feathers.
    for (const [ty, tone, by] of [[-6.8, 0.96, -2.6], [-5.2, 1.04, -1.8], [-3.5, 1.1, -0.9], [-1.6, 1.16, 0.0]]) {
      const b = [-3.0, by], t = [-15.2, ty - 0.2], m = [(b[0] + t[0]) / 2, (b[1] + t[1]) / 2];
      blob([[b[0], b[1] + 0.9], [m[0], m[1] + 0.92], [t[0] + 0.3, t[1] + 0.86], [t[0] - 0.2, t[1], ], [t[0] + 0.3, t[1] - 0.86], [m[0], m[1] - 0.92], [b[0], b[1] - 0.9]], {
        round: 0.5, tone, hatch: 74, shadow: 0.42,
        creases: [{ pts: [b, m, [t[0] + 0.3, t[1]]], w: 0.07, depth: 0.1 }],
      });
    }

    // The foot, gripping.
    limb([[0.0, -3.0, 0.5], [0.6, -5.0, 0.26], [0.7, -6.2, 0.22]], { tone: 1.0, hatch: 80, shadow: 0.3 });
    limb([[2.6, -3.0, 0.5], [3.0, -5.0, 0.26], [3.1, -6.3, 0.22]], { tone: 1.06, hatch: 80, shadow: 0.3 });
    for (const x of [0.7, 3.1]) for (const d of [-0.8, -0.2, 0.4, 0.9]) limb([[x + d * 0.3, -6.1, 0.15], [x + d, -6.6, 0.15], [x + d * 1.15, -7.5, 0.06]], { tone: 1.12, shadow: 0.3, melt: 0 });

    // The bird's plump body, drawn in one sweep from crown to rump.
    blob([[6.2, 7.5], [4.2, 7.3], [2.8, 6.2], [1.0, 5.8], [-1.6, 4.4], [-4.4, 1.8], [-6.0, 0.2], [-5.2, -2.0], [-2.4, -3.4], [0.8, -4.8], [4.2, -5.0], [7.2, -3.4], [8.6, -1.2], [9.7, 1.2], [9.7, 3.8], [8.4, 6.2]], {
      round: 1.8, tone: 1.08, hatch: 40, shadow: 0.6, band: 0.55,
      creases: [
        { pts: [[2.6, 6.0], [3.6, 4.2], [3.4, 2.6]], w: 0.09, depth: 0.1 },
        { pts: [[3.6, -2.2], [2.6, -3.4], [0.8, -4.2]], w: 0.08, depth: 0.09 }, { pts: [[2.4, -1.8], [1.0, -3.0], [-1.0, -3.2]], w: 0.08, depth: 0.09 },
        { pts: [[5.2, 6.6], [4.8, 5.6], [5.0, 4.6]], w: 0.05, depth: 0.06 }, { pts: [[7.8, 6.2], [7.4, 5.8], [7.6, 5.0]], w: 0.05, depth: 0.06 },
      ],
      bumps: [{ at: [6.0, -2.0], r: [2.8, 2.6], h: 0.5 }],
    });
    // The pale bib, a clean bright shield on the dark body.
    blob([[8.4, 2.6], [5.6, 1.8], [3.8, 0.2], [3.4, -2.0], [4.4, -3.8], [6.6, -3.6], [8.1, -1.6], [8.8, 0.6]], {
      round: 1.5, tone: 1.32, hatch: 8, shadow: 0, spacing: 0.72, edge: 1,
      creases: [{ pts: [[7.8, 0.6], [6.4, 0.0], [5.2, -1.0]], w: 0.06, depth: 0.08 }, { pts: [[7.8, -1.0], [6.4, -1.6], [5.0, -2.8]], w: 0.06, depth: 0.08 }],
    });
    // Folded wing over the back, feathered in tiers.
    blob([[3.2, 4.8], [0.4, 5.0], [-2.2, 3.4], [-5.0, 0.4], [-7.6, -1.8, 'c'], [-4.2, -1.8], [-1.0, -2.4], [1.8, -1.6], [3.4, 1.0]], {
      round: 1.2, tone: 1.14, hatch: 150, shadow: 0.56,
      creases: [
        { pts: [[2.8, 3.4], [0.4, 3.6], [-1.8, 2.2], [-3.8, 0.4]], w: 0.1, depth: 0.12 },
        { pts: [[3.0, 1.6], [0.8, 1.6], [-2.0, 0.4], [-5.2, -1.0]], w: 0.1, depth: 0.12 },
        { pts: [[2.4, 0.0], [0.4, -0.2], [-2.4, -0.8], [-5.6, -1.7]], w: 0.1, depth: 0.12 },
        { pts: [[2.2, 4.4], [1.4, 3.4], [1.8, 1.6], [1.4, 0.0], [1.6, -1.2]], w: 0.07, depth: 0.08 },
        { pts: [[-0.4, 4.6], [-0.6, 3.2], [-0.2, 1.4], [-0.6, -0.1], [-0.4, -1.8]], w: 0.07, depth: 0.08 },
        { pts: [[-2.4, 3.0], [-2.4, 1.8], [-2.2, 0.4], [-2.6, -0.8]], w: 0.07, depth: 0.08 },
        { pts: [[-4.2, 0.8], [-4.2, 0.1], [-4.0, -1.2]], w: 0.07, depth: 0.08 },
      ],
    });
    const tiles = [];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) {
      const x = 2.6 - i * 0.9 - row * 0.5, y = 4.3 - i * 0.28 - row * 0.9;
      tiles.push([[x - 0.42, y + 0.1], [x, y - 0.42], [x + 0.42, y + 0.08]]);
    }
    for (const pts of tiles) line(pts, { w: 0.05, v: 0.42 });
    // Feather edges on the crown and neck.
    for (const pts of [[[5.0, 6.4], [4.6, 5.2], [3.8, 4.0]], [[6.6, 6.2], [6.4, 5.0], [5.8, 3.8]], [[3.6, 6.2], [3.4, 5.2], [2.8, 4.8]]]) line(pts, { w: 0.05, v: 0.36 });

    // The great bill: as long as the bird, arched, deep at the root, hooked down at the tip.
    const root = [alp[0] - 0.4, alp[1]];
    blob([[root[0], root[1] - 1.9, 'c'], [12.0, -1.6], [16.4, -1.5], [20.2, -2.3], [23.0, -4.0, 'c'], [20.6, -3.2], [16.4, -2.9], [12.0, -3.0], [root[0] + 0.6, root[1] - 3.9], [root[0] + 0.5, root[1] - 2.9]], {
      round: 0.8, tone: 1.08, hatch: 70, shadow: 0.5, warm: 0.12, band: 0.4,
      creases: [{ pts: [[9.6, -3.0], [13.0, -2.4], [17.0, -2.3], [20.0, -2.9]], w: 0.06, depth: 0.07 }],
    });
    blob([[root[0], root[1] + 3.6, 'c'], [11.4, 6.1], [15.2, 6.0], [19.2, 4.2], [22.2, 0.8], [24.0, -3.9, 'c'], [21.6, -2.0], [18.4, -1.0], [14.0, -1.1], [10.6, -1.3], [root[0], root[1] - 2.3, 'c'], [root[0] + 1.2, root[1] + 0.5]], {
      round: 2.0, tone: 1.3, hatch: 62, shadow: 0.6, warm: 0.14, spacing: 0.8, band: 0.5,
      creases: [
        { pts: [[9.8, 5.0], [13.6, 5.0], [17.6, 3.6], [20.8, 0.8]], w: 0.09, depth: 0.1 },
        { pts: [[11.0, 5.4], [10.8, 3.0], [11.2, 0.2]], w: 0.05, depth: 0.05 }, { pts: [[13.6, 5.2], [13.4, 2.6], [13.8, 0.0]], w: 0.05, depth: 0.05 }, { pts: [[16.2, 4.8], [16.0, 2.2], [16.4, 0.0]], w: 0.05, depth: 0.05 },
      ],
    });
    // The dark oval near the tip, then the copper of the tip itself.
    blob([[19.2, 2.4], [20.8, 1.6], [21.4, -0.4], [20.4, -1.2], [18.8, -0.2], [18.4, 1.2]], { round: 0.6, tone: 0.44, hatch: 70, shadow: 0.1 });
    blob([[22.3, 0.2], [23.0, -1.6], [24.0, -3.9, 'c'], [22.3, -2.5], [21.5, -1.3]], { round: 0.4, tone: 1.26, warm: 0.84, hatch: 70, shadow: 0.1 });
    // Serrations along the cut of the bill.
    for (let i = 0; i < 16; i++) { const x = 9.2 + i * 0.84, y = -1.5 + 0.3 * Math.sin(i * 0.3) - (i > 11 ? (i - 11) * 0.22 : 0); line([[x, y + 0.04], [x + 0.14, y - 0.3]], { w: 0.05, v: 0.54 }); }

    // The eye, ringed.
    const eye = [6.5, 4.7];
    limb([[eye[0] - 0.02, eye[1], 0.8], [eye[0] + 0.02, eye[1], 0.8]], { tone: 1.3, hatch: 30, shadow: 0.3, melt: 0 });
    limb([[eye[0] - 0.01, eye[1], 0.42], [eye[0] + 0.01, eye[1], 0.42]], { tone: 0.2, shadow: 0, melt: 0 });
    limb([[eye[0] - 0.14, eye[1] + 0.14, 0.12], [eye[0] - 0.12, eye[1] + 0.14, 0.12]], { tone: 1.3, shadow: 0, melt: 0 });
    if (bet[0] > 0) line([bet, bet]);
  },
};
