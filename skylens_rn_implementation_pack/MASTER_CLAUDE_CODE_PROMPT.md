# SKYLENS — REFERENCE-LOCKED REACT NATIVE BUILD
## Senior staff engineer × astronomy architect × editorial mobile designer

You are acting as the technical owner, visual design lead, and QA lead of SkyLens, a premium astronomy application. The product owner is not a programmer. Make the technical decisions, implement them directly, and report verifiable outcomes in plain language. Do not respond with a plan only: execute against the repository.

## 0 — Non-negotiable mission

Build a genuine native-feeling iOS app using React Native + Expo + TypeScript, with high-fidelity interfaces matching the TEN separate screen references in `design/visual-targets/reference_screens/` and the full composition in `design/visual-targets/reference_full/skylens_final_visual_target.png` (or the equivalent paths in the supplied reference pack).

This image is the SOURCE OF TRUTH for art direction, composition, content density, colors, typography, navigation and hierarchy. Do not reinterpret it as another generic astronomy theme. Aim for the closest feasible visual result on a real iPhone. It is a generated visual concept, NOT a runnable screen or an astronomically correct dataset. Adapt its impossible proportions and inaccurate sample values to a real device without losing the visual style. Do not put mockup screenshots inside the application as screen backgrounds.

The target is BOTH: (1) strong visual matching; (2) real interactivity and valid astronomy. If one is not implemented, disclose that; do not pretend.

## 1 — Preserve the existing SwiftUI project: audit before migration

FIRST: inspect the whole current repository. Search for `.xcodeproj`, `.xcworkspace`, `.swift`, `.metal`, `.plist`, astronomical datasets, shaders, camera/AR services, Core Motion/Core Location modules, subscription and persistence. Try to build and run the existing app only if Xcode is available.

Before changing anything:
- Create a safe git branch or equivalent backup, without overwriting or deleting the original SwiftUI application.
- Produce `MIGRATION_AUDIT.md`: existing modules, proof they are working or broken, dependencies, license findings, tests, native dependencies, reuse cost and risks.
- Select one path with reasoning: A) Expo app with embedded, existing Swift astronomy/Metal sky renderer (preferred IF robust); B) Expo app with reused Swift computations but new Skia-based sky renderer; C) fresh TS astronomy calculations/renderer only IF the previous modules are incorrect, unusable or a native bridge would cost more than rewriting them.
- Use a small compileable integration spike before choosing an expensive path. A preserved native sky view is not a reason to keep old generic SwiftUI menus.
- Never rewrite proven scientific calculations merely to make the codebase “100% TypeScript”. React Native can integrate native modules.
- Keep the source app available side-by-side. If a new folder is needed, use `skylens-rn/`, not destructive replacement.

## 2 — Implementation architecture

Preferred stack, subject to compatibility verification against current official documentation:
- Expo, React Native, TypeScript, New Architecture and development build (not Expo Go for native bridges).
- Expo Router or a tested equivalent navigation setup.
- Reanimated + Gesture Handler for animations, bottom sheets, pan, pinch and gestures.
- `expo-image` for real photography and caching.
- Expo Location and appropriate motion/compass APIs. Use native Swift module if orientation precision/smoothing needs it.
- Reuse existing Swift astronomic engine when possible via Expo Modules APIs.
- For the sky renderer: native Metal/CoreGraphics/Swift view wrapped for React Native if working and performant; otherwise React Native Skia with real data, projection and hit testing.
- AR: actual camera feed + device-orientation mathematics. Add native ARKit integration only where it materially improves features. Provide device capability and permissions fallback.
- Local persistence for favorites, preferences, observing location, onboarding.
- StoreKit 2 through an appropriately tested integration for real purchases; no fake purchase success.

Code layering: `app/`, `src/design/`, `src/components/`, `src/features/sky/`, `src/features/explore/`, `src/features/tonight/`, `src/features/events/`, `src/features/time/`, `src/features/ar/`, `src/features/subscription/`, `src/astronomy/`, `src/data/`, `modules/sky-native/` (if needed), `assets/`, `design/visual-targets/`, `tests/`.

One shared `ObserverContext`: location, date/time mode, time zone, heading/orientation status, selection, current sky state. Search, Tonight, AR and Object Detail must read the same computed facts.

Do not add a backend, login wall or large dependency tree without a real requirement. Keep frame-critical rendering out of unnecessary React render loops.

