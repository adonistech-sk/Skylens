# Architecture

## The core idea

Logic lives in a platform-neutral Swift package, and the iOS app stays as thin as it can.

That split exists because the project began on Windows, where SwiftUI and Metal can't compile. Everything in `SkyLensKit` builds and runs without an iOS SDK, so it has real test evidence. It would be a good structure regardless: astronomy doesn't depend on UI.

When adding code, ask whether it needs an Apple framework. If it doesn't, it belongs in the package, with a test.

```
SkyLens.xcodeproj              Native app. Folders sync into the project automatically.
SkyLens/                       Apple-only code
├── App/                       Entry point, services, root view
├── DesignSystem/              Theme tokens and shared components
├── Sky/                       Metal renderer, shaders, gestures, Sky screen
├── Sensors/                   Core Motion, Core Location
├── AR/                        Camera and overlay
├── Services/                  StoreKit, notifications
├── Features/                  One folder per screen
└── Resources/                 Assets, privacy manifest, StoreKit config, notices
Packages/SkyLensKit/           Portable, tested
├── CAstronomyEngine           Vendored C library
├── AstronomyCore              Typed adapter: time, positions, rise/set, phenomena
├── SkyCatalog                 Stars, constellations, deep sky, search, editorial
├── SkyProjection              Camera, projections, attitude, labels, hit testing
├── Satellites                 SGP4, pass prediction, OMM parsing
├── ObservingKit               Weather, Tonight, events, alerts, night lights
├── UserData                   Preferences, favorites, tags, persistence
└── SkySession                 AppModel, sky clock, subscriptions, locator, geometry
Tools/                         Catalog builder, reference fetcher, verification harness
```

## Data flow

`AppModel` (`@Observable`, `@MainActor`) is the single source of truth. Views read it and call its methods, and hold no business logic.

```
Views ──calls──▶ AppModel ──owns──▶ SkyClock, UserDocument, Catalog, forecasts, plans
  ▲                 │
  └──observes───────┘
```

`AppServices` owns everything long-lived and reaches views through the environment. `AppDependencies` carries the seams tests fake: HTTP, weather, storage location and the clock.

**One clock.** `AppModel.skyDate` is the only source of sky time. The sky, search, Tonight and detail pages all read it, so they can't disagree during time travel. It is a linear map from the real clock (`anchor + rate × elapsed`), clamped to the validated range of 1800 to 2199.

**Observation discipline.** Anything changing at frame rate is `@ObservationIgnored`, so it doesn't trigger SwiftUI updates. The renderer reads it directly.

## Astronomy computation

Astronomy Engine provides the ephemeris, chosen after checking its API, its MIT license and its stated ±1′ accuracy. It is wrapped rather than rewritten.

- **ΔT:** the JPL model replaces the default, which misplaced the Moon by 202″ in 2199 (see `TESTING.md`).
- **Geometric and apparent are different fields.** `TopocentricPosition.geometric` is airless, `.apparent` includes refraction. Callers must choose.
- **One matrix per frame.** `SkyFrame.j2000ToHorizon` includes precession, nutation and Earth rotation. The renderer multiplies catalog directions by it.
- **Matrix layout.** The engine stores `rot[column][row]`, and `Mat3` is row-major. `Mat3(engineRotation:)` is the only conversion, with a test comparing it to the full position path. Reading it backwards would mirror the sky.
- **Thread safety.** The engine has one global user-star table and lazy constellation tables, so `EngineLock` guards those calls.

### Frames

| Frame | Axes | Used for |
|---|---|---|
| J2000 equatorial | +x equinox, +z north pole | Catalogs |
| Horizon | +x north, +y west, +z zenith | Local sky. Matches Core Motion's `xTrueNorthZVertical` |
| Camera | +x right, +y up, looks along −z | Projection |

## Rendering

The renderer in `SkyRenderer.swift` works in a fixed order: sky background, lines, stars, markers, ground, labels.

- **Cost.** Almost everything that moves is a uniform, so a frame is a handful of draw calls.
- **Stars** live in one buffer sorted by brightness. A magnitude limit is just a shorter draw. The buffer is rebuilt off the main thread only when proper motion has moved by five years.
- **Projection.** Stereographic for the planetarium, because it preserves shapes at wide fields. Rectilinear for AR, because the overlay must match a real lens. `SkyCamera` is the tested version, and **`SkyShaders.metal` duplicates its formula, so change both together.**
- **Labels** are glyph quads from one atlas, placed at 8 Hz and positioned every frame. A SwiftUI overlay would trail behind the stars during a drag.
- **Ground** is translucent and drawn over the stars, so objects below the horizon stay visible but clearly under it.
- **Layouts** in `SkyShaders.metal` must match the structs in `SkyRenderer.swift`. They use only `SIMD4` and `simd_float3x3` to avoid padding differences.
- **Frame rate** is 60 while anything moves and 30 when still, and rendering pauses in the background.

## Sensors

`MotionService` turns attitude into a camera orientation in four steps:

1. Prefer `xTrueNorthZVertical`. It needs location permission, so without it fall back to magnetic north, tell the user, and correct for declination when known.
2. `AttitudeSolver` compares the matrix with measured gravity to decide its convention, rather than trusting an assumption that can't be tested without hardware. It stays undecided in flat and degenerate poses.
3. Apply the interface rotation.
4. `AttitudeFilter` smooths jitter, and snaps on large jumps so the view doesn't swing.

The user's compass correction rotates about the zenith, the only axis a magnetometer gets wrong. Sensors stop in the background.

## Persistence

`UserDocument` is one JSON file in Application Support, written atomically. Decoding tolerates missing keys, so new options never reset settings. A corrupt file is moved aside instead of overwritten, and the user is told.

Only user-created data is stored here. Catalogs are read-only resources in the bundle.

## External integrations

| Service | Failure behaviour |
|---|---|
| MET Norway | `WeatherState` shows unavailable. Astronomy is unaffected |
| CelesTrak | Cached elements continue. Over 7 days old, predictions are refused |
| NASA GIBS | Map and comparisons go blank. Nothing else depends on it |
| StoreKit | Status stays unknown, treated as free. The sky always works |

There is no backend, no account and no analytics. The app works offline after install, except for live weather, satellite refreshes and maps.

## Free and Pro

`ProFeature` lists what Pro adds, and `SubscriptionStatus.resolve` applies Apple's rules in one tested function. `StoreService` only translates StoreKit types into that form.

AR is free, which goes beyond the brief's free list. Pointing the phone at the sky is what the product is, so locking it would undercut the first impression. This is easy to change.

## Principles to keep

- **Never fabricate.** Missing weather, stale orbits and unknown distances are states the UI shows, not gaps to fill. Tests enforce this.
- **Refuse rather than guess.** Deep-space orbits throw, and stale elements yield no passes.
- **Prices come from StoreKit.**
- **Colors come from `SkyTheme`,** or night vision leaks white light.
