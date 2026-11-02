// The Triangle, the geometer's instrument: a long set square of mitred dark wood with brass corner
// plates, scored with a scale along its longest edge. Beta, Gamma and Mothallah each sit on a
// rivet of a brass corner, so the instrument is exactly the triangle of the sky.
export default {
  tier: 'extended',
  subject: 'The Triangle',
  pixels: 1100,
  anchors: [['β Tri', 'brass corner'], ['Mothallah', 'brass corner'], ['γ Tri', 'brass corner']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const a = s('β Tri'), b = s('Mothallah'), c = s('γ Tri');
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const centre = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const unit = (p, q) => { const l = dist(p, q); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
    const go = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
    const angle = (p, q) => (Math.atan2(-(q[1] - p[1]), q[0] - p[0]) * 180) / Math.PI;

    /** Moves a triangle's corners outward so every edge shifts out by the same width. */
    const offset = (P, Q, R, w) => {
      const line2 = (p, q) => { const d = unit(p, q); let n = [-d[1], d[0]]; const side = (centre[0] - p[0]) * n[0] + (centre[1] - p[1]) * n[1]; if (side > 0) n = [-n[0], -n[1]]; return { p: go(p, n, w), d }; };
      const hit = (l1, l2) => { const k = ((l2.p[0] - l1.p[0]) * l2.d[1] - (l2.p[1] - l1.p[1]) * l2.d[0]) / (l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0]); return go(l1.p, l1.d, k); };
      const pq = line2(P, Q), qr = line2(Q, R), rp = line2(R, P);
      return [hit(rp, pq), hit(pq, qr), hit(qr, rp)];
    };
    const [A, B, C] = offset(a, b, c, 0.34);
    const [Ai, Bi, Ci] = offset(a, b, c, -0.3);
    const Ba = go(A, unit(A, B), dist(A, b) + 0.5), Bc = go(C, unit(C, B), dist(C, b) + 0.5);

    /** One mitred beam of the frame, with its own grain. */
    const beam = (o1, o2, i2, i1, tone) => {
      const g = [0.2, 0.4, 0.6, 0.8];
      blob([[...o1, 'c'], [...o2, 'c'], [...i2, 'c'], [...i1, 'c']], {
        round: 0.2, tone, warm: 0.44, hatch: angle(o1, o2) + 86, shadow: 0.44, band: 0.16,
        creases: [{ pts: [lerp(o1, i1, 0.34), ...g.map((t) => lerp(lerp(o1, i1, 0.3), lerp(o2, i2, 0.3), t)), lerp(o2, i2, 0.34)], w: 0.02, depth: 0.03 }, { pts: [lerp(o1, i1, 0.66), ...g.map((t) => lerp(lerp(o1, i1, 0.7), lerp(o2, i2, 0.7), t)), lerp(o2, i2, 0.66)], w: 0.02, depth: 0.03 }],
      });
    };
    beam(C, A, Ai, Ci, 0.98);
    beam(C, Bc, Bi, Ci, 1.04);
    beam(A, Ba, Bi, Ai, 1.14);

    // Two slim struts across the waist.
    for (const [t, r] of [[0.4, 0.09], [0.68, 0.07]]) {
      const m1 = lerp(Ci, Bi, t), m2 = lerp(Ai, Bi, t);
      limb([[...m1, r], [...m2, r]], { tone: 1.06, warm: 0.5, shadow: 0.34, melt: 0, flat: 0.5, hatch: angle(m1, m2) + 84 });
    }

    // The scale, scored along the long edge, a heavier stroke at every fifth.
    const d = unit(A, B);
    let n = [-d[1], d[0]];
    if ((centre[0] - A[0]) * n[0] + (centre[1] - A[1]) * n[1] < 0) n = [-n[0], -n[1]];
    for (let i = 9; i <= 66; i++) {
      const p = lerp(A, B, i / 80), big = i % 5 === 0, h = big ? 0.38 : 0.22;
      line([go(p, n, 0.08), go(p, n, 0.08 + h)], { w: big ? 0.02 : 0.012, v: 0.86, warm: 0.7, taper: false });
    }

    /** A brass plate lapped over a corner, its inner edge cut in a shallow curve, three rivets. */
    const corner = (at, P, Q, reach, tone) => {
      const p = go(at, unit(at, P), reach), q = go(at, unit(at, Q), reach), m = lerp(lerp(p, q, 0.5), at, 0.34);
      blob([[...at, 'c'], [...p, 'c'], m, [...q, 'c']], {
        round: 0.22, tone, warm: 0.76, hatch: 30, shadow: 0.5, band: 0.12,
        creases: [{ pts: [go(at, unit(at, P), reach * 0.8), lerp(m, at, 0.2), go(at, unit(at, Q), reach * 0.8)], w: 0.02, depth: 0.04 }],
      });
    };
    corner(A, C, B, 1.7, 1.16);
    corner(C, A, B, 1.7, 1.1);
    const Bb = lerp(Ba, Bc, 0.5), up = unit(Bb, centre), pa = go(Ba, unit(Ba, A), 1.5), pc = go(Bc, unit(Bc, C), 1.5);
    blob([[...Ba, 'c'], [...pa, 'c'], go(Bb, up, 1.0), [...pc, 'c'], [...Bc, 'c']], { round: 0.2, tone: 1.22, warm: 0.76, hatch: 30, shadow: 0.5, band: 0.12, creases: [{ pts: [go(Ba, unit(Ba, A), 1.2), go(Bb, up, 0.74), go(Bc, unit(Bc, C), 1.2)], w: 0.02, depth: 0.04 }] });
    const rivet = (r, size) => blob([[r[0] - size, r[1]], [r[0], r[1] + size], [r[0] + size, r[1]], [r[0], r[1] - size]], { round: size, tone: 1.34, warm: 0.84, shadow: 0.36 });
    for (const r of [a, b, c]) rivet(r, 0.13);
    rivet(go(A, unit(A, C), 1.3), 0.08); rivet(go(A, unit(A, B), 1.3), 0.08); rivet(go(C, unit(C, A), 1.3), 0.08); rivet(go(C, unit(C, B), 1.3), 0.08); rivet(go(Ba, unit(Ba, A), 0.9), 0.08); rivet(go(Bc, unit(Bc, C), 0.9), 0.08);
  },
};
