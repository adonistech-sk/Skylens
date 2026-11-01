import { Mat3 } from '../../astronomy/core';
import { stars } from '../../data/catalog';
import { getState, Layers } from '../../state/store';
import { renderFrame } from './renderer';
import { buildStarField, computeMoment, yearsSinceJ2000 } from './scene';
import { sharedResources } from './SkyView';

/** The same frame the screen shows, for compositing onto a saved photo. */
export async function renderCaptureOverlay(orientation: Mat3, fov: number, size: { width: number; height: number }, time: number, layers: Layers) {
  const resources = sharedResources.current;
  const location = getState().location;
  if (!resources || !location) return null;
  return renderFrame({
    camera: { orientation, fov, width: size.width, height: size.height, projection: 'rectilinear' },
    moment: computeMoment(time, location), field: buildStarField(stars(), yearsSinceJ2000(time)),
    layers: { ...layers, ground: false }, selection: null, selectionDir: null, moving: false, overlayOnly: true,
    bottomInset: 0, topInset: 0, showCompass: false, nightVision: false, selectionAge: 1, nightPreview: false, framing: false,
  }, resources);
}

