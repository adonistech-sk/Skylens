# SkyLens V1 — Source Matrix

What the React Native app really uses, audited from the repository on 2026-11-01. Every row is an installed fact, not a recommendation. Rights states are engineering records and not legal advice.

## In the app today

| Data | Provider and version | Refresh | Licence evidence | Storage | Release gate |
|---|---|---|---|---|---|
| Sun, Moon, planets | Astronomy Engine 2.1.19, computed on device | None needed | MIT, `LICENSES.md` | Code | **Pass.** Notice shipped |
| Stars, 41,411 to V 8.0 | Hipparcos Main Catalogue via NASA HEASARC. `stars.bin`, input SHA-256 `b216daf8…` | Static | "Free use with credit", `LICENSES.md` | Bundled | **Review open:** confirm commercial terms |
| Star designations | Yale Bright Star Catalogue 5th ed. via HEASARC, `e2b2f8e9…` | Static | No restrictive licence located | Bundled | **Review open** |
| Star names | IAU WGSN Catalog of Star Names, `84fac0c9…` | Static | Credit required, per file header | Bundled | Credit shown |
| Deep sky, 1,643 | NGC 2000.0 (Sinnott 1988) via HEASARC, `ba099b7e…` | Static | **Published commercially; the compilation may be covered** | Bundled | **Review open, highest priority** |
| Messier table | HEASARC, `1127c324…` | Static | US Government work, likely public domain | Bundled | **Review open** |
| Constellation lines and boundaries | d3-celestial, Olaf Frohn, `294f66be…` | Static | BSD-3-Clause, notice shipped | Bundled | Pass, **lineage of the figures under review** |
| Milky Way map | NASA SVS Deep Star Maps 2020, built with Gaia DR2 | Static | NASA media, credit shown (`src/data/credits.ts`) | Bundled image | Pass as a NASA product. Not a Gaia catalog import |
| Meteor showers | Parameters typed from the IMO Working List | By hand | Facts. The audit marks IMO copying **HOLD** | Code, `events.ts` | **Decision needed**, see decision log |
| Object imagery | Rows in `skylens-rn/ASSET_CREDITS.md` | Per asset | Per asset | Bundled | Open items 1 to 4 there |
| Orion art, Location art | Generated through Magnific | Static | Provider terms not confirmed | Bundled | **Owner decision**, `ASSET_CREDITS.md` item 4 |

There are no network calls in the sky, catalog or Tonight code. No analytics SDK is installed.

## Added by Stage 1

| Data | Provider and version | Licence evidence | Storage | Release gate |
|---|---|---|---|---|
| Deep star pack, 76,806 stars, V 8.0 to 14.1 | The **same** Hipparcos input and `stars.bin` as the bundled stars. No new source | As the Hipparcos row | Bundled, `assets/catalogs/hip-deep-v1.db`, loaded by tile | Inherits the open Hipparcos review |
| Constellation boundaries on screen | The **same** d3-celestial file. Already bundled in the Swift app, newly carried into RN | As the d3-celestial row | Bundled | As that row |
| Coordinate grids | Computed by Astronomy Engine | MIT | Code | Pass |

## Test-only references, never shipped

| Reference | Version and retrieval | Use | File |
|---|---|---|---|
| NASA/JPL Horizons API | API v1.2, 2026-11-01. 55 requests, each with URL and SHA-256 | Apparent, astrometric, alt/az, distance, magnitude, illumination, diameter | `skylens-rn/tests/fixtures/horizons-v1.json` |
| SIMBAD, CDS, through the Harvard mirror | 2026-11-01. The Strasbourg host timed out from this network | J2000 positions of 397 stars and 110 Messier objects | `skylens-rn/tests/fixtures/simbad-v1.json` |
| ERFA (IAU SOFA algorithms) | pyerfa 2.0.1.5, BSD | Independent star and deep-sky positions | `skylens-rn/tests/fixtures/erfa-stars-v1.json` |
| Earlier Horizons and USNO fixtures | Copied from the Swift tests | 378 positions, 149 phases and others | `skylens-rn/tests/fixtures/reference.json` |

## Researched but not installed

These stay out of the app. A recommendation in `DATA_SOURCE_AUDIT.md` is not an integration.

| Source | Audit state | State in this repo |
|---|---|---|
| ESA Gaia DR3 | HOLD | **Not imported.** No Gaia catalog data in the app |
| OpenNGC | CONDITIONAL, import HOLD | **Not imported** |
| IAU boundary file | HOLD | **Not imported.** d3-celestial's own file is used |
| CelesTrak | HOLD for redistribution | Not in the RN app. The SwiftUI app fetches it |
| JPL SBDB | CONDITIONAL | Not installed |
| NASA LRO, LROC, LOLA | CONDITIONAL | Not installed. `ASSET_CREDITS.md` rejected an LRO Moon on licence grounds, so Stage 3 needs a fresh check |
| USGS Gazetteer | POTENTIAL | Not installed |
| NOAA SWPC | POTENTIAL | Not installed |
| ESA main site media | HOLD | None in the app |
| Commercial weather, light pollution | HOLD until contract | None selected |

## Row-level register

`DATA_SOURCE_AUDIT.md` section D lists fields that no record yet fills in full, including `reviewer`, `reviewed_at` and `commercial_allowed_proof`. Those need a person. Filling them in here would invent evidence.
