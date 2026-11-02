/** Artwork fades out where it would either swamp or lose the real sky. */
export function artworkFade(fov: number): number {
  const zoomedOut = Math.min(1, Math.max(0, (92 - fov) / 22));
  const zoomedIn = Math.min(1, Math.max(0, (fov - 7) / 5));
  return zoomedOut * zoomedIn;
}
