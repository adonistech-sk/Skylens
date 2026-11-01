#include <metal_stdlib>
using namespace metal;

// The projection here must match SkyCamera in SkyLensKit, which is what the tests
// exercise. Layouts must match the structs in SkyRenderer.swift.

struct SkyUniforms {
    float3x3 j2000ToHorizon;
    float3x3 horizonToView;
    float3x3 viewToHorizon;
    float4 screen;  // width and height in points, scale in points, projection
    float4 stars;   // limit magnitude, size scale, points to pixels, refraction on
    float4 sun;     // horizon-frame direction, sky brightness
    float4 mode;    // night vision, transparent (AR), ground alpha, atmosphere on
};

struct Projected {
    float2 points;   // relative to the screen centre, +y up
    float k;
};

static inline Projected project(float3 view, constant SkyUniforms &u) {
    Projected p;
    p.k = u.screen.w < 0.5 ? 1.0 - view.z : -view.z;
    float s = u.screen.z / max(p.k, 1e-4);
    p.points = view.xy * s;
    return p;
}

static inline float4 clipPosition(float2 points, constant SkyUniforms &u) {
    return float4(points.x / (u.screen.x * 0.5), points.y / (u.screen.y * 0.5), 0.0, 1.0);
}

static inline bool isCulled(float k, constant SkyUniforms &u) {
    return u.screen.w < 0.5 ? k < 0.12 : k < 0.02;
}

/// Saemundsson refraction, matching the engine, applied to a horizon-frame direction.
static inline float3 refracted(float3 h, constant SkyUniforms &u) {
    if (u.stars.w < 0.5 || h.z < -0.1 || h.z > 0.5) { return h; }
    float alt = asin(clamp(h.z, -1.0, 1.0)) * 57.29578;
    float clamped = max(alt, -1.0);
    float refraction = (1.02 / tan((clamped + 10.3 / (clamped + 5.11)) * 0.0174533)) / 60.0;
    float lifted = (alt + refraction) * 0.0174533;
    float horizontal = length(h.xy);
    if (horizontal < 1e-5) { return h; }
    return float3(h.xy / horizontal * cos(lifted), sin(lifted));
}

static inline float4 finish(float3 rgb, float alpha, constant SkyUniforms &u) {
    if (u.mode.x > 0.5) {
        // Night vision keeps only long-wavelength light.
        float y = dot(rgb, float3(0.45, 0.45, 0.1));
        rgb = float3(y, y * 0.04, 0.0);
    }
    return float4(rgb, alpha);
}

// ---------------------------------------------------------------- Stars

struct StarVertex {
    packed_float3 direction;
    float magnitude;
    float colorIndex;
};

struct StarOut {
    float4 position [[position]];
    float pointSize [[point_size]];
    float3 color;
    float alpha;
};

static inline float3 starColor(float bv) {
    float3 hot = float3(0.60, 0.74, 1.00);
    float3 white = float3(1.00, 0.98, 0.95);
    float3 warm = float3(1.00, 0.80, 0.54);
    float3 cool = float3(1.00, 0.58, 0.34);
    if (bv < 0.3) { return mix(hot, white, clamp((bv + 0.3) / 0.6, 0.0, 1.0)); }
    if (bv < 1.0) { return mix(white, warm, (bv - 0.3) / 0.7); }
    return mix(warm, cool, clamp((bv - 1.0) / 0.8, 0.0, 1.0));
}

vertex StarOut starVertex(uint vid [[vertex_id]],
                          const device StarVertex *stars [[buffer(0)]],
                          constant SkyUniforms &u [[buffer(1)]]) {
    StarVertex s = stars[vid];
    float3 h = refracted(u.j2000ToHorizon * float3(s.direction), u);
    float3 view = u.horizonToView * h;
    Projected p = project(view, u);

    StarOut out;
    float delta = max(u.stars.x - s.magnitude, 0.0);
    float radius = max(0.45, 0.55 * pow(delta + 0.5, 0.72) * u.stars.y);
    out.alpha = clamp((u.stars.x - s.magnitude + 0.15) / 1.1, 0.0, 1.0);
    out.color = starColor(s.colorIndex);
    out.pointSize = radius * 4.0 * u.stars.z;
    out.position = isCulled(p.k, u) || out.alpha <= 0.0 ? float4(2.0, 2.0, 0.0, 1.0) : clipPosition(p.points, u);
    return out;
}

