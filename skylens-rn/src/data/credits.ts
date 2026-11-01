// Attribution shown in the app. Wording for CC BY items is as the licensors require.
export interface Credit { used: string; credit: string; license: string; edits?: string }

export const CREDITS: Credit[] = [
  { used: 'Star map background', credit: 'NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2: ESA/Gaia/DPAC.', license: 'NASA Deep Star Maps 2020', edits: 'Toned and colour graded' },
  { used: 'Earth scenes', credit: 'Synthesized for SkyLens from NASA data. Night lights: NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Román, NASA GSFC. Blue Marble: NASA Earth Observatory.', license: 'Public domain data', edits: 'Rendered scene, not a photograph' },
  { used: 'Andromeda Galaxy', credit: '“Andromeda Galaxy - January 29 2024” by Kevin M. Gill, licensed under CC BY 2.0', license: 'CC BY 2.0', edits: 'Cropped and colour graded' },
  { used: 'Orion Nebula', credit: 'NASA, ESA, M. Robberto (Space Telescope Science Institute/ESA) and the Hubble Space Telescope Orion Treasury Project Team', license: 'CC BY 4.0', edits: 'Cropped, colour adjusted' },
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
  { used: 'Mountains on the Location screen', credit: 'NPS Photo/A. Falgoust', license: 'Public domain', edits: 'Cropped and colour graded' },
  { used: 'Orion artwork', credit: 'Original illustration made for SkyLens with AI image generation. It is decoration pinned to the real stars and is not a source of any position.', license: 'Project artwork' },
];

export const DATA_SOURCES = [
  'Astronomy Engine 2.1.19 by Don Cross (MIT). Positions validated against NASA JPL Horizons and the US Naval Observatory.',
  'Hipparcos Main Catalogue (ESA), via NASA HEASARC.',
  'Yale Bright Star Catalogue, 5th revised edition, via NASA HEASARC.',
  'IAU Catalog of Star Names (WGSN).',
  'NGC 2000.0 (Sinnott, ed.) and the Messier table, via NASA HEASARC.',
  'Constellation figures from d3-celestial by Olaf Frohn (BSD-3-Clause).',
  'Meteor shower parameters from the IMO Meteor Shower Working List.',
  'Newsreader and Inter typefaces (SIL Open Font License).',
];