## 3 — Visual system: reverse engineer the supplied image, not your imagination

The full reference represents an elegant *cosmic editorial observatory*: midnight navy + nuanced indigo/purple space; warm peach-orange highlights; refined serif headline; neutral white microtypography; genuine-seeming astronomy photography; black/transparent compact UI surfaces; atmospheric gradients used sparingly; no neon candy colors.

Starting tokens to calibrate from the actual reference image (do NOT treat these hexes as final without sampling):
- base background `#070B17`; dark surface `#0B1020`; elevated surface `#111A30`;
- luminous primary text `#F5F2F0`; secondary `#A8AFBE`;
- peach accent `#F5B394`; warm highlight `#FFCAA7`; cool accent `#9FAFE1`;
- hairlines white alpha 0.08–0.15; subtle peach outline for selected controls.

Typography: use a legally licensed high-contrast editorial serif similar to Instrument Serif (verify actual font files/licenses from a trusted source) for large titles, paired with a clear sans like Inter or a system-native alternative for controls and data. Do not substitute a generic geometric heavy sans for all headings. Keep display italic only when aesthetically appropriate. Use tabular figures for time, coordinates and technical values. Avoid fake fonts or screenshot text as image assets.

Visual language:
- stunning, layered sky photography/renderer; restrained labels;
- full-bleed scenes, no rectangular black header blocking the view;
- fine spacing and thin dividers; no dashboard card jungle;
- small, carefully designed icons and controls with comfortable hit areas;
- shallow transparent control trays; peach is used to indicate decisions and selected states, NOT everywhere;
- realistic celestial imagery (appropriate source and attribution) in Object Detail / Explore;
- transitions should be elegant, minimal and functional;
- support safe areas and real phone dimensions, especially Dynamic Island and home indicator.

Do not use: default Expo tabs, default iOS Settings Form styling for the whole app, floating neon blobs, arbitrary stars as a static background for the sky view, gradients over every button, giant rounded SaaS cards, overlarge fonts, repeated unrelated stock photos, or a uniform template for every screen.

## 4 — Screen-by-screen visual contract (TEN screens)

Read the respective PNG alongside each instruction. Match layout, visual proportions, hierarchy and personality at a real iPhone target size, preserving reasonable tappability and safe areas.

**01 Onboarding (`01_onboarding.png`):** Edge-to-edge deep-space background with the illuminated Earth horizon occupying the lower half. Brand lockup near upper-left, with a small peach four-point celestial emblem. Beautiful white serif heading “Explore the Universe” in the middle-left; “the” italicized. One short sans introduction. A wide peach gradient *Get Started* control close to bottom. No multiple decorative cards or generic onboarding illustrations. “Get Started” opens Location.

**02 Location (`02_location.png`):** Mountain horizon photograph / licensed asset and subtle twilight colors in upper half; minimalist back action; centered outlined location symbol above tiny tracked uppercase `YOUR LOCATION`; serif question “Where are you stargazing?”; one short supporting line; primary peach “Use Current Location”; secondary outlined “Choose Manually”. Both actions actually work, including permission rejection. Preserve generous calm negative space.

**03 Live Sky (`03_sky_view.png`):** The primary product. Full-frame astronomical scene with glowing Orion stars and accurate constellation-line geometry. An original subtle artistic Orion overlay MAY be used separately if supported by a properly created/owned asset, and must never misrepresent actual coordinates. Stars and labels come from real calculations. Search circular icon top-left, layered settings top-right, fine cardinal/horizon arc and azimuth ticks near bottom, minimal five-control strip near bottom. One selected control has restrained peach glow. Dark navy, rich star field with nuanced violet region, very low UI weight. On manual date changes, star positions genuinely update. Never achieve this by displaying the screenshot as wallpaper. Make touch selection, compass and Find-in-Sky functional.

**04 Object Detail (`04_object_detail_andromeda.png`):** A cinematic Andromeda galaxy image in upper section. Back, favorite, share at top. Small M31 designation. Large elegant serif `Andromeda Galaxy`, subtitle `Spiral Galaxy · 2.54 million light-years` (verify scientific source; use real data in production). Thin pill segment `Overview / Observing / Details`, selected peach tab. Compact body copy, fine-lined three scientific metadata cells, outlined `Find in Sky` action and star/favorite action. No individual metadata cards. Photo must have correct attribution and rights. Opening from sky/search resolves this exact catalog object, favoriting persists, find focuses on actual coordinate.

