# SkyLens V1 — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-11-01  
**Owner:** SkyLens product  
**Platform:** iOS-first, React Native + Expo + TypeScript with native modules when warranted  
**Status:** Product scope proposed for implementation; existing-code audit, source licences, device performance and user validation remain required.  
**Design authority:** Approved SkyLens dark navy / editorial serif / copper-peach 10-screen showcase, not a new stylistic direction.  
**Source-of-truth rule:** Do not mark any existing feature as verified on the basis of a previous AI summary. Inspect implementation and test output.

---

## 1. Executive product mandate

**Mission:** Help a person SEE, FIND, UNDERSTAND and OBSERVE the real sky from their actual position and time, while offering an unusually rich way to explore objects, the Solar System and deep space.

**V1 positioning:** A premium, scientifically credible, immersive astronomy experience combining an accurate planetarium, astronomical atlas and practical observation planning. Competitor references are *functional benchmarks*, not licences to reproduce protected assets, branding or proprietary code.

**Product differentiator to prove:** An integrated, low-friction **SkyLens Discover** flow taking a beginner from “what's in the sky?” to “I found it / I learned about it / I can observe it again.” This differentiator is a hypothesis, not established PMF.

**V1 non-goals:** Full parity with every professional telescope ecosystem; proprietary planetary ephemeris research; reproducing 1.7 billion stars locally; social network; fully featured conversational/voice Aura clone; unsupported universal telescope control; automatic AI photo enhancement. No fake completed screens.

**Product principles:**
1. The real sky is the product, not an image wallpaper.
2. One authoritative astronomical state (`time`, `observer`, `coordinateFrame`) across all views.
3. Progressive disclosure: simple Observe mode; rich Explore; technical Deep Atlas.
4. Visually immersive, yet never misleading: separate physically predicted naked-eye appearance from intentionally enhanced visualization.
5. A feature is complete only with correct data, real interaction, graceful failures and test evidence.
6. Existing production-capable React Native components are retained unless a measured technical reason requires change.

### 1.1 Users / jobs-to-be-done

| User segment | Primary job | Successful outcome |
|---|---|---|
| Curious beginner | Identify a bright object overhead | Finds it using map, understands what it is in under one short session |
| Regular stargazer | Decide what is worth observing tonight | Gets time-, place-, horizon- and condition-aware recommendations |
| Space enthusiast | Explore celestial objects in depth | Navigates images, scientific properties, relationships and 3D views |
| Astrophotography hobbyist | Plan a practical shot | Sees target altitude, Moon, timing and field of view |
| Amateur astronomer | Use a data-rich atlas | Controls layers, filters, magnitudes, FOV and observing lists |

---

## 2. Verified vs. reported baseline

The following is *reported by earlier development summaries*; it is NOT an independently inspected repository assessment:

| Area | Reported current state | Required audit |
|---|---|---|
| Sky rendering | 41,411 stars; 88 constellations; planets, Moon, Sun; Skia | Count loaded vs rendered; real coordinates; performance; day/night state |
| Deep-sky | 1,643 objects | Catalog provenance, coverage, deduplication, search |
| Tonight | Moon phase, Sun times, recommendations | Correct data derivation, high-latitude conditions, time zone |
| Explore | Categories and typo-tolerant search | Correct index, ranking, ID consistency |
| Object detail | Basic metadata, favorites, Find in Sky | All categories, correct units, visibility calculations |
| Time travel | Date/time, playback, speed | One global simulated-time state, chronological consistency |
| AR | Camera overlay, alignment, photo | Real-device accuracy, permissions, heading calibration |
| Events | Calendar and calculated events | Source, future dates, local relevance |
| Subscriptions | Paywall; no verified paid purchase | Real StoreKit sandbox test pending |
| Build | TestFlight reportedly available | CI logs, release identity, crash reports, device tests |

**Rule:** Create `V1_GAP_AUDIT.md` from actual repository inspection and label every item `verified / partial / missing / blocked / not tested` with evidence. Do not casually remove the old SwiftUI source or replace the existing Expo app.

---

## 3. Scope, priority and launch definition

**P0 — V1 core:** Critical astronomy map, Discover, rich object detail, expanded catalogs, 3D Solar System, Moon Atlas, satellite/ISS data, time travel, accurate Tonight and events, layers, AR basics, guided tours, observing lists, meaningful offline behavior.

**P1 — V1 premium expansion:** Advanced planning, dark-sky map with licensed data, FOV and astrophotography workflows, deep atlas extensions, comet/asteroid coverage, notification rules, curated illustration and gallery quality.

**P2 — post-V1 (unless validated and affordable):** Real-time AI voice assistant, universal telescope mount control, social sessions, automatic plate solving, advanced spatial AR portals, multiple sky cultures, Apple Watch expansion.

**V1 ship rule:** P0 finished with evidence, P1 commitments either done or explicitly absent from product marketing. No fake premium upsell. Deep catalogs are a capacity goal, not permission to ship incorrect data.

### Suggested measurable capacity targets (engineering goals, not claims)

