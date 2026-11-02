// The Balance, a tall turned-brass stand with its beam tipped, the heavier pan low. Zubeneschamali
// crowns the finial. Zubenelhakrabi lies on the beam and Zubenelgenubi on the near chain. Brachium
// sits on the lip of the raised pan, while upsilon and tau lie in the low pan. Being a made thing
// it is all edge and ornament, with the warm note on the pivot and finial.

export default {
  tier: 'extended',
  subject: 'The Balance',
  pixels: 1100,
  anchors: [['Zubeneschamali', 'finial'], ['Zubenelhakrabi', 'beam'], ['Zubenelgenubi', 'chain'], ['Brachium', 'lip of the pan'], ['υ Lib', 'pan'], ['τ Lib', 'pan']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const top = s('Zubeneschamali'), zg = s('Zubenelgenubi'), br = s('Brachium');
    const pivot = [1.0, 7.0], left = [-6.6, 4.8], right = [9.1, 9.35];

    // A chain, link by link, each link a small flattened loop turned to the next.
    const chain = (a, b, n, o = {}) => {
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) / n, r = l * 0.58, w = i % 2 ? 0.08 : 0.26;
        const ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), uy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
        line([[x - ux * r, y - uy * r], [x - uy * w, y + ux * w], [x + ux * r, y + uy * r], [x + uy * w, y - ux * w], [x - ux * r, y - uy * r]], { w: 0.05, v: o.v ?? 0.74, taper: false });
      }
    };

    // A pan: the deep bowl, ribbed, under a rolled lip.
    const pan = (cx, y, half, depth, tone) => {
      const X = (k) => cx + half * k;
      blob([[X(-1), y], [X(-0.86), y - depth * 0.46], [X(-0.56), y - depth * 0.86], [X(0), y - depth * 1.02], [X(0.56), y - depth * 0.86], [X(0.86), y - depth * 0.46], [X(1), y]], {
        round: 1.2, tone, hatch: 4, shadow: 0.5, band: 0.6, spacing: 0.9,
        creases: [
          ...[-0.76, -0.5, -0.24, 0, 0.24, 0.5, 0.76].map((k) => ({ pts: [[X(k), y - 0.2], [X(k * 0.92), y - depth * 0.5], [X(k * 0.4), y - depth * 0.92]], w: 0.09, depth: 0.14 })),
          { pts: [[X(-0.9), y - depth * 0.34], [X(0), y - depth * 0.5], [X(0.9), y - depth * 0.34]], w: 0.08, depth: 0.1 },
        ],
        bumps: [{ at: [X(-0.3), y - depth * 0.5], r: [half * 0.4, depth * 0.3], h: 0.3 }],
      });
      limb([[X(-1.03), y, 0.34], [X(-0.5), y + 0.36, 0.38], [X(0.5), y + 0.36, 0.38], [X(1.03), y, 0.34]], { tone: 1.3, hatch: 86, shadow: 0.4, melt: 0, band: 0.2 });
      limb([[X(0), y - depth * 1.02, 0.42], [X(0), y - depth * 1.03, 0.42]], { tone: 1.2, warm: 0.5, shadow: 0.3, melt: 0 });
    };

    // Foot of the stand: stepped, moulded, wide.
    blob([[-5.6, -15.0], [-5.8, -13.9], [-3.6, -13.5], [-2.2, -12.6], [-0.6, -12.1], [2.6, -12.1], [4.2, -12.6], [5.6, -13.5], [7.8, -13.9], [7.6, -15.0]], {
      round: 0.7, tone: 1.14, hatch: 6, shadow: 0, band: 0.5, warm: 0.14,
      creases: [{ pts: [[-5.5, -14.1], [1.0, -14.5], [7.5, -14.1]], w: 0.1, depth: 0.14 }, { pts: [[-3.2, -13.3], [1.0, -13.5], [5.2, -13.3]], w: 0.1, depth: 0.14 }, { pts: [[-1.6, -12.6], [1.0, -12.8], [3.6, -12.6]], w: 0.08, depth: 0.1 }],
      bumps: [{ at: [-0.8, -13.2], r: [2.4, 0.7], h: 0.2 }],
    });
    // Column, turned on a lathe: baluster, knop, a long fluted shaft, the capital.
    limb([[1.0, -12.2, 1.0], [1.0, -11.2, 0.5], [1.0, -10.2, 1.0], [1.0, -8.8, 1.02], [1.0, -7.6, 0.5], [1.0, -6.8, 0.42], [1.0, -6.1, 0.76], [1.0, -5.5, 0.4], [1.0, -2.0, 0.36], [1.0, 3.0, 0.3], [1.0, 5.0, 0.3], [1.0, 5.6, 0.6], [1.0, 6.1, 0.34]], {
      tone: 1.26, hatch: 2, shadow: 0.4, band: 0.3, spacing: 0.9, warm: 0.14, melt: 0,
      creases: [{ pts: [[0.76, -5.2], [0.8, -1.0], [0.82, 4.8]], w: 0.05, depth: 0.08 }, { pts: [[1.18, -5.2], [1.16, -1.0], [1.14, 4.8]], w: 0.05, depth: 0.08 }, { pts: [[0.0, -9.6], [1.0, -9.9], [2.0, -9.6]], w: 0.06, depth: 0.1 }, { pts: [[0.0, -8.8], [1.0, -9.1], [2.0, -8.8]], w: 0.06, depth: 0.1 }],
    });

    // The two sets of chains, drawn before the pans so their lips close over the ends.
    const rimL = -7.0, rimR = -4.5, half = 5.6, cx0 = left[0], cx1 = right[0];
    chain(left, [cx0 - half, rimL + 0.3], 34);
    chain(left, [cx0 + half, rimL + 0.3], 34);
    chain(left, [cx0, rimL + 0.5], 30, { v: 0.4 });
    chain(right, zg, 12);
    chain(zg, [br[0] + 0.1, rimR + 0.3], 22);
    chain(right, [cx1 + half, rimR + 0.3], 34);
    chain(right, [cx1, rimR + 0.5], 30, { v: 0.4 });
    pan(cx0, rimL, half, 3.6, 1.26);
    pan(cx1, rimR, half, 3.4, 1.26);

    // The beam: swelling toward the pivot, ending in scrolls, tipped down to the left.
    const along = (t) => [left[0] + (right[0] - left[0]) * t, left[1] + (right[1] - left[1]) * t];
    limb([[...along(-0.015), 0.28], [...along(0.14), 0.3], [...along(0.3), 0.42], [...along(0.46), 0.66], [...along(0.54), 0.66], [...along(0.7), 0.42], [...along(0.86), 0.3], [...along(1.015), 0.28]], {
      tone: 1.36, hatch: 76, shadow: 0.5, band: 0.3, melt: 0,
      creases: [{ pts: [along(0.06), along(0.24), along(0.44)], w: 0.06, depth: 0.1 }, { pts: [along(0.56), along(0.76), along(0.94)], w: 0.06, depth: 0.1 }],
    });
    for (const [c, d] of [[left, -1], [right, 1]]) {
      line([[c[0], c[1] + 0.26], [c[0] + d * 0.8, c[1] + 0.9], [c[0] + d * 1.6, c[1] + 0.5], [c[0] + d * 1.4, c[1] - 0.3], [c[0] + d * 0.8, c[1] - 0.1], [c[0] + d * 0.9, c[1] + 0.3]], { w: 0.09, v: 0.8 });
      limb([[c[0] - 0.3, c[1], 0.32], [c[0] + 0.3, c[1], 0.32]], { tone: 1.3, warm: 0.6, shadow: 0.3, melt: 0 });
    }

    // Pointer, standing square to the beam, showing the tilt.
    limb([[pivot[0], pivot[1], 0.26], [pivot[0] + 0.8, pivot[1] + 2.4, 0.14], [pivot[0] + 1.3, pivot[1] + 3.8, 0.03]], { tone: 1.3, warm: 0.5, shadow: 0.3, melt: 0 });
    // Upper post, passing behind the pivot to the finial.
    limb([[1.0, 6.2, 0.34], [0.92, 8.2, 0.26], [0.86, 9.2, 0.3], [0.84, 9.8, 0.6], [0.82, 10.4, 0.3]], { tone: 1.24, hatch: 2, shadow: 0.34, warm: 0.14, melt: 0 });
    // Finial, the warm note.
    limb([[top[0], top[1] - 1.1, 0.34], [top[0], top[1] - 0.2, 0.76], [top[0], top[1] + 0.7, 0.4], [top[0], top[1] + 1.8, 0.04]], { tone: 1.4, warm: 0.72, hatch: 40, shadow: 0.3, melt: 0 });
    // Pivot boss on top of everything.
    blob([[pivot[0] - 1.0, pivot[1]], [pivot[0], pivot[1] + 1.0], [pivot[0] + 1.0, pivot[1]], [pivot[0], pivot[1] - 1.0]], { round: 0.7, tone: 1.46, warm: 0.7, shadow: 0.5, creases: [{ pts: [[pivot[0] - 0.5, pivot[1] - 0.2], [pivot[0], pivot[1] + 0.5], [pivot[0] + 0.5, pivot[1] - 0.2], [pivot[0], pivot[1] - 0.5], [pivot[0] - 0.44, pivot[1] - 0.2]], w: 0.06, depth: 0.1 }] });
  },
};