**05 Tonight (`05_tonight.png`):** Large left-aligned serif `Tonight`, small current location and date. Large detailed Moon image with thin crescent/phase accent to its right and compact illuminated fraction. Three tiny sunrise/twilight/sunset columns with warm/cool icons and fine vertical spacing. One divider. `Best to See Tonight`, narrow object list rows with real thumbnails, visibility description and chevrons. Small quiet bottom nav (Sky, Tonight, Explore, Events, More) with peach selected state. For real app use real ephemerides and current location; demo fixture must be marked as design/test only.

**06 Explore (`06_explore.png`):** Serif `Explore` top, search button top-right. Narrow 3-way segmented browse (`Featured / Solar System / Deep Sky`), subtle selected peach glass. One broad, editorial featured astronomy photo with small overlay label, serif title and circular directional arrow, then elegant small object-category rows (Planets, Constellations, Deep Sky). Same bottom nav as Tonight. Real category, search and object links.

**07 Time Travel (`07_time_travel.png`):** Dark immersive astronomy visualization with Earth horizon and precise thin orbital curves occupying upper/middle. Title `Time Travel`, compact close action. Date and time line, thin delicate tick-mark ruler with one glowing peach position marker. Minimal replay / back / play / forward / speed controls, highlighted circular peach play. Compact `Now` button. All controls modify the astronomy simulation; play changes time, pause stops, Now resets. Do NOT use a fake animated orbit unrelated to date.

**08 AR Sky (`08_ar_sky.png`):** Real live camera composition, visually comparable to dark blue-pink twilight with tree silhouettes. Fine star/constellation overlays, `AR Sky` peach selected segmented mode and `Sky` alternative near upper center, close left, settings right. Selected object label (Betelgeuse), Orion label, fine frame guide. Bottom utility circle, camera shutter, and full-screen/direction control. Camera shutter captures a real screenshot/photo if implemented; otherwise do not show an inert shutter. Implement permission denial and sensor alignment guidance.

**09 Events (`09_events.png`):** Serif `Events` title, calendar icon at top. Peach outlined segmented `Upcoming / Calendar`. List on near-black background: date stacked vertically on left (large day + small uppercase month), compact event thumbnail, event title and short grounded subtitle, right chevron. Very thin separators; no event cards. Bottom nav with Events peach selected. Use actual verified event data and real date/time zones.

**10 Pro (`10_pro_paywall.png`):** Immersive dark scene with Saturn occupying upper-right/upper-half, delicate star field. Crown line icon in peach, elegant serif title `SkyLens Pro`, refined short description, four succinct feature rows with fine peach outline icons. Large peach `Unlock Pro` at lower section. Include accurate localized pricing/trial disclosures, Restore, Terms and Privacy through correctly implemented UI even if these require a small departure from the illustration. No false subscription promise. Functional StoreKit flow, not an alert saying “premium activated”.

## 5 — Real photography, no pasted mockups

The reference collage and ten crops are **visual guides only**, not app assets. Never set a screenshot as the background of a screen, or crop text/buttons out of the mockup and call them real UI.

Source authentic astronomy imagery when possible from ESA/Hubble, NASA, ESA/Webb or other properly licensed sources; verify object identity, copyright/attribution and required credits per file. For Earth, Saturn, Moon, Orion Nebula and Andromeda use content-specific suitable images, not unrelated generic galaxy photos. Some visually stylized hero scenes from the concept may require original licensed/synthesized art and must NOT be misrepresented as telescope photographs. Build a `ASSET_CREDITS.md` and keep a manifest mapping each visual to origin/license/screen. Optimize assets for mobile size and caching.

Keep star map as a real renderer. When selected catalog imagery differs from the artistic mockup, preserve composition, cropping, atmosphere and hierarchy while using scientific truth.

## 6 — Functional obligations, no demo slop

Implement real workflows for all ten screens: onboarding and permissions; selecting location manually/current; star map pan/zoom/compass and object selection; search + detail + favorites + Find in Sky; Tonight recommendations from real positional data; Explore search and categories; Time Travel with correct ephemeris updates; camera with valid AR overlay and capability/permissions handling; Events with verified datasets; Pro with real entitlement flows.

