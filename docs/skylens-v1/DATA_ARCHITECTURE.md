# SkyLens V1 — DATA_ARCHITECTURE

**Verzia 0.1 / 2026-11-01.** Architektúra a izolovaný technický základ. Žiadne tvrdenie o zapojení do existujúceho SkyLens ani o astronomickej presnosti na JPL úrovni.

## 1. Topológia bez závislosti od konkurentov

```text
[ESA Gaia DR3] ----> rights-gated ingest --> QA --> Stars SKY1 binary tile packs --\
[OpenNGC CSV] -----> rights-gated ingest --> QA --> DSO JSON tile packs -----------+--> Signed Release Registry
[IAU boundaries] --> ingest / reprojection --> QA --> Lines & regions ------------/
                                                                            |
                                                                            v
                      immutable versioned offline bundles + delta CDN (later)
                                                                            |
                                                                            v
                 RN/Expo SkyLens src/data/ -> TileStorage -> viewport/camera LOD
                                                      |             |
                                            existing renderer   Search/Detail/Tonight/AR

[JPL Horizons + SBDB] ---> server ingestion + reference-check ---> ephemeris cache/API
[CelesTrak GP OMM] -----> rate-limited ingestion + SGP4 -------> orbit snapshots/API
[NOAA SWPC] ------------> validated feed + TTL ----------------> events/weather API
[Commercial meteo & sky brightness] --> licensed provider adapter -> TTL/cache contract
[USGS/LRO] -----------> projection-aware lunar tile packs + geo feature database
[NASA/ESA cleared assets] --> asset rights registry --> optimized CDN/bundles + credits
```

**Invariants:** všetky UI obrazovky používajú `ObserverContext` pre location / time / orientation; dátové moduly neprepisujú renderer a neriadia dizajn. Žiadny dodatočný copy/paste z Night Sky. Pri chybe novej vrstvy automaticky fallback na **existujúcu** lokálnu implementáciu, nie na vymyslené hodnoty.

## 2. Jednotný dátový kontrakt

| Entity | Vlastnosti / údaje | Čas a jednotky | Kľúče |
|---|---|---|---|
| `CatalogObject` | `id`, `type`, `names[]`, `cross_refs[]`, `source`, `release_id`, `attribution_id`, `quality_flags[]` | stabilný vs dynamický, explicitný pôvod | `gaia:<u64>`, `openngc:<name>`, `jpl:<spkid>`, `norad:<id>` |
| `StarAstrometry` | RA/Dec ICRS, epoch, `pm_ra_star`, `pm_dec`, parallax, radial velocity, astrometric flags | stupne, mas/yr, mas, km/s; Gaia DR3 epoch J2016.0 | Gaia source_id u64 (v JS BigInt / text) |
| `Photometry` | G/BP/RP magnitudes, quality indicators | rozlišovať Gaia G od vizuálneho V; nerobiť naoko presnú V bez modelu | parent object |
| `DeepSkyObject` | J2000 RA/Dec, type, `v_mag`, major/minor axis, PA, names, external crossrefs | degrees, arcminutes, `null` where unknown | OpenNGC ID |
| `SolarSystemEphemeris` | body ID, observer center, UTC/TDB/TT conversion, reference frame, RA/Dec, az/alt, distance, phase, validity | sampling time, error/uncertainty and solution hash | JPL target + observer + time |
| `SatelliteOrbit` | NORAD ID, OMM mean elements epoch, propagated TEME position, EOP version, age, accuracy class | UTC epoch + SGP4 output, km | `norad:...` |
| `LunarFeature` | USGS official name, feature type, body-fixed planetographic coords, diameter, imagery ID | lunar surface convention and geodetic datum | USGS feature ID |
| `Event` | type, UTC interval, source, prediction model, local visibility rules, confidence | ISO UTC, time-zone only presentation | composite stable event ID |
| `SpaceWeather` | feed, issued/valid UTC, Kp/alert levels, observation vs forecast | quality/freshness labels | source + issued time |
| `MediaAsset` | original URL, license, author, immutable credit, rendition transform, asset hash | rights-expiry/version | independent media ID |

### Tricky correctness constraints

- Gaia DR3 `gaia_source` contains some unresolved galaxies/quasars, spurious astrometric solutions and blended/variable sources: production ingest must apply scientific quality cuts (`ruwe`, visibility periods, astrometric solution and source classification) tailored to brightness/use case, with published completeness tradeoffs. The first compiler does **not** enforce these and cannot yet be represented as a clean star-only catalog.
- Gaia `pmra` is **μ_α*=dα/dt·cosδ**, not straight RA derivative. ICRS J2016.0 to apparent sky requires proper motion, radial motion/perspective where possible, annual parallax, aberration, gravitational deflection, precession/nutation, Earth orientation, refraction, observer position and time scale conversions. Included v0 TS example is **proper-motion only**.
- OpenNGC J2000 positions and Gaia J2016 positions must be propagated or transformed into a **shared frame/epoch** before cross-catalog angular matching, not accidentally mixed.
- Topocentric Solar System coordinates are **not** obtained by adding sidereal time to heliocentric orbital elements.
- `NaN`/`null` for missing measurements, never `0`; `G` mag ≠ `V` mag. DSO angular sizes do not justify rendering a bright photographic nebula in naked-eye sky.
- Visual horizon/weather and atmospheric extinction are approximate and must carry visibility quality flags.

