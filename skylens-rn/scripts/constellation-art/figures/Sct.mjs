// The Shield, a long kite-shaped war shield hung point down. Beta sits on the crown of its upper
// edge, Alpha and Delta on the two shoulders of the great central boss, and Gamma at the point.
// Iron rim, dark boards, warm brass boss and rivets.
import { frame } from '../kit.mjs';

export default {
  tier: 'extended',
  subject: 'The Shield',
  pixels: 1100,
  anchors: [['α Sct', 'boss'], ['β Sct', 'upper edge'], ['γ Sct', 'point'], ['δ Sct', 'boss']],
  draw({ s, E }) {
    const { blob, limb, line } = E;
    const bet = s('β Sct'), gam = s('γ Sct'), alp = s('α Sct'), del = s('δ Sct');
    const L = frame(gam, bet);
    const P = (pts) => pts.map(([f, u, ...rest]) => [...L(f, u), ...rest]);
    const hatch = L.angle;
    const len = L.back(bet)[1];
    const fa = L.back(alp), fd = L.back(del);
    const c = (fa[0] + fd[0]) / 2, bossU = (fa[1] + fd[1]) / 2;

    // Half-width of the shield at height u, from the point up to the rounded head.
    const wide = (u) => { const t = u / (len + 0.5); return 4.3 * Math.sin(Math.min(1, t * 1.28) * Math.PI / 2) ** 1.1 * (t > 0.86 ? Math.sqrt(Math.max(0, 1 - ((t - 0.86) / 0.17) ** 2)) * 0.28 + 0.72 : 1); };
    const left = [], right = [];
    for (let u = 0.7; u < len + 0.2; u += 0.75) { left.push([c - wide(u), u]); right.push([c + wide(u), u]); }
    const head = [[c - 1.5, len + 0.4], [c, len + 0.72], [c + 1.5, len + 0.4]];
    const outline = [[0, -0.5, 'c'], ...left, ...head, ...right.reverse()];

    // The rim, a raised iron band all the way round.
    blob(P(outline), { round: 0.5, tone: 1.2, hatch: hatch + 90, shadow: 0, band: 0.34, spacing: 0.9 });

    // The field inside the rim, boards running along the shield, cut by long joints.
    const inset = outline.map(([f, u]) => [c + (f - c) * 0.87, bossU + (u - bossU) * 0.91]);
    blob(P(inset), {
      round: 1.8, tone: 0.98, hatch: hatch + 86, shadow: 0.6, band: 0.3, spacing: 0.94,
      creases: [-2.6, -1.3, 0, 1.3, 2.6].map((d) => ({ pts: P([[c + d * 0.28, 1.0], [c + d * 0.86, bossU - 2.0], [c + d, bossU + 1.2], [c + d * 0.94, len - 0.2]]), w: 0.06, depth: 0.1 })),
      bumps: [{ at: L(c, bossU), r: [3.0, 3.8], h: 0.4 }],
    });

    // Four iron straps from the boss out to the rim, each ending in a little leaf.
    const strap = (a, reach, tone) => {
      const cs = Math.cos(a), sn = Math.sin(a), Q = (t, w) => [c + cs * t - sn * w, bossU + sn * t * 1.4 + cs * w];
      blob(P([Q(1.2, 0.2), Q(reach * 0.6, 0.12), [...Q(reach - 0.72, 0.1), 'c'], Q(reach - 0.42, 0.42), [...Q(reach, 0), 'c'], Q(reach - 0.42, -0.42), [...Q(reach - 0.72, -0.1), 'c'], Q(reach * 0.6, -0.12), Q(1.2, -0.2)]), {
        round: 0.2, tone, warm: 0.3, hatch: hatch + 40, shadow: 0.46, band: 0.12,
        creases: [{ pts: P([Q(1.3, 0), Q(reach * 0.6, 0), Q(reach - 0.1, 0)]), w: 0.025, depth: 0.04 }],
      });
    };
    for (const a of [0.6, 2.54, 3.74, 5.68]) strap(a, a < 3 ? 2.7 : 3.4, 1.14);
    strap(Math.PI / 2, 3.5, 1.14);
    strap(-Math.PI / 2, 4.4, 1.14);

    // Rivets all round the rim.
    for (const [i, [f, u]] of outline.entries()) {
      const n = outline[(i + 1) % outline.length];
      for (const t of [0, 0.5]) {
        const x = c + (f + (n[0] - f) * t - c) * 0.935, y = bossU + (u + (n[1] - u) * t - bossU) * 0.955;
        const p = L(x, y);
        blob([[p[0] - 0.09, p[1]], [p[0], p[1] + 0.09], [p[0] + 0.09, p[1]], [p[0], p[1] - 0.09]], { round: 0.09, tone: 1.3, warm: 0.8, shadow: 0.34 });
      }
    }

    // The boss, round and raised, with a stepped flange. Alpha and Delta sit on its shoulders.
    const ring = (r, n = 18) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [c + Math.cos(a) * r, bossU + Math.sin(a) * r]; });
    blob(P(ring(1.5)), { round: 0.34, tone: 1.14, warm: 0.76, hatch: hatch + 30, shadow: 0.6, band: 0.16 });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; line(P([[c + Math.cos(a) * 1.08, bossU + Math.sin(a) * 1.08], [c + Math.cos(a) * 1.38, bossU + Math.sin(a) * 1.38]]), { w: 0.03, v: 0.8, warm: 0.76 }); }
    blob(P(ring(1.02)), {
      round: 0.96, tone: 1.26, warm: 0.74, hatch: hatch + 50, shadow: 0.5, band: 0.2, spacing: 0.84,
    });
    line(P([[c - 0.5, bossU + 0.26], [c - 0.1, bossU + 0.6], [c + 0.42, bossU + 0.5]]), { w: 0.03, v: 0.9, warm: 0.5 });
  },
};
