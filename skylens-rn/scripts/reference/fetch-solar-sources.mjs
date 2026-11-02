// Downloads the source imagery and data for the Solar System and the Moon Atlas, once, and
// records exactly what was fetched. Sources stay out of the repository: only the derived
// assets ship, and assets/solar/provenance.json ties each to the file and terms it came from.
// usage: node scripts/reference/fetch-solar-sources.mjs <sourceDir>
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
fs.mkdirSync(dir, { recursive: true });

const wms = (planet, layer, width = 2048) =>
  `https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=%2Fmaps%2F${planet}%2F${planet}_simp_cyl.map&service=WMS&version=1.1.1&request=GetMap&layers=${layer}&styles=&srs=EPSG:4326&bbox=-180,-90,180,90&width=${width}&height=${width / 2}&format=image/jpeg`;
const opal = (cycle, planet, name) => `https://archive.stsci.edu/hlsps/opal/${cycle}/${planet}/hlsp_opal_hst_wfc3-uvis_${name}_v1_globalmap.tif`;
const svs = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720';

const FILES = [
  ['mars.jpg', wms('mars', 'MDIM21_color')],
  ['venus.jpg', wms('venus', 'MAGELLAN_color')],
  ['mercury.jpg', wms('mercury', 'MESSENGER_May2013')],
  ['jupiter.tif', opal('cycle27', 'jupiter', 'jupiter-2020a_f395n-f502n-f631n')],
  ['saturn.tif', opal('cycle32', 'saturn', 'saturn-2025a_f395n-f502n-f631n')],
  ['uranus.tif', opal('cycle27', 'uranus', 'uranus-2019a_f467m-f547m-f657n')],
  ['neptune.tif', opal('cycle27', 'neptune', 'neptune-2020a_f467m-f547m-f657n')],
  ['io.jpg', 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=%2Fmaps%2Fjupiter%2Fio_simp_cyl.map&service=WMS&version=1.1.1&request=GetMap&layers=SSI_VGR_color&styles=&srs=EPSG:4326&bbox=-180,-90,180,90&width=1024&height=512&format=image/jpeg'],
  ...['europa', 'ganymede', 'callisto'].map((m) => [`${m}.jpg`, `https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=%2Fmaps%2Fjupiter%2F${m}_simp_cyl.map&service=WMS&version=1.1.1&request=GetMap&layers=GALILEO_VOYAGER&styles=&srs=EPSG:4326&bbox=-180,-90,180,90&width=1024&height=512&format=image/jpeg`]),
  ['earth-day.jpg', 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg'],
  ['earth-night.jpg', 'https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg'],
  ['moon-color-8k.tif', `${svs}/lroc_color_poles_8k.tif`],
  ['moon-dem-4ppd.tif', `${svs}/ldem_4_uint.tif`],
  ['moon-nomenclature.zip', 'https://planetarynames.wr.usgs.gov/shapefiles/MOON_nomenclature_center_pts.zip'],
];

const manifestFile = path.join(dir, 'sources.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
for (const [name, url] of FILES) {
  const file = path.join(dir, name);
  if (manifest[name] && fs.existsSync(file)) continue;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) { console.log('FAILED', name, res.status); continue; }
  const bytes = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get('content-type');
  fs.writeFileSync(file, bytes);
  manifest[name] = { url, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), retrievedUtc: new Date().toISOString(), contentType: type };
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  console.log(name, bytes.length, type);
}
