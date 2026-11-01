#!/usr/bin/env node
// Prepares a Swift-to-Wasm toolchain on Windows without admin rights, Visual Studio
// or WSL, and without installing anything: files are unpacked into one directory.
//
//   node Tools/wasm-check/setup-windows.mjs <toolsDir> [path-to-installer.exe]
//
// Then, in Git Bash:
//   export SKYLENS_TOOLS=<toolsDir>
//   . Tools/wasm-check/env.sh
//   node Tools/wasm-check/check.mjs
//
// The Swift installer is a WiX Burn bundle with its payload embedded after the code
// signature, so its layout mode won't extract it. This reads the bundle's container
// table, carves out the cabinets, and rebuilds the tree from each MSI's tables.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const VERSION = '6.4.2';
const WASM_SHA256 = '83baca83553f8c443cda7b84800912e6e709c3acd2e7ebf277794ca5836c0da5';
const BASE = `https://download.swift.org/swift-${VERSION}-release`;
const NEEDED = ['bld.noasserts', 'cli.noasserts', 'res', 'rtl.amd64'];

const [, , toolsArg, localInstaller] = process.argv;
if (!toolsArg) { console.error('usage: setup-windows.mjs <toolsDir> [installer.exe]'); process.exit(2); }
const tools = path.resolve(toolsArg);
fs.mkdirSync(tools, { recursive: true });
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stdout}${r.stderr}`);
  return r.stdout;
};

async function download(url, file) {
  if (fs.existsSync(file)) return;
  console.log(`• downloading ${path.basename(url)}`);
  run('curl.exe', ['-fsSL', '-o', file, url]);
}

// Wasm SDK: an artifact bundle, unpacked as is.
const wasmTar = path.join(tools, 'swift-wasm.tar.gz');
await download(`${BASE}/wasm-sdk/swift-${VERSION}-RELEASE/swift-${VERSION}-RELEASE_wasm.artifactbundle.tar.gz`, wasmTar);
const sum = createHash('sha256').update(fs.readFileSync(wasmTar)).digest('hex');
if (sum !== WASM_SHA256) throw new Error(`Wasm SDK checksum mismatch: ${sum}`);
const wasmDir = path.join(tools, 'wasm-sdk');
if (!fs.existsSync(wasmDir)) {
  console.log('• unpacking Wasm SDK');
  fs.mkdirSync(wasmDir);
  // Run with relative paths: Windows tar reads "C:" as a remote host.
  spawnSync('tar', ['-xzf', '../swift-wasm.tar.gz'], { cwd: wasmDir, stdio: 'inherit' });
}

// Toolchain: carve, expand, rebuild.
const installer = localInstaller ?? path.join(tools, 'swift-toolchain.exe');
await download(`${BASE}/windows10/swift-${VERSION}-RELEASE/swift-${VERSION}-RELEASE-windows10.exe`, installer);

const carved = path.join(tools, 'carved');
fs.mkdirSync(carved, { recursive: true });
const fd = fs.openSync(installer, 'r');
const head = Buffer.alloc(8192);
fs.readSync(fd, head, 0, head.length, 0);
const pe = head.readUInt32LE(0x3c);
let offset = pe + 24 + head.readUInt16LE(pe + 20), section = null;
for (let i = 0, n = head.readUInt16LE(pe + 6); i < n; i++, offset += 40) {
  if (head.toString('latin1', offset, offset + 8).startsWith('.wixburn')) {
    section = { size: head.readUInt32LE(offset + 16), raw: head.readUInt32LE(offset + 20) };
  }
}
if (!section) throw new Error('not a Burn bundle');
const burn = Buffer.alloc(section.size);
fs.readSync(fd, burn, 0, burn.length, section.raw);
const stub = burn.readUInt32LE(24), containers = burn.readUInt32LE(44);
const sizes = Array.from({ length: containers }, (_, i) => burn.readUInt32LE(48 + i * 4));

const copyRange = (start, length, file) => {
  const chunk = Buffer.alloc(1 << 22), out = fs.openSync(file, 'w');
  for (let left = length, p = start; left > 0;) {
    const got = fs.readSync(fd, chunk, 0, Math.min(chunk.length, left), p);
    fs.writeSync(out, chunk, 0, got);
    left -= got;
    p += got;
  }
  fs.closeSync(out);
};
const expand = path.join(process.env.WINDIR, 'System32', 'expand.exe');
const expandAll = (cab, dir) => { fs.mkdirSync(dir, { recursive: true }); run(expand, ['-F:*', cab, dir]); };

// Container 0 holds the manifest and sits before the signature. The rest follow it.
console.log('• carving installer containers');
copyRange(stub, sizes[0], path.join(carved, 'manifest.cab'));
expandAll(path.join(carved, 'manifest.cab'), path.join(carved, 'ux'));
const search = Buffer.alloc(1 << 20);
const signatureAt = stub + sizes[0];
fs.readSync(fd, search, 0, search.length, signatureAt);
let position = signatureAt + search.indexOf('MSCF', 0, 'latin1');
for (let i = 1; i < containers; i++) {
  const cab = path.join(carved, `payload${i}.cab`);
  copyRange(position, sizes[i], cab);
  expandAll(cab, path.join(carved, 'payload'));
  fs.rmSync(cab);
  position += sizes[i];
}
fs.closeSync(fd);

const manifest = fs.readdirSync(path.join(carved, 'ux'))
  .map((f) => fs.readFileSync(path.join(carved, 'ux', f), 'utf8'))
  .find((t) => t.includes('<BurnManifest'));
const payloads = new Map([...manifest.matchAll(/<Payload [^>]*?FilePath="([^"]*)"[^>]*?SourcePath="([^"]*)"/g)].map((m) => [m[1], m[2]]));

// A PowerShell helper reads each MSI's tables through the Windows Installer COM API.
const dump = path.join(tools, 'read-msi.ps1');
fs.writeFileSync(dump, `param($msi, $out)
$i = New-Object -ComObject WindowsInstaller.Installer
function Q($db, $sql, $n) { $v = $db.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $db, @($sql)); $v.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $v, $null) | Out-Null; $rows = @(); while ($true) { $r = $v.GetType().InvokeMember('Fetch', 'InvokeMethod', $null, $v, $null); if ($r -eq $null) { break }; $row = @(); for ($c = 1; $c -le $n; $c++) { $row += $r.GetType().InvokeMember('StringData', 'GetProperty', $null, $r, @($c)) }; $rows += ,$row }; return ,$rows }
$db = $i.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $i, @($msi, 0))
@{ files = (Q $db 'SELECT File,Component_,FileName FROM File' 3); comps = (Q $db 'SELECT Component,Directory_ FROM Component' 2); dirs = (Q $db 'SELECT Directory,Directory_Parent,DefaultDir FROM Directory' 3) } | ConvertTo-Json -Depth 5 -Compress | Out-File -Encoding utf8 $out
`);

const tree = path.join(tools, 'tree');
const long = (s) => { const t = s.split(':').pop(); return t.includes('|') ? t.split('|')[1] : t; };
for (const name of NEEDED) {
  console.log(`• rebuilding ${name}`);
  const msi = path.join(carved, 'payload', payloads.get(`${name}.msi`));
  const cab = path.join(carved, 'payload', payloads.get(`${name}.cab`));
  const tables = path.join(carved, `${name}.json`);
  run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', dump, msi, tables]);
  const unpacked = path.join(carved, `cab-${name}`);
  expandAll(`${cab}`, unpacked);

  const j = JSON.parse(fs.readFileSync(tables, 'utf8').replace(/^﻿/, ''));
  const dirs = new Map(j.dirs.map(([id, parent, def]) => [id, { parent, def }]));
  const dirPath = (id) => {
    const d = dirs.get(id);
    if (!d || id === 'TARGETDIR') return '';
    const n = long(d.def);
    const p = d.parent && d.parent !== id ? dirPath(d.parent) : '';
    return n === '.' ? p : path.join(p, n);
  };
  const component = new Map(j.comps);
  for (const [file, comp, fileName] of j.files) {
    const dst = path.join(tree, dirPath(component.get(comp)), long(fileName));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.renameSync(path.join(unpacked, file), dst);
  }
}
fs.rmSync(carved, { recursive: true, force: true });
console.log(`✓ toolchain ready in ${tools}`);
