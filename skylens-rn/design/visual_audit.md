# Visual Audit

**Baseline:** iPhone 17 Simulator, iOS 26.2, 402 × 874 pt @3x, from `.github/workflows/rn-ios.yml`. Fixed observer and clock (Bratislava, 2027-01-17 21:25 local), all values still calculated. Reference and screenshot are compared at the same height.

**This audit covers commit `787e800`, run 41326574682.** Frames and side-by-sides are in `design/ios-baseline/`. Any later visual work must be recaptured before it can be claimed here.

The references are artificially proportioned concept art, about 0.58 wide-to-tall against 0.46 for a real iPhone, so screens are taller here by design. No score is given, because the rubric is qualitative.

| Status | Meaning |
|---|---|
| **Matched** | Layout, hierarchy, type and colour read as the reference |
| **Close** | Same composition, with a named visible difference |
| **Differs** | A deliberate or forced difference, explained |

## Screens

| # | Reference | Screenshot (`design/ios-baseline/`) | Status | Remaining difference | Fixes made |
|---|---|---|---|---|---|
| 01 | `01_onboarding.png` | `01_onboarding.png` | Close | The Milky Way is faint where the reference has a vivid violet band | Night side with real city lights; removed a band artifact; Newsreader Light |
| 02 | `02_location.png` | `02_location.png` | Close | Real Tetons photo, so brighter sky and larger peaks than the illustration | Recropped and regraded twice |
| 03 | `03_sky_view.png` | `03_sky_view.png` | Close | Real geometry: Orion is about 18° tall, so it fills less of the frame than in the concept. The real winter Milky Way is fainter around Orion. Artwork is pinned to real stars, so its pose differs | Horizon, compass, label density, deep background, stale-frame blank fixed |
| 04 | `04_object_detail_andromeda.png` | `04_object_detail_andromeda.png` | Close | The photo is much less vivid, because the vivid candidate has a disputed license. Data is real: 2.5 Mly and 3.0° × 1.1° | Graded hero, solid peach segment, two-line title |
| 05 | `05_tonight.png` | `05_tonight.png` | Matched | Values are real for this date. A third row and a "complete list" link replace the second row | Real phase shader, Moon removed from the list |
| 06 | `06_explore.png` | `06_explore.png` | Matched | Hubble's real nebula is less magenta and busier than the concept art | Hero height and title size |
| 07 | `07_time_travel.png` | `07_time_travel.png` | Close | Rendered from NASA maps, so city lights are real. Arcs are a true sky dome, so the dots differ. Time of day shows no Sun | Night side, blue rim, arc baseline |
| 08 | `08_ar_sky.png` | `08_ar_sky.png` | **VISUAL NOT VERIFIED** | The Simulator has no camera. The background is a labelled stand-in, so this shows only the overlay and controls. No real camera frame has been seen | Art removed from AR, labels reduced |
| 09 | `09_events.png` | `09_events.png` | Close | Real event list, so more and different rows. No meteor shower falls in the first rows for this date | Moon thumbnails show the true phase |
| 10 | `10_pro_paywall.png` | `10_pro_paywall.png` | Differs | Copy changed on purpose: the reference promises features that don't exist. Button is dimmed here because the Simulator has no store products. Cassini's real Saturn is lit differently from the concept | Recomposed Saturn three times |

## Typography

The spec suggested Instrument Serif. At side-by-side it was visibly narrower than the reference, so Newsreader Light (OFL) was chosen.

## Not yet checked

- Dynamic Type at large sizes
- A small screen (iPhone SE class) and a large one (Pro Max)
- Tap target review on a device
- Any physical iPhone
