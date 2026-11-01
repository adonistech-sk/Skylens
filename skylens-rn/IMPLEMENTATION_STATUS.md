# Implementation Status

Last updated 2026-11-01. Baseline device: iPhone 17 Simulator, iOS 26.2, on GitHub Actions `macos-26`.

**Everything marked iOS below was verified on commit `073ae42` or `44f42bc`.** Uncommitted design work in this working tree has had no iOS build. See the last section.

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
| Native iOS build, Expo SDK 58, RN 0.88 | **Passes**, 4 runs of 4 |
| Typecheck and unit tests | **46 passed** at last local run |
| JPL Horizons, 378 cases | Worst 36.5″ and 18.1″, identical to Swift |
| USNO rise, set, twilight, 149 phases, seasons | Passed |
| Browser flows (`scripts/web-flows.mjs`) | 8 of 8 at last run on committed behaviour |
| iOS flows, run 41321155246 (`44f42bc`) | **3 of 4 pass.** Flow 04 stops on a test assertion: the row is on screen, but its label holds more text |
| iOS flow 04 after that assertion, and flow 05 (tap, drag) | **Result not collected** |

## Gates

| Gate | State | Proof |
|---|---|---|
| 0. Audit and spike | Done | `../MIGRATION_AUDIT.md`, booting iOS build. Path A spike not run, reasons recorded |
| 1. Design foundation | Done | Tokens, type, components, onboarding and location in `design/visual_audit.md` |
| 2. Main sky | Partly | Renders on iOS with real data. **Tap and drag on iOS not yet confirmed.** Frame rate unmeasured |
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
| Tonight planner | Tested logic, Tested iOS (rendered) |
| Events and calendar | Tested logic. Calendar screen is Built |
| Night vision | Built, not reviewed |
| Star map tap, drag, pinch | **Flow written, result not collected.** Pinch has no test |
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

## Uncommitted work

A separate design session left changes across the renderer, type, screens, motion and images. They are in the working tree only, are not in any commit, and **have no iOS evidence**. Its findings belong in the section it adds below.
