#!/usr/bin/env node
// Builds Tools/sky-preview/main.swift against the modules from wasm-check, runs it
// and converts the result to PNG. Run check.mjs first.
//
//   node Tools/sky-preview/render.mjs out.png --lat 52.2 --lon 21 --az 180 --alt 35 --fov 100 --date 2026-01-15T21:00:00Z

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WASI } from 'node:wasi';
import zlib from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const build = process.env.SKYLENS_BUILD_DIR ?? path.join(repo, '.build-wasm');
const usr = process.env.SKYLENS_TOOLCHAIN, sdk = process.env.SKYLENS_WASM_SDK;
const [outPng, ...passThrough] = process.argv.slice(2);
if (!outPng || !usr || !sdk) { console.error('usage: render.mjs out.png [flags], with SKYLENS_TOOLCHAIN and SKYLENS_WASM_SDK set'); process.exit(2); }

const wasm = path.join(build, 'sky-preview.wasm');
const source = path.join(here, 'main.swift');
const objects = ['AstronomyCore', 'SkyCatalog', 'SkyProjection'].map((n) => path.join(build, `${n}.o`));
const stale = !fs.existsSync(wasm) || [source, ...objects].some((f) => fs.statSync(f).mtimeMs > fs.statSync(wasm).mtimeMs);
if (stale) {
  const res = `${sdk}/swift.xctoolchain/usr/lib/swift_static`;
  const env = { ...process.env };
  env.PATH = ['bin', 'bin/swiftCore', 'bin/swiftCRT', 'bin/swift_Concurrency', 'bin/swiftDispatch']
    .map((d) => path.join(usr, d)).join(path.delimiter) + path.delimiter + (env.PATH ?? env.Path ?? '');
  delete env.Path;
  const args = ['-target', 'wasm32-unknown-wasip1', '-sdk', `${sdk}/WASI.sdk`, '-resource-dir', res,
    '-I', `${res}/shims`, '-I', res,
    '-Xcc', `-fmodule-map-file=${res}/_foundation_unicode/module.modulemap`,
    '-Xcc', `-fmodule-map-file=${res}/CoreFoundation/module.modulemap`,
    '-Xcc', `-fmodule-map-file=${res}/_FoundationCShims/module.modulemap`,
    '-static-stdlib', '-Xcc', '-w', '-O', '-swift-version', '5', '-module-name', 'skypreview',
    '-I', path.join(repo, 'Packages/SkyLensKit/Sources/CAstronomyEngine/include'), '-I', build,
    source, ...objects, path.join(build, 'astronomy.o'), '-o', wasm,
    '-Xclang-linker', '-resource-dir', '-Xclang-linker', path.join(build, 'rt')];
  const rsp = path.join(build, 'sky-preview.rsp');
  fs.writeFileSync(rsp, args.map((a) => `"${a.replaceAll('\\', '/')}"`).join('\n'));
  const r = spawnSync(path.join(usr, 'bin', process.platform === 'win32' ? 'swiftc.exe' : 'swiftc'), [`@${rsp}`], { env, encoding: 'utf8', cwd: build });
  if (r.status !== 0) { console.error(`${r.stdout}${r.stderr}`); process.exit(1); }
}

const outDir = path.resolve(path.dirname(outPng));
fs.mkdirSync(outDir, { recursive: true });
const wasi = new WASI({
  version: 'preview1', args: [wasm, ...passThrough, '--out', '/out/sky.ppm'],
  env: { SKYLENS_RESOURCES: '/pkg/Sources/SkyCatalog/Resources' },
  preopens: { '/pkg': path.join(repo, 'Packages/SkyLensKit'), '/out': outDir }, returnOnExit: true,
});
const instance = await WebAssembly.instantiate(await WebAssembly.compile(fs.readFileSync(wasm)), wasi.getImportObject());
const code = wasi.start(instance);
if (code !== 0) process.exit(code);

// PPM → PNG, with no dependencies.
const ppmPath = path.join(outDir, 'sky.ppm');
const ppm = fs.readFileSync(ppmPath);
let offset = 0, tokens = [];
while (tokens.length < 4) {
  let end = offset;
  while (![10, 32].includes(ppm[end])) end++;
  tokens.push(ppm.toString('latin1', offset, end));
  offset = end + 1;
}
const [w, h] = [Number(tokens[1]), Number(tokens[2])];
const raw = Buffer.alloc((w * 3 + 1) * h);
for (let y = 0; y < h; y++) ppm.copy(raw, y * (w * 3 + 1) + 1, offset + y * w * 3, offset + (y + 1) * w * 3);
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(outPng, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
fs.unlinkSync(ppmPath);
console.log(`→ ${outPng}`);
