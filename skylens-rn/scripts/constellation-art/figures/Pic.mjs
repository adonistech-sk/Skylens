// The Painter's Easel, three-legged, carrying a canvas in its frame. Beta is at the top of the canvas,
// Gamma at its centre where the picture stands, and Alpha on the left front leg near the floor. The
// daubs on the palette are the warm note.
export default {
  tier: 'extended',
  subject: "The Painter's Easel",
  pixels: 1000,
  anchors: [['β Pic', 'canvas top'], ['γ Pic', 'canvas centre'], ['α Pic', 'front leg']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Pic');
    const apex = [3.0, 9.6], footL = [alp[0] - 1.0, alp[1] - 1.7];
    const footR = [2 * apex[0] - footL[0], footL[1]];
    const box = (x0, y0, x1, y1, o = {}) => blob([[x0, y0, 'c'], [x1, y0, 'c'], [x1, y1, 'c'], [x0, y1, 'c']], { round: 0.3, band: 0.14, hatch: 6, shadow: 0.42, ...o });
    const beam = (a, b, r, o = {}) => limb([[...a, r], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, r * 0.92], [...b, r * 0.8]], { flat: 0.5, tone: 1.3, hatch: 80, shadow: 0.4, melt: 0, band: 0.14, ...o });
    const onL = (t) => [apex[0] + (footL[0] - apex[0]) * t, apex[1] + (footL[1] - apex[1]) * t];
    const onR = (t) => [apex[0] + (footR[0] - apex[0]) * t, apex[1] + (footR[1] - apex[1]) * t];

    // The back leg, then the crossbar low across it.
    beam([apex[0], apex[1] + 0.3], [apex[0] + 0.4, footL[1] + 0.8], 0.3, { tone: 1.1 });
    beam(onL(0.84), onR(0.84), 0.2, { tone: 1.2 });

    // The two front legs, with their peg holes.
    for (const [foot, on] of [[footL, onL], [footR, onR]]) {
      beam([apex[0], apex[1] + 0.3], foot, 0.42, {
        creases: [{ pts: [on(0.04), on(0.96)], w: 0.04, depth: 0.06 }],
      });
      for (let i = 0; i < 6; i++) { const p = on(0.54 + i * 0.05); limb([[p[0], p[1], 0.07], [p[0] + 0.01, p[1], 0.07]], { tone: 0.1, shadow: 0, melt: 0 }); }
    }

    // The canvas in a plain moulded frame.
    const x0 = -2.2, x1 = 8.4, y0 = -2.9, y1 = 6.5, fw = 0.56;
    box(x0, y0, x1, y1, { tone: 1.6, round: 0.3, band: 0.3, shadow: 0.56, creases: [{ pts: [[x0 + 0.24, y0 + 0.24], [x1 - 0.24, y0 + 0.24]], w: 0.03, depth: 0.05 }, { pts: [[x1 - 0.24, y0 + 0.24], [x1 - 0.24, y1 - 0.24]], w: 0.03, depth: 0.05 }, { pts: [[x1 - 0.24, y1 - 0.24], [x0 + 0.24, y1 - 0.24]], w: 0.03, depth: 0.05 }, { pts: [[x0 + 0.24, y1 - 0.24], [x0 + 0.24, y0 + 0.24]], w: 0.03, depth: 0.05 }] });
    const cx0 = x0 + fw, cx1 = x1 - fw, cy0 = y0 + fw, cy1 = y1 - fw;
    box(cx0, cy0, cx1, cy1, { tone: 2.2, round: 0.12, hatch: 40, shadow: 0, band: 0.1, spacing: 1.1 });

    // The picture, half-finished: a sun, a headland, a calm sea, in the painter's strokes.
    const hz = 0.2, sun = [5.0, 3.3];
    blob([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => [sun[0] + Math.cos((d * Math.PI) / 180) * 0.9, sun[1] + Math.sin((d * Math.PI) / 180) * 0.9]), { round: 0.4, tone: 3.2, hatch: 20, shadow: 0, band: 0.06, spacing: 0.7 });
    for (let i = 0; i < 16; i++) { const q = (i / 16) * Math.PI * 2, r0 = 1.14, r1 = i % 2 ? 1.6 : 2.0; line([[sun[0] + Math.cos(q) * r0, sun[1] + Math.sin(q) * r0], [sun[0] + Math.cos(q) * r1, sun[1] + Math.sin(q) * r1]], { w: 0.05, v: 0.6 }); }
    blob([[cx0, hz, 'c'], [cx0, 2.4], [cx0 + 1.4, 3.6], [cx0 + 2.6, 2.7], [cx0 + 3.6, 2.2], [cx0 + 5.2, 1.0], [cx0 + 6.4, hz, 'c']], { round: 0.5, tone: 0.9, hatch: 70, shadow: 0, band: 0.14, creases: [{ pts: [[cx0 + 1.3, 3.5], [cx0 + 1.6, 2.2], [cx0 + 1.0, 0.8]], w: 0.05, depth: 0.1 }, { pts: [[cx0 + 2.8, 2.5], [cx0 + 2.6, 1.6], [cx0 + 3.0, 0.5]], w: 0.05, depth: 0.1 }] });
    box(cx0, cy0, cx1, hz, { tone: 1.0, round: 0.08, hatch: 2, shadow: 0, band: 0.05 });
    for (let k = 0; k < 7; k++) for (let i = 0; i < 4; i++) { const x = cx0 + 0.4 + i * 2.3 + (k % 2) * 1.0, y = hz - 0.34 - k * 0.42; line([[x, y], [x + 0.6, y + 0.07], [x + 1.3, y]], { w: 0.05, v: 0.7 }); }
    for (let i = -3; i <= 3; i++) line([[sun[0] + i * 0.12, hz - 0.14], [sun[0] + i * 0.12 + 0.02, hz - 0.9 - (3 - Math.abs(i)) * 0.32]], { w: 0.05, v: 0.7 });

    // The ledge that carries the frame, pegged into the legs.
    box(-5.0, y0 - 0.54, 11.0, y0, { tone: 1.9, round: 0.16, shadow: 0.5 });
    for (const on of [onL, onR]) { const t = (apex[1] - (y0 - 0.26)) / (apex[1] - footL[1]), p = on(t); limb([[p[0], p[1], 0.16], [p[0] + 0.01, p[1], 0.16]], { tone: 1.4, shadow: 0.2, melt: 0 }); }

    // The top clamp that holds the frame.
    limb([[apex[0] + 0.2, 8.3, 0.2], [apex[0] + 0.2, 6.5, 0.2]], { tone: 1.2, hatch: 84, shadow: 0.3, melt: 0 });
    box(apex[0] - 1.8, y1 - 0.24, apex[0] + 2.2, y1 + 0.34, { tone: 1.8, round: 0.14, shadow: 0.34 });
    limb([[apex[0], apex[1] + 0.4, 0.42], [apex[0], apex[1] + 0.9, 0.3], [apex[0], apex[1] + 1.2, 0.46], [apex[0], apex[1] + 1.6, 0.1]], { tone: 1.3, hatch: 84, shadow: 0.3, melt: 0 });

    // The palette, on the ledge against the frame, with brushes through its thumb hole.
    const P = [9.4, -5.9];
    for (const [dx, tip] of [[0.4, [12.8, -0.4]], [0.0, [11.6, -0.1]], [0.8, [14.0, -1.0]]]) {
      limb([[P[0] + dx, P[1] + 0.2, 0.11], [tip[0] - 0.3, tip[1] - 0.7, 0.07]], { tone: 1.3, hatch: 80, shadow: 0.3, melt: 0 });
      limb([[tip[0] - 0.34, tip[1] - 0.76, 0.1], [tip[0] - 0.14, tip[1] - 0.34, 0.14], [tip[0], tip[1], 0.03]], { tone: 1.4, shadow: 0.2, melt: 0 });
    }
    blob([[P[0] - 3.0, P[1] + 0.6], [P[0] - 2.1, P[1] + 1.9], [P[0] - 0.3, P[1] + 2.1], [P[0] + 1.3, P[1] + 1.6], [P[0] + 2.8, P[1] + 1.8], [P[0] + 3.1, P[1] + 0.8], [P[0] + 2.6, P[1] - 0.3], [P[0] + 1.0, P[1] - 1.0], [P[0] - 1.4, P[1] - 1.1], [P[0] - 2.6, P[1] - 0.5]], {
      round: 0.3, tone: 1.9, hatch: 30, shadow: 0.5, band: 0.14,
    });
    limb([[P[0] + 0.5, P[1] + 0.2, 0.34], [P[0] + 0.51, P[1] + 0.2, 0.34]], { tone: 0.06, shadow: 0, melt: 0 });
    for (const [dx, dy, r] of [[-2.2, 0.6, 0.3], [-1.7, 1.4, 0.32], [-0.8, 1.6, 0.28], [0.3, 1.5, 0.3], [-1.9, -0.2, 0.26], [-0.9, -0.5, 0.3]]) {
      blob([[P[0] + dx - r, P[1] + dy], [P[0] + dx, P[1] + dy + r], [P[0] + dx + r, P[1] + dy], [P[0] + dx, P[1] + dy - r * 0.9]], { round: r * 0.5, tone: 1.4, warm: 0.84, hatch: 40, shadow: 0.12, band: 0.05 });
    }
  },
};
