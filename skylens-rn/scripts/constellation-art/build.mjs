// Prints constellation figures. usage: node scripts/constellation-art/build.mjs <outDir> [ids]
//   --sheet   draws only the star plan of each constellation, for drawing a new figure
//   --final   writes app assets and the generated data as well as the review prints
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { Plate, spline } from './engrave.mjs';
import { constellationPlane, fieldStars, starInPlane } from './sky.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = args[0];
const wanted = args.slice(1);
const sheetOnly = process.argv.includes('--sheet');
const final = process.argv.includes('--final');
const assetDir = new URL('../../assets/constellation-art/', import.meta.url);
const vectorDir = new URL('../../design/constellation-art/', import.meta.url);
const generated = new URL('../../src/data/generated/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const figuresDir = new URL('figures/', import.meta.url);

const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The star plan, with a degree grid, for drawing against and for reviewing a print. */
function overlay(plane, extent, ppd, w, h, { grid = true, field = true } = {}) {
  const X = (x) => (x - extent[0]) * ppd, Y = (y) => (extent[3] - y) * ppd;
  const parts = [];
  if (grid) {
    for (let x = Math.ceil(extent[0] / 5) * 5; x <= extent[2]; x += 5) parts.push(`<line x1="${X(x)}" x2="${X(x)}" y1="0" y2="${h}" stroke="#fff" stroke-opacity="${x === 0 ? 0.3 : 0.13}"/><text x="${X(x) + 3}" y="13" fill="#9ab" font-size="12">${x}</text>`);
    for (let y = Math.ceil(extent[1] / 5) * 5; y <= extent[3]; y += 5) parts.push(`<line y1="${Y(y)}" y2="${Y(y)}" x1="0" x2="${w}" stroke="#fff" stroke-opacity="${y === 0 ? 0.3 : 0.13}"/><text x="3" y="${Y(y) - 3}" fill="#9ab" font-size="12">${y}</text>`);
  }
  for (const line of plane.lines) {
    for (let i = 1; i < line.length; i++) {
      const a = plane.byHip.get(line[i - 1]), b = plane.byHip.get(line[i]);
      parts.push(`<line x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}" stroke="#ffcf9e" stroke-opacity="0.55"/>`);
    }
  }
  if (field) {
    for (const s of fieldStars(plane, Math.hypot(extent[2] - extent[0], extent[3] - extent[1]) * 0.7, 4.6)) {
      if (plane.byHip.has(s.hip) || X(s.x) < 0 || X(s.x) > w || Y(s.y) < 0 || Y(s.y) > h) continue;
      parts.push(`<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="1.6" fill="#7f8fa8"/>`);
    }
  }
  for (const s of plane.stars) {
    const r = Math.max(1.8, 5 - s.mag * 0.8);
    parts.push(`<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${r}" fill="#ffe9c9"/>`);
    parts.push(`<text x="${X(s.x) + r + 3}" y="${Y(s.y) + 4}" fill="#ffd9a8" font-size="12">${escapeXml(`${s.name ?? s.bayer ?? ''} ${s.hip}`.trim())} (${s.x.toFixed(1)},${s.y.toFixed(1)})</text>`);
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" font-family="Arial">${parts.join('')}</svg>`);
}

/** A figure records its strokes first, so its plate can be sized to fit them. */
function recorder(plane) {
  const ops = [];
  const s = (key, dx = 0, dy = 0) => {
    const star = typeof key === 'number' ? plane.byHip.get(key) ?? (() => { const [x, y] = starInPlane(plane, key); return { x, y }; })()
      : plane.stars.find((t) => t.name === key || t.bayer === key);
    if (!star) throw new Error(`${plane.id}: no star ${key}`);
    return [star.x + dx, star.y + dy];
  };
  const E = {};
  for (const name of ['blob', 'limb', 'line', 'strands']) E[name] = (points, o) => { ops.push({ name, points, o }); };
  return { ops, s, E };
}

function bounds(ops) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const op of ops) {
    for (const p of op.points) {
      const r = op.name === 'limb' ? p[2] : op.name === 'strands' ? (op.o?.len ?? 1.5) * 1.3 : 0;
      x0 = Math.min(x0, p[0] - r); y0 = Math.min(y0, p[1] - r); x1 = Math.max(x1, p[0] + r); y1 = Math.max(y1, p[1] + r);
    }
  }
  return [x0, y0, x1, y1];
}

