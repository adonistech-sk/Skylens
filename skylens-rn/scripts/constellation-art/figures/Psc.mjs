// The Fishes, two carp bound by a long cord, straining apart. The western fish lies through the
// Circlet with its mouth at Fumalsamakah and its tail on omega. The northern fish swims up through
// chi, phi and upsilon to tau. The cord runs on through the stars to the knot at Alrescha, which
// holds the warm note: a small clasp on the cord.

/** One fish, in its own axis. u runs tail to snout, 0 to 1. v is toward the back. */
function fish(E, T, L, H, o) {
  const { blob, limb, line } = E;
  const P = (pts) => pts.map(([u, v, ...r]) => [...T(u * L, v * H), ...r]);
  const hatch = o.hatch;

  // Tail, forked, each ray a line.
  const lobe = (tip, root) => {
    blob(P([[0.05, root * 0.14], [-0.06, root * 0.86], [tip[0], tip[1], 'c'], [-0.22, root * 0.66], [-0.14, root * 0.02, 'c']]), { round: 0.8, tone: 1.16, hatch: hatch + 50, shadow: 0.4, band: 0.26, creases: [0.26, 0.5, 0.74].map((k) => ({ pts: P([[0.03, root * 0.1], [(tip[0] + 0.03) * 0.6, tip[1] * k * 0.7], [tip[0] * 0.92, tip[1] * (k * 0.5 + 0.5)]]), w: 0.05, depth: 0.09 })) });
  };
  lobe(o.tailUp, 1);
  lobe(o.tailLow, -1);

  // Back fin, tall at the shoulder, cut into rays.
  blob(P([[0.72, 0.84], [0.62, 1.42], [0.5, 1.6], [0.4, 1.4, 'c'], [0.34, 1.26], [0.24, 1.1, 'c'], [0.24, 0.56], [0.48, 0.96]]), { round: 0.4, tone: 1.02, hatch: hatch + 80, shadow: 0.4, band: 0.26, creases: [0.3, 0.38, 0.46, 0.54, 0.62].map((u) => ({ pts: P([[u + 0.03, 0.9], [u - 0.01, 1.2], [u - 0.05, 1.44]]), w: 0.05, depth: 0.09 })) });
  // Belly fins.
  blob(P([[0.36, -0.82], [0.26, -1.34], [0.14, -1.56, 'c'], [0.1, -1.1], [0.12, -0.42]]), { round: 0.36, tone: 1, hatch: hatch + 94, shadow: 0.4, band: 0.26, creases: [0.2, 0.26, 0.32].map((u) => ({ pts: P([[u + 0.03, -0.7], [u - 0.03, -1.1], [u - 0.08, -1.34]]), w: 0.05, depth: 0.08 })) });
  blob(P([[0.62, -0.92], [0.54, -1.36], [0.46, -1.46, 'c'], [0.42, -1.1], [0.44, -0.9]]), { round: 0.3, tone: 0.96, hatch: hatch + 94, shadow: 0.4, band: 0.26, creases: [{ pts: P([[0.52, -0.94], [0.5, -1.2]]), w: 0.05, depth: 0.08 }] });

  // Body.
  blob(P([[0.0, 0.08], [0.12, 0.3], [0.3, 0.72], [0.52, 1.0], [0.72, 0.9], [0.86, 0.62], [0.97, 0.26], [1.02, 0.0], [0.98, -0.2], [0.88, -0.56], [0.72, -0.88], [0.52, -1.0], [0.3, -0.72], [0.12, -0.3], [0.0, -0.08]]), {
    round: H * 0.86, tone: 1.32, hatch, shadow: o.shadow ?? 0.5, band: 0.5, spacing: 0.9,
    creases: [{ pts: P([[0.72, 0.84], [0.67, 0.2], [0.72, -0.84]]), w: 0.14, depth: 0.24 }, { pts: P([[0.76, 0.76], [0.73, 0.1], [0.76, -0.76]]), w: 0.07, depth: 0.1 }, { pts: P([[1.0, -0.04], [0.92, -0.1], [0.86, -0.24]]), w: 0.08, depth: 0.14 }],
    bumps: [{ at: T(0.86 * L, 0.1 * H), r: [L * 0.1, H * 0.5], h: 0.2 }, { at: T(0.46 * L, 0.3 * H), r: [L * 0.22, H * 0.5], h: 0.3 }],
  });

  // Scales: rows laid head to tail, every one a hand-cut crescent.
  const h = (u) => { const k = [[0, 0.08], [0.12, 0.3], [0.3, 0.72], [0.52, 1], [0.72, 0.9]]; for (let i = 1; i < k.length; i++) if (u <= k[i][0]) return k[i - 1][1] + ((u - k[i - 1][0]) / (k[i][0] - k[i - 1][0])) * (k[i][1] - k[i - 1][1]); return 0.9; };
  const step = o.scale / L;
  let row = 0;
  for (let u = 0.66; u > 0.08; u -= step, row++) {
    const top = h(u) * H * 0.9, n = Math.max(1, Math.round((top * 2) / o.scale));
    for (let k = 0; k <= n; k++) {
      const v = -top + ((k + (row % 2) * 0.5) * (top * 2)) / n;
      if (Math.abs(v) > top) continue;
      const r = o.scale * 0.6;
      line([T(u * L + r * 0.1, v + r), T(u * L - r * 0.86, v + r * 0.62), T(u * L - r, v), T(u * L - r * 0.86, v - r * 0.62), T(u * L + r * 0.1, v - r)], { w: 0.05, v: 0.8 });
    }
  }
  // Side line.
  line(P([[0.68, 0.24], [0.4, 0.14], [0.14, 0.04]]), { w: 0.05, v: 0.86 });

  // Breast fin, swept back.
  blob(P([[0.65, -0.3], [0.52, -0.16], [0.4, -0.36, 'c'], [0.46, -0.6], [0.62, -0.6]]), { round: 0.3, tone: 1.2, hatch: hatch + 70, shadow: 0.46, band: 0.26, creases: [{ pts: P([[0.62, -0.36], [0.5, -0.3], [0.44, -0.36]]), w: 0.05, depth: 0.08 }, { pts: P([[0.62, -0.48], [0.52, -0.44], [0.46, -0.5]]), w: 0.05, depth: 0.08 }] });
  // Lip barbel, the carp's mark.
  line(P([[0.97, -0.16], [0.95, -0.42], [1.0, -0.62]]), { w: 0.07, v: 0.84 });
  // Eye: dark socket, lit ring, bright glint.
  const e = T(0.86 * L, 0.3 * H);
  blob([[e[0] - 0.56, e[1]], [e[0], e[1] + 0.56], [e[0] + 0.56, e[1]], [e[0], e[1] - 0.56]], { round: 0.4, tone: 1.5, shadow: 0.4, band: 0.2, creases: [{ pts: [[e[0] - 0.24, e[1]], [e[0], e[1] + 0.26], [e[0] + 0.24, e[1]], [e[0], e[1] - 0.26], [e[0] - 0.24, e[1]]], w: 0.15, depth: 0.5 }] });
}

