# Asset Credits

Machine-readable sources, URLs and verification notes are in `assets/asset-manifest.json`. The app shows the same credits under More → Credits and data sources (`src/data/credits.ts`).

**Commercial-use rules:** keep CC BY credits visible and worded as listed, disclose edits (ESO requires this), never imply endorsement, and use no NASA logos. Check NASA's stricter guidance before using these in App Store marketing.

## Images in the app

| Screen | File | Source | Credit | License | Edits |
|---|---|---|---|---|---|
| Sky, AR, list backdrop | `assets/sky/milkyway.jpg`, `assets/images/backdrop.jpg` | NASA SVS Deep Star Maps 2020 (svs.gsfc.nasa.gov/4851). `allsky.jpg` stays as a script input only | NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2: ESA/Gaia/DPAC. | NASA media | Tone-mapped, median-filtered, keeping brightness. Its pink and indigo are an artistic grade |
| Onboarding, Time Travel | `earth-onboarding.jpg`, `earth-horizon.jpg` | **Synthesized** by `scripts/render-earth.mjs` from NASA Black Marble and Blue Marble | NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Román, NASA GSFC; NASA Earth Observatory | Public domain data | A rendered scene, **not a photograph** |
| Object Detail | `andromeda-hero.jpg`, `thumb-andromeda.jpg` | noirlab.edu/public/images/noao-m31/ | T.A. Rector and B.A. Wolpa/NOIRLab/NSF/AURA | CC BY 4.0, read from noirlab.edu/public/copyright/ on 2026-11-01 | Rotated 75°, never mirrored, cropped, blue sky pedestal reduced, contrast raised, disc warmed, clipped core tinted warm white |
| Explore, Tonight | `orion-nebula-hero.jpg`, `thumb-orion-nebula.jpg` | ESA/Hubble | NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope Orion Treasury Project Team | CC BY 4.0 | Cropped, colour strengthened, edges darkened. See `scripts/grade-heroes.mjs` |
| Detail | `pleiades-hero.jpg`, `thumb-pleiades.jpg` | NOIRLab | NOIRLab/NSF/AURA/T.A. Rector (University of Alaska Anchorage), R. Cool (University of Arizona) and WIYN | CC BY 4.0 | Resized, cropped |
| Detail | `lagoon-hero.jpg`, `thumb-lagoon.jpg` | ESO | ESO | CC BY 4.0 | Resized, cropped |
| Explore, Detail | `m51-hero.jpg`, `thumb-m51.jpg` | ESA/Hubble | NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team (STScI/AURA) | CC BY 4.0 | Resized, cropped |
| Pro | `saturn-pro.jpg` | Cassini PIA06193 | NASA/JPL/Space Science Institute | Public domain, see below | Rotated, cropped, warmed |
| Thumbnails | `planet-saturn.jpg` | Cassini PIA11141 | NASA/JPL/Space Science Institute | Public domain, see below | Cropped |
| Thumbnails, Detail | `planet-jupiter.jpg`, `jupiter-hero.jpg` | ESA/Hubble | NASA, ESA, A. Simon (GSFC), and M.H. Wong (UC Berkeley) | CC BY 4.0 | Resized |
| Thumbnails, Detail | `planet-mars.jpg`, `mars-hero.jpg` | ESA/Hubble | NASA, ESA, the Hubble Heritage Team (STScI/AURA), J. Bell (ASU), and M. Wolff (SSI) | CC BY 4.0 | Resized |
| Tonight, Events | `moon-disc.jpg`, `planet-moon.jpg` | NASA SVS | NASA/Goddard Space Flight Center Scientific Visualization Studio | Public domain | A computer render, lit by the app for the real phase |
| Thumbnails | `planet-venus.jpg` | PIA23791 | NASA/JPL-Caltech | Public domain | Resized. False colour, don't call it true colour |
| Thumbnails | `planet-mercury.jpg` | Mariner 10 PIA03104 | NASA/JPL | Public domain | Resized. Greyscale half-disc |
| Thumbnails | `planet-uranus.jpg` | Voyager 2 PIA18182 | NASA/JPL-Caltech | Public domain | Resized |
| Thumbnails | `planet-neptune.jpg` | Voyager 2 PIA01492 | NASA/JPL | Public domain | Resized. Enhanced colour |
| Location | `location-mountains.jpg` | Generated with Nano Banana 2.1 through Magnific from a crop of the owner's reference. **Not a real place** | Project artwork | **Confirm the provider's commercial terms** | |
| Sky | `assets/sky/orion-art.jpg` | Generated with Nano Banana 2.1 through Magnific from a crop of the owner's reference | Project artwork | **Confirm the provider's commercial terms** | Levels adjusted, pinned to Betelgeuse, Bellatrix and Rigel |
| Sky | `assets/sky/horizon.png`, `star-sprite.png` | Drawn by `scripts/make-sky-assets.mjs` | Original | Project-owned | Horizon also serves as the framing landscape |
| Screenshot mode only | `ar-standin.jpg` | Generated with Nano Banana 2.1 through Magnific | Project artwork | **Confirm the provider's commercial terms** | Never shown outside test mode, labelled on screen |

## Fonts

Newsreader and Inter, both SIL Open Font License 1.1, from `@expo-google-fonts`. The spec suggested Instrument Serif, but Newsreader Regular was much closer to the reference at side-by-side comparison.

## Rejected

| Item | Why |
|---|---|
| Adam Evans' M31 with h-alpha | The best visual match. Flickr now lists it as CC BY-NC. Commons recorded CC BY 2.0 in 2011, and CC grants aren't revocable, but relying on that needs a decision. Kept out of the app. Getting written permission would give a much stronger Object Detail hero |
| Pleiades (Hubble/Palomar) | Commons' public-domain tag looks wrong: POSS-II data is Caltech copyright |
| Moon near side LRO on Commons | LROC requires permission for commercial use outside its PDS archive |
| MESSENGER Mercury | JHU/APL limits use to non-commercial purposes, despite a public-domain tag |
| Falchi light pollution atlas, HYG, CC BY-SA M31 images | Non-commercial or share-alike |

## Open questions

1. **Cassini.** The imaging team's policy site is offline, so clearance rests on general NASA and JPL policy. This is the same credit pattern where MESSENGER and LROC turned out to be restricted, so it isn't fully closed.
2. **Earth maps.** The commercial-reuse wording came from search results of the policy pages, not a page read directly.
3. **Outside the US.** NASA says its material is generally not copyrighted "in the United States".
4. **Generated artwork (Orion, location, test stand-in).** Confirm that AI-generated imagery is acceptable to you commercially and under the provider's plan.