- **Stars:** verified bright-star offline core; performance-test 250k+ indexed offline records and up to 2M optional/streamed records without ever trying to render all simultaneously. Actual bundled count depends on licence, disk/CPU/GPU budgets and UX.
- **Deep sky:** target >=30k valid deduplicated NGC/IC/Messier records for V1, with a curated high-quality subset of editorial articles and photographs.
- **Constellations:** all 88 line sets, valid IAU boundaries and names; optional original 2D illustrated layer for all 88 if assets and rights permit; prioritize polished animated artwork for 12–20 iconic patterns, avoid promising 88 bespoke 3D sculptures without assets.
- **Solar System:** Sun, eight major planets and Moon plus selected natural satellites with verified models and ephemerides; physically explicit size/distance scaling modes.
- **Satellites:** ISS and selected tracked constellations; expanding list through valid, recently refreshed orbit elements.
- **Moon:** tiled surface atlas with named features, phases, limb/orientation, illumination; feature count contingent on authoritative datasets and performance.

---

## 4. Navigation architecture and shared context

### 4.1 Main navigation

Primary destinations: **Sky**, **Tonight**, **Explore**, **Events**, **More**. Preserve the approved lower navigation visual treatment on appropriate screens. Sky itself is full-bleed without a permanent bulky navigation bar; its compact controls are contextual.

From the Sky, support three-stage contextual sheet:
- **Collapsed:** elegant single-row discovery/search handle that does not conceal the primary sky.
- **Half:** search, location/time, Tonight highlight, quick access to layers/tours and selected target.
- **Expanded:** richer categories, observing planner, contextual details, saved targets and event discovery.

The sheet must not imitate Night Sky's protected artwork/branding. Keep SkyLens copper/navy design language. Tap outside/drag changes detent. Background sky retains prior pan/zoom/time state.

### 4.2 Global application state

A single source of truth stores: `observationInstantUTC`, `isRealtime`, `observerLocation`, `deviceOrientation`, `viewCenter`, `fieldOfView`, `skyMode`, `selectedObjectId`, `visibleLayers`, `equipmentProfile`, `simulationSpeed`, `subscriptionEntitlements`.

All views **must derive** coordinates/visibility from this state; avoid separate stale calculations in Tonight, AR, Object Detail and Time Travel. User can reset clock to Now and change observing location explicitly.

### 4.3 Contextual destinations

Object Detail, Find in Sky, AR Sky, Map Layer Manager, Time Travel, 3D Solar System, planet detail, Moon Atlas, satellite/ISS detail, Guided Tour session, Observation Planner, Light Pollution Map, FOV Planner, Favorites/Tags, Search, Location Picker and Pro.

---

## 5. Definitive user journeys (E2E acceptance flows)

### J01 — Identify an object outdoors
1. Launch to Sky with last valid observer and real time; distinguish actual vs simulated mode.
2. Point device or pan manually, choose object; show selected name without losing spatial context.
3. Tap info -> category-specific detail -> `Find in Sky` -> directional guidance; warn about poor compass alignment.
4. Favorite or add to observation list; selection remains associated with canonical ID.
**Success:** no login, no internet necessary for bundled objects; above/below-horizon status is truthful.

### J02 — Explore a constellation
1. Switch to Explore sky mode; enable constellation lines/art.
2. Tap Orion (or any supported constellation); names, lines and transparent original art anchor to actual star geometry.
3. Zoom -> labels and nearby catalog objects increase adaptively.
4. Open constellation story and related stars -> return to identical sky context.
**Success:** illustration moves/rotates consistently with projection; can be disabled.

### J03 — Deep Atlas professional search
1. Switch to Deep Atlas.
2. Search `M31` / `NGC 224` / `Andromeda Galaxy` -> same object ID.
3. Choose FOV overlay and magnitude cutoff.
4. Zoom and pan; grid changes coherently; labels do not collide uncontrollably.
**Success:** IDs, coordinates and object references remain consistent across modules.

### J04 — Tonight to Observe
1. Open Tonight for observer and date.
2. Choose an object using visible time window + Moon/altitude/weather relevance.
3. Open altitude graph and `View in Sky`; choose best time or return to real time.
4. Add to observing plan and optional reminder.
**Success:** no recommendations of objects that never rise; missing weather is explicitly shown as unavailable.

### J05 — Time Travel
1. Change date/time and speed.
2. Sky, search, planet positions, Moon phase, related observations and events use selected simulation time.
3. Tap `Now`; realtime restored; timezone display stays coherent.
**Success:** all affected views update without ghost stale timestamps.

### J06 — Explore planet / Moon
1. Select Jupiter -> open rich detail and 3D viewer.
2. Rotate and examine orbital context; change simulated time.
3. Open selected major moon and jump back to sky.
4. Select Moon -> explore tiles and named lunar features.
**Success:** visualized scales identified as schematic when not physical; photo and texture credits available.

### J07 — Satellite pass
1. Search ISS -> see latest orbit-data timestamp and pass prediction for location.
2. Open sky map, animate predicted path, set optional reminder.
3. If orbit elements stale/offline, show last valid cache with limitations; no fictional live claim.
**Success:** pass prediction matches deterministic orbit propagator within documented tolerance for fresh elements.

### J08 — Guided tour
1. Tap `Discover tonight` -> create ordered list of genuinely relevant objects.
2. Step through directional instructions and short lessons; skip/pause/exit.
3. Resume from saved progress and save favorites.
**Success:** tour adjusts or declares unavailable when location/time changes.

