// The sky background, evaluated per pixel on the GPU. Each pixel is unprojected to a
// J2000 direction and looks up NASA's all-sky map, so the Milky Way and faint stars
// sit where they really are for any date, place and view. The projection here must
// stay in step with src/astronomy/camera.ts.
export const SKY_SHADER = `
uniform shader skyMap;
uniform shader horizonMap;
uniform float2 size;
uniform float scale;
uniform float rectilinear;
uniform float3x3 toJ2000;
uniform float3x3 toHorizon;
uniform float3 sunDir;
uniform float3 moonDir;
uniform float brightness;
uniform float moonGlow;
uniform float mapStrength;
uniform float ground;
uniform float transparent;
uniform float groundOnly;
uniform float2 mapSize;
uniform float2 horizonSize;

const float PI = 3.14159265;

half4 main(float2 p) {
  float2 q = float2(p.x - size.x * 0.5, size.y * 0.5 - p.y) / scale;
  float3 c;
  if (rectilinear > 0.5) {
    c = normalize(float3(q, -1.0));
  } else {
    float r2 = dot(q, q);
    float k = 2.0 / (1.0 + r2);
    c = float3(q * k, (r2 - 1.0) / (r2 + 1.0));
  }
  float3 eq = toJ2000 * c;
  float3 hz = toHorizon * c;
  float alt = asin(clamp(hz.z, -1.0, 1.0));
  float altDeg = alt * 57.29578;

  float u = fract(0.5 - atan(eq.y, eq.x) / (2.0 * PI));
  float v = 0.5 - asin(clamp(eq.z, -1.0, 1.0)) / PI;
  float3 map = skyMap.eval(float2(u, v) * mapSize).rgb;

  float sunAngle = dot(hz, sunDir);
  float air = 1.0 / max(sin(max(alt, 0.0)) + 0.12, 0.12);
  float night = 1.0 - brightness;

  // Deep midnight navy with a faint lift toward the horizon.
  float lift = exp(-max(altDeg, 0.0) / 20.0);
  float3 base = mix(float3(0.016, 0.022, 0.058), float3(0.115, 0.075, 0.170), lift * lift);

  // Daylight and twilight, driven by the real altitude of the Sun.
  float3 day = mix(float3(0.26, 0.47, 0.80), float3(0.72, 0.84, 0.96), lift);
  float glow = pow(max(sunAngle, 0.0), 6.0);
  float3 dusk = mix(float3(0.10, 0.12, 0.30), float3(0.98, 0.52, 0.30), lift * lift);
  dusk = mix(dusk, float3(1.0, 0.72, 0.42), glow * lift);
  float twilight = smoothstep(0.0, 0.3, brightness) * (1.0 - smoothstep(0.55, 1.0, brightness));
  float3 sky = mix(base, day, smoothstep(0.45, 1.0, brightness));
  sky = mix(sky, dusk, twilight * (0.35 + 0.65 * max(sunAngle * 0.5 + 0.5, 0.0)));

  // A low band of air glow, warm at the very horizon.
  sky += float3(0.17, 0.075, 0.12) * night * exp(-max(altDeg, 0.0) / 4.5);

  // Moonlight lifts the sky a little around the Moon.
  float moonAngle = max(dot(hz, moonDir), 0.0);
  sky += float3(0.06, 0.075, 0.11) * moonGlow * (0.25 + 1.2 * pow(moonAngle, 8.0));

  // Extinction: stars fade through the thick air near the horizon.
  float extinction = exp(-0.11 * air);
  float visible = mapStrength * night * night * mix(0.35, 1.0, extinction);
  // Faint speckle sits low and the diffuse band high, so the sky stays deep.
  float3 graded = map * (0.72 + 1.5 * smoothstep(0.06, 0.4, dot(map, float3(0.33))));
  float3 color = sky + graded * visible * 0.86;

  float alpha = 1.0;
  if (transparent > 0.5 || groundOnly > 0.5) {
    alpha = 0.0;
    color = float3(0.0);
  }

  if (ground > 0.5) {
    float az = atan(-hz.y, hz.x);
    float hu = fract(az / (2.0 * PI));
    // The strip spans -4 to +10 degrees of altitude around the whole horizon.
    float hv = 1.0 - clamp((altDeg + 4.0) / 14.0, 0.0, 1.0);
    float silhouette = 0.0;
    if (altDeg < 10.0) silhouette = horizonMap.eval(float2(hu, hv) * horizonSize).a;
    if (altDeg < -4.0) silhouette = 1.0;
    float3 land = mix(float3(0.012, 0.016, 0.034), sky * 0.34, 0.5 * brightness + 0.1);
    color = mix(color, land, silhouette);
    alpha = max(alpha, silhouette);
  }
  return half4(half3(color * alpha), alpha);
}
`;
