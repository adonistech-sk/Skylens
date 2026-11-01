// Browser preview of SkyLens. All astronomy comes from the Swift engine through /api.
// This file only handles drawing and interaction. Camera, label and appearance maths
// mirror SkyLensKit's SkyProjection module, which is where the tested versions live.
'use strict';

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(`skylens.${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`skylens.${k}`, JSON.stringify(v)); } catch { /* preview still works */ } },
};
// Only the sky behind the welcome screen uses this, until the user chooses a place.
const BACKDROP = { name: '', lat: 35, lon: 0 };
const site = () => state.place ?? BACKDROP;
async function api(op, extra = {}) {
  const location = extra.noLocation ? {} : { lat: site().lat, lon: site().lon, date: skyTime() / 1000 };
  const r = await fetch('/api', { method: 'POST', body: JSON.stringify({ op, ...location, ...extra, noLocation: undefined }) });
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
}

const DEFAULT_DISPLAY = {
  lines: true, boundaries: false, conNames: true, starNames: true, planetNames: true, deepSky: true, satellites: true,
  horizon: true, atmosphere: true, altAz: false, equatorial: false, night: false, starSize: 1, limit: 6.5, density: 'normal',
};
const CITIES = [
  ['Warsaw', 52.23, 21.01, 'Europe/Warsaw'], ['London', 51.5, -0.12, 'Europe/London'], ['New York', 40.71, -74.01, 'America/New_York'],
  ['Los Angeles', 34.05, -118.24, 'America/Los_Angeles'], ['Tokyo', 35.68, 139.65, 'Asia/Tokyo'], ['Sydney', -33.87, 151.21, 'Australia/Sydney'],
  ['Cape Town', -33.92, 18.42, 'Africa/Johannesburg'], ['Quito', -0.18, -78.47, 'America/Guayaquil'], ['Tromsø', 69.65, 18.96, 'Europe/Oslo'],
];
const state = {
  place: store.get('place', null),
  display: { ...DEFAULT_DISPLAY, ...store.get('display', {}) },
  favorites: store.get('favorites', []), tags: store.get('tags', []), recents: store.get('recents', []),
  equipment: store.get('equipment', ['nakedEye']), experience: store.get('experience', 'beginner'), imperial: store.get('imperial', false),
  az: 180, alt: 35, fov: 75,
  selection: null, selectionDir: null, scene: null, frame: null,
  clock: { real: Date.now(), sky: Date.now(), rate: 1 },
};

// ---- Clock, the same linear map as SkyClock.
const MIN_DATE = Date.UTC(1800, 0, 1), MAX_DATE = Date.UTC(2199, 11, 31);
function skyTime(now = Date.now()) {
  const c = state.clock;
  return Math.min(MAX_DATE, Math.max(MIN_DATE, c.sky + (now - c.real) * c.rate));
}
function setClock(sky, rate = state.clock.rate) {
  state.clock = { real: Date.now(), sky: Math.min(MAX_DATE, Math.max(MIN_DATE, sky)), rate };
  needFrame();
  if (state.selection) refreshCard();
}
const isLive = () => state.clock.rate === 1 && Math.abs(skyTime() - Date.now()) < 1000;

// ---- Vector helpers. Horizon frame: +x north, +y west, +z zenith.
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const horizontal = (az, alt) => [Math.cos(alt * DEG) * Math.cos(az * DEG), -Math.cos(alt * DEG) * Math.sin(az * DEG), Math.sin(alt * DEG)];
const toAzAlt = (v) => ({ az: ((Math.atan2(-v[1], v[0]) / DEG) + 360) % 360, alt: Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG });
const mul = (m, v) => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
const compassName = (az) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(((az + 22.5) % 360) / 45)];

function orientation(az, alt) {
  const f = horizontal(az, alt);
  let right = cross(f, [0, 0, 1]);
  if (Math.hypot(...right) < 1e-6) right = cross(f, horizontal(az, 0).map((x) => x * (alt > 0 ? -1 : 1)));
  right = norm(right);
  const up = norm(cross(right, f));
  return [right, up, [-f[0], -f[1], -f[2]]];
}

const view = { w: 390, h: 844, dpr: 1, o: orientation(180, 35), scale: 1 };
function updateCamera() {
  view.o = orientation(state.az, state.alt);
  view.scale = Math.min(view.w, view.h) / 2 / Math.tan(state.fov * DEG / 4);
}
function project(h) {
  const c = mul(view.o, h), k = 1 - c[2];
  if (k < 1e-6) return null;
  const s = view.scale / k;
  return { x: view.w / 2 + c[0] * s, y: view.h / 2 - c[1] * s, k };
}
function unproject(x, y) {
  const px = (x - view.w / 2) / view.scale, py = (view.h / 2 - y) / view.scale, r2 = px * px + py * py, k = 2 / (1 + r2);
  const c = [px * k, py * k, (r2 - 1) / (r2 + 1)], o = view.o;
  return [0, 1, 2].map((i) => o[0][i] * c[0] + o[1][i] * c[1] + o[2][i] * c[2]);
}
const visible = (p, m = 0) => p && p.x >= -m && p.y >= -m && p.x <= view.w + m && p.y <= view.h + m;
const perDegree = () => view.scale / 2 * DEG;
const toHorizon = (j) => mul(state.frame.matrix, j);
const toJ2000 = (h) => { const m = state.frame.matrix; return [0, 1, 2].map((i) => m[0][i] * h[0] + m[1][i] * h[1] + m[2][i] * h[2]); };

// ---- WebGL
const gl = $('sky').getContext('webgl', { antialias: true, alpha: false, premultipliedAlpha: false });
const PROJECT = `
uniform mat3 uJ2H, uH2V; uniform vec4 uScreen; uniform vec4 uStars;
vec3 refracted(vec3 h) {
  if (uStars.w < .5 || h.z < -.1 || h.z > .5) return h;
  float alt = asin(clamp(h.z, -1., 1.)) * 57.29578, c = max(alt, -1.);
  float lifted = (alt + (1.02 / tan((c + 10.3 / (c + 5.11)) * .0174533)) / 60.) * .0174533;
  float l = length(h.xy);
  return l < 1e-5 ? h : vec3(h.xy / l * cos(lifted), sin(lifted));
}
vec4 place(vec3 v, out float k) {
  k = 1. - v.z;
  vec2 p = v.xy * uScreen.z / max(k, 1e-4);
  return vec4(p.x / (uScreen.x * .5), p.y / (uScreen.y * .5), 0., 1.);
}`;
const FINISH = `
uniform float uNight;
vec3 finish(vec3 c) { if (uNight > .5) { float y = dot(c, vec3(.45, .45, .1)); return vec3(y, y * .04, 0.); } return c; }`;
function program(vs, fs) {
  const make = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, make(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, make(gl.FRAGMENT_SHADER, `precision highp float;\n${fs}`));
  gl.linkProgram(p);
  const u = new Proxy({}, { get: (c, n) => (n in c ? c[n] : (c[n] = gl.getUniformLocation(p, n))) });
  return { p, u, a: (n) => gl.getAttribLocation(p, n) };
}
const starProg = program(`
attribute vec3 aDir; attribute float aMag; attribute float aBv;
${PROJECT}
varying vec3 vColor; varying float vAlpha;
vec3 tint(float bv) {
  vec3 hot = vec3(.60,.74,1.), white = vec3(1.,.98,.95), warm = vec3(1.,.80,.54), cool = vec3(1.,.58,.34);
  if (bv < .3) return mix(hot, white, clamp((bv + .3) / .6, 0., 1.));
  if (bv < 1.) return mix(white, warm, (bv - .3) / .7);
  return mix(warm, cool, clamp((bv - 1.) / .8, 0., 1.));
}
void main() {
  float k; vec4 pos = place(uH2V * refracted(uJ2H * aDir), k);
  float delta = max(uStars.x - aMag, 0.);
  float radius = max(.45, .55 * pow(delta + .5, .72) * uStars.y);
  vAlpha = clamp((uStars.x - aMag + .15) / 1.1, 0., 1.);
  vColor = tint(aBv);
  gl_PointSize = radius * 4. * uScreen.w;
  gl_Position = (k < .12 || vAlpha <= 0.) ? vec4(2., 2., 0., 1.) : pos;
}`, `varying vec3 vColor; varying float vAlpha; ${FINISH}
void main() {
  float d = length(gl_PointCoord - .5) * 2.;
  float i = (exp(-d * d * 16.) * 1.35 + exp(-d * d * 3.2) * .10) * vAlpha;
  gl_FragColor = vec4(finish(vColor * i), i);
}`);
const lineProg = program(`
attribute vec3 aDir;
${PROJECT}
uniform float uFrame; varying float vFade;
void main() {
  float k; gl_Position = place(uH2V * (uFrame < .5 ? uJ2H * aDir : aDir), k);
  vFade = k < .12 ? 0. : 1.;
}`, `uniform vec4 uColor; varying float vFade; ${FINISH}
void main() { if (vFade < .99) discard; gl_FragColor = vec4(finish(uColor.rgb) * uColor.a, uColor.a); }`);
const quadVS = `attribute vec2 aPos; varying vec2 vNdc; void main() { vNdc = aPos; gl_Position = vec4(aPos, 0., 1.); }`;
const RAY = `
varying vec2 vNdc; uniform mat3 uV2H; uniform vec4 uScreen;
vec3 ray() {
  vec2 xy = vNdc * uScreen.xy * .5 / uScreen.z; float r2 = dot(xy, xy), k = 2. / (1. + r2);
  return uV2H * vec3(xy * k, (r2 - 1.) / (r2 + 1.));
}`;
const skyProg = program(quadVS, `${RAY} ${FINISH}
uniform vec4 uSun; uniform float uAtmosphere; uniform mat3 uH2J; uniform sampler2D uMilky;
void main() {
  vec3 r = ray(); float alt = clamp(r.z, -1., 1.), b = uSun.w;
  vec3 night = vec3(.0003, .0008, .0028), c = night;
  if (uAtmosphere > .5) {
    vec3 day = mix(vec3(.58,.72,.88), vec3(.13,.32,.62), pow(max(alt, 0.), .45));
    c = mix(night, day, b);
    float toSun = max(dot(r, uSun.xyz), 0.);
    float twilight = smoothstep(-.32, -.02, uSun.z) * (1. - smoothstep(.05, .35, uSun.z));
    c += vec3(.95,.46,.18) * twilight * exp(-max(alt, 0.) * 7.) * (.18 + .7 * pow(toSun, 6.));
    c += vec3(1.,.92,.8) * pow(toSun, 220.) * smoothstep(-.1, .05, uSun.z);
    c += vec3(.0030,.0052,.0105) * exp(-max(alt, 0.) * 11.) * (1. - b);
  }
  if (b < .5) {
    vec3 j = uH2J * r;
    vec2 uv = vec2(fract(atan(j.y, j.x) / 6.2831853), .5 - asin(clamp(j.z, -1., 1.)) / 3.1415927);
    float g = texture2D(uMilky, uv).r;
    c += vec3(.030,.033,.046) * g * (1. - b * 2.);
  }
  gl_FragColor = vec4(pow(finish(c), vec3(1. / 2.2)), 1.);
}`);
const groundProg = program(quadVS, `${RAY} ${FINISH}
uniform float uDay; uniform float uAlpha;
void main() {
  vec3 r = ray();
  // A decorative ridge line, at most about a degree high, so the horizon reads as a
  // place rather than a ruled edge.
  float az = atan(r.y, r.x);
  float ridge = .0075 + .0042 * sin(az * 3. + 1.1) + .0026 * sin(az * 7. + 2.3) + .0014 * sin(az * 17. + .4) + .0007 * sin(az * 43. + 1.7) + .0004 * sin(az * 97.);
  float below = 1. - smoothstep(ridge - .0009, ridge + .0009, r.z);
  if (below <= 0.) discard;
  vec3 c = mix(vec3(.0009,.0013,.0024), vec3(.045,.060,.050), uDay);
  float a = below * uAlpha;
  gl_FragColor = vec4(pow(finish(c), vec3(1. / 2.2)) * a, a);
}`);
const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enable(gl.BLEND);

const stars = { count: 0, hip: null, ra: null, dec: null, pmra: null, pmdec: null, mag: null, bv: null, buffer: gl.createBuffer(), epoch: NaN };
async function loadStars() {
  const raw = await (await fetch('stars.bin')).arrayBuffer(), d = new DataView(raw), n = d.getUint32(4, true);
  Object.assign(stars, { count: n, hip: new Uint32Array(n), ra: new Float32Array(n), dec: new Float32Array(n), pmra: new Float32Array(n), pmdec: new Float32Array(n), mag: new Float32Array(n), bv: new Float32Array(n) });
  for (let i = 0; i < n; i++) {
    const o = 8 + i * 28;
    stars.hip[i] = d.getUint32(o, true); stars.ra[i] = d.getFloat32(o + 4, true); stars.dec[i] = d.getFloat32(o + 8, true);
    stars.pmra[i] = d.getFloat32(o + 12, true); stars.pmdec[i] = d.getFloat32(o + 16, true);
    stars.mag[i] = d.getInt16(o + 24, true) / 100;
    const c = d.getInt16(o + 26, true); stars.bv[i] = c === -32768 ? .6 : c / 1000;
  }
  buildMilkyWay();
}
function starDirection(i, years) {
  const a = stars.ra[i] * DEG, d = stars.dec[i] * DEG, sa = Math.sin(a), ca = Math.cos(a), sd = Math.sin(d), cd = Math.cos(d);
  const s = years / 3600000 * DEG, e = stars.pmra[i] * s, n = stars.pmdec[i] * s;
  return [cd * ca - sa * e - sd * ca * n, cd * sa + ca * e - sd * sa * n, sd + cd * n];
}
function rebuildStars() {
  const years = (skyTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 864e5);
  if (Math.abs(years - stars.epoch) < 5) return;
  stars.epoch = years;
  const v = new Float32Array(stars.count * 5);
  for (let i = 0; i < stars.count; i++) {
    const d = norm(starDirection(i, years));
    v.set([d[0], d[1], d[2], stars.mag[i], stars.bv[i]], i * 5);
  }
  stars.vertices = v;
  gl.bindBuffer(gl.ARRAY_BUFFER, stars.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
}
function starsBrighterThan(limit) {
  let lo = 0, hi = stars.count;
  while (lo < hi) { const m = (lo + hi) >> 1; if (stars.mag[m] <= limit) lo = m + 1; else hi = m; }
  return lo;
}
function buildMilkyWay() {
  const w = 512, h = 256;
  let g = new Float32Array(w * h);
  for (let i = 0; i < stars.count; i++) {
    if (stars.mag[i] <= 5) continue;
    g[Math.min(h - 1, Math.floor((.5 - stars.dec[i] / 180) * h)) * w + Math.min(w - 1, Math.floor(stars.ra[i] / 360 * w))]++;
  }
  for (let y = 0; y < h; y++) {
    const s = 1 / Math.max(Math.cos(((y + .5) / h - .5) * Math.PI), .05);
    for (let x = 0; x < w; x++) g[y * w + x] *= s;
  }
  const blur = (src) => {
    const a = new Float32Array(w * h), b = new Float32Array(w * h), r = 5, n = r * 2 + 1;
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[y * w + (k + w) % w];
      for (let x = 0; x < w; x++) { a[y * w + x] = s / n; s += src[y * w + (x + r + 1) % w] - src[y * w + (x - r + w) % w]; }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += a[Math.min(h - 1, Math.max(0, k)) * w + x];
      for (let y = 0; y < h; y++) { b[y * w + x] = s / n; s += a[Math.min(h - 1, y + r + 1) * w + x] - a[Math.max(0, y - r) * w + x]; }
    }
    return b;
  };
  g = blur(g);
  const sorted = Float32Array.from(g).sort(), lo = sorted[sorted.length >> 1], hi = sorted[Math.floor(sorted.length * .995)];
  // Hipparcos is too shallow to trace the band alone, which reads as blotches. Real star
  // density supplies the texture, inside an envelope on the galactic plane.
  const unit = (ra, dec) => [Math.cos(dec * DEG) * Math.cos(ra * DEG), Math.cos(dec * DEG) * Math.sin(ra * DEG), Math.sin(dec * DEG)];
  const pole = unit(192.859, 27.128), centre = unit(266.405, -28.936);
  const bytes = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = unit((x + .5) / w * 360, 90 - (y + .5) / h * 180);
    const b = Math.asin(dot(d, pole)) / DEG, c = Math.acos(Math.max(-1, Math.min(1, dot(d, centre)))) / DEG;
    const envelope = Math.exp(-((b / 11) ** 2)) * (.55 + 1.1 * Math.exp(-((c / 42) ** 2)));
    const density = Math.max(0, Math.min(1, (g[y * w + x] - lo) / (hi - lo)));
    bytes[y * w + x] = Math.min(255, envelope * (.45 + .75 * density) * 255);
  }
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
}
const lineSets = {};
function makeLines(name, flat) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flat), gl.STATIC_DRAW);
  lineSets[name] = { b, n: flat.length / 3 };
}

const flatMat = (m) => new Float32Array([m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]);
const transpose = (m) => [[m[0][0], m[1][0], m[2][0]], [m[0][1], m[1][1], m[2][1]], [m[0][2], m[1][2], m[2][2]]];
function common(prog, limit) {
  gl.useProgram(prog.p);
  const f = state.frame, d = state.display;
  gl.uniformMatrix3fv(prog.u.uJ2H, false, flatMat(f.matrix));
  gl.uniformMatrix3fv(prog.u.uH2V, false, flatMat(view.o));
  gl.uniformMatrix3fv(prog.u.uV2H, false, flatMat(transpose(view.o)));
  gl.uniform4f(prog.u.uScreen, view.w, view.h, view.scale, view.dpr);
  gl.uniform4f(prog.u.uStars, limit, d.starSize, view.dpr, d.atmosphere ? 1 : 0);
  gl.uniform1f(prog.u.uNight, d.night ? 1 : 0);
}
const limitingMagnitude = (brightness) => Math.min(13, state.display.limit + Math.max(0, 2.2 * Math.log10(60 / Math.max(state.fov, .5))) - 7 * Math.max(0, Math.min(1, brightness)));

function drawSky() {
  const f = state.frame, d = state.display, day = f.brightness;
  const limit = limitingMagnitude(day);
  gl.viewport(0, 0, $('sky').width, $('sky').height);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.disable(gl.BLEND);
  common(skyProg, limit);
  const sun = f.bodies.find((b) => b.id === 'body:sun').dir;
  gl.uniform4f(skyProg.u.uSun, sun[0], sun[1], sun[2], day);
  gl.uniform1f(skyProg.u.uAtmosphere, d.atmosphere ? 1 : 0);
  gl.uniformMatrix3fv(skyProg.u.uH2J, false, flatMat(transpose(f.matrix)));
  gl.uniform1i(skyProg.u.uMilky, 0);
  let a = skyProg.a('aPos');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const line = (name, color, frame) => {
    const s = lineSets[name];
    if (!s) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, s.b);
    common(lineProg, limit);
    gl.uniform1f(lineProg.u.uFrame, frame);
    gl.uniform4f(lineProg.u.uColor, ...color);
    const at = lineProg.a('aDir');
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, s.n);
  };
  if (d.altAz) line('horizonGrid', [.45, .55, .45, .28], 1);
  if (d.equatorial) line('equatorialGrid', [.4, .55, .75, .28], 0);
  if (d.boundaries) line('boundaries', [.45, .45, .6, .22], 0);
  if (d.lines) line('constellationLines', [.62, .72, .88, day > .6 ? .12 : .17], 0);

  if (stars.vertices) {
    const n = starsBrighterThan(limit);
    gl.bindBuffer(gl.ARRAY_BUFFER, stars.buffer);
    common(starProg, limit);
    gl.blendFunc(gl.ONE, gl.ONE);
    const set = (name, size, offset) => { const at = starProg.a(name); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, size, gl.FLOAT, false, 20, offset); };
    set('aDir', 3, 0); set('aMag', 1, 12); set('aBv', 1, 16);
    gl.drawArrays(gl.POINTS, 0, n);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
  if (d.horizon) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    common(groundProg, limit);
    gl.uniform1f(groundProg.u.uDay, day);
    gl.uniform1f(groundProg.u.uAlpha, .965);
    a = groundProg.a('aPos');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// ---- Overlay: bodies, markers and labels.
const ctx = $('overlay').getContext('2d');
const COLORS = { 'body:sun': [255, 242, 209], 'body:moon': [237, 235, 224], 'body:mercury': [199, 189, 179], 'body:venus': [250, 237, 204], 'body:mars': [242, 133, 82], 'body:jupiter': [240, 219, 184], 'body:saturn': [235, 209, 153], 'body:uranus': [166, 224, 230], 'body:neptune': [115, 153, 242] };
const nightColor = (c) => { const y = (c[0] + c[1] + c[2]) / 3; return [Math.max(120, y), y * .1, 0]; };
const rgba = (c, a = 1) => { const v = state.display.night ? nightColor(c) : c; return `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a})`; };

function drawBody(b) {
  const p = project(b.dir);
  if (!visible(p, 60)) return;
  const name = b.id, color = COLORS[name];
  const min = name === 'body:sun' || name === 'body:moon' ? 9 : Math.max(2.2, 4.4 - b.mag * .45);
  const r = Math.max(b.diameter / 2 * perDegree(), min), under = b.dir[2] < 0 && state.display.horizon ? .4 : 1;
  ctx.globalAlpha = under;
  const g = ctx.createRadialGradient(p.x, p.y, r * .5, p.x, p.y, r * 3.4);
  g.addColorStop(0, rgba(color, .4)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.4, 0, 7); ctx.fill();
  ctx.fillStyle = rgba(color);
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
  if (name === 'body:saturn') {
    ctx.strokeStyle = rgba(color, .75); ctx.lineWidth = Math.max(.75, r * .28);
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 2.05, r * .62, -.35, 0, 7); ctx.stroke();
  }
  if (name === 'body:moon') {
    // Shades the unlit part, with the terminator facing away from the Sun.
    const sun = state.frame.bodies.find((x) => x.id === 'body:sun');
    const s = project(sun.dir), angle = s ? Math.atan2(s.y - p.y, s.x - p.x) : 0;
    const k = Math.cos(b.phase * DEG);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(angle);
    ctx.fillStyle = 'rgba(8,12,20,.94)';
    ctx.beginPath(); ctx.arc(0, 0, r + .5, Math.PI / 2, Math.PI * 1.5, false);
    ctx.ellipse(0, 0, Math.abs(k) * r, r + .5, 0, Math.PI * 1.5, Math.PI / 2, k > 0);
    ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
}
const DSO_COLOR = { galaxy: [217, 179, 140], nebula: [140, 209, 191], planetaryNebula: [140, 209, 191], supernovaRemnant: [140, 209, 191], clusterNebula: [140, 209, 191] };

// Greedy placement, as LabelLayout.place does it.
let placed = [];
function layoutLabels() {
  const d = state.display, limit = { few: 12, normal: 24, many: 45 }[d.density], boxes = [], out = [], candidates = [];
  ctx.font = '12px -apple-system, "Segoe UI", sans-serif';
  for (const l of state.scene.labels) {
    if (state.fov > l.maxFov) continue;
    if ((l.style === 0 && !d.starNames) || (l.style === 1 && !d.planetNames) || (l.style === 2 && !d.conNames) || (l.style === 3 && !d.deepSky)) continue;
    const h = l.dir ? toHorizon(l.dir) : state.frame.bodies.find((b) => b.id === l.id)?.dir;
    // Names below the ground would only be clutter over a dark silhouette.
    if (!h || (d.horizon && h[2] < .012)) continue;
    const p = project(h);
    if (visible(p)) candidates.push({ l, p, w: ctx.measureText(l.text).width + (l.style === 2 ? l.text.length * 1.6 : 0) + 4 });
  }
  candidates.sort((a, b) => a.l.priority - b.l.priority);
  for (const c of candidates) {
    if (out.length >= limit) break;
    const offset = c.l.style === 2 ? -7 : 8;
    for (const y of [c.p.y + offset, c.p.y - offset - 14]) {
      const b = { x0: c.p.x - c.w / 2, x1: c.p.x + c.w / 2, y0: y, y1: y + 14 };
      if (b.x0 < 4 || b.x1 > view.w - 4 || b.y0 < 4 || b.y1 > view.h - 4) continue;
      if (boxes.some((o) => b.x0 < o.x1 && o.x0 < b.x1 && b.y0 < o.y1 && o.y0 < b.y1)) continue;
      boxes.push(b);
      out.push({ l: c.l, dy: y + 7 - c.p.y });
      break;
    }
  }
  placed = out;
}
function drawOverlay() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.w, view.h);
  const f = state.frame, d = state.display;
  if (d.deepSky && state.fov < 70) {
    ctx.lineWidth = 1;
    for (const o of state.scene.deepSky) {
      if (!o.named && o.mag > limitingMagnitude(0) + 3) continue;
      const p = project(toHorizon(o.dir));
      if (!visible(p, 20)) continue;
      ctx.strokeStyle = rgba(DSO_COLOR[o.type] ?? [153, 184, 235], .6);
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4.5, Math.min(o.size / 60 * perDegree() / 2, 90)), 0, 7); ctx.stroke();
    }
  }
  for (const b of f.bodies) drawBody(b);
  if (d.satellites) for (const s of f.satellites) {
    const p = project(s.dir);
    if (!visible(p)) continue;
    ctx.fillStyle = rgba([191, 242, 217]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill();
  }
  for (const t of state.tags) {
    const dir = t.kind === 'celestial' ? toHorizon(t.dir) : t.dir, p = project(dir);
    if (!visible(p)) continue;
    ctx.fillStyle = rgba([215, 189, 146]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, 7); ctx.fill();
    ctx.font = '11px -apple-system, "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.name, p.x, p.y - 9);
  }
  if (state.selectionDir) {
    const dir = state.selectionFrame === 'j2000' ? toHorizon(state.selectionDir) : state.selectionDir, p = project(dir);
    if (visible(p, 30)) {
      ctx.strokeStyle = rgba([215, 189, 146]); ctx.lineWidth = 1.25;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(p.x, p.y, 22, i * Math.PI / 2 + .3, (i + 1) * Math.PI / 2 - .3); ctx.stroke(); }
    }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const { l, dy } of placed) {
    const h = l.dir ? toHorizon(l.dir) : f.bodies.find((b) => b.id === l.id)?.dir;
    const p = h && project(h);
    if (!p) continue;
    const base = [[205, 214, 230, .72], [244, 236, 214, .96], [128, 152, 188, .5], [160, 200, 190, .66]][l.style] ?? [205, 214, 230, .72];
    ctx.font = l.style === 1 ? '500 12.5px Inter, -apple-system, "Segoe UI", sans-serif' : l.style === 2 ? '500 9.5px Inter, -apple-system, "Segoe UI", sans-serif' : '11px Inter, -apple-system, "Segoe UI", sans-serif';
    ctx.letterSpacing = l.style === 2 ? '2.4px' : '0px';
    ctx.fillStyle = rgba(base, base[3]);
    ctx.fillText(l.text, p.x, p.y + dy);
  }
  ctx.letterSpacing = '0px';
  if (d.horizon) {
    ctx.font = '500 11px Inter, -apple-system, "Segoe UI", sans-serif'; ctx.fillStyle = rgba([215, 189, 146], .8);
    for (const c of state.scene.compass) { const p = project(c.dir); if (visible(p)) ctx.fillText(c.text, p.x, p.y + 16); }
  }
}

// ---- Frame loop. The engine answers asynchronously, so the sky never waits on it.
let requestInFlight = false, lastRequest = 0, forceFrame = true, lastLabels = 0;
const needFrame = () => { forceFrame = true; };
async function fetchFrame() {
  requestInFlight = true;
  try { state.frame = await api('frame'); } catch (e) { console.error(e); }
  requestInFlight = false;
  document.getElementById('loading').classList.add('gone');
}
let fly = null;
function loop(now) {
  requestAnimationFrame(loop);
  if (!state.place) state.az = (state.az + .012) % 360;
  const interval = Math.abs(state.clock.rate) > 1 ? 30 : 1000;
  if (!requestInFlight && (forceFrame || now - lastRequest > interval) && stars.count) {
    forceFrame = false; lastRequest = now; fetchFrame(); rebuildStars();
  }
  if (!state.frame) return;
  if (fly) {
    const t = Math.min(1, (now - fly.start) / fly.ms), e = t * t * t * (t * (t * 6 - 15) + 10);
    state.az = (fly.az + fly.dAz * e + 360) % 360; state.alt = fly.alt + (fly.alt1 - fly.alt) * e;
    state.fov = Math.exp(Math.log(fly.fov) + (Math.log(fly.fov1) - Math.log(fly.fov)) * e);
    if (t === 1) fly = null;
  }
  updateCamera();
  if (now - lastLabels > 125) { lastLabels = now; layoutLabels(); updateChrome(); }
  drawSky();
  drawOverlay();
}
function flyTo(dir, fov) {
  const t = toAzAlt(dir), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dAz = ((t.az - state.az + 540) % 360) - 180, alt1 = Math.max(-89.9, Math.min(89.9, t.alt));
  fly = { start: performance.now(), ms: reduce ? 1 : 1000, az: state.az, dAz, alt: state.alt, alt1, fov: state.fov, fov1: fov ?? state.fov };
}

function resize() {
  const c = $('sky'), o = $('overlay');
  view.w = innerWidth; view.h = innerHeight; view.dpr = Math.min(devicePixelRatio || 1, 3);
  for (const x of [c, o]) { x.width = view.w * view.dpr; x.height = view.h * view.dpr; }
  lastLabels = 0;
}
addEventListener('resize', resize);

// ---- Chrome
const zoneOf = () => state.place?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
const fmt = (ms, o) => { try { return new Intl.DateTimeFormat(undefined, { timeZone: zoneOf(), ...o }).format(ms); } catch { return new Date(ms).toLocaleString(); } };
const fmtTime = (s) => (s == null ? null : fmt(s * 1000, { hour: 'numeric', minute: '2-digit' }));
const fmtDate = (s) => fmt(s * 1000, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
function updateChrome() {
  const live = isLive(), t = skyTime();
  $('placeName').textContent = state.place?.name ?? '';
  $('clockText').textContent = fmt(t, live ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  $('clockText').classList.toggle('sim', !live);
  const h = toAzAlt(horizontal(state.az, state.alt));
  $('heading').textContent = `${compassName(h.az)} ${Math.round(h.az)}°  ·  ${Math.round(h.alt)}°`;
  if (sheet.tick) sheet.tick();
}
function applyTheme() { document.documentElement.dataset.night = state.display.night ? '1' : '0'; }

// Selection card
let cardTimer;
async function refreshCard() {
  clearTimeout(cardTimer);
  if (!state.selection) { $('card').hidden = true; return; }
  try {
    const o = await api('object', { oid: state.selection, imperial: state.imperial });
    $('cardTitle').textContent = o.name;
    $('cardText').textContent = o.explanation;
    $('card').hidden = false;
    state.selectionDir = o.dir ?? null;
    state.selectionFrame = 'horizon';
  } catch { $('card').hidden = true; }
  // A selection has to keep up with a time-lapse, not just the real clock.
  cardTimer = setTimeout(refreshCard, state.clock.rate === 1 ? 5000 : 400);
}
function select(id) { state.selection = id; state.selectionDir = null; refreshCard(); }
async function find(id) {
  closeSheet();
  state.selection = id;
  const o = await api('object', { oid: id, imperial: state.imperial });
  if (o.dir) flyTo(o.dir, Math.min(state.fov, o.type === 'constellation' ? 60 : ['sun', 'moon', 'planet'].includes(o.type) ? 30 : 40));
  state.recents = [id, ...state.recents.filter((x) => x !== id)].slice(0, 12);
  store.set('recents', state.recents);
  refreshCard();
}

// ---- Sheets
const sheet = { stack: [], tick: null };
function showSheet(title, render, { short = false, push = false } = {}) {
  if (!push) sheet.stack = [];
  sheet.stack.push({ title, render, short });
  paintSheet();
}
function paintSheet() {
  const top = sheet.stack[sheet.stack.length - 1];
  sheet.tick = null;
  $('sheet').hidden = false;
  $('sheet').classList.toggle('short', !!top.short);
  $('sheetTitle').textContent = top.title;
  $('sheetBack').hidden = sheet.stack.length < 2;
  $('sheetBody').scrollTop = 0;
  $('sheetBody').innerHTML = '';
  top.render($('sheetBody'));
}
function closeSheet() { sheet.stack = []; sheet.tick = null; $('sheet').hidden = true; }
$('sheetClose').onclick = closeSheet;
$('sheetBack').onclick = () => { sheet.stack.pop(); paintSheet(); };

const ICON = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10Z"/>',
  planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-20 12 12)"/>',
  star: '<path d="M12 4c.6 5 2.9 7.3 8 8-5.1.7-7.4 3-8 8-.6-5-2.9-7.300-8-8 5.100-.7 7.400-3 8-8Z"/>',
  constellation: '<circle cx="5" cy="7" r="1.300"/><circle cx="12" cy="11" r="1.300"/><circle cx="19" cy="6" r="1.300"/><circle cx="15" cy="19" r="1.300"/><path d="m6 7.700 5 2.600M13.100 10.300 18 6.800M12.700 12.100l1.900 5.700"/>',
  galaxy: '<path d="M12 12c0-3 3-4 5-2.500 2.500 2 1.500 7-3 8.500-5 1.500-10-2-9.500-7.500C5 5.500 10 3 14 4.500"/>',
  satellite: '<path d="m13 11 4-4 3 3-4 4zM4 13l3-3 4 4-3 3zM9 12l3-3 3 3-3 3zM8 21a5 5 0 0 0-5-5"/>',
  cluster: '<circle cx="8" cy="9" r="1.100"/><circle cx="14" cy="6.500" r="1.100"/><circle cx="16" cy="13" r="1.100"/><circle cx="10" cy="15" r="1.100"/><circle cx="17.500" cy="18" r=".8"/><circle cx="5.500" cy="17" r=".8"/>',
  nebula: '<path d="M7 17a4 4 0 0 1-.6-7.950A5.500 5.500 0 0 1 17 8.500a4.300 4.300 0 0 1 0 8.500Z"/>',
};
const iconFor = (type) => ({ openCluster: ICON.cluster, globularCluster: ICON.cluster, starCloud: ICON.cluster, asterism: ICON.cluster, doubleStar: ICON.star, nebula: ICON.nebula, planetaryNebula: ICON.nebula, supernovaRemnant: ICON.nebula, clusterNebula: ICON.nebula }[type] ?? ICON[type] ?? ICON.star);

// Illustrations for the detail page, drawn in code from each object's real properties,
// so nothing here depends on licensed imagery.
function drawHero(canvas, o) {
  const dpr = Math.min(devicePixelRatio || 1, 3), w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const c = canvas.getContext('2d');
  c.scale(dpr, dpr);
  const cx = w / 2, cy = h / 2, R = Math.min(h * .34, 92);
  const seed = [...o.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
  let n = seed;
  const rnd = () => { n = (n * 1597 + 51749) % 244944; return n / 244944; };
  for (let i = 0; i < 170; i++) {
    c.fillStyle = `rgba(214,224,240,${.08 + rnd() * .5})`;
    const s = rnd() * 1.1 + .25;
    c.beginPath(); c.arc(rnd() * w, rnd() * h, s, 0, 7); c.fill();
  }
  const sphere = (r, stops) => {
    const g = c.createRadialGradient(cx - r * .38, cy - r * .42, r * .08, cx, cy, r * 1.08);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  };
  const glow = (r, rgb, a) => {
    const g = c.createRadialGradient(cx, cy, r * .2, cx, cy, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  };
  const bands = (r, cols, tilt) => {
    c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 7); c.clip(); c.translate(cx, cy); c.rotate(tilt);
    cols.forEach(([y, t, col]) => { c.fillStyle = col; c.fillRect(-r, y * r, r * 2, t * r); });
    c.restore();
  };
  const shade = (r) => {
    const g = c.createRadialGradient(cx - r * .4, cy - r * .4, r * .3, cx, cy, r * 1.04);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.72, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,3,10,.9)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  };
  const name = o.id.split(':')[1];
  const planets = {
    mercury: [['#c9c2b8', 0], ['#7d756c', .6], ['#3a342e', 1]], venus: [['#fff1cf', 0], ['#e0bd84', .6], ['#7b5a30', 1]],
    mars: [['#f0a070', 0], ['#bd5a33', .6], ['#5a2412', 1]], jupiter: [['#f4e3c6', 0], ['#cfa97e', .6], ['#6e5238', 1]],
    saturn: [['#f6e6bf', 0], ['#d3b67f', .6], ['#6d5a38', 1]], uranus: [['#d6f6f6', 0], ['#8fd0d6', .6], ['#3b6d76', 1]],
    neptune: [['#9fc0ff', 0], ['#3f6ee0', .6], ['#142a70', 1]],
  };
  if (o.type === 'sun') {
    glow(R * 2.6, '255,214,140', .55); sphere(R, [[0, '#fffbe8'], [.6, '#ffe39a'], [1, '#f6a53c']]);
  } else if (o.type === 'moon') {
    sphere(R, [[0, '#ecebe3'], [.7, '#b9b7ad'], [1, '#6f6d66']]);
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
    for (let i = 0; i < 26; i++) {
      c.fillStyle = `rgba(70,72,80,${.06 + rnd() * .16})`;
      c.beginPath(); c.arc(cx + (rnd() - .5) * R * 1.9, cy + (rnd() - .5) * R * 1.9, R * (.05 + rnd() * .24), 0, 7); c.fill();
    }
    // The real phase: dark limb and terminator from the current illuminated fraction.
    const illum = parseFloat((o.properties.find((p) => p[0] === 'Illuminated') ?? ['', '100'])[1]) / 100;
    const k = 1 - 2 * illum;
    c.fillStyle = 'rgba(4,7,14,.96)';
    c.beginPath(); c.arc(cx, cy, R + 1, Math.PI / 2, Math.PI * 1.5);
    c.ellipse(cx, cy, Math.abs(k) * R, R + 1, 0, Math.PI * 1.5, Math.PI / 2, k > 0);
    c.fill(); c.restore();
  } else if (planets[name]) {
    const r = name === 'saturn' ? R * .72 : R;
    if (name === 'saturn') {
      c.save(); c.translate(cx, cy); c.rotate(-.3); c.strokeStyle = 'rgba(222,200,150,.62)'; c.lineWidth = r * .26;
      c.beginPath(); c.ellipse(0, 0, r * 1.75, r * .52, 0, Math.PI, 0); c.stroke(); c.restore();
    }
    sphere(r, planets[name].map(([col, p]) => [p, col]));
    if (name === 'jupiter') bands(r, [[-.62, .12, 'rgba(120,80,50,.34)'], [-.26, .2, 'rgba(150,96,62,.42)'], [.14, .16, 'rgba(120,76,48,.4)'], [.5, .1, 'rgba(120,84,60,.3)']], -.05);
    if (name === 'saturn') bands(r, [[-.5, .14, 'rgba(150,120,70,.28)'], [.02, .2, 'rgba(170,135,80,.28)']], -.3);
    shade(r);
    if (name === 'saturn') {
      c.save(); c.translate(cx, cy); c.rotate(-.3); c.strokeStyle = 'rgba(232,212,165,.8)'; c.lineWidth = r * .26;
      c.beginPath(); c.ellipse(0, 0, r * 1.75, r * .52, 0, 0, Math.PI); c.stroke(); c.restore();
    }
  } else if (o.type === 'star') {
    const t = parseFloat((o.properties.find((p) => p[0] === 'Temperature') ?? ['', '6000'])[1]);
    const rgb = t > 9000 ? '165,195,255' : t > 6500 ? '225,232,255' : t > 5000 ? '255,236,195' : t > 3900 ? '255,196,130' : '255,150,95';
    glow(R * 2.4, rgb, .5); glow(R * .9, rgb, .9); glow(R * .32, '255,255,255', 1);
    c.strokeStyle = `rgba(${rgb},.3)`; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx - R * 2, cy); c.lineTo(cx + R * 2, cy); c.moveTo(cx, cy - R * 2); c.lineTo(cx, cy + R * 2); c.stroke();
  } else if (o.type === 'galaxy') {
    c.save(); c.translate(cx, cy); c.rotate(-.5); c.scale(1, .5); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2600; i++) {
      const arm = i % 2 ? 0 : Math.PI, s = rnd(), a = arm + s * 8.5 + (rnd() - .5) * .6, r = s * R * 1.5;
      c.fillStyle = `rgba(${s < .25 ? '255,225,185' : '170,195,255'},${.05 + rnd() * .22})`;
      c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, rnd() * 1.3 + .3, 0, 7); c.fill();
    }
    c.restore(); glow(R * .7, '255,228,190', .8);
  } else if (['openCluster', 'globularCluster', 'starCloud', 'asterism', 'doubleStar'].includes(o.type)) {
    c.globalCompositeOperation = 'lighter';
    const tight = o.type === 'globularCluster';
    for (let i = 0; i < (tight ? 900 : 90); i++) {
      const a = rnd() * 6.3, r = Math.pow(rnd(), tight ? 2.2 : 1) * R * (tight ? 1.3 : 1.2), s = rnd() * (tight ? 1 : 2) + .4;
      c.fillStyle = `rgba(${rnd() > .7 ? '255,226,190' : '190,212,255'},${.3 + rnd() * .6})`;
      c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, s, 0, 7); c.fill();
    }
  } else if (['nebula', 'planetaryNebula', 'supernovaRemnant', 'clusterNebula'].includes(o.type)) {
    c.globalCompositeOperation = 'lighter';
    const ring = o.type === 'planetaryNebula';
    for (let i = 0; i < 70; i++) {
      const a = rnd() * 6.3, r = ring ? R * (.62 + rnd() * .22) : rnd() * R * 1.15, s = R * (.16 + rnd() * .34);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .8, col = rnd() > .5 ? '226,90,120' : '84,170,190';
      const g = c.createRadialGradient(x, y, 0, x, y, s);
      g.addColorStop(0, `rgba(${col},.2)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(x - s, y - s, s * 2, s * 2);
    }
  } else {
    glow(R * 1.5, '200,214,240', .22);
  }
}

