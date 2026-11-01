// The camera preview can't be captured from the view tree, so a photo is taken and the
// same sky is rendered over it off-screen. The result is a real composite of the two.
import { Skia } from '@shopify/react-native-skia';
import type { CameraView } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Mat3 } from '../../astronomy/core';
import { getState, skyTime } from '../../state/store';
import { renderCaptureOverlay } from '../sky/captureOverlay';

export async function saveARPhoto(camera: CameraView, orientation: Mat3 | null, fov: number, size: { width: number; height: number }): Promise<boolean> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) return false;
  const photo = await camera.takePictureAsync({ quality: 0.9, skipProcessing: false });
  if (!photo || !orientation) return false;

  const data = await Skia.Data.fromURI(photo.uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) return false;
  const surface = Skia.Surface.MakeOffscreen(image.width(), image.height());
  if (!surface) return false;
  const canvas = surface.getCanvas();
  canvas.drawImage(image, 0, 0);
  // The preview fills the screen by cropping, so scale the overlay the same way.
  const scale = Math.max(image.width() / size.width, image.height() / size.height);
  canvas.save();
  canvas.translate((image.width() - size.width * scale) / 2, (image.height() - size.height * scale) / 2);
  canvas.scale(scale, scale);
  const picture = await renderCaptureOverlay(orientation, fov, size, skyTime(), getState().layers);
  if (picture) canvas.drawPicture(picture);
  canvas.restore();
  surface.flush();
  const encoded = surface.makeImageSnapshot().encodeToBytes();
  const file = new File(Paths.cache, `skylens-${Date.now()}.jpg`);
  file.write(encoded);
  await MediaLibrary.saveToLibraryAsync(file.uri);
  return true;
}
