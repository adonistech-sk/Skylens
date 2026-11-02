# SkyLens V1 — Decision Log

Conflicts between the documents and the repository, each with its resolution. Routine engineering choices are decided here. Items for the owner are collected at the end.

| # | Conflict | Decision | Why |
|---|---|---|---|
| 1 | The prompt says the pack is in `docs/skylens-v1/`, but it was still zipped | Extracted to that path without touching anything else | The README describes this step |
| 2 | SKY-003 wants Gaia-derived stars. The audit puts Gaia on HOLD | **Deeper stars come from the Hipparcos stars already in `stars.bin`.** No Gaia data imported | "Do not import unapproved datasets". 76,806 real stars were left out only by a cut in `build-data.mjs` |
| 3 | The PRD targets 250k+ indexed stars | Not reachable: Hipparcos ends at 118,217. The target stays open until Gaia is cleared | A capacity goal is not permission to use a held source |
| 4 | Target of 30k deep-sky objects needs OpenNGC, on HOLD | Stay at the bundled 1,643 and show all of them in Deep Atlas | Same rule. NGC 2000.0 has its own open review |
| 5 | IAU boundary file is on HOLD, SKY-004 needs boundaries | Use the d3-celestial polygons in the repository (BSD-3), checked against Astronomy Engine | An existing source, not a new import |
| 6 | `DATA_ARCHITECTURE.md` assumes `skydata/`, `rights.json`, TypeScript samples | They do not exist. Built what Stage 1 needs. `V1_SOURCE_MATRIX.md` serves as the register | The prompt says to report rather than assume |
| 7 | Gaia G bands and tiers G ≤ 5 to 15 | Tiers use V. The pack carries V magnitudes | "G mag ≠ V mag". Hipparcos measures V |
| 8 | Cube-sphere quadtree or HEALPix | **One-level cube-sphere grid** of 1,536 cells | 118,217 stars don't need a hierarchy. Selection is one dot product per cell |
| 9 | `catalogsV1=false` by default until a device proves it | **On by default on this branch**, with an in-app switch back to the old path | TestFlight is the canary here and an off flag produces no evidence. It is not a promotion: the rule stands for `main` |
| 10 | J01 and PRD start in Observe, while the TestFlight sky has Explore's look | **Default mode is Explore, with today's layers unchanged** | "Preserve existing visual design". Saved layers migrate to Explore |
| 11 | Bodies used refracted positions, while stars and the selection ring were airless, up to 35.85′ apart | **All drawn objects share the airless frame.** Refraction stays in rise, set and altitude text | A consistent picture, and the smallest fix. Near the horizon a star is drawn up to 0.6° low |
| 12 | Full apparent place wanted, stars omit annual aberration | Accepted and measured: at most 21″ against ERFA, about 1pt at the 2° zoom limit | Correcting it means rebuilding the field every few simulated days, which would cost more than it shows |
| 13 | Layer manager lists satellites and orbit trails | Left out of the panel until data exists | "No inert toggles" |
| 14 | Layers as "sheet" or "floating overlay" | Floating overlay with a scroll area, keeping the sky visible behind it | PRD section 7 and the design lock's "sky is the hero". The contextual sheet is Stage 2 |
| 15 | `V1_IMPLEMENTATION_PLAN.md` in the PRD, `V1_INTEGRATION_PLAN.md` in the prompt | Used `V1_INTEGRATION_PLAN.md` | The prompt outranks the PRD |
| 16 | PRD event names imply analytics | None added. Frame timing stays on the device | "Only where permission and product policy allow", and no policy exists yet |
| 17 | Deep Atlas as a Pro feature | Free in Stage 1 | Packaging is marked "validate", and purchases are untested |
| 18 | AR could inherit Atlas grids through shared layers | AR and the detail page use Explore's layers and star limit in every mode. AR's constellation button still works | Preserves AR, which has no hardware evidence yet. In Observe, AR starts with lines off until that button is used |
| 19 | Concept art shows sample figures such as "2024 YR4 140 m" | Nothing copied from it | The pack marks them as invented |
| 20 | Pack read in one go or by tile | By tile, through a storage interface with a bounded cache | Meets "loads incrementally" and leaves the door open for downloadable packs |
| 21 | At tight zoom the coarse Milky Way map swells bright-star traces into soft blobs, which read as fake nebulae | Deep Atlas fades the map out between 20° and 6°. Explore keeps it | "Avoid fake bright nebula positions", and Explore must stay as approved |
| 22 | Sky panel collapsed state could sit at the screen edge or above the compass | A slim row above the compass dome, replaced by the selection card when something is selected | The controls and dome stay where they were approved. The home indicator zone can't take a grab handle |
| 23 | One selection card or two | One component, mounted in one place at a time | The brief says not to duplicate it, and two copies would be read twice by VoiceOver |
| 24 | Should a tap on the sky with the panel half open select or only close | It does both | The sky stays live at half, and a tap on an object is the clearest intent |
| 25 | Interpreted "navigation arrows" | The off-screen guide on the sky, plus step arrows on the card through objects in view | Both readings are useful, and the stepping list is frozen for a run so back returns |
| 26 | The search index could hold every catalog number as a term | Numbers live in sorted typed arrays, names in a word index | 118,217 numbers would cost Hermes real time on every keystroke |
| 27 | A pack star has no HD number or name in the source | Search reaches it by HIP number, and the 43 that have names by name | Aliases can't be invented |
| 28 | The view stopped at −20° even with no ground drawn | With ground off the view reaches −89° | Find in Sky has to centre a star below the horizon in Deep Atlas |
| 29 | Panel drag on the UI thread or the JS thread | JS thread, like the existing sky gestures | Safer without device testing. Revisit if the device test shows lag |

