// The Chameleon, walking a bough with its tail curled in a watch-spring. Epsilon is on the casque
// of its helmeted head, Beta at the jaw, Gamma and Delta in the body, and Alpha at the start of the
// tail. The warm note is the turret of the eye.
export default {
  tier: 'extended',
  subject: 'The Chameleon',
  pixels: 1000,
  anchors: [['ε Cha', 'casque'], ['β Cha', 'jaw'], ['γ Cha', 'back'], [52595, 'flank'], ['α Cha', 'tail']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const eps = s('ε Cha'), bet = s('β Cha'), gam = s('γ Cha'), del = s(52595), alp = s('α Cha');

    // The bough.
    limb([[-12.0, -5.2, 0.22], [-6.0, -4.5, 0.34], [0.0, -4.4, 0.4], [6.0, -4.6, 0.4], [12.6, -3.6, 0.3], [15.4, -2.6, 0.14]], {
      tone: 1.0, hatch: 6, shadow: 0, melt: 0, band: 0.26,
      creases: [{ pts: [[-10, -4.9], [-4, -4.4], [2, -4.4]], w: 0.05, depth: 0.07 }, { pts: [[4, -4.6], [8, -4.4], [13, -3.5]], w: 0.05, depth: 0.07 }],
    });
    const leaf = (a, b, w) => {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), n = [-d[1] / l, d[0] / l];
      blob([[...a, 'c'], [m[0] + n[0] * w, m[1] + n[1] * w], [...b, 'c'], [m[0] - n[0] * w, m[1] - n[1] * w]], { round: w * 0.7, tone: 0.96, hatch: (Math.atan2(-d[1], d[0]) * 180) / Math.PI + 56, shadow: 0.3, band: 0.2, creases: [{ pts: [a, m, b], w: 0.05, depth: 0.07 }] });
    };
    leaf([-9.4, -4.7], [-11.2, -7.2], 0.7);
    leaf([-5.6, -4.5], [-5.2, -7.4], 0.72);
    leaf([12.0, -3.8], [14.2, -5.6], 0.66);
    leaf([3.0, -4.6], [4.4, -7.2], 0.7);

    // Tail: down from the rump through Alpha and rolled up in a spiral.
    // The curl, hand-sequenced, outer to inner.
    const curl = [[3.2, 1.0, 1.0], [5.4, 0.9, 0.7], [alp[0], alp[1], 0.5], [10.2, -0.6, 0.44], [12.0, -2.2, 0.4]];
    const hub = [10.2, -0.1];
    const Rmax = 2.6;
    const curlIn = [];
    for (let i = 1; i <= 42; i++) {
      const t = i / 42, q = (-58 + 720 * t) * (Math.PI / 180), R = Rmax * (1 - t) ** 1.1 + 0.12;
      curlIn.push([hub[0] + Math.cos(q) * R * 1.0, hub[1] + Math.sin(q) * R * 1.0 - 0.3, 0.38 * (1 - t * 0.74)]);
    }
    const rings = [];
    limb([...curl.slice(0, 4), ...curlIn], { tone: 1.12, hatch: 60, shadow: 0.5, melt: 0, band: 0.2, creases: rings });

    // Far legs, then body.
    const leg = (hip, knee, foot, tone) => {
      limb([[...hip, 0.72], [...knee, 0.42], [foot[0], foot[1] + 0.3, 0.26]], { tone, hatch: 70, shadow: 0.42, band: 0.2 });
      for (const [dx, dy] of [[-0.7, -0.5], [0.7, -0.5]]) limb([[foot[0], foot[1] + 0.4, 0.2], [foot[0] + dx * 0.7, foot[1] + 0.1, 0.17], [foot[0] + dx, foot[1] + dy, 0.07]], { tone: tone * 1.04, shadow: 0.3, melt: 0 });
    };
    leg([-2.2, -0.4], [-1.0, -2.2], [-2.6, -3.9], 0.92);
    leg([2.8, -0.4], [4.4, -1.6], [3.4, -3.8], 0.92);

    // The body: high-arched and flat-sided, a sawtooth crest along the spine.
    const beads = [];
    for (let x = -4; x < 4.8; x += 0.62) for (let y = -2.0; y < 2.8; y += 0.56) {
      const q = x + (Math.round(y / 0.56) % 2 ? 0.31 : 0);
      if (Math.hypot(q / 4.8, (y - 0.6) / 2.3) > 0.94) continue;
      beads.push({ pts: [[q - 0.2, y + 0.05], [q, y - 0.15], [q + 0.2, y + 0.05]], w: 0.024, depth: 0.04 });
    }
    blob([[-4.6, 2.0], [-2.0, 2.9], [gam[0] + 0.4, 3.2], [3.0, 2.5], [4.8, 1.2], [5.4, 0.4], [4.6, -0.8], [2.6, -1.6], [del[0], -2.0], [-2.2, -2.0], [-4.2, -1.4], [-5.2, 0.2]], {
      round: 1.5, tone: 1.14, hatch: 66, shadow: 0.56, band: 0.3,
      creases: [
        ...beads,
        { pts: [[-3.8, 1.4], [-1.0, 1.0], [2.0, 1.2], [4.4, 0.5]], w: 0.07, depth: 0.09 },
        { pts: [[-3.6, -0.4], [-1.0, -0.8], [2.4, -0.6]], w: 0.07, depth: 0.09 },
      ],
      bumps: [{ at: [-2.4, 0.2], r: [1.2, 1.2], h: 0.14 }],
    });

    // The sawtooth crest, set on the line of the spine.
    const ridge = [[-4.2, 2.2], [-3.3, 2.56], [-2.4, 2.84], [-1.5, 3.04], [-0.6, 3.16], [0.3, 3.2], [1.2, 3.12], [2.1, 2.9], [3.0, 2.54], [3.8, 2.0], [4.5, 1.46]];
    for (const [x, y] of ridge) blob([[x - 0.36, y - 0.22], [x + 0.08, y + 0.44, 'c'], [x + 0.36, y - 0.22]], { round: 0.14, tone: 1.2, hatch: 80, shadow: 0.2, band: 0.1 });

    // Near legs, the feet clamped like tongs.
    leg([-3.2, -0.8], [-4.8, -2.4], [-3.8, -3.9], 1.1);
    leg([1.6, -0.8], [0.6, -2.5], [1.8, -3.9], 1.1);

    // The head, under a tall casque swept back to a point.
    blob([[-4.4, 0.8], [-4.4, 1.9], [eps[0] - 0.2, eps[1] + 1.6], [-3.4, 3.8, 'c'], [-4.8, 3.0], [-6.0, 2.0], [-7.3, 1.0], [-8.2, 0.1], [-8.5, -0.5, 'c'], [-7.4, -0.8], [-6.0, -1.2], [bet[0], bet[1] - 0.7], [-4.0, -0.8]], {
      round: 0.56, tone: 1.2, hatch: 28, shadow: 0.54, band: 0.26,
      creases: [
        { pts: [[-8.3, -0.4], [-7.2, -0.3], [-6.0, -0.6], [-5.0, -0.4]], w: 0.05, depth: 0.1 },
        { pts: [[-7.0, 1.0], [-6.0, 1.4], [-4.8, 2.4], [-3.8, 3.4]], w: 0.05, depth: 0.08 },
        { pts: [[-4.6, 1.6], [-4.4, 0.6], [-4.6, -0.6]], w: 0.06, depth: 0.1 },
      ],
    });
    for (let i = 0; i < 6; i++) { const x = -7.4 + i * 0.7, y = -1.0 - Math.sin(i * 0.7) * 0.34; blob([[x - 0.14, y + 0.2], [x, y - 0.2, 'c'], [x + 0.14, y + 0.2]], { round: 0.1, tone: 1.2, shadow: 0.1, band: 0.1 }); }
    // The turret eye: a cone, a slit and copper.
    const ey = [-6.2, 0.8];
    blob([[ey[0] + 0.7, ey[1] - 0.4], [ey[0] + 0.5, ey[1] + 0.54], [ey[0] - 0.46, ey[1] + 0.72], [ey[0] - 0.8, ey[1] + 0.3], [ey[0] - 0.56, ey[1] - 0.46], [ey[0] + 0.14, ey[1] - 0.76]], { round: 0.5, tone: 1.24, hatch: 110, shadow: 0.36, band: 0.14, creases: [{ pts: [[ey[0] + 0.3, ey[1] + 0.52], [ey[0] + 0.5, ey[1]], [ey[0] + 0.2, ey[1] - 0.5]], w: 0.03, depth: 0.05 }, { pts: [[ey[0], ey[1] + 0.6], [ey[0] + 0.14, ey[1]], [ey[0] - 0.14, ey[1] - 0.56]], w: 0.03, depth: 0.05 }] });
    limb([[ey[0] - 0.34, ey[1] + 0.06, 0.24], [ey[0] - 0.33, ey[1] + 0.06, 0.24]], { tone: 1.3, warm: 0.84, shadow: 0, melt: 0 });
    limb([[ey[0] - 0.38, ey[1] + 0.06, 0.12], [ey[0] - 0.37, ey[1] + 0.06, 0.12]], { tone: 0.1, shadow: 0, melt: 0 });
    void line;
  },
};
