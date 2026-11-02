// Ray-traced globes in SkSL. Every body in the app is an ellipsoid or a ring, so a ray
// through each pixel gives the exact shape, terminator and shadows with no meshes, and no
// new native dependency: this runs on the same Skia pipeline as the sky. All coordinates are
// body-fixed and in units of the body's equatorial radius, so textures stay registered.
//
// Uniform order here must match globeUniforms and moonUniforms in renderer.ts.

const RAY = `
  float2 q = float2(p.x - screen.x * 0.5, screen.y * 0.5 - p.y) / focal;
  float3 d = normalize(ray * float3(q, 1.0));
`;

export const GLOBE_SHADER = `
uniform shader surface;
uniform shader night;
uniform float2 mapSize;
uniform float2 nightSize;
uniform float2 screen;
uniform float focal;
uniform float3x3 ray;
uniform float3 eye;
uniform float3 sun;
uniform float polar;
uniform float offset;
uniform float emissive;
uniform float hasNight;
uniform float ringOuter;
uniform float3 air;
uniform float pixel;
uniform float shade;

const float PI = 3.14159265;

// Optical depth of Saturn's rings from their real edges, in planet radii. The depths are
// representative of each ring, not a brightness measurement.
float ringDepth(float r) {
  if (r < 1.239 || r > 2.269) return 0.0;
  // Too small on screen to resolve the divisions: an even band with the true outer edges.
  float far = smoothstep(0.012, 0.04, pixel);
  float fine = 0.0;
  if (r < 1.527) fine = 0.1 + 0.05 * sin(r * 60.0);
  else if (r < 1.951) fine = 1.05 + 0.45 * sin((r - 1.527) * 9.0) + (0.14 * sin(r * 170.0) + 0.1 * sin(r * 71.0)) * (1.0 - far);
  else if (r < 2.027) fine = 0.08;
  else if (r > 2.210 && r < 2.218) fine = 0.02;
  else fine = 0.5 + 0.06 * sin(r * 120.0) * (1.0 - far);
  return mix(fine, 0.6, far);
}

half4 main(float2 p) {
  ${RAY}
  float3 o = float3(eye.xy, eye.z / polar);
  float3 dd = float3(d.xy, d.z / polar);
  float a = dot(dd, dd);
  float b = dot(o, dd);
  float c = dot(o, o) - 1.0;
  float disc = b * b - a * c;
  float closest = sqrt(max(dot(o, o) - b * b / a, 0.0));
  float cover = b < 0.0 ? clamp((1.0 - closest) / max(pixel, 1e-5) + 0.5, 0.0, 1.0) : 0.0;
  float tSphere = -1.0;
  float3 color = float3(0.0);

  if (cover > 0.0) {
    float t = (-b - sqrt(max(disc, 0.0))) / a;
    tSphere = t;
    float3 hit = o + dd * t;
    float3 n = normalize(float3(hit.xy, hit.z / polar));
    float3 view = -normalize(dd);
    float lon = atan(hit.y, hit.x);
    float lat = asin(clamp(n.z, -1.0, 1.0));
    float2 uv = float2(fract(lon / (2.0 * PI) + offset), 0.5 - lat / PI);
    float3 albedo = surface.eval(uv * mapSize).rgb;
    if (emissive > 0.5) {
      // The solar disc, with limb darkening. It carries no surface map.
      float mu = max(dot(n, normalize(float3(view.xy, view.z * polar))), 0.0);
      color = float3(1.0, 0.93, 0.78) * (0.42 + 0.68 * mu);
    } else {
      float lambert = dot(n, sun);
      float light = max(lambert, 0.0);
      // The shadow of Saturn's rings on the planet.
      if (ringOuter > 0.0 && abs(sun.z) > 1e-4) {
        float3 pos = float3(hit.xy, hit.z * polar);
        float s = -pos.z / sun.z;
        if (s > 0.0) {
          float r = length(pos.xy + sun.xy * s);
          light *= exp(-ringDepth(r) * 1.1 / max(abs(sun.z), 0.05));
        }
      }
      color = albedo * (light * 1.08 + shade);
      if (hasNight > 0.5) {
        float dark = smoothstep(0.03, -0.1, lambert);
        float3 lights = night.eval(uv * nightSize).rgb;
        float glow = max(dot(lights, float3(0.34, 0.33, 0.33)) - 0.09, 0.0);
        color += glow * glow * float3(1.0, 0.86, 0.62) * dark * 3.2;
      }
      // A thin glow on the sunlit limb of a body with an atmosphere.
      float rim = pow(1.0 - max(dot(n, normalize(float3(view.xy, view.z * polar))), 0.0), 3.5);
      color += air * rim * smoothstep(-0.25, 0.35, lambert);
    }
  }

  float3 final = color * cover;
  float alpha = cover;
  if (ringOuter > 0.0 && abs(d.z) > 1e-5) {
    float t = -eye.z / d.z;
    float3 pos = eye + d * t;
    float r = length(pos.xy);
    float depth = t > 0.0 ? ringDepth(r) : 0.0;
    if (depth > 0.0) {
      float behind = tSphere > 0.0 && t > tSphere * length(dd) / length(float3(dd.xy, dd.z * polar)) ? 1.0 : 0.0;
      if (behind < 0.5 || cover < 1.0) {
        float opacity = 1.0 - exp(-depth / max(abs(d.z), 0.04));
        // The planet's own shadow falls across the rings behind it.
        float along = dot(pos, sun);
        float away = length(pos - sun * along);
        float lit = along < 0.0 && away < 1.0 ? 0.04 : 1.0;
        // The unlit face only passes the light that filters through.
        float through = eye.z * sun.z < 0.0 ? 0.3 : 1.0;
        float3 band = float3(0.74, 0.67, 0.56) * (0.42 + 0.42 * min(depth, 1.3)) * lit * through;
        if (behind > 0.5) opacity *= 1.0 - cover;
        final = final * (1.0 - opacity) + band * opacity;
        alpha = alpha + opacity * (1.0 - alpha);
      }
    }
  }
  return half4(half3(final), alpha);
}
`;