async function print(id, figure) {
  const plane = constellationPlane(id);
  const { ops, s, E } = recorder(plane);
  figure.draw({ s, E, plane });
  const [x0, y0, x1, y1] = bounds(ops);
  const margin = Math.max(x1 - x0, y1 - y0) * 0.035 + 0.4;
  const extent = [x0 - margin, y0 - margin, x1 + margin, y1 + margin];
  const long = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
  const ppd = (figure.pixels ?? 1400) / long;
  const plate = new Plate(extent, ppd);
  for (const op of ops) plate[op.name](op.points, op.o);
  const raw = { width: plate.w, height: plate.h, channels: 3 };
  const rgb = plate.toRGB();
  const review = await sharp(rgb, { raw }).composite([{ input: overlay(plane, extent, ppd, plate.w, plate.h, { field: false }), top: 0, left: 0 }]).jpeg({ quality: 88 }).toBuffer();
  fs.writeFileSync(path.join(out, `${id}-stars.jpg`), review);
  const clean = await sharp(rgb, { raw }).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
  fs.writeFileSync(path.join(out, `${id}.jpg`), clean);
  const anchors = (figure.anchors ?? []).map(([key, part]) => {
    const star = typeof key === 'number' ? plane.byHip.get(key) : plane.stars.find((t) => t.name === key || t.bayer === key);
    if (!star) throw new Error(`${id}: anchor ${key} is not a star of the figure`);
    return { hip: star.hip, x: star.x, y: star.y, part, inside: plate.covers(star.x, star.y) };
  });
  const lineStars = plane.stars.filter((t) => plate.covers(t.x, t.y)).length;
  console.log(`${id}: ${plate.w}x${plate.h} ${(clean.length / 1024).toFixed(0)} KB, ${ops.length} strokes, anchors on figure ${anchors.filter((a) => a.inside).length}/${anchors.length}, line stars on figure ${lineStars}/${plane.stars.length}`);
  if (!final) return null;
  fs.mkdirSync(assetDir, { recursive: true });
  fs.mkdirSync(vectorDir, { recursive: true });
  fs.writeFileSync(new URL(`${id}.jpg`, assetDir), clean);
  const glow = plate.toGlow();
  fs.writeFileSync(new URL(`${id}.glow.jpg`, assetDir), await sharp(glow.rgb, { raw: { width: glow.width, height: glow.height, channels: 3 } }).jpeg({ quality: 70 }).toBuffer());
  const contour = plate.contours();
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const radius = Math.max(...contour.flat().map((p) => Math.hypot(p[0], p[1])));
  const round = (l) => l.flatMap((p) => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
  const svg = contour.map((l) => `<path d="M${l.map((p) => `${r3(p[0])} ${r3(-p[1])}`).join('L')}Z"/>`).join('');
  fs.writeFileSync(new URL(`${id}.svg`, vectorDir), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r3(extent[0])} ${r3(-extent[3])} ${r3(extent[2] - extent[0])} ${r3(extent[3] - extent[1])}" fill="none" stroke="#8fb0ff" stroke-width="0.06"><title>${plane.name}, original SkyLens figure, outline in sky-plane degrees</title>${svg}</svg>\n`);
  return {
    id, tier: figure.tier ?? 'priority', subject: figure.subject ?? plane.name, centre: plane.centre.map((v) => Math.round(v * 1e5) / 1e5), extent: extent.map(r3), width: plate.w, height: plate.h, radius: r3(radius),
    anchors: anchors.map((a) => ({ hip: a.hip, x: r3(a.x), y: r3(a.y), part: a.part })),
    pins: plane.stars.map((t) => t.hip), contour: contour.map(round), strokes: ops.length,
    onFigure: { anchors: anchors.filter((a) => a.inside).length, lineStars, lineTotal: plane.stars.length }, bytes: clean.length,
  };
}

async function sheet(id) {
  const plane = constellationPlane(id);
  const xs = plane.stars.map((t) => t.x), ys = plane.stars.map((t) => t.y);
  const pad = 5;
  const extent = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
  const long = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
  const ppd = 1100 / long, w = Math.ceil((extent[2] - extent[0]) * ppd), h = Math.ceil((extent[3] - extent[1]) * ppd);
  const buffer = await sharp({ create: { width: w, height: h, channels: 3, background: '#0a0e1a' } }).composite([{ input: overlay(plane, extent, ppd, w, h), top: 0, left: 0 }]).jpeg({ quality: 88 }).toBuffer();
  fs.writeFileSync(path.join(out, `${id}-plan.jpg`), buffer);
  console.log(`${id}: plan ${w}x${h}`);
}

const files = fs.readdirSync(figuresDir).filter((f) => f.endsWith('.mjs')).map((f) => f.replace('.mjs', ''));
const records = [];
for (const id of wanted.length ? wanted : files) {
  if (sheetOnly) { await sheet(id); continue; }
  const figure = (await import(new URL(`${id}.mjs?${Date.now()}`, figuresDir).href)).default;
  const record = await print(id, figure);
  if (record) records.push(record);
}
if (final) {
  // Partial runs keep the figures they didn't reprint.
  const dataFile = new URL('constellationArt.json', generated);
  const previous = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : [];
  const merged = [...previous.filter((p) => !records.some((r) => r.id === p.id) && files.includes(p.id)), ...records].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(dataFile, JSON.stringify(merged));
  const rows = merged.map((r) => `  ${r.id}: { plate: require('../../../assets/constellation-art/${r.id}.jpg'), glow: require('../../../assets/constellation-art/${r.id}.glow.jpg') },`);
  fs.writeFileSync(new URL('constellationArtAssets.ts', generated), `// Generated by scripts/constellation-art/build.mjs. Metro needs every require written out.\nexport const ART_ASSETS: Record<string, { plate: number; glow: number }> = {\n${rows.join('\n')}\n};\n`);
  console.log(`${merged.length} figures, ${(merged.reduce((n, r) => n + r.bytes, 0) / 1048576).toFixed(2)} MB of plates`);
}
export { spline };
