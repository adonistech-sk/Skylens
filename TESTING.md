# Testing

## Where things stand

| Layer | Checked by | Run on | Result |
|---|---|---|---|
| `SkyLensKit` logic | 263 Swift Testing tests | Swift 6.4.2 → Wasm → Node, Windows | **263 passed** |
| Clean-room repeat | Same, with a toolchain rebuilt from nothing | Windows | **263 passed** |
| iOS app, 27 Swift files | Real Swift compiler against stand-in Apple APIs | Windows | Type-checks |
| Metal shaders | Real Clang against a stand-in header | Windows | Parses |
| Sky geometry | Software render, inspected by eye | Windows | Correct for two sky views |
| App in Xcode | Not done | Needs macOS | **Unverified** |
| App in Simulator | Not done | Needs macOS | **Unverified** |
| App on a device | Not done | Needs an iPhone | **Unverified** |
| UI tests (8 written) | Not done | Needs a Simulator | **Never run** |
| Performance | Not done | Needs a device | **Never measured** |

### What the stand-in checks do and don't show

`Tools/apple-stubs` declares the Apple APIs by hand so the real compiler can check the app. It finds typos, type errors and misuse of `SkyLensKit`. Three planted bugs were all caught, as was a planted shader error. It found a real missing import.

It cannot find a wrong Apple API. The stand-ins and the app were written from the same knowledge of the SDK, so any mistaken signature is mistaken on both sides. Expect some compile errors in Xcode.

## Running the tests

On a Mac:

```sh
swift test --package-path Packages/SkyLensKit
xcodebuild test -project SkyLens.xcodeproj -scheme SkyLens \
  -destination 'platform=iOS Simulator,name=iPhone 16'
```

`swift test` has itself never been run, so its package resource loading is unproven. The Wasm harness loads the same files by path instead of through `Bundle.module`.

On Windows, without admin rights (about 2.5 GB, 90 seconds after the download):

```sh
node Tools/wasm-check/setup-windows.mjs <toolsDir>
export SKYLENS_TOOLS=<toolsDir>
. Tools/wasm-check/env.sh
node Tools/wasm-check/check.mjs                 # build and test the package
node Tools/apple-stubs/typecheck.mjs            # type-check the app
node Tools/apple-stubs/check-shaders.mjs        # parse the shaders
node Tools/sky-preview/render.mjs sky.png --lat 52.2 --lon 21 --az 165 --alt 32 --fov 80 --date 2026-01-15T20:00:00Z
```

## Astronomy validation

Reference values come from the authorities directly, using `Tools/reference-data/fetch.mjs`, so nothing is tested against itself.

| Check | Reference | Tolerance | Worst result |
|---|---|---|---|
| J2000 position, 378 cases: 9 bodies, 6 sites, 7 dates, 1805 to 2199 | JPL Horizons | 60″ | 36.5″ (Venus), Moon 24.8″ |
| Altitude and azimuth, same cases | JPL Horizons, airless | 60″ | 18.1″ |
| Distance | JPL Horizons | 0.02% | Passed |
| Sun rise, set, transit | USNO, 13 site-days | 2 min | Passed |
| Moon rise, set | USNO | 2 min | Passed |
| Civil twilight | USNO | 2 min | Passed |
| 149 lunar phases in 1950, 2026 and 2100 | USNO | 2 min, 4 min in 2100 | Passed |
| 12 equinoxes and solstices | USNO | 2 min | Passed |
| SGP4 position | satellite.js 5.0, 4 element sets | 1 m | Passed |

Sites cover both hemispheres, the equator (Quito), the Arctic (Tromsø), the Antarctic (McMurdo) and the date line (Apia). Also covered: midnight sun, polar night, daylight-saving transitions, stars that never rise or set, and objects below the horizon.

Testing against Horizons exposed a real problem: the engine's default ΔT model put the Moon 202″ off by 2199. SkyLens now uses JPL's model. The 2100 phase tolerance is wider because USNO and JPL assume different future ΔT, which no one can know.

## Manual checks needing hardware

Sensor and AR accuracy can't be established in a Simulator.

**Compass, outdoors at night**
1. Enable the compass and point at a known star. It should sit within a few degrees of its label.
2. Turn a full circle. The sky should track smoothly, with no jump.
3. Confirm east is on the left when facing south, in the northern hemisphere. A mirrored sky means the attitude solver chose wrongly, which `AttitudeSolver` is designed to prevent.
4. Rotate to landscape and check that the zenith stays at the top.
5. Deny location, enter a place by hand, enable the compass, and confirm the magnetic-north notice appears.
6. Stand near metal and confirm the interference warning appears.

**AR**
1. Check that stars at the frame's edge sit as close to their labels as those at the centre. Drift toward the edge means a field-of-view error.
2. Check the calibration slider moves the overlay.
3. Deny camera access and confirm the denied state.

**Night vision**
1. In a dark room, confirm no white or blue light reaches any screen, including sheets.
2. Note what stays unthemed: system alerts, the keyboard and the Photos picker.

**Purchases, with the included StoreKit configuration**
1. Buy, restore, cancel, and let a subscription expire.
2. Simulate billing retry and grace period, and refund a purchase.
3. Confirm that the sky works throughout, including offline.

**Performance**
1. Measure frame rate with 118,000 stars on the oldest supported iPhone.
2. Profile memory across sensor and AR sessions, and check for leaks.
