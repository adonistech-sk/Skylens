// The Sculptor's Bench: a long trestle banker with a finished bust on its turntable and an uncut
// block at the working end. Alpha and Delta lie along the bench top, Gamma and Beta on the far
// trestle's two legs. The iron ring of the mallet is the warm note.
export default {
  tier: 'extended',
  subject: "The Sculptor's Bench",
  pixels: 1000,
  anchors: [['α Scl', 'bench end'], ['δ Scl', 'bench top'], ['γ Scl', 'trestle leg'], ['β Scl', 'trestle leg']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Scl'), del = s('δ Scl'), gam = s('γ Scl'), bet = s('β Scl');
    const d = [del[0] - alp[0], del[1] - alp[1]], l = Math.hypot(...d), U = [d[0] / l, d[1] / l], V = [-U[1], U[0]];
    const S = (a, b) => [alp[0] + U[0] * a + V[0] * b, alp[1] + U[1] * a + V[1] * b];
    const R = (p) => { const x = p[0] - alp[0], y = p[1] - alp[1]; return [x * U[0] + y * U[1], x * V[0] + y * V[1]]; };
    const tilt = (Math.atan2(-U[1], U[0]) * 180) / Math.PI;
    const box = (a0, b0, a1, b1, o = {}) => blob([[...S(a0, b0), 'c'], [...S(a1, b0), 'c'], [...S(a1, b1), 'c'], [...S(a0, b1), 'c']], { round: 0.3, band: 0.2, hatch: tilt + 4, shadow: 0.42, ...o });

    // The two trestles. Gamma and Beta sit on the far pair, read back into the bench's frame.
    const rg = R(gam), rb = R(bet);
    const legFrom = (ra, b0, b1, a0) => {
      const a1 = ra[0] + ((ra[0] - a0) * (b1 - ra[1])) / (ra[1] - b0);
      return [[a0, b0], [a1, b1]];
    };
    const tleg = (pa, pb, tone) => limb([[...S(...pa), 0.5], [...S((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2), 0.54], [...S(...pb), 0.48]], { flat: 0.5, tone, hatch: tilt + 84, shadow: 0.4, melt: 0, band: 0.2, creases: [{ pts: [S(...pa), S(...pb)], w: 0.05, depth: 0.06 }] });
    const [fa, fb] = legFrom(rb, -1.0, -11.4, 18.6), [ga, gb] = legFrom(rg, -1.0, -11.4, 19.6);
    limb([[...S(fb[0] + 1.0, -7.2), 0.26], [...S(gb[0] - 1.0, -7.2), 0.26]], { flat: 0.6, tone: 1.2, hatch: tilt + 4, shadow: 0.3, melt: 0 });
    tleg(fa, fb, 1.3);
    tleg(ga, gb, 1.36);
    tleg([3.4, -1.0], [0.8, -11.4], 1.3);
    tleg([4.6, -1.0], [7.2, -11.4], 1.36);
    limb([[...S(1.8, -7.2), 0.26], [...S(6.2, -7.2), 0.26]], { flat: 0.6, tone: 1.2, hatch: tilt + 4, shadow: 0.3, melt: 0 });
    // The long stretcher and a shelf of rough stock.
    limb([[...S(4.4, -5.0), 0.3], [...S(20.0, -5.0), 0.3]], { flat: 0.6, tone: 1.2, hatch: tilt + 4, shadow: 0.3, melt: 0, creases: [{ pts: [S(4.6, -5.0), S(19.6, -5.0)], w: 0.04, depth: 0.06 }] });
    limb([[...S(9.8, -1.2), 0.2], [...S(4.6, -4.9), 0.18]], { flat: 0.6, tone: 1.16, shadow: 0.3, melt: 0 });
    limb([[...S(13.2, -1.2), 0.2], [...S(19.0, -4.9), 0.18]], { flat: 0.6, tone: 1.16, shadow: 0.3, melt: 0 });

    // The thick plank of the bench, chamfered, with its grain and the old cuts in it.
    box(-1.7, -1.2, 23.6, 0.14, {
      tone: 1.76, round: 0.5, band: 0.2,
      creases: [
        { pts: [S(-1.5, -0.3), S(8, -0.26), S(23.4, -0.3)], w: 0.04, depth: 0.08 },
        { pts: [S(-1.4, -0.7), S(6, -0.76), S(14, -0.66), S(23.3, -0.72)], w: 0.03, depth: 0.05 }, { pts: [S(0.6, -0.94), S(11, -0.98), S(22, -0.94)], w: 0.03, depth: 0.05 },
        { pts: [S(11, -0.1), S(11.2, -1.0)], w: 0.04, depth: 0.06 },
      ],
    });
    for (const a of [-1.0, 3.8, 8.6, 13.4, 18.2, 22.8]) { const p = S(a, -0.46); limb([[p[0], p[1], 0.13], [p[0] + 0.01, p[1], 0.13]], { tone: 1.5, shadow: 0.1, melt: 0 }); }

    // The turntable and socle.
    const c = 7.4;
    const T = (a, b) => S(c + a, b);
    box(c - 3.6, 0.14, c + 3.6, 0.76, { tone: 1.9, round: 0.2 });
        blob([[...T(-2.2, 0.76), 'c'], [...T(2.2, 0.76), 'c'], [...T(2.0, 1.2)], [...T(1.2, 1.6)], [...T(1.0, 2.3)], [...T(1.5, 2.9)], [...T(-1.5, 2.9)], [...T(-1.0, 2.3)], [...T(-1.2, 1.6)], [...T(-2.0, 1.2)]], {
      round: 0.56, tone: 1.6, hatch: tilt + 86, shadow: 0.4, band: 0.16, creases: [{ pts: [T(-1.2, 1.6), T(0, 1.5), T(1.2, 1.6)], w: 0.04, depth: 0.07 }],
    });

    // The bust: a truncated chest and shoulder, draped, the head in calm profile to the east.
    limb([[...T(0.5, 6.0), 1.54], [...T(0.4, 7.4), 1.3], [...T(0.3, 8.2), 1.3]], {
      tone: 1.5, hatch: tilt + 80, shadow: 0.5, band: 0.2,
      creases: [{ pts: [T(-0.9, 7.4), T(-0.3, 6.6), T(0.1, 5.6)], w: 0.06, depth: 0.08 }],
    });
    blob([T(-0.9, 6.7), T(-2.4, 6.3), [...T(-3.8, 5.3), 'c'], T(-3.5, 4.5), T(-2.6, 3.7), [...T(-1.4, 2.9), 'c'], T(0.4, 2.7), [...T(2.2, 2.9), 'c'], T(3.3, 3.7), T(4.3, 4.5), [...T(4.7, 5.3), 'c'], T(3.2, 6.3), T(1.8, 6.7), T(0.5, 6.9)], {
      round: 1.2, tone: 1.5, hatch: tilt + 50, shadow: 0.56, band: 0.24,
      creases: [
        { pts: [T(-2.9, 5.7), T(-1.0, 4.6), T(0.8, 3.9), T(1.9, 3.1)], w: 0.1, depth: 0.14 }, { pts: [T(-1.8, 6.2), T(0.1, 5.0), T(2.0, 4.3), T(3.0, 3.8)], w: 0.1, depth: 0.14 },
        { pts: [T(-0.6, 6.4), T(1.2, 5.5), T(2.8, 4.9), T(3.9, 4.6)], w: 0.09, depth: 0.12 }, { pts: [T(-2.9, 4.6), T(-1.6, 3.9), T(-0.5, 3.1)], w: 0.08, depth: 0.1 },
        { pts: [T(2.4, 6.2), T(3.2, 5.7), T(4.2, 5.2)], w: 0.07, depth: 0.1 },
      ],
    });
    // Head.
    blob([T(1.7, 8.0), T(2.2, 9.4), T(2.1, 10.8), T(1.2, 11.8), T(-0.1, 12.2), T(-1.3, 11.8), T(-1.96, 10.9), T(-2.0, 10.1), T(-2.36, 9.5), [...T(-2.62, 9.08), 'c'], T(-2.16, 8.9), T(-2.24, 8.54), T(-2.04, 8.3), T(-2.16, 8.04), T(-1.9, 7.5), T(-1.2, 7.2), T(-0.2, 7.5), T(0.8, 7.7)], {
      round: 1.2, tone: 1.56, hatch: tilt + 30, shadow: 0.5, band: 0.2,
      creases: [
        { pts: [T(-1.94, 9.9), T(-1.5, 10.0), T(-1.1, 9.8)], w: 0.05, depth: 0.1 }, { pts: [T(-1.7, 9.6), T(-1.4, 9.5), T(-1.1, 9.56)], w: 0.04, depth: 0.08 },
        { pts: [T(-2.1, 8.42), T(-1.6, 8.4), T(-1.4, 8.26)], w: 0.04, depth: 0.08 }, { pts: [T(-2.2, 8.94), T(-1.9, 9.0), T(-1.76, 9.2)], w: 0.04, depth: 0.08 },
        { pts: [T(-0.5, 7.5), T(0.0, 8.0), T(0.4, 8.8)], w: 0.05, depth: 0.08 },
        { pts: [T(0.1, 9.9), T(0.5, 10.0), T(0.6, 9.4), T(0.3, 9.0), T(0.0, 9.2)], w: 0.05, depth: 0.1 },
      ],
    });
    // The hair, cut in short carved waves.
    const waves = [
      [T(-1.8, 10.9), T(-1.2, 11.2), T(-0.6, 10.9)], [T(-1.5, 11.5), T(-0.8, 11.8), T(-0.1, 11.4)], [T(-0.5, 12.1), T(0.3, 12.1), T(0.9, 11.6)],
      [T(-0.5, 11.0), T(0.1, 11.1), T(0.7, 10.6)], [T(0.4, 11.5), T(1.1, 11.3), T(1.5, 10.7)], [T(1.0, 10.5), T(1.6, 10.2), T(1.9, 9.6)],
      [T(1.0, 9.6), T(1.6, 9.3), T(1.8, 8.6)], [T(1.1, 8.9), T(1.5, 8.5), T(1.5, 8.0)], [T(-1.2, 10.7), T(-0.7, 10.6), T(-0.2, 10.3)],
    ];
    for (const w of waves) {
      line(w, { w: 0.09, v: 0.72 });
      line(w.map((p) => [p[0] + 0.1, p[1] - 0.1]), { w: 0.05, v: 0.3, dark: true });
    }

    // The block at the working end, rough-pointed, a corner already roughed away.
    const pts = [[...S(17.0, 0.14), 'c'], [...S(22.2, 0.14), 'c'], [...S(22.5, 1.6), 'c'], [...S(22.0, 3.0), 'c'], [...S(22.3, 4.6), 'c'], [...S(20.6, 5.5), 'c'], [...S(19.0, 5.1), 'c'], [...S(17.8, 5.3), 'c'], [...S(17.2, 3.4), 'c'], [...S(17.6, 2.2), 'c'], [...S(16.8, 1.0), 'c']];
    const picks = [];
    for (let i = 0; i < 46; i++) { const a = 17.4 + ((i * 7) % 47) / 10, b = 0.6 + ((i * 13) % 45) / 10; if (a + b > 25.7 || (a < 18.2 && b > 3.2)) continue; picks.push({ pts: [S(a, b), S(a + 0.22, b - 0.34)], w: 0.03, depth: 0.05 }); }
    blob(pts, { round: 0.5, tone: 1.76, hatch: tilt + 60, shadow: 0.5, band: 0.2, creases: [...picks, { pts: [S(18.0, 4.5), S(19.6, 3.6), S(21.2, 5.1)], w: 0.05, depth: 0.1 }, { pts: [S(19.6, 3.6), S(19.8, 0.4)], w: 0.05, depth: 0.08 }] });
    // Chips fallen on the bench.
    for (const [a, r] of [[15.4, 0.22], [16.2, 0.16], [14.6, 0.14], [22.8, 0.16]]) blob([[...S(a - r, 0.14), 'c'], [...S(a + r, 0.14), 'c'], [...S(a, 0.14 + r), 'c']], { round: 0.05, tone: 1.8, shadow: 0.2, band: 0.04 });

    // Mallet and chisel laid on the bench between bust and block.
    const m0 = [13.2, 0.72];
    limb([[...S(m0[0], m0[1]), 0.56], [...S(m0[0] + 0.7, m0[1]), 0.62], [...S(m0[0] + 1.6, m0[1]), 0.6], [...S(m0[0] + 2.2, m0[1]), 0.54]], { tone: 1.5, hatch: tilt + 84, shadow: 0.44, melt: 0, band: 0.2, creases: [{ pts: [S(m0[0] + 0.14, 1.2), S(m0[0] + 0.14, 0.2)], w: 0.04, depth: 0.08 }, { pts: [S(m0[0] + 2.04, 1.2), S(m0[0] + 2.04, 0.2)], w: 0.04, depth: 0.08 }] });
    limb([[...S(m0[0] + 1.1, 0.8), 0.15], [...S(m0[0] - 3.2, 0.42), 0.17], [...S(m0[0] - 3.5, 0.4), 0.2]], { tone: 1.4, hatch: tilt + 84, shadow: 0.34, melt: 0 });
    for (const a of [0.08, 1.96]) box(m0[0] + a, 0.16, m0[0] + a + 0.2, 1.3, { tone: 2.2, warm: 0.84, round: 0.06, shadow: 0.16, band: 0.04, hatch: tilt + 84 });
    void bet; void gam;
  },
};