### J09 — Photo planning
1. Choose target and equipment/camera parameters.
2. Show field-of-view on sky and timing/visibility.
3. Save a shot plan.
**Success:** calculation uses actual sensor/focal data or explicit manual entries; do not promise impossible iPhone photos.

### J10 — First install with denied permissions
1. Decline location and camera permission.
2. Choose city manually and explore accurate simulated sky.
3. AR entry explains camera need; settings can open permission controls.
**Success:** core planetarium remains usable without optional permissions.

---

## 6. Core modules and functional acceptance

### WP1 — Advanced Planetarium (`SKY-001` to `SKY-010`)

**SKY-001: Sky rendering and projections — P0**  
Build/retain a scientifically accurate, responsive full-sphere renderer. Observer-centric Alt/Az and equatorial positions, device orientation, proper motion/precession handled appropriately, aspect and device rotation. Separate labels and scenery layers from celestial source positions.  
**Accept:** deterministic test fixtures for 5 locations × 5 dates × 3 FOVs; no duplicated object positions; map shifts according to time; verified render capture.

**SKY-002: Three sky modes — P0**  
`Observe` low-noise approximate naked-eye selection; `Explore` enhanced constellation/DSO discovery; `Deep Atlas` technical catalogs, grids, adjustable limiting magnitude. Per-mode defaults independent, customizable.  
**Accept:** one tap/controlled quick access; persist customized layer states; source objects never reposition because visualization mode changes.

**SKY-003: Expanded catalogs and LOD — P0**  
Index Gaia-derived stars with stable IDs, epoch/proper motion; spatial partitioning and background chunk fetching; real magnitude cutoffs, efficient label/point buffers; local cache and offline fallback.  
**Accept:** instrument actual visible vs indexed vs loaded counts; no unbounded JS-memory load; feature tests against anchor stars; acceptable GPU/memory profile.

**SKY-004: Constellation lines/boundaries/art — P0**  
All 88, IAU-referenced boundaries, independently toggled lines, names and original/licensed illustrations. Anchor illustrations via star geometry and selected projection; smooth fade at zoom thresholds.  
**Accept:** every constellation searchable; known asterism test; no repurposed Night Sky 3D art or unlicensed 3D meshes.

**SKY-005: Milky Way and deep-space backdrop — P0**  
Astronomically registered sky texture/tiled map, not a stationary photo or random cosmetic background; label simulation vs naked-eye appearance.  
**Accept:** galactic plane orientation changes correctly with location/time; layer/offline behavior and rights documented.

**SKY-006: Atmosphere/horizon — P0**  
Day/night/twilight, optional horizon/landscape, below-horizon objects, refraction treatment where appropriate; labelled dark-sky simulation during daylight.  
**Accept:** selected night-simulation mode must never silently change real observation time or actual visibility.

**SKY-007: Advanced layer manager — P0**  
Stars, magnitude cutoff, planets/moons, DSO categories, constellations, artwork, boundaries, labels, satellites, orbit trails, equatorial/AltAz/galactic/ecliptic grids, atmosphere, horizon, night vision; presets and persistent toggles.  
**Accept:** each toggle visibly changes relevant content without changing data source integrity.

**SKY-008: Target selection/Find in Sky — P0**  
Accurate hit testing; selection priority, center/focus animation, directional guides, visibility indicators, compact object card.  
**Accept:** small points at multiple FOVs selectable; no persistent blank black area below sky; selected object's actual location consistent with astronomy engine.

**SKY-009: Gesture + sensor quality — P0**  
Drag, pinch anchored to touch focal point, double-tap zoom, inertial damping where appropriate, restore, compass tracking, manual offset calibration, Reduce Motion.  
**Accept:** real-device gestures and heading regression test, landscape/portrait if supported; reliable operation under denied sensor permissions.

**SKY-010: FOV preview — P1**  
Overlay for common binocular, telescope/eyepiece and camera setups; manual/custom presets; angular diameter in correct units.  
**Accept:** field angle mathematically testable, overlays remain aligned under zoom/time/pan.

### WP2 — Discovery, Search and Encyclopedia (`DISC-001` to `DISC-007`)

**DISC-001: Canonical search — P0**  
Name, designation, aliases, fuzzy tolerance; category filters and recent/favorite queries. Astronomy identity merging (`M31` = `NGC224` when applicable).  
**Accept:** search index test set including aliases and typo queries; no duplicate results for the same object.

**DISC-002: Object Details — P0**  
Category-specific layouts for star, planet, Moon, constellation, galaxy, nebula, cluster, comet, asteroid, satellite. Editorial hero, verified image, meaningful properties, observing graph, article, Gallery, related objects, Find in Sky. Null/missing values absent, not invented.  
**Accept:** ten golden-object fixtures across categories pass schema/content tests; scientific units, citation/credit displayed.

**DISC-003: Sky contextual sheet — P0**  
Collapsed / half / expanded detents; location/time/search, highlights, selected-object actions, Explore and Planner links. Preserve sky state.  
**Accept:** drag, close, back navigation, selected-object behavior and accessibility verified; no interference with sky gestures.

**DISC-004: Explore editorial categories — P0**  
Planets, Moon, stars, 88 constellations, Messier, NGC/IC, visible tonight, satellites, events. Curated genuine NASA/ESA/ESO media when allowed.  
**Accept:** all cards route to real objects or explicit articles; unavailable assets have thoughtful text/graphical fallback.

