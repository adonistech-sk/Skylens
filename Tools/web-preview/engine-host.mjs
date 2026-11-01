// Runs the Swift engine under Node's WASI, with stdin and stdout piped to server.mjs.
import fs from 'node:fs';
import { WASI } from 'node:wasi';

const [, , wasmPath, pkgDir] = process.argv;
const wasi = new WASI({
  version: 'preview1',
  args: [wasmPath],
  env: { TZ: 'UTC', SKYLENS_RESOURCES: '/pkg/Sources/SkyCatalog/Resources' },
  preopens: { '/pkg': pkgDir },
  returnOnExit: true,
});
const module = await WebAssembly.compile(fs.readFileSync(wasmPath));
const instance = await WebAssembly.instantiate(module, wasi.getImportObject());
process.exitCode = wasi.start(instance);
