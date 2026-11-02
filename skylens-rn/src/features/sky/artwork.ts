// Draws constellation illustrations on top of the true sky. A plate is never a position source:
// it reaches the screen through the mesh in artGeometry, the same camera the stars use. Stars and
// lines are drawn from the catalog afterwards, so they always sit over the figure.
import { BlendMode, PaintStyle, SkCanvas, SkPaint, Skia, SkPoint, vec, VertexMode } from '@shopify/react-native-skia';
import { Camera, unproject } from '../../astronomy/camera';
import { Mat3, mul, transpose, Vec3 } from '../../astronomy/core';
import { artRecord } from '../../data/constellationArt';
import { ArtMesh, chooseArtworks, meshFor, parallaxOffset, Presence, projectAll } from './artGeometry';
import { artTexture } from './artTextures';
import { RevealState } from './figures';
import { viewHalfAngle } from './scene';

export { artworkFade } from './artFade';

/** Kept by each sky view, so a detail hero and the main map never share a fade. */
export interface ArtState { presence: Presence; last: number; shown: string[] }
export const newArtState = (): ArtState => ({ presence: new Presence(2.4), last: 0, shown: [] });

export interface ArtFrame {
  camera: Camera;
  /** J2000 to camera. */
  cam: Mat3;
  /** J2000 to horizon. */
  matrix: Mat3;
  field: { years: number; xyz: Float32Array };
  /** Night fade and the user's slider, multiplied. */
  opacity: number;
  chosen: string | null;
  /** The chosen figure's unfolding. */
  reveal: RevealState;
  motion: boolean;
  now: number;
  state: ArtState;
}

let platePaint: SkPaint | null = null;
let glowPaint: SkPaint | null = null;
let tracePaint: SkPaint | null = null;
let buffer = new Float32Array(1024);
/** Glow coordinates never change, so they are worked out once for each figure. */
const glowUvs = new Map<string, SkPoint[]>();

const toPoints = (flat: Float32Array, count: number, dx = 0, dy = 0): SkPoint[] => {
  const out: SkPoint[] = new Array(count);
  for (let i = 0; i < count; i++) out[i] = vec(flat[i * 2] + dx, flat[i * 2 + 1] + dy);
  return out;
};

function drawMesh(canvas: SkCanvas, mesh: ArtMesh, points: SkPoint[], paint: SkPaint, indices: number[]) {
  const vertices = Skia.MakeVertices(VertexMode.Triangles, points, mesh.uv, undefined, indices, true);
  canvas.drawVertices(vertices, BlendMode.DstOver, paint);
}

/** The outline, drawn on as a pen would, a fraction of each loop at a time. */
function drawTrace(canvas: SkCanvas, mesh: ArtMesh, camera: Camera, cam: Mat3, progress: number, alpha: number) {
  if (!mesh.loops.length || progress <= 0 || alpha <= 0) return;
  const count = mesh.outline.length / 3;
  if (buffer.length < count * 2) buffer = new Float32Array(count * 2);
  if (!projectAll(mesh.outline, camera, cam, buffer)) return;
  const path = Skia.PathBuilder.Make();
  for (const loop of mesh.loops) {
    const reach = Math.max(2, Math.floor(loop.count * progress));
    for (let i = 0; i < reach; i++) {
      const k = loop.start + (i % loop.count);
      if (i === 0) path.moveTo(buffer[k * 2], buffer[k * 2 + 1]); else path.lineTo(buffer[k * 2], buffer[k * 2 + 1]);
    }
    if (progress >= 1) path.close();
  }
  if (!tracePaint) {
    tracePaint = Skia.Paint();
    tracePaint.setStyle(PaintStyle.Stroke);
    tracePaint.setAntiAlias(true);
    tracePaint.setStrokeWidth(0.9);
    tracePaint.setBlendMode(BlendMode.Plus);
  }
  tracePaint.setColor(Float32Array.of(0.62, 0.74, 1, alpha));
  canvas.drawPath(path.build(), tracePaint);
}

/** Draws every figure this frame shows. Returns true while something is still settling. */
export function drawArtworks(canvas: SkCanvas, a: ArtFrame): boolean {
  const { camera, cam, matrix, field, state, chosen, reveal } = a;
  const forward: Vec3 = mul(transpose(matrix), unproject(camera, camera.width / 2, camera.height / 2));
  const choices = chooseArtworks({ forward, half: viewHalfAngle(camera), camera, chosen });
  const targets = new Map<string, number>();
  const zooms = new Map<string, number>();
  for (const c of choices) {
    // Nothing fades in until its plate is here, so a late plate still arrives gently.
    if (!artTexture(c.art.id)) continue;
    targets.set(c.art.id, c.emphasis);
    zooms.set(c.art.id, c.zoom);
  }
  const dt = a.now - state.last;
  state.last = a.now;
  let busy = state.presence.step(targets, dt, !a.motion);
  state.shown = [];
  if (!platePaint) { platePaint = Skia.Paint(); platePaint.setBlendMode(BlendMode.Plus); platePaint.setAntiAlias(true); }
  if (!glowPaint) { glowPaint = Skia.Paint(); glowPaint.setBlendMode(BlendMode.Plus); glowPaint.setAntiAlias(true); }
  for (const id of state.presence.ids()) {
    const art = artRecord(id), texture = artTexture(id);
    if (!art || !texture) continue;
    const level = state.presence.level(id);
    const isChosen = id === chosen;
    const plate = isChosen ? reveal.plate : 1;
    const zoom = zooms.get(id) ?? 1;
    const alpha = a.opacity * level * zoom * plate;
    const mesh = meshFor(art, field);
    const count = mesh.xyz.length / 3;
    if (buffer.length < count * 2) buffer = new Float32Array(count * 2);
    if (!projectAll(mesh.xyz, camera, cam, buffer)) continue;
    const middle = Math.floor((mesh.rows + 1) / 2) * (mesh.cols + 1) + Math.floor((mesh.cols + 1) / 2);
    const [dx, dy] = a.motion ? parallaxOffset(buffer[middle * 2], buffer[middle * 2 + 1], camera.width, camera.height) : [0, 0];
    let glowUv = glowUvs.get(id);
    if (!glowUv) {
      const scaleU = texture.glow.width() / art.width, scaleV = texture.glow.height() / art.height;
      glowUv = mesh.uv.map((p) => vec(p.x * scaleU, p.y * scaleV));
      glowUvs.set(id, glowUv);
    }
    glowPaint.setShader(texture.glowShader);
    glowPaint.setAlphaf(Math.min(1, a.opacity * level * zoom * (isChosen ? Math.max(reveal.trace, reveal.plate) : 1)));
    canvas.drawVertices(Skia.MakeVertices(VertexMode.Triangles, toPoints(buffer, count, dx, dy), glowUv, undefined, mesh.indices, true), BlendMode.DstOver, glowPaint);
    if (alpha > 0.004) {
      platePaint.setShader(texture.plateShader);
      platePaint.setAlphaf(Math.min(1, alpha));
      drawMesh(canvas, mesh, toPoints(buffer, count), platePaint, mesh.indices);
    }
    state.shown.push(id);
    if (isChosen && !reveal.done) {
      drawTrace(canvas, mesh, camera, cam, reveal.trace, 0.7 * a.opacity * (1 - reveal.plate * 0.8));
      busy = true;
    }
  }
  return busy;
}