**DISC-005: Favorites / observing lists — P0**  
Save/search/delete/reorder; canonical IDs and persistent local data.  
**Accept:** persisted across restarts, migration-safe, no loss after catalog updates.

**DISC-006: User Sky Tags — P1**  
Name, notes, associated object or sky direction, image where permitted. Coordinate attachment must have semantic type (celestial vs local/time-dependent).  
**Accept:** anchors remain meaningful after time/location changes, delete/edit, privacy local by default.

**DISC-007: Articles and gallery provenance — P1**  
Versioned curated descriptions; credits, processing band, capture type, scientific vs illustration labels; optional offline packs.  
**Accept:** every shipped third-party image has a documented source and rights decision.

### WP3 — Solar System, 3D and Moon (`SOL-001` to `SOL-004`)

**SOL-001: 3D Solar System — P0**  
Real orbits and time sync, rotate/zoom/select planets, orbital paths, speed presets, tooltips and explicit nonphysical scale mode when needed.  
**Accept:** moving time changes relative planetary relationships; no unsupported scale claim; consistent app state.

**SOL-002: Planet/moon details — P0**  
Major planets, physical metadata, principal moons when valid, phase/angle where meaningful, properly credited textures.  
**Accept:** documented expected positions for chosen fixtures, image attribution and sensible missing-data handling.

**SOL-003: Moon Atlas — P0**  
High-resolution multi-scale lunar surface tiles, named craters/maria, terminator illumination, orbital/rotation orientation, feature search, detail on tap, selected feature navigation.  
**Accept:** no stretching static Moon photographs as interactive maps; test named landmark positions and tile memory.

**SOL-004: 3D object explorer — P1**  
Curated verified models for selected bodies/satellites; size and rotation notes; on-demand download and cache.  
**Accept:** models render on target iPhone, correct object association and licence; no fake non-clickable mockup.

### WP4 — Live Universe (`LIVE-001` to `LIVE-004`)

**LIVE-001: Satellites, ISS and passes — P0**  
Fresh orbit elements, epoch and stale status, validated propagator, pass predictions, 2D sky path and search. Cache/backoff, source terms respected.  
**Accept:** timestamps visible; offline stale warning; no repeated unbounded requests; validation fixtures.

**LIVE-002: Comets / asteroids — P1**  
Selected major bodies from vetted orbital sources, orbital elements and update strategy, search, sky plot and time simulation.  
**Accept:** predictions compared to trusted reference within documented tolerance; no misleading certainty for uncertain orbit.

**LIVE-003: Event calendar — P0**  
Solar/lunar, Moon phases, planetary events, conjunctions, curated meteor showers and satellite passes; each event with origin, zone and relevant visibility.  
**Accept:** fixture comparisons, no static fabricated dates; filtered by observer where meaningful.

**LIVE-004: Smart notifications — P1**  
Opt-in event/visibility/pass alerts with scheduling, deduplication, time zone changes, revocation and quiet hours.  
**Accept:** no orphan notifications after moving location/time; server dependence clearly documented if present.

### WP5 — Observing, Weather, Dark Sky, Photo (`OBS-001` to `OBS-006`)

**OBS-001: Tonight 2.0 — P0**  
Moon phase, twilight, solar/lunar times, top visible objects, altitude-based windows, reasons for ranking, optional current weather/cloud fields.  
**Accept:** polar regions and circumpolar cases handled; forecast missing != invented 'excellent'.

**OBS-002: Observation Planner — P0**  
Choose night/location/equipment -> prioritized targets -> time window -> save plan -> check off observation.  
**Accept:** plan persists and includes observer, date, object, target times, observations notes.

**OBS-003: Dark Sky Map — P1**  
Legally licensed light-pollution map (or self-derived eligible sources), saved sites, disclosure of model limitations and data age.  
**Accept:** map attribution, licensing approval, route to saved observing site; no false precise Bortle claims.

**OBS-004: Weather / conditions — P1**  
Commercial API by contract, cloud cover, humidity, wind, viewing caveats; provenance and issue times.  
**Accept:** expired forecasts clearly marked; appropriate caching; provider limits respected.

**OBS-005: Astrophotography Planner — P1**  
Moon/Milky Way/selected objects, time, angle/altitude, equipment fields, FOV and observing constraints, saved shot plans.  
**Accept:** actual angular computations, no generic fake setting suggestions, camera device limitations disclosed.

**OBS-006: Observation Log — P1**  
Target, observer, time, notes, conditions, equipment, optional photo; privacy local first.  
**Accept:** edit/delete/export where supported; consistent object IDs.

### WP6 — Guided Exploration & Education (`GUIDE-001` to `GUIDE-003`)

**GUIDE-001: Deterministic Guided Tours — P0**  
`Tonight's Sky`, `Planets`, `Messier highlights`, `Constellation Stories`; tour itinerary built from valid objects and actual visible context; directional find, skip/pause/progress.  
**Accept:** toured object remains anchored to same astronomical engine; no AI hallucinated coordinates.

**GUIDE-002: Constellation Stories — P1**  
Curated short texts, original illustration, named stars, myths clearly separated from scientific claims; accessible content.  
**Accept:** 88 searchable constellations; editorial depth phased by priority; no unlicensed mythology artwork.

