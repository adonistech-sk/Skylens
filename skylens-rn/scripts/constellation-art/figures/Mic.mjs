// The Microscope, an 18th-century brass tripod instrument on its wooden base. Epsilon and Gamma are
// on the collar of the body tube, Alpha on an upper scrolled leg, Theta on a lower one, and Iota at
// a foot on the base. The warm note is the knob of the slide drawer.
export default {
  tier: 'extended',
  subject: 'The Microscope',
  pixels: 1000,
  anchors: [['ε Mic', 'tube collar'], ['γ Mic', 'tube collar'], ['α Mic', 'upper leg'], ['θ¹ Mic', 'lower leg'], ['ι Mic', 'foot']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const eps = s('ε Mic'), gam = s('γ Mic'), alp = s('α Mic'), the = s('θ¹ Mic'), iot = s('ι Mic');
    const cx = (eps[0] + gam[0]) / 2;
    const stage = -1.5, foot = -7.8;
    const box = (x0, y0, x1, y1, o = {}) => blob([[x0, y0, 'c'], [x1, y0, 'c'], [x1, y1, 'c'], [x0, y1, 'c']], { round: 0.3, band: 0.2, hatch: 86, shadow: 0.42, ...o });

    // The wooden base, with a moulded top and a small drawer for slides.
    box(cx - 6.2, foot - 2.9, cx + 6.2, foot - 0.4, {
      tone: 1.06, round: 0.4,
      creases: [{ pts: [[cx - 5.9, foot - 2.6], [cx + 5.9, foot - 2.6]], w: 0.05, depth: 0.08 }, { pts: [[cx - 3.0, foot - 2.2], [cx + 3.0, foot - 2.2], [cx + 3.0, foot - 0.9], [cx - 3.0, foot - 0.9], [cx - 3.0, foot - 2.2]], w: 0.05, depth: 0.08 }],
    });
    limb([[cx, foot - 1.5, 0.3], [cx + 0.01, foot - 1.5, 0.3]], { tone: 1.3, warm: 0.84, shadow: 0.3, melt: 0 });
    box(cx - 6.7, foot - 0.4, cx + 6.7, foot + 0.2, { tone: 1.8, round: 0.2, hatch: 6, creases: [{ pts: [[cx - 6.5, foot - 0.1], [cx + 6.5, foot - 0.1]], w: 0.04, depth: 0.07 }] });

    // Back leg, drawn first, then the two lower scrolls: S-curves from stage to base.
    const scroll = (sg, tone, mid) => {
      const pts = [[cx + sg * 3.5, stage - 0.2, 0.2], [cx + sg * 2.0, stage - 1.2, 0.3], mid, [cx + sg * 3.9, -6.4, 0.34], [cx + sg * 4.06, foot + 0.84, 0.22]];
      limb(pts, { tone, hatch: 80, shadow: 0.4, melt: 0, band: 0.12, creases: [{ pts: pts.map((p) => [p[0], p[1]]), w: 0.03, depth: 0.05 }] });
      limb([[cx + sg * 4.06, foot + 0.9, 0.2], [cx + sg * 4.1, foot + 0.46, 0.36], [cx + sg * 4.14, foot + 0.24, 0.56]], { tone: tone * 1.1, hatch: 80, shadow: 0.3, melt: 0, band: 0.08 });
      limb([[cx + sg * 3.5, stage - 0.2, 0.08], [cx + sg * 3.9, stage - 0.6, 0.2], [cx + sg * 3.3, stage - 0.9, 0.16], [cx + sg * 3.1, stage - 0.56, 0.07]], { tone, shadow: 0.26, melt: 0, band: 0.06 });
    };
    limb([[cx, stage - 0.2, 0.26], [cx, -5.0, 0.2], [cx, foot + 0.3, 0.4]], { tone: 0.94, hatch: 84, shadow: 0.2, melt: 0 });
    scroll(1, 1.16, [iot[0] - 0.3, -3.6, 0.36]);
    scroll(-1, 1.16, [the[0], the[1], 0.36]);

    // The mirror on its gimbal, between the lower legs.
    const my = -5.4, mr = 1.5;
    limb([[cx - mr - 0.5, my + 0.8, 0.1], [cx - mr - 0.5, my, 0.13], [cx - mr - 0.3, my - 1.0, 0.1]], { tone: 1.2, shadow: 0.2, melt: 0 });
    limb([[cx + mr + 0.5, my + 0.8, 0.1], [cx + mr + 0.5, my, 0.13], [cx + mr + 0.3, my - 1.0, 0.1]], { tone: 1.2, shadow: 0.2, melt: 0 });
    limb([[cx - mr - 0.3, my - 1.0, 0.1], [cx, my - 1.3, 0.13], [cx + mr + 0.3, my - 1.0, 0.1]], { tone: 1.2, shadow: 0.2, melt: 0 });
    const mp = []; for (let i = 0; i < 16; i++) { const q = (i / 16) * Math.PI * 2; mp.push([cx + Math.cos(q) * mr, my + Math.sin(q) * mr * 0.62]); }
    blob(mp, { round: 0.3, tone: 1.3, hatch: 8, shadow: 0.34, band: 0.08 });
    const mi = mp.map((p) => [cx + (p[0] - cx) * 0.76, my + (p[1] - my) * 0.76]);
    blob(mi, { round: 0.4, tone: 0.72, hatch: 60, shadow: 0.1, band: 0.08 });
    line([[cx - 0.7, my + 0.2], [cx - 0.1, my + 0.5]], { w: 0.09, v: 0.7 });
    limb([[cx, my + 1.0, 0.1], [cx, stage - 0.14, 0.05]], { tone: 0.8, alpha: 0.3, shadow: 0, melt: 0 });

    // The upper scrolled legs, from the collar out and down to the stage. Alpha rides the right one.
    const upper = (sg, tone, hit) => {
      const pts = [[cx + sg * 1.5, 3.1, 0.18], hit, [cx + sg * 4.6, 1.2, 0.26], [cx + sg * 4.0, 0.0, 0.26], [cx + sg * 4.4, stage + 0.34, 0.2]];
      limb(pts, { tone, hatch: 70, shadow: 0.4, melt: 0, band: 0.1, creases: [{ pts: pts.map((p) => [p[0], p[1]]), w: 0.03, depth: 0.05 }] });
      limb([[cx + sg * 1.5, 3.1, 0.08], [cx + sg * 1.36, 3.56, 0.2], [cx + sg * 1.84, 3.7, 0.16], [cx + sg * 1.94, 3.3, 0.07]], { tone, shadow: 0.26, melt: 0, band: 0.06 });
    };
    upper(-1, 1.08, [cx - 3.7, 2.7, 0.24]);
    limb([[cx, 3.0, 0.2], [cx, 0.0, 0.16]], { tone: 0.82, hatch: 84, shadow: 0.1, melt: 0 });

    // The objective nose, tapering into the stage.
    limb([[cx, 2.9, 1.34], [cx, 2.1, 1.04], [cx, 1.5, 0.84], [cx, 1.3, 0.96], [cx, 1.1, 0.7], [cx, 0.3, 0.46], [cx, 0.06, 0.56], [cx, -0.3, 0.3]], { tone: 1.24, hatch: 84, shadow: 0.4, melt: 0, band: 0.12, creases: [{ pts: [[cx - 0.8, 1.72], [cx + 0.8, 1.72]], w: 0.04, depth: 0.07 }] });

    // The stage, with a slide across it and the hole for the light.
    box(cx - 5.2, stage - 0.22, cx + 5.2, stage + 0.26, { tone: 2.1, round: 0.14, hatch: 6, creases: [{ pts: [[cx - 5, stage + 0.02], [cx + 5, stage + 0.02]], w: 0.03, depth: 0.05 }] });
    box(cx - 2.4, stage + 0.26, cx + 2.4, stage + 0.42, { tone: 1.3, round: 0.06, hatch: 6, shadow: 0.2, band: 0.05 });

    upper(1, 1.2, [alp[0], alp[1], 0.26]);

    // The body: the outer tube with its heavy collar at the stars.
    limb([[cx, 3.1, 1.5], [cx, 3.4, 1.66], [cx, 3.7, 1.5]], { tone: 1.24, hatch: 84, shadow: 0.36, melt: 0, band: 0.14 });
    box(cx - 1.42, 3.7, cx + 1.42, 7.9, {
      round: 1.0, tone: 1.34, band: 0.2,
      creases: [
        { pts: [[cx - 1.3, 5.3], [cx, 5.16], [cx + 1.3, 5.3]], w: 0.05, depth: 0.08 }, { pts: [[cx - 1.3, 6.8], [cx, 6.66], [cx + 1.3, 6.8]], w: 0.05, depth: 0.08 },
        ...[5.9, 6.1, 6.3].map((y) => ({ pts: [[cx - 1.3, y], [cx, y - 0.14], [cx + 1.3, y]], w: 0.03, depth: 0.05 })),
      ],
    });
    // The collar proper on Epsilon and Gamma.
    limb([[eps[0] - 0.1, eps[1], 0.32], [gam[0] + 0.1, gam[1], 0.32]], { tone: 1.32, hatch: 6, shadow: 0.44, melt: 0, band: 0.08, creases: [{ pts: [[eps[0], eps[1] + 0.04], [gam[0], gam[1] + 0.04]], w: 0.04, depth: 0.08 }] });
    limb([[eps[0] + 0.16, eps[1] + 0.52, 0.14], [gam[0] - 0.16, gam[1] + 0.52, 0.14]], { tone: 1.28, hatch: 6, shadow: 0.3, melt: 0 });

    // The draw tube and the eyepiece, in hard-edged stepped brass.
    box(cx - 1.62, 7.9, cx + 1.62, 8.34, { tone: 1.9, round: 0.14, hatch: 6 });
    box(cx - 1.06, 8.34, cx + 1.06, 10.1, { round: 0.8, tone: 1.3, band: 0.14, creases: [{ pts: [[cx - 0.96, 9.2], [cx, 9.08], [cx + 0.96, 9.2]], w: 0.04, depth: 0.07 }, { pts: [[cx - 0.96, 9.4], [cx, 9.28], [cx + 0.96, 9.4]], w: 0.03, depth: 0.05 }] });
    box(cx - 1.34, 10.1, cx + 1.34, 10.5, { tone: 1.9, round: 0.14, hatch: 6 });
    box(cx - 0.8, 10.5, cx + 0.8, 11.3, { round: 0.6, tone: 1.3, band: 0.12 });
    box(cx - 1.06, 11.3, cx + 1.06, 11.62, { tone: 1.9, round: 0.12, hatch: 6 });
  },
};
