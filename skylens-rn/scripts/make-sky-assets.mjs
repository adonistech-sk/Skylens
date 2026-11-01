// Generates the small procedural textures the renderer uses. All original work, except
// milkyway.jpg, which is NASA's all-sky map with its point stars filtered out.
//
// horizon.png: a 360 degree silhouette strip. Alpha is opaque below the skyline, and red
// holds depth: dim for the far ridge, full for the near trees. Rows span -4 to +10
// degrees of altitude, matching skyShader.ts. Azimuth 180 sits at the centre of the
// strip, so south has the low central peak of the locked design.
// star-sprite.png: a soft point-spread glow.
// milkyway.jpg: only the diffuse light. The catalog supplies every star, so nothing is
// drawn twice and the sky between stars stays deep.
import sharp from 'sharp';

function noise1d(seed) {
  const r = (i) => { const x = Math.sin((i + seed) * 127.1) * 43758.5453; return x - Math.floor(x); };
  return (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return r(i) * (1 - u) + r(i + 1) * u;
  };
}
const fbm = (n, x, oct = 5) => { let v = 0, a = 0.5; for (let o = 0; o < oct; o++) { v += a * n(x); x *= 2.03; a *= 0.5; } return v; };

const W = 8192, H = 300;
const alpha = Buffer.alloc(W * H, 0);
const depth = Buffer.alloc(W * H, 0);
const ridge = noise1d(11), ridge2 = noise1d(47), tree = noise1d(91), sparse = noise1d(203);

const altToRow = (alt) => (1 - (alt + 4) / 14) * H;
const wrap = (x) => ((x % W) + W) % W;
const fill = (x, top, shade) => {
  const xx = wrap(Math.round(x));
  for (let y = Math.max(0, Math.floor(top)); y < H; y++) { alpha[y * W + xx] = 255; depth[y * W + xx] = shade; }
};
const azToX = (az) => (az / 360) * W;

// Distant ridges, periodic around the circle, rising to one peak due south.
for (let x = 0; x < W; x++) {
  const t = (x / W) * Math.PI * 2;
  const off = Math.abs(((x / W) * 360 - 180));
  const peak = 4.7 * Math.exp(-((off / 6.4) ** 2)) * (0.72 + 0.56 * fbm(ridge2, x * 0.012, 3));
  const h = 0.5 + 1.9 * fbm(ridge, 6 + Math.cos(t) * 5 + Math.sin(t) * 3, 5) + 0.55 * fbm(ridge2, 20 + Math.cos(t) * 14 + Math.sin(t) * 9, 4);
  fill(x, altToRow(Math.max(h * 0.55, peak)), 96);
}

// Conifers as tapered triangles with ragged tiers.
function pine(cx, baseRow, height, width) {
  const tiers = Math.max(6, Math.floor(height / 8));
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const tierPhase = (t * tiers) % 1;
    const half = width * (0.05 + 0.95 * Math.pow(t, 0.86)) * (0.5 + 0.5 * tierPhase) * 0.5;
    const row = Math.round(baseRow - height + y);
    if (row < 0 || row >= H) continue;
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
      const edge = Math.abs(dx) / Math.max(half, 0.01);
      if (edge > 1) continue;
      const a = Math.round(255 * Math.min(1, (1 - edge) * 3 + 0.25));
      const i = row * W + wrap(Math.round(cx + dx));
      if (a > alpha[i] || depth[i] < 255) { alpha[i] = Math.max(alpha[i], a); depth[i] = 255; }
    }
  }
}
const groundRow = altToRow(0.1);
let x = 0;
while (x < W) {
  const t = (x / W) * Math.PI * 2;
  const az = (x / W) * 360;
  const density = fbm(sparse, 40 + Math.cos(t) * 30 + Math.sin(t) * 22, 3);
  // A clearing around south keeps the far peak in view, as the design frames it.
  const clear = Math.abs(az - 180) < 6.5;
  const nearClearing = Math.abs(az - 180) < 22;
  const cluster = density > 0.42 || nearClearing;
  const flank = Math.max(0, Math.min(1, (Math.abs(az - 180) - 7) / 7));
  const size = 62 + fbm(tree, x * 0.0105) * 70 + (cluster ? 42 * fbm(tree, x * 0.045) : 0) + (Math.abs(az - 180) < 22 ? flank * 34 : 0);
  if (!clear && (cluster || density > 0.31)) pine(x, groundRow + 12, size, size * (0.5 + 0.26 * fbm(tree, x * 0.21)));
  x += cluster ? 9 + fbm(tree, x * 0.15) * 22 : 34 + fbm(tree, x * 0.085) * 100;
}
// A low far treeline all the way round, so the ground never shows as a straight edge
// where the sky reaches down between the large trees.
for (let px = 0; px < W;) {
  const size = 24 + fbm(tree, px * 0.031) * 44;
  pine(px, groundRow + 12, size, size * 0.56);
  px += 6 + fbm(tree, px * 0.19) * 18;
}
// A soft foot so the trees sink into the ground.
for (let px = 0; px < W; px++) fill(px, groundRow - 3 - 7 * fbm(ridge2, px * 0.006, 3), 255);

const rgba = Buffer.alloc(W * H * 4, 0);
for (let i = 0; i < W * H; i++) {
  rgba[i * 4] = depth[i]; rgba[i * 4 + 1] = depth[i]; rgba[i * 4 + 2] = depth[i];
  rgba[i * 4 + 3] = alpha[i];
}
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile('assets/sky/horizon.png');

const S = 64;
const sprite = Buffer.alloc(S * S * 4);
for (let y = 0; y < S; y++) for (let px = 0; px < S; px++) {
  const r = Math.hypot(px - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2);
  const core = Math.exp(-r * r * 26);
  const halo = Math.exp(-r * 6.5) * 0.42;
  const fade = Math.max(0, 1 - r);
  const a = Math.min(1, (core + halo) * fade * fade);
  const i = (y * S + px) * 4;
  sprite[i] = sprite[i + 1] = sprite[i + 2] = 255;
  sprite[i + 3] = Math.round(a * 255);
}
await sharp(sprite, { raw: { width: S, height: S, channels: 4 } }).png().toFile('assets/sky/star-sprite.png');

// The median removes point sources while keeping the dust lanes' edges.
const diffuse = await sharp('assets/sky/allsky.jpg').median(5).blur(2.2).jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
await sharp(diffuse).toFile('assets/sky/milkyway.jpg');
console.log('ok');