**GUIDE-003: Collections / Discovery Progress — P1**  
Named educational lists, save/complete/bookmark/share, return to context.  
**Accept:** verified progress persistence and no manipulative engagement loops.

**Defer:** Conversational Aura-like AI voice feature to post-V1 unless a documented user study supports it. If introduced later, retrieval and real ephemerides are authoritative, LLM never computes or guesses sky positions.

---

## 7. Screen-by-screen specification

Each screen must use approved SkyLens brand system: near-black/deep navy, refined serif editorial titles, crisp technical sans, restrained copper/peach actions, authentic/licensed scientific images. **Do not copy proprietary Night Sky/ Sky Guide graphics.**

| Screen | Required structure | Primary interaction / state |
|---|---|---|
| Sky | Full-bleed renderer, top search and layers, compass, time, contextual bottom controls | Pan/pinch/select; mode switch; context sheet; AR |
| Layers | Floating compact overlay grouped by rendering objects and scientific overlays | Live preview, per-mode presets and persistence |
| Search | Search field, aliases, categories, suggestions, recent/favorites | Choose object -> sky focus or detail |
| Object Detail | Hero, category, scientific values, Overview/Observing/Gallery/Related | Find, favorite, share, 3D where supported |
| Tonight | Moon and observing context, quality rationale, timelines, recommended targets | Select time/target -> map/planner |
| Explore | Editorial feature and grouped browsable catalogs | Search / category / story / object |
| Time Travel | Current/simulated time banner, scrub, play/speeds, date picker | Recompute all views, Now reset |
| AR | Actual camera view, directional overlays, alignment and permission state | Toggle AR vs sky; select; calibrate |
| Events | Upcoming/calendar, event detail and reminders | Jump to time/sky, save alert |
| Solar System 3D | Actual selectable bodies, orbits, camera and time | Spin/zoom/focus, object detail |
| Planet Detail | Overview, image, properties, moons, orbit, sky location | Explore 3D, find in sky |
| Moon Atlas | Tiled Moon visual, feature labels, phases/illumination and search | Pan/zoom/tap features |
| Satellite Detail | Photo/diagram, source timestamp, pass list, trajectory | Track, set notification, find |
| Observing Planner | Date/site/equipment, suggested targets, editable list, session timeline | Save plan, complete target |
| Light Pollution | Map, layer legend, confidence/data-age explanation and saved sites | Choose site, view Tonight |
| Guided Tours | Tour choice, stepper, sky background, selected target, short lesson | Next/back/skip, persist progress |
| Photo Planner | Target, time window, sky FOV overlay, gear and saved shot | Preview and save plan |
| More | Favorites, profile of observing sites, settings, licenses, Pro | All controls meaningful |
| Pro | Approved Saturn hero, benefits, prices from StoreKit, restore, legal | Real subscription state (tested before launch) |

### 7.1 Gesture contract

- Sky pan: one finger changes view center; when sensor-follow enabled, manual pan must explicitly override or offset (never silently fight sensor).
- Pinch: zoom around pinch focal point, enforce sensible min/max FOV; no jumps while lifting a finger.
- Tap point/label: resolve canonical object ID; display precise selection state.
- Long press: context action (tag / observe / info) only where meaningful.
- Double tap: smooth zoom at tapped focus.
- Time scrub: updates simulation; heavy ephemerides throttled to appropriate calculation cadence; exact value on release.
- Contextual panel: drag between detents, scroll list inside panel without accidental sky pan.
- AR: swipe/point and manual orientation correction; require permission and supported capability.
- Back: return to exact prior view, FOV, time, mode and selected object unless user chose Reset.

### 7.2 Motion contract

- **Sky view:** 60 FPS *target* on a defined capable reference device; no mandatory perpetual decorative particles.
- **Focus target:** 250–550ms context-appropriate easing; maintain target alignment through coordinate interpolation.
- **Bottom sheet:** spring with no overshoot that obscures focus; keyboard-safe.
- **Segmented/mode transitions:** 180–350ms, clear state change and controlled overlay fade.
- **Time travel:** animate sky from calculated positions, not crossfade fake frames; handle large jumps with deliberate interpolation or skip animation when unsafe.
- **Hero image and objects:** subtle parallax on screen entrance; no distracting bounce.
- **Reduced Motion:** deterministic instant or low-motion alternative.

All durations are UI starting points, to be tuned with screenshots and in-hand testing; do not claim user-tested.

---

## 8. Data and canonical domain contracts

**Do not freeze data-source choices before the independent data/licence audit.** The other research session is responsible for verifying exact releases, files, rights, refresh rates and redistributability. The application must be source-agnostic at module boundaries.

### 8.1 Recommended canonical data model (illustrative TypeScript contracts)

