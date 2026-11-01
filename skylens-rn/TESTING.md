# Testing

Evidence for this design work, gathered before its first iOS run. Results from `rn-ios.yml` and `rn-testflight.yml` replace the "Not verified" items as they arrive. The flows last ran before the final twilight label change, which had a typecheck and a browser check.

## Run here on Windows

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | Clean |
| Astronomy and logic | `npx vitest run` | 48 of 48, including 378 JPL Horizons fixtures |
| Real flows, web build | `node scripts/web-flows.mjs <out>` | 14 of 14 |
| Screens painted | `node scripts/web-shot.mjs <out> ...` | 11 of 11 |

Flows cover search, Find in Sky, pan, tap selection, layers, daylight and night preview, typo search, Time Travel, location change, favorites, first run and reload, tabs, Calendar gating, the honest paywall, and Explore segments.

Lint (`npx expo lint`) has not been run, because the project has no ESLint configured.

## Bugs testing found

- **Tap-to-select never fired on web.** The tap sat behind pan in an `Exclusive`. Fixed in `SkyView.tsx`. A Maestro tap and drag flow was added in commit 9ba8868, but it hasn't run against this fix.
- **A blank page passed as a clean screenshot.** `web-shot.mjs` now waits for content and rejects flat frames.
- **`sky-canvas` was never in the DOM.** The test ID moved to the wrapping view.
- **Close and Back had nowhere to go on a deep-linked screen,** which raised a `GO_BACK` error in development and did nothing. Both now fall back to the sky.
- **The bright Milky Way core clipped** to a flat block in the night preview. It now has a soft shoulder.

## Star catalog cost

The bundle went from 12,443 to 41,411 stars, adding about 1.1MB to `stars.ts`. Measured in Node on this PC, which is a lower bound and **not a phone**: building the star field took 3.7ms, and culling every star took 0.23ms per frame. Hermes has no JIT, so a device will be much slower. In the sky loop, stars past the limit for the current zoom are skipped, so all of them are only considered when zoomed in.

## Not verified

These need the Simulator or a physical iPhone.

| Item | Needs |
|---|---|
| This work builds under Xcode, including the new shader and asset sizes | Simulator run after a commit |
| The Maestro flows against these screens | Simulator run after a commit |
| Frame rate, and start-up time with 41,411 stars | Physical iPhone |
| Pinch gesture | Physical iPhone or Simulator |
| Compass and sensor orientation | Physical iPhone |
| AR camera feed, alignment and photo capture | Physical iPhone |
| Real GPS permission flow | Physical iPhone |
| Real StoreKit products, purchase and restore | App Store Connect products |
| VoiceOver and Reduce Motion with the setting on | Physical iPhone |
| Fonts as rendered on iOS | Simulator run after a commit |

## V1 Stage 1

| Check | Command | Result |
|---|---|---|
| Unit, science and catalog tests | `npx vitest run` | See `IMPLEMENTATION_STATUS.md` |
| Validation report | `WRITE_VALIDATION=1 npx vitest run tests/validation.test.ts` | Writes `docs/skylens-v1/VALIDATION_REPORT.json` |
| Star loop timing | `BENCH=1 npx vitest run tests/perf.test.ts` | Node only, a comparison between code paths |
| Sky state captures | `node scripts/web-states.mjs <out>` | Web only |
| Reference fixtures | `scripts/reference/` | Fetched by hand, never by the app |

Bugs this work found:

- **A selection ring sat up to 35.85′ from its planet near the horizon.** Fixed by drawing everything in one frame.
- **Faint zoomed stars could not be tapped,** and deep-sky objects could be tapped when not drawn. Taps now reach only what the frame drew.
- **Pinch ignored the fingers.** It now zooms about them.
- **A test helper counted a boundary's antipode as inside it,** which read as 51% agreement. The data was sound.