## 3. Offline sky catalog MVP implementation (provided, independent)

`skydata/build_catalogs.py` reads authorized Gaia DR3 `gaia_source` CSV and semicolon-delimited OpenNGC CSV, with **source redistribution license preflight**. It filters to Gaia `G ≤ 15`, validates geometry and units, deduplicates by Gaia `source_id` using disk-backed SQLite, writes spatial binary star tiles and JSON DSO tiles, each with SHA-256, record counts, bounding spherical cones and origin SHA.

- **Cube-sphere quadtree** on 6 faces; per-level `2^L × 2^L`. For a given star assign one brightness tier (`G ≤ 5, 7, 9, 11, 13, 15`) and only one tile at that tier. At zoom, combine all brightness tiers up to current `maxTier`, so no duplicated stars. This is a **first LOD implementation**, not the final benchmarked iOS architecture.
- Header `SKY1` / version (`u32`) / count (`u32`), followed by 36-byte records: `Gaia source ID u64`, `ra_deg f32`, `dec_deg f32`, `pmra* f32`, `pmdec f32`, `parallax f32`, `G f32`, `BP−RP f32`. Little-endian, missing measurements = NaN. `f32` quantization limits astrometric precision; keep original 64-bit source in server store for precise computations and quality checks.
- `stars_manifest.json` contains paths, face indices, tier, tile bounding radius, SHA, byte size, records; DSO source **separate** as `dso_manifest.json` to preserve CC BY-SA compliance and legal provenance.
- TypeScript `visibleTiles` conservatively selects intersecting tiles; `fetchVisibleStars` loads chunks via injectable `TileStorage`, bounds parallelism, validates tile length/count and parses BigInt IDs. The renderer must additionally cull actual stars, apply exposure/zoom-dependent density, and use GPU buffers to avoid large JS allocations.
- The quadtree tile cap includes a fixed ~0.86° margin for typical nearby-epoch proper motion; **ancient/future Time Travel or extreme proper motion** can exceed it. Production selection must expand cones with per-tile max proper motion × target epoch delta, or recompute membership.
- **No production source imported** in this package. Unit tests create temporary synthetic fixtures, compile them and verify counts/geometry/hashes. `rights.json` is `false` by default.

### Level-of-detail target (to benchmark, not guaranteed)

| Tier | Gaia G upper limit | Intent |
|---:|---:|---|
| 0 | 5.0 | bright wide-field sky / horizon |
| 1 | 7.0 | detailed wide angle |
| 2 | 9.0 | sky zoom |
| 3 | 11.0 | binocular field |
| 4 | 13.0 | telescope finder |
| 5 | 15.0 | deep zoom / optional on-demand |

**Production upgrade:** Skybox/HEALPix (depending on existing engine), project-to-pixel error and limiting-magnitude based on viewport; streaming tile cache (LRU), worker decoding, object marker decluttering, 8-bit or 16-bit quantization **after measured error bound**, data subsets in App Store bundle and extra catalog downloads behind explicit size disclosure. Benchmark P50/P95 latency, memory peak, dropped frames and transfer bytes on a defined physical iPhone before claiming 60 FPS.

## 4. Dynamic backend, refresh and atomicity

- Static celestial bundles: immutable content-addressed `catalog_releases/<release_id>/...` with signed root manifest, ETags, SHA-256 and release dependencies; update only when new scientifically reviewed release is built.
- Horizons: server-generated ephemeris grid for Sun/Moon/planets and selected small bodies with observer/time grids, interpolation guardrails. Separate JPL API for **validation**, not user-device request flood. Configurable TTL per class, stale UI with `last_updated_utc`.
- SBDB: catalog solution refresh daily or on known solution updates, with orbital uncertainty and `orbit_id`; expose object metadata + independently computed Horizon-aligned ephemeris.
- CelesTrak: OMM ingestion no more often than **every 2 hours**, request only needed groups, retain raw `EPOCH` and newer catalog IDs, SGP4/TEME conversion with EOP. Fail stale checks / suppress precise pass predictions if element age exceeds tested per-orbit bounds.
- NOAA SWPC: poll only on feed-specific cadences; guard on `issued_at/valid_at`; avoid presenting forecasts as live observations.
- Weather: server-side keyed proxy with contracted geospatial storage/retention; no vendor secret on client. Light pollution: calibrated map vintage and interpolation/attribution per tile.
- Update job: `FETCH → SCHEMA CHECK → RIGHTS CHECK → SCIENCE QA → HASH/SIGN → STAGE → ATOMIC RELEASE → CANARY → GENERAL`. No partial tiles with new manifest. Rollback previous release by pointer.
- Separate live-data `data_age_seconds`, provider outage state, rejected-count dashboards, 429/403 backoff, circuit breakers, request budgets.

