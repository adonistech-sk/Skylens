# Visual Comparison

Every "actual" image here is a real capture of the React Native Web build in headless Chrome at 393×852 with iPhone 16 insets. **None is from iOS.** Web text and Skia rendering can differ on a device.

- Actual: `screenshots/final/<screen>.png`
- Five-panel comparison: `screenshots/final/compare/<screen>.jpg` (reference, aligned reference, app, overlay, heatmap)
- Reference beside app: `screenshots/final/review-1-5.jpg`, `review-6-10.jpg`
- Starting point: `screenshots/baseline/`
- iPhone SE and Pro Max sizes: `screenshots/sizes/`

Reproduce with `node scripts/web-shot.mjs`, `visual-compare.mjs` and `contact-sheet.mjs`.

## Blurred distance

This is a coarse check that an edit moved a screen toward its reference. It is **not a similarity score**, and the rubric in the brief was used as judgement only. The references are squatter than an iPhone, so they are stretched to align, which inflates every number. Baseline captures had no safe area, so the columns are not strictly comparable.

| Screen | Baseline | Final | Mostly due to |
|---|---:|---:|---|
| 01 Welcome | 8.8% | 10.0% | Different city pattern. **No improvement by this measure**; the Earth does read closer by eye |
| 02 Location | 10.1% | 7.8% | Layout height |
| 03 Sky View | 8.5% | 6.6% | Milky Way position, which is true |
| 04 Object Detail | 6.3% | 4.5% | Galaxy shape |
| 05 Tonight | 5.9% | 4.3% | Different date and Moon |
| 06 Explore | 9.6% | 8.0% | Hero crop |
| 07 Time Travel | 7.0% | 7.7% | Earth surface detail. **No improvement by this measure** |
| 08 AR Sky | 13.7% | 10.7% | Stand-in photo, which is test-only |
| 09 Events | 5.9% | 6.1% | Real event list is longer |
| 10 Pro | 11.6% | 11.2% | Disabled CTA and pricing slot |

## By screen

### 01 Welcome
- **Corrected:** Earth re-rendered as a tilted limb with a sunrise, orange tone-mapped city lights, Milky Way at top right, staggered text entrance, slow image settle.
- **Remaining:** lights are real geography, not the reference's lattice. The logo emblem is smaller.
- **Function:** Get Started and the first-run path pass in web flows.
- **Blockers:** none.

### 02 Location
- **Corrected:** new twilight mountain composition with a central peak, reference line breaks and proportions.
- **Remaining:** pin sits slightly lower. The Back control appears only with history.
- **Function:** manual selection passes. Real GPS needs a device.
- **Blockers:** none.

### 03 Sky View
- **Corrected:** new Orion figure from the approved art, opening framing at the design's scale, star-free Milky Way map, 41,411 catalog stars, labels thinned, bright stars with real colour, copper compass dome, landscape framing, selection ring.
- **Remaining:** bright stars are less orange and glowing than the reference. The figure is taller and narrower because three real stars fix its shape. Milky Way is fainter here, because this is its faint side.
- **Function:** pan, glide, tap selection, identify, layers, daylight and night preview pass in web flows. Pinch and compass need a device.
- **Blockers:** frame rate on iPhone unmeasured.

### 04 Object Detail
- **Corrected:** real NOIRLab M31, whole disc in frame, warm core, tightened title, copy and action bar.
- **Remaining:** spiral arms are subtler than the stylized reference, and the core is paler and larger. Overview copy runs five lines against three.
- **Function:** Find in Sky and favorites pass in web flows.
- **Blockers:** none.

### 05 Tonight
- **Corrected:** Moon scale, softer terminator, earthshine, thinner arc, active-tab glow.
- **Remaining:** dark limb is deeper than the reference.
- **Function:** Sydney changes the plan in web flows. All values are computed.
- **Blockers:** none.

### 06 Explore
- **Corrected:** hero height and crop on the Trapezium, deeper pink, sliding segments, category fades.
- **Remaining:** real Hubble nebula is more filamentary than the reference's soft burst. Constellation and Deep Sky thumbnails are real data, not the stylized icons.
- **Function:** segments and tabs pass in web flows.
- **Blockers:** none.

### 07 Time Travel
- **Corrected:** curved Earth dome from the design's own curvature, blue rim, orbit arcs concentric with Earth and scaled to width, finer scrubber, smaller play button.
- **Remaining:** city lights dimmer and less central. Scrubber sits at the true time, not the reference's position.
- **Function:** forward, play, pause, speed and Now pass in web flows.
- **Blockers:** none.

### 08 AR Sky
- **Corrected:** focused lines, ORION label, off-screen label flip, frame guide, stand-in photo for test mode.
- **Remaining:** stars print over tree silhouettes on the stand-in, as an overlay would over a real camera. Rigel's position differs from the stylized figure.
- **Function:** layout only on web. Camera, sensors and alignment are **not verified here**.
- **Blockers:** requires a physical iPhone.

### 09 Events
- **Corrected:** taller rows, New Moon removed from Upcoming but kept in Calendar, sliding segment, visible limb on new-Moon thumbnails.
- **Remaining:** several Full Moon rows in a row, as computed. The reference's meteor and conjunction rows need those events to fall in range.
- **Function:** Calendar gating passes in web flows.
- **Blockers:** none.

### 10 SkyLens Pro
- **Corrected:** Saturn scale, tightened hierarchy, real pricing slot with a designed unavailable state, floor glow, Restore Purchases.
- **Remaining:** Saturn is more shadowed. The CTA is dimmed here only because no products load on web.
- **Function:** the honest unavailable state passes in web flows.
- **Blockers:** real purchases need App Store products and a device.