```ts
type ObjectId = string; // namespace + stable source identity, e.g. "messier:M31"
type ObjectKind =
  | 'star' | 'planet' | 'moon' | 'sun' | 'constellation'
  | 'galaxy' | 'nebula' | 'cluster' | 'satellite'
  | 'comet' | 'asteroid' | 'lunar_feature';

type CoordinateEpoch = 'J2000' | 'J2016' | string;

interface CatalogObject {
  id: ObjectId;
  kind: ObjectKind;
  canonicalName: string;
  aliases: string[];
  sourceIds: Record<string, string>;
  descriptionId?: string;
  staticEquatorial?: {
    raDeg: number;
    decDeg: number;
    epoch: CoordinateEpoch;
    pmRaMasPerYear?: number | null;
    pmDecMasPerYear?: number | null;
  };
  photometry?: {
    apparentMagnitude?: number | null;
    band?: string;
    colorIndex?: number | null;
  };
  imageryAssetIds: string[];
  provenanceId: string;
}

interface ObserverContext {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeMeters?: number;
  timezoneId: string; // display only; calculations use UTC
}

interface SkySimulationState {
  observationInstantUTC: string;
  realtime: boolean;
  observer: ObserverContext;
  mode: 'observe' | 'explore' | 'atlas';
  viewCenterAzDeg: number;
  viewCenterAltDeg: number;
  fovDeg: number;
  selectedObjectId?: ObjectId;
  enabledLayers: string[];
}

interface DynamicDataSnapshot {
  provider: string;
  fetchedAtUTC: string;
  validUntilUTC?: string;
  sourceEpochUTC?: string;
  licenceRecordId: string;
  status: 'fresh' | 'stale' | 'missing' | 'blocked';
}

interface LicensedAsset {
  id: string;
  subjectObjectId?: ObjectId;
  sourceUrl: string;
  creator: string;
  creditLine: string;
  usageRights: string;
  commercialUseApproved: boolean;
  redistributionApproved: boolean;
  imageProcessingDescription?: string;
}
```

Reference: these interfaces are starting contracts, not a proven mapping to every raw catalog field. Preserve scientific coordinate conventions and perform proper transformations before rendering.

### 8.2 Data ownership and update policies

| Data area | Expected source category | Processing | Freshness / safeguards |
|---|---|---|---|
| Stars | Gaia / verified bright-star catalog | Normalized ID, epoch, photometry, LOD | Static edition with versioned updates |
| DSO | OpenNGC / validated sources | Merge aliases, morphology and position | Versioned package |
| IAU constellations | Official references and permitted line/art data | Boundaries, line geometry, art mapping | Versioned package |
| Planet ephemerides | Validated local engine with JPL benchmarks | Topocentric position vs UTC | Computed locally; periodic test reference |
| Minor bodies | JPL orbital datasets | Ephemerides with uncertainty and source epoch | Update using documented cadence |
| Satellites | CelesTrak or licensed provider | OMM/TLE + SGP4; freshness checks | Cache; never claim live with stale data |
| Moon atlas | LRO / USGS compliant assets | Tiled imagery, gazetteer, orientation | Versioned/offline tile packs |
| Weather | Commercially permitted API | Forecast times + expiry | Show unavailable when stale |
| Light pollution | Licensed layer / vetted derivatives | Tiles/legend/uncertainty | Show source age and limitations |
| Images/models | Cleared NASA/ESA/ESO/provider assets | Credit, licence, subject, imagery mode | Never bundle uncleared assets |

**Blocking decision rule:** Do not include data/assets until commercial and redistribution rights are explicitly approved. Record `approved/needs permission/rejected` decisions in `DATA_SOURCE_AUDIT.md` and `ASSET_CREDITS.md`.

---

## 9. Rendering architecture and performance budgets

### 9.1 Architecture

- **App/UI:** React Native + Expo + TypeScript. Keep approved screen designs and shared UX components.
- **Astronomy:** Separately testable deterministic TypeScript or native module. Preserve existing verified implementation unless benchmarks justify replacement.
- **Spatial catalog:** Offline compressed tiles/chunks keyed by sky region and brightness; lazy chunk fetch; bounded memory cache.
- **Graphics:** Retain Skia for 2D where performant; optimize JS/JSI work and draw batching first. Consider native GPU/Metal only with profiling evidence and a maintenance plan. Expo supports Swift native modules when needed.
- **3D:** Dedicated compatible GL/Metal/native rendering surface with explicit capability checks; don't assume Skia is a complete 3D engine.
- **Network sync:** Controlled caches, rate limiting, source timestamps, offline fallback.
- **Storage:** User preferences and favorites local by default, versioned schema migrations, no required account.

### 9.2 Measurable budgets to validate, not assert

| Indicator | Initial acceptance goal | Proof |
|---|---|---|
| Active sky pan on reference modern iPhone | Target smooth 60 fps / no regular visible hitching | Instruments/real device trace with device model |
| Frame time at 60Hz | p95 <= 20ms during steady pan (stretch target ~16.7ms) | Instrumented render samples |
| Input response | Actions feel immediate, no blocked pinch/drag under dense field | Real-device scripted/manual interactions |
| Long session | 20 min of sky interaction without progressive memory growth | Leak/memory logging |
| Catalog zoom | Tested at 50k / 250k / 1M indexed stars, not all rendered | Visible + loaded + drawn counters and traces |
| Offline | Basic sky, bundled bright stars, constellations and local calculations work without data | Airplane-mode E2E test |
| Battery/thermal | Record temperature/energy impact, compare baseline | At least two device tiers |

The device list should include a modern iPhone and one older supported model, with an explicit test matrix. Avoid specific FPS claims unless measured.

---

## 10. QA and reference validation

### 10.1 Astronomy fixtures

