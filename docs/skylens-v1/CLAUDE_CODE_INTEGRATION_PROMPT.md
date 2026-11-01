# SkyLens V1 — Unified Integration & Execution Directive

You are working in the **real, existing SkyLens repository**. The React Native + Expo app reportedly has a working TestFlight build. Do not generate another project, re-create completed screens, rename app identifiers, reset EAS credentials, or overwrite the original SwiftUI code.

Read these files **in full** from `docs/skylens-v1/`:
- `SKYLENS_V1_PRD.md`
- `SKYLENS_V1_DESIGN_LOCK.md`
- `DATA_SOURCE_AUDIT.md`
- `DATA_ARCHITECTURE.md`
- `README.md`

Inspect images:
- `docs/skylens-v1/visuals/approved_existing_design.png`: existing approved SkyLens visual direction (not something to redesign).
- `docs/skylens-v1/visuals/new_features_concept_only.png`: inspiration **only for absent modules** (3D Solar System, Moon Atlas, satellites, comets, guided tours, observing planner, light pollution, astrophotography, tags/logbook, alerts). Do not implement fake astronomical figures shown in conceptual imagery as factual data.

## Authoritative precedence
1. **Real repository, working existing features, TestFlight bundle identity and verified tests** define the current state. Confirm; do not merely trust an AI summary.
2. **Scientific correctness, permissions, commercial licensing, privacy and source reliability** are hard release gates, even if a screenshot or PRD asks otherwise.
3. `SKYLENS_V1_PRD.md` defines planned product functionality, priorities and acceptance criteria.
4. `SKYLENS_V1_DESIGN_LOCK.md` and approved visual guide define the UI. For existing screens preserve the current proven screen and visually refine only justified differences; for **new** screens follow the corresponding reference and established design system.
5. `DATA_ARCHITECTURE.md` is a proposal that must be adapted after reading the real code. Its claimed sample implementation (`skydata/`, fixtures, TypeScript examples) must not be assumed to exist in this repository.
6. `DATA_SOURCE_AUDIT.md` describes external source/legal research, not an audit of this project. HOLD/CONDITIONAL sources cannot be automatically bundled or redistributed. Ask for licensing decision or use cleared alternatives. Log constraints and provenance.

## Stage 0 — verify, reconcile and checkpoint
- Identify repository root, app entry, Expo/EAS/Apple bundle configuration, current Git branch and status. Never expose secrets.
- Make a non-destructive version control checkpoint before substantive edits.
- Inspect RN app, any Swift/native bridge, current Skia renderer, catalog files, local data, backend/API, license evidence, integration tests, CI and actual app version.
- Build `docs/skylens-v1/V1_GAP_AUDIT.md` with every requirement from PRD grouped by `VERIFIED_IMPLEMENTED`, `PARTIAL`, `MISSING`, `BLOCKED`, `NOT_TESTED`. Cite source file paths and tests for each status.
- Build `docs/skylens-v1/V1_SOURCE_MATRIX.md` showing each **actual** provider, data source/version, refresh cadence, evidence of license/attribution, local/offline storage, and release gate. Never mistake a recommendation for an installed integration.
- Build `docs/skylens-v1/V1_DECISION_LOG.md` resolving contradictions and identifying changes that may affect working Sky View/Tonight/Explore/Events/Time Travel/AR, avoiding duplicate code.
- Build `docs/skylens-v1/V1_INTEGRATION_PLAN.md`: dependency-ordered implementation tickets, proposed folders/adapters, feature flags, rollback, scientific and device-test gates. Be concise; then proceed to implementation.
- Establish baseline screenshots from the running app and baseline actual device performance if the environment allows. If no iPhone/Xcode/TestFlight visibility is available, explicitly mark DEVICE_NOT_TESTED. Never invent results.

## Stage 1 — Advanced Planetarium (implement, do not just plan)
- Reuse current renderer and astronomical engine unless measured evidence requires replacement.
- Add Observe, Explore and Deep Atlas modes, proper layers/magnitude/density controls, tap selection and contextual panels while preserving approved navigation.
- Build separate catalog service and LOD/tiling with reversible feature flag(s); respect producer rights gates before importing Gaia/OpenNGC/IAU/CelesTrak assets.
- Keep one observer/time/orientation state across Sky, Tonight, Time Travel, Find in Sky and AR.
- Use correct epoch/coordinate conversions and JPL reference fixtures; do not claim JPL validation until tests actually pass and results are recorded.
- Implement progressive density and label decluttering; avoid fake bright nebula positions or unrelated photo overlays.
- Add actual offline/stale/permission/error states and telemetry only where permission and product policy allow.
- Capture screenshots of **new map states and modified components** and compare with approved style; do not re-render all completed original screens for visual showcases.
- Check stability, real frame times, memory, battery, gesture accuracy, search/selection, night/day, location/time changes and rollback against the baseline.

## Subsequent stages
Proceed through product PRD order: Discover / rich object detail, Solar System 3D & Moon Atlas, satellite/comet tracking, observing/planning, tours/photography. New screen implementations must link to real data sources, have full functional states and real-device tests. Never count a screenshot-only feature as implemented.

## Required work reports (Slovak, concise)
After every checkpoint report:
1. Exactly what changed, files/commit.
2. Functionality verified vs missing or blocked.
3. Science and data-validation output including fixtures, tolerance and timestamps.
4. Licence status per imported dataset/asset (HOLD stays disabled).
5. Actual screenshots/visual mismatches and real device measurements, or explicit unavailability.
6. Next dependency-ordered ticket.

Do not ask the owner to choose routine engineering details. Do not claim production readiness, 100% precision, approved commercial rights, successful purchases or real-device test results without evidence. Preserve TestFlight build continuity and current working SkyLens screens. Start now with Stage 0 inspection and then implement the first verified Stage 1 ticket.
