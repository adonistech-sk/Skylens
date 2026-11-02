// The Carpenter's Square, wooden and braced. Epsilon is at the corner, Delta along one arm, Gamma
// along the other, and Eta on the diagonal brace that keeps the square true. Scales are cut along
// both arms, and the warm note is the small brass corner plate.
export default {
  tier: 'extended',
  subject: "The Carpenter's Square",
  pixels: 1000,
  anchors: [['ε Nor', 'corner'], ['δ Nor', 'arm'], ['γ² Nor', 'arm'], ['η Nor', 'brace']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const eps = s('ε Nor'), del = s('δ Nor');
    const d = [del[0] - eps[0], del[1] - eps[1]], l = Math.hypot(...d), U = [d[0] / l, d[1] / l], V = [U[1], -U[0]];
    const S = (a, b) => [eps[0] + U[0] * a + V[0] * b, eps[1] + U[1] * a + V[1] * b];
    const ang = (Math.atan2(-U[1], U[0]) * 180) / Math.PI;
    const LEN = 11.0, H = 0.84;
    const grain = (a0, b0, a1, b1, n) => Array.from({ length: n }, (_, i) => { const t = (i + 0.5) / n; const m = 0.1 * Math.sin(i * 2.3); return { pts: [S(a0 + (a1 - a0) * 0 + (b1 === b0 ? 0 : (a1 - a0) * t), b0 + (b1 === b0 ? (b1 - b0) * 0 + (i - n / 2 + 0.5) * ((H * 1.6) / n) : 0)), S(a1 * 0.5 + a0 * 0.5 + (b1 === b0 ? 0 : (a1 - a0) * t) + m, (b0 + b1) / 2 + (b1 === b0 ? (i - n / 2 + 0.5) * ((H * 1.6) / n) + m * 0.4 : 0)), S(a1 - (b1 === b0 ? 0 : (a1 - a0) * (1 - t)), b1 + (b1 === b0 ? (i - n / 2 + 0.5) * ((H * 1.6) / n) : 0))], w: 0.024, depth: 0.04 }; });

    // The brace, seated behind both arms, its ends cut square. Eta lies on it.
    const B0 = S(6.9, -0.1), B1 = S(-0.1, 6.7);
    const bd = [B1[0] - B0[0], B1[1] - B0[1]], bl = Math.hypot(...bd), bu = [bd[0] / bl, bd[1] / bl], bn = [-bu[1], bu[0]];
    const Br = (t, o) => [B0[0] + bu[0] * t + bn[0] * o, B0[1] + bu[1] * t + bn[1] * o];
    const bg = [-0.3, -0.12, 0.08, 0.26].map((o) => ({ pts: [Br(0.4, o), Br(bl * 0.5, o + 0.06), Br(bl - 0.4, o)], w: 0.024, depth: 0.04 }));
    blob([[...Br(0, 0.56), 'c'], [...Br(bl, 0.56), 'c'], [...Br(bl, -0.56), 'c'], [...Br(0, -0.56), 'c']], { round: 0.3, tone: 1.4, hatch: ang + 42 + 86, shadow: 0.4, band: 0.14, creases: bg });

    // The arms: one long blade laid over a stock.
    blob([[...S(-H, -H), 'c'], [...S(LEN, -H), 'c'], [...S(LEN, H), 'c'], [...S(-H, H), 'c']], {
      round: 0.34, tone: 1.56, hatch: ang + 88, shadow: 0.5, band: 0.14, creases: grain(0.2, 0, LEN - 0.2, 0, 7),
    });
    blob([[...S(-H, -H), 'c'], [...S(H, -H), 'c'], [...S(H, LEN), 'c'], [...S(-H, LEN), 'c']], {
      round: 0.34, tone: 1.66, hatch: ang + 2, shadow: 0.5, band: 0.14,
      creases: [-0.5, -0.3, -0.06, 0.2, 0.46].map((a) => ({ pts: [S(a, 1.0), S(a + 0.06, LEN * 0.56), S(a, LEN - 0.2)], w: 0.024, depth: 0.04 })),
    });

    // Scales along the outer edges, each tenth cut long.
    for (let i = 1; i <= 40; i++) {
      const t = i * 0.26, k = i % 5 === 0 ? 0.5 : 0.24;
      line([S(t, -H + 0.03), S(t, -H + 0.03 + k)], { w: 0.022, v: 0.8, taper: false });
      if (i % 5 === 0) line([S(t + 0.05, H - 0.03), S(t + 0.05, H - 0.34)], { w: 0.022, v: 0.6, taper: false });
    }
    for (let i = 1; i <= 40; i++) {
      const t = i * 0.26, k = i % 5 === 0 ? 0.5 : 0.24;
      line([S(-H + 0.03, t), S(-H + 0.03 + k, t)], { w: 0.022, v: 0.8, taper: false });
      if (i % 5 === 0) line([S(H - 0.03, t + 0.05), S(H - 0.34, t + 0.05)], { w: 0.022, v: 0.6, taper: false });
    }

    // Pegs where the brace meets each arm, and a hanging hole in the blade.
    const peg = (p) => { limb([[p[0], p[1], 0.17], [p[0] + 0.01, p[1], 0.17]], { tone: 1.3, shadow: 0.2, melt: 0 }); limb([[p[0], p[1], 0.07], [p[0] + 0.01, p[1], 0.07]], { tone: 0.5, shadow: 0, melt: 0 }); };
    peg(S(6.0, 0.1)); peg(S(0.1, 5.8));
    const hole = S(LEN - 0.7, 0);
    limb([[hole[0], hole[1], 0.24], [hole[0] + 0.01, hole[1], 0.24]], { tone: 0.06, shadow: 0, melt: 0 });

    // The brass corner plate, with its three pins.
    blob([[...S(-H - 0.1, -H - 0.1), 'c'], [...S(H + 1.3, -H - 0.1), 'c'], [...S(H + 1.3, -H + 0.5)], [...S(H - 0.2, H - 0.3)], [...S(-H + 0.5, H + 1.3)], [...S(-H - 0.1, H + 1.3), 'c']], {
      round: 0.16, tone: 1.7, warm: 0.84, hatch: ang + 44, shadow: 0.44, band: 0.08,
      creases: [{ pts: [S(-H + 0.1, H + 1.0), S(-H + 0.1, -H + 0.1), S(H + 1.0, -H + 0.1)], w: 0.03, depth: 0.05 }],
    });
    for (const p of [S(-0.58, -0.58), S(1.3, -0.5), S(-0.5, 1.3)]) limb([[p[0], p[1], 0.11], [p[0] + 0.01, p[1], 0.11]], { tone: 1.32, warm: 0.5, shadow: 0.12, melt: 0 });
  },
};
