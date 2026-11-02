// The Chemical Furnace, a brick athanor with a retort on its crown. Dalim sits under the retort on
// the furnace's domed top, Beta on its shoulder, and Nu in the receiver at the end of the retort's
// long glass neck. The fire in the arched door is the warm note.
export default {
  tier: 'extended',
  subject: 'The Chemical Furnace',
  pixels: 1000,
  anchors: [['Dalim', 'furnace crown'], ['β For', 'furnace shoulder'], ['ν For', 'receiver flask']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const dal = s('Dalim'), nu = s('ν For');
    const cx = -5.4;
    const R = 4.3, floor = -12.6, ring = -2.5;

    // The plinth, two steps of dressed stone.
    const box = (x0, y0, x1, y1, o = {}) => blob([[x0, y0, 'c'], [x1, y0, 'c'], [x1, y1, 'c'], [x0, y1, 'c']], { round: 0.3, band: 0.24, hatch: 6, shadow: 0.4, ...o });
    box(cx - 6.8, floor - 1.2, cx + 6.8, floor - 0.2, { tone: 1.02, creases: [{ pts: [[cx - 6.6, floor - 0.7], [cx + 6.6, floor - 0.7]], w: 0.05, depth: 0.08 }] });
    box(cx - 6.0, floor - 0.2, cx + 6.0, floor + 0.7, { tone: 1.1 });

    // The brick tower, each course and joint cut in by hand.
    const courses = [], tall = ring - floor - 0.7;
    const rows = 13;
    for (let i = 1; i < rows; i++) {
      const y = floor + 0.7 + (i / rows) * tall;
      const sag = 0.16;
      courses.push({ pts: [[cx - R, y], [cx, y - sag], [cx + R, y]], w: 0.05, depth: 0.08 });
      for (const f of (i % 2 ? [-0.82, -0.42, 0, 0.42, 0.82] : [-0.62, -0.22, 0.22, 0.62])) {
        const x = cx + Math.sin(f * 1.3) * R * 1.04, dy = (tall / rows);
        courses.push({ pts: [[x, y - sag * (1 - f * f)], [x, y + dy - sag * (1 - f * f)]], w: 0.035, depth: 0.05 });
      }
    }
    blob([[cx - R, floor + 0.7, 'c'], [cx + R, floor + 0.7, 'c'], [cx + R, ring, 'c'], [cx - R, ring, 'c']], { round: 2.6, tone: 1.08, hatch: 86, shadow: 0.5, band: 0.3, creases: courses });

    // The iron band with rivets at the waist of the tower.
    box(cx - R - 0.3, ring - 0.5, cx + R + 0.3, ring + 0.3, { tone: 1.22, round: 0.18, creases: [{ pts: [[cx - R, ring - 0.1], [cx + R, ring - 0.1]], w: 0.04, depth: 0.06 }] });
    for (let i = 0; i < 9; i++) { const x = cx - R + (i + 0.5) * ((2 * R) / 9); limb([[x, ring - 0.1, 0.1], [x + 0.01, ring - 0.1, 0.1]], { tone: 1.3, shadow: 0.1, melt: 0 }); }

    // The domed upper chamber up to Dalim.
    blob([[cx - R + 0.1, ring + 0.3, 'c'], [cx - R + 0.2, ring + 1.6], [cx - 2.9, ring + 2.9], [dal[0] - 1.4, dal[1] + 0.1], [dal[0] + 1.6, dal[1] + 0.1], [cx + 3.0, ring + 2.9], [cx + R - 0.2, ring + 1.6], [cx + R - 0.1, ring + 0.3, 'c']], {
      round: 1.8, tone: 1.14, hatch: 80, shadow: 0.5, band: 0.3,
      creases: [
        { pts: [[cx - R + 0.3, ring + 1.0], [cx, ring + 0.7], [cx + R - 0.3, ring + 1.0]], w: 0.05, depth: 0.07 },
        { pts: [[cx - 3.7, ring + 2.0], [cx, ring + 1.7], [cx + 3.7, ring + 2.0]], w: 0.05, depth: 0.07 },
        { pts: [[cx - 2.6, ring + 3.0], [cx, ring + 2.8], [cx + 2.6, ring + 3.0]], w: 0.05, depth: 0.07 },
      ],
    });

    // The fire door: a stone arch, the fire within it.
    const dy = floor + 3.0;
    blob([[cx - 2.4, dy - 1.4, 'c'], [cx - 2.4, dy + 1.0], [cx - 1.4, dy + 2.6], [cx, dy + 3.1], [cx + 1.4, dy + 2.6], [cx + 2.4, dy + 1.0], [cx + 2.4, dy - 1.4, 'c']], {
      round: 0.3, tone: 1.26, hatch: 86, shadow: 0.5, band: 0.16,
      creases: [[-2.1, 1.0, -1.5, 1.2], [-1.8, 1.9, -1.26, 1.56], [-1.05, 2.56, -0.7, 2.06], [0, 3.0, 0, 2.3], [1.05, 2.56, 0.7, 2.06], [1.8, 1.9, 1.26, 1.56], [2.1, 1.0, 1.5, 1.2]].map(([a, b, c, d]) => ({ pts: [[cx + a, dy + b], [cx + c, dy + d]], w: 0.05, depth: 0.08 })),
    });
    blob([[cx - 1.6, dy - 1.4, 'c'], [cx - 1.6, dy + 0.9], [cx - 0.9, dy + 1.8], [cx, dy + 2.1], [cx + 0.9, dy + 1.8], [cx + 1.6, dy + 0.9], [cx + 1.6, dy - 1.4, 'c']], { round: 0.2, tone: 0.1, hatch: 86, shadow: 0, band: 0.1 });
    const flame = (x, y, h, lean, tone, warm) => blob([[x - h * 0.24, y], [x - h * 0.27, y + h * 0.25], [x - h * 0.08 + lean * 0.4, y + h * 0.56], [x + lean, y + h, 'c'], [x + h * 0.1 + lean * 0.3, y + h * 0.52], [x + h * 0.26, y + h * 0.2], [x + h * 0.2, y]], { round: h * 0.1, tone, warm, hatch: 86, shadow: 0, band: 0.1 });
    flame(cx - 0.7, dy - 1.3, 1.9, -0.2, 1.1, 0.6);
    flame(cx + 0.7, dy - 1.3, 2.0, 0.2, 1.1, 0.6);
    flame(cx, dy - 1.3, 2.9, 0.16, 1.28, 0.84);
    limb([[cx - 1.5, dy - 1.26, 0.14], [cx + 1.5, dy - 1.16, 0.14]], { tone: 1.1, shadow: 0, melt: 0 });

    // The receiver's tripod stand, then the flask around Nu.
    const fx = nu[0] + 0.2, fy = nu[1] - 0.2;
    for (const [x0, x1, t] of [[fx - 1.3, fx - 3.4, 1.06], [fx + 1.3, fx + 3.4, 1.06], [fx, fx, 0.92]]) limb([[x0, fy - 2.8, 0.15], [(x0 + x1) / 2, floor + 4, 0.13], [x1, floor - 1.0, 0.16]], { tone: t, hatch: 80, shadow: 0.3, melt: 0 });
    limb([[fx - 2.4, floor + 3.4, 0.08], [fx + 2.4, floor + 3.4, 0.08]], { tone: 1.06, shadow: 0.2, melt: 0 });
    limb([[fx - 1.9, fy - 2.9, 0.17], [fx + 1.9, fy - 2.9, 0.17]], { tone: 1.26, shadow: 0.3, melt: 0 });

    // The iron dish on the crown that carries the retort.
    limb([[cx - 3.0, 2.3, 0.1], [cx - 2.4, 1.6, 0.26], [cx - 0.6, 1.3, 0.3], [cx + 0.6, 1.3, 0.3], [cx + 2.4, 1.6, 0.26], [cx + 3.0, 2.3, 0.1]], { tone: 1.22, hatch: 84, shadow: 0.4, melt: 0, band: 0.14 });

    // The retort: a pear of glass on the crown, its neck reaching down to the receiver.
    const glass = (pts, o = {}) => {
      blob(pts, { round: 1.2, tone: 0.56, alpha: 0.3, hatch: 40, shadow: 0, spacing: 1.5, band: 0.4, ...o });
      line([...pts.map((p) => [p[0], p[1]]), [pts[0][0], pts[0][1]]], { w: 0.09, v: 0.84, taper: false });
    };
    limb([[cx + 3.0, 5.0, 0.54], [cx + 7.0, 4.4, 0.42], [cx + 10.6, 3.5, 0.36], [nu[0] - 1.8, nu[1] + 1.8, 0.28]], { tone: 0.6, alpha: 0.42, hatch: 12, shadow: 0, melt: 0, band: 0.12 });
    line([[cx + 2.6, 5.56], [cx + 7.0, 4.84], [cx + 10.6, 3.86], [nu[0] - 1.9, nu[1] + 2.06]], { w: 0.07, v: 0.84 });
    line([[cx + 3.4, 4.52], [cx + 7.0, 3.98], [cx + 10.6, 3.14], [nu[0] - 1.6, nu[1] + 1.6]], { w: 0.05, v: 0.56 });
    glass([[cx - 2.4, 3.0], [cx - 3.0, 4.6], [cx - 2.4, 6.2], [cx - 0.8, 7.0], [cx + 1.0, 6.7], [cx + 2.8, 5.8], [cx + 3.6, 5.0], [cx + 2.6, 4.2], [cx + 1.8, 3.2], [cx + 0.4, 2.2], [cx - 1.4, 2.2]]);
    line([[cx - 2.2, 4.2], [cx - 2.0, 5.4], [cx - 1.0, 6.2]], { w: 0.13, v: 0.6 });
    // The liquor in the bulb.
    blob([[cx - 2.2, 3.5, 'c'], [cx + 1.5, 3.5, 'c'], [cx + 0.4, 2.4], [cx - 1.4, 2.4]], { round: 0.5, tone: 0.8, alpha: 0.5, hatch: 8, shadow: 0, band: 0.1 });

    // The receiver.
    glass([[fx - 2.4, fy - 0.2], [fx - 1.8, fy + 1.4], [nu[0] - 1.6, nu[1] + 2.1], [nu[0] - 2.2, nu[1] + 2.6], [nu[0] - 1.8, nu[1] + 3.0], [nu[0] - 0.9, nu[1] + 2.0], [fx + 1.6, fy + 1.8], [fx + 2.5, fy + 0.2], [fx + 1.9, fy - 1.9], [fx, fy - 2.8], [fx - 1.9, fy - 1.9]]);
    line([[fx - 1.8, fy - 0.2], [fx - 1.4, fy + 1.0], [fx - 0.6, fy + 1.5]], { w: 0.1, v: 0.6 });
    blob([[fx - 2.2, fy - 1.1, 'c'], [fx + 2.2, fy - 1.1, 'c'], [fx + 1.6, fy - 2.2], [fx, fy - 2.7], [fx - 1.6, fy - 2.2]], { round: 0.5, tone: 0.82, alpha: 0.5, hatch: 8, shadow: 0, band: 0.1 });

    // The bellows, propped at the foot of the furnace.
    const B = (u, v) => [1.4 + u * 0.86 - v * 0.5, floor - 0.2 + u * 0.5 + v * 0.86];
    limb([[...B(4.2, 0), 0.3], [...B(5.4, 0), 0.16], [...B(6.6, 0), 0.08]], { tone: 1.26, hatch: 30, shadow: 0.3, melt: 0 });
    blob([B(0.2, 0.1), B(0.6, 1.5), B(2.2, 1.6), B(4.3, 0.34), B(4.4, -0.3), B(2.2, -1.5), B(0.6, -1.3)], { round: 0.5, tone: 1.04, hatch: 40, shadow: 0.4, band: 0.2, creases: [{ pts: [B(0.5, 0.7), B(2.2, 0.8), B(4.0, 0.2)], w: 0.05, depth: 0.1 }, { pts: [B(0.5, -0.6), B(2.2, -0.7), B(4.0, -0.1)], w: 0.05, depth: 0.1 }, { pts: [B(0.5, 0), B(4.1, 0)], w: 0.05, depth: 0.1 }] });
    limb([[...B(0.2, 0.2), 0.14], [...B(-1.8, 0.8), 0.13]], { tone: 1.14, shadow: 0.2, melt: 0 });
    limb([[...B(0.2, -0.2), 0.14], [...B(-1.8, -0.8), 0.13]], { tone: 1.14, shadow: 0.2, melt: 0 });
  },
};
