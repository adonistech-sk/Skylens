import { Mat3 } from '../../astronomy/core';
import { stars } from '../../data/catalog';
import { MODE_DEFAULTS, starLimit } from '../../state/skyModes';
import { getState, Layers } from '../../state/store';
import { Presence } from './artGeometry';
import { newArtState } from './artwork';
import { emptyResult, frameBrightness, renderFrame } from './renderer';
import { buildStarField, computeMoment, yearsSinceJ2000 } from './scene';
import { sharedResources } from './SkyView';

/** The same frame the screen shows, for compositing onto a saved photo. */
export async function renderCaptureOverlay(orientation: Mat3, fov: number, size: { width: number; height: number }, time: number, layers: Layers) {
  const resources = sharedResources.current;
  const location = getState().location;
  if (!resources || !location) return null;
  const moment = computeMoment(time, location);
  const settings = MODE_DEFAULTS.explore;
  const limit = starLimit('explore', settings, fov, frameBrightness(moment.sunAltitude, layers, false, true), false);
  return renderFrame({
    camera: { orientation, fov, width: size.width, height: size.height, projection: 'rectilinear' },
    chart: { mode: 'explore', settings, limit, query: null, readout: false }, result: emptyResult(), selectionName: null,
    moment, field: buildStarField(stars(), yearsSinceJ2000(time)),
    layers: { ...layers, ground: false }, selection: null, selectionDir: null, moving: false, overlayOnly: true,
    bottomInset: 0, topInset: 0, showCompass: false, nightVision: false, selectionAge: 1, nightPreview: false, framing: false,
    art: newArtState(), names: new Presence(3.2), now: time / 1000, motion: false,
  }, resources);
}

