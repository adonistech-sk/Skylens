# Licenses and Data Sources

This is an engineering record, not legal advice. **Items marked Review need a decision from a qualified person before a commercial release.**

## Code

| Component | License | Use | Obligation |
|---|---|---|---|
| Astronomy Engine 2.1.19, Don Cross | MIT | Bundled | Notice shipped in `ThirdPartyNotices.txt` |

SkyLens has no third-party Swift packages. The SGP4 code was written for this project, after Vallado et al. 2006. satellite.js (MIT) only generated test fixtures and does not ship.

## Bundled data

| Dataset | Source | Terms | State |
|---|---|---|---|
| Hipparcos Main Catalogue | ESA, via NASA HEASARC | ESA publishes it for free use with credit | **Review:** confirm commercial terms |
| Yale Bright Star Catalogue, 5th ed. | Hoffleit & Warren, via NASA HEASARC | No restrictive license located | **Review:** confirm |
| NGC 2000.0 | Sinnott (ed.), 1988, Sky Publishing, via NASA HEASARC | **Published commercially.** Copyright may cover the compilation | **Review:** highest priority |
| Messier table | NASA HEASARC | US Government work, likely public domain | **Review:** confirm |
| IAU Catalog of Star Names | IAU WGSN | Credit required, per the file's header | Credit in app |
| Constellation figures and boundaries | d3-celestial, Olaf Frohn | BSD-3-Clause | Notice shipped |
| Constellation artwork | Original to this project, authored by Claude as vector figures | Project artwork | No image generator, stock or third-party art. See `docs/skylens-v1/V1_DECISION_LOG.md` |
| Magellanic Cloud values | Published measurements | Facts | No action |
| Meteor shower parameters | IMO Working List, entered by hand | Facts | Values not re-checked against the current list: **verify** |
| Editorial text (`editorial.json`) | Written for SkyLens | Project-owned | No action. Facts need a human fact-check |

`Catalog.Provenance` carries sources and counts into the app, and `provenance.json` records a SHA-256 for each input file.

**If NGC 2000.0 can't be cleared:** OpenNGC is a maintained alternative under CC BY-SA 4.0. Its share-alike terms need their own review. Removing the NGC/IC set doesn't affect Messier, stars or the free tier.

**Why HYG isn't used:** the HYG star database is CC BY-SA, and share-alike is awkward for a commercial binary. Going to Hipparcos directly avoids that.

**Constellation figures:** the lines trace back through d3-celestial to a source its documentation does not state. Stellarium's sky cultures weren't used, to keep GPL material out of an App Store binary. **Review** the lineage.

## Live services

| Service | Data | Terms | Requirements met |
|---|---|---|---|
| MET Norway Locationforecast | Weather | CC BY 4.0, commercial use allowed | Attribution shown. Identifying User-Agent sent, with **a placeholder contact to replace**. Coordinates cut to 2 decimals |
| CelesTrak | Orbital elements | Free to use, with fetch limits | Refreshes at most every 2 hours. **Review:** confirm commercial use |
| NASA GIBS, Black Marble | Night-lights tiles | NASA imagery, credit requested | Credit shown |
| MapKit | Base map, geocoding | Apple's terms | Standard use |

## Light pollution

The Falchi World Atlas was excluded because its license is non-commercial. The map shows NASA night lights and states that this is a proxy. No Bortle class is given, because the data doesn't support one.

## Artwork

No third-party artwork is used. The app icon is drawn by `Tools/catalog-builder/make-icon.mjs` from catalog positions. No Sky Guide or Night Sky assets were copied, and neither app's published screens were consulted during this build.