export default {
  tier: 'extended',
  subject: 'The Fishes',
  pixels: 1100,
  anchors: [['Fumalsamakah', 'mouth'], ['γ Psc', 'head'], ['θ Psc', 'back'], ['κ Psc', 'belly'], ['ι Psc', 'flank'], ['ω Psc', 'tail'], ['Alrescha', 'knot of the cord'], ['Alpherg', 'cord'], ['τ Psc', 'head'], ['υ Psc', 'flank'], ['φ Psc', 'flank'], ['χ Psc', 'root of the tail'], ['δ Psc', 'cord'], ['ε Psc', 'cord']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alr = s('Alrescha'), ome = s('ω Psc');

    // The western fish, mouth to the west, in the Circlet.
    const a = [10.4, -4.5], b = [24.8, -5.4], la = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const Ua = [(b[0] - a[0]) / la, (b[1] - a[1]) / la], Va = [-Ua[1], Ua[0]];
    const West = (u, v) => [a[0] + Ua[0] * u + Va[0] * v, a[1] + Ua[1] * u + Va[1] * v];
    // The northern fish, climbing to tau.
    const c = [-7.9, 11.0], d = [-7.0, 24.0], lc = Math.hypot(d[0] - c[0], d[1] - c[1]);
    const Uc = [(d[0] - c[0]) / lc, (d[1] - c[1]) / lc], Vc = [-Uc[1], Uc[0]];
    const North = (u, v) => [c[0] + Uc[0] * u + Vc[0] * v, c[1] + Uc[1] * u + Vc[1] * v];

    // The cord, two-stranded, passing through its stars from each tail to the knot.
    const twist = (pts) => {
      limb(pts.map((p) => [...p, 0.3]), { tone: 1.2, hatch: 60, shadow: 0, melt: 0, band: 0.2 });
      const dense = [];
      for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 14; k++) { const t = k / 14; dense.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); }
      for (let i = 1; i + 1 < dense.length; i += 1) {
        const [x, y] = dense[i], [x2, y2] = dense[i + 1], l = Math.hypot(x2 - x, y2 - y) || 1, nx = -(y2 - y) / l, ny = (x2 - x) / l;
        line([[x + nx * 0.26, y + ny * 0.26], [x - nx * 0.26 + (x2 - x) * 1.6, y - ny * 0.26 + (y2 - y) * 1.6]], { w: 0.04, v: 0.5, taper: false, dark: true });
      }
    };
    twist([[a[0] + 0.3, a[1] + 0.2], [ome[0], ome[1]], [6.2, -1.4], [1.6, -3.0], s('δ Psc'), s('ε Psc'), s('Revati'), s('μ Psc'), s('ν Psc'), s('ξ Psc'), alr]);
    twist([[c[0] + 0.1, c[1] + 0.3], [-9.6, 8.4], s('Alpherg'), [-15.4, 3.8], s('Torcular'), [-19.4, -3.4], alr]);

    fish(E, West, la, 3.6, { hatch: 96, tailUp: [-0.32, 1.5], tailLow: [-0.36, -1.5], scale: 0.78 });
    fish(E, North, lc, 2.9, { hatch: 8, tailUp: [-0.34, 1.5], tailLow: [-0.34, -1.5], scale: 0.72 });

    // The knot at Alrescha, the warm note: the cords cross, and a clasp holds them.
    limb([[alr[0] + 1.3, alr[1] - 0.9, 0.3], [alr[0] - 1.6, alr[1] + 0.2, 0.3]], { tone: 1.2, shadow: 0.3, melt: 0 });
    blob([[alr[0] - 1.1, alr[1] - 0.2], [alr[0] - 0.4, alr[1] + 0.9], [alr[0] + 0.8, alr[1] + 0.9], [alr[0] + 1.2, alr[1] - 0.1], [alr[0] + 0.6, alr[1] - 1.0], [alr[0] - 0.6, alr[1] - 1.0]], {
      round: 0.6, tone: 1.46, warm: 0.76, hatch: 30, shadow: 0.5, band: 0.3,
      creases: [{ pts: [[alr[0] - 0.6, alr[1] + 0.6], [alr[0], alr[1] - 0.1], [alr[0] + 0.8, alr[1] - 0.8]], w: 0.09, depth: 0.16 }, { pts: [[alr[0] - 0.8, alr[1] - 0.4], [alr[0], alr[1] + 0.1], [alr[0] + 0.7, alr[1] + 0.6]], w: 0.09, depth: 0.16 }],
    });
    // Two loose ends.
    limb([[alr[0] - 1.0, alr[1] - 0.4, 0.24], [alr[0] - 1.7, alr[1] - 1.5, 0.2], [alr[0] - 1.5, alr[1] - 2.6, 0.04]], { tone: 1.12, shadow: 0.3, melt: 0 });
    limb([[alr[0] + 0.5, alr[1] - 0.9, 0.24], [alr[0] + 0.7, alr[1] - 1.9, 0.2], [alr[0] + 1.4, alr[1] - 2.9, 0.04]], { tone: 1.12, shadow: 0.3, melt: 0 });
  },
};
