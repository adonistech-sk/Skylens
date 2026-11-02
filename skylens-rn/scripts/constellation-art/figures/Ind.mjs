// The Indus: an unnamed person seated at rest on a low rock, in a plain tunic, one knee raised with
// a forearm resting on it, looking out east. The stars give the pose: Alpha the head, Eta the chest,
// Beta the seat, Theta the raised knee, Delta the planted foot. A small clasp is the warm note.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Indus',
  pixels: 1000,
  anchors: [['α Ind', 'head'], ['η Ind', 'chest'], ['β Ind', 'seat'], ['θ Ind', 'knee'], ['δ Ind', 'foot']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const eta = s('η Ind');
    // The ground runs Beta to Delta, so the upright frame stands square on it. -f is forward.
    const L = frame(eta, [5.6, 8.7]);
    const P = (f, u) => L(f, u);
    const a = L.angle;
    const q = (f, u) => [...P(f, u), 'c'];
    const H = (f, u) => P(f, u - 3.72);

    // The ground, a few long strokes.
    line([P(-12.0, -7.5), P(-6.0, -7.46), P(-1.8, -7.5)], { w: 0.07, v: 0.5 });
    line([P(-11.0, -7.82), P(-7.4, -7.8), P(-4.6, -7.84)], { w: 0.05, v: 0.34 });
    line([P(3.8, -7.5), P(6.4, -7.46)], { w: 0.06, v: 0.4 });

    // The far arm, straight, propping the body on the rock behind.
    limb([[...P(1.0, 2.5), 0.74], [...P(2.0, 0.2), 0.56], [...P(2.3, -0.8), 0.48], [...P(2.8, -3.0), 0.38], [...P(3.0, -4.4), 0.32]], { tone: 1.02, hatch: a + 80, shadow: 0.46, creases: [{ pts: [P(1.9, -0.7), P(2.3, -0.9), P(2.7, -0.7)], w: 0.05, depth: 0.08 }] });

    // The rock.
    blob([q(-1.8, -7.45), P(-1.6, -6.4), P(-0.8, -5.6), P(0.8, -5.3), P(2.4, -4.9), P(3.8, -5.2), P(4.9, -6.2), q(5.3, -7.45)], {
      round: 0.7, tone: 1.3, hatch: a + 40, shadow: 0.4, band: 0.26,
      creases: [
        { pts: [P(0.6, -5.4), P(1.0, -6.2), P(0.6, -7.3)], w: 0.07, depth: 0.14 }, { pts: [P(2.8, -5.0), P(2.4, -6.0), P(3.0, -6.9)], w: 0.07, depth: 0.14 },
        { pts: [P(4.2, -5.6), P(3.8, -6.4), P(4.2, -7.3)], w: 0.05, depth: 0.1 }, { pts: [P(1.0, -6.2), P(1.8, -6.5), P(2.4, -6.0)], w: 0.05, depth: 0.1 },
      ],
    });
    blob([P(0.0, -4.6), P(3.0, -4.56), P(3.6, -4.7), P(3.3, -4.95), P(0.0, -5.1)], { round: 0.14, tone: 1.2, hatch: a, shadow: 0.2, band: 0.08 });
    blob([P(2.8, -4.3), P(3.3, -4.3), P(3.6, -4.8), P(3.0, -5.0), P(2.5, -4.86)], { round: 0.2, tone: 1.2, hatch: a + 40, shadow: 0.3, band: 0.1 });

    // The far leg, folded and lying on the ground.
    limb([[...P(0.0, -4.7), 1.0], [...P(-2.0, -4.9), 0.86], [...P(-3.9, -5.3), 0.6]], { tone: 1.02, hatch: a + 70, shadow: 0.44 });
    limb([[...P(-4.0, -5.4), 0.6], [...P(-2.8, -6.3), 0.56], [...P(-1.6, -6.8), 0.36], [...P(-1.0, -6.9), 0.3]], { tone: 1.06, hatch: a + 60, shadow: 0.44 });
    blob([P(-1.3, -6.5), P(-0.9, -6.54), P(-0.1, -7.0), P(0.3, -7.3), P(-0.3, -7.42), P(-1.3, -7.3)], { round: 0.2, tone: 1.14, hatch: a, shadow: 0.34, band: 0.12 });

    // The near leg: thigh to the knee on Theta, shin down to the foot on Delta.
    limb([[...P(0.2, -4.5), 1.24], [...P(-2.0, -3.9), 1.04], [...P(-3.8, -3.2), 0.78], [...P(-4.7, -2.96), 0.7]], { tone: 1.16, hatch: a + 66, shadow: 0.52, creases: [{ pts: [P(-2.0, -3.2), P(-3.6, -2.7)], w: 0.06, depth: 0.08 }] });
    limb([[...P(-4.76, -2.98), 0.7], [...P(-5.7, -3.9), 0.7], [...P(-6.6, -4.7), 0.66], [...P(-7.8, -5.7), 0.42], [...P(-8.8, -6.3), 0.34]], {
      tone: 1.2, hatch: a + 40, shadow: 0.5,
      creases: [{ pts: [P(-5.0, -3.8), P(-6.0, -4.9), P(-7.2, -5.8)], w: 0.06, depth: 0.08 }, { pts: [P(-4.3, -3.1), P(-4.7, -3.4), P(-5.2, -3.1)], w: 0.04, depth: 0.06 }],
      bumps: [{ at: P(-4.7, -2.9), r: [0.6, 0.6], h: 0.1 }],
    });
    blob([P(-8.4, -6.0), P(-9.0, -6.0), P(-9.8, -6.5), P(-10.8, -6.9), P(-11.0, -7.26), P(-10.0, -7.42), P(-8.8, -7.42), P(-8.2, -7.2), P(-8.1, -6.6)], { round: 0.3, tone: 1.24, hatch: a, shadow: 0.36, band: 0.14, creases: [{ pts: [P(-10.0, -7.0), P(-10.4, -7.3)], w: 0.025, depth: 0.05 }, { pts: [P(-10.4, -6.9), P(-10.7, -7.2)], w: 0.025, depth: 0.05 }] });

    // The tunic, a single plain garment, shoulders to mid-thigh.
    const folds = [
      { pts: [P(-0.9, 1.9), P(-0.3, 0.8), P(-0.6, -0.6)], w: 0.08, depth: 0.11 }, { pts: [P(0.4, 2.2), P(0.7, 0.8), P(0.3, -0.6)], w: 0.09, depth: 0.12 },
      { pts: [P(1.3, 1.6), P(1.3, 0.4), P(1.0, -0.6)], w: 0.07, depth: 0.1 },
      { pts: [P(-1.0, -1.4), P(-1.6, -2.4), P(-2.8, -3.0)], w: 0.1, depth: 0.14 }, { pts: [P(0.0, -1.4), P(-0.8, -2.9), P(-2.4, -3.8)], w: 0.1, depth: 0.14 },
      { pts: [P(1.0, -1.4), P(0.6, -3.1), P(-1.2, -4.5)], w: 0.1, depth: 0.14 },
    ];
    blob([P(-0.6, 3.5), P(-1.4, 3.1), P(-1.66, 2.2), P(-1.5, 0.9), P(-1.3, -0.4), P(-1.5, -1.2), P(-2.4, -2.1), P(-3.3, -2.4), q(-3.5, -2.5), P(-3.3, -3.4), q(-3.0, -4.6), P(-1.6, -5.0), P(0.2, -5.5), P(1.5, -5.2), P(1.9, -4.2), P(1.8, -2.4), P(1.6, -0.8), P(1.6, 1.0), P(1.7, 2.4), P(1.2, 3.3), P(0.4, 3.6)], {
      round: 1.4, tone: 1.24, hatch: a + 66, shadow: 0.56, band: 0.26, creases: folds,
      bumps: [{ at: P(-0.4, 1.6), r: [1.2, 1.2], h: 0.2 }],
    });
    // A plain belt.
    limb([[...P(-1.3, -0.74), 0.17], [...P(0.1, -1.0), 0.2], [...P(1.6, -0.74), 0.17]], { tone: 1.34, hatch: a, shadow: 0.34, melt: 0, band: 0.08 });
    line([P(-1.4, 3.0), P(-0.1, 2.9), P(1.1, 3.3)], { w: 0.05, v: 0.42 });

    // The neck and head in quiet profile, looking east.
    limb([[...P(0.1, 3.0), 0.68], [...P(0.0, 3.6), 0.54], [...P(0.0, 4.0), 0.54]], { tone: 1.14, hatch: a + 80, shadow: 0.44 });
    blob([H(0.9, 7.5), H(1.2, 8.3), H(1.1, 9.2), H(0.5, 9.9), H(-0.3, 10.0), H(-0.84, 9.7), H(-1.0, 9.2), H(-0.98, 8.96), [...H(-1.26, 8.64), 'c'], H(-1.0, 8.5), H(-1.08, 8.3), H(-0.92, 8.12), H(-0.98, 7.86), H(-0.76, 7.5), H(-0.2, 7.36), H(0.5, 7.4)], {
      round: 0.74, tone: 1.3, hatch: a + 30, shadow: 0.46, band: 0.16,
      creases: [
        { pts: [H(-0.98, 9.06), H(-0.7, 9.1), H(-0.4, 9.0)], w: 0.035, depth: 0.08 }, { pts: [H(-0.8, 8.94), H(-0.62, 8.9), H(-0.44, 8.92)], w: 0.03, depth: 0.07 },
        { pts: [H(-0.96, 8.2), H(-0.66, 8.2), H(-0.5, 8.1)], w: 0.03, depth: 0.06 }, { pts: [H(-0.1, 7.5), H(0.2, 8.0), H(0.3, 8.4)], w: 0.04, depth: 0.06 },
        { pts: [H(0.3, 8.9), H(0.5, 8.9), H(0.52, 8.5), H(0.3, 8.34), H(0.2, 8.5)], w: 0.03, depth: 0.06 },
      ],
    });
    // Short close-cut hair, in plain strokes.
    for (const w of [[H(-0.9, 9.4), H(-0.4, 9.8), H(0.2, 9.6)], [H(-0.3, 9.9), H(0.3, 9.9), H(0.8, 9.4)], [H(0.3, 9.5), H(0.8, 9.2), H(1.0, 8.6)], [H(0.5, 9.0), H(0.9, 8.6), H(0.9, 8.0)], [H(-0.3, 9.5), H(0.1, 9.3), H(0.5, 8.9)]]) line(w, { w: 0.07, v: 0.62 });

    // The near arm, the upper arm down, the forearm laid across the raised knee.
    limb([[...P(-0.5, 2.6), 0.76], [...P(-1.3, 0.9), 0.6], [...P(-2.0, -0.2), 0.5]], { tone: 1.22, hatch: a + 70, shadow: 0.52 });
    limb([[...P(-2.0, -0.2), 0.5], [...P(-3.2, -1.1), 0.44], [...P(-4.4, -2.0), 0.33]], { tone: 1.28, hatch: a + 40, shadow: 0.5, creases: [{ pts: [P(-1.7, -0.6), P(-2.1, -0.2), P(-2.5, -0.5)], w: 0.04, depth: 0.06 }] });
    blob([P(-4.2, -1.66), P(-4.9, -1.8), P(-5.5, -2.26), P(-5.7, -2.76), P(-5.1, -2.7), P(-4.6, -2.56), P(-4.2, -2.3)], { round: 0.22, tone: 1.32, hatch: a + 40, shadow: 0.34, band: 0.12, creases: [{ pts: [P(-5.0, -2.1), P(-5.3, -2.6)], w: 0.025, depth: 0.05 }, { pts: [P(-4.74, -2.1), P(-5.0, -2.6)], w: 0.025, depth: 0.05 }] });

    // A round clasp at the shoulder, the one warm thing about the figure.
    const cl = P(0.2, 2.9);
    limb([[cl[0], cl[1], 0.23], [cl[0] + 0.01, cl[1], 0.23]], { tone: 1.5, warm: 0.84, shadow: 0.3, melt: 0 });
  },
};
