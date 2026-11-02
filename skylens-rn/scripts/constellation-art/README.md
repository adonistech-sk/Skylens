# SkyLens constellation artwork

Original figures for the sky, written as vector parts and printed by our own engraving renderer.
The figures in this folder were authored by Claude, as coordinates, against the catalog's stars. No
image generator, stock art or third-party image enters this pipeline, and no figure traces one.

- `figures/<Id>.mjs` — one figure, as vector parts. This is the source of the artwork.
- `engrave.mjs` — the press. Turns vector parts into a lit, line-engraved plate.
- `kit.mjs` — drawing aids (feathers, wings, paws, hooves, fur, an upright frame).
- `sky.mjs` — reads the app's own catalog. Stars are never typed in by hand.
- `build.mjs` — prints figures. `--sheet` draws a star plan, `--final` writes app assets.
- `plan.mjs` — prints a star plan as text, the fastest thing to draw against.

```
node scripts/constellation-art/plan.mjs Lyr                 # star coordinates
node scripts/constellation-art/build.mjs <outDir> Lyr       # review print: Lyr.jpg, Lyr-stars.jpg
node scripts/constellation-art/contact.mjs <outDir> <out.jpg> 3 - Lyr Del Aql
node scripts/constellation-art/build.mjs <outDir> --final   # writes assets and generated data
```

## The plane

Each figure is drawn in a stereographic plane touching the sky at the mean of its stars, in
degrees. **+x is right and +y is up, as the sky looks from the ground with north up, so west is to
the right.** Coordinates come from `plan.mjs`, and `s('Vega')` or `s(91262)` returns a star's plane
point, with optional offsets `s('Vega', 0.5, -1)`. Always use `s()` for a part that sits on a star.

A figure need not be upright in this plan. If its stars force it to lie sideways or upside-down
then that is correct: the sky carries it around. Use `frame(hips, head)` from `kit.mjs` to draw a
difficult pose upright and lay it onto the stars. `figures/Cas.mjs` and `figures/And.mjs` show how.

## Parts

Parts print **back to front**, so draw far limbs first. All sizes are degrees.

- `E.blob(points, opts)` — a closed form through chosen points, for bodies, heads, cloth. Mark a
  sharp point with `'c'` as its last element, like `[x, y, 'c']`.
- `E.limb(points, opts)` — a tube along `[x, y, radius]` points, for limbs, tails, necks, horns, rods.
- `E.line(points, { w, v, warm, dark, taper })` — one burin stroke.
- `E.strands(base, opts)` — fine strokes grown from a line. Prefer `fur()` from the kit for coats.

Options: `tone` (brightness, about 0.7 to 1.25, nearer parts brighter), `hatch` (line angle, follow
the form), `round` (blob edge softness, smaller is flatter), `warm` (0 to 1, copper), `shadow` (cast
on what lies under, 0 for the first part), `creases: [{ pts, w, depth }]` (drawn folds and muscle
edges, the main source of quality), `bumps: [{ at, r: [rx, ry], angle, h }]` (swellings), `melt`
(how far a limb's ends blend into what they join, default 0.75, `0` for crisp separate objects),
`edge` (0 to drop the inked outline, for hair masses), `relief`, `band`, `spacing`.

## What good looks like

Read `figures/Cyg.mjs`, `figures/Sgr.mjs`, `figures/UMa.mjs` and `figures/Tau.mjs` first.

1. **A true subject, instantly.** It must read as that thing at thumbnail size. Silhouette first.
2. **The stars earn their place.** Set anatomy on the stars the way star atlases do. Every bright
   star of the figure's lines should land on the drawing, and named stars at meaningful parts.
3. **Line, not balloon.** Build form with `creases`, feathers, fur and folds. A big plain `blob` with
   nothing on it is a failure, and so are sausage limbs. Vary radii along limbs. Use `corner` points
   for ears, beaks, claws, hooves, tails.
4. **Restraint.** One small warm note per figure, on an object rather than a body: a buckle, a
   strap, a horn, a beak, a metal fitting. Warm above 0.5 only on small parts.
5. **Original.** Never copy or trace a historical atlas plate, a competitor's art or any image.
   Design each pose yourself from the stars.
6. **Scientific honesty.** The figure decorates real stars. Do not move a star, and do not add
   decorative stars.

A constellation with no record is simply shown with its lines and stars. That is always better
than a weak figure, so **an undrawn constellation is a valid result and a poor one is not.**

## Figure file

```js
import { fur, paw } from '../kit.mjs';   // only what you need

export default {
  tier: 'extended',
  subject: 'The Eagle',
  pixels: 1100,                           // extended figures. Priority figures use 1300 to 1500
  anchors: [['Altair', 'neck'], ['Tarazed', 'shoulder'], [97278, 'wing']],  // at least 4 stars of its lines where possible, each named for the part it marks
  draw({ s, E, plane }) {
    const { blob, limb, line } = E;
    // ...
  },
};
```

An anchor must be a star of the figure's own lines. Small figures with fewer than four line stars
may anchor all they have.
