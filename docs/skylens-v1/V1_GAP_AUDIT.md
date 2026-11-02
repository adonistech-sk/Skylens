# SkyLens V1 — Gap Audit

Audited from the repository on 2026-11-01. Baseline commit `ff8ab8e`, tagged `skylens-v1-stage0-baseline`, which matches `origin/skylens-rn`. Paths are relative to the repository root. The **After Stage 1** table at the end shows what later commits changed. The baseline tables stay as recorded.

## Status terms

| Status | Meaning |
|---|---|
| `VERIFIED_IMPLEMENTED` | Code exists and a test or CI run proves the behaviour |
| `PARTIAL` | Some of the requirement exists. The gap is named |
| `MISSING` | No code in the React Native app |
| `BLOCKED` | Cannot proceed without a licence, an account or hardware |
| `NOT_TESTED` | Code exists, but nothing has proved it works |

## What was actually run at baseline

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npx vitest run` | 48 of 48 |
| `node scripts/web-flows.mjs` | 14 of 14 in headless Chrome |
| iOS CI, `rn-ios.yml` | Passed on `67fc7b3` (run 41337599587). Run 41343346541 on `ff8ab8e` was in progress during this audit |
| TestFlight, `rn-testflight.yml` | Run 41332984654 uploaded commit `1329019`. The owner installed it and rated it OK. No frame rate or per-feature results were recorded |
| Physical iPhone measurements | `DEVICE_NOT_TESTED`: none exist |

## Reported baseline against what is really there

| PRD claim | Finding |
|---|---|
| 41,411 stars | **Confirmed**, `skylens-rn/src/data/generated/stars.ts`. The source holds 118,217 (`Packages/SkyLensKit/Sources/SkyCatalog/Resources/stars.bin`) and the app cuts at V 8.0 |
| Stars "rendered" | At the default 46° view about 3,000 pass the limit. Every frame scans the table linearly and allocates 331 KB (`renderer.ts:456`) |
| Tap reaches every drawn star | **False.** `hitTest` stops at the 6,000 brightest (`scene.ts:96`), so faint zoomed stars can't be selected |
| 88 constellations | **Confirmed** (`tests/logic.test.ts`, 893 vertices). Boundary polygons exist in the source but `scripts/build-data.mjs` drops them |
| 1,643 deep-sky objects | **Confirmed** in the catalog. Only Messier plus curated objects are ever drawn (`scene.ts:130`) |
| Skia renderer | **Confirmed**: one `SkPicture` per frame on the JS thread, with a runtime shader for the sky |
| JPL validation | 378 Horizons fixtures pass, worst 36.5″ J2000 and 18.1″ alt/az. New fixtures below add apparent positions |

## WP1 — Advanced Planetarium

| ID | Status at baseline | Evidence and gap |
|---|---|---|
| SKY-001 Rendering and projections | `PARTIAL` | `src/features/sky/renderer.ts`, `src/astronomy/camera.ts`, `tests/logic.test.ts`. Sound, but no 5 × 5 × 3 fixture set. **Defect:** bodies drawn with refraction, stars and selection ring without, up to 35.85′ apart near the horizon |
| SKY-002 Three sky modes | `MISSING` | No mode concept in `src/state/store.ts` |
| SKY-003 Catalogs and LOD | `MISSING` | No spatial index, no tiles, no pack loading. Single in-memory table |
| SKY-004 Constellation lines, boundaries, art | `PARTIAL` | 88 line sets. No boundaries on screen. Art for Orion only (`artwork.ts`). All 88 searchable (`search.ts`) |
| SKY-005 Milky Way | `VERIFIED_IMPLEMENTED` | `skyShader.ts` looks up a J2000 all-sky map per pixel. Colour grade is marked as artistic. Rights note in the source matrix |
| SKY-006 Atmosphere and horizon | `PARTIAL` | Day, twilight, ground, labelled night preview are done and flow-tested. No atmosphere toggle. Refraction inconsistent, see SKY-001 |
| SKY-007 Layer manager | `PARTIAL` | 8 switches, no groups, no magnitude cutoff, no grids, no presets. `satellites` and `orbit trails` have no data in this app |
| SKY-008 Selection and Find in Sky | `PARTIAL` | Works for bright objects. Faint stars not selectable. Deep-sky objects can be tapped while not drawn. No off-screen direction guide |
| SKY-009 Gesture and sensor quality | `PARTIAL` | Drag, glide, double tap are done. **Pinch zooms about the screen centre, not the fingers.** Double tap ignores the tap point. Pinch untested. Compass `NOT_TESTED` on hardware |
| SKY-010 FOV preview | `MISSING` | P1, Stage 5 |

## WP2 — Discovery

| ID | Status | Evidence and gap |
|---|---|---|
| DISC-001 Canonical search | `VERIFIED_IMPLEMENTED` | `src/data/search.ts`, `tests/logic.test.ts`: M31 = NGC 224 = Andromeda Galaxy, typos. Recents absent |
| DISC-002 Object Details | `PARTIAL` | `src/app/object/[id].tsx`. One layout with conditionals. No Gallery, Related, or observing plot |
| DISC-003 Sky contextual sheet | `MISSING` | Stage 2 |
| DISC-004 Explore categories | `PARTIAL` | `src/app/explore.tsx`, `category/[key].tsx`. No satellites |
| DISC-005 Favorites and lists | `PARTIAL` | Favorites persist. No observing lists, no reorder |
| DISC-006 Sky tags | `MISSING` | P1 |
| DISC-007 Articles and gallery | `PARTIAL` | Credits in `src/data/credits.ts`. No versioned articles |

## WP3 — Solar System

| ID | Status | Evidence and gap |
|---|---|---|
| SOL-001 3D Solar System | `PARTIAL` | Built, Stage 3. Web and logic evidence, iOS pending |
| SOL-002 Planet and moon details | `PARTIAL` | Planets via Object Detail. Natural satellites absent |
| SOL-003 Moon Atlas | `PARTIAL` | Built, Stage 3. Rights recorded per file. Web and logic evidence, iOS pending |
| SOL-004 3D object explorer | `MISSING` | P1 |

## WP4 — Live Universe

| ID | Status | Evidence and gap |
|---|---|---|
| LIVE-001 Satellites and passes | `MISSING` | Exists only in the SwiftUI app. CelesTrak redistribution is on HOLD |
| LIVE-002 Comets and asteroids | `MISSING` | P1 |
| LIVE-003 Event calendar | `PARTIAL` | `src/astronomy/events.ts`, `tests/logic.test.ts`. Computed, with fixture checks. Meteor values come from the IMO list, which the audit marks HOLD |
| LIVE-004 Notifications | `MISSING` | P1 |

## WP5 — Observing

| ID | Status | Evidence and gap |
|---|---|---|
| OBS-001 Tonight 2.0 | `PARTIAL` | `src/astronomy/tonight.ts`, polar cases tested. No weather field and none invented |
| OBS-002 Observation Planner | `MISSING` | Stage 5 |
| OBS-003 Dark Sky Map | `BLOCKED` | Licensed layer not selected |
| OBS-004 Weather | `BLOCKED` | Provider contract not selected. MET Norway exists in Swift only |
| OBS-005 Astrophotography Planner | `MISSING` | P1 |
| OBS-006 Observation Log | `MISSING` | P1 |

## WP6 — Guided

| ID | Status | Evidence and gap |
|---|---|---|
| GUIDE-001 Tours | `MISSING` | Stage 6 |
| GUIDE-002 Constellation stories | `PARTIAL` | Meanings in `editorial.json`. No stories |
| GUIDE-003 Collections | `MISSING` | P1 |

## Journeys

| Journey | Status | Evidence and gap |
|---|---|---|
| J01 Identify outdoors | `PARTIAL` | Flow-tested with touch. Compass `NOT_TESTED` on hardware. No observing list |
| J02 Explore a constellation | `PARTIAL` | Orion only. No constellation tap on the sky |
| J03 Deep Atlas search | `MISSING` | Search IDs work. No Deep Atlas |
| J04 Tonight to Observe | `PARTIAL` | No altitude graph, plan or reminder |
| J05 Time Travel | `VERIFIED_IMPLEMENTED` | iOS flow `maestro/02_time_travel.yaml`, one clock in `store.ts` |
| J06 Planet and Moon | `PARTIAL` | Web flows pass, Stage 3. iOS pending |
| J07 Satellite pass | `MISSING` | Stage 4 |
| J08 Guided tour | `MISSING` | Stage 6 |
| J09 Photo planning | `MISSING` | Stage 5 |
| J10 Denied permissions | `PARTIAL` | Manual location tested. Real denial `NOT_TESTED` on iOS |

## Performance, QA and release

| Requirement | Status | Note |
|---|---|---|
| Frame time, memory, battery budgets | `BLOCKED` | Needs a physical iPhone. No instrumentation at baseline |
| Airplane-mode E2E | `NOT_TESTED` | The sky has no network code, so it should pass. Unproven on hardware |
| VoiceOver, Dynamic Type, Reduce Motion | `NOT_TESTED` | Reduce Motion read in code, never exercised |
| StoreKit purchase and restore | `BLOCKED` | No sandbox products |
| Privacy policy URL | `MISSING` | In-app draft only |
| Which app owns `sk.skylens.app` | `BLOCKED` | SwiftUI and Expo apps share it. Owner decision |

## Handoff claims that do not match the repository

| Claim in the pack | Reality |
|---|---|
| `skydata/build_catalogs.py`, `fixtures/rights.json` | Not in this repository |
| TypeScript `visibleTiles`, `fetchVisibleStars`, `TileStorage` | Not in this repository |
| "Actual SkyLens repository not accessible" | Superseded: this audit is that access |
| `1ada5b36-…png`, `Screenshot 2026-11-01 15*.png` | Not in the pack. `visuals/approved_existing_design.png` and `skylens_rn_implementation_pack/` were used |
| `docs/skylens-v1/` already present | It was still in `SKYLENS_V1_UNIFIED_HANDOFF.zip`. Extracted to the documented path |

## After Stage 1

Evidence here is logic tests and web flows on Windows unless a row says otherwise. Nothing below has run on a physical iPhone, so no row can be `VERIFIED_IMPLEMENTED` for device behaviour.

| ID | Status now | Evidence | Still open |
|---|---|---|---|
| SKY-001 | `VERIFIED_IMPLEMENTED` in logic | `tests/validation.test.ts`: 5 sites × 5 dates × 3 FOVs, worst 1.20 pt. Frame defect fixed | Captures on iOS |
| SKY-002 Modes | `PARTIAL` | `src/state/skyModes.ts`, flows prove three different skies with Rigel unmoved, persistence and per-mode layers | iOS run, Reduce Motion exercised |
| SKY-003 Catalogs and LOD | `PARTIAL` | `src/data/catalogs/`, 0 missed of 304,931, pack loads by tile on a real pinch, bounded cache | Gaia on HOLD, so 118,217 stars, not 250k+. Device load test |
| SKY-004 Boundaries and art | `PARTIAL` | Boundaries drawn, 1,498 of 1,500 agree with the engine, tap on a constellation name selects it | Art for Orion only. No constellation story |
| SKY-005 Milky Way | `VERIFIED_IMPLEMENTED` | Unchanged | Label of simulated colour |
| SKY-006 Atmosphere | `PARTIAL` | Atmosphere layer, airless sky labelled on screen, one drawing frame | Refraction not applied to the map, by decision 11 |
| SKY-007 Layers | `PARTIAL` | `LayersPanel.tsx`: 18 layers, 3 sliders, Reset, per-mode. Flows change the picture for every switch | No presets beyond the three modes. Satellites and trails need data |
| SKY-008 Selection | `PARTIAL` | Hit test matches what is drawn, faint and pack stars selectable, Locate, Learn, Save, off-screen guide | Long press. Device gesture accuracy |
| SKY-009 Gestures | `PARTIAL` | Pinch and double tap about the fingers. Real two-finger web pinch moved the star 0.00 pt | `DEVICE_NOT_TESTED`. Web has a half-step skew at pinch start, see `V1_STAGE1_REPORT.md`. Compass untested on hardware |
| SKY-010 FOV preview | `MISSING` | | Stage 5 |
| J02 Constellation | `PARTIAL` | Name tap selects the constellation, labels increase with zoom | Art for 87 constellations, story |
| J03 Deep Atlas search | `PARTIAL` | Flow: NGC 224 in Deep Atlas finds M31 and centres it | FOV overlay is SKY-010, Stage 5 |

Added for the PRD's stage gate:

| Stage 1 "done when" | State |
|---|---|
| Core map responds in all three modes | Web and logic, iOS pending |
| Positions match reference fixtures | **Met**, `V1_SCIENCE_VALIDATION.md` |
| One deeper pack loads incrementally without blocking | Met on web. iOS file reading is new and unproven |
| Controls change actual data, no inert toggles | **Met** on web: every switch proven by flow, sliders by limit value |
| No static background passing as a star map | **Met**, the map is registered per pixel to J2000 |
| Screenshots of Observe, Explore, Deep Atlas, daytime, selection | Web in `evidence/stage1/`. Device captures pending |
| Actual frame timings and memory | **Not met** on hardware. Instrument is in the Layers panel |
| Source and asset licensing recorded | **Met** as records, `V1_SOURCE_MATRIX.md`. Rights decisions stay open |

## After Stage 2

Evidence is logic tests and web flows on Windows. Nothing here has run on iOS, so device behaviour stays unproven. Risks are listed in `V1_STAGE2_REPORT.md`.

| ID | Status now | Evidence | Still open |
|---|---|---|---|
| DISC-001 Search | `VERIFIED_IMPLEMENTED` in logic | `src/data/search.ts`, `tests/search-v1.test.ts`: all 76,806 pack stars found exactly, recents, categories | Pack stars have numbers and 43 names only, because the source has nothing else |
| DISC-002 Object Details | `PARTIAL` | `src/data/objectFacts.ts`, `src/features/detail/AltitudeChart.tsx`, type-specific facts, related objects | Gallery needs more cleared images. No comet, asteroid or satellite layout, because those objects don't exist yet |
| DISC-003 Sky panel | `PARTIAL` | `src/features/sky/SkySheet.tsx`, three detents, drag, flick, tap outside, close, VoiceOver actions, flows | iOS gestures and keyboard unproven |
| DISC-004 Explore | `PARTIAL` | Unchanged | Satellites wait for Stage 4 |
| DISC-005 Favorites and lists | `VERIFIED_IMPLEMENTED` on web | `src/state/lists.ts`, `src/app/list/[id].tsx`: create, rename, reorder, delete, reload, damaged-save recovery | Restart on iOS unproven |
| SKY-008 Selection | `PARTIAL` | Long press, neighbour list, step arrows, faint-star route to Deep Atlas, constellation highlight, turn-by-turn text | Device accuracy |
| SKY-009 Gestures | `PARTIAL` | Flows cover long press, drag after long press, pan with the panel open, pinch, tap | `DEVICE_NOT_TESTED` |
| J01 Identify | `PARTIAL` | List and favorites added | Compass on hardware |
| J02 Constellation | `PARTIAL` | Highlight, boundary, related stars | Art for 87 constellations, story |
| J03 Deep Atlas search | `PARTIAL` | Search reaches every star, faint star routes to Deep Atlas at a view that draws it | FOV overlay, Stage 5 |
