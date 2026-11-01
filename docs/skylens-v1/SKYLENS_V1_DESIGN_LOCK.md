# SkyLens V1 — Design Lock & Visual Implementation Contract

**Status:** Design direction approved; V1 expansion screens are new concepts, not production screenshots.  
**Canonical existing visual:** `1ada5b36-20b2-4823-a74e-60e763418f52.png` (10-screen SkyLens reference).  
**Current implementation comparison:** Nine `Screenshot 2026-11-01 15*.png` files.  
**PRD:** `SKYLENS_V1_PRD.md`.

## 1. Invariants — never reinterpret
- Preserve near-black navy space environment, a restrained peach/copper action color, subtle indigo astronomical atmosphere, warm-white editorial serif titles, a clean neutral sans-serif for controls, fine dividers, small circular map controls, and the existing icon family.
- The **sky is the hero**. Floating controls must not conceal the observational field. Avoid standard card-based dashboards inside the sky viewport, over-bright neon, excessive blur/glass, decorative dummy stars, or copied competitor illustrations.
- Use the current app's existing **Tonight, Explore, Events** patterns unless evidence-based review shows a real issue; extend their visual grammar to new screens.
- Use real astronomy data and object-specific, properly licensed imagery in the product. Visual concepts may use illustrative placements and must never be treated as real sky coordinates or event predictions.
- Typography hierarchy: editorial serif only on signature headings, names and section titles; precise sans-serif for astronomical measurements, controls, tabs and lists. No randomly mixed fonts.
- The product must remain accessible and responsive across iPhone viewport sizes. Use normalized reference coordinates as guidance, not hard-coded screenshot dimensions.

## 2. New V1 design reference inventory
Create **one full-resolution screenshot/reference per distinct state**, at the same iPhone viewport as the approved mockups. Do not deliver a tiny 20-phone collage as the sole design specification.

| Order | Screen/state | Main user action | Critical visible elements |
|---|---|---|---|
| 1 | Observe Sky | identify what is actually visible | native celestial renderer; sparse labels; horizon; bottom compass arc; target/search/layer controls |
| 2 | Explore Sky | discover space-rich layers | expanded starfield, carefully aligned constellations and artwork, real-object selection |
| 3 | Deep Atlas | browse catalog objects | richer labels; magnitude filter; coordinate grids; scale / FOV; decluttering |
| 4 | Sky Layers sheet | personalize sky | layer groups, switches, density sliders, realistic preview; night/observe presets |
| 5 | Selected Object panel | inspect a star without leaving sky | precise on-sky selection, small contextual bottom sheet, locate/learn/save |
| 6 | Solar System 3D | explore planets/moons | true orbital positions, 3D planet with clear artistic scale conventions, time control |
| 7 | Moon Atlas | inspect lunar features | high-resolution Moon disc, landmark pins, terrain details, illumination/phase |
| 8 | Satellite / ISS | find next pass | genuine orbital track, pass timing, data freshness, directional find |
| 9 | Observing Planner | assemble tonight's session | recommended objects, altitude charts, chronological list, add/remove |
| 10 | Light Pollution | find a viable dark-sky site | geographic map, source and date of model, conditions, save locations |
| 11 | Guided Tour | discover a sequence of objects | current step, object compass, narration controls, progress, skip/end |
| 12 | Astro Photography | plan a specific shot | FOV overlay, target elevation, moon interference, gear presets |
| 13 | Extended Object Detail | learn about any object | authentic imagery, correct object attributes, observing plot, related objects |
| 14 | Contextual Sky Drawer | move between sky and discovery | search, location/time, Tonight highlights, selected object, expandable sheet |

## 3. Required visual states
For every interactive panel specify/capture: collapsed, half-expanded, fully expanded; selected/unselected; data-loading, empty, offline, no-permission, and data-stale when relevant. The camera/AR state is hardware-dependent and may need a physical iPhone capture rather than a generated concept.

## 4. Motion contract
- Map drag/pinch: rendered at real-time performance, object positions derived from the astronomy engine.
- Object focus: eased camera-centering, selection halo and label prioritization; cancelable by user gesture.
- Bottom drawer: fluid snap points, gesture interruption, accessible close and tap-outside behavior.
- Modes/layers: subtle crossfade and label-density transition; no abrupt flashes or decorative animation loops.
- Solar System: inertial object rotation with direct touch; time animation changes genuine ephemeris state.
- Moon Atlas: continuous zoom-to-feature and correctly pinned lunar coordinates.
- Events/tours: progress feedback and smooth object-to-object focus.
- Respect Reduce Motion; never let visuals freeze a sensor or compromise scientific accuracy.

## 5. Implementation acceptance gate
For **each screen**, Claude must: (a) point to the actual image reference; (b) implement functional RN UI rather than embedding the reference; (c) capture a same-size simulator/device screenshot; (d) visually review a side-by-side and alpha overlay; (e) report and fix top deviations; (f) verify interactions and real data; (g) document unresolved problems explicitly.

A visual concept is **not** a scientifically accurate sky simulation, an implementation, or evidence a feature is finished.

## 6. Scope order
1. Advanced map modes + decluttering + layers + selected-object sheet.
2. Rich object detail + 3D Solar System + Moon Atlas.
3. Satellite tracking + observing planner + light pollution.
4. Guided tours + astrophotography + polish.
5. Device QA, licensing, source attribution, accessibility, StoreKit flows.

Keep existing SwiftUI project untouched. Preserve existing React Native logic and design where working. Build V1 **incrementally** with screenshot-based gates.
