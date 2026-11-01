# Visual Audit

**Baseline:** iPhone 17 Simulator, iOS 26.2, 402 × 874 pt @3x, from `.github/workflows/rn-ios.yml`. Fixed observer and clock (Bratislava, 2027-01-17 21:25 local), all values still calculated. Reference and screenshot are compared at the same height.

**This audit covers commit `ff8ab8e`, run 41343346541.** Frames and side-by-sides are in `design/ios-baseline/`, with the interaction frames in `flows/`. Any later visual work must be recaptured before it can be claimed here.

**Correction:** the audit for `787e800` rated screen 01 from an earlier run. The saved `01_onboarding` frame for that commit, and for `67fc7b3`, was actually the sky, byte for byte the same as `03_sky_view`. The first deep link of a fresh install lost to the start-up redirect. `maestro/capture/all.yaml` now waits for the app and asserts the onboarding button before capturing, so this run is the first true iOS frame of the locked onboarding screen.

The references are artificially proportioned concept art, about 0.58 wide-to-tall against 0.46 for a real iPhone, so screens are taller here by design. No score is given, because the rubric is qualitative.

| Status | Meaning |
|---|---|
| **Matched** | Layout, hierarchy, type and colour read as the reference |
| **Close** | Same composition, with a named visible difference |
| **Differs** | A deliberate or forced difference, explained |

## Screens

| # | Reference | Screenshot (`design/ios-baseline/`) | Status | Remaining difference | Latest fixes |
|---|---|---|---|---|---|
| 01 | `01_onboarding.png` | `01_onboarding.jpg` | Close | The Milky Way band is broader and fainter than the reference's vivid violet one. The Sun's flare is smaller. City lights are the real ones of Europe | Capture repaired, so this is now a true frame |
| 02 | `02_location.png` | `02_location.jpg` | Close | Generated landscape, not a real place. The peak sits lower because the phone is taller | Regenerated from the reference |
| 03 | `03_sky_view.png` | `03_sky_view.jpg` | Close | The reference's bright Milky Way runs where the real winter sky has none, so that band is absent. The real asterism sets the figure's pose, so it is taller and narrower. The treeline is simpler | Large figure, compass dome, far treeline removes the straight ground edge |
| 04 | `04_object_detail_andromeda.png` | `04_object_detail_andromeda.jpg` | Close | The core is larger and warmer, and the arms are less violet. Data is real: 2.5 Mly and 3.0° × 1.1° | Regraded to keep the source's dust lanes. Overlay no longer greys the core |
| 05 | `05_tonight.png` | `05_tonight.jpg` | Matched | Values are real for this date. A third row and a "complete list" link replace the second row | |
| 06 | `06_explore.png` | `06_explore.jpg` | Matched | Hubble's real nebula is redder and busier than the concept art | |
| 07 | `07_time_travel.png` | `07_time_travel.jpg` | Close | Rendered from NASA maps, so city lights are real. Arcs are a true sky dome, so the dots differ, and they are labelled | |
| 08 | `08_ar_sky.png` | `08_ar_sky.jpg` | **VISUAL NOT VERIFIED** | The Simulator has no camera. The background is a labelled stand-in, so this shows only the overlay and controls. The view centres on Monoceros, not Orion. No real camera frame has been seen | |
| 09 | `09_events.png` | `09_events.jpg` | Close | Real event list, so more and different rows. No meteor shower falls in the first rows for this date | |
| 10 | `10_pro_paywall.png` | `10_pro_paywall.jpg` | Differs | Copy changed on purpose: the reference promises features that don't exist. Button is dimmed and a notice shows because the Simulator has no store products. Cassini's real Saturn is lit differently from the concept | |

Screens 11 (star detail) and 12 (search) have no reference. Both render cleanly in this run.

## Interaction frames

`flow_tap_selects_star` and `flow_drag_moved_sky` from this run's flow 05 show a tap selecting Betelgeuse, with its card and ring, and a drag moving the sky and compass together. Only one "S" shows on the compass in either frame, so the doubled letter seen on the old renderer does not appear here.

## Typography

The spec suggested Instrument Serif. At side-by-side it was visibly narrower than the reference, so Newsreader Regular (OFL) was chosen.

## Not yet checked

- Dynamic Type at large sizes
- A small screen (iPhone SE class) and a large one (Pro Max) on iOS. Spot-checked on web only
- Tap target review on a device
- Any physical iPhone
