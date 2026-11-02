// The Southern Triangle, drawn as what a surveyor would have called one: a brass A-level. Beta is at
// the apex where the plumb line hangs, Atria and Gamma at the two feet of the frame. A graduated arc
// spans the frame and the warm note is the small plumb bob over its centre mark.
export default {
  tier: 'extended',
  subject: 'The Southern Triangle',
  pixels: 1000,
  anchors: [['β TrA', 'apex'], ['Atria', 'foot'], ['γ TrA', 'foot']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β TrA'), atr = s('Atria'), gam = s('γ TrA');
    const disc = (p, r, n = 14) => Array.from({ length: n }, (_, i) => [p[0] + Math.cos((i / n) * Math.PI * 2) * r, p[1] + Math.sin((i / n) * Math.PI * 2) * r]);
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const ang = (a, b) => (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI;

    // A flat moulded bar, star to star.
    const bar = (a, b, w) => {
      const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), u = [d[0] / l, d[1] / l], n = [-u[1], u[0]];
      const P = (t, o) => [a[0] + u[0] * t + n[0] * o, a[1] + u[1] * t + n[1] * o];
      blob([[...P(-0.2, w), 'c'], [...P(l + 0.2, w), 'c'], [...P(l + 0.2, -w), 'c'], [...P(-0.2, -w), 'c']], {
        round: 0.22, tone: 1.9, hatch: ang(a, b) + 88, shadow: 0.5, band: 0.08, spacing: 0.86,
        creases: [{ pts: [P(0.5, w * 0.5), P(l - 0.5, w * 0.5)], w: 0.024, depth: 0.05 }, { pts: [P(0.5, -w * 0.5), P(l - 0.5, -w * 0.5)], w: 0.024, depth: 0.05 }],
      });
      for (let i = 0; i < 18; i++) { const t = 1.0 + (i * (l - 2)) / 17, sz = i % 2 ? 0.05 : 0.08; limb([[...P(t, 0), sz], [...P(t + 0.01, 0), sz]], { tone: 1.7, shadow: 0, melt: 0 }); }
    };

    // The hanging eye above the apex.
    const eye = [bet[0] + 0.1, bet[1] + 1.5];
    limb([[...eye, 0.62], [eye[0] + 0.01, eye[1], 0.62]], { tone: 1.5, hatch: 30, shadow: 0, melt: 0, band: 0.1 });
    limb([[...eye, 0.32], [eye[0] + 0.01, eye[1], 0.32]], { tone: 0.04, shadow: 0, melt: 0 });

    // The graduated arc, behind the plumb line, swung from the apex.
    const bm = lerp(atr, gam, 0.5);
    const axis = Math.atan2(bm[1] - bet[1], bm[0] - bet[0]);
    const AR = Math.hypot(bm[0] - bet[0], bm[1] - bet[1]) * 0.62, half = 0.46;
    const Q = (a, r) => [bet[0] + Math.cos(a) * r, bet[1] + Math.sin(a) * r];
    const strip = [];
    const n = 20;
    for (let i = 0; i <= n; i++) strip.push(Q(axis - half + (i / n) * half * 2, AR + 0.32));
    for (let i = n; i >= 0; i--) strip.push(Q(axis - half + (i / n) * half * 2, AR - 0.32));
    blob(strip.map((p, i) => (i === 0 || i === n || i === n + 1 || i === 2 * n + 1 ? [...p, 'c'] : p)), { round: 0.2, tone: 3.4, hatch: 6, shadow: 0.4, band: 0.06, spacing: 0.8 });
    for (let i = 0; i <= 40; i++) {
      const a = axis - half + 0.02 + (i / 40) * (half * 2 - 0.04), l = i % 10 === 0 ? 0.44 : i % 5 === 0 ? 0.32 : 0.18;
      line([Q(a, AR + 0.28), Q(a, AR + 0.28 - l)], { w: i % 10 === 0 ? 0.05 : 0.024, v: 0.9, dark: true, taper: false });
    }

    // The three bars.
    bar(atr, gam, 0.5);
    bar(atr, bet, 0.46);
    bar(gam, bet, 0.46);

    // Fine brace struts, from each leg down to the base.
    for (const [a, b] of [[lerp(atr, bet, 0.42), lerp(atr, gam, 0.2)], [lerp(gam, bet, 0.42), lerp(gam, atr, 0.2)]]) limb([[...a, 0.09], [...b, 0.09]], { tone: 1.6, shadow: 0.3, melt: 0 });

    // Scrolled corner bosses, each on its star.
    const boss = (p, r) => {
      blob(disc(p, r), { round: r * 0.4, tone: 2.0, hatch: 30, shadow: 0.5, band: 0.08 });
      blob(disc(p, r * 0.66), { round: r * 0.3, tone: 1.6, hatch: 60, shadow: 0.2, band: 0.05 });
      line(disc(p, r * 0.84, 28).concat([disc(p, r * 0.84, 28)[0]]), { w: 0.03, v: 0.7, dark: true, taper: false });
      limb([[p[0], p[1], r * 0.22], [p[0] + 0.01, p[1], r * 0.22]], { tone: 1.5, shadow: 0.1, melt: 0 });
    };
    boss(bet, 0.98);
    boss(atr, 1.08);
    boss(gam, 1.08);
    // Spike feet that plant the frame.
    for (const p of [atr, gam]) limb([[p[0], p[1] - 0.5, 0.34], [p[0] - 0.04, p[1] - 1.2, 0.26], [p[0] - 0.08, p[1] - 2.3, 0.02]], { tone: 1.7, hatch: 80, shadow: 0.4, melt: 0, band: 0.06 });

    // The plumb line and its warm bob, hanging true just inside the centre mark.
    const bobAt = [bm[0] + 0.0, bm[1] + 1.56];
    line([bet, [bobAt[0], bobAt[1] + 0.54]], { w: 0.04, v: 0.95, taper: false });
    blob([[bobAt[0] - 0.08, bobAt[1] + 0.56], [bobAt[0] + 0.08, bobAt[1] + 0.56], [bobAt[0] + 0.42, bobAt[1] - 0.1], [bobAt[0] + 0.2, bobAt[1] - 0.56], [bobAt[0], bobAt[1] - 1.1, 'c'], [bobAt[0] - 0.2, bobAt[1] - 0.56], [bobAt[0] - 0.42, bobAt[1] - 0.1]], { round: 0.2, tone: 1.6, warm: 0.84, hatch: 80, shadow: 0.34, band: 0.05 });
  },
};
