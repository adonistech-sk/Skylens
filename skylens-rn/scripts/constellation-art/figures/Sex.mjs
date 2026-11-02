// The Sextant, Hevelius's brass instrument for measuring the heavens, a sixty-degree frame hung
// from its pivot. Gamma is the pivot, Delta and Beta sit on the graduated limb, and Alpha on the
// moving index arm that sweeps across it. The whole of it is brass, warm by right.
export default {
  tier: 'extended',
  subject: 'The Sextant',
  pixels: 1100,
  anchors: [['γ Sex', 'pivot'], ['δ Sex', 'graduated limb'], ['β Sex', 'graduated limb'], ['α Sex', 'index arm']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const piv = s('γ Sex'), alp = s('α Sex');
    const POL = (r, deg) => [piv[0] + r * Math.cos((deg * Math.PI) / 180), piv[1] + r * Math.sin((deg * Math.PI) / 180)];
    const A0 = 96, A1 = 156, R0 = 10.45, R1 = 12.3, Rm = 11.4;
    const hatchAt = (deg) => -deg + 86;
    const brass = { warm: 0.62, melt: 0, flat: 0.5 };

    // Radial frame arms, the two sides of the sextant and one rib between.
    for (const [deg, tone] of [[A0, 1.1], [A1, 1.0]]) {
      limb([[...POL(0.5, deg - 2), 0.3], [...POL(5, deg), 0.26], [...POL(R0 + 0.1, deg), 0.34]], { ...brass, tone, hatch: hatchAt(deg), shadow: 0.34, creases: [{ pts: [POL(1.0, deg), POL(5.5, deg), POL(R0, deg)], w: 0.04, depth: 0.06 }] });
    }

    // Two arcs of bracing inside the frame, and the rings that tie them to the arms.
    for (const [r, w, tone] of [[4.6, 0.12, 1.0], [7.6, 0.14, 1.04]]) {
      const pts = [];
      for (let a = A0; a <= A1; a += 12) pts.push([...POL(r, a), w]);
      limb(pts, { ...brass, tone, hatch: hatchAt(126), shadow: 0.3 });
    }
    // Open ring-work between the arcs.
    for (const [r, deg, q] of [[6.1, 112, 0.92], [6.1, 142, 0.92], [9.05, 106, 1.02], [9.05, 126, 1.02], [9.05, 146, 1.02]]) {
      const c = POL(r, deg), n = 14, ring = [];
      for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; ring.push([c[0] + Math.cos(a) * q, c[1] + Math.sin(a) * q, 0.07]); }
      limb(ring, { ...brass, tone: 1.08, hatch: 30, shadow: 0.26 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        line([[c[0] - Math.cos(a) * q * 0.92, c[1] - Math.sin(a) * q * 0.92], [c[0] + Math.cos(a) * q * 0.92, c[1] + Math.sin(a) * q * 0.92]], { w: 0.022, v: 0.7, warm: 0.6, taper: false });
      }
    }

    // The limb, a broad curved plate running through Delta and Beta.
    const arc = (r) => { const pts = []; for (let a = A0 - 2; a <= A1 + 2.01; a += 8) pts.push(POL(r, a)); return pts; };
    const outer = arc(R1), inner = arc(R0).reverse();
    outer[0].push('c'); outer[outer.length - 1].push('c'); inner[0].push('c'); inner[inner.length - 1].push('c');
    blob([...outer, ...inner], {
      round: 0.4, tone: 1.2, warm: 0.66, hatch: hatchAt(126), shadow: 0.5, band: 0.16,
      creases: [{ pts: arc(R0 + 0.32), w: 0.03, depth: 0.05 }, { pts: arc(R1 - 0.28), w: 0.03, depth: 0.05 }, { pts: arc(R1 - 0.86), w: 0.02, depth: 0.03 }],
    });

    // Every degree cut on the limb, the tens running long, in sixty divisions.
    for (let d = 0; d <= 120; d++) {
      const deg = A0 + d * 0.5, big = d % 20 === 0, mid = d % 4 === 0;
      line([POL(R1 - 0.3, deg), POL(R1 - (big ? 1.34 : mid ? 1.0 : 0.82), deg)], { w: big ? 0.05 : mid ? 0.03 : 0.018, v: big ? 0.96 : 0.8, warm: 0.3, taper: false });
    }

    // Foliate ends of the limb.
    for (const [deg, turn] of [[A0 - 2, -1], [A1 + 2, 1]]) {
      const P = (r, d) => POL(r, deg + turn * d);
      blob([[...P(R0 - 0.2, 0), 'c'], P(R0 + 0.1, 3), P(Rm, 6), [...P(R1 + 0.2, 3), 'c'], P(R1 + 0.3, 0)], { round: 0.3, tone: 1.2, warm: 0.76, hatch: 40, shadow: 0.38, band: 0.12 });
    }

    // The index arm, swinging about the pivot, carrying its sight over the scale at Alpha's bearing.
    const idx = (Math.atan2(alp[1] - piv[1], alp[0] - piv[0]) * 180) / Math.PI;
    limb([[...POL(0.2, idx), 0.34], [...POL(6, idx), 0.27], [...POL(R0 + 1.0, idx), 0.22]], { tone: 1.34, warm: 0.5, hatch: hatchAt(idx), shadow: 0.56, melt: 0, flat: 0.6, creases: [{ pts: [POL(1.0, idx), POL(6, idx), POL(R0 + 0.8, idx)], w: 0.03, depth: 0.05 }] });
    // Sight vane at the end of the arm: a small pierced plate.
    const v = POL(R0 + 0.5, idx), vv = POL(R0 + 1.4, idx);
    const n = [-(vv[1] - v[1]) / 0.9, (vv[0] - v[0]) / 0.9];
    blob([[v[0] + n[0] * 0.56, v[1] + n[1] * 0.56, 'c'], [vv[0] + n[0] * 0.56, vv[1] + n[1] * 0.56, 'c'], [vv[0] - n[0] * 0.56, vv[1] - n[1] * 0.56, 'c'], [v[0] - n[0] * 0.56, v[1] - n[1] * 0.56, 'c']], { round: 0.16, tone: 1.3, warm: 0.5, hatch: 30, shadow: 0.5, band: 0.1 });
    line([[v[0], v[1]], [vv[0], vv[1]]], { w: 0.05, v: 0.2, taper: false, dark: true });

    // The plumb line, falling from the pivot and past the frame.
    line([piv, POL(3.0, -90)], { w: 0.02, v: 0.72, taper: false });
    const b = POL(3.0, -90);
    blob([[b[0] - 0.22, b[1]], [b[0], b[1] + 0.3], [b[0] + 0.22, b[1]], [b[0], b[1] - 0.72, 'c']], { round: 0.2, tone: 1.3, warm: 0.76, shadow: 0.3 });

    // The pivot: a stepped brass hub.
    const hub = (r, tone) => { const n2 = 14, ring = []; for (let i = 0; i < n2; i++) { const a = (i / n2) * Math.PI * 2; ring.push([piv[0] + Math.cos(a) * r, piv[1] + Math.sin(a) * r]); } blob(ring, { round: r * 0.5, tone, warm: 0.76, hatch: 36, shadow: 0.5, band: 0.12 }); };
    hub(0.8, 1.12);
    hub(0.4, 1.34);
  },
};