function objectRow(o, onClick) {
  const b = document.createElement('button');
  b.className = 'row';
  b.innerHTML = `<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">${iconFor(o.type)}</svg><span class="main"><span class="name">${esc(o.name)}</span><span class="sub">${esc(o.subtitle ?? o.typeName)}</span></span>${o.trail ? `<span class="trail">${esc(o.trail)}</span>` : ''}`;
  b.onclick = onClick ?? (() => openDetail(o.id));
  return b;
}
const openDetail = (id) => showSheet('', (el) => renderDetail(el, id), { push: sheet.stack.length > 0 });
const dataRows = (rows) => `<div class="ruled">${rows.map(([a, b]) => `<div class="dataRow"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`;

async function renderDetail(el, id) {
  el.innerHTML = '<p class="quiet">Calculating…</p>';
  let o;
  try { o = await api('object', { oid: id, imperial: state.imperial }); } catch { el.innerHTML = '<p>Not available.</p>'; return; }
  const live = [];
  if (o.altitude) live.push(['Altitude', o.altitude], ['Azimuth', o.azimuth]);
  if (o.nextRise) live.push(['Next rise', fmtDate(o.nextRise)]);
  const rs = o.riseSet;
  if (rs) {
    if (rs.circumstance === 'alwaysUp') live.push(['Today', 'Stays above the horizon']);
    else if (rs.circumstance === 'alwaysDown') live.push(['Today', 'Stays below the horizon']);
    else {
      if (rs.rise) live.push(['Rises', fmtTime(rs.rise)]);
      if (rs.transit) live.push(['Highest', fmtTime(rs.transit)]);
      if (rs.set) live.push(['Sets', fmtTime(rs.set)]);
    }
  }
  const isFav = () => state.favorites.some((f) => f.id === id);
  el.innerHTML = `
    <canvas class="hero" id="hero" aria-hidden="true"></canvas>
    <div class="eyebrow">${esc(o.typeName)}</div>
    <div class="objectTitle">${esc(o.name)}</div>
    ${o.designations.length ? `<p class="quiet">${esc(o.designations.join('  ·  '))}</p>` : ''}
    <p>${esc(o.summary)}</p>
    <div class="actions"><button class="primary" id="dFind">Find in Sky</button><button class="square" id="dFav" aria-label="Favorite">★</button></div>
    <h2>Right Now</h2><p>${esc(o.explanation)}</p>${live.length ? dataRows(live) : ''}
    <h2>Properties</h2>${dataRows(o.properties)}
    ${o.observing ? `<h2>Observing</h2><p>${esc(o.observing)}</p>` : ''}
    ${o.learn ? `<h2>Learn</h2><p>${esc(o.learn)}</p>` : ''}`;
  drawHero(el.querySelector('#hero'), o);
  const fav = el.querySelector('#dFav');
  fav.classList.toggle('on', isFav());
  fav.onclick = () => {
    state.favorites = isFav() ? state.favorites.filter((f) => f.id !== id) : [...state.favorites, { id, name: o.name, type: o.type, typeName: o.typeName }];
    store.set('favorites', state.favorites);
    fav.classList.toggle('on', isFav());
  };
  el.querySelector('#dFind').onclick = () => find(id);
}

const CATEGORIES = [['planets', 'Planets', 'Where each one is now'], ['moon', 'The Moon', 'Phase and position'], ['constellations', 'Constellations', 'All 88'], ['brightStars', 'Bright Stars', 'The named stars'], ['deepSky', 'Deep Sky', 'Galaxies, nebulae and clusters'], ['satellites', 'Satellites', 'ISS and other bright satellites']];
function renderExplore(el) {
  el.innerHTML = '<input class="field" id="q" placeholder="Star, planet, M31, NGC 7000…" autocomplete="off" autocapitalize="off" spellcheck="false"><div id="results"></div>';
  const results = el.querySelector('#results'), q = el.querySelector('#q');
  const browse = async () => {
    results.innerHTML = '';
    if (state.recents.length) {
      results.insertAdjacentHTML('beforeend', '<div class="groupTitle">Recent</div>');
      for (const id of state.recents.slice(0, 5)) {
        try { const o = await api('object', { oid: id }); if (!q.value) results.append(objectRow(o)); } catch { /* removed object */ }
      }
    }
    results.insertAdjacentHTML('beforeend', '<div class="groupTitle">Browse</div>');
    for (const [key, title, sub] of CATEGORIES) {
      results.append(objectRow({ name: title, subtitle: sub, type: key === 'moon' ? 'moon' : key === 'planets' ? 'planet' : key === 'satellites' ? 'satellite' : 'star' }, () => showSheet(title, async (body) => {
        body.innerHTML = '<p class="quiet">Calculating…</p>';
        const { rows } = await api('list', { category: key });
        body.innerHTML = rows.length ? '' : '<p>No orbit data is available right now.</p>';
        rows.forEach((r) => body.append(objectRow({ ...r, trail: r.magnitude != null ? r.magnitude.toFixed(1) : '' })));
      }, { push: true })));
    }
  };
  let seq = 0;
  q.oninput = async () => {
    const text = q.value.trim(), mine = ++seq;
    if (!text) { browse(); return; }
    const { results: rows } = await api('search', { q: text, noLocation: true });
    if (mine !== seq) return;
    results.innerHTML = rows.length ? '' : '<p style="margin-top:16px">No matches. Try Vega, M42, NGC 7000 or HIP 91262.</p>';
    let group = '';
    for (const r of rows) {
      if (r.category !== group) { group = r.category; results.insertAdjacentHTML('beforeend', `<div class="groupTitle">${esc(group)}</div>`); }
      results.append(objectRow(r));
    }
  };
  browse();
  q.focus({ preventScroll: true });
}

async function renderTonight(el) {
  el.innerHTML = '<p class="quiet">Calculating tonight…</p>';
  let p;
  try { p = await api('tonight', { tz: state.place.tz || zoneOf(), equipment: state.equipment, experience: state.experience }); } catch (e) { el.innerHTML = `<p>Tonight couldn't be calculated.</p>`; return; }
  const dark = [['Sunset', p.sunset], ['Civil twilight ends', p.civilDusk], ['Nautical twilight ends', p.nauticalDusk], ['Astronomical night begins', p.astroDusk], ['Astronomical night ends', p.astroDawn], ['Sunrise', p.sunrise]].filter((r) => r[1] != null).map(([a, b]) => [a, fmtTime(b)]);
  const note = { polarDay: 'The Sun stays up all night at this time of year.', polarNight: 'The Sun stays down all day.', noAstronomicalDarkness: 'The sky never gets fully dark tonight.' }[p.condition];
  const moon = [['Phase', p.moonPhase], ['Illuminated', `${Math.round(p.moonIllumination * 100)}%`]];
  if (p.moonRise != null) moon.push(['Rises', fmtTime(p.moonRise)]);
  if (p.moonSet != null) moon.push(['Sets', fmtTime(p.moonSet)]);
  moon.push(['Moon-free darkness', `${Math.round(p.moonless * 100)}% of tonight`]);
  let clouds = '<p>The forecast couldn\'t be loaded. Astronomy is unaffected.</p>';
  if (p.cloud != null) {
    const rows = [['Tonight', `${p.cloudWords}, about ${Math.round(p.cloud)}% cloud`], ...p.windows.map((w) => ['Clearer window', `${fmtTime(w[0])} – ${fmtTime(w[1])}`])];
    clouds = `${dataRows(rows)}<p class="quiet" style="margin-top:6px">${esc(p.attribution)}</p>`;
  } else if (p.weatherAvailable) clouds = '<p>The forecast doesn\'t reach this date yet.</p>';
  el.innerHTML = `<p class="quiet">${esc(state.place.name)} · ${esc(fmt(skyTime(), { weekday: 'long', month: 'long', day: 'numeric' }))}</p>
    <h2>Darkness</h2>${note ? `<p>${note}</p>` : ''}${dataRows(dark)}<h2>Moon</h2>${dataRows(moon)}<h2>Clouds</h2>${clouds}<h2>Worth Seeing</h2><div id="recs"></div>`;
  const recs = el.querySelector('#recs');
  if (!p.recommendations.length) recs.innerHTML = '<p>Nothing suitable tonight, because the sky doesn\'t get dark enough.</p>';
  for (const r of p.recommendations) {
    const b = document.createElement('button');
    b.className = 'rec';
    b.innerHTML = `<span class="name">${esc(r.name)}</span><small>Best around ${fmtTime(r.bestTime)}, ${Math.round(r.maxAltitude)}° high in the ${esc(r.direction)}</small>${r.reasons.slice(1).map((x) => `<small class="why">✓ ${esc(x)}</small>`).join('')}${r.cautions.map((x) => `<small class="caution">⚠ ${esc(x)}</small>`).join('')}`;
    b.onclick = () => openDetail(r.id);
    recs.append(b);
  }
}

