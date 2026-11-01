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
| 18 | AR could inherit Atlas grids through shared layers | AR keeps today's overlay in every mode | Preserves AR, which has no hardware evidence yet |
| 19 | Concept art shows sample figures such as "2024 YR4 140 m" | Nothing copied from it | The pack marks them as invented |
| 20 | Pack read in one go or by tile | By tile, through a storage interface with a bounded cache | Meets "loads incrementally" and leaves the door open for downloadable packs |

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
| Hipparcos commercial terms | Legal judgment | Pack and base stars stay in place, release gate open |
| NGC 2000.0 | Legal judgment, highest priority | No deep-sky expansion. Fallback is OpenNGC, with share-alike review |
| Meteor shower values from the IMO list | Facts or protected compilation | Stays as shipped, noted in the matrix |
| AI artwork commercial terms | Your provider plan | Orion art and Location art stay marked open |
| Gaia DR3 and OpenNGC rights | Decides the catalog size V1 can claim | Capacity targets stay unmet |