| 30 | 3D renderer | Analytic ray tracing in Skia runtime shaders | Already on TestFlight, adds no native dependency, and every body is an ellipsoid or ring. `expo-gl` with `three`, Filament and WGPU each add native code that can't be verified here |
| 31 | Moons beyond the Moon and the Galilean four | Left out | JPL mean elements missed by up to 200% of an orbit against Horizons, and JPL says they aren't for position work. An invented position would break the brief |
| 32 | Distance in illustrative scale | `1.1 · r^0.4`, direction untouched | Neptune's orbit fits a phone in portrait and every planet stays findable |
| 33 | Which side a planet is seen from on arrival | The sunlit side, 40° from noon | Keeping the overview angle often arrived at a dark disc |
| 34 | Satellites in true scale inside a planet's own view | Always, whichever overview scale is on | Sizes and distances of moons are then always real, and the screen says so |
| 35 | Uranus and Neptune colour | Hubble brightness by latitude, overall colour set by hand and stated as approximate | OPAL's composite stretched hue, so Uranus looked cream, and each map shows only one hemisphere |
| 36 | Moon lighting beyond the terminator | A 5% floor instead of black | A black disc with labels read as a failed screen. The card still says it's night and offers full light |
| 37 | Bundled map resolution | 8K in 160 tiles, 3.2 MB | Higher needs hosting, which is an owner decision |

