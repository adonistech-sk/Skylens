#!/usr/bin/env node
// Compiles the portable SkyLensKit targets to WebAssembly and runs their Swift
// Testing suites under Node's WASI, so the package gets real compiler and test
// evidence on machines without Xcode. It complements `swift test` on macOS and
// does not replace it. SwiftUI, Metal, ARKit and StoreKit are not covered.
//
//   node Tools/wasm-check/check.mjs            build everything, run all tests
//   node Tools/wasm-check/check.mjs --build    build only
//   node Tools/wasm-check/check.mjs --filter Ephemeris
//
// Requires SKYLENS_TOOLCHAIN and SKYLENS_WASM_SDK. See README.md in this folder.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const pkg = path.join(repo, 'Packages/SkyLensKit');
const build = process.env.SKYLENS_BUILD_DIR ?? path.join(repo, '.build-wasm');
const usr = process.env.SKYLENS_TOOLCHAIN;
const sdk = process.env.SKYLENS_WASM_SDK;
if (!usr || !sdk) {
  console.error('Set SKYLENS_TOOLCHAIN (…/Toolchains/<ver>/usr) and SKYLENS_WASM_SDK (…/wasm32-unknown-wasip1).');
  process.exit(2);
}

// Dependency order matters. This mirrors Package.swift.
const targets = [
  { name: 'AstronomyCore', deps: [], tests: 'AstronomyCoreTests' },
  { name: 'SkyCatalog', deps: ['AstronomyCore'], tests: 'SkyCatalogTests' },
  { name: 'SkyProjection', deps: ['AstronomyCore'], tests: 'SkyProjectionTests' },
  { name: 'Satellites', deps: ['AstronomyCore'], tests: 'SatellitesTests' },
  { name: 'ObservingKit', deps: ['AstronomyCore', 'SkyCatalog', 'Satellites'], tests: 'ObservingKitTests' },
  { name: 'UserData', deps: ['AstronomyCore', 'SkyCatalog', 'ObservingKit'], tests: 'UserDataTests' },
  { name: 'SkySession', deps: ['AstronomyCore', 'SkyCatalog', 'SkyProjection', 'Satellites', 'ObservingKit', 'UserData'], tests: 'SkySessionTests' },
];

const args = process.argv.slice(2);
const buildOnly = args.includes('--build');
const filterAt = args.indexOf('--filter');
const filter = filterAt >= 0 ? args[filterAt + 1] : null;

const res = `${sdk}/swift.xctoolchain/usr/lib/swift_static`;
const env = { ...process.env };
const dllDirs = ['bin', 'bin/swiftCore', 'bin/swiftCRT', 'bin/swift_Concurrency', 'bin/swiftDispatch', 'bin/swiftObservation'];
env.PATH = dllDirs.map((d) => path.join(usr, d)).join(path.delimiter) + path.delimiter + (env.PATH ?? env.Path ?? '');
delete env.Path;

const exe = (n) => path.join(usr, 'bin', process.platform === 'win32' ? `${n}.exe` : n);
const swiftFlags = [
  '-target', 'wasm32-unknown-wasip1', '-sdk', `${sdk}/WASI.sdk`, '-resource-dir', res,
  '-I', `${res}/shims`, '-I', res,
  '-Xcc', `-fmodule-map-file=${res}/_foundation_unicode/module.modulemap`,
  '-Xcc', `-fmodule-map-file=${res}/CoreFoundation/module.modulemap`,
  '-Xcc', `-fmodule-map-file=${res}/_FoundationCShims/module.modulemap`,
  '-static-stdlib', '-Xcc', '-w',
  '-I', path.join(pkg, 'Sources/CAstronomyEngine/include'), '-I', build,
];

fs.mkdirSync(build, { recursive: true });
fs.mkdirSync(path.join(build, 'stamps'), { recursive: true });

function run(cmd, cmdArgs, label) {
  // Long argument lists go through a response file to stay under the Windows limit.
  const rsp = path.join(build, `${label}.rsp`);
  fs.writeFileSync(rsp, cmdArgs.map((a) => `"${a.replaceAll('\\', '/')}"`).join('\n'));
  const r = spawnSync(cmd, [`@${rsp}`], { env, encoding: 'utf8', maxBuffer: 1 << 28, cwd: build });
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (r.status !== 0) {
    console.error(`✗ ${label}`);
    console.error(cleanDiagnostics(text));
    process.exit(1);
  }
  const warnings = cleanDiagnostics(text);
  if (warnings.trim()) console.log(warnings);
}