All visible buttons must do what their labels say. If a complex function cannot be delivered within the current milestone, remove/hide it in a finished fashion or show a clearly labeled unavailable state. Do not create fake functional-looking objects. Do not invent weather, altitudes, event peaks, Moon illumination, prices, or GPS locations. Keep demo fixtures in `__DEV__` / deterministic screenshot mode only, clearly separated from production logic.

## 7 — Visual verification is mandatory, not optional

Select one actual iPhone simulator/device target (e.g. a standard 6.1-inch contemporary iPhone) and keep its model/OS constant for baseline screenshots.

For EVERY screen:
1. Open its individual reference PNG and record its hierarchy, spacing, relative positions, typography treatment, image crop and color.
2. Implement its real React Native view with responsive safe areas.
3. Build/run the actual app using the available development environment (or EAS development build + physical iPhone if no macOS).
4. Capture a genuine app screenshot, same screen/state and viewport target.
5. Review target vs implementation side-by-side. If automated comparison is used, normalize aspect ratio and separate dynamic astronomy/image regions from deterministic UI before considering a pixel score.
6. Identify the 3 most visible mismatches, correct them, capture again. Repeat at least twice for key screens if issues remain.
7. Check tap targets, scrolling, Dynamic Type, small screen, and at least one large screen.

Make `design/visual_audit.md` including reference file, screenshot path, what is different, fixes and status for every screen. If image inspection, screenshot capture or simulator access is unavailable, mark VISUAL NOT VERIFIED; never claim “1:1 achieved”. A static showcase's phone shape and sample values are not guaranteed to map exactly onto physical iPhone dimensions.

Comparison rubric: 30% layout/composition, 20% image/crop/atmosphere, 20% typography/hierarchy, 15% surface/colors, 15% controls/spacing. This is a qualitative internal checklist, not a fabricated scientific score. Overall design still fails if the sky is visually generic.

## 8 — Build gates and checkpoints

**Gate 0: Audit and migration spike** — verify Swift source, choose preservation path, establish a booting Expo dev build. Preserve the original.

**Gate 1: Design foundation** — licensed typefaces, color tokens, image manifest, reusable Control, SegmentedControl, AstronomicalRow, Header, sheet, icon primitives. Show real screenshot of Onboarding and Location. Do not overbuild a generic component library.

**Gate 2: Main sky** — genuine data-driven renderer with interaction and an actual screenshot comparing to `03_sky_view.png`. Do not move on until the visual result feels premium and the selected coordinates are credible.

**Gate 3: Object Detail + Explore** — visual and functional parity, genuine images and data. Verify screen screenshots.

**Gate 4: Tonight + Time Travel + Events** — actual calculations, deterministic test mode, screenshot verification.

**Gate 5: AR + subscription + production hardening** — camera, native sensors and validated overlays; paywall StoreKit; permissions, errors, QA and device testing.

At each gate, keep the project compilable where tools allow. Update `IMPLEMENTATION_STATUS.md` with Built / Tested / Partially implemented / Blocked, including proof. Do not report an entire gate complete just because its JSX screens exist.

## 9 — Concrete acceptance criteria

- All ten designed screens exist as native React Native UI, not embedded reference images.
- Primary visual hierarchy, colors, text treatment and layouts closely match their corresponding references.
- Screens use shared styles and consistent navigation.
- The sky is genuinely astronomical; not random stars or one pasted background.
- A search for Andromeda opens Andromeda's real Object Detail, and Find in Sky navigates to its calculated position.
- Choosing another location changes positions and Tonight contents.
- Time Travel changes object positions, labels and visible events consistently; Now restores live time.
- AR uses actual camera/sensor data and explains alignment limitations.
- Favorites, permissions, preferences and navigation survive normal app lifecycle.
- Correct images, credits and licenses. No use of competitors' app assets.
- No fake weather, event, astronomical metrics or subscription status.
- Real device/simulator screenshot-based comparisons are saved. Build/test limitations are reported honestly.
- The SwiftUI project is preserved, and migration decisions are documented.

## 10 — Communication with the owner

Owner is not a programmer. Do not demand code choices from them if a responsible technical choice can be made after inspection. In Slovak, at each gate briefly explain: what works, what looks different from the reference, screenshot proof, what remains, and the next gate. No self-congratulatory language. No generic design advice. Show results, not lengthy descriptions.

**BEGIN NOW:** inspect the repo and all ten supplied reference images; preserve existing work; select the most economical native-reuse approach; implement and verify the visual standard screen by screen. The references are strict art direction, while astronomical correctness and functional UI remain mandatory.
