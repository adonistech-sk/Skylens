# Migration Audit: SwiftUI to React Native

Written 2026-11-01. The owner has no Mac, so all iOS evidence comes from GitHub Actions on `macos-26`.

## Decision

**Path B, with one change: the renderer is new, and the astronomy runs in TypeScript through the same engine.**

- The SwiftUI app and `SkyLensKit` stay untouched and keep building. The new app lives in `skylens-rn/`.
- Catalogs are reused as data, copied by `scripts/build-data.mjs` and never edited.
- The ephemeris is Astronomy Engine 2.1.19, the same library and version as the vendored C code, in its official TypeScript distribution.
- The sky is a new React Native Skia renderer.
- Native Swift is kept where JavaScript can't do the job: `modules/sky-native` reuses the true-north attitude logic from `MotionService.swift`.

### Why not Path A (embed the Swift engine and Metal renderer)

The spec prefers Path A if it is robust. Path A was **not** tried as a spike, and the reasons are economic:

1. Every native change could only compile in cloud CI, at tens of minutes per attempt. Ten screens of visual iteration would become days of waiting, because Metal has no preview on Windows.
2. `SkyLensKit` is a multi-target Swift package with a C target and bundled resources. Expo modules ship through CocoaPods, so wiring in that package is a real integration risk that returns nothing a user can see.
3. The Metal renderer was verified only recently, and the visual target requires new work anyway: the NASA sky map, the horizon, the artwork.
4. Astronomy accuracy doesn't depend on Swift, as the parity result below shows.

**Cost of this choice:** thin Swift logic was ported rather than called (Tonight ranking, event assembly, search, locator, attitude). If behaviour drifts, there are now two implementations. The Swift package remains the reference.

Satellites, weather and the dark-sky map were not ported. They exist only in the SwiftUI app.

## Parity evidence

`tests/reference.test.ts` runs the same fixtures as the Swift package, extracted unchanged from `ReferenceFixtures.swift`.

| Check | Swift result | TypeScript result |
|---|---|---|
| J2000 position, 378 JPL Horizons cases, worst | 36.5″ | **36.5″** |
| Altitude and azimuth, same cases, worst | 18.1″ | **18.1″** |
| Distance | Within 0.02% | Within 0.02% |
| Sun and Moon rise, set, transit, civil twilight, USNO | Within 2 min | Within 2 min |
| 149 lunar phases, 12 seasons, USNO | Pass | Pass |

These ran under Node. Hermes, the iPhone's JavaScript engine, runs the same code but has not been measured for speed or checked numerically on a device.

## Existing modules

| Module | State | Evidence | Reused how |
|---|---|---|---|
| `CAstronomyEngine` + `AstronomyCore` | Working | 263 package tests on macOS CI | Same engine via npm |
| `SkyCatalog` data | Working | Tested; all 893 figure vertices resolve | Copied as data |
| `SkyCatalog` search | Working | Tested | Ported, retested |
| `SkyProjection` camera, attitude | Working on Simulator; attitude never confirmed on hardware | Tests; CI screenshots | Ported |
| `ObservingKit` Tonight, Events | Working | Tested | Ported, retested |
| `ObservingKit` Weather | Working | Tested | **Not ported** |
| `Satellites` SGP4 | Working | Tested | **Not ported** |
| `SkySession` | Working | Tested | Replaced by `src/state/store.ts` |
| `UserData` | Working | Tested | Replaced by AsyncStorage JSON |
| Metal renderer | Runs in Simulator | CI screenshots | **Not reused** |
| `MotionService` | Compiles, unconfirmed on hardware | Xcode build | Ported to `modules/sky-native` |
| `StoreService` | Compiles | Rules tested | Replaced by expo-iap, same product IDs |
| SwiftUI screens | Run in Simulator | CI screenshots | Not reused, by design |

## Dependencies and native risk

| Dependency | Why | Risk |
|---|---|---|
| Expo SDK 58, RN 0.88 | Foundation | Current release; first iOS CI build is the proof |
| `@shopify/react-native-skia` | Sky, Moon | Runs on the JS thread, frame rate unmeasured on device |
| `expo-camera`, `expo-location`, `expo-media-library` | AR, location, saving | Need a real device for full behaviour |
| `expo-iap` | StoreKit 2 | Replaces tested Swift code. Purchases unverified |
| `astronomy-engine` | Ephemeris | MIT, parity shown above |

## License findings

Open items from `LICENSES.md` still apply, above all NGC 2000.0. New imagery and its open questions are in `skylens-rn/ASSET_CREDITS.md`. No GPL material was added.

## Risks

1. **Frame rate on real iPhones is unmeasured.** Star projection runs in Hermes on the JS thread. The renderer drops 0.5 magnitude while moving, but this may not be enough on older phones.
2. **Sensor convention is unconfirmed on hardware**, as it was in SwiftUI. Compass and AR must be checked outdoors.
3. **`SkyLens.xcodeproj` and the Expo app share the bundle ID** `sk.skylens.app`. Only one can be the TestFlight build at a time.
4. **Two implementations of thin logic** can drift, as noted above.
