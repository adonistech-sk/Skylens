// The sail of the Argo, the second of her three plates, drawn to the same plan as Carina. A square
// sail full of wind under a long yard. Psi sits under the yard at the mast, Suhail and 50191 high in
// the cloth, Mu low on the eastern leech, Alsephina, Markeb and Phi along the foot, and Gamma low
// on the western leech. Mast, yard and the ram's-horn device are the warm note.
export default {
  tier: 'extended',
  subject: 'The Sails of the Argo',
  pixels: 1100,
  anchors: [['γ² Vel', 'clew of the sail'], ['Alsephina', 'foot of the sail'], ['Suhail', 'sail'], ['Markeb', 'foot of the sail'], ['μ Vel', 'clew of the sail'], ['φ Vel', 'foot of the sail'], ['ψ Vel', 'head of the sail'], [50191, 'head of the sail']],
  draw({ s, E }) {
    // The ship's plan is drawn in Carina's plane and carried here through two shared stars.
    const a0 = [12.25, 12.24], a1 = [-13.86, 9.56], b0 = s(39953), b1 = s(52727);
    const da = [a1[0] - a0[0], a1[1] - a0[1]], db = [b1[0] - b0[0], b1[1] - b0[1]], d = da[0] * da[0] + da[1] * da[1];
    const re = (db[0] * da[0] + db[1] * da[1]) / d, im = (db[1] * da[0] - db[0] * da[1]) / d;
    const T = (p) => { const x = p[0] - a0[0], y = p[1] - a0[1]; return [b0[0] + re * x - im * y, b0[1] + im * x + re * y, ...p.slice(2)]; };
    const M = (pts) => pts.map(T);
    const turn = (-Math.atan2(im, re) * 180) / Math.PI;
    const blob = (pts, o = {}) => E.blob(M(pts), { ...o, hatch: (o.hatch ?? 28) + turn, creases: o.creases?.map((c) => ({ ...c, pts: M(c.pts) })), bumps: o.bumps?.map((b) => ({ ...b, at: T(b.at) })) });
    const limb = (pts, o = {}) => E.limb(M(pts), { ...o, hatch: (o.hatch ?? 28) + turn, creases: o.creases?.map((c) => ({ ...c, pts: M(c.pts) })) });
    const line = (pts, o) => E.line(M(pts), o);

    const yard = [[-18.0, 20.5], [-10, 21.4], [-1.8, 21.9], [6, 21.5], [14.8, 20.5]];

    // Stays from the masthead down toward the bow and the stern.
    line([[-1.8, 25.2], [-10.0, 18.2], [-19.0, 10.6]], { w: 0.06, v: 0.62, taper: false });
    line([[-1.8, 25.2], [7.0, 23.2], [15.2, 21.4]], { w: 0.06, v: 0.62, taper: false });

    // The mast, behind the sail, stepped on the deck.
    limb([[-1.5, 4.6, 0.6], [-1.65, 14, 0.5], [-1.8, 22, 0.36], [-1.85, 25.8, 0.24]], { tone: 1.16, warm: 0.56, hatch: 84, shadow: 0, melt: 0, flat: 0.8 });

    // Pennant streaming ahead from the masthead, a swallow tail.
    blob([[-1.8, 26.4], [-4.0, 26.9], [-6.4, 26.2], [-9.2, 26.9, 'c'], [-7.4, 25.9], [-9.0, 25.0, 'c'], [-6.2, 25.4], [-3.8, 25.8], [-1.8, 25.4]], { round: 0.3, tone: 1.14, warm: 0.7, hatch: 70, shadow: 0, band: 0.16, creases: [{ pts: [[-2.2, 25.9], [-4.4, 26.3], [-6.6, 25.8]], w: 0.05, depth: 0.07 }] });

    // The sail, bellied by the wind. Its seams fan down from the yard to the foot.
    const head = [[-17.4, 20.5], [-10.0, 21.2], [-1.8, 21.6], [6, 21.3], [14.2, 20.4]];
    const foot = [[-16.6, 7.6], [-9.6, 6.1], [-5.2, 5.4], [-0.1, 5.2], [5.4, 5.3], [9.6, 6.4], [14.0, 8.8]];
    const seamAt = (t) => {
      const lerpList = (list, v) => { const x = v * (list.length - 1), i = Math.min(list.length - 2, Math.floor(x)), f = x - i; return [list[i][0] + (list[i + 1][0] - list[i][0]) * f, list[i][1] + (list[i + 1][1] - list[i][1]) * f]; };
      const a = lerpList(head, t), b = lerpList(foot, t);
      const bow = (t - 0.5) * 1.6;
      return [a, [a[0] + (b[0] - a[0]) * 0.33 + bow, a[1] + (b[1] - a[1]) * 0.33], [a[0] + (b[0] - a[0]) * 0.67 + bow, a[1] + (b[1] - a[1]) * 0.67], b];
    };
    blob([[...head[0], 'c'], head[1], head[2], head[3], [...head[4], 'c'], [15.0, 17.0], [15.2, 12.6], [...foot[6], 'c'], foot[5], foot[4], foot[3], foot[2], foot[1], [...foot[0], 'c'], [-18.0, 12.2], [-18.0, 16.6]], {
      round: 2.6, tone: 1.2, hatch: 80, shadow: 0, band: 0.6, spacing: 0.94,
      creases: [
        ...[0.09, 0.18, 0.27, 0.36, 0.45, 0.55, 0.64, 0.73, 0.82, 0.91].map((t) => ({ pts: seamAt(t), w: 0.13, depth: 0.22 })),
        { pts: [[-17.6, 17.2], [-8, 18.2], [-1.5, 18.5], [7, 18.1], [14.8, 17.0]], w: 0.09, depth: 0.12 },
        { pts: [[-17.6, 10.8], [-8, 9.4], [-1.5, 9.0], [6, 9.2], [14.8, 11.0]], w: 0.09, depth: 0.12 },
      ],
      bumps: [{ at: [-1.6, 13.6], r: [12, 6], h: 1.3 }],
    });

    // Rows of reef points across the cloth.
    for (const [pts, n] of [[[[-17.4, 18.9], [-8, 19.8], [-1.5, 20.2], [6, 19.8], [14.4, 18.8]], 30]]) {
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(x)), f = x - k;
        const p = [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f];
        line([[p[0], p[1] + 0.22], [p[0] + 0.06, p[1] - 0.26]], { w: 0.05, v: 0.72 });
      }
    }

    // A pair of ram's horns, the mark of the Fleece, worked into the middle of the sail.
    const spiral = (cx, cy, dir) => {
      const pts = [];
      for (let i = 0; i <= 30; i++) { const a = (i / 30) * Math.PI * 3.2 + 1.3, r = 3.0 * (1 - (i / 30) * 0.84); pts.push([cx + dir * Math.cos(a) * r, cy + Math.sin(a) * r * 0.92]); }
      return pts;
    };
    for (const dir of [-1, 1]) {
      const c = [-1.5 + dir * 2.3, 13.0], pts = spiral(c[0], c[1], dir);
      line(pts, { w: 0.2, v: 0.82, warm: 0.7, taperPower: 0.4 });
      line(pts.map(([x, y]) => [x - 0.1, y + 0.1]), { w: 0.06, v: 0.96, warm: 0.6, taperPower: 0.4 });
    }
    limb([[-1.5, 15.6, 0.2], [-1.5, 13.8, 0.28], [-1.5, 10.4, 0.04]], { tone: 1.2, warm: 0.7, shadow: 0.4, melt: 0, flat: 0.7 });

    // Bolt rope along the foot.
    limb(foot.map((p) => [p[0], p[1], 0.11]), { tone: 1.24, shadow: 0.3, melt: 0, flat: 0.7 });

    // The yard, bowed by the load, and the ties that hold it to the mast.
    limb(yard.map(([x, y], i) => [x, y, [0.13, 0.22, 0.34, 0.22, 0.13][i]]), { tone: 1.2, warm: 0.62, hatch: 80, shadow: 0.56, melt: 0, flat: 0.8 });
    limb([[-2.9, 21.8, 0.24], [-1.8, 22.0, 0.3], [-0.7, 21.7, 0.24]], { tone: 1.3, warm: 0.8, shadow: 0.4, melt: 0, flat: 0.6 });
    // Sheets from the two clews, running down to the deck.
    line([[-16.6, 7.6], [-15.2, 6.2], [-13.0, 4.6]], { w: 0.06, v: 0.62, taper: false });
    line([[14.0, 8.8], [15.2, 11.0], [16.6, 13.4]], { w: 0.06, v: 0.62, taper: false });
  },
};
