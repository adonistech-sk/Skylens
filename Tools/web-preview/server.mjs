#!/usr/bin/env node
// Serves the browser preview on 127.0.0.1 and relays API calls to the Swift engine.
//   node Tools/web-preview/server.mjs [port]

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const build = process.env.SKYLENS_BUILD_DIR ?? path.join(repo, '.build-wasm');
const pkg = path.join(repo, 'Packages/SkyLensKit');
const wasm = path.join(build, 'skybridge.wasm');
const port = Number(process.argv[2] ?? 5173);
const USER_AGENT = 'SkyLens-preview/0.1 local-development';
if (!fs.existsSync(wasm)) { console.error('Engine not built. Run Tools/web-preview/build.mjs first.'); process.exit(1); }

const engine = spawn(process.execPath, ['--no-warnings', path.join(here, 'engine-host.mjs'), wasm, pkg], { stdio: ['pipe', 'pipe', 'inherit'] });
engine.on('exit', (code) => { console.error(`engine exited with ${code}`); process.exit(1); });

let ready, nextId = 1;
const started = new Promise((resolve) => { ready = resolve; });
const pending = new Map();
readline.createInterface({ input: engine.stdout, crlfDelay: Infinity }).on('line', (line) => {
  const message = JSON.parse(line);
  if (message.ready) { ready(); return; }
  if (message.fatal) { console.error(message.fatal); process.exit(1); }
  const entry = pending.get(message.id);
  pending.delete(message.id);
  if (entry) entry(message);
});

function call(request) {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    engine.stdin.write(`${JSON.stringify({ ...request, id })}\n`);
  });
}

// Live data. Each is cached to respect the providers' limits, and failures simply
// leave the feature unavailable.
const weatherCache = new Map();
async function weather(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = weatherCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.text;
  try {
    const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return '';
    const text = await r.text();
    const expires = Date.parse(r.headers.get('expires') ?? '') || Date.now() + 1800e3;
    weatherCache.set(key, { text, expires });
    return text;
  } catch { return hit?.text ?? ''; }
}

const satelliteFile = path.join(build, 'satellites.json');
let satellitesLoaded = false;
async function loadSatellites() {
  if (satellitesLoaded) return;
  satellitesLoaded = true;
  let text = '';
  const age = fs.existsSync(satelliteFile) ? Date.now() - fs.statSync(satelliteFile).mtimeMs : Infinity;
  if (age < 2 * 3600e3) {
    text = fs.readFileSync(satelliteFile, 'utf8');
  } else {
    // curl, because Node's fetch times out connecting to this host on some networks.
    const r = spawnSync('curl', ['-fsSL', '--max-time', '20', '-A', USER_AGENT, 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json'],
      { encoding: 'utf8', maxBuffer: 1 << 24 });
    if (r.status === 0 && r.stdout.startsWith('[')) { text = r.stdout; fs.writeFileSync(satelliteFile, text); }
    if (!text && fs.existsSync(satelliteFile)) text = fs.readFileSync(satelliteFile, 'utf8');
  }
  if (text) await call({ op: 'satellites', satellites: text });
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.bin': 'application/octet-stream' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body);
    if (request.op === 'tonight') request.weather = await weather(request.lat, request.lon);
    const reply = await call(request);
    res.writeHead(reply.error ? 400 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reply.error ? { error: reply.error } : reply.result));
    return;
  }
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = name === 'stars.bin'
    ? path.join(pkg, 'Sources/SkyCatalog/Resources/stars.bin')
    : ['index.html', 'app.js', 'style.css'].includes(name) ? path.join(here, 'public', name) : null;
  if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});

await started;
await loadSatellites();
// Bound to loopback only, so the preview isn't exposed to the local network.
server.listen(port, '127.0.0.1', () => console.log(`SkyLens preview: http://localhost:${port}`));
