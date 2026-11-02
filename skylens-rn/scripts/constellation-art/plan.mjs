// Prints a constellation's star plan as text, for drawing a figure against real coordinates.
// usage: node scripts/constellation-art/plan.mjs Ori UMa ...
import { constellationPlane } from './sky.mjs';

for (const id of process.argv.slice(2)) {
  const p = constellationPlane(id);
  const f = (v) => v.toFixed(1);
  console.log(`\n${id} ${p.name}`);
  console.log([...p.stars].sort((a, b) => a.mag - b.mag).map((s) => `${s.name ?? s.bayer ?? ''}#${s.hip}(${f(s.x)},${f(s.y)}) m${s.mag.toFixed(1)}`).join('  '));
  console.log('lines ' + p.lines.map((l) => l.map((h) => { const s = p.byHip.get(h); return s.name?.slice(0, 5) ?? s.hip; }).join('-')).join(' | '));
}
