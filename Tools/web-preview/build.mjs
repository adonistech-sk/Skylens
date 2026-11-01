#!/usr/bin/env node
// Links main.swift against the SkyLensKit objects from wasm-check. Run check.mjs first.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const build = process.env.SKYLENS_BUILD_DIR ?? path.join(repo, '.build-wasm');
const usr = process.env.SKYLENS_TOOLCHAIN, sdk = process.env.SKYLENS_WASM_SDK;
if (!usr || !sdk) { console.error('Set SKYLENS_TOOLCHAIN and SKYLENS_WASM_SDK.'); process.exit(2); }

const res = `${sdk}/swift.xctoolchain/usr/lib/swift_static`;
const env = { ...process.env };
env.PATH = ['bin', 'bin/swiftCore', 'bin/swiftCRT', 'bin/swift_Concurrency', 'bin/swiftDispatch', 'bin/swiftObservation']
  .map((d) => path.join(usr, d)).join(path.delimiter) + path.delimiter + (env.PATH ?? env.Path ?? '');
delete env.Path;

const modules = ['AstronomyCore', 'SkyCatalog', 'SkyProjection', 'Satellites', 'ObservingKit', 'UserData', 'SkySession'];
const args = ['-target', 'wasm32-unknown-wasip1', '-sdk', `${sdk}/WASI.sdk`, '-resource-dir', res,
  '-I', `${res}/shims`, '-I', res,
  '-Xcc', `-fmodule-map-file=${res}/_foundation_unicode/module.modulemap`,
  '-Xcc', `-fmodule-map-file=${res}/CoreFoundation/module.modulemap`,
  '-Xcc', `-fmodule-map-file=${res}/_FoundationCShims/module.modulemap`,
  '-static-stdlib', '-Xcc', '-w', '-O', '-swift-version', '5', '-module-name', 'skybridge',
  '-I', path.join(repo, 'Packages/SkyLensKit/Sources/CAstronomyEngine/include'), '-I', build,
  path.join(here, 'main.swift'), ...modules.map((m) => path.join(build, `${m}.o`)), path.join(build, 'astronomy.o'),
  '-o', path.join(build, 'skybridge.wasm'),
  '-Xclang-linker', '-resource-dir', '-Xclang-linker', path.join(build, 'rt'),
  '-Xlinker', '-z', '-Xlinker', 'stack-size=8388608'];
const rsp = path.join(build, 'skybridge.rsp');
fs.writeFileSync(rsp, args.map((a) => `"${a.replaceAll('\\', '/')}"`).join('\n'));
const r = spawnSync(path.join(usr, 'bin', process.platform === 'win32' ? 'swiftc.exe' : 'swiftc'), [`@${rsp}`], { env, encoding: 'utf8', cwd: build, maxBuffer: 1 << 26 });
if (r.status !== 0) { console.error(`${r.stdout}${r.stderr}`.slice(-6000)); process.exit(1); }
console.log('✓ built skybridge.wasm');