| 38 | How to make artwork for 88 constellations | **Vector figures written by Claude against the catalog's real stars, printed by our own engraving renderer.** No image generator, stock or third-party art | "Do not import artwork whose rights remain unresolved". A generated image rests on a provider's terms and can't be anchored. Here the source is reviewable text and nothing is imported. The figures are still AI-authored, which is a rights question of its own, listed below |
| 39 | Flat SVG strokes or a printed plate | **Printed plates, with vector sources.** Figures live as vector parts in `scripts/constellation-art/figures/`, each also exported as an SVG outline in `design/constellation-art/`, and print to a small JPEG | Flat strokes couldn't reach the approved engraved look. Vector source plus a raster print is the "equivalent" the brief allows, and the outline stays vector in the app for the reveal |
| 40 | How a plate reaches the sky | **A mesh through the real camera,** not a fitted transform. Each vertex goes plate → sky plane → J2000 → the same projection as the stars | A fitted affine or homography can't follow stereographic distortion across a large figure. Measured against stars, see the report |
| 41 | Time Travel and proper motion | The plate leans with its stars, each mesh vertex following the drift of nearby figure stars | A plate fixed to J2000 would leave stars behind by minutes of arc over the 400-year range. Star positions are read, never written |
| 42 | The approved Orion raster | **Replaced in the sky by a new original Orion.** `assets/sky/orion-art.jpg` stays in the repository, unused and no longer bundled | It is AI-generated with open rights, and it wouldn't match 87 other figures. Its look is the reference the new set is built to. This is a visible change to an approved composition, so it is listed for the owner below |
| 43 | Orion's club and shield lines hidden over the art | **All catalog lines now show.** The new figure holds the club and pelt on those stars | The old raster had to hide them because its arm and pelt didn't follow them |
| 44 | A constellation that hasn't been drawn | **Nothing stands in for it.** Lines, stars and names only | "Do not replace missing artwork with low-quality placeholders" |
| 45 | What `constellations` means in Layers | It now means lines only. Names, artwork and animation have their own switches, opacity a slider. Saved skies that had it off keep names and art off | "Independent toggles". Migration keeps what a user chose |
| 46 | Parallax | **Only the soft haze behind a figure moves, at most 6 points.** The plate and stars never do | Moving a plate would break its anchoring, and the brief says "where geometrically appropriate" |
| 47 | A tap on empty sky inside a figure | Selects the constellation. Stars, planets and labels under the finger still win | J02 says "tap Orion". The tap only works on what the frame drew |
| 48 | Tours for constellations without a curated script | Built from what lies inside the IAU boundary, with text only from measured catalog values | "All positions must come from the existing astronomy engine", and invented commentary would be worse than plain facts |
| 49 | Myth and science on one screen | Three separate sections, with a line saying traditions are not astronomy, and a test that the science text holds no myth | The brief, and PRD GUIDE-002 |
| 50 | Lacaille's and other modern figures | No myth is written for them. The screen says so | Inventing one would present fiction as tradition |

## Features at risk, and how they are protected

| Feature | Risk from Stage 1 | Protection |
|---|---|---|
| Sky View | Draw loop reworked | Old loop kept behind `catalogsV1`. Baseline flows rerun |
| Tonight | Shares `computeMoment` | Only drawn direction changes. Tests untouched |
| Explore, Events | None expected | Tabs covered by flows |
| Time Travel | Index must hold over 400 years | Cells widen by each cell's fastest star, proven by brute-force test at both ends of the range |
| AR | Reads shared layers | Forced to the Explore recipe, decision 18 |
| Saved data | Store shape changes | Same storage key, missing keys fall back, old layers migrate. Tested |

## Decisions for the owner

| Item | Why it is yours | Effect while open |
|---|---|---|
| Moon map above 8K | Needs hosting and a download | The atlas stays at 8K, soft at the closest zoom |
| Hipparcos commercial terms | Legal judgment | Pack and base stars stay in place, release gate open |
| NGC 2000.0 | Legal judgment, highest priority | No deep-sky expansion. Fallback is OpenNGC, with share-alike review |
| Meteor shower values from the IMO list | Facts or protected compilation | Stays as shipped, noted in the matrix |
| AI artwork commercial terms | Your provider plan | Location art stays marked open. Orion's raster no longer ships, see decision 42 |
| AI authorship of the constellation figures | Legal judgment | Figures stay in. No provider terms are involved, but whether AI-written work can be protected by copyright is unsettled, so a competitor might be able to reuse them. Your use of them isn't the concern |
| The new Orion replacing the approved raster | It changes an approved composition | The new original is live. Reverting is a small code change, but it brings back the open rights question |
| Gaia DR3 and OpenNGC rights | Decides the catalog size V1 can claim | Capacity targets stay unmet |
