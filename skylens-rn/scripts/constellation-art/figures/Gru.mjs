// The Crane in flight, seen from below as it passes over: neck drawn out straight through the
// delta pair, Mu and Lambda to the head at Aldhanab, Alnair on the near wing, Tiaki at the vent,
// and the long legs trailing through Epsilon to the toes at Zeta. The warm note is the bill.
import { feather, frame, wing } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Crane',
  pixels: 1000,
  anchors: [['Aldhanab', 'head'], [109111, 'neck'], [109908, 'neck'], [110997, 'breast'], ['Alnair', 'wing'], ['Tiaki', 'vent'], ['ε Gru', 'leg'], ['ζ Gru', 'foot']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const del = s('δ¹ Gru'), ald = s('Aldhanab'), tia = s('Tiaki'), eps = s('ε Gru'), zet = s('ζ Gru'), lam = s(109111), mu = s(109908);
    const L = frame(del, ald);
    const T = (f, u, w) => { const p = L(f, u); return w === undefined ? p : [...p, w]; };

    // The far leg, then the near one: bare, thin and jointed, streaming behind.
    limb([[...T(-0.4, -3.2), 0.3], [...T(0.4, -6.2), 0.17], [...T(0.5, -6.6), 0.2], [...T(0.9, -9.6), 0.11], [...T(1.2, -11.2), 0.07]], { tone: 0.84, hatch: L.angle + 80, shadow: 0.3 });
    for (const a of [-0.9, 0, 0.9]) line([T(1.2, -11.0), T(1.2 + a, -12.6)], { w: 0.07, v: 0.5 });

    // Tail, a short rounded fan.
    for (const f of [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5]) feather(E, T(f * 0.5, -2.6), T(f * 1.15, -5.6 + Math.abs(f) * 0.5), 0.46, { tone: 0.92, bend: f * 0.03 });

    // Far wing, with the fingered primaries of a soaring crane.
    wing(E, [T(-0.9, 1.2), T(-4.2, 2.6), T(-7.6, 3.0), T(-11.2, 1.6)], [
      [...T(-16.4, 2.0), 0.46], [...T(-17.0, 0.4), 0.5], [...T(-16.8, -1.3), 0.52], [...T(-16.0, -2.8), 0.54], [...T(-14.6, -4.0), 0.56], [...T(-12.8, -4.6), 0.62], [...T(-11.0, -4.8), 0.66], [...T(-9.0, -4.7), 0.68], [...T(-7.0, -4.5), 0.68], [...T(-5.0, -4.2), 0.68], [...T(-3.2, -3.8), 0.66],
    ], { tone: 1.0, from: 1, to: 0.05 });
    for (let i = 0; i < 9; i++) feather(E, T(-1.4 - i * 0.86, 1.8 + Math.sin(i / 3) * 0.5), T(-1.3 - i * 0.96, -2.9), 0.5, { tone: 0.96, bend: 0.05 });
    for (let i = 0; i < 11; i++) {
      const f = -1.8 - i * 0.92, top = 2.3 + Math.sin((i / 10) * Math.PI) * 0.5 - i * 0.05;
      feather(E, T(f, top), T(f - 0.5, top - 3.0 + i * 0.05), 0.44, { tone: 0.96, bend: 0.06 });
    }
    for (let i = 0; i < 12; i++) {
      const f = -1.5 - i * 0.84, top = 2.9 + Math.sin((i / 11) * Math.PI) * 0.5 - i * 0.07;
      feather(E, T(f, top), T(f - 0.4, top - 1.7), 0.32, { tone: 1.02, bend: 0.05 });
    }
    limb([[...T(-0.9, 1.3), 0.86], [...T(-4.4, 2.8), 0.56], [...T(-8.2, 3.2), 0.4], [...T(-11.4, 1.7), 0.2]], { tone: 1.04, hatch: L.angle + 8, shadow: 0.36 });

    // Near wing, through Alnair.
    wing(E, [T(0.9, 1.2), T(4.2, 2.6), T(7.6, 3.0), T(11.2, 1.6)], [
      [...T(16.4, 2.0), 0.46], [...T(17.0, 0.4), 0.5], [...T(16.8, -1.3), 0.52], [...T(16.0, -2.8), 0.54], [...T(14.6, -4.0), 0.56], [...T(12.8, -4.6), 0.62], [...T(11.0, -4.8), 0.66], [...T(9.0, -4.7), 0.68], [...T(7.0, -4.5), 0.68], [...T(5.0, -4.2), 0.68], [...T(3.2, -3.8), 0.66],
    ], { tone: 1.12, from: 1, to: 0.05 });
    for (let i = 0; i < 9; i++) feather(E, T(1.4 + i * 0.86, 1.8 + Math.sin(i / 3) * 0.5), T(1.3 + i * 0.96, -2.9), 0.5, { tone: 1.1, bend: -0.05 });
    for (let i = 0; i < 11; i++) {
      const f = 1.8 + i * 0.92, top = 2.3 + Math.sin((i / 10) * Math.PI) * 0.5 - i * 0.05;
      feather(E, T(f, top), T(f + 0.5, top - 3.0 + i * 0.05), 0.44, { tone: 1.16, bend: -0.06 });
    }
    for (let i = 0; i < 12; i++) {
      const f = 1.5 + i * 0.84, top = 2.9 + Math.sin((i / 11) * Math.PI) * 0.5 - i * 0.07;
      feather(E, T(f, top), T(f + 0.4, top - 1.7), 0.32, { tone: 1.2, bend: -0.05 });
    }
    limb([[...T(0.9, 1.3), 0.86], [...T(4.4, 2.8), 0.56], [...T(8.2, 3.2), 0.4], [...T(11.4, 1.7), 0.2]], { tone: 1.1, hatch: L.angle - 8, shadow: 0.36 });

    // Near leg, thigh from the vent at Tiaki, the knee joint short of Epsilon, the foot on Zeta.
    const kn = [eps[0] + 0.5, eps[1] + 1.0];
    limb([[tia[0] + 0.2, tia[1] + 0.3, 0.42], [(tia[0] + kn[0]) / 2, (tia[1] + kn[1]) / 2, 0.24], [kn[0], kn[1], 0.17], [kn[0] - 0.1, kn[1] - 0.25, 0.23], [eps[0], eps[1], 0.16], [(eps[0] + zet[0]) / 2, (eps[1] + zet[1]) / 2, 0.13], [zet[0], zet[1], 0.13]], { tone: 1.04, hatch: L.angle + 80, shadow: 0.34 });
    for (const a of [[-2.0, -0.2], [-1.3, -1.5], [-0.2, -1.8]]) line([zet, [zet[0] + a[0] * 0.5, zet[1] + a[1] * 0.5], [zet[0] + a[0], zet[1] + a[1]]], { w: 0.1, v: 0.66 });

    // Body, slim and tapered.
    blob([T(-1.0, 2.2), T(-1.7, 0.5), T(-1.5, -1.4), T(-0.9, -3.0), T(0, -4.4, ), T(0.9, -3.0), T(1.5, -1.4), T(1.7, 0.5), T(1.0, 2.2), T(0, 2.9)], {
      round: 1.3, tone: 1.12, hatch: L.angle + 32, shadow: 0.5,
      creases: [
        { pts: [T(-1.1, 1.2), T(-0.6, 0.4), T(0, 0.8), T(0.6, 0.4), T(1.1, 1.2)], w: 0.09, depth: 0.1 },
        { pts: [T(-1.3, -0.3), T(-0.6, -0.9), T(0, -0.5), T(0.6, -0.9), T(1.3, -0.3)], w: 0.09, depth: 0.1 },
        { pts: [T(-1.1, -1.8), T(-0.5, -2.3), T(0, -1.9), T(0.5, -2.3), T(1.1, -1.8)], w: 0.09, depth: 0.1 },
      ],
    });

    // The long neck and head.
    limb([[...T(0.1, 2.0), 1.0], [mu[0], mu[1], 0.6], [lam[0], lam[1], 0.42], [...T(-0.04, 7.8), 0.36], [...T(0, 9.0), 0.4]], { tone: 1.14, hatch: L.angle + 80, shadow: 0.44 });
    const H = (f, u) => T(f, 9.1 + u);
    limb([[...H(0.02, 1.0), 0.24], [...H(0.05, 2.0), 0.13], [...H(0.08, 3.4), 0.015]], { tone: 1.26, warm: 0.8, shadow: 0.2, flat: 0.6, melt: 0 });
    blob([H(-0.46, -1.0), H(-0.66, -0.1), H(-0.54, 0.7), H(-0.14, 1.3), H(0.24, 1.3), H(0.56, 0.7), H(0.6, -0.1), H(0.42, -1.0)], {
      round: 0.46, tone: 1.22, hatch: L.angle + 40, shadow: 0.4,
      creases: [{ pts: [H(-0.42, 0.42), H(0, 0.62), H(0.42, 0.42)], w: 0.05, depth: 0.08 }],
    });
  },
};
