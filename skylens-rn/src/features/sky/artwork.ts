// An optional artistic Orion figure, drawn on top of the true sky. The image is never
// a position source: three of its pixels are pinned to Betelgeuse, Bellatrix and Rigel,
// and it is warped with an affine transform so it follows them for any date, place and
// view. Stars and lines are always drawn from the catalog on top.
import { BlendMode, FilterMode, MipmapMode, SkCanvas, SkImage, Skia } from '@shopify/react-native-skia';
import { Camera, cameraScale } from '../../astronomy/camera';
import { Mat3 } from '../../astronomy/core';
import { stars } from '../../data/catalog';
import { StarField } from './scene';

export interface OrionArtwork {
  image: SkImage;
  /** Pixel positions in the artwork of the three pinned stars. */
  anchors: { betelgeuse: [number, number]; bellatrix: [number, number]; rigel: [number, number] };
  opacity: number;
}

const HIP = { betelgeuse: 27989, bellatrix: 25336, rigel: 24436 };

export function computeArtworkAnchors(canvas: SkCanvas, art: OrionArtwork, camera: Camera, cam: Mat3, field: StarField) {
  const t = stars();
  const scale = cameraScale(camera);
  const screen = (hip: number): [number, number] | null => {
    const i = t.indexByHip.get(hip)! * 3;
    const x = field.xyz[i], y = field.xyz[i + 1], z = field.xyz[i + 2];
    const cz = cam[6] * x + cam[7] * y + cam[8] * z;
    const k = camera.projection === 'stereographic' ? 1 - cz : -cz;
    if (k <= 0.05) return null;
    const s = scale / k;
    return [camera.width / 2 + (cam[0] * x + cam[1] * y + cam[2] * z) * s, camera.height / 2 - (cam[3] * x + cam[4] * y + cam[5] * z) * s];
  };
  const a = screen(HIP.betelgeuse), b = screen(HIP.bellatrix), c = screen(HIP.rigel);
  if (!a || !b || !c) return;
  const [ax, ay] = art.anchors.betelgeuse, [bx, by] = art.anchors.bellatrix, [cx, cy] = art.anchors.rigel;
  // Solve the affine map from artwork pixels to screen points through three pairs.
  const det = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  if (Math.abs(det) < 1e-6) return;
  const m00 = ((b[0] - a[0]) * (cy - ay) - (c[0] - a[0]) * (by - ay)) / det;
  const m01 = ((c[0] - a[0]) * (bx - ax) - (b[0] - a[0]) * (cx - ax)) / det;
  const m10 = ((b[1] - a[1]) * (cy - ay) - (c[1] - a[1]) * (by - ay)) / det;
  const m11 = ((c[1] - a[1]) * (bx - ax) - (b[1] - a[1]) * (cx - ax)) / det;
  const tx = a[0] - m00 * ax - m01 * ay;
  const ty = a[1] - m10 * ax - m11 * ay;
  const paint = Skia.Paint();
  paint.setAlphaf(art.opacity);
  paint.setBlendMode(BlendMode.Plus);
  canvas.save();
  canvas.concat(Skia.Matrix([m00, m01, tx, m10, m11, ty, 0, 0, 1]));
  canvas.drawImageOptions(art.image, 0, 0, FilterMode.Linear, MipmapMode.Linear, paint);
  canvas.restore();
}
