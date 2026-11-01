# SkyLens V1 — Integration Plan

Dependency-ordered tickets for Stage 1. Later stages keep the PRD's order and get their own tickets when they start.

## New code

| Path | Purpose |
|---|---|
| `skylens-rn/src/state/flags.ts` | Feature flags, overridable at build time and on device |
| `skylens-rn/src/state/skyModes.ts` | Mode recipes and defaults |
| `skylens-rn/src/data/catalogs/` | Cell grid, index, deep pack and pack storage adapters |
| `skylens-rn/src/features/sky/labels.ts` | Pure label decluttering |
| `skylens-rn/src/features/sky/grids.ts` | Coordinate grids |
| `skylens-rn/src/features/sky/perf.ts` | On-device frame timing and counters |
| `skylens-rn/tests/validation.test.ts` | Reference comparisons, writes `VALIDATION_REPORT.json` |

The renderer, astronomy engine, design tokens, navigation and AR stay where they are.

## Tickets

| # | Ticket | Depends on | Test gate |
|---|---|---|---|
| 1 | Frozen references and validation report | None | Thresholds pass, report written |
| 2 | One drawing frame for all objects | 1 | Ring and body coincide |
| 3 | Cell index with proper-motion margin | None | Zero false negatives against brute force |
| 4 | Deep pack, storage adapters, bounded cache | 3 | Round trip, checksum failure falls back |
| 5 | Modes and per-mode settings with migration | None | Old saved data migrates |
| 6 | Draw and hit-test through the index, old path kept | 3, 4, 5 | All baseline tests and flows |
| 7 | Grids and boundaries | 5 | Known poles, polygons agree with the engine |
| 8 | Label policy | 5 | No overlaps, selection always named |
| 9 | Hit test matches what is drawn | 6 | Hidden objects can't be tapped |
| 10 | Mode switch, Layers panel, selection card | 5 | Browser flows |
| 11 | Pinch and double tap about the fingers | None | Sky under the fingers stays put |
| 12 | Off-screen guide, timing panel, atlas readout | 6 | Browser flows |
| 13 | iOS flows and captures | 10 | Maestro in `rn-ios.yml` |
| 14 | Screenshot comparison and reports | 13 | Reviewed images recorded |

## Flags and rollback

| Flag | Default | Off means |
|---|---|---|
| `catalogsV1` | On | The original linear loops and tap test |
| `skyModes` | On | No switch. Today's Explore sky |
| `deepPack` | On | No pack is opened. Stars stop at V 8.0 |

Flags can be set by `EXPO_PUBLIC_FLAG_<NAME>` at build time and from More → Sky engine on a device. A failed pack leaves the base catalog drawing and shows a notice. `git checkout skylens-v1-stage0-baseline` restores the audited code. TestFlight only changes on a push to `rn-testflight`, which stays the owner's decision.

## Gates

| Gate | Where | State |
|---|---|---|
| Science: planets < 60″, Moon < 120″ against Horizons | `tests/validation.test.ts` | Runs in CI |
| Science: stars against ERFA, catalog against SIMBAD | Same | Runs in CI |
| LOD: zero false negatives | `tests/catalogs.test.ts` | Runs in CI |
| Build and flows on iOS | `rn-ios.yml` | Runs on each push to `skylens-rn` |
| Frame time, memory, battery, compass on hardware | Physical iPhone | `DEVICE_NOT_TESTED` |

## Size budget

Adding the pack grows the app by about 2.2 MB, the size of the file. The app bundles no more stars at launch, and the pack is read only in Deep Atlas once the view needs stars past V 8.0.
