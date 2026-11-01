# Independent reference for star and deep-sky positions. ERFA is the BSD-licensed build of
# the IAU SOFA routines, so nothing here shares code with Astronomy Engine. It is used only
# to make test fixtures and never ships in the app.
#
# Input is SIMBAD's J2000 coordinates, frozen in simbad-v1.json. Output is the airless
# observed azimuth and altitude from eraAtco13, which applies proper motion, light
# deflection, annual and diurnal aberration, precession, nutation and Earth rotation.
#
# dut1 is taken as 0, polar motion as 0: the app works from UT without either, so these are
# the conditions being compared. Their real size is reported in V1_SCIENCE_VALIDATION.md.
#
# usage: python erfa-stars.py <tests/fixtures directory>
import hashlib, json, math, sys
from pathlib import Path

import erfa

fixtures = Path(sys.argv[1])
raw = (fixtures / 'simbad-v1.json').read_bytes()
simbad = json.loads(raw)
horizons = json.loads((fixtures / 'horizons-v1.json').read_text())
sites, dates = horizons['sites'], horizons['dates']

# Bright anchors plus the fastest movers, which are where an epoch mistake would show.
by_hip = {s['hip']: s for s in simbad['stars']}
anchors = [32349, 30438, 69673, 71683, 91262, 24608, 24436, 37279, 27989, 7588, 60718, 68702, 97649, 21421, 65474, 80763, 37826, 102098, 11767, 49669, 57632, 54061, 87937, 104214, 108870, 70890, 1475]
anchors = [h for h in anchors if h in by_hip and by_hip[h]['pmRA'] is not None]
deep = [d for d in simbad['deepSky'] if d['id'] in ('M1', 'M13', 'M31', 'M42', 'M45', 'M51', 'M57', 'M81', 'M104')]

MAS = math.pi / (180 * 3600 * 1000)


def observed(ra_deg, dec_deg, pm_ra_star, pm_dec, site, date):
    y, mo, d = (int(x) for x in date[:10].split('-'))
    h, mi = (int(x) for x in date[11:].split(':'))
    u1, u2 = erfa.dtf2d('UTC', y, mo, d, h, mi, 0.0)
    rc, dc = math.radians(ra_deg), math.radians(dec_deg)
    pr = (pm_ra_star * MAS) / math.cos(dc)  # eraAtco13 wants dRA/dt, not the cos-delta rate.
    pd = pm_dec * MAS
    aob, zob, hob, dob, rob, eo = erfa.atco13(rc, dc, pr, pd, 0.0, 0.0, u1, u2, 0.0,
                                              math.radians(site['lon']), math.radians(site['lat']), site['km'] * 1000,
                                              0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    return math.degrees(aob) % 360, 90 - math.degrees(zob)


rows = []
for site in sites:
    for date in dates:
        for hip in anchors:
            s = by_hip[hip]
            az, alt = observed(s['ra'], s['dec'], s['pmRA'], s['pmDec'], site, date)
            rows.append({'site': site['site'], 'lat': site['lat'], 'lon': site['lon'], 'km': site['km'], 'utc': date.replace(' ', 'T') + ':00Z', 'id': f'star:{hip}', 'azimuth': az, 'altitude': alt})
        for d in deep:
            az, alt = observed(d['ra'], d['dec'], 0.0, 0.0, site, date)
            rows.append({'site': site['site'], 'lat': site['lat'], 'lon': site['lon'], 'km': site['km'], 'utc': date.replace(' ', 'T') + ':00Z', 'id': 'dso:' + d['id'], 'azimuth': az, 'altitude': alt, 'ra': d['ra'], 'dec': d['dec']})

out = {'source': 'ERFA eraAtco13 (IAU SOFA algorithms), pyerfa ' + erfa.__version__, 'simbadSha256': hashlib.sha256(raw).hexdigest(), 'conditions': 'airless, dut1=0, polar motion=0, zero parallax and radial velocity', 'rows': rows}
(fixtures / 'erfa-stars-v1.json').write_text(json.dumps(out, separators=(',', ':')))
print(len(rows), 'rows,', len(anchors), 'stars,', len(deep), 'deep sky,', erfa.__version__)