## 5. Scientific verification contracts — NOT yet performed on real SkyLens

| Pipeline | Verification | Gate / acceptance target to finalize after baseline |
|---|---|---|
| Gaia import | CSV source-id uniqueness; RA 0–360, Dec −90–90; epoch J2016.0; proper motion units; brightness histogram against raw; binary round-trip | **100%** output rows traced to source hashes, no duplicates; f32 quantization measured and reported |
| LOD | Random sky cones incl RA=0, poles and face boundaries vs brute-force source scan | **0 false-negative visible stars** across test suite; max memory and FPS target benchmarked |
| OpenNGC | 88 constellations mapping, known M31/M42/M45 crossrefs, type/RA/Dec/scale sanity; J2000 vs Gaia epoch conversion | all known IDs unique; no bad dedup or missing catalogs; source-version and attribution included |
| Sun/Moon/planets | Cross-compare apparent topocentric RA/Dec/alt/az, distances/phases at multiple dates and observer sites to **Horizons** | Proposed threshold: < 60 arcsec apparent angular error for planets, < 120 arcsec Moon; **not a certification** and must be tightened/qualified per mode |
| Small bodies | Compare computed positions to Horizons for recent/high-eccentricity comets; confidence intervals and fresh SBDB elements | fail on expired/poor solutions, flag prediction uncertainties |
| Satellites | Compare SGP4 OMM predictions to independent reference implementation for identical EOP/time/TEME conditions | acceptance per age/altitude tested; no unbounded “always precise” promises |
| Moon Atlas | Verify lunar pixel → named feature against USGS gazetteer, map CRS and east/west longitude, poles | landmarks within chosen zoom-specific error tolerance |
| Weather/aurora/meteors | Timestamp, data model, source rights, missing values, geometry, expiry | hide or mark stale predictions, never invent events |
| Assets | Exact ID, content-appropriate photograph, source-specific usage licence & readable credit | asset registry complete before App Store release |

### Regression strategy

1. Freeze golden fixtures of official raw reference responses and **URLs + retrieval timestamps + checksums**; pin JPL Horizons API output settings and version.
2. Run independent astronomical calculation (SOFA/ERFA/Swiss Ephemeris **only if its license is compatible**, or validated astronomy native library) and compare against JPL not against itself.
3. Tests across UTC midnight, leap seconds, equinoxes, poles, daylight-saving transitions, southern hemisphere, high proper-motion stars, near-horizon refraction, RA wrap, satellite decays and age-of-OMM.
4. Run test vs freshly fetched official reference data on release candidate in controlled CI; do not run interactive app requests directly to official services.
5. Store an explicit `VALIDATION_REPORT.json`: `test_id`, input observer/time/frame, source ID, reference_version, expected, actual, angular_error_arcsec, threshold, pass/fail, fixture_sha256.
6. No release if license/accuracy/UX regression unresolved. Where a reference can't be obtained, mark `BLOCKED` rather than `PASS`.

## 6. Integration into existing app — reversible, no design change

- Preserve git branch and pre-change screenshot snapshots.
- Add new code to `src/data/catalogs/` behind feature flag `catalogsV1=false` by default; `TileStorage` adapter to the **existing** cache/native filesystem, not a new UI.
- Route only data access (`getVisibleStars`, `searchCatalog`, `getObjectById`) to the new service; retain SkyRenderer, SkyLens design tokens, navigation, AR and existing astro engine.
- Canary on physical iPhone for star coordinates, search, deep-sky details, pan/zoom/AR/time travel, memory, battery; promote flag only with evidence.
- Do not remove legacy datasets until parity tests and rollback are proven.

## 7. Open blockers

1. **Actual SkyLens repository not accessible**: cannot audit active sources, install modules, take baseline or edit working app.
2. Gaia bulk commercial/offline redistribution rights: positive written evidence needed for exact use case.
3. OpenNGC CC BY-SA 4.0 adaptation/combined database share-alike scope: legal/product approval.
4. IAU boundary dataset and CelesTrak commercial republishing conditions unclear.
5. Weather/light-pollution providers, pricing, actual contract clauses not selected.
6. No JPL output vs existing actual SkyLens algorithm, no device benchmark, no production input files.
7. Data accuracy validation beyond parser/geometry unit tests remains **BLOCKED**.
