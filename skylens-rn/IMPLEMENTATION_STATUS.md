# Implementation Status

Last updated 2026-11-01. Baseline device: iPhone 17 Simulator, iOS 26.2, on GitHub Actions `macos-26`.

**Everything marked iOS below was verified on commit `ff8ab8e`, run 41343346541.** Later commits and uncommitted work in this tree have no iOS evidence yet.

| Status | Meaning |
|---|---|
| **Tested iOS** | Ran in the iOS Simulator in CI |
| **Tested web** | Ran in the web build under Chrome. Same code, not iOS |
| **Tested logic** | Automated tests under Node |
| **Built** | Compiles and appears on screen; the behaviour itself is unproven |
| **Blocked** | Needs something CI can't provide |

## Evidence

| Check | Result |
|---|---|
| Native iOS build, Expo SDK 58, RN 0.88 | **Passes**, 9 runs of 9 |
| Typecheck and unit tests | Clean, **48 passed** at `ff8ab8e` |
| JPL Horizons, 378 cases | Worst 36.5″ and 18.1″, identical to Swift |
| USNO rise, set, twilight, 149 phases, seasons | Passed |
| Browser flows (`scripts/web-flows.mjs`) | 14 of 14 at last run, before `ff8ab8e` |
| iOS flows, run 41343346541 (`ff8ab8e`) | **5 of 5 pass:** search and Find in Sky, Time Travel, location changes Tonight, onboarding and tabs, tap and drag |
| iOS screenshots | 12 screens, in `design/ios-baseline/` with side-by-side comparisons |

## Gates

| Gate | State | Proof |
|---|---|---|
| 0. Audit and spike | Done | `../MIGRATION_AUDIT.md`, booting iOS build. Path A spike not run, reasons recorded |
| 1. Design foundation | Done | Tokens, type, components, onboarding and location in `design/visual_audit.md` |
| 2. Main sky | Done on Simulator | Tap selects a star and drag moves the sky on iOS. Frame rate unmeasured, pinch untested |
| 3. Object Detail and Explore | Done on Simulator | Andromeda flow passes on iOS |
| 4. Tonight, Time Travel, Events | Done on Simulator | Time Travel and location flows pass on iOS. Event screen captured, event opening untested on iOS |
| 5. AR, subscription, hardening | **Not met** | See below |

## Features

| Feature | Status |
|---|---|
| Ten screens as native UI | Tested iOS (screenshots) |
| Search, typos, designations | Tested iOS, Tested logic |
| Object Detail and Find in Sky | Tested iOS |
| Favorites | Tested iOS within a session. Survival across restart Tested web only |
| Time Travel: forward, play, pause, Now | Tested iOS |
| Location change alters Tonight | Tested iOS |
| Onboarding to manual location | Tested iOS up to the sky. **Use Current Location and permission denial untested on iOS** |
| Deep link during a cold start | **Can be lost.** In screenshot mode the first link of a fresh install lost to the start-up redirect. Normal mode untested |
| Tonight planner | Tested logic, Tested iOS (rendered) |
| Events and calendar | Tested logic. Calendar screen is Built |
| Night vision | Built, not reviewed |
| Star map tap and drag | Tested iOS. **Pinch has no test** |
| Compass mode | Built. **Blocked:** needs a device |
| AR camera, overlay, photo capture | Built. **Blocked:** needs a device. VISUAL NOT VERIFIED |
| StoreKit purchase and restore | Built. **Blocked:** no sandbox products or StoreKit config in this project. Pro gating Tested web |
| Notifications, weather, satellites, dark-sky map | **Not ported.** Exist only in the SwiftUI app |

## Required before release

| Item | Why |
|---|---|
| Real-iPhone test of compass, AR and frame rate | None has ever been measured |
| Decide which app owns `sk.skylens.app` | The Expo and SwiftUI apps share it |
| Sandbox purchase test | No real purchase has been made |
| Privacy policy URL | The in-app page is a draft, not a hosted policy |
| Dynamic Type, small and large screens | Unchecked |
| License items in `ASSET_CREDITS.md` and `../LICENSES.md` | Need a human decision |
| Merge decision | Work is on `skylens-rn`, not `main` |

## Design lock work

Committed as `1329019`, with fixes up to `ff8ab8e`. Details are in `VISUAL_COMPARISON.md`, `TESTING.md`, `ANIMATION_CHECKLIST.md` and `DESIGN_LOCK.md`.

| Area | Status |
|---|---|
| All ten screens corrected against the references | Tested iOS (screenshots). See `design/visual_audit.md` |
| Sky: Orion art, 41,411 catalog stars, Milky Way grade, compass dome | Tested iOS. Frame rate and start-up cost unmeasured on a device |
| Tap selection and pan | Tested iOS, flow 05 |
| Glide and layers | Tested web |
| Pinch | Built, untested |
| Daytime and twilight sky with a labelled night preview | Tested web |
| Framing landscape | Tested iOS (rendered). Artistic layer, not the true horizon, and can be turned off |
| Paywall pricing slot and honest unavailable state | Unavailable state Tested iOS (screenshot). Plan cards Built, because no products load |
| Motion system | Tested web by final states. Reduce Motion read in code, not exercised. Of 17 transitions, 4 are partial and 2 are not done: see `ANIMATION_CHECKLIST.md` |
| Small and large iPhone layouts | Spot-checked on web at 375×667 and 440×956 |

At `ff8ab8e`: typecheck clean and 48 of 48 unit tests. The 14 web flows last ran before `ff8ab8e`, which changed no behaviour they cover.

## SkyLens V1 Stage 1

On commit after `2cb0682`. Plans, audit and results are in `../docs/skylens-v1/`. Web and logic evidence unless stated. **No iOS run yet.**

| Area | Status |
|---|---|
| Observe, Explore, Deep Atlas | Tested web, Tested logic |
| Layers panel, 18 layers, 3 sliders, per-mode persistence | Tested web. Every switch changes the picture |
| Spatial index, 1,536 cells, flag `catalogsV1` | Tested logic: 0 missed of 304,931 |
| Deep star pack, 76,806 Hipparcos stars, flag `deepPack` | Tested web, Tested logic. iOS file reading unproven |
| Grids, boundaries, atlas symbols, readout | Tested web, Tested logic |
| Label decluttering | Tested logic |
| Selection card, off-screen guide, constellation name tap | Tested web |
| Pinch and double tap about the fingers | Tested web, Tested logic. **Not tested on iOS** |
| Rollback in More → Sky engine | Tested web |
| Frame time, memory, battery on an iPhone | **Blocked:** needs a device |

## SkyLens V1 Stage 2

Web and logic evidence unless stated. **No iOS run.** Results and iOS risks are in `../docs/skylens-v1/V1_STAGE2_REPORT.md`.

| Area | Status |
|---|---|
| Sky panel, three detents | Tested web, Tested logic. iOS gestures unproven |
| Universal search, 118,217 stars | Tested logic, Tested web |
| Selection card, long press, step arrows | Tested web |
| Rich object detail, altitude chart, related objects | Tested web, Tested logic |
| Find in Sky with moving targets and directions | Tested logic, Tested web. Compass untested |
| Contextual discovery | Tested logic, Tested web |
| Lists | Tested web, Tested logic |