fragment float4 starFragment(StarOut in [[stage_in]],
                             float2 coord [[point_coord]],
                             constant SkyUniforms &u [[buffer(1)]]) {
    float d = length(coord - float2(0.5)) * 2.0;
    float core = exp(-d * d * 16.0) * 1.35;
    float halo = exp(-d * d * 3.2) * 0.10;
    float intensity = (core + halo) * in.alpha;
    return finish(in.color * intensity, intensity, u);
}

// ---------------------------------------------------------------- Lines

struct LineVertex {
    packed_float3 from;
    packed_float3 to;
    float side;
};

struct LineStyle {
    float4 color;
    float width;      // points
    float frame;      // 0 J2000, 1 horizon
    float padding0;
    float padding1;
};

struct LineOut {
    float4 position [[position]];
    float edge;
};

vertex LineOut lineVertex(uint vid [[vertex_id]],
                          const device LineVertex *lines [[buffer(0)]],
                          constant SkyUniforms &u [[buffer(1)]],
                          constant LineStyle &style [[buffer(2)]]) {
    LineVertex v = lines[vid];
    float3 a = float3(v.from), b = float3(v.to);
    if (style.frame < 0.5) {
        a = u.j2000ToHorizon * a;
        b = u.j2000ToHorizon * b;
    }
    Projected p = project(u.horizonToView * a, u);
    Projected q = project(u.horizonToView * b, u);

    LineOut out;
    out.edge = v.side;
    float2 delta = q.points - p.points;
    float length2 = length(delta);
    if (isCulled(p.k, u) || isCulled(q.k, u) || length2 < 1e-4 || length2 > max(u.screen.x, u.screen.y) * 2.0) {
        out.position = float4(2.0, 2.0, 0.0, 1.0);
        return out;
    }
    float2 normal = float2(-delta.y, delta.x) / length2;
    float2 offset = normal * v.side * (style.width * 0.5 + 0.75);
    out.position = clipPosition(p.points + offset, u);
    return out;
}

fragment float4 lineFragment(LineOut in [[stage_in]],
                             constant SkyUniforms &u [[buffer(1)]],
                             constant LineStyle &style [[buffer(2)]]) {
    float falloff = 1.0 - smoothstep(0.35, 1.0, abs(in.edge));
    float alpha = style.color.a * falloff;
    return finish(style.color.rgb * alpha, alpha, u);
}

// ---------------------------------------------------------------- Background

struct FullScreenOut {
    float4 position [[position]];
    float2 ndc;
};

vertex FullScreenOut fullScreenVertex(uint vid [[vertex_id]]) {
    float2 corners[3] = { float2(-1.0, -1.0), float2(3.0, -1.0), float2(-1.0, 3.0) };
    FullScreenOut out;
    out.position = float4(corners[vid], 0.0, 1.0);
    out.ndc = corners[vid];
    return out;
}

static inline float3 horizonRay(float2 ndc, constant SkyUniforms &u) {
    float2 xy = ndc * u.screen.xy * 0.5 / u.screen.z;
    float r2 = dot(xy, xy);
    float3 view;
    if (u.screen.w < 0.5) {
        float k = 2.0 / (1.0 + r2);
        view = float3(xy * k, (r2 - 1.0) / (r2 + 1.0));
    } else {
        view = normalize(float3(xy, -1.0));
    }
    return u.viewToHorizon * view;
}