- Reference position sets for Sun, Moon, eight planets, bright stars, selected DSO, satellites and lunar landmarks.
- Multiple latitudes including northern/southern hemispheres, near poles and equator.
- Historic and future times within documented supported range.
- DST, UTC-midnight, date line, leap-day and nonexistent rise/set cases.
- Magnitude and coordinate-frame conversion fixtures.
- Distinguish apparent vs astrometric/true and geocentric vs topocentric reference data; mismatch must not be misreported as an engine defect.

### 10.2 End-to-end app tests

- J01 through J10 with screenshot or automation artifacts.
- Location permission granted/denied; camera granted/denied; AR unavailable on noncompatible hardware.
- Offline/reconnected network, bad catalog package, stale satellite feed, expired weather.
- Real StoreKit purchase, restore, cancellation/expiry and unavailable-product state before release.
- VoiceOver, Dynamic Type where suitable, Reduce Motion, sufficient touch areas.
- Catalog update migration with saved favorites/tags intact.

### 10.3 Visual design gate

Every new screen gets: target screenshot -> matching device-resolution actual capture -> side-by-side diff -> top 3 corrections -> recapture. Preserve approved SkyLens identity. Do not use screenshots as the actual UI.

### 10.4 Licensing and privacy gate

- Signed-off commercial use and redistributed-asset permissions, not just attribution.
- Privacy disclosures reflect actual app behavior (location, camera, analytics, purchases).
- Permissions requested contextually; opt-in for notifications.
- Never copy Night Sky internal API, proprietary catalogs, illustrations or models without authorization.

---

## 11. Monetization and product analytics

**Business principle:** Do not lock the basic accurate sky, object identification or essential search behind AI/paywall. V1 must be meaningfully useful without subscription.

**Possible Pro packaging (validate):** Deep Atlas expanded catalogs, advanced planner and equipment profiles, imagery packs, FOV and advanced photo tools, richer observing history, extended alerts and curated tours. Prices must come from actual StoreKit product configuration; no fake paywall price displays.

Instrument privacy-conscious app events: `onboarding_completed`, `sky_mode_changed`, `object_selected`, `find_in_sky_started`, `find_in_sky_completed`, `tonight_target_opened`, `tour_started`, `tour_completed`, `plan_saved`, `favorite_added`, `trial_started`, `purchase_completed` and essential error counters. Avoid sending precise geolocation unnecessarily; ensure tracking requirements are evaluated.

**V1 quality metrics:** successful find flows, first-session object engagement, weekly repeat observation usage, tour completion, crash-free sessions, paid conversion, refunds and actual retention. Set numerical growth targets after baseline cohort measurements, not arbitrary guesses.

---

## 12. Implementation roadmap: gated work packages

**Stage 0 — Actual audit, protection, baseline (first task):** inspect repo, create `V1_GAP_AUDIT.md`, inspect existing scripts/build/tests, archive screenshots and current performance, version-control checkpoint. No destructive rewrite. Define licence audit handshake with data-source session.

**Stage 1 — Advanced Planetarium:** SKY-001 to SKY-009; catalogs, projections, Sky Modes, layers, constellation art, labels, atmosphere and interactions. Deliver real-device performance logs and a source-grounded sky screenshot. **Gate:** accurate/usable major map states, core benchmark and UI tests pass.

**Stage 2 — Discovery & Encyclopedia:** DISC-001 to DISC-005; search, robust category-specific Object Details, Sky contextual panel, Explore, favorites. **Gate:** J01/J02/J03 pass and visual quality matches approved references.

**Stage 3 — Solar System & Moon:** SOL-001 to SOL-003 (SOL-004 when cleared and feasible). **Gate:** correct time sync, planet pick/rotate and high-resolution Moon landmark interaction.

**Stage 4 — Live Universe:** LIVE-001, LIVE-003 and then LIVE-002. **Gate:** sat pass and event fixtures, cache/freshness/rights pass.

**Stage 5 — Observing & Planning:** OBS-001, OBS-002, then OBS-003/004/005/006; SKY-010. **Gate:** J04/J09, stable planner, accurate windows, commercial API authorizations.

**Stage 6 — Guided Experiences:** GUIDE-001, then 002/003; enrich art and curated content. **Gate:** J08 end-to-end, no fictitious sky navigation and no duplicated screen states.

**Stage 7 — Production hardening:** ALL app gates, subscriptions, licences, privacy, user test cohorts, screenshots, accessibility, release checklist. **Gate:** no blockers or falsely advertised capabilities.

The plan is dependency-ordered, not a promise of a particular completion date. Don't start all packages in parallel. Build-ready increments should be merged with green tests and updated docs after each stage.

---

## 13. Stage 1 — exact first implementation sprint

### Sprint goal
Upgrade the currently reported 41,411-star view into a scientifically trustworthy and visually exceptional SkyLens planetarium that scales to deeper catalogs without freezing the UI.

### Required tasks (in dependency order)
1. Audit repository and verify exactly what is currently rendered and sourced.
2. Add deterministic sky renderer fixtures (date, observer, FOV, layers, selected object).
3. Benchmark current Skia renderer on available device(s), identify performance bottleneck.
4. Define normalized catalog ID/coordinate formats and source interfaces; keep old catalog functional.
5. Implement spatial partitioning + magnitude-aware LOD + label collision policy.
6. Add Observe / Explore / Deep Atlas presets with a persistent, accessible switch.
7. Add advanced Layer Manager and verify it affects actual rendering.
8. Improve constellation lines/labels/astronomically anchored art without copying competitor assets.
9. Build high-quality horizon/atmosphere states and clearly named night simulation.
10. Add object hit testing/selected-object card and Find in Sky with correct on-screen placement.
11. Run screenshot comparison and device performance validation; record resulting gaps.

