// The Octant, Hadley's navigating instrument, in ebony and brass. Nu is the pivot of the index arm
// and its mirror, Beta the horizon glass, and Delta the end of the graduated arc. The clamp screw
// on the index arm is the warm note.
export default {
  tier: 'extended',
  subject: 'The Octant',
  pixels: 1000,
  anchors: [['ν Oct', 'index pivot'], ['β Oct', 'horizon glass'], ['δ Oct', 'arc end']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const piv = s('ν Oct'), bet = s('β Oct'), del = s('δ Oct');
    const d = [del[0] - piv[0], del[1] - piv[1]], Rr = Math.hypot(...d), A2 = Math.atan2(d[1], d[0]), A1 = A2 - Math.PI / 4;
    const Q = (ang, r) => [piv[0] + Math.cos(ang) * r, piv[1] + Math.sin(ang) * r];
    const ang = (a) => (Math.atan2(-Math.sin(a), Math.cos(a)) * 180) / Math.PI;
    const disc = (c, r, n = 12) => Array.from({ length: n }, (_, i) => [c[0] + Math.cos((i / n) * Math.PI * 2) * r, c[1] + Math.sin((i / n) * Math.PI * 2) * r]);
    const arcStrip = (r0, r1, a0, a1, o) => {
      const n = 22, p = [];
      for (let i = 0; i <= n; i++) p.push(Q(a0 + ((a1 - a0) * i) / n, r1));
      for (let i = n; i >= 0; i--) p.push(Q(a0 + ((a1 - a0) * i) / n, r0));
      blob(p.map((q, i) => (i === 0 || i === n || i === n + 1 || i === 2 * n + 1 ? [...q, 'c'] : q)), o);
    };
    const lo = A1 - 0.03, hi = A2 + 0.03;
    const bar = (a, r0, r1, w, tone) => {
      const u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]], P = (r, o) => [piv[0] + u[0] * r + n[0] * o, piv[1] + u[1] * r + n[1] * o];
      blob([[...P(r0, w), 'c'], [...P(r1, w), 'c'], [...P(r1, -w), 'c'], [...P(r0, -w), 'c']], {
        round: 0.3, tone, hatch: ang(a) + 88, shadow: 0.46, band: 0.14,
        creases: [{ pts: [P(r0 + 0.3, w * 0.58), P(r1 - 0.3, w * 0.58)], w: 0.03, depth: 0.05 }, { pts: [P(r0 + 0.3, -w * 0.58), P(r1 - 0.3, -w * 0.58)], w: 0.03, depth: 0.05 }],
      });
    };

    // The ebony frame: two radius bars, a curved brace, a broad limb.
    bar(A1, 0.0, Rr, 0.6, 1.5);
    bar(A2, 0.0, Rr, 0.6, 1.5);
    arcStrip(8.7, 9.5, lo, hi, { round: 0.26, tone: 1.46, hatch: ang((A1 + A2) / 2) + 4, shadow: 0.42, band: 0.14 });
    arcStrip(Rr - 1.0, Rr + 0.46, lo, hi, { round: 0.34, tone: 1.56, hatch: ang((A1 + A2) / 2) + 4, shadow: 0.5, band: 0.14 });

    // The ivory scale let into the limb, cut to a half degree, every fifth long.
    arcStrip(Rr - 0.2, Rr + 0.3, A1 + 0.01, A2 - 0.01, { round: 0.1, tone: 2.5, hatch: ang((A1 + A2) / 2) + 90, shadow: 0, band: 0.05, spacing: 0.76 });
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const a = A1 + 0.015 + ((A2 - A1 - 0.03) * i) / N, l = i % 10 === 0 ? 0.44 : i % 5 === 0 ? 0.32 : 0.18;
      line([Q(a, Rr + 0.28), Q(a, Rr + 0.28 - l)], { w: i % 10 === 0 ? 0.05 : 0.026, v: 0.8, dark: true, taper: false });
    }

    // Decorative stepped feet, brass, at the arc's ends.
    for (const a of [A1, A2]) limb([[...Q(a, Rr + 0.4), 0.2], [...Q(a, Rr + 0.76), 0.38], [...Q(a, Rr + 1.0), 0.14]], { tone: 1.3, shadow: 0.3, melt: 0 });

    // The sight vane on the near bar, the shades hinged beside it.
    const sa = A2 - 0.015;
    const sv = Q(sa, 6.6);
    const su = [Math.cos(A2), Math.sin(A2)], sn = [su[1], -su[0]];
    limb([[sv[0] - sn[0] * 0.5, sv[1] - sn[1] * 0.5, 0.18], [sv[0] + sn[0] * 1.2, sv[1] + sn[1] * 1.2, 0.18]], { tone: 1.3, shadow: 0.3, melt: 0 });
    blob(disc([sv[0] + sn[0] * 1.5, sv[1] + sn[1] * 1.5], 0.42), { round: 0.2, tone: 1.3, hatch: 30, shadow: 0.3, band: 0.06 });
    limb([[sv[0] + sn[0] * 1.5, sv[1] + sn[1] * 1.5, 0.14], [sv[0] + sn[0] * 1.51, sv[1] + sn[1] * 1.5, 0.14]], { tone: 0.1, shadow: 0, melt: 0 });

    // The horizon glass on Beta: a square frame standing off the bar.
    const hg = [bet[0], bet[1]], hu = [Math.cos(A1), Math.sin(A1)], hn = [-hu[1], hu[0]];
    const HG = (a, b) => [hg[0] + hu[0] * a + hn[0] * b, hg[1] + hu[1] * a + hn[1] * b];
    const out = HG(0, 0.6)[1] < hg[1] ? -1 : 1;
    void out;
    blob([[...HG(-1.0, -1.0), 'c'], [...HG(1.0, -1.0), 'c'], [...HG(1.0, 1.0), 'c'], [...HG(-1.0, 1.0), 'c']], { round: 0.18, tone: 1.9, hatch: ang(A1) + 40, shadow: 0.4, band: 0.1 });
    blob([[...HG(-0.7, -0.7), 'c'], [...HG(0.7, -0.7), 'c'], [...HG(0.7, 0.7), 'c'], [...HG(-0.7, 0.7), 'c']], { round: 0.1, tone: 0.5, hatch: ang(A1) + 90, shadow: 0, band: 0.06 });
    line([HG(-0.5, 0.1), HG(0.3, 0.5)], { w: 0.07, v: 0.7 });
    for (const [a, b] of [[-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0]]) { const p = HG(a * 0.84, b * 0.84); limb([[p[0], p[1], 0.07], [p[0] + 0.01, p[1], 0.07]], { tone: 1.3, shadow: 0, melt: 0 }); }

    // The index arm in pale brass, laid over the frame to the arc, with its tangent clamp.
    const ix = A1 + (A2 - A1) * 0.56;
    const IU = [Math.cos(ix), Math.sin(ix)], IN = [-IU[1], IU[0]], I = (r, o) => [piv[0] + IU[0] * r + IN[0] * o, piv[1] + IU[1] * r + IN[1] * o];
    blob([I(-0.2, 0.9), I(1.4, 0.56), I(Rr - 2.4, 0.38), I(Rr - 1.0, 0.86), [...I(Rr + 0.42, 1.0), 'c'], [...I(Rr + 0.42, -1.0), 'c'], I(Rr - 1.0, -0.86), I(Rr - 2.4, -0.38), I(1.4, -0.56), I(-0.2, -0.9)], {
      round: 0.2, tone: 2.0, hatch: ang(ix) + 88, shadow: 0.56, band: 0.1, spacing: 0.86,
      creases: [{ pts: [I(1.6, 0), I(Rr - 2.4, 0)], w: 0.04, depth: 0.08 }, { pts: [I(1.5, 0.28), I(Rr - 2.6, 0.2)], w: 0.02, depth: 0.03 }, { pts: [I(1.5, -0.28), I(Rr - 2.6, -0.2)], w: 0.02, depth: 0.03 }],
    });
    // The vernier window and the warm thumbscrew.
    blob([[...I(Rr - 0.26, 0.74), 'c'], [...I(Rr + 0.34, 0.74), 'c'], [...I(Rr + 0.34, -0.74), 'c'], [...I(Rr - 0.26, -0.74), 'c']], { round: 0.06, tone: 0.6, hatch: 12, shadow: 0, band: 0.04 });
    for (let i = -4; i <= 4; i++) line([I(Rr + 0.3, i * 0.15), I(Rr + 0.3 - (i % 2 ? 0.2 : 0.34), i * 0.15)], { w: 0.022, v: 0.85, taper: false });
    limb([[...I(Rr - 1.6, -0.3), 0.12], [...I(Rr - 1.6, -1.6), 0.1]], { tone: 1.3, shadow: 0.3, melt: 0 });
    blob(disc(I(Rr - 1.6, -1.9), 0.5), { round: 0.26, tone: 1.4, warm: 0.84, hatch: 20, shadow: 0.34, band: 0.08, creases: [{ pts: [I(Rr - 2.0, -1.9), I(Rr - 1.2, -1.9)], w: 0.03, depth: 0.05 }, { pts: [I(Rr - 1.6, -2.3), I(Rr - 1.6, -1.5)], w: 0.03, depth: 0.05 }] });

    // The index mirror on its pivot at Nu.
    const mr = [[...I(-1.0, -1.2), 'c'], [...I(0.8, -1.2), 'c'], [...I(0.8, 1.2), 'c'], [...I(-1.0, 1.2), 'c']];
    blob(mr, { round: 0.18, tone: 1.9, hatch: ang(ix) + 30, shadow: 0.5, band: 0.1 });
    blob([[...I(-0.76, -0.92), 'c'], [...I(0.56, -0.92), 'c'], [...I(0.56, 0.92), 'c'], [...I(-0.76, 0.92), 'c']], { round: 0.1, tone: 0.5, hatch: ang(ix) + 80, shadow: 0, band: 0.06 });
    line([I(-0.5, -0.5), I(0.2, 0.5)], { w: 0.07, v: 0.7 });
    blob(disc(piv, 0.46), { round: 0.2, tone: 1.4, hatch: 30, shadow: 0.34, band: 0.06 });
    line([[piv[0] - 0.3, piv[1]], [piv[0] + 0.3, piv[1]]], { w: 0.07, v: 0.7, dark: true, taper: false });
  },
};