export const SPACE_SHADER = `
uniform shader skyMap;
uniform float2 mapSize;
uniform float2 screen;
uniform float focal;
uniform float3x3 ray;
const float PI = 3.14159265;
half4 main(float2 p) {
  ${RAY}
  float u = fract(0.5 - atan(d.y, d.x) / (2.0 * PI));
  float v = 0.5 - asin(clamp(d.z, -1.0, 1.0)) / PI;
  // The map's bright stars are soft blobs at this zoom. The real stars are drawn on top, so
  // keep only what's wider than a star: the darkest of four samples around each pixel.
  float2 at = float2(u, v) * mapSize;
  float3 w = float3(0.34, 0.33, 0.33);
  float l = min(min(dot(skyMap.eval(at + float2(4.0, 4.0)).rgb, w), dot(skyMap.eval(at + float2(-4.0, 4.0)).rgb, w)), min(dot(skyMap.eval(at + float2(4.0, -4.0)).rgb, w), dot(skyMap.eval(at + float2(-4.0, -4.0)).rgb, w)));
  float t = max(l - 0.08, 0.0) / 0.26;
  float band = t * sqrt(t) / (1.0 + 0.85 * t * sqrt(t));
  float3 tint = mix(float3(0.12, 0.13, 0.40), float3(0.60, 0.32, 0.52), smoothstep(0.06, 0.42, band));
  return half4(half3(float3(0.012, 0.016, 0.046) + tint * band * 0.34), 1.0);
}
`;

// SkSL can't pass a shader to a function, so each tile slot is written out.
const TILE = (i: number) => `
  if (bounds${i}.z > bounds${i}.x) {
    float2 f${i} = (uv - bounds${i}.xy) / (bounds${i}.zw - bounds${i}.xy);
    if (f${i}.x >= 0.0 && f${i}.y >= 0.0 && f${i}.x <= 1.0 && f${i}.y <= 1.0) color = tile${i}.eval(float2(tileGutter) + f${i} * tileSize).rgb;
  }`;

