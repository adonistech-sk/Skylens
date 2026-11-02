// The Southern Cross, a jewelled processional cross. Each of its four stars is the stone set in a
// flared end of an arm: Gacrux at the head, Acrux at the foot, Mimosa and Imai on the two arms.
// Silver for the body, with a thin warm line of gold and warm settings for the stones.
export default {
  tier: 'extended',
  subject: 'The Southern Cross',
  pixels: 1100,
  anchors: [['Acrux', 'foot'], ['Gacrux', 'head'], ['Mimosa', 'arm'], ['Imai', 'arm']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const acr = s('Acrux'), gac = s('Gacrux'), mim = s('Mimosa'), ima = s('Imai');
    // Where the two beams cross.
    const d1 = [gac[0] - acr[0], gac[1] - acr[1]], d2 = [ima[0] - mim[0], ima[1] - mim[1]];
    const k = ((mim[0] - acr[0]) * d2[1] - (mim[1] - acr[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
    const X = [acr[0] + d1[0] * k, acr[1] + d1[1] * k];

    /** One arm, from the crossing out to its star and past it into a flared, three-lobed end. */
    const arm = (star, wide, tone, hatch) => {
      const dx = star[0] - X[0], dy = star[1] - X[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
      const Q = (a, b) => [X[0] + ux * a - uy * b, X[1] + uy * a + ux * b];
      blob([Q(0, wide), Q(l * 0.5, wide * 0.8), Q(l - 0.62, wide * 0.92), [...Q(l - 0.36, wide * 1.7), 'c'], Q(l + 0.1, wide * 1.66), [...Q(l + 0.3, wide * 1.2), 'c'], Q(l + 0.44, wide * 0.66), Q(l + 0.68, 0), Q(l + 0.44, -wide * 0.66), [...Q(l + 0.3, -wide * 1.2), 'c'], Q(l + 0.1, -wide * 1.66), [...Q(l - 0.36, -wide * 1.7), 'c'], Q(l - 0.62, -wide * 0.92), Q(l * 0.5, -wide * 0.8), Q(0, -wide)], {
        round: 0.36, tone, hatch, shadow: 0.5, band: 0.26,
        creases: [
          { pts: [Q(0.62, wide * 0.5), Q(l * 0.5, wide * 0.42), Q(l - 0.7, wide * 0.5)], w: 0.03, depth: 0.05 },
          { pts: [Q(0.62, -wide * 0.5), Q(l * 0.5, -wide * 0.42), Q(l - 0.7, -wide * 0.5)], w: 0.03, depth: 0.05 },
        ],
      });
      // The thin gold rule down the beam.
      line([Q(0.56, wide * 0.5), Q(l * 0.5, wide * 0.42), Q(l - 0.74, wide * 0.5)], { w: 0.012, v: 0.8, warm: 0.76, taper: false });
      line([Q(0.56, -wide * 0.5), Q(l * 0.5, -wide * 0.42), Q(l - 0.74, -wide * 0.5)], { w: 0.012, v: 0.8, warm: 0.76, taper: false });
      // Pearl-work between the rules.
      const n = Math.floor((l - 1.5) / 0.26);
      for (let i = 0; i <= n; i++) {
        const a = 0.68 + i * 0.26;
        const b = Q(a, 0);
        blob([[b[0] - 0.05, b[1]], [b[0], b[1] + 0.05], [b[0] + 0.05, b[1]], [b[0], b[1] - 0.05]], { round: 0.05, tone: 1.14, warm: 0.3, shadow: 0.22 });
      }
      // The setting and its stone, on the star.
      const r = wide * 1.02;
      blob([[star[0] - r, star[1]], [star[0] - r * 0.7, star[1] + r * 0.7], [star[0], star[1] + r], [star[0] + r * 0.7, star[1] + r * 0.7], [star[0] + r, star[1]], [star[0] + r * 0.7, star[1] - r * 0.7], [star[0], star[1] - r], [star[0] - r * 0.7, star[1] - r * 0.7]], { round: r * 0.5, tone: 1.26, warm: 0.74, hatch: 20, shadow: 0.44, band: 0.1 });
      const g = r * 0.68;
      blob([[star[0] - g, star[1]], [star[0], star[1] + g], [star[0] + g, star[1]], [star[0], star[1] - g]], {
        round: g * 0.72, tone: 1.24, hatch: 60, shadow: 0.4, spacing: 0.7, band: 0.08,
        creases: [{ pts: [[star[0] - g * 0.7, star[1]], [star[0] + g * 0.7, star[1]]], w: 0.012, depth: 0.03 }, { pts: [[star[0], star[1] - g * 0.7], [star[0], star[1] + g * 0.7]], w: 0.012, depth: 0.03 }],
      });
    };

    const axis = (Math.atan2(-(gac[1] - acr[1]), gac[0] - acr[0]) * 180) / Math.PI;
    arm(mim, 0.3, 0.98, axis + 90);
    arm(ima, 0.3, 1.04, axis + 90);
    arm(acr, 0.33, 1.08, axis);
    arm(gac, 0.33, 1.14, axis);

    // A quiet rosette where the beams meet: carved, not a jewel, since no star sits here.
    const r = 0.66, ring = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, q = r * (i % 2 ? 0.84 : 1); ring.push([X[0] + Math.cos(a) * q, X[1] + Math.sin(a) * q]); }
    blob(ring, {
      round: 0.42, tone: 1.14, warm: 0.62, hatch: 30, shadow: 0.56, band: 0.14, spacing: 0.8,
      creases: [0, 45, 90, 135].map((d) => { const a = (d * Math.PI) / 180; return { pts: [[X[0] - Math.cos(a) * 0.56, X[1] - Math.sin(a) * 0.56], [X[0], X[1]], [X[0] + Math.cos(a) * 0.56, X[1] + Math.sin(a) * 0.56]], w: 0.03, depth: 0.05 }; }),
    });
    limb([[X[0] - 0.13, X[1], 0.13], [X[0] + 0.13, X[1], 0.13]], { tone: 1.3, warm: 0.8, shadow: 0.3, melt: 0 });
  },
};
