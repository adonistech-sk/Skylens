// Generates the small procedural textures the renderer uses. All original work.
// horizon.png: a 360 degree silhouette strip. Alpha is opaque below the skyline. Rows
// span -4 to +10 degrees of altitude, matching skyShader.ts.
// star-sprite.png: a soft point-spread glow.
import sharp from 'sharp';

function noise1d(seed) {
  const r = (i) => { const x = Math.sin((i + seed) * 127.1) * 43758.5453; return x - Math.floor(x); };
  return (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return r(i) * (1 - u) + r(i + 1) * u;
  };
}
const fbm = (n, x, oct = 5) => { let v = 0, a = 0.5; for (let o = 0; o < oct; o++) { v += a * n(x); x *= 2.03; a *= 0.5; } return v; };

const W = 4096, H = 200;
const alpha = Buffer.alloc(W * H, 0);
const ridge = noise1d(11), ridge2 = noise1d(47), tree = noise1d(91), sparse = noise1d(203);

const altToRow = (alt) => (1 - (alt + 4) / 14) * H;
const wrap = (x) => ((x % W) + W) % W;
const fill = (x, top) => { const xx = wrap(Math.round(x)); for (let y = Math.max(0, Math.floor(top)); y < H; y++) alpha[y * W + xx] = 255; };

// Distant mountain range, periodic around the circle.
for (let x = 0; x < W; x++) {
  const t = (x / W) * Math.PI * 2;
  const h = 0.6 + 2.6 * fbm(ridge, 6 + Math.cos(t) * 5 + Math.sin(t) * 3, 5) + 0.8 * fbm(ridge2, 20 + Math.cos(t) * 14 + Math.sin(t) * 9, 4);
  fill(x, altToRow(h * 0.55));
}

// Conifers as tapered triangles with ragged tiers.
function pine(cx, baseRow, height, width) {
  const tiers = Math.max(5, Math.floor(height / 4));
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const tierPhase = (t * tiers) % 1;
    const half = width * (0.08 + 0.92 * t) * (0.62 + 0.38 * tierPhase) * 0.5;
    const row = Math.round(baseRow - height + y);
    if (row < 0 || row >= H) continue;
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
      const edge = Math.abs(dx) / Math.max(half, 0.01);
      if (edge > 1) continue;
      const a = Math.round(255 * Math.min(1, (1 - edge) * 3 + 0.25));
      const i = row * W + wrap(Math.round(cx + dx));
      alpha[i] = Math.max(alpha[i], a);
    }
  }
}
const groundRow = altToRow(0.1);
let x = 0;
while (x < W) {
  const t = (x / W) * Math.PI * 2;
  const density = fbm(sparse, 40 + Math.cos(t) * 30 + Math.sin(t) * 22, 3);
  const cluster = density > 0.46;
  const size = 44 + fbm(tree, x * 0.021) * 92 + (cluster ? 36 * fbm(tree, x * 0.09) : 0);
  if (cluster || density > 0.33) pine(x, groundRow + 6, size, size * 0.42);
  x += cluster ? 8 + fbm(tree, x * 0.3) * 18 : 26 + fbm(tree, x * 0.17) * 80;
}
// A soft foot so the trees sink into the ground.
for (let px = 0; px < W; px++) fill(px, groundRow - 2 - 5 * fbm(ridge2, px * 0.012, 3));

const rgba = Buffer.alloc(W * H * 4, 255);
for (let i = 0; i < W * H; i++) rgba[i * 4 + 3] = alpha[i];
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
console.log('ok');