fragment float4 skyFragment(FullScreenOut in [[stage_in]],
                            constant SkyUniforms &u [[buffer(1)]],
                            texture2d<float> milkyWay [[texture(0)]]) {
    constexpr sampler linear(address::repeat, filter::linear);
    float3 ray = horizonRay(in.ndc, u);
    float3 sun = u.sun.xyz;
    float brightness = u.sun.w;
    float altitude = clamp(ray.z, -1.0, 1.0);

    float3 night = float3(0.0003, 0.0008, 0.0028);
    float3 color = night;

    if (u.mode.w > 0.5) {
        // A deliberately simple scattering look: blue overhead, paler at the
        // horizon, warm toward the Sun in twilight.
        float height = pow(max(altitude, 0.0), 0.45);
        float3 day = mix(float3(0.58, 0.72, 0.88), float3(0.13, 0.32, 0.62), height);
        color = mix(night, day, brightness);

        float toSun = max(dot(ray, sun), 0.0);
        float twilight = smoothstep(-0.32, -0.02, sun.z) * (1.0 - smoothstep(0.05, 0.35, sun.z));
        float band = exp(-max(altitude, 0.0) * 7.0);
        color += float3(0.95, 0.46, 0.18) * twilight * band * (0.18 + 0.7 * pow(toSun, 6.0));
        color += float3(1.0, 0.92, 0.80) * pow(toSun, 220.0) * smoothstep(-0.1, 0.05, sun.z);

        // Glow near the horizon that gives the planetarium view some depth at night.
        color += float3(0.0030, 0.0052, 0.0105) * exp(-max(altitude, 0.0) * 11.0) * (1.0 - brightness);
    }

    if (brightness < 0.5) {
        // The transpose of a rotation is its inverse.
        float3 j = ray * u.j2000ToHorizon;
        float2 uv = float2(atan2(j.y, j.x) / 6.2831853, 0.5 - asin(clamp(j.z, -1.0, 1.0)) / 3.1415927);
        float glow = milkyWay.sample(linear, uv).r;
        color += float3(0.030, 0.033, 0.046) * glow * (1.0 - brightness * 2.0);
    }
    return finish(color, 1.0, u);
}

/// Translucent ground, drawn over the sky so objects below the horizon stay visible
/// but read clearly as being under it.
fragment float4 groundFragment(FullScreenOut in [[stage_in]],
                               constant SkyUniforms &u [[buffer(1)]]) {
    float3 ray = horizonRay(in.ndc, u);
    // A decorative ridge line, at most about a degree high, so the horizon reads as a
    // place rather than a ruled edge.
    float az = atan2(ray.y, ray.x);
    float ridge = 0.0075 + 0.0042 * sin(az * 3.0 + 1.1) + 0.0026 * sin(az * 7.0 + 2.3)
        + 0.0014 * sin(az * 17.0 + 0.4) + 0.0007 * sin(az * 43.0 + 1.7) + 0.0004 * sin(az * 97.0);
    float below = 1.0 - smoothstep(ridge - 0.0009, ridge + 0.0009, ray.z);
    if (below <= 0.0) { discard_fragment(); }
    float3 color = mix(float3(0.0009, 0.0013, 0.0024), float3(0.045, 0.060, 0.050), u.sun.w);
    float alpha = below * u.mode.z;
    return finish(color * alpha, alpha, u);
}

// ---------------------------------------------------------------- Bodies and markers

struct Marker {
    float4 directionRadius;   // horizon-frame direction, radius in points
    float4 color;
    float4 lightKind;         // light direction, kind
};

struct MarkerOut {
    float4 position [[position]];
    float2 uv;
    float4 color;
    float3 light;
    float kind;
};

vertex MarkerOut markerVertex(uint vid [[vertex_id]],
                              uint iid [[instance_id]],
                              const device Marker *markers [[buffer(0)]],
                              constant SkyUniforms &u [[buffer(1)]]) {
    float2 corners[6] = { float2(-1, -1), float2(1, -1), float2(-1, 1), float2(1, -1), float2(1, 1), float2(-1, 1) };
    Marker m = markers[iid];
    Projected p = project(u.horizonToView * m.directionRadius.xyz, u);

    MarkerOut out;
    out.uv = corners[vid];
    out.color = m.color;
    out.light = m.lightKind.xyz;
    out.kind = m.lightKind.w;
    out.position = isCulled(p.k, u)
        ? float4(2.0, 2.0, 0.0, 1.0)
        : clipPosition(p.points + corners[vid] * m.directionRadius.w, u);
    return out;
}

