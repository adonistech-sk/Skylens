// The Drafting Compass, a brass wing-compass stood open on its two steel points. Beta is the hinge
// pin, Gamma the shoulder of one leg, Alpha the knee of the other. A locking arc spans the legs and
// its thumbscrew is the warm note, and a fine scribed arc runs out from the lifted point.
export default {
  tier: 'extended',
  subject: 'The Drafting Compass',
  pixels: 1000,
  anchors: [['β Cir', 'hinge'], ['γ Cir', 'leg'], ['α Cir', 'leg']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β Cir'), gam = s('γ Cir'), alp = s('α Cir');
    const hinge = [bet[0] + 0.06, bet[1] + 0.22];
    const unit = (p) => { const d = [p[0] - hinge[0], p[1] - hinge[1]], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; };
    const ua = unit(alp), ug = unit(gam);
    const a0 = Math.atan2(ua[1], ua[0]), g0 = Math.atan2(ug[1], ug[0]);
    const mid = (a0 + g0) / 2, um = [Math.cos(mid), Math.sin(mid)], nm = [-um[1], um[0]];
    const LEN = 13.2;
    const M = (r, o = 0) => [hinge[0] + um[0] * r + nm[0] * o, hinge[1] + um[1] * r + nm[1] * o];
    const hatch = (Math.atan2(-um[1], um[0]) * 180) / Math.PI + 88;
    const disc = (c, r) => [0, 45, 90, 135, 180, 225, 270, 315].map((d) => [c[0] + Math.cos((d * Math.PI) / 180) * r, c[1] + Math.sin((d * Math.PI) / 180) * r]);

    // The scribed arc, swung from the planted point.
    const tipA = [hinge[0] + ua[0] * LEN, hinge[1] + ua[1] * LEN], tipG = [hinge[0] + ug[0] * LEN, hinge[1] + ug[1] * LEN];
    const R = Math.hypot(tipA[0] - tipG[0], tipA[1] - tipG[1]), b = Math.atan2(tipG[1] - tipA[1], tipG[0] - tipA[0]);
    const scribe = [];
    for (let i = 0; i <= 26; i++) { const q = b + 0.2 - (i / 26) * 0.4; scribe.push([tipA[0] + Math.cos(q) * R, tipA[1] + Math.sin(q) * R]); }
    line(scribe, { w: 0.05, v: 0.62, taper: true });

    // The locking arc, a graduated strip that runs through both legs.
    const arcAt = (r, q) => [hinge[0] + Math.cos(q) * r, hinge[1] + Math.sin(q) * r];
    const arcR = 6.1, end0 = a0 + 0.14, end1 = g0 - 0.14, strip = [];
    for (let i = 0; i <= 18; i++) strip.push(arcAt(arcR + 0.26, end0 + ((end1 - end0) * i) / 18));
    for (let i = 18; i >= 0; i--) strip.push(arcAt(arcR - 0.26, end0 + ((end1 - end0) * i) / 18));
    blob(strip.map((p, i) => (i === 0 || i === 18 || i === 19 || i === 37 ? [...p, 'c'] : p)), { round: 0.12, tone: 1.24, hatch, shadow: 0.4, band: 0.1 });
    for (let i = 1; i < 24; i++) { const q = end0 + ((end1 - end0) * i) / 24, l = i % 4 === 0 ? 0.3 : 0.16; line([arcAt(arcR + 0.2, q), arcAt(arcR + 0.2 - l, q)], { w: 0.024, v: 0.8, taper: false }); }

    // A leg: long tapered brass, a collar, then a steel point.
    const leg = (u, tone) => {
      const n = [-u[1], u[0]];
      const P = (r, o = 0) => [hinge[0] + u[0] * r + n[0] * o, hinge[1] + u[1] * r + n[1] * o];
      const h = (Math.atan2(-u[1], u[0]) * 180) / Math.PI + 88;
      blob([P(0, 0.74), P(3, 0.56), P(6, 0.44), P(8.6, 0.32), P(8.6, -0.32), P(6, -0.44), P(3, -0.56), P(0, -0.74)], {
        round: 0.3, tone, hatch: h, shadow: 0.5, band: 0.12, spacing: 0.86,
        creases: [{ pts: [P(0.9, 0), P(8.4, 0)], w: 0.05, depth: 0.12 }, { pts: [P(1.6, 0.34), P(7.6, 0.2)], w: 0.024, depth: 0.03 }, { pts: [P(1.6, -0.34), P(7.6, -0.2)], w: 0.024, depth: 0.03 }],
      });
      limb([[...P(8.5), 0.34], [...P(8.74), 0.5], [...P(8.96), 0.3], [...P(9.16), 0.42], [...P(9.4), 0.24]], { tone: 1.3, hatch: h, shadow: 0.34, melt: 0, band: 0.08 });
      blob([P(9.4, 0.23), P(10.8, 0.17), [...P(LEN, 0), 'c'], P(10.8, -0.17), P(9.4, -0.23)], { round: 0.1, tone: 1.32, hatch: h + 8, shadow: 0.4, band: 0.06, creases: [{ pts: [P(9.5, 0.03), P(LEN - 0.2, 0)], w: 0.03, depth: 0.08 }] });
    };
    leg(ug, 1.14);
    leg(ua, 1.24);

    // The thumbscrew, where the arc passes the planted leg.
    const ts = arcAt(arcR, a0);
    const out = [Math.cos(a0 + Math.PI / 2), Math.sin(a0 + Math.PI / 2)];
    limb([[ts[0], ts[1], 0.14], [ts[0] - out[0] * 0.9, ts[1] - out[1] * 0.9, 0.12]], { tone: 1.28, shadow: 0.24, melt: 0 });
    const knob = [ts[0] - out[0] * 1.3, ts[1] - out[1] * 1.3];
    blob(disc(knob, 0.56), {
      round: 0.3, tone: 1.3, warm: 0.84, hatch: 20, shadow: 0.34, band: 0.1,
      creases: [0, 60, 120].map((d) => ({ pts: [[knob[0] - Math.cos((d * Math.PI) / 180) * 0.5, knob[1] - Math.sin((d * Math.PI) / 180) * 0.5], [knob[0] + Math.cos((d * Math.PI) / 180) * 0.5, knob[1] + Math.sin((d * Math.PI) / 180) * 0.5]], w: 0.03, depth: 0.05 })),
    });

    // The turned handle above the hinge.
    limb([[...M(-0.7), 0.56], [...M(-1.5), 0.36], [...M(-1.86), 0.52], [...M(-2.2), 0.32], [...M(-3.0), 0.5], [...M(-4.0), 0.52], [...M(-4.7), 0.36], [...M(-5.0), 0.52], [...M(-5.3), 0.3], [...M(-5.6), 0.4], [...M(-6.0), 0.08]], {
      tone: 1.2, hatch, shadow: 0.44, melt: 0, band: 0.1,
      creases: [-2.4, -2.7, -3.0, -3.3, -3.6, -3.9, -4.2].map((r) => ({ pts: [M(r, -0.46), M(r - 0.14, 0), M(r, 0.46)], w: 0.025, depth: 0.05 })),
    });

    // The hinge: a stout knuckle with its slotted pin.
    blob(disc(hinge, 1.3), { round: 0.6, tone: 1.22, hatch, shadow: 0.56, band: 0.14 });
    blob(disc(hinge, 0.84), { round: 0.4, tone: 1.32, hatch: hatch + 30, shadow: 0.3, band: 0.1 });
    blob(disc(hinge, 0.56), { round: 0.3, tone: 1.12, hatch: hatch + 60, shadow: 0.2, band: 0.1 });
    line([M(0, -0.46), M(0, 0.46)], { w: 0.09, v: 0.8, dark: true, taper: false });
  },
};
