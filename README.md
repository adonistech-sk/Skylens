# SkyLens

A native iOS astronomy app. Point your iPhone at the sky to identify stars, planets and constellations from real ephemeris calculations.

> **Status:** Stages 1 to 3 are code-complete and **have never been built in Xcode or run**. The astronomy logic is tested, the iOS layer is not. See [FEATURE_STATUS.md](FEATURE_STATUS.md).

## Requirements

- Xcode 16 or later, on macOS
- iOS 18 or later, iPhone
- A real iPhone for compass and AR

There are no third-party Swift packages to fetch. The only package is local.

## Getting started

1. Open `SkyLens.xcodeproj`.
2. Select the **SkyLens** target, then under **Signing & Capabilities** choose your team. Change the bundle ID if needed.
3. Choose an iPhone simulator or a device, and run.

Expect to fix some compile errors on the first build, because the app was written without access to the iOS SDK. Most should be small API mismatches. See [TESTING.md](TESTING.md) for why.

## No Mac? Put it on your iPhone anyway

[INSTALL_ON_IPHONE.md](INSTALL_ON_IPHONE.md) walks through building on GitHub's macOS runners and installing through TestFlight. It needs an Apple Developer account and a GitHub account, and nothing else.

## Browser preview

To see SkyLens without a Mac, double-click `Run-SkyLens-Preview.cmd`, or run `node Tools/web-preview/server.mjs`, and open <http://localhost:5173>. Press F12 and use the device toolbar to try different screen sizes.

This is a development preview, not the iOS app. Positions, search, Tonight and events come from the real `SkyLensKit` engine, but the interface is a separate web version written for layout review. Compass, AR, subscriptions and notifications exist only in the iOS app.

If the engine isn't built, run these from Git Bash with `SKYLENS_TOOLS` set (see [TESTING.md](TESTING.md)):

```sh
. Tools/wasm-check/env.sh
node Tools/wasm-check/check.mjs --build
node Tools/web-preview/build.mjs
```

## Tests

```sh
swift test --package-path Packages/SkyLensKit
```

In Xcode, ⌘U runs the app's unit and UI tests. `.github/workflows/ci.yml` runs both on GitHub's macOS runners, which gives you a real Xcode build without owning a Mac once the repo is on GitHub.

On Windows, the package can be built and tested through WebAssembly. See [TESTING.md](TESTING.md).

## Configuration

| Item | Where | Needed for |
|---|---|---|
| Team and bundle ID | Xcode target | Running on a device |
| Contact in `userAgent` | `SkyLens/App/SkyLensApp.swift` | MET Norway terms, before release |
| Privacy policy URL | `AppLinks.privacyPolicy` | App Store submission |
| Subscription products | App Store Connect | Real purchases. IDs are in `StoreService` |

Purchases work in development through `SkyLens/Resources/SkyLens.storekit`, which the shared scheme already uses.

No API keys are needed.

## External services

MET Norway provides weather, CelesTrak provides satellite orbits, and NASA GIBS provides night-lights map tiles. Each one is optional at runtime: if it fails, that feature says so and everything else keeps working. There is no backend, account or analytics.

## Rebuilding data

```sh
sh Tools/catalog-builder/fetch.sh raw/                 # download primary sources
node Tools/catalog-builder/build.mjs raw/              # regenerate bundled catalogs
node Tools/catalog-builder/make-icon.mjs               # regenerate the app icon
node Tools/reference-data/fetch.mjs                    # refresh JPL and USNO fixtures
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): how it's built and why
- [FEATURE_STATUS.md](FEATURE_STATUS.md): what's done, tested and blocked
- [TESTING.md](TESTING.md): test evidence and manual checks
- [LICENSES.md](LICENSES.md): data and code licensing, including open questions
