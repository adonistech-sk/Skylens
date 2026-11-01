// Runs a wasm32-wasip1 binary under Node. The package directory is preopened at
// /pkg so tests can read bundled catalog resources.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WASI } from 'node:wasi';

const [, , file, pkgDir, ...args] = process.argv;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skylens-test-'));
const wasi = new WASI({
  version: 'preview1',
  args: [file, ...args],
  env: { TZ: 'UTC', SKYLENS_RESOURCES: '/pkg/Sources/SkyCatalog/Resources', SKYLENS_TMP: '/tmp' },
  preopens: { '/pkg': pkgDir, '/tmp': tmpDir },
  returnOnExit: true,
});
const module = await WebAssembly.compile(fs.readFileSync(file));
const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
process.exitCode = wasi.start(instance);
fs.rmSync(tmpDir, { recursive: true, force: true });
