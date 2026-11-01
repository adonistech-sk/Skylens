#!/usr/bin/env node
// Parses SkyShaders.metal with real Clang against the stand-in header in metal/.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const usr = process.env.SKYLENS_TOOLCHAIN;
if (!usr) { console.error('Set SKYLENS_TOOLCHAIN.'); process.exit(2); }
const clang = path.join(usr, 'bin', process.platform === 'win32' ? 'clang++.exe' : 'clang++');
const out = path.join(repo, '.build-wasm');
fs.mkdirSync(out, { recursive: true });
const copy = path.join(out, 'SkyShaders.cpp');
// Metal's point_coord and other attributes are unknown to plain C++, so they warn.
fs.copyFileSync(path.join(repo, 'SkyLens/Sky/SkyShaders.metal'), copy);
const sdk = process.env.SKYLENS_WASM_SDK;
const r = spawnSync(clang, ['--target=wasm32-wasip1', `--sysroot=${sdk}/WASI.sdk`, '-fsyntax-only', '-std=c++17', '-Wno-unknown-attributes', '-Wno-ignored-attributes', '-Wno-c++11-narrowing', '-Wno-return-type', '-I', path.join(here, 'metal'), copy], { encoding: 'utf8' });
const text = `${r.stdout}${r.stderr}`.replaceAll(out.replaceAll('/', path.sep) + path.sep, '');
console.log(text.trim() || '');
console.log(r.status === 0 ? '✓ shaders parse' : '✗ shader errors');
process.exit(r.status ?? 1);
