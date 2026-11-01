# SkyLens V1 — Performance Results

**No frame rate, memory, battery or thermal figure has been measured on a physical iPhone. `DEVICE_NOT_TESTED`.** The numbers below compare code paths on a Windows PC. They can't be converted into phone numbers, because V8 has a JIT and Hermes doesn't.

## Star loop, Node on this PC

From `BENCH=1 npx vitest run tests/perf.test.ts`. Median of 60 runs. The original time includes the per-frame array it allocated, which is gone in both paths.

| View | Star limit | Stars scanned, original → indexed | On screen | JS time, original → indexed |
|---|---|---|---|---|
| Explore, 46° | V 6.7 | 11,387 → 2,893 | 1,464 | 0.465 → 0.207 ms |
| Explore, 26° | V 8.1 | 41,411 → 4,414 | 1,760 | 1.401 → 0.193 ms |
| Explore, 6° | V 11.5 | 41,411 → 547 | 159 | 1.176 → 0.099 ms |
| Deep Atlas, 26° | V 8.7 | 41,411 → 4,414 | 1,760 | 1.212 → 0.162 ms |
| Deep Atlas, 6° | V 12.1 | 41,411 → 547 | 159 | 1.805 → 0.090 ms |
| Deep Atlas, 2° | V 14.5 | 41,411 → 229 | 27 | 1.632 → 0.150 ms |

Scan counts cover the bundled stars. Deep pack stars are added only for tiles in view.

## Deep pack

| Measure | Result |
|---|---|
| File size | 2,878,598 bytes, adding about 2.9 MB to the app. Stage 2 added 0.7 MB for star numbers and designations |
| Stars | 76,806, V 8.01 to 14.08 |
| Read on a real pinch to 4° | 130 tiles, 6,281 stars, 8% of the pack |
| Cache ceiling | 50,000 stars. Test holds a 5,000 ceiling, peak within one batch |
| Memory saved per frame | The 331 KB array the old loop allocated is gone |

## On-screen timing panel

The Layers panel now shows JS frame time (p50, p95, worst), stars drawn, scanned, loaded and indexed, and pack state. It reads only the time spent recording a frame on the JS thread, not Skia's GPU work.

| Environment | Frame JS p50 | p95 | Note |
|---|---|---|---|
| Headless Chrome with software GPU | 7.4 ms | 37.2 ms | Web Skia under SwiftShader. Not comparable to iOS |
| iPhone Simulator, Release, in CI | Awaiting a run | | `flow_diagnostics_atlas` screenshot |
| Physical iPhone | `DEVICE_NOT_TESTED` | | Open Layers and read the panel after a minute of use |

## Stage 2 calculations, Node on this PC

From `BENCH=1 npx vitest run tests/perf.test.ts`. Hermes has no JIT, so expect each of these to be many times slower on a phone. The ratio isn't known until a device run.

| Calculation | Time | When it runs |
|---|---|---|
| Search index, first build | 98 ms | Once, after the panel or search first paints |
| Pack numbers into search | 14 ms | Once. It was 69 ms before moving to native sorting |
| A search | 1.6 ms | Each keystroke |
| Altitude chart, the Moon | 50 ms | After the Observing tab paints |
| Altitude chart, a star | 4 ms | After the Observing tab paints |
| Related objects, first | 15 ms | Once, then under 1 ms |
| Discovery pass | 0.4 ms | Every 1.2 s with the panel open. It was far heavier before reusing the frame's Sun altitude |

## PRD budgets

| Budget | State |
|---|---|
| p95 frame time ≤ 20 ms on a reference iPhone | `DEVICE_NOT_TESTED` |
| 20-minute session with no memory growth | `DEVICE_NOT_TESTED`. Cache is bounded by test |
| Catalog at 50k, 250k, 1M indexed | Tested at 118,217, all that exists without Gaia |
| Offline sky | No network code in the sky. Airplane mode unproven on hardware |
| Battery and thermal | `DEVICE_NOT_TESTED` |

## Bottleneck

Not yet identified on a device. On this PC the star loop takes a fraction of a millisecond while a whole web frame takes about 7 ms, which suggests most of the cost lies elsewhere, but those two figures come from different engines. Whether Skia needs replacing can only be decided from device numbers, so the renderer stays.