async function renderEvents(el) {
  el.innerHTML = '<p class="quiet">Working through the coming year…</p>';
  let events;
  try { ({ events } = await api('events', { days: 365 })); } catch { el.innerHTML = '<p>Events couldn\'t be calculated for this date.</p>'; return; }
  let filter = null;
  const kinds = [...new Map(events.map((e) => [e.kind, e.kindName]))];
  const paint = () => {
    el.innerHTML = `<div class="chips"><button class="pill ${filter ? '' : 'on'}" data-k="">All</button>${kinds.map(([k, n]) => `<button class="pill ${filter === k ? 'on' : ''}" data-k="${k}">${esc(n)}</button>`).join('')}</div><div id="list"></div>`;
    el.querySelectorAll('.pill').forEach((b) => { b.onclick = () => { filter = b.dataset.k || null; paint(); }; });
    const list = el.querySelector('#list');
    let month = '';
    for (const e of events.filter((x) => !filter || x.kind === filter)) {
      const m = fmt(e.date * 1000, { month: 'long', year: 'numeric' });
      if (m !== month) { month = m; list.insertAdjacentHTML('beforeend', `<div class="groupTitle">${esc(m)}</div>`); }
      const b = document.createElement('button');
      b.className = 'row';
      b.innerHTML = `<span class="main"><span class="name" style="${e.hidden ? 'color:var(--secondary)' : ''}">${esc(e.title)}</span><span class="sub">${esc(fmtDate(e.date))}${e.hidden ? ' · Not visible from here' : ''}</span></span>`;
      b.onclick = () => showSheet(e.title, (body) => {
        const rows = [['Date', fmtDate(e.date)]];
        if (e.end) rows.push(['Ends', fmtTime(e.end)]);
        body.innerHTML = `<div class="eyebrow">${esc(e.kindName)}</div><p style="margin-top:8px">${esc(e.detail)}</p>${dataRows(rows)}${e.visible ? `<p style="margin-top:10px;color:var(--primary)">${esc(e.visible)}</p>` : ''}${e.hidden ? `<p style="margin-top:10px">${esc(e.hidden)}</p>` : ''}<p class="quiet">${esc(e.source)}</p>${e.related[0] ? '<button class="primary" id="eFind">Find in Sky</button>' : ''}`;
        const go = body.querySelector('#eFind');
        if (go) go.onclick = () => find(e.related[0]);
      }, { push: true });
      list.append(b);
    }
  };
  paint();
}

