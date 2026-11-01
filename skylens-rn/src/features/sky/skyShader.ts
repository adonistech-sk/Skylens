// The sky background, evaluated per pixel on the GPU. Each pixel is unprojected to a
// J2000 direction and looks up NASA's all-sky map, so the Milky Way sits where it really
// is for any date, place and view. The projection here must stay in step with
// src/astronomy/camera.ts.
//
// Two things here are deliberately not astronomy, and both are marked: the colour grade
// of the Milky Way, and the framing landscape. The Milky Way's shape and brightness are
// measured; its pink and indigo are a grade. The framing landscape is anchored to the
// screen rather than to altitude, so it must never be read as the true horizon, which
// is always drawn from real altitude and takes over as soon as it enters the frame.
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
uniform float framing;
uniform float framingY;
uniform float framingScale;
uniform float framingAz;

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

  // Height above whichever skyline is on screen. It only steers the low glow.
  float screenAlt = (framingY - p.y) / framingScale;
  float glowAlt = framing > 0.5 ? min(altDeg, screenAlt) : altDeg;

  // Deep midnight navy, lifting to indigo and a dusky mauve toward the skyline.
  float lift = exp(-max(glowAlt, 0.0) / 24.0);
  float3 base = mix(float3(0.016, 0.026, 0.082), float3(0.070, 0.070, 0.205), lift);
  base = mix(base, float3(0.205, 0.105, 0.205), lift * lift * lift);

  // Daylight and twilight, driven by the real altitude of the Sun.
  float3 day = mix(float3(0.26, 0.47, 0.80), float3(0.72, 0.84, 0.96), lift);
  float glow = pow(max(sunAngle, 0.0), 6.0);
  float3 dusk = mix(float3(0.10, 0.12, 0.30), float3(0.98, 0.52, 0.30), lift * lift);
  dusk = mix(dusk, float3(1.0, 0.72, 0.42), glow * lift);
  float twilight = smoothstep(0.0, 0.3, brightness) * (1.0 - smoothstep(0.55, 1.0, brightness));
  float3 sky = mix(base, day, smoothstep(0.45, 1.0, brightness));
  sky = mix(sky, dusk, twilight * (0.35 + 0.65 * max(sunAngle * 0.5 + 0.5, 0.0)));

  // A low band of air glow, warm at the very skyline.
  sky += float3(0.21, 0.085, 0.10) * night * exp(-max(glowAlt, 0.0) / 3.6);

  // Moonlight lifts the sky a little around the Moon.
  float moonAngle = max(dot(hz, moonDir), 0.0);
  sky += float3(0.06, 0.075, 0.11) * moonGlow * (0.25 + 1.2 * pow(moonAngle, 8.0));

  // Extinction: light fades through the thick air depth the horizon.
  float extinction = exp(-0.11 * air);
  float visible = mapStrength * night * night * mix(0.35, 1.0, extinction);

  // The Milky Way's measured brightness, graded from indigo through rose to a warm core.
  float l = dot(map, float3(0.34, 0.33, 0.33));
  // Soft shoulder, not a clamp: the bright summer core must keep its dust lanes.
  float t = max(l - 0.07, 0.0) / 0.26;
  float lifted = t * sqrt(t);
  float band = lifted / (1.0 + 0.85 * lifted);
  float3 tint = mix(float3(0.12, 0.13, 0.40), float3(0.74, 0.33, 0.56), smoothstep(0.06, 0.42, band));
  tint = mix(tint, float3(1.0, 0.72, 0.68), smoothstep(0.55, 1.0, band));
  float3 color = sky + tint * band * visible * 0.74;

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
    float4 strip = float4(0.0);
    if (altDeg < 10.0) strip = horizonMap.eval(float2(hu, hv) * horizonSize);
    float silhouette = strip.a;
    float depth = strip.a > 0.0 ? strip.r / strip.a : 1.0;
    if (altDeg < -4.0) { silhouette = 1.0; depth = 1.0; }

    // Framing landscape: the same strip laid out in screen space. See the note above.
    if (framing > 0.5 && screenAlt < 10.0) {
      float fu = fract((framingAz + (p.x - size.x * 0.5) / framingScale) / 360.0);
      float fv = 1.0 - clamp((screenAlt + 4.0) / 14.0, 0.0, 1.0);
      float4 s = horizonMap.eval(float2(fu, fv) * horizonSize);
      float a = screenAlt < -4.0 ? 1.0 : s.a;
      if (a > silhouette) {
        silhouette = a;
        depth = (screenAlt < -4.0 || s.a <= 0.0) ? 1.0 : s.r / s.a;
      }
    }

    float3 ridge = mix(float3(0.205, 0.135, 0.255), sky * 0.62, 0.5 * brightness + 0.12);
    float3 trees = mix(float3(0.010, 0.013, 0.030), sky * 0.30, 0.5 * brightness + 0.05);
    float3 land = mix(ridge, trees, smoothstep(0.45, 0.95, depth));
    color = mix(color, land, silhouette);
    alpha = max(alpha, silhouette);
  }
  return half4(half3(color * alpha), alpha);
}
`;