### Stage 1 done when
- Core map renders and responds correctly in all three modes.
- Positional results match chosen reference fixtures at specified tolerances.
- At least one deeper catalog pack loads incrementally without blocking navigation.
- Controls and layers change actual data and presentation; no inert toggles.
- No arbitrary static celestial background passes as a live star map.
- Sky screenshots captured for Observe, Explore, Deep Atlas, daytime and selected-object states.
- Actual frame timings and memory available, even if performance tuning is still required.
- Source and asset licensing decisions recorded.

---

## 14. Risk register and decisions

| Risk | Consequence | Mitigation / decision |
|---|---|---|
| Huge Gaia ingestion | Slow, large app, high memory | LOD, precomputed tiles, bounded cache, optional on-demand packs |
| Arbitrary pretty sky imagery | Incorrect alignment with objects | Catalog-aligned galactic maps and explicit simulation mode |
| Skia performance | Jank, battery drain | Real instrumentation, optimize first; native GPU after measured threshold |
| Inaccurate sensor headings | Wrong AR object identification | Calibration + confidence indicator + manual fallback |
| Licence uncertainty | App distribution or legal risk | Per-dataset/per-asset gate before import and release |
| Satellite stale data | False live passes | Show age and errors, no unsupported claims |
| Overwide V1 | Many partially working features | Stage gates and canonical data models; freeze new scope until gates pass |
| 3D image/model quality | Generic or scientifically false visuals | Curated cleared assets, honest scale conventions |
| Night Sky cloning | Proprietary rights & brand confusion | Benchmark functionality, implement independent content/design/code |
| Subscription incomplete | Failed business launch | End-to-end StoreKit test before release |

### Decisions explicitly left open pending audit
- Exact star/DSO package size, compression/tiling and download strategy.
- Whether the Sky renderer stays Skia or uses a native surface, after profile.
- Exact licensed weather and light-pollution vendor.
- Number and complexity of original constellation artworks.
- Hardware device tier and performance acceptance baseline.
- 3D rendering library and model sources.

Resolve these as implementation decisions documented with alternatives, metrics and cost — do not ask the nonprogrammer product owner about trivial engineering choices.

---

## 15. Cross-team integration contract

**Data research session outputs:** `DATA_SOURCE_AUDIT.md`, exact dataset release/URLs, rights classification, redistribution and attribution, update cadence, sample data, conversion scripts and reference testing benchmarks. This PRD does not assert those tasks are already finished.

**Claude Code implementation outputs:** validated `V1_GAP_AUDIT.md`, `V1_IMPLEMENTATION_PLAN.md`, `FEATURE_STATUS.md`, `ASSET_CREDITS.md`, `TESTING.md`, `PERFORMANCE_RESULTS.md`, screenshots and actual code/tests.

**Integration rule:** engineering may build source-agnostic interfaces while licence decisions remain pending, but may not silently embed/download/distribute unapproved datasets. `Blocked by source licence` is a valid feature state; `Completed` is not.

---

## 16. Definition of Done — SkyLens V1

V1 is ready for public distribution only when:

1. P0 scope delivers real and cohesive functionality with evidence, not a screenshot gallery.
2. Observe, Explore and Deep Atlas modes work as designed on real iPhones.
3. Astronomical positions, time travel, visibility and object IDs pass documented validations.
4. The selected expanded catalogs are searchable and efficiently rendered within measured budgets.
5. All 88 constellations have grounded locations/names/lines; imagery availability is accurately documented.
6. Object Detail is robust across star, planet, Moon, DSO and satellite categories.
7. 3D Solar System and Moon Atlas have real interactions, real data and honest scaling.
8. ISS/satellite and event workflows use correct, timestamped data; stale responses handled.
9. Tonight, observing plans and core Discover tours work end-to-end.
10. AR/headings, performance, memory and gestures have real-device test evidence.
11. App has no inert visible CTA, fake weather, fabricated events or unlicensed bundled image.
12. StoreKit real sandbox purchase/restore/expiry paths work where monetization is enabled.
13. App Store/privacy/licence/accommodation requirements pass a final documented review.
14. Screens match approved SkyLens design direction with real capture evidence.
15. The team can explain exactly which P1 capabilities shipped and which were deferred.

**Final rule:** The most visually attractive feature does not outrank astronomical correctness, interaction reliability or rights clearance. And the largest catalog count does not outrank a usable map.

---

## 17. Instructions to the implementation agent

Treat this document as the product contract, subject to factual technical checks. Do not replan from scratch or revert to a smaller MVP. Start with Stage 0 audit, then execute Stage 1 without waiting for nonessential decisions. Preserve existing working features and approved visual references. State exactly what was implemented, measured, tested, blocked and not yet finished. Do not invent success metrics, source rights or device test results. For each stage, give concise product-owner-facing progress in Slovak and attach actual evidence (code, tests, screenshots and performance traces).
