// The Hero, flying on winged sandals with the sickle-sword thrust out and the Gorgon's head swung
// from his fist. Algol and the faint star beside it are Medusa's two eyes, rho her mouth, and
// omega and pi her cheeks. Miram is his head, gamma his throat, Mirfak his chest, epsilon the knee,
// zeta and Atik the forward foot, mu the bent back knee, and phi the line of the blade.
// The warm note is the sword's hilt.
import { frame, feather } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Hero',
  pixels: 1100,
  anchors: [['Miram', 'head'], [14328, 'throat'], ['Mirfak', 'chest'], ['δ Per', 'hip'], [17529, 'thigh'], ['ε Per', 'knee'], ['Menkib', 'calf'], [18246, 'heel'], ['Atik', 'toes'], ['μ Per', 'back knee'], ['λ Per', 'shin'], ['Misam', 'wrist'], ['Algol', "Medusa's eye"], [13949, "Medusa's eye"], ['ρ Per', "Medusa's mouth"], ['ω Per', "Medusa's cheek"], ['π Per', "Medusa's cheek"], ['θ Per', 'elbow'], ['φ Per', 'sword'], ['τ Per', 'shoulder'], ['ι Per', 'ribs']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const L = frame([-2.8, 1.2], [4.4, 10.3]);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const eyeA = s('Algol'), eyeB = s(13949), mouth = s('ρ Per');
    const the = L.back(s('θ Per')), eps = L.back(s('ε Per')), men = L.back(s('Menkib')), mu = L.back(s('μ Per')), zet = L.back(s(18246)), ati = L.back(s('Atik'));

    // A little wing on a heel: three feathers fanned back.
    const talaria = (at, a) => { for (const [da, l, w] of [[-30, 2.4, 0.34], [-6, 2.9, 0.36], [20, 2.5, 0.34]]) { const t = ((a + da) * Math.PI) / 180; feather(E, at, [at[0] + Math.cos(t) * l, at[1] + Math.sin(t) * l], w, { tone: 1.3, bend: 0.1 }); } };

    // Short cloak, streaming straight out behind him in long soft waves.
    blob([[2.0, 11.2], [-1.8, 12.4], [-5.2, 11.8], [-8.6, 12.6], [-12.0, 12.0], [-14.2, 12.8, 'c'], [-12.6, 10.6], [-13.2, 8.8], [-15.0, 8.2, 'c'], [-11.4, 7.8], [-8.6, 8.4], [-6.0, 6.8], [-3.4, 6.2], [-0.6, 7.4]], {
      round: 1.3, tone: 1.14, hatch: 8, shadow: 0, band: 0.6,
      creases: [{ pts: [[0.0, 10.8], [-4.4, 10.4], [-8.6, 11.0], [-12.8, 11.4]], w: 0.18, depth: 0.26 }, { pts: [[-0.8, 9.4], [-4.8, 8.8], [-8.4, 9.8], [-12.6, 9.0]], w: 0.18, depth: 0.26 }, { pts: [[-1.8, 8.0], [-4.6, 7.4], [-7.2, 7.8]], w: 0.14, depth: 0.2 }],
      bumps: [{ at: [-6.6, 10.0], r: [3.4, 1.1], h: 0.34 }],
    });

    // Back leg, bent, the shin rising through lambda to the winged foot.
    const backFoot = L(-8.3, 4.8);
    talaria(backFoot, hatch + 150);
    limb(P([[mu[0], mu[1] - 0.2, 1.06], [-6.5, 1.0, 1.16], [-7.4, 3.4, 0.76], [-8.0, 4.6, 0.56]]), {
      tone: 1.0, hatch: hatch + 84, shadow: 0.4, creases: [{ pts: P([[-5.4, -0.6], [-5.8, 1.2], [-6.8, 3.2]]), w: 0.1, depth: 0.14 }],
      bumps: [{ at: L(-6.6, 0.8), r: [0.9, 1.5], h: 0.3 }],
    });
    blob(P([[-7.2, 4.2], [-8.8, 4.2], [-9.2, 5.2], [-9.6, 6.6], [-9.2, 7.4], [-8.4, 7.0], [-7.6, 5.6]]), { round: 0.4, tone: 1.1, hatch: hatch + 80, shadow: 0.4, creases: [{ pts: P([[-7.6, 4.8], [-8.4, 5.0], [-9.2, 4.9]]), w: 0.05, depth: 0.08 }] });
    limb(P([[-0.8, 0.4, 2.2], [-3.6, -0.8, 1.76], [mu[0] + 0.2, mu[1] - 0.2, 1.1]]), {
      tone: 1.06, hatch: hatch + 16, shadow: 0.5, creases: [{ pts: P([[-2.4, -1.6], [-4.0, -2.0], [-5.6, -2.4]]), w: 0.14, depth: 0.2 }, { pts: P([[-2.6, 1.0], [-4.2, 0.2], [-5.6, -0.6]]), w: 0.12, depth: 0.14 }],
      bumps: [{ at: L(-3.2, -0.6), r: [2.0, 1.0], h: 0.34 }, { at: L(mu[0] + 0.1, mu[1] - 0.2), r: [0.8, 0.8], h: 0.26 }],
    });

    // Forward leg, reaching, the winged sandal landing on the air through zeta and Atik.
    limb(P([[eps[0], eps[1], 1.14], [men[0] - 0.3, men[1] + 0.4, 1.2], [4.0, -12.0, 0.78], [zet[0] - 0.6, zet[1] + 0.6, 0.56]]), {
      tone: 1.08, hatch: hatch + 50, shadow: 0.46, creases: [{ pts: P([[0.8, -8.6], [1.8, -10.6], [3.6, -12.4]]), w: 0.11, depth: 0.16 }, { pts: P([[2.2, -7.6], [3.2, -9.4], [4.6, -11.0]]), w: 0.1, depth: 0.12 }],
      bumps: [{ at: L(men[0] - 0.4, men[1] + 0.6), r: [0.9, 1.6], angle: hatch + 44, h: 0.3 }, { at: L(eps[0], eps[1]), r: [0.86, 0.86], h: 0.3 }],
    });
    talaria(L(zet[0] - 0.4, zet[1] + 0.4), hatch - 30);
    blob(P([[zet[0] - 1.0, zet[1] + 0.4], [zet[0] - 0.4, zet[1] - 0.6], [zet[0] + 0.8, zet[1] - 0.2], [ati[0] + 0.6, ati[1] + 0.2], [ati[0] + 1.4, ati[1] + 2.2], [ati[0] + 0.4, ati[1] + 2.4], [ati[0] - 0.8, ati[1] + 1.0], [zet[0], zet[1] + 1.6]]), {
      round: 0.46, tone: 1.2, hatch: hatch + 60, shadow: 0.44,
      creases: [{ pts: P([[ati[0] - 0.2, ati[1] + 1.6], [ati[0] + 0.4, ati[1] + 1.3], [ati[0] + 1.0, ati[1] + 1.8]]), w: 0.05, depth: 0.08 }, { pts: P([[zet[0] + 0.6, zet[1] + 1.2], [zet[0] + 1.0, zet[1] + 0.6], [zet[0] + 1.8, zet[1] + 0.6]]), w: 0.06, depth: 0.09 }],
    });
    limb(P([[0.6, -0.2, 2.26], [1.3, -3.6, 1.86], [eps[0], eps[1] + 0.2, 1.2]]), {
      tone: 1.14, hatch: hatch + 88, shadow: 0.54, creases: [{ pts: P([[-0.6, -3.0], [-0.4, -4.8], [0.0, -6.4]]), w: 0.15, depth: 0.22 }, { pts: P([[2.8, -2.4], [2.8, -4.4], [2.0, -6.2]]), w: 0.13, depth: 0.18 }],
      bumps: [{ at: L(1.4, -3.2), r: [1.2, 2.4], h: 0.44 }, { at: L(eps[0], eps[1]), r: [0.9, 0.9], h: 0.36 }],
    });

    // Torso, lean, chest turned to us. Mirfak under the heart.
    blob(P([[-3.8, 9.6], [-1.4, 10.6], [1.0, 10.8], [3.6, 10.2], [4.2, 8.4], [3.0, 5.8], [2.2, 3.6], [2.8, 1.4], [3.0, -0.6], [0.2, -1.4], [-2.8, -0.4], [-2.6, 1.6], [-2.2, 3.6], [-2.8, 5.8], [-4.0, 8.0]]), {
      round: 1.9, tone: 1.42, hatch: hatch + 28, shadow: 0.6, band: 0.7,
      creases: [
        { pts: P([[0.2, 10.2], [0.1, 7.4], [0.1, 5.8]]), w: 0.15, depth: 0.24 }, { pts: P([[3.2, 7.8], [1.8, 6.0], [0.1, 5.8]]), w: 0.17, depth: 0.26 }, { pts: P([[-3.2, 7.8], [-1.6, 6.0], [0.1, 5.8]]), w: 0.17, depth: 0.26 },
        { pts: P([[0.1, 5.6], [0.1, 3.8], [0.1, 1.6]]), w: 0.11, depth: 0.18 }, { pts: P([[-1.8, 4.8], [0.1, 4.5], [1.9, 4.8]]), w: 0.09, depth: 0.13 }, { pts: P([[-1.7, 3.4], [0.1, 3.2], [1.8, 3.4]]), w: 0.09, depth: 0.13 },
      ],
      bumps: [{ at: L(-1.7, 7.6), r: [2.0, 1.5], h: 0.46 }, { at: L(1.9, 7.6), r: [2.0, 1.5], h: 0.46 }, ...[[-1.0, 4.1], [1.1, 4.1], [-1.0, 2.7], [1.1, 2.7]].map(([f, u]) => ({ at: L(f, u), r: [0.9, 0.62], h: 0.18 }))],
    });
    // Loincloth with a fluttering end.
    blob(P([[-2.8, 1.6], [0.1, 1.2], [3.0, 1.6], [3.6, -1.4], [4.8, -2.8, 'c'], [2.6, -2.4], [1.0, -3.8, 'c'], [-0.6, -2.4], [-2.8, -3.0, 'c'], [-3.6, -0.8]]), {
      round: 0.8, tone: 1.18, hatch: hatch + 80, shadow: 0.6, band: 0.5,
      creases: [{ pts: P([[-1.8, 1.0], [-1.8, -0.8], [-2.2, -2.4]]), w: 0.14, depth: 0.2 }, { pts: P([[0.2, 0.9], [0.5, -1.0], [0.9, -3.0]]), w: 0.14, depth: 0.2 }, { pts: P([[2.0, 1.0], [2.4, -0.6], [3.6, -2.2]]), w: 0.13, depth: 0.18 }],
    });
    limb(P([[-2.7, 1.7, 0.26], [0.1, 1.3, 0.3], [3.0, 1.7, 0.26]]), { tone: 1.3, hatch: hatch + 86, shadow: 0.4, melt: 0, flat: 0.5 });
    // Baldric across the chest.
    limb(P([[2.8, 10.0, 0.2], [0.8, 6.6, 0.2], [-2.4, 2.0, 0.18]]), { tone: 1.3, hatch: hatch + 30, shadow: 0.3, melt: 0, flat: 0.5 });

    // Medusa's head, swung by the snakes. Eyes on the stars, mouth on rho: she stares out at us.
    const cx = (eyeA[0] + eyeB[0]) / 2, cy = eyeA[1] - 0.9;
    const snake = (pts, tone) => {
      const end = pts[pts.length - 1], prev = pts[pts.length - 2], a = Math.atan2(end[1] - prev[1], end[0] - prev[0]), ca = Math.cos(a), sa = Math.sin(a);
      limb(pts, { tone, hatch: 40, shadow: 0.42, melt: 0, band: 0.2, flat: 0.8 });
      const Q = (u, v) => [end[0] + ca * u - sa * v, end[1] + sa * u + ca * v];
      blob([Q(-0.3, 0.22), Q(0.1, 0.34), [...Q(0.66, 0.05), 'c'], Q(0.1, -0.3), Q(-0.3, -0.22)], { round: 0.2, tone: tone * 1.12, shadow: 0.3, band: 0.14 });
      line([Q(0.1, 0.13), Q(0.2, 0.15)], { w: 0.04, v: 1 });
    };
    for (const [pts, t] of [
      [[[cx - 2.0, cy - 1.0, 0.24], [cx - 3.1, cy - 1.5, 0.22], [cx - 3.5, cy - 0.7, 0.19], [cx - 4.4, cy - 1.0, 0.15]], 1.02],
      [[[cx + 2.0, cy - 1.0, 0.24], [cx + 3.1, cy - 1.6, 0.22], [cx + 3.6, cy - 0.8, 0.19], [cx + 4.5, cy - 1.2, 0.15]], 1.02],
      [[[cx - 2.2, cy - 0.2, 0.26], [cx - 3.6, cy + 0.2, 0.24], [cx - 4.2, cy + 1.1, 0.2], [cx - 5.4, cy + 0.9, 0.16]], 1.08],
      [[[cx + 2.2, cy - 0.2, 0.26], [cx + 3.6, cy + 0.0, 0.24], [cx + 4.3, cy + 0.9, 0.2], [cx + 5.6, cy + 0.6, 0.16]], 1.08],
      [[[cx - 2.3, cy + 0.7, 0.26], [cx - 3.2, cy + 1.7, 0.24], [cx - 4.4, cy + 2.0, 0.2], [cx - 4.8, cy + 3.0, 0.16]], 1.14],
      [[[cx + 2.3, cy + 0.7, 0.26], [cx + 3.4, cy + 1.5, 0.24], [cx + 4.6, cy + 1.7, 0.2], [cx + 5.2, cy + 2.7, 0.16]], 1.14],
      [[[cx - 1.8, cy + 1.2, 0.26], [cx - 2.4, cy + 2.4, 0.24], [cx - 3.4, cy + 3.0, 0.2], [cx - 3.4, cy + 4.1, 0.16]], 1.18],
      [[[cx + 1.9, cy + 1.2, 0.26], [cx + 2.6, cy + 2.4, 0.24], [cx + 3.6, cy + 2.8, 0.2], [cx + 3.9, cy + 3.9, 0.16]], 1.18],
      [[[cx - 2.1, cy - 1.5, 0.22], [cx - 2.9, cy - 2.4, 0.2], [cx - 2.5, cy - 3.0, 0.17], [cx - 3.2, cy - 3.6, 0.13]], 0.98],
      [[[cx + 2.1, cy - 1.5, 0.22], [cx + 2.9, cy - 2.4, 0.2], [cx + 2.5, cy - 3.0, 0.17], [cx + 3.2, cy - 3.6, 0.13]], 0.98],
    ]) snake(pts, t);
    blob([[cx - 2.5, cy + 0.2], [cx - 2.2, cy + 1.7], [cx, cy + 2.5], [cx + 2.2, cy + 1.7], [cx + 2.5, cy + 0.2], [cx + 2.0, cy - 1.0], [cx - 2.0, cy - 1.0]], { round: 0.8, tone: 0.84, hatch: 60, shadow: 0.5, band: 0.3 });
    blob([[cx - 1.95, cy + 0.9], [cx - 1.98, cy - 0.6], [cx - 1.3, cy - 2.0], [cx - 0.4, cy - 2.56], [cx + 0.4, cy - 2.56], [cx + 1.3, cy - 2.0], [cx + 1.98, cy - 0.6], [cx + 1.95, cy + 0.9], [cx + 1.0, cy + 1.7], [cx - 1.0, cy + 1.7]], {
      round: 1.0, tone: 1.56, hatch: 86, shadow: 0.55, band: 0.4, spacing: 0.86,
      creases: [
        { pts: [[eyeA[0] - 0.62, eyeA[1] + 0.28], [eyeA[0], eyeA[1] + 0.46], [eyeA[0] + 0.56, eyeA[1] + 0.16]], w: 0.09, depth: 0.2 }, { pts: [[eyeB[0] - 0.56, eyeB[1] + 0.16], [eyeB[0], eyeB[1] + 0.46], [eyeB[0] + 0.62, eyeB[1] + 0.28]], w: 0.09, depth: 0.2 },
        { pts: [[cx - 0.14, eyeA[1] + 0.04], [cx - 0.2, cy - 0.5], [cx - 0.36, cy - 0.74], [cx + 0.36, cy - 0.74]], w: 0.05, depth: 0.1 },
        { pts: [[mouth[0] - 0.72, mouth[1] + 0.04], [mouth[0], mouth[1] - 0.14], [mouth[0] + 0.72, mouth[1] + 0.04]], w: 0.09, depth: 0.2 }, { pts: [[mouth[0] - 0.5, mouth[1] - 0.42], [mouth[0], mouth[1] - 0.6], [mouth[0] + 0.5, mouth[1] - 0.42]], w: 0.05, depth: 0.08 },
      ],
      bumps: [{ at: [cx, cy - 0.4], r: [0.3, 0.8], h: 0.16 }, { at: [cx - 1.1, cy - 1.0], r: [0.6, 0.6], h: 0.16 }, { at: [cx + 1.1, cy - 1.0], r: [0.6, 0.6], h: 0.16 }],
    });
    for (const e of [eyeA, eyeB]) line([[e[0] - 0.4, e[1]], [e[0], e[1] + 0.16], [e[0] + 0.4, e[1]], [e[0], e[1] - 0.14], [e[0] - 0.4, e[1]]], { w: 0.05, v: 1, taper: false });
    // Top snakes, twisted up into his fist.
    const wrist = s('Misam');
    for (const [dx, t] of [[-1.2, 1.2], [0.2, 1.3], [1.4, 1.2]]) limb([[cx + dx, cy + 1.4, 0.3], [cx + dx * 0.9 + 0.4, cy + 2.8, 0.3], [wrist[0] + 0.9 + dx * 0.16, wrist[1] - 0.6, 0.22]], { tone: t, hatch: 80, shadow: 0.42, melt: 0, band: 0.2 });

    // Gorgon arm, across the body to Misam. Fist closes on the snakes.
    limb(P([[-3.2, 9.0, 1.5], [-2.0, 6.2, 1.24], [0.2, 3.6, 0.96]]), {
      tone: 1.28, hatch: hatch + 60, shadow: 0.6, creases: [{ pts: P([[-3.8, 6.8], [-2.6, 4.8], [-0.8, 3.0]]), w: 0.11, depth: 0.16 }],
      bumps: [{ at: L(-3.0, 8.8), r: [1.3, 1.3], h: 0.4 }, { at: L(-1.8, 6.0), r: [0.7, 1.4], angle: hatch + 40, h: 0.26 }],
    });
    limb(P([[0.2, 3.6, 0.92], [2.6, 2.8, 0.98], [4.8, 2.3, 0.6]]), {
      tone: 1.28, hatch: hatch + 16, shadow: 0.55, creases: [{ pts: P([[0.8, 2.6], [2.6, 2.0], [4.2, 1.8]]), w: 0.09, depth: 0.14 }],
      bumps: [{ at: L(0.2, 3.6), r: [0.6, 0.6], h: 0.24 }, { at: L(2.4, 3.0), r: [1.3, 0.7], h: 0.24 }],
    });
    blob([[wrist[0] - 0.5, wrist[1] + 0.3], [wrist[0] + 0.8, wrist[1] + 0.5], [wrist[0] + 1.7, wrist[1] - 0.3], [wrist[0] + 1.7, wrist[1] - 1.2], [wrist[0] + 0.7, wrist[1] - 1.5], [wrist[0] - 0.3, wrist[1] - 0.8]], {
      round: 0.5, tone: 1.46, hatch: 40, shadow: 0.55,
      creases: [{ pts: [[wrist[0] + 0.0, wrist[1] - 1.1], [wrist[0] + 0.7, wrist[1] - 0.5], [wrist[0] + 1.1, wrist[1] + 0.3]], w: 0.06, depth: 0.1 }, { pts: [[wrist[0] + 0.6, wrist[1] - 1.3], [wrist[0] + 1.2, wrist[1] - 0.7], [wrist[0] + 1.6, wrist[1] - 0.1]], w: 0.06, depth: 0.1 }],
    });

    // The harpe: a straight blade through phi that hooks at the tip like a sickle.
    const hilt = L(8.3, 13.6), phi = s('φ Per');
    const tip0 = [phi[0] + 2.4, phi[1] + 0.2];
    blob([[hilt[0] + 0.1, hilt[1] + 0.34], [(hilt[0] + phi[0]) / 2, (hilt[1] + phi[1]) / 2 + 0.34], [phi[0], phi[1] + 0.36], [tip0[0], tip0[1] + 0.2], [tip0[0] + 1.3, tip0[1] - 0.4], [tip0[0] + 1.6, tip0[1] - 1.7], [tip0[0] + 0.6, tip0[1] - 2.8, 'c'], [tip0[0] + 0.5, tip0[1] - 1.4], [tip0[0] - 0.3, tip0[1] - 0.7], [phi[0], phi[1] - 0.46], [(hilt[0] + phi[0]) / 2, (hilt[1] + phi[1]) / 2 - 0.4], [hilt[0], hilt[1] - 0.34]], {
      round: 0.3, tone: 1.56, hatch: 6, shadow: 0.36, band: 0.2,
      creases: [{ pts: [[hilt[0] + 0.3, hilt[1]], [(hilt[0] + phi[0]) / 2, (hilt[1] + phi[1]) / 2 + 0.02], [phi[0], phi[1] - 0.04], [tip0[0], tip0[1] - 0.2]], w: 0.05, depth: 0.1 }],
    });
    // Sword arm: shoulder at tau, elbow on theta, forearm rising to the hilt.
    limb(P([[2.4, 9.6, 1.5], [the[0] - 1.2, the[1] + 0.4, 1.12], [the[0], the[1], 0.92]]), {
      tone: 1.3, hatch: hatch + 4, shadow: 0.6, creases: [{ pts: P([[2.2, 8.0], [3.6, 7.6], [4.8, 7.4]]), w: 0.11, depth: 0.16 }],
      bumps: [{ at: L(2.8, 9.6), r: [1.3, 1.3], h: 0.4 }, { at: L(3.6, 8.9), r: [1.2, 0.7], h: 0.24 }],
    });
    limb(P([[the[0], the[1], 0.88], [6.6, 10.2, 0.96], [7.7, 12.4, 0.58]]), {
      tone: 1.28, hatch: hatch + 66, shadow: 0.55, creases: [{ pts: P([[6.0, 8.8], [7.0, 10.2], [7.8, 11.8]]), w: 0.09, depth: 0.14 }],
      bumps: [{ at: L(the[0], the[1]), r: [0.6, 0.6], h: 0.24 }, { at: L(6.5, 10.2), r: [0.7, 1.3], angle: hatch + 56, h: 0.24 }],
    });
    // Hilt, the warm note: guard, grip, pommel, inside the fist.
    limb([[hilt[0] + 0.3, hilt[1] + 1.1, 0.2], [hilt[0] + 0.1, hilt[1], 0.3], [hilt[0] - 0.1, hilt[1] - 1.1, 0.2]], { tone: 1.4, warm: 0.8, shadow: 0.4, melt: 0, flat: 0.6 });
    const pom = L(7.3, 12.4);
    blob(P([[7.0, 12.0], [8.6, 12.3], [9.4, 13.2], [9.1, 14.2], [7.8, 14.2], [6.9, 13.3]]), {
      round: 0.5, tone: 1.46, hatch: hatch + 30, shadow: 0.55,
      creases: [{ pts: P([[7.2, 13.4], [8.2, 13.0], [9.3, 13.2]]), w: 0.06, depth: 0.1 }, { pts: P([[7.5, 13.9], [8.5, 13.6], [9.2, 13.8]]), w: 0.06, depth: 0.1 }],
    });
    blob([[pom[0] - 0.5, pom[1]], [pom[0], pom[1] + 0.3], [pom[0] + 0.3, pom[1] - 0.1], [pom[0], pom[1] - 0.5]], { round: 0.3, tone: 1.4, warm: 0.82, shadow: 0.3 });

    // Neck, then a head in true profile, looking down the blade, away from the Gorgon.
    const c = [5.1, 12.3], k = 1.32;
    const H = (f, u) => [c[0] + f * k, c[1] + u * k];
    const Q = (pts) => pts.map(([f, u, ...r]) => [...H(f, u), ...r]);
    limb([[...L(-0.2, 9.8), 1.12], [3.9, 10.2, 0.92], [4.4, 11.0, 0.86]], { tone: 1.24, hatch: 70, shadow: 0.5 });
    for (const pts of [[[-1.0, 0.8], [-1.8, 0.2], [-2.2, -0.8]], [[-1.0, 0.3], [-1.7, -0.3], [-1.9, -1.3]], [[-0.9, -0.3], [-1.3, -0.9], [-1.4, -1.6]]]) line(Q(pts), { w: 0.14, v: 0.72 });
    blob(Q([[-1.2, -0.8], [-1.5, 0.5], [-0.8, 1.6], [0.4, 1.7], [1.2, 1.0], [1.45, 0.2], [1.75, -0.2], [1.35, -0.5], [1.35, -1.0], [1.1, -1.4], [0.5, -1.7], [-0.2, -1.5], [-0.8, -1.2]]), {
      round: 1.2, tone: 1.56, hatch: 40, shadow: 0.55, spacing: 0.86,
      creases: [{ pts: Q([[0.5, 0.3], [0.95, 0.4], [1.3, 0.22]]), w: 0.1, depth: 0.22 }, { pts: Q([[0.9, -0.95], [1.22, -0.9]]), w: 0.06, depth: 0.12 }, { pts: Q([[1.3, -0.28], [1.5, -0.34], [1.4, -0.52]]), w: 0.05, depth: 0.1 }],
      bumps: [{ at: H(1.32, -0.2), r: [0.4, 0.6], h: 0.2 }],
    });
    line(Q([[0.72, 0.17], [0.98, 0.22], [1.2, 0.14]]), { w: 0.06, v: 1 });
    // The cap of darkness, with a wing, like the sandals.
    for (const [a, l, w] of [[172, 3.0, 0.4], [156, 3.6, 0.44], [138, 3.2, 0.42]]) { const t = (a * Math.PI) / 180, at = H(-0.3, 1.1); feather(E, at, [at[0] + Math.cos(t) * l, at[1] + Math.sin(t) * l], w, { tone: 1.3, bend: -0.1 }); }
    blob(Q([[1.4, 0.72], [0.6, 0.76], [-0.7, 0.56], [-1.56, 0.1], [-1.6, 1.0], [-1.0, 1.9], [0.0, 2.2], [1.0, 2.0], [1.5, 1.4]]), {
      round: 0.7, tone: 1.46, hatch: 14, shadow: 0.5, band: 0.3,
      creases: [{ pts: Q([[-1.5, 0.46], [0.0, 0.96], [1.42, 0.98]]), w: 0.1, depth: 0.16 }, { pts: Q([[-1.0, 1.0], [0.0, 1.5], [1.2, 1.5]]), w: 0.08, depth: 0.1 }],
    });
  },
};
