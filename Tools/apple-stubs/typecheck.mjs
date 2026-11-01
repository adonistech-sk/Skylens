#!/usr/bin/env node
// Type-checks the iOS app against Stubs.swift using the real Swift compiler. Run
// Tools/wasm-check/check.mjs first, as this reuses its compiled SkyLensKit modules.
//
// Passing means the app's own code is coherent. It is not an iOS build: see the
// header of Stubs.swift for what it cannot show.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const build = process.env.SKYLENS_BUILD_DIR ?? path.join(repo, '.build-wasm');
const stubs = path.join(build, 'stubs');
const usr = process.env.SKYLENS_TOOLCHAIN, sdk = process.env.SKYLENS_WASM_SDK;
if (!usr || !sdk) { console.error('Set SKYLENS_TOOLCHAIN and SKYLENS_WASM_SDK.'); process.exit(2); }
fs.mkdirSync(stubs, { recursive: true });

const res = `${sdk}/swift.xctoolchain/usr/lib/swift_static`;
const env = { ...process.env };
env.PATH = ['bin', 'bin/swiftCore', 'bin/swiftCRT', 'bin/swift_Concurrency', 'bin/swiftDispatch', 'bin/swiftObservation']
  .map((d) => path.join(usr, d)).join(path.delimiter) + path.delimiter + (env.PATH ?? env.Path ?? '');
delete env.Path;
const base = ['-target', 'wasm32-unknown-wasip1', '-sdk', `${sdk}/WASI.sdk`, '-resource-dir', res,
  '-I', `${res}/shims`, '-I', res,
  '-Xcc', `-fmodule-map-file=${res}/_foundation_unicode/module.modulemap`,
  '-Xcc', `-fmodule-map-file=${res}/CoreFoundation/module.modulemap`,
  '-Xcc', `-fmodule-map-file=${res}/_FoundationCShims/module.modulemap`,
  '-Xcc', '-w', '-I', path.join(repo, 'Packages/SkyLensKit/Sources/CAstronomyEngine/include'), '-I', build, '-I', stubs];

function swiftc(args, label) {
  const rsp = path.join(stubs, `${label}.rsp`);
  fs.writeFileSync(rsp, [...base, ...args].map((a) => `"${a.replaceAll('\\', '/')}"`).join('\n'));
  return spawnSync(path.join(usr, 'bin', process.platform === 'win32' ? 'swiftc.exe' : 'swiftc'), [`@${rsp}`], { env, encoding: 'utf8', maxBuffer: 1 << 28, cwd: stubs });
}

const stubSource = path.join(here, 'Stubs.swift');
const stamp = path.join(stubs, 'SwiftUI.swiftmodule');
if (!fs.existsSync(stamp) || fs.statSync(stubSource).mtimeMs > fs.statSync(stamp).mtimeMs) {
  console.log('• compiling Apple stubs');
  const r = swiftc(['-swift-version', '5', '-parse-as-library', '-module-name', 'SwiftUI', '-emit-module', '-emit-module-path', stamp, stubSource], 'stubs');
  if (r.status !== 0) { console.error(`${r.stdout}${r.stderr}`); process.exit(1); }
  for (const m of ['UIKit', 'Metal', 'MetalKit', 'QuartzCore', 'simd', 'CoreMotion', 'CoreLocation', 'MapKit', 'AVFoundation', 'StoreKit', 'UserNotifications', 'PhotosUI', 'Combine']) {
    const f = path.join(stubs, `${m}.swift`);
    fs.writeFileSync(f, '@_exported import SwiftUI\n');
    const out = swiftc(['-swift-version', '5', '-parse-as-library', '-module-name', m, '-emit-module', '-emit-module-path', path.join(stubs, `${m}.swiftmodule`), f], m);
    if (out.status !== 0) { console.error(`${out.stdout}${out.stderr}`); process.exit(1); }
  }
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.swift') ? [path.join(d, e.name)] : []);
// Wasm has no Objective-C runtime, so @objc and #selector are rewritten in a scratch
// copy. Line numbers are preserved and the real sources are never touched.
const scratch = path.join(stubs, 'src');
fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });
const files = [path.join(here, 'Shadows.swift')];
for (const f of walk(path.join(repo, 'SkyLens'))) {
  const out = path.join(scratch, path.relative(path.join(repo, 'SkyLens'), f).replaceAll(path.sep, '_'));
  const text = fs.readFileSync(f, 'utf8').replace(/@objc /g, '').replace(/#selector[(][^)]*[)][)]/g, 'Selector("")');
  fs.writeFileSync(out, text);
  files.push(out);
}
console.log(`• type-checking ${files.length} app files`);
const r = swiftc(['-swift-version', '5', '-typecheck', '-continue-building-after-errors', '-module-name', 'SkyLens', ...files], 'app');
const text = `${r.stdout}${r.stderr}`;
const lines = text.split('\n');
const errors = lines.filter((l) => / error: /.test(l) && /\.swift:\d+/.test(l));
if (process.argv.includes('--all')) console.log(text);
const seen = new Set();
for (const l of errors) {
  const short = l.replace(/^.*?(SkyLens[\\/])/, '$1').replaceAll('\\', '/');
  if (!seen.has(short)) { seen.add(short); console.log(short.slice(0, 200)); }
}
console.log(r.status === 0 ? '✓ app type-checks against stubs' : `✗ ${seen.size} distinct errors`);
process.exit(r.status === 0 ? 0 : 1);