fragment float4 markerFragment(MarkerOut in [[stage_in]],
                               constant SkyUniforms &u [[buffer(1)]]) {
    float r = length(in.uv);
    if (in.kind < 0.5) {
        // A shaded disc occupying the inner half, with glow around it.
        float disc = r * 2.0;
        float glow = exp(-r * r * 9.0) * 0.55;
        if (disc < 1.0) {
            float3 normal = float3(in.uv * 2.0, sqrt(max(1.0 - disc * disc, 0.0)));
            float lit = dot(normal, in.light);
            // A gentle terminator, as a hard edge reads as a vector graphic.
            float shade = smoothstep(-0.04, 0.12, lit);
            float limb = 0.72 + 0.28 * normal.z;
            float earthshine = 0.035;
            float3 body = in.color.rgb * (shade * limb + earthshine);
            float edge = 1.0 - smoothstep(0.93, 1.0, disc);
            return finish(body * edge + in.color.rgb * glow * (1.0 - edge) * 0.4, max(edge, glow * 0.4), u);
        }
        float alpha = glow * in.color.a * 0.5;
        return finish(in.color.rgb * alpha, alpha, u);
    }
    if (in.kind < 1.5) {
        // Deep-sky ring.
        float ring = 1.0 - smoothstep(0.0, 0.07, abs(r - 0.82));
        float alpha = ring * in.color.a;
        return finish(in.color.rgb * alpha, alpha, u);
    }
    if (in.kind < 2.5) {
        // Selection reticle: four arcs.
        float angle = abs(fract(atan2(in.uv.y, in.uv.x) / 1.5707963 + 0.5) - 0.5);
        float ring = 1.0 - smoothstep(0.0, 0.035, abs(r - 0.86));
        float arc = smoothstep(0.17, 0.2, angle);
        float alpha = ring * arc * in.color.a;
        return finish(in.color.rgb * alpha, alpha, u);
    }
    // Satellites and tags: a soft dot.
    float alpha = (1.0 - smoothstep(0.35, 0.75, r)) * in.color.a;
    return finish(in.color.rgb * alpha, alpha, u);
}

// ---------------------------------------------------------------- Labels

struct Label {
    float4 directionOffset;   // horizon-frame direction, vertical offset in points
    float4 uvRect;            // origin and size in the atlas
    float4 sizeAlpha;         // width and height in points, alpha, unused
    float4 color;
};

struct LabelOut {
    float4 position [[position]];
    float2 uv;
    float4 color;
};

vertex LabelOut labelVertex(uint vid [[vertex_id]],
                            uint iid [[instance_id]],
                            const device Label *labels [[buffer(0)]],
                            constant SkyUniforms &u [[buffer(1)]]) {
    float2 corners[6] = { float2(0, 0), float2(1, 0), float2(0, 1), float2(1, 0), float2(1, 1), float2(0, 1) };
    Label l = labels[iid];
    Projected p = project(u.horizonToView * l.directionOffset.xyz, u);
    float2 c = corners[vid];

    LabelOut out;
    out.uv = l.uvRect.xy + c * l.uvRect.zw;
    out.color = float4(l.color.rgb, l.color.a * l.sizeAlpha.z);
    float2 points = p.points + float2((c.x - 0.5) * l.sizeAlpha.x, (0.5 - c.y) * l.sizeAlpha.y - l.directionOffset.w);
    out.position = isCulled(p.k, u) ? float4(2.0, 2.0, 0.0, 1.0) : clipPosition(points, u);
    return out;
}

fragment float4 labelFragment(LabelOut in [[stage_in]],
                              constant SkyUniforms &u [[buffer(1)]],
                              texture2d<float> atlas [[texture(0)]]) {
    constexpr sampler linear(filter::linear);
    float coverage = atlas.sample(linear, in.uv).r;
    float alpha = coverage * in.color.a;
    return finish(in.color.rgb * alpha, alpha, u);
}
