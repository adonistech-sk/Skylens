# Design Lock

The approved reference is `skylens_rn_implementation_pack/reference_full/skylens_final_visual_target.png`, with one crop per screen in `reference_screens/`. It is an implementation target, not a starting point for new design.

## System

| Area | Decision | Where |
|---|---|---|
| Colour | Midnight navy base, peach and copper accents, sampled from the reference | `src/design/tokens.ts` |
| Serif | Newsreader 400 for anything that names a thing | `font.serif` |
| Sans | Inter for anything that reports or operates | `font.regular`, `medium`, `semibold` |
| Type roles | `display`, `title`, `objectTitle`, `heading`, `body`, `caption`, `button`, `data` | `type` in `tokens.ts` |
| Motion | One easing, no overshoot, no loops. `Reveal`, `Settle`, `Tap`, `Pop` | `src/design/motion.tsx` |
| Controls | `PrimaryButton`, `SecondaryButton`, `IconButton`, sliding `SegmentedControl`, `Row`, `TabBar` | `src/design/components.tsx` |

## Where the reference is deliberately not copied

The brief says to correct impossible layouts and inaccurate data. These differences are decisions, not gaps.

| Reference | App | Why |
|---|---|---|
| Treeline 16° below Orion | Separate framing landscape, screen-anchored, off in Layers | Orion's belt is about 40° above Bratislava's true horizon at this scale. The true horizon is still drawn from real altitude and takes over when it enters the frame. |
| Milky Way sweeping past Orion's lower left | Milky Way at its true position | Its position comes from NASA's map. Only its colour is a grade. |
| Fixed date, Moon and event values | Calculated values | The reference values are illustrative. Demo mode fixes a clock and place; the values are still computed. |
| M31 3.2° × 1.0°, 2.54 Mly | 3.0° × 1.1°, 2.5 Mly | Catalog values. |
| "AR sky & 3D solar system", "Custom alerts & observing planner" | The four things Pro really unlocks | A paywall must not list features that do not exist. |
| Orion Nebula as magnitude −4 | Tonight list ranked by the real planner | The rows are computed. |
| Andromeda's stylized spiral | NOIRLab mosaic, rotated | A real, correctly identified image. Never mirrored. |
| Short phone (0.56 wide-to-tall) | iPhone (0.46) | The app is 20% taller, so top and bottom groups hold their true size and the extra height falls between them. |

## Honesty rules in the sky

- All stars, the Moon and planets come from the catalog and ephemeris. There are no random stars.
- The Orion figure is decoration pinned to Betelgeuse, Bellatrix and Rigel. Its line figure hides the club and shield only while the art is on.
- The night preview never touches the clock and is labelled on screen.
- The cinematic layers are the Milky Way's colour, the framing landscape and the Orion art. All three are separate from the astronomy and can be turned off.