export const MOON_SHADER = `
uniform shader base;
uniform shader relief;
uniform shader tile0;
uniform shader tile1;
uniform shader tile2;
uniform shader tile3;
uniform float2 baseSize;
uniform float2 reliefSize;
uniform float tileSize;
uniform float tileGutter;
uniform float4 bounds0;
uniform float4 bounds1;
uniform float4 bounds2;
uniform float4 bounds3;
uniform float2 screen;
uniform float focal;
uniform float3x3 ray;
uniform float3 eye;
uniform float3 sun;
uniform float pixel;
uniform float fullLight;
uniform float showRelief;
uniform float showElevation;

const float PI = 3.14159265;

float heightAt(float2 uv) { return relief.eval(float2(fract(uv.x), clamp(uv.y, 0.0, 1.0)) * reliefSize).r; }

// A sequential ramp from low basins through plains to high ground, in the app's palette.
float3 ramp(float h) {
  float3 c = mix(float3(0.10, 0.14, 0.36), float3(0.30, 0.36, 0.62), smoothstep(0.1, 0.42, h));
  c = mix(c, float3(0.78, 0.60, 0.50), smoothstep(0.42, 0.62, h));
  return mix(c, float3(1.0, 0.92, 0.82), smoothstep(0.62, 0.92, h));
}

half4 main(float2 p) {
  ${RAY}
  float b = dot(eye, d);
  float c = dot(eye, eye) - 1.0;
  float disc = b * b - c;
  float closest = sqrt(max(dot(eye, eye) - b * b, 0.0));
  float cover = b < 0.0 ? clamp((1.0 - closest) / max(pixel, 1e-5) + 0.5, 0.0, 1.0) : 0.0;
  if (cover <= 0.0) return half4(0.0);
  float t = -b - sqrt(max(disc, 0.0));
  float3 n = normalize(eye + d * t);
  float lat = asin(clamp(n.z, -1.0, 1.0));
  float lon = atan(n.y, n.x);
  float2 uv = float2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI);
  float3 color = base.eval(uv * baseSize).rgb;
${TILE(0)}${TILE(1)}${TILE(2)}${TILE(3)}
  float3 normal = n;
  float h = heightAt(uv);
  if (showRelief > 0.5 || showElevation > 0.5) {
    // Slopes from the LOLA elevation map, 22 km across the 8-bit range, 4 samples a degree.
    float gap = 1.5 / reliefSize.x;
    float dx = heightAt(uv + float2(gap, 0.0)) - heightAt(uv - float2(gap, 0.0));
    float dy = heightAt(uv + float2(0.0, gap)) - heightAt(uv - float2(0.0, gap));
    float kmPerStep = 2.0 * PI * 1737.4 * gap;
    float slope = 22.0 / (2.0 * kmPerStep);
    float cl = max(cos(lat), 0.05);
    float3 east = float3(-sin(lon), cos(lon), 0.0);
    float3 north = float3(-sin(lat) * cos(lon), -sin(lat) * sin(lon), cos(lat));
    // Slopes read best a little exaggerated on the whole globe. Close up the elevation grid is
    // far coarser than the map, so they stay near their true steepness.
    float strength = mix(1.0, 3.0, smoothstep(0.0012, 0.006, pixel));
    if (showRelief > 0.5) normal = normalize(n - east * dx * slope / cl * strength + north * dy * slope * strength);
  }
  if (showElevation > 0.5) color = mix(color, ramp(h), 0.82);

  float lit = dot(normal, sun);
  // Beyond the terminator a trace of light stays, so the map never turns to a blank disc.
  float light = fullLight > 0.5 ? 0.72 + 0.28 * max(dot(normal, sun), 0.0) : max(lit, 0.0) * 1.34 + 0.05;
  if (fullLight < 0.5 && dot(n, sun) < 0.0) light = 0.05;
  return half4(half3(color * light * cover), cover);
}
`;
