// The Ship's Compass, a wind rose in a brass bowl hung in gimbals in its wooden box. Beta is the
// pivot of the card, Alpha lies on the north point, Gamma at the fleur-de-lis on the rim, and Naos,
// far out, on the rim to the south-east. The fleur-de-lis is the warm note.
export default {
  tier: 'extended',
  subject: "The Ship's Compass",
  pixels: 1000,
  anchors: [['β Pyx', 'pivot'], ['α Pyx', 'north point'], ['γ Pyx', 'north mark'], ['Naos', 'rim']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β Pyx'), gam = s('γ Pyx'), nao = s('Naos');
    // Centre equidistant from Gamma and Naos, on the line of the needle.
    const c = [-0.92, -1.48];
    const R = (Math.hypot(gam[0] - c[0], gam[1] - c[1]) + Math.hypot(nao[0] - c[0], nao[1] - c[1])) / 2;
    const north = Math.atan2(gam[1] - c[1], gam[0] - c[0]);
    const Q = (bearing, r) => { const a = north - (bearing * Math.PI) / 180; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; };
    const disc = (p, r, n = 32) => Array.from({ length: n }, (_, i) => [p[0] + Math.cos((i / n) * Math.PI * 2) * r, p[1] + Math.sin((i / n) * Math.PI * 2) * r]);
    const hatchN = (Math.atan2(-Math.sin(north), Math.cos(north)) * 180) / Math.PI;

    // The box, square to the ship, joined at the corners with brass.
    const W = R + 3.3;
    const B = (x, y) => { const u = [Math.cos(north), Math.sin(north)], n = [-u[1], u[0]]; return [c[0] + u[0] * y + n[0] * x, c[1] + u[1] * y + n[1] * x]; };
    const seams = [];
    for (let i = 1; i < 7; i++) { const k = -W + (i * W) / 3.5; seams.push({ pts: [B(-W + 0.2, k), B(-W + 2.0, k + 0.1), B(-W + 3.0, k)], w: 0.03, depth: 0.05 }); seams.push({ pts: [B(W - 3.0, k), B(W - 2.0, k - 0.1), B(W - 0.2, k)], w: 0.03, depth: 0.05 }); }
    blob([[...B(-W, -W), 'c'], [...B(W, -W), 'c'], [...B(W, W), 'c'], [...B(-W, W), 'c']], { round: 0.8, tone: 1.46, hatch: hatchN + 86, shadow: 0, band: 0.3, creases: [...seams, { pts: [B(-W + 0.46, -W + 0.46), B(W - 0.46, -W + 0.46)], w: 0.05, depth: 0.08 }, { pts: [B(W - 0.46, -W + 0.46), B(W - 0.46, W - 0.46)], w: 0.05, depth: 0.08 }, { pts: [B(W - 0.46, W - 0.46), B(-W + 0.46, W - 0.46)], w: 0.05, depth: 0.08 }, { pts: [B(-W + 0.46, W - 0.46), B(-W + 0.46, -W + 0.46)], w: 0.05, depth: 0.08 }] });
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      blob([[...B(sx * W, sy * W), 'c'], [...B(sx * (W - 2.2), sy * W), 'c'], [...B(sx * W, sy * (W - 2.2)), 'c']], { round: 0.12, tone: 2.0, hatch: 40, shadow: 0.3, band: 0.08 });
      const p = B(sx * (W - 0.7), sy * (W - 0.7));
      limb([[p[0], p[1], 0.12], [p[0] + 0.01, p[1], 0.12]], { tone: 0.6, shadow: 0.1, melt: 0 });
    }

    // Outer gimbal ring and the pivots that carry it.
    blob(disc(c, R + 2.1, 48), { round: 0.3, tone: 1.8, hatch: 20, shadow: 0.5, band: 0.12 });
    blob(disc(c, R + 1.56, 48), { round: 0.2, tone: 0.6, hatch: 70, shadow: 0, band: 0.1 });
    for (const sg of [-1, 1]) limb([[...B(sg * (R + 0.6), 0), 0.34], [...B(sg * (R + 2.5), 0), 0.34]], { flat: 0.7, tone: 1.4, hatch: hatchN, shadow: 0.34, melt: 0 });
    for (const sg of [-1, 1]) { const p = B(sg * (R + 2.5), 0); limb([[p[0], p[1], 0.5], [p[0] + 0.01, p[1], 0.5]], { tone: 1.4, shadow: 0.34, melt: 0 }); }

    // The bowl's heavy rim, a band of brass with a bright lip.
    blob(disc(c, R + 0.86, 48), { round: 0.56, tone: 1.9, hatch: 20, shadow: 0.6, band: 0.14 });

    // The card.
    blob(disc(c, R + 0.2, 48), { round: 0.1, tone: 2.2, hatch: 40, shadow: 0.3, band: 0.1, spacing: 1.4 });
    // The bearing ring, cut to the quarter point.
    for (let i = 0; i < 128; i++) {
      const b = (i / 128) * 360, big = i % 8 === 0, mid = i % 4 === 0;
      line([Q(b, R + 0.08), Q(b, R - (big ? 0.76 : mid ? 0.5 : 0.28))], { w: big ? 0.07 : 0.03, v: 0.7, taper: false });
    }
    for (const r of [R - 0.9, R - 1.0]) line(disc(c, r, 90).concat([disc(c, r, 90)[0]]), { w: 0.03, v: 0.6, taper: false });
    for (const r of [2.4]) line(disc(c, r, 60).concat([disc(c, r, 60)[0]]), { w: 0.03, v: 0.5, taper: false });

    // The rose: every point is two facets, a lit one and a shaded one.
    const point = (b, len, width, light, dark, inner = 0.2) => {
      const tip = Q(b, len), left = Q(b - 45, width), right = Q(b + 45, width), hub = Q(b, inner);
      blob([[...tip, 'c'], [...hub, 'c'], [...left, 'c']], { round: 0.1, tone: light, hatch: hatchN - b + 12, shadow: 0.1, band: 0.08, spacing: 0.86 });
      blob([[...tip, 'c'], [...right, 'c'], [...hub, 'c']], { round: 0.1, tone: dark, hatch: hatchN - b + 96, shadow: 0, band: 0.08 });
    };
    const len = R - 1.1;
    for (let i = 0; i < 16; i++) point(11.25 + i * 22.5, len * 0.5, 0.74, 1.8, 0.7);
    for (let i = 0; i < 8; i++) point(22.5 + i * 45, len * 0.76, 1.1, 2.0, 0.66);
    for (let i = 0; i < 4; i++) point(45 + i * 90, len * 0.9, 1.5, 2.3, 0.56);
    for (let i = 0; i < 4; i++) point(i * 90, len, 1.9, 3.0, 0.5);
    for (let i = 0; i < 8; i++) { const p = Q(22.5 + 45 * i, len * 0.8 + 0.3); limb([[p[0], p[1], 0.07], [p[0] + 0.01, p[1], 0.07]], { tone: 1.3, shadow: 0, melt: 0 }); }

    // The fleur-de-lis at north, on Gamma.
    const F = (o, r) => { const u = [Math.cos(north), Math.sin(north)], n = [-u[1], u[0]]; return [c[0] + u[0] * r + n[0] * o, c[1] + u[1] * r + n[1] * o]; };
    const r0 = R - 1.1;
    blob([F(0, r0 + 2.1), F(0.46, r0 + 1.0), F(0.3, r0 + 0.3), F(-0.3, r0 + 0.3), F(-0.46, r0 + 1.0)].map((p, i) => (i === 0 ? [...p, 'c'] : p)), { round: 0.2, tone: 1.6, warm: 0.84, hatch: hatchN + 90, shadow: 0.34, band: 0.06 });
    for (const sg of [-1, 1]) limb([[...F(sg * 0.2, r0 + 0.2), 0.14], [...F(sg * 0.74, r0 + 0.6), 0.22], [...F(sg * 1.0, r0 + 1.26), 0.17], [...F(sg * 0.8, r0 + 1.56), 0.03]], { tone: 1.6, warm: 0.84, shadow: 0.3, melt: 0, band: 0.06 });
    limb([[...F(-0.6, r0 + 0.4), 0.1], [...F(0.6, r0 + 0.4), 0.1]], { tone: 1.5, warm: 0.84, shadow: 0.2, melt: 0 });

    // The pivot cap at the centre of the card, over Beta.
    blob(disc(c, 0.66), { round: 0.3, tone: 1.5, hatch: 20, shadow: 0.5, band: 0.08 });
    blob(disc(c, 0.3), { round: 0.14, tone: 1.3, hatch: 60, shadow: 0.2, band: 0.05 });
    void bet;
  },
};
