# Feature Status

Last updated 2026-11-01.

**The app has never been built by Xcode or run on anything.** It was developed on Windows, where no iOS SDK exists. Read every status below with that in mind.

| Status | Meaning |
|---|---|
| **Tested** | Automated tests ran and passed, under Swift 6.4.2 compiled to WebAssembly. Applies to logic in `SkyLensKit`, not to any iOS behaviour. |
| **Implemented** | Code is written and type-checked against hand-written stand-ins for Apple's frameworks. It has never compiled against the real SDK or executed. Expect compile errors and behavioural bugs on first build. |
| **In Progress** | Partly built. The gap is stated. |
| **Blocked** | Waiting on something this environment can't provide. |
| **Not Started** | No code exists. |

## Stage gates

| Stage | Gate | State |
|---|---|---|
| 1. Astronomy foundation | Real sky renders with correct positions | **Partly met.** Positions are proven against JPL Horizons, and a software renderer shows the correct sky. The Metal renderer has never drawn a frame. |
| 2. Core experience | All core journeys work end to end | **Not met.** No journey has been run. |
| 3. Release-ready MVP | Functional, testable iOS product | **Not met.** Code exists, unverified. |
| 4. Extended features | Each completed feature integrated and tested | **Not started**, because the gates above aren't met. |
| 5. Production hardening | Audits complete | **Not started.** `LICENSES.md` is an early license audit. |

## Definition of Done (Section 28)

| # | Criterion | State |
|---|---|---|
| 1 | Valid native iOS project | Implemented. Project references were checked by script, and Xcode has not opened it. |
| 2 | Compiles in Xcode | **Blocked:** needs macOS and Xcode |
| 3 | Users can complete onboarding | Implemented |
| 4 | Sky displays real objects | Data **Tested**, Metal rendering Implemented |
| 5 | Sky responds to touch | Camera math **Tested**, gestures Implemented |
| 6 | Sensors affect orientation on hardware | **Blocked:** needs a device |
| 7 | Search returns real objects | **Tested** |
| 8 | Object Detail shows accurate data | Data **Tested**, screen Implemented |
| 9 | Find in Sky uses calculated positions | Logic **Tested**, animation Implemented |
| 10 | Time Travel changes positions | Logic **Tested**, panel Implemented |
| 11 | AR works on hardware | **Blocked:** needs a device |
| 12 | Tonight is meaningful | Logic **Tested**, screen Implemented |
| 13 | Favorites persist | **Tested** |
| 14 | Events and notifications work | Events **Tested**, delivery Implemented |
| 15 | Settings persist | **Tested** |
| 16 | StoreKit paths implemented and testable | Rules **Tested**, StoreKit calls Implemented |
| 17 | All visible controls have real behaviour | Reviewed by hand, unverified by use |
| 18 | Interface is visually coherent | **Blocked:** no screen has ever been seen |
| 19 | No fake data presented as real | Enforced by tests where possible |
| 20 | Major flows have tests | UI tests written, never run |

## Features

### Astronomy and data

| Feature | Status | Notes |
|---|---|---|
| Julian date, sidereal time, coordinate transforms | Tested | |
| Topocentric positions: Sun, Moon, planets | Tested | Within 37″ of JPL Horizons, 1805 to 2199, six sites |
| Altitude and azimuth with refraction | Tested | Geometric and apparent kept as separate values |
| Rise, transit, set | Tested | Within 2 minutes of USNO, including polar cases |
| Twilight stages | Tested | |
| Moon phase, quarters | Tested | Against 149 USNO phases |
| Eclipses, oppositions, elongations, conjunctions, seasons | Tested | |
| Star catalog, 118,217 Hipparcos stars with proper motion | Tested | |
| 88 constellations, figures, IAU boundaries | Tested | All 893 figure vertices resolve to catalog stars |
| Messier (110), NGC/IC (1,531), Magellanic Clouds | Tested | |
| Search, typo tolerance, designations | Tested | |
| SGP4 satellite propagation | Tested | Under 1 m from satellite.js. Near-Earth orbits only, deep space refused |
| Pass prediction, Earth shadow, stale-data refusal | Tested | |

### Sky View

| Feature | Status | Notes |
|---|---|---|
| Metal star, line, background, marker and label rendering | Implemented | Shaders parse under Clang with a stand-in header |
| Stereographic and rectilinear projection | Tested | |
| Milky Way glow from catalog star density | Implemented | Never seen. May need tuning |
| Horizon and translucent ground | Implemented | No landscape imagery |
| Drag, pinch, tap, double tap, long press | Implemented | |
| Compass tracking and attitude solving | Implemented | Math Tested. Device convention self-corrects at runtime |
| Magnetic-north fallback, compass warnings, manual alignment | Implemented | |
| Constellation artwork | **Not Started** | Needs original or licensed art, so the toggle is omitted |

### Screens

| Feature | Status | Notes |
|---|---|---|
| Onboarding (six steps) | Implemented | |
| Explore and Search | Implemented | |
| Object Detail, all categories | Implemented | Text and data only: **no images or illustrations yet** |
| Find in Sky with guidance arrow | Implemented | |
| Time Travel | Implemented | Clock logic Tested |
| Tonight | Implemented | Ranking Tested |
| Events and calendar | Implemented | Calculation Tested |
| Favorites and Sky Tags | Implemented | Persistence Tested |
| Settings, location picker, data sources, licenses | Implemented | |
| Appearance panel | Implemented | |
| Night vision across the interface | Implemented | System alerts and keyboards stay outside the theme |
| AR camera | Implemented | Lens-matching math Tested. Alignment needs a real sky |
| Dark-sky map | Implemented | NASA night lights, deliberately no Bortle class |
| Satellites and passes | Implemented | |
| Paywall and StoreKit 2 | Implemented | Entitlement rules Tested |
| Weather (MET Norway) | Implemented | Parser Tested against a real response |
| Notifications | Implemented | Planning Tested |

### Known gaps in Stage 1 to 3 scope

| Gap | Status |
|---|---|
| Alerts for saved-object observing windows | **Not Started** |
| Satellite pass alerts: passes appear as events, but Settings has no toggle for them | In Progress |
| "Add Alert" on Object Detail: reminders exist on Events only | In Progress |
| Interface in large Dynamic Type: semantic fonts are used, layouts unchecked | In Progress |
| Performance measurement: **no frame rate has ever been measured** | Blocked |
| Sun and Moon surface detail: drawn as shaded discs | Not Started |

### Stage 4 (Section 21)

All **Not Started**, on purpose. The build order forbids these until the core is stable, and the core has not run yet.

Guided Tours · Solar System 3D Explorer · Astrophotography Assistant · AI Assistant · Telescope Support · Apple Watch · Widgets and Live Activities · Spectral Views · Shared Sessions · Education Module · Advanced AR

## Required before release

| Item | Why |
|---|---|
| Xcode build, then fix what it finds | Nothing has compiled against the real SDK |
| Apple Developer team and bundle ID | Signing. `com.skylens.app` is a placeholder |
| Real contact in `AppLinks.userAgent` | MET Norway's terms require one |
| Hosted privacy policy, set in `AppLinks.privacyPolicy` | App Store requirement. The link stays hidden until then |
| App Store Connect subscription products | IDs must match `StoreService` |
| Legal review of `LICENSES.md` open items | Some catalog terms need confirming for commercial use |
| Device testing of compass, AR and red mode | See `TESTING.md` |