function renderTime(el) {
  el.innerHTML = `<p class="quiet" id="tDate"></p><div class="bigTime" id="tClock"></div>
    <div class="slider"><input type="range" id="tScrub" min="-12" max="12" step=".05" value="0" aria-label="Scrub time by hours"><label class="data"><span>−12 h</span><span>+12 h</span></label></div>
    <div class="steps"><button data-s="-86400" aria-label="Back 1 day">«</button><button data-s="-3600" aria-label="Back 1 hour">‹</button><button id="tPause" aria-label="Pause"></button><button data-s="3600" aria-label="Forward 1 hour">›</button><button data-s="86400" aria-label="Forward 1 day">»</button></div>
    <div class="chips" id="tRates"></div>
    <div class="slider"><label for="tPick">Go to date (this browser's time zone)</label><input class="field" id="tPick" type="datetime-local"></div>
    <button class="secondary" id="tNow">Return to Now</button>
    <p class="quiet">Dates from 1800 to 2199 are supported, the range checked against NASA JPL data.</p>`;
  const rates = [['Real time', 1], ['1 min/s', 60], ['10 min/s', 600], ['1 hr/s', 3600], ['1 day/s', 86400], ['−1 hr/s', -3600]];
  const rateBox = el.querySelector('#tRates');
  rates.forEach(([n, r]) => { const b = document.createElement('button'); b.className = 'pill'; b.textContent = n; b.dataset.r = r; b.onclick = () => setClock(skyTime(), r); rateBox.append(b); });
  el.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => setClock(skyTime() + b.dataset.s * 1000); });
  el.querySelector('#tPause').onclick = () => setClock(skyTime(), state.clock.rate === 0 ? 1 : 0);
  el.querySelector('#tNow').onclick = () => setClock(Date.now(), 1);
  const pick = el.querySelector('#tPick');
  pick.onchange = () => { if (pick.value) setClock(new Date(pick.value).getTime()); };
  const scrub = el.querySelector('#tScrub');
  let last = 0;
  scrub.oninput = () => { const v = +scrub.value; setClock(skyTime() + (v - last) * 3600e3); last = v; };
  scrub.onchange = () => { scrub.value = 0; last = 0; };
  sheet.tick = () => {
    const t = skyTime();
    el.querySelector('#tDate').textContent = fmt(t, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const c = el.querySelector('#tClock');
    c.textContent = fmt(t, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    c.classList.toggle('sim', !isLive());
    el.querySelector('#tPause').textContent = state.clock.rate === 0 ? '▶' : '❚❚';
    rateBox.querySelectorAll('.pill').forEach((b) => b.classList.toggle('on', +b.dataset.r === state.clock.rate));
    el.querySelector('#tNow').disabled = isLive();
  };
  sheet.tick();
}

function toggle(label, key) {
  const row = document.createElement('label');
  row.className = 'toggle';
  row.innerHTML = `<span>${label}</span><input type="checkbox" role="switch" ${state.display[key] ? 'checked' : ''}>`;
  row.querySelector('input').onchange = (e) => setDisplay(key, e.target.checked);
  return row;
}
function setDisplay(key, value) { state.display[key] = value; store.set('display', state.display); applyTheme(); lastLabels = 0; }
function slider(label, key, min, max, step, show) {
  const row = document.createElement('div');
  row.className = 'slider';
  row.innerHTML = `<label><span>${label}</span><span class="data">${show(state.display[key])}</span></label><input type="range" min="${min}" max="${max}" step="${step}" value="${state.display[key]}" aria-label="${label}">`;
  row.querySelector('input').oninput = (e) => { setDisplay(key, +e.target.value); row.querySelector('.data').textContent = show(+e.target.value); };
  return row;
}
function renderAppearance(el) {
  el.append(toggle('Night Vision', 'night'));
  const group = (t) => el.insertAdjacentHTML('beforeend', `<h2>${t}</h2>`);
  group('Constellations');
  el.append(toggle('Figures', 'lines'), toggle('Boundaries', 'boundaries'), toggle('Names', 'conNames'));
  group('Layers');
  el.append(toggle('Star names', 'starNames'), toggle('Planet names', 'planetNames'), toggle('Deep-sky objects', 'deepSky'), toggle('Satellites', 'satellites'), toggle('Horizon and ground', 'horizon'), toggle('Atmosphere', 'atmosphere'), toggle('Altitude–azimuth grid', 'altAz'), toggle('Equatorial grid', 'equatorial'));
  group('Stars');
  el.append(slider('Star size', 'starSize', .6, 1.6, .05, (v) => `${v.toFixed(2)}×`), slider('Faintest stars', 'limit', 3, 12, .1, (v) => `magnitude ${v.toFixed(1)}`));
  const chips = document.createElement('div');
  chips.className = 'chips';
  for (const [k, n] of [['few', 'Few labels'], ['normal', 'Normal'], ['many', 'Many']]) {
    const b = document.createElement('button');
    b.className = `pill ${state.display.density === k ? 'on' : ''}`;
    b.textContent = n;
    b.onclick = () => { setDisplay('density', k); chips.querySelectorAll('.pill').forEach((x) => x.classList.remove('on')); b.classList.add('on'); };
    chips.append(b);
  }
  el.append(chips);
}

function renderFavorites(el) {
  if (!state.favorites.length && !state.tags.length) { el.innerHTML = '<p>Nothing saved yet. Star an object to keep it here, or press and hold on the sky to leave a Sky Tag.</p>'; return; }
  el.innerHTML = '<input class="field" id="fq" placeholder="Search saved objects"><div id="fl"></div>';
  const list = el.querySelector('#fl');
  const paint = () => {
    const q = el.querySelector('#fq').value.toLowerCase();
    list.innerHTML = '';
    const favs = state.favorites.filter((f) => f.name.toLowerCase().includes(q));
    const tags = state.tags.filter((t) => t.name.toLowerCase().includes(q));
    if (favs.length) list.insertAdjacentHTML('beforeend', '<div class="groupTitle">Objects</div>');
    favs.forEach((f) => list.append(objectRow(f)));
    if (tags.length) list.insertAdjacentHTML('beforeend', '<div class="groupTitle">Sky Tags</div>');
    for (const t of tags) {
      const row = objectRow({ name: t.name, subtitle: t.kind === 'celestial' ? 'Fixed among the stars' : 'Fixed to your horizon', type: 'star', trail: 'Delete' }, () => {
        state.tags = state.tags.filter((x) => x !== t); store.set('tags', state.tags); paint();
      });
      list.append(row);
    }
  };
  el.querySelector('#fq').oninput = paint;
  paint();
}

function setPlace(place) {
  state.place = place;
  store.set('place', place);
  state.frame = null; needFrame();
  $('welcome').hidden = true;
  refreshCard();
}
function locate(onFail) {
  if (!navigator.geolocation) { onFail?.(); return; }
  navigator.geolocation.getCurrentPosition(
    (p) => setPlace({ name: 'Current Location', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    () => onFail?.(), { timeout: 10000, maximumAge: 600000 });
}
function renderPlaces(el) {
  el.innerHTML = `<button class="primary" id="pHere" style="margin-top:0">Use Current Location</button><p class="warn" id="pErr" hidden style="margin-top:8px">Your location isn't available. Pick a place below instead.</p><div class="groupTitle">Places</div><div id="pList"></div><h2>Coordinates</h2><div class="actions"><input class="field" id="pLat" placeholder="Latitude" inputmode="decimal"><input class="field" id="pLon" placeholder="Longitude" inputmode="decimal"></div><button class="secondary" id="pUse">Use These Coordinates</button>`;
  el.querySelector('#pHere').onclick = () => locate(() => { el.querySelector('#pErr').hidden = false; });
  const list = el.querySelector('#pList');
  for (const [name, lat, lon, tz] of CITIES) list.append(objectRow({ name, subtitle: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, type: 'star' }, () => { setPlace({ name, lat, lon, tz }); closeSheet(); }));
  el.querySelector('#pUse').onclick = () => {
    const lat = parseFloat(el.querySelector('#pLat').value), lon = parseFloat(el.querySelector('#pLon').value);
    if (!(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) { el.querySelector('#pErr').hidden = false; return; }
    setPlace({ name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, lat, lon, tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
    closeSheet();
  };
}
function renderSettings(el) {
  el.innerHTML = '<div class="groupTitle">Location</div>';
  el.append(objectRow({ name: 'Observing From', subtitle: state.place?.name, type: 'star' }, () => showSheet('Location', renderPlaces, { push: true })));
  el.insertAdjacentHTML('beforeend', '<div class="groupTitle">Experience</div>');
  const exp = document.createElement('div');
  exp.className = 'chips';
  for (const [k, n] of [['beginner', 'Beginner'], ['enthusiast', 'Enthusiast']]) {
    const b = document.createElement('button');
    b.className = `pill ${state.experience === k ? 'on' : ''}`;
    b.textContent = n;
    b.onclick = () => { state.experience = k; store.set('experience', k); exp.querySelectorAll('.pill').forEach((x) => x.classList.remove('on')); b.classList.add('on'); };
    exp.append(b);
  }
  el.append(exp);
  el.insertAdjacentHTML('beforeend', '<div class="groupTitle">Equipment</div>');
  for (const [k, n] of [['nakedEye', 'Naked eye'], ['binoculars', 'Binoculars'], ['telescope', 'Telescope'], ['photography', 'Photography']]) {
    const row = document.createElement('label');
    row.className = 'toggle';
    row.innerHTML = `<span>${n}</span><input type="checkbox" role="switch" ${state.equipment.includes(k) ? 'checked' : ''}>`;
    row.querySelector('input').onchange = (e) => { state.equipment = e.target.checked ? [...state.equipment, k] : state.equipment.filter((x) => x !== k); store.set('equipment', state.equipment); };
    el.append(row);
  }
  const units = document.createElement('label');
  units.className = 'toggle';
  units.innerHTML = `<span>Imperial units</span><input type="checkbox" role="switch" ${state.imperial ? 'checked' : ''}>`;
  units.querySelector('input').onchange = (e) => { state.imperial = e.target.checked; store.set('imperial', state.imperial); };
  el.append(units);
  el.insertAdjacentHTML('beforeend', `<h2>Data Sources</h2>${state.scene.sources.map((s) => `<div class="dataRow"><span>${esc(s.name)}</span></div><p class="quiet">${esc(s.use)}</p>`).join('')}
    <h2>About This Preview</h2><p class="quiet">A browser preview for layout review. Positions, search, Tonight and events come from the real SkyLensKit engine. Compass, AR, subscriptions and notifications exist only in the iOS app.</p>`);
}

const openers = {
  explore: () => showSheet('Explore', renderExplore),
  tonight: () => showSheet('Tonight', renderTonight),
  events: () => showSheet('Events', renderEvents),
  time: () => showSheet('Time Travel', renderTime, { short: true }),
  more: () => showSheet('More', (el) => {
    for (const [title, sub, go] of [['Favorites', 'Saved objects and Sky Tags', () => showSheet('Favorites', renderFavorites, { push: true })], ['Sky Appearance', 'Layers, stars and night vision', () => showSheet('Sky Appearance', renderAppearance, { push: true })], ['Settings', 'Location, equipment and sources', () => showSheet('Settings', renderSettings, { push: true })]]) {
      el.append(objectRow({ name: title, subtitle: sub, type: 'star' }, go));
    }
  }, { short: true }),
};
document.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => openers[b.dataset.open](); });
$('timeChip').onclick = openers.time;
$('recenter').onclick = () => { fly = { start: performance.now(), ms: 700, az: state.az, dAz: 0, alt: state.alt, alt1: 35, fov: state.fov, fov1: 75 }; };
$('cardOpen').onclick = () => { if (state.selection) showSheet('', (el) => renderDetail(el, state.selection)); };
$('cardClose').onclick = () => { state.selection = null; state.selectionDir = null; $('card').hidden = true; clearTimeout(cardTimer); };
$('welcomeLocate').onclick = () => locate(() => showSheet('Location', renderPlaces));
$('welcomePick').onclick = () => showSheet('Location', renderPlaces);

// ---- Gestures
const pointers = new Map();
let gesture = null, pressTimer = null, lastTap = 0;
const canvas = $('sky');
function pick(x, y) {
  const targets = [], f = state.frame;
  const add = (id, h, radius, mag) => { const p = project(h); if (p && Math.hypot(p.x - x, p.y - y) <= 28 + radius) targets.push({ id, p, radius, mag }); };
  for (const b of f.bodies) add(b.id, b.dir, Math.max(b.diameter / 2 * perDegree(), 6), b.mag);
  for (const s of f.satellites) add(s.id, s.dir, 4, 2);
  if (state.display.deepSky) for (const o of state.scene.deepSky) add(o.id, toHorizon(o.dir), 6, o.mag);
  if (stars.vertices) {
    const n = starsBrighterThan(limitingMagnitude(0)), v = stars.vertices;
    for (let i = 0; i < n; i++) add(`star:${stars.hip[i]}`, toHorizon([v[i * 5], v[i * 5 + 1], v[i * 5 + 2]]), 1, stars.mag[i]);
  }
  let best = null, score = Infinity;
  for (const t of targets) {
    const s = Math.max(0, Math.hypot(t.p.x - x, t.p.y - y) - t.radius) + t.mag * 2.5;
    if (s < score) { score = s; best = t.id; }
  }
  return best;
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  fly = null;
  if (pointers.size === 1) {
    gesture = { moved: false, x: e.clientX, y: e.clientY };
    pressTimer = setTimeout(() => { gesture = null; if (state.frame) addTag(e.clientX, e.clientY); }, 550);
  } else { clearTimeout(pressTimer); gesture = { pinch: spread() , fov: state.fov, moved: true }; }
});
const spread = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
canvas.addEventListener('pointermove', (e) => {
  const last = pointers.get(e.pointerId);
  if (!last) return;
  const dx = e.clientX - last.x, dy = e.clientY - last.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!gesture) return;
  if (gesture.pinch && pointers.size >= 2) { state.fov = Math.min(150, Math.max(.5, gesture.fov * gesture.pinch / spread())); return; }
  if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 6) { gesture.moved = true; clearTimeout(pressTimer); }
  if (gesture.moved) {
    const pd = perDegree();
    state.az = (state.az - dx / pd / Math.max(Math.cos(state.alt * DEG), .05) + 360) % 360;
    state.alt = Math.min(89.9, Math.max(-89.9, state.alt + dy / pd));
  }
});
const release = (e) => {
  pointers.delete(e.pointerId);
  clearTimeout(pressTimer);
  if (gesture && !gesture.moved && state.frame) {
    const now = performance.now();
    if (now - lastTap < 280) {
      flyTo(unproject(e.clientX, e.clientY), Math.max(.5, state.fov / 2));
      lastTap = 0;
    } else {
      lastTap = now;
      const id = pick(e.clientX, e.clientY);
      if (id && id === state.selection) showSheet('', (el) => renderDetail(el, id));
      else if (id) select(id);
      else if (!$('sheet').hidden) closeSheet();
    }
  }
  if (!pointers.size) gesture = null;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); fly = null; state.fov = Math.min(150, Math.max(.5, state.fov * Math.exp(e.deltaY * .001))); }, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function addTag(x, y) {
  const h = unproject(x, y);
  showSheet('New Sky Tag', (el) => {
    let kind = 'celestial';
    el.innerHTML = `<input class="field" id="tName" placeholder="Name"><div class="chips" style="margin-top:10px"><button class="pill on" data-k="celestial">Among the stars</button><button class="pill" data-k="local">My horizon</button></div><p class="quiet" id="tWhy"></p><button class="primary" id="tSave">Save</button>`;
    const why = { celestial: 'Fixed among the stars. It rises and sets with them, so its direction from you keeps changing.', local: 'Fixed to this direction from this place. The stars behind it change through the night.' };
    const paint = () => { el.querySelector('#tWhy').textContent = why[kind]; };
    el.querySelectorAll('.pill').forEach((b) => { b.onclick = () => { kind = b.dataset.k; el.querySelectorAll('.pill').forEach((p) => p.classList.toggle('on', p === b)); paint(); }; });
    paint();
    el.querySelector('#tSave').onclick = () => {
      const name = el.querySelector('#tName').value.trim();
      if (!name) return;
      state.tags.push({ name, kind, dir: kind === 'celestial' ? toJ2000(h) : h });
      store.set('tags', state.tags);
      closeSheet();
    };
  }, { short: true });
}

// ---- Start
(async () => {
  resize(); applyTheme(); updateCamera();
  const [scene] = await Promise.all([api('scene', { noLocation: true }), loadStars()]);
  state.scene = scene;
  for (const name of ['constellationLines', 'boundaries', 'horizonGrid', 'equatorialGrid', 'horizonLine']) makeLines(name, scene[name]);
  rebuildStars();
  if (!state.place) {
    $('loading').classList.add('gone');
    $('welcome').hidden = false;
  }
  requestAnimationFrame(loop);
})();
