// The Telescope, a brass refractor on a turned pillar and folding tripod. Alpha and Epsilon both lie
// on the main tube, the two stars of its line along the barrel, and Zeta on the pillar below. The
// focusing knob is the warm note.
export default {
  tier: 'extended',
  subject: 'The Telescope',
  pixels: 1000,
  anchors: [['α Tel', 'tube'], ['ε Tel', 'tube'], ['ζ Tel', 'pillar']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Tel'), eps = s('ε Tel'), zet = s('ζ Tel');
    const mid = [(alp[0] + eps[0]) / 2 - 0.05, (alp[1] + eps[1]) / 2];
    const tilt = 13, q = (tilt * Math.PI) / 180, u = [Math.cos(q), Math.sin(q)], n = [-u[1], u[0]];
    const T = (a, o = 0) => [mid[0] + u[0] * a + n[0] * o, mid[1] + u[1] * a + n[1] * o];
    const h = 90 - tilt;
    const px = zet[0] + 0.1, base = -3.4;
    const seg = (pts, o = {}) => limb(pts, { tone: 1.3, hatch: h, shadow: 0.42, melt: 0, band: 0.1, ...o });

    // The three legs of the tripod, the back one first.
    const leg = (foot, tone) => {
      limb([[px, base + 0.1, 0.3], [(px + foot[0]) / 2 + (foot[0] < px ? 0.5 : foot[0] > px ? -0.5 : 0), base - 1.4, 0.34], [foot[0], foot[1] + 0.3, 0.17]], { tone, hatch: 76, shadow: 0.4, melt: 0, band: 0.1, creases: [{ pts: [[px, base], [(px + foot[0]) / 2, base - 1.5], foot], w: 0.03, depth: 0.05 }] });
      limb([[foot[0], foot[1] + 0.4, 0.14], [foot[0] + 0.01, foot[1] + 0.14, 0.24], [foot[0] + 0.01, foot[1], 0.1]], { tone: tone * 1.1, shadow: 0.2, melt: 0 });
    };
    leg([px + 0.5, base - 3.6], 1.04);
    leg([px - 5.0, base - 3.4], 1.28);
    leg([px + 4.6, base - 3.4], 1.28);

    // The turned pillar through Zeta.
    limb([[px, base - 0.3, 0.5], [px, base + 0.1, 0.62], [px, base + 0.46, 0.34], [px, zet[1] - 0.2, 0.42], [px, zet[1] + 0.3, 0.54], [px, zet[1] + 0.9, 0.3], [px, -0.3, 0.24], [px, 0.0, 0.36]], {
      tone: 1.4, hatch: 84, shadow: 0.4, melt: 0, band: 0.1,
      creases: [{ pts: [[px - 0.34, base + 0.46], [px + 0.34, base + 0.46]], w: 0.03, depth: 0.06 }, { pts: [[px - 0.26, zet[1] + 0.9], [px + 0.26, zet[1] + 0.9]], w: 0.03, depth: 0.06 }],
    });

    // The altitude arc and its stay.
    const pv = T(-0.6, -0.4);
    const stay = T(2.9, -0.2);
    limb([[px, base + 1.0, 0.1], [stay[0] + 0.1, base + 2.2, 0.1], [stay[0], stay[1], 0.1]], { tone: 1.3, hatch: 40, shadow: 0.34, melt: 0 });
    for (let i = 0; i < 8; i++) { const t = i / 7, x = px + (stay[0] - px) * t * 0.9, y = base + 1.0 + 1.3 * Math.sin(t * 1.3); line([[x, y], [x + 0.12, y + 0.14]], { w: 0.024, v: 0.8, taper: false }); }

    // The fork that carries the tube.
    limb([[px, 0.0, 0.3], [pv[0], pv[1] - 0.4, 0.34]], { tone: 1.4, hatch: 84, shadow: 0.44, melt: 0 });

    // The finder, a small scope riding on top of the main tube.
    limb([[...T(-3.2, 0.92), 0.14], [...T(2.6, 0.92), 0.17]], { flat: 0.7, tone: 1.4, hatch: h, shadow: 0.34, melt: 0, band: 0.06 });
    limb([[...T(2.6, 0.92), 0.22], [...T(3.0, 0.92), 0.22]], { flat: 0.7, tone: 1.5, hatch: h, shadow: 0.3, melt: 0 });
    for (const a of [-2.0, 1.6]) limb([[...T(a, 0.5), 0.1], [...T(a, 0.86), 0.1]], { tone: 1.3, shadow: 0.2, melt: 0 });

    // The main tube, tapering in steps to the eye end.
    seg([[...T(-4.4), 0.42], [...T(-4.1), 0.44], [...T(1.2), 0.58], [...T(5.8), 0.64]], {
      tone: 1.34, band: 0.12,
      creases: [{ pts: [T(-3.9, 0.22), T(1.2, 0.3), T(5.6, 0.32)], w: 0.024, depth: 0.04 }],
    });
    // Rings along it, the mouldings of a good maker.
    for (const a of [-4.2, -1.7, 1.4, 3.6]) seg([[...T(a), 0.5 + (a + 4.2) * 0.022], [...T(a + 0.2), 0.62 + (a + 4.2) * 0.022], [...T(a + 0.4), 0.5 + (a + 4.2) * 0.022]], { tone: 1.5, band: 0.06 });

    // The dew cap and object glass at the sky end.
    seg([[...T(5.7), 0.68], [...T(5.9), 0.82], [...T(6.3), 0.8], [...T(8.6), 0.84], [...T(8.8), 0.94], [...T(9.1), 0.9]], {
      tone: 1.4, band: 0.1,
      creases: [{ pts: [T(6.4, 0.8), T(6.5, -0.8)], w: 0.04, depth: 0.07 }, { pts: [T(8.5, 0.82), T(8.5, -0.82)], w: 0.04, depth: 0.07 }],
    });
    blob([T(9.06, 0.84), T(9.2, 0.5), T(9.26, 0), T(9.2, -0.5), T(9.06, -0.84), T(9.0, 0)], { round: 0.1, tone: 2.0, hatch: h, shadow: 0, band: 0.05 });

    // Draw tube, focusing rack and the eyepiece.
    seg([[...T(-4.5), 0.32], [...T(-7.0), 0.3]], { tone: 1.46, band: 0.06, creases: [...[-5.0, -5.3, -5.6, -5.9, -6.2, -6.5].map((a) => ({ pts: [T(a, 0.3), T(a, 0.1)], w: 0.024, depth: 0.05 }))] });
    seg([[...T(-7.0), 0.34], [...T(-7.2), 0.42], [...T(-7.5), 0.3], [...T(-8.4), 0.26], [...T(-8.8), 0.46], [...T(-9.2), 0.46], [...T(-9.3), 0.28]], { tone: 1.4, band: 0.06 });

    // The focusing knob below the rack.
    const kb = T(-5.3, -0.84);
    limb([[...T(-5.3, -0.3), 0.08], [...kb, 0.08]], { tone: 1.3, shadow: 0.2, melt: 0 });
    blob([0, 45, 90, 135, 180, 225, 270, 315].map((d) => [kb[0] + Math.cos((d * Math.PI) / 180) * 0.36, kb[1] + Math.sin((d * Math.PI) / 180) * 0.36]), { round: 0.2, tone: 1.5, warm: 0.84, hatch: 30, shadow: 0.3, band: 0.05 });

    // The trunnion over the tube.
    blob([0, 45, 90, 135, 180, 225, 270, 315].map((d) => [pv[0] + Math.cos((d * Math.PI) / 180) * 0.5, pv[1] + Math.sin((d * Math.PI) / 180) * 0.5]), { round: 0.24, tone: 1.6, hatch: 30, shadow: 0.4, band: 0.06 });
    line([[pv[0] - 0.3, pv[1]], [pv[0] + 0.3, pv[1]]], { w: 0.05, v: 0.7, dark: true, taper: false });
  },
};