// Drops the noise from SDK headers so only project diagnostics are shown.
function cleanDiagnostics(text) {
  const out = [];
  let skipping = false;
  for (const line of text.split('\n')) {
    if (/^\S.*\.(h|modulemap):\d+/.test(line) || line.includes('<module-includes>')) { skipping = true; continue; }
    if (/^[A-Za-z]:[\\/].*\.swift:\d+|^\S+\.swift:\d+|error:/.test(line)) skipping = false;
    if (!skipping) out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const swiftFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.swift'))
    .map((e) => path.join(e.parentPath ?? e.path, e.name)).sort();
};

const digest = (files, extra = '') => {
  const h = createHash('sha256').update(extra);
  for (const f of files) h.update(f).update(fs.readFileSync(f));
  return h.digest('hex');
};
const stampFile = (n) => path.join(build, 'stamps', n);
const fresh = (n, d) => fs.existsSync(stampFile(n)) && fs.readFileSync(stampFile(n), 'utf8') === d;
const stamp = (n, d) => fs.writeFileSync(stampFile(n), d);

// C engine
const cSource = path.join(pkg, 'Sources/CAstronomyEngine/astronomy.c');
const cObject = path.join(build, 'astronomy.o');
{
  const d = digest([cSource]);
  if (!fresh('c', d) || !fs.existsSync(cObject)) {
    console.log('• CAstronomyEngine');
    run(exe('clang'), ['--target=wasm32-wasip1', `--sysroot=${sdk}/WASI.sdk`, '-O2',
      '-DASTRONOMY_ENGINE_WHOLE_SECOND', '-c', cSource, '-o', cObject,
      '-I', path.join(pkg, 'Sources/CAstronomyEngine/include')], 'c');
    stamp('c', d);
  }
}

// Swift modules, each one rebuilt when its sources or dependencies change.
const moduleDigests = new Map();
const compile = (name, sources, deps, { testing = true, inTests = false } = {}) => {
  const d = digest(sources, deps.map((x) => moduleDigests.get(x) ?? '').join());
  moduleDigests.set(name, d);
  const obj = path.join(build, `${name}.o`);
  if (fresh(name, d) && fs.existsSync(obj)) return false;
  console.log(`• ${name} (${sources.length} files)`);
  run(exe('swiftc'), [...swiftFlags, '-parse-as-library', ...(testing ? ['-enable-testing'] : []),
    '-swift-version', '6', '-module-name', name, '-emit-module',
    '-emit-module-path', path.join(build, `${name}.swiftmodule`), '-wmo', ...(inTests ? [] : ['-O']),
    ...sources, '-c', '-o', obj], name);
  stamp(name, d);
  return true;
};

const built = [];
for (const t of targets) {
  const src = swiftFiles(path.join(pkg, 'Sources', t.name));
  if (!src.length) continue;
  compile(t.name, src, t.deps);
  built.push(t);
}

const testTargets = built.filter((t) => swiftFiles(path.join(pkg, 'Tests', t.tests)).length);
const testObjects = [];
for (const t of testTargets) {
  compile(t.tests, swiftFiles(path.join(pkg, 'Tests', t.tests)), [t.name, ...t.deps], { testing: false, inTests: true });
  testObjects.push(path.join(build, `${t.tests}.o`));
}

if (buildOnly) { console.log('✓ build ok'); process.exit(0); }
if (!testObjects.length) { console.log('✓ build ok (no tests yet)'); process.exit(0); }

const mainSwift = path.join(build, 'testrunner.swift');
fs.writeFileSync(path.join(build, 'main.swift'), 'import Testing\nawait Testing.__swiftPMEntryPoint() as Never\n');
void mainSwift;
const wasm = path.join(build, 'tests.wasm');
const linkDigest = [...moduleDigests.values()].join();
if (!fresh('link', linkDigest) || !fs.existsSync(wasm)) {
  console.log('• linking test runner');
  const rt = path.join(build, 'rt/lib/wasm32-unknown-wasip1');
  fs.mkdirSync(rt, { recursive: true });
  const builtins = path.join(rt, 'libclang_rt.builtins.a');
  if (!fs.existsSync(builtins)) {
    const found = fs.readdirSync(`${sdk}/swift.xctoolchain/usr/lib/clang`, { recursive: true })
      .find((f) => String(f).endsWith('libclang_rt.builtins-wasm32.a'));
    fs.copyFileSync(path.join(`${sdk}/swift.xctoolchain/usr/lib/clang`, String(found)), builtins);
  }
  run(exe('swiftc'), [...swiftFlags, '-module-name', 'runner', path.join(build, 'main.swift'),
    ...built.map((t) => path.join(build, `${t.name}.o`)), ...testObjects, cObject, '-o', wasm,
    '-Xclang-linker', '-resource-dir', '-Xclang-linker', path.join(build, 'rt'),
    '-Xlinker', '-z', '-Xlinker', 'stack-size=8388608'], 'link');
  stamp('link', linkDigest);
}

const runner = spawnSync(process.execPath, ['--no-warnings', path.join(here, 'run-wasm.mjs'), wasm, pkg,
  ...(filter ? ['--filter', filter] : [])], { encoding: 'utf8', maxBuffer: 1 << 28, cwd: pkg });
const lines = `${runner.stdout ?? ''}${runner.stderr ?? ''}`.split('\n');
// Passing test lines are noise. Failures, recorded issues and the summary are not.
const shown = lines.filter((l) => !/^(◇|↳|✔ Test [^r]|✔ Suite)/.test(l.replace(/\x1b\[[0-9;]*m/g, '')));
console.log(shown.join('\n').trim());
process.exit(runner.status ?? 1);
