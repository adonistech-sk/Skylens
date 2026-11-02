// The Air Pump, an 18th-century double-barrelled table pump. Alpha is the pivot of the working
// lever, Epsilon its handle out to the west, and Iota the brass plate under the bell jar. The bell
// hanging in the jar is the warm note: the old demonstration that sound needs air.
export default {
  tier: 'extended',
  subject: 'The Air Pump',
  pixels: 1000,
  anchors: [['α Ant', 'lever pivot'], ['ε Ant', 'lever handle'], ['ι Ant', 'jar plate']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const alp = s('α Ant'), eps = s('ε Ant'), iot = s('ι Ant');
    const box = (x0, y0, x1, y1, o = {}) => blob([[x0, y0, 'c'], [x1, y0, 'c'], [x1, y1, 'c'], [x0, y1, 'c']], { round: o.round ?? 0.3, band: 0.2, hatch: 4, shadow: 0.4, ...o });
    const top = -3.3; // The table top.

    // Turned table legs and stretcher.
    const tleg = (x) => limb([[x, top - 0.6, 0.46], [x, top - 1.3, 0.62], [x, top - 2.0, 0.3], [x, top - 3.1, 0.5], [x, top - 3.9, 0.54], [x, top - 4.4, 0.26], [x, top - 5.6, 0.34], [x, top - 6.7, 0.24], [x, top - 7.3, 0.36]], { tone: 1.14, hatch: 84, shadow: 0.3, melt: 0, band: 0.2, creases: [{ pts: [[x - 0.5, top - 1.8], [x + 0.5, top - 1.8]], w: 0.05, depth: 0.1 }, { pts: [[x - 0.4, top - 4.3], [x + 0.4, top - 4.3]], w: 0.05, depth: 0.1 }] });
    limb([[-11.6, top - 3.6, 0.2], [3.2, top - 3.6, 0.2]], { tone: 0.94, hatch: 6, shadow: 0.2, melt: 0 });
    tleg(-11.6);
    tleg(3.2);
    // Apron and top.
    box(-12.6, top - 1.1, 4.2, top - 0.3, { tone: 1.12, creases: [{ pts: [[-12.4, top - 0.7], [4.0, top - 0.7]], w: 0.05, depth: 0.08 }, { pts: [[-4.2, top - 1.0], [-4.1, top - 0.4]], w: 0.04, depth: 0.06 }] });
    box(-13.2, top - 0.3, 4.8, top + 0.18, { tone: 1.24, round: 0.2, creases: [{ pts: [[-13.0, top - 0.1], [4.6, top - 0.1]], w: 0.05, depth: 0.08 }] });

    // Two uprights and the top beam of the pump.
    for (const x of [-4.6, 0.6]) limb([[x, top + 0.2, 0.4], [x, top + 0.8, 0.28], [x, 1.0, 0.24], [x, 3.0, 0.28], [x, alp[1] - 0.3, 0.32]], { tone: 1.04, hatch: 84, shadow: 0.3, melt: 0, band: 0.16 });
    // The barrels.
    const barrel = (x) => {
      limb([[x, top + 0.2, 0.82], [x, top + 0.6, 0.66], [x, -0.4, 0.7], [x, 1.4, 0.7], [x, 1.8, 0.86]], { tone: 1.2, hatch: 84, shadow: 0.44, melt: 0, band: 0.2, creases: [{ pts: [[x - 0.7, -2.1], [x + 0.7, -2.1]], w: 0.05, depth: 0.1 }, { pts: [[x - 0.7, 0.9], [x + 0.7, 0.9]], w: 0.05, depth: 0.1 }, { pts: [[x + 0.3, -2.6], [x + 0.3, 1.2]], w: 0.04, depth: 0.05 }] });
    };
    barrel(-3.1);
    barrel(-0.9);

    // Piston racks, from the barrels up to the lever.
    const dir = [eps[0] - alp[0], eps[1] - alp[1]], lev = Math.hypot(...dir), u = [dir[0] / lev, dir[1] / lev];
    const onLever = (d) => [alp[0] + u[0] * d, alp[1] + u[1] * d];
    const pinL = onLever(-1.1), pinR = onLever(1.1);
    for (const [x, pin] of [[-3.1, pinL], [-0.9, pinR]]) limb([[x, 1.6, 0.13], [pin[0], pin[1], 0.13]], { tone: 1.26, hatch: 84, shadow: 0.2, melt: 0 });

    // The beam, on which the lever is pinned.
    box(-5.2, alp[1] - 0.46, 1.2, alp[1] + 0.3, { tone: 1.12, round: 0.2, creases: [{ pts: [[-5.0, alp[1] - 0.1], [1.0, alp[1] - 0.1]], w: 0.05, depth: 0.08 }] });
    limb([[-5.3, alp[1] + 0.34, 0.2], [1.3, alp[1] + 0.34, 0.2]], { tone: 1.18, shadow: 0.2, melt: 0 });
    for (const x of [-4.6, 0.6]) limb([[x, alp[1] + 0.4, 0.2], [x, alp[1] + 0.7, 0.13], [x, alp[1] + 1.1, 0.22], [x, alp[1] + 1.32, 0.05]], { tone: 1.2, shadow: 0.2, melt: 0 });

    // The lever: an iron rocker, a turned wooden grip beyond Epsilon.
    const G = (d, o) => [alp[0] + u[0] * d - u[1] * o, alp[1] + u[1] * d + u[0] * o];
    blob([G(-2.0, 0.26), G(0, 0.42), G(2.0, 0.28), G(lev - 3, 0.2), G(lev - 2.6, -0.2), G(2.0, -0.28), G(0, -0.42), G(-2.0, -0.26)], { round: 0.2, tone: 1.2, hatch: 80, shadow: 0.42, band: 0.14, creases: [{ pts: [G(-1.7, 0), G(lev - 3, 0)], w: 0.04, depth: 0.06 }] });
    limb([[...G(lev - 3.0, 0), 0.24], [...G(lev - 2.6, 0), 0.34], [...G(lev - 2.3, 0), 0.22], [...G(lev - 1.6, 0), 0.34], [...G(lev - 0.4, 0), 0.5], [...G(lev + 0.7, 0), 0.54], [...G(lev + 1.5, 0), 0.34], [...G(lev + 1.8, 0), 0.5], [...G(lev + 2.1, 0), 0.26]], { tone: 1.12, hatch: 66, shadow: 0.4, melt: 0, band: 0.2, creases: [{ pts: [G(lev - 2.5, -0.3), G(lev - 2.5, 0.3)], w: 0.04, depth: 0.08 }] });
    limb([[alp[0], alp[1], 0.38], [alp[0] + 0.01, alp[1], 0.38]], { tone: 1.3, shadow: 0.3, melt: 0 });
    limb([[alp[0], alp[1], 0.14], [alp[0] + 0.01, alp[1], 0.14]], { tone: 0.3, shadow: 0, melt: 0 });

    // The pipe under the jar, with its stopcock.
    limb([[-3.0, top + 0.5, 0.2], [-6.0, top + 0.5, 0.2]], { tone: 1.16, hatch: 6, shadow: 0.3, melt: 0 });
    limb([[-5.0, top + 0.1, 0.28], [-5.0, top + 0.72, 0.3], [-5.0, top + 1.0, 0.12], [-5.0, top + 1.3, 0.34]], { tone: 1.28, hatch: 80, shadow: 0.3, melt: 0 });

    // The plate on Iota, in stepped brass.
    const c = iot[0] - 0.2, base = top + 0.18;
    box(c - 4.2, base, c + 4.2, base + 0.34, { tone: 1.14, round: 0.14 });
    box(c - 3.7, base + 0.34, c + 3.7, base + 0.8, { tone: 1.26, round: 0.14, creases: [{ pts: [[c - 3.6, base + 0.56], [c + 3.6, base + 0.56]], w: 0.04, depth: 0.06 }] });

    // The small bell, hung in the jar on a thin rod.
    const j = base + 0.8;
    limb([[c, j + 7.2, 0.05], [c, j + 3.7, 0.05]], { tone: 1.2, shadow: 0, melt: 0 });
    blob([[c - 0.3, j + 3.7], [c + 0.3, j + 3.7], [c + 0.5, j + 2.9], [c + 1.05, j + 2.4, 'c'], [c, j + 2.3], [c - 1.05, j + 2.4, 'c'], [c - 0.5, j + 2.9]], { round: 0.4, tone: 1.28, warm: 0.84, hatch: 80, shadow: 0, band: 0.12 });
    limb([[c, j + 2.3, 0.18], [c, j + 2.2, 0.18]], { tone: 1.3, warm: 0.84, shadow: 0, melt: 0 });

    // The bell jar: a pale wash of glass with a bright drawn edge and a long window light.
    const jar = [[c - 3.4, j, 'c'], [c - 3.5, j + 2.6], [c - 3.3, j + 5.0], [c - 2.3, j + 6.8], [c - 0.9, j + 7.6], [c + 0.9, j + 7.6], [c + 2.3, j + 6.8], [c + 3.3, j + 5.0], [c + 3.5, j + 2.6], [c + 3.4, j, 'c']];
    blob(jar, { round: 1.6, tone: 0.5, alpha: 0.26, hatch: 80, shadow: 0, spacing: 1.5, band: 0.5 });
    line([...jar.map((p) => [p[0], p[1]])], { w: 0.09, v: 0.86, taper: false });
    line([[c - 2.7, j + 0.8], [c - 2.9, j + 3.0], [c - 2.6, j + 5.0], [c - 1.7, j + 6.4]], { w: 0.14, v: 0.6 });
    line([[c - 1.9, j + 1.4], [c - 2.1, j + 3.2], [c - 1.9, j + 4.6]], { w: 0.07, v: 0.4 });
    line([[c + 2.9, j + 1.2], [c + 3.0, j + 3.2], [c + 2.7, j + 4.8]], { w: 0.06, v: 0.34 });
    // The glass knob.
    limb([[c, j + 7.6, 0.34], [c, j + 7.9, 0.2], [c, j + 8.3, 0.5], [c, j + 8.6, 0.42]], { tone: 1.24, hatch: 80, shadow: 0.2, melt: 0 });
  },
};
