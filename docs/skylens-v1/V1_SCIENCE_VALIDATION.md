# SkyLens V1 — Science Validation

Run on 2026-11-01 against frozen references. Every case is in `VALIDATION_REPORT.json`, written by `skylens-rn/tests/validation.test.ts` with `WRITE_VALIDATION=1`. The same tests run in CI. This is a test record, not a certification.

## Results

| Check | Reference | Cases | Median | Worst | Limit | Failed |
|---|---|---|---|---|---|---|
| Apparent RA/Dec, Sun, Moon, planets | JPL Horizons API v1.2 | 225 | 2.96″ | 15.9″ | 60″, Moon 120″ | 0 |
| Airless azimuth and altitude | JPL Horizons | 225 | 4.66″ | 18.43″ | 60″, Moon 120″ | 0 |
| Star position in the render path | ERFA `eraAtco13` | 650 | 18.23″ | 22.04″ | 25″ | 0 |
| Deep-sky position in the render path | ERFA | 225 | 17.49″ | 20.93″ | 25″ | 0 |
| Catalog stars at J2000 | SIMBAD | 394 | 0.018″ | 1.44″ | 2″ | 0 |
| Named Hipparcos flaws | SIMBAD | 3 | 6.5″ | 48.5″ | Per star | 0 |
| Messier positions | SIMBAD | 107 | 33.8″ | 21.8′ (M44) | 8′ or 30% of size | 0 |
| Named coarse Messier clusters | SIMBAD | 3 | 14.1′ | 14.5′ | 15′ | 0 |
| Drawn point against ERFA | 1,191 cases at 90°, 20°, 2° | 1,191 | | 1.20 pt | 1.5 pt | 0 |
| Body against its selection ring | Same frame | 225 | | Under 1″ | 1″ | 0 |

The 225 Horizons cases are 5 sites (Bratislava, Sydney, Quito, Tromsø, McMurdo) × 5 dates (1815, 1999, 2027 twice, 2150) × 9 bodies. Distance, illumination, angular diameter, refraction above 5° and magnitude within 0.15 also pass. The earlier 378 Horizons fixtures still pass.

## What the numbers mean

- **Stars drift about 20″ from the true apparent place.** That is annual aberration, which the map leaves out. It equals about 1 pt at the tightest zoom, and proper motion, precession, nutation and Earth rotation are included.
- **UT1 is treated as UTC.** The real gap is under 0.9 s, up to about 13″ at the equator. ERFA ran under the same assumption, so this gap isn't in the numbers above.
- **Refraction below 5° was not compared.** No Horizons case fell between the horizon and 5° with the Sun or Moon up.
- **The map is airless by design.** A star on the horizon is drawn up to 0.6° below where the eye sees it. Rise, set and altitude text do use refraction.
- **The sky chart's coordinates are J2000.** The readout says so.

## Defect found and fixed

Bodies were drawn with refraction, but stars and the selection ring were not. Near the horizon the ring sat up to 35.85′ from its planet or Moon, more than a full Moon's width. All drawn objects now share one frame.

## Faults found in the source catalogs

These are copied faithfully from the sources. Nothing was edited, so they stay in the app until a cleared replacement exists.

| Object | Finding | Effect |
|---|---|---|
| HIP 67593, V 13.3 | Hipparcos gives 5.8″ per year. SIMBAD gives 15 mas per year | 48.5″ off at J2000, more at other dates. Deep pack only |
| HIP 75901 | One of 262 Hipparcos stars with no astrometric solution | 6.5″ off, proper motion zero. Deep pack only |
| HIP 17750 | Proper motion much revised since Hipparcos | 2.5″ off. Deep pack only |
| M67, M41, M39 | HEASARC Messier table is coarse | 13′ to 15′ from SIMBAD's centre, under half the width of each cluster |
| M44 | Loose cluster with no sharp centre | 21.8′ from SIMBAD, in a cluster 95′ wide |

Each named exception is listed in the test, so a new outlier fails instead of passing quietly. A marker on one of these clusters can look off-centre at tight zoom. Fixing that needs a cleared deep-sky source, which is the OpenNGC decision.

## Other checks

| Check | Result |
|---|---|
| Spatial index against brute force | 304,931 on-screen stars over 192 cameras, **0 missed**. Covers RA 0, both poles, face corners, years −200 to +200 from J2000 |
| Deep pack plus bundled stars against `stars.bin` | Exactly equal: 41,411 + 76,806 = 118,217, values unchanged |
| Boundaries against Astronomy Engine | 1,498 of 1,500 random points agree, none unclaimed |
| Grid poles | Galactic pole within 2′, galactic centre within 2′, ecliptic pole within 1′ of published values |

## Added in Stage 2

| Check | Result |
|---|---|
| A marker on a fast star under Time Travel | Under 0.5″ from the drawn star for Barnard's Star and Sirius, in 1815 and 2150. Before the fix it ignored proper motion |
| All 88 constellation areas | 41,253.0 square degrees against 41,252.96 for the sphere |
| Seven IAU constellation areas, including both polar ones | Within 2% |
| Altitude timeline against the engine | Peak within 21 minutes of transit, and within 1° of its altitude. Sampled every 20 minutes |
| Galactic place of Sirius | Within 0.1° of 227.23°, −8.89° |
| Absolute magnitude | Sirius and Vega within 0.1 of published values |
| Elongation of Venus | Within 0.5° of the engine's own function |
| Discovery | Every suggestion in three modes is above the horizon, visible by `locate()`, and states an altitude within 1.2° |

These compare against published values or the engine rather than a new JPL pull. They check arithmetic built on positions the JPL fixtures already cover.

## Not verified

| Item | Why |
|---|---|
| Accuracy of the sky against the real sky outdoors | Needs a device and a clear night |
| Compass and AR alignment | `DEVICE_NOT_TESTED` |
| Satellites, comets, lunar landmarks | Not built yet |

## Added in Stage 3

Against JPL Horizons, `skylens-rn/tests/fixtures/horizons-solar-v1.json`. Each quantity is compared on five dates from 1900 to 2100. Results are in `V1_STAGE3_REPORT.md`.

| Check | Worst | Limit |
|---|---|---|
| Heliocentric planets | 15.4″ | 20″ |
| Geocentric Moon | 11.6 km | 15 km |
| Galilean moons | under 460 km | 500 km |
| Planet prime meridians | 0.01° | 0.05° |
| Lunar sub-Earth point | 0.006° | 0.01° |
| Lunar sub-solar point | 0.0014° | 0.01° |
| Moon illumination | 0.01 points | 0.05 |
| Lunar pole position angle | 0.003° | 0.02° |

Mean-element satellite models failed, up to 200% of an orbit, and were removed. The longitude direction of the Galilean moon maps isn't independently tested.
