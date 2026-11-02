// Attribution shown in the app. Wording for CC BY items is as the licensors require.
export interface Credit { used: string; credit: string; license: string; edits?: string }

export const CREDITS: Credit[] = [
  { used: 'Milky Way in the star map', credit: 'NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2: ESA/Gaia/DPAC.', license: 'NASA Deep Star Maps 2020', edits: 'Point stars filtered out, brightness kept, colour is an artistic grade' },
  { used: 'Earth scenes', credit: 'Synthesized for SkyLens from NASA data. Night lights: NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Román, NASA GSFC. Blue Marble: NASA Earth Observatory.', license: 'Public domain data', edits: 'Rendered scene, not a photograph' },
  { used: 'Andromeda Galaxy', credit: 'T.A. Rector and B.A. Wolpa/NOIRLab/NSF/AURA', license: 'CC BY 4.0', edits: 'Rotated, cropped, sky darkened, overexposed core toned down, colour strengthened' },
  { used: 'Orion Nebula', credit: 'NASA, ESA, M. Robberto (Space Telescope Science Institute/ESA) and the Hubble Space Telescope Orion Treasury Project Team', license: 'CC BY 4.0', edits: 'Cropped, colour strengthened, edges darkened' },
  { used: 'Pleiades', credit: 'NOIRLab/NSF/AURA/T.A. Rector (University of Alaska Anchorage), R. Cool (University of Arizona) and WIYN', license: 'CC BY 4.0', edits: 'Resized and cropped' },
  { used: 'Lagoon Nebula', credit: 'ESO', license: 'CC BY 4.0', edits: 'Resized and cropped' },
  { used: 'Whirlpool Galaxy', credit: 'NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team (STScI/AURA)', license: 'CC BY 4.0', edits: 'Resized and cropped' },
  { used: 'Saturn', credit: 'NASA/JPL/Space Science Institute', license: 'Public domain', edits: 'Rotated, cropped and warmed' },
  { used: 'Jupiter', credit: 'NASA, ESA, A. Simon (Goddard Space Flight Center), and M.H. Wong (University of California, Berkeley)', license: 'CC BY 4.0', edits: 'Resized' },
  { used: 'Mars', credit: 'NASA, ESA, the Hubble Heritage Team (STScI/AURA), J. Bell (ASU), and M. Wolff (Space Science Institute)', license: 'CC BY 4.0', edits: 'Resized' },
  { used: 'The Moon', credit: 'NASA/Goddard Space Flight Center Scientific Visualization Studio', license: 'Public domain', edits: 'Computer render lit by the app for the real phase' },
  { used: 'Venus', credit: 'NASA/JPL-Caltech (false colour)', license: 'Public domain' },
  { used: 'Mercury', credit: 'NASA/JPL, Mariner 10', license: 'Public domain' },
  { used: 'Uranus', credit: 'NASA/JPL-Caltech, Voyager 2', license: 'Public domain' },
  { used: 'Neptune', credit: 'NASA/JPL, Voyager 2 (enhanced colour)', license: 'Public domain' },
  { used: 'Moon Atlas map, tiles and elevation', credit: "NASA's Scientific Visualization Studio, CGI Moon Kit. LRO LROC WAC colour map and LOLA elevation", license: 'NASA, no copyright claimed, credit given. Built from PDS-archived LRO data', edits: 'Resized, cut into tiles, elevation resampled to half a degree' },
  { used: 'Moon Atlas names', credit: 'Gazetteer of Planetary Nomenclature, IAU WGPSN, USGS Astrogeology Science Center', license: 'Public domain', edits: 'Longitudes converted to −180 to 180 east' },
  { used: 'Solar System 3D: Jupiter, Saturn, Uranus and Neptune maps', credit: 'Outer Planet Atmospheres Legacy (OPAL), NASA/ESA Hubble Space Telescope, PI A. Simon, archived by STScI. doi:10.17909/T9G593', license: 'CC BY 4.0', edits: 'Resized. Gaps in coverage filled from the nearest observed latitude. Uranus and Neptune use brightness by latitude only, in an approximate overall colour' },
  { used: 'Solar System 3D: Mercury, Venus and Mars maps', credit: 'USGS Astrogeology Science Center, NASA MESSENGER, Magellan and Viking', license: 'Public domain', edits: 'Resized. Venus is a radar map in synthetic colour' },
  { used: 'Solar System 3D: Earth maps', credit: 'NASA Earth Observatory, Reto Stöckli, Blue Marble Next Generation. Black Marble 2012, Suomi NPP VIIRS', license: 'NASA imagery, credit given', edits: 'Resized' },
  { used: 'Solar System 3D: Io, Ganymede and Callisto maps', credit: 'USGS Astrogeology Science Center, NASA Galileo and Voyager', license: 'Public domain', edits: 'Resized' },
  { used: 'Solar System 3D: Europa map', credit: 'Becker et al. 2010, USGS Astrogeology Science Center, NASA Galileo and Voyager', license: 'No use constraints stated, authors cited', edits: 'Resized' },
  { used: 'Mountains on the Location screen', credit: 'Illustration made for SkyLens with AI image generation. Not a real place.', license: 'Project artwork' },
  { used: 'Constellation artwork', credit: 'Original figures made for SkyLens: each one was written as vector shapes by the AI assistant Claude against the real star positions, then printed by the project’s own engraving renderer. No image generator, stock art or third-party artwork was used. Decoration pinned to the real stars, never a source of any position.', license: 'Project artwork' },
  { used: 'Landscape in the sky view', credit: 'Original procedural artwork. It frames the screen and is not your real horizon, which is drawn from true altitude.', license: 'Project artwork' },
];

export const DATA_SOURCES = [
  'Astronomy Engine 2.1.19 by Don Cross (MIT). Positions validated against NASA JPL Horizons and the US Naval Observatory.',
  'Hipparcos Main Catalogue (ESA), via NASA HEASARC.',
  'Yale Bright Star Catalogue, 5th revised edition, via NASA HEASARC.',
  'IAU Catalog of Star Names (WGSN).',
  'NGC 2000.0 (Sinnott, ed.) and the Messier table, via NASA HEASARC.',
  'Constellation figures and boundaries from d3-celestial by Olaf Frohn (BSD-3-Clause).',
  'Meteor shower parameters from the IMO Meteor Shower Working List.',
  'Newsreader and Inter typefaces (SIL Open Font License).',
];
