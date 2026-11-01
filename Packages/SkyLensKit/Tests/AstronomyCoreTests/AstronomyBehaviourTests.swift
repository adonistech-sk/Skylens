import Foundation
import Testing
@testable import AstronomyCore

private let vega = Equatorial(rightAscension: 18.6156, declination: 38.7837)
private let polaris = Equatorial(rightAscension: 2.5303, declination: 89.2641)
private let canopus = Equatorial(rightAscension: 6.3992, declination: -52.6957)
private let greenwich = ObserverLocation(latitude: 51.4769, longitude: 0)

@Suite("Coordinates")
struct CoordinateTests {
    @Test func azimuthRunsClockwiseFromNorth() {
        #expect(Horizontal(azimuth: 0, altitude: 0).unitVector.x > 0.999)
        // East must be −y in a frame with +x north and +z up.
        #expect(Horizontal(azimuth: 90, altitude: 0).unitVector.y < -0.999)
        #expect(Horizontal(azimuth: 270, altitude: 0).unitVector.y > 0.999)
        #expect(Horizontal(azimuth: 12, altitude: 90).unitVector.z > 0.999)
    }

    @Test(arguments: [(0.0, 0.0), (123.4, 56.7), (359.9, -45), (180, 89.9)])
    func horizontalRoundTrip(az: Double, alt: Double) {
        let back = Horizontal(unitVector: Horizontal(azimuth: az, altitude: alt).unitVector)
        #expect(abs(back.azimuth - az) < 1e-9)
        #expect(abs(back.altitude - alt) < 1e-9)
    }

    @Test func equatorialRoundTrip() {
        let back = Equatorial(unitVector: vega.unitVector)
        #expect(abs(back.rightAscension - vega.rightAscension) < 1e-9)
        #expect(abs(back.declination - vega.declination) < 1e-9)
    }

    @Test func tinySeparationsSurviveRounding() {
        let a = Equatorial(rightAscension: 5, declination: 20)
        let b = Equatorial(rightAscension: 5, declination: 20 + 1.0 / 3600)
        #expect(abs(angularSeparation(a, b) * 3600 - 1) < 1e-4)
    }

    @Test func compassPoints() {
        #expect(CompassPoint(azimuth: 0) == .north)
        #expect(CompassPoint(azimuth: 359) == .north)
        #expect(CompassPoint(azimuth: 44) == .northEast)
        #expect(CompassPoint(azimuth: 225) == .southWest)
    }

    @Test func refractionLiftsNearHorizonOnly() {
        #expect(abs(Atmosphere.refraction(geometricAltitude: 0) - 0.48) < 0.1)
        #expect(Atmosphere.refraction(geometricAltitude: 45) < 0.03)
        #expect(Atmosphere.refraction(geometricAltitude: 90) < 0.001)
    }

    @Test func airMass() {
        #expect(abs(Atmosphere.airMass(altitude: 90)! - 1) < 0.001)
        #expect(abs(Atmosphere.airMass(altitude: 30)! - 2) < 0.01)
        #expect(Atmosphere.airMass(altitude: -1) == nil)
    }

    @Test func formats() {
        #expect(AstroFormat.rightAscension(18.6156) == "18h 36m 56s")
        #expect(AstroFormat.declination(-16.7161) == "−16° 42′ 58″")
        #expect(AstroFormat.declination(38.7837) == "+38° 47′ 01″")
        #expect(AstroFormat.altitude(-3.25) == "−3.2°" || AstroFormat.altitude(-3.25) == "−3.3°")
        #expect(AstroFormat.distance(au: 0.00257) == "384,467 km")
        #expect(AstroFormat.distance(au: 0.00257, imperial: true) == "238,896 mi")
        #expect(AstroFormat.distance(au: 5.2) == "5.20 AU")
        #expect(AstroFormat.distance(au: 5.2, imperial: true) == "5.20 AU", "AU is the convention either way")
        #expect(AstroFormat.distance(lightYears: 25.04) == "25.0 light-years")
        #expect(AstroFormat.distance(lightYears: 2_537_000) == "2.5 million light-years")
    }
}

@Suite("Time")
struct TimeTests {
    @Test func j2000Epoch() {
        let t = AstroTime(iso("2000-01-01T12:00:00Z"))
        #expect(t.utDays == 0)
        #expect(t.julianDate == 2_451_545.0)
    }

    @Test func dateRoundTrip() {
        let d = iso("2026-11-01T21:34:56Z")
        #expect(abs(AstroTime(d).date.timeIntervalSince(d)) < 0.001)
    }

    /// The Astronomical Almanac gives GMST ≈ 6h 39m 52s at 0h UT on 2000-01-01.
    @Test func siderealTimeAtEpoch() {
        let gast = AstroTime(iso("2000-01-01T00:00:00Z")).greenwichSiderealHours
        #expect(abs(gast - 6.6645) < 0.001)
    }

    /// A sidereal day is 23h 56m 4s, so sidereal time gains 3m 56s per solar day.
    @Test func siderealTimeGainsDaily() {
        let a = AstroTime(iso("2026-03-01T00:00:00Z")).greenwichSiderealHours
        let b = AstroTime(iso("2026-03-02T00:00:00Z")).greenwichSiderealHours
        #expect(abs((b - a) - 236.0 / 3600) < 0.0005)
    }

    @Test func localSiderealTimeFollowsLongitude() {
        let t = AstroTime(iso("2026-03-01T00:00:00Z"))
        let east = t.localSiderealHours(longitude: 90)
        let expected = (t.greenwichSiderealHours + 6).truncatingRemainder(dividingBy: 24)
        #expect(abs(east - expected) < 1e-9)
    }

    @Test func supportedRange() {
        #expect(AstroTime.isSupported(iso("2026-01-01T00:00:00Z")))
        #expect(!AstroTime.isSupported(iso("2300-01-01T00:00:00Z")))
        #expect(!AstroTime.isSupported(iso("1700-01-01T00:00:00Z")))
    }
}

@Suite("Observer edge cases")
struct ObserverTests {
    @Test func clampsAndWraps() {
        #expect(ObserverLocation(latitude: 95, longitude: 0).latitude == 90)
        #expect(ObserverLocation(latitude: 0, longitude: 190).longitude == -170)
    }

    /// From a pole every star circles at constant altitude equal to its declination.
    @Test func northPoleSeesConstantDeclinationAltitude() {
        let pole = ObserverLocation(latitude: 90, longitude: 0)
        for hours in stride(from: 0.0, to: 24, by: 6) {
            let f = SkyFrame(time: AstroTime(iso("2026-01-01T00:00:00Z")).adding(hours: hours), observer: pole)
            #expect(abs(RiseSet.altitude(of: vega, frame: f) - vega.declination) < 0.5)
        }
    }

    /// Polaris' altitude approximates the observer's latitude in both directions.
    @Test(arguments: [10.0, 35, 52, 70])
    func polarisAltitudeTracksLatitude(lat: Double) {
        let f = SkyFrame(time: AstroTime(iso("2026-06-15T22:00:00Z")), observer: ObserverLocation(latitude: lat, longitude: 20))
        #expect(abs(RiseSet.altitude(of: polaris, frame: f) - lat) < 1.2)
    }

    @Test func polarisBelowHorizonInSouth() {
        let f = SkyFrame(time: AstroTime(iso("2026-06-15T22:00:00Z")), observer: ObserverLocation(latitude: -33, longitude: 151))
        #expect(RiseSet.altitude(of: polaris, frame: f) < 0)
    }

    @Test func noonSunIsSouthInNorthernMidLatitudesAndNorthInSouthern() throws {
        let t = AstroTime(iso("2026-03-21T12:00:00Z"))
        let north = try Ephemeris.position(of: .sun, at: t, for: greenwich)
        #expect(abs(north.apparent.azimuth - 180) < 5)
        let south = try Ephemeris.position(of: .sun, at: t, for: ObserverLocation(latitude: -35, longitude: 0))
        #expect(south.apparent.azimuth < 10 || south.apparent.azimuth > 350)
    }

    /// Crossing the date line changes the civil date but not the sky. Two points
    /// either side of 180° must see the Sun almost identically at one instant.
    @Test func dateLineDoesNotDiscontinue() throws {
        let t = AstroTime(iso("2026-06-01T03:00:00Z"))
        let a = try Ephemeris.position(of: .sun, at: t, for: ObserverLocation(latitude: -15, longitude: 179.99))
        let b = try Ephemeris.position(of: .sun, at: t, for: ObserverLocation(latitude: -15, longitude: -179.99))
        #expect(a.geometric.unitVector.angle(to: b.geometric.unitVector) < 0.1)
    }

    @Test func topocentricMoonDiffersFromGeocentricByParallax() throws {
        // Over a full circuit the Moon's parallax at the horizon reaches about 1°.
        let t = AstroTime(iso("2026-03-10T06:00:00Z"))
        let a = try Ephemeris.position(of: .moon, at: t, for: ObserverLocation(latitude: 60, longitude: 0))
        let b = try Ephemeris.position(of: .moon, at: t, for: ObserverLocation(latitude: -60, longitude: 180))
        #expect(a.j2000.unitVector.angle(to: b.j2000.unitVector) > 0.5)
    }
}

@Suite("Rise and set")
struct RiseSetTests {
    /// Canopus (dec −52.7°) cannot rise north of about 37.3°N.
    @Test func canopusNeverRisesFromLondon() throws {
        let e = try RiseSet.events(for: .fixed(canopus), after: iso("2026-02-01T00:00:00Z"), observer: greenwich)
        #expect(e.circumstance == .alwaysDown)
        #expect(e.rise == nil && e.set == nil)
        #expect(RiseSet.altitudeRange(declination: canopus.declination, latitude: greenwich.latitude).upperBound < 0)
        #expect(try RiseSet.nextRise(of: .fixed(canopus), after: iso("2026-02-01T00:00:00Z"), observer: greenwich) == nil)
    }

    @Test func canopusRisesFromSydney() throws {
        // Far enough south Canopus is circumpolar, but at 30°S it does cross.
        let e = try RiseSet.events(for: .fixed(canopus), after: iso("2026-02-01T00:00:00Z"), observer: ObserverLocation(latitude: -30, longitude: 151))
        #expect(e.circumstance == .normal)
    }

    @Test func polarisNeverSetsFromLondon() throws {
        let e = try RiseSet.events(for: .fixed(polaris), after: iso("2026-02-01T00:00:00Z"), observer: greenwich)
        #expect(e.circumstance == .alwaysUp)
    }

    @Test func vegaRisesAndSetsFromSydney() throws {
        let sydney = ObserverLocation(latitude: -33.86, longitude: 151.21)
        let e = try RiseSet.events(for: .fixed(vega), after: iso("2026-07-01T00:00:00Z"), observer: sydney)
        #expect(e.circumstance == .normal)
        #expect(e.rise != nil && e.set != nil)
        // Maximum altitude is 90 − |−33.86 − 38.78| ≈ 17.4°.
        #expect(abs((e.transitAltitude ?? 0) - 17.4) < 0.5)
    }

    @Test func midnightSunAndPolarNight() throws {
        let tromso = ObserverLocation(latitude: 69.65, longitude: 18.96)
        let summer = try RiseSet.events(for: .body(.sun), after: iso("2026-06-21T00:00:00Z"), observer: tromso)
        #expect(summer.circumstance == .alwaysUp)
        let winter = try RiseSet.events(for: .body(.sun), after: iso("2026-12-21T00:00:00Z"), observer: tromso)
        #expect(winter.circumstance == .alwaysDown)
    }

    @Test func altitudeRange() {
        let r = RiseSet.altitudeRange(declination: 89.26, latitude: 51.48)
        #expect(abs(r.upperBound - 52.22) < 0.01)
        #expect(abs(r.lowerBound - 50.74) < 0.01)
    }
}

@Suite("Night window")
struct NightWindowTests {
    @Test func normalMidLatitudeNight() throws {
        let n = try NightWindow.compute(fromNoon: iso("2026-10-15T12:00:00Z"), observer: greenwich)
        #expect(n.condition == .normal)
        let chain = [n.sunset, n.civilDusk, n.nauticalDusk, n.astronomicalDusk,
                     n.astronomicalDawn, n.nauticalDawn, n.civilDawn, n.sunrise].compactMap { $0 }
        #expect(chain.count == 8)
        #expect(chain == chain.sorted(), "twilight stages must be ordered")
    }

    @Test func londonInJuneHasNoAstronomicalDarkness() throws {
        let n = try NightWindow.compute(fromNoon: iso("2026-06-21T12:00:00Z"), observer: greenwich)
        #expect(n.condition == .noAstronomicalDarkness)
        #expect(n.darkInterval != nil, "should fall back to nautical darkness")
    }

    @Test func polarDayAndNight() throws {
        let tromso = ObserverLocation(latitude: 69.65, longitude: 18.96)
        #expect(try NightWindow.compute(fromNoon: iso("2026-06-21T10:00:00Z"), observer: tromso).condition == .polarDay)
        #expect(try NightWindow.compute(fromNoon: iso("2026-12-21T10:00:00Z"), observer: tromso).condition == .polarNight)
    }

    @Test func zeroDarkTimeDuringPolarDay() throws {
        let tromso = ObserverLocation(latitude: 69.65, longitude: 18.96)
        #expect(try NightWindow.compute(fromNoon: iso("2026-06-21T10:00:00Z"), observer: tromso).darkInterval == nil)
    }

    /// New York moved from UTC−5 to UTC−4 on 8 March 2026. The physical sunset must
    /// not jump with the clock change, while the wall-clock reading does.
    @Test func daylightSavingShiftsWallClockNotSky() throws {
        let zone = try #require(TimeZone(identifier: "America/New_York"))
        let nyc = ObserverLocation(latitude: 40.71, longitude: -74.01)
        let before = try NightWindow.compute(containing: iso("2026-03-07T20:00:00Z"), observer: nyc, timeZone: zone)
        let after = try NightWindow.compute(containing: iso("2026-03-08T20:00:00Z"), observer: nyc, timeZone: zone)
        let a = try #require(before.sunset), b = try #require(after.sunset)
        let physicalShift = b.timeIntervalSince(a) - 86_400
        #expect(abs(physicalShift) < 120, "sunset moves about a minute a day")
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        let hourBefore = calendar.component(.hour, from: a)
        let hourAfter = calendar.component(.hour, from: b)
        #expect(hourAfter == hourBefore + 1)
    }

    @Test func earlyMorningBelongsToPreviousNight() throws {
        let zone = TimeZone(secondsFromGMT: 0)!
        let evening = try NightWindow.compute(containing: iso("2026-10-15T22:00:00Z"), observer: greenwich, timeZone: zone)
        let smallHours = try NightWindow.compute(containing: iso("2026-10-16T02:00:00Z"), observer: greenwich, timeZone: zone)
        #expect(evening.sunset == smallHours.sunset)
    }

    /// Apia sits just east of the date line (UTC+13). Its "tonight" must use the
    /// local calendar day, not the UTC one.
    @Test func dateLineLocalDay() throws {
        let apia = ObserverLocation(latitude: -13.83, longitude: -171.77)
        let zone = TimeZone(secondsFromGMT: 13 * 3600)!
        let n = try NightWindow.compute(containing: iso("2026-11-01T02:00:00Z"), observer: apia, timeZone: zone)
        let sunset = try #require(n.sunset)
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        #expect(calendar.component(.day, from: sunset) == 1)
        #expect((18...20).contains(calendar.component(.hour, from: sunset)))
    }
}

@Suite("Phenomena")
struct PhenomenaTests {
    @Test func moonPhaseNames() throws {
        // USNO: full Moon 2026-11-24 14:53 UT, new Moon 2026-11-09 07:02 UT.
        #expect(try MoonPhase.at(AstroTime(iso("2026-11-24T14:53:00Z"))).name == .fullMoon)
        #expect(try MoonPhase.at(AstroTime(iso("2026-11-09T07:02:00Z"))).name == .newMoon)
    }

    /// Published dates: NASA eclipse catalogue.
    @Test func totalSolarEclipseOf2024() throws {
        let e = try Phenomena.globalSolarEclipses(from: iso("2024-01-01T00:00:00Z"), to: iso("2024-12-31T00:00:00Z"))
        let total = try #require(e.first { $0.kind == .total })
        #expect(abs(total.peak.timeIntervalSince(iso("2024-04-08T18:17:00Z"))) < 300)
    }

    @Test func dallasSawTotalityAndLondonSawNothing() throws {
        let window = (iso("2024-04-08T00:00:00Z"), iso("2024-04-09T00:00:00Z"))
        let dallas = try Phenomena.localSolarEclipses(from: window.0, to: window.1, observer: ObserverLocation(latitude: 32.78, longitude: -96.8))
        #expect(dallas.first?.kind == .total)
        let london = try Phenomena.localSolarEclipses(from: window.0, to: window.1, observer: greenwich)
        #expect(london.first.map { $0.peakAltitude < 0 } ?? true)
    }

    @Test func totalLunarEclipseOf2025() throws {
        let e = try Phenomena.lunarEclipses(from: iso("2025-03-01T00:00:00Z"), to: iso("2025-03-31T00:00:00Z"))
        #expect(e.count == 1)
        #expect(e.first?.kind == .total)
        #expect(abs((e.first?.peak.timeIntervalSince(iso("2025-03-14T06:58:00Z"))) ?? 9999) < 300)
    }

    @Test func marsOpposition2025() throws {
        let o = try Phenomena.oppositions(of: .mars, from: iso("2025-01-01T00:00:00Z"), to: iso("2025-03-01T00:00:00Z"))
        #expect(o.count == 1)
        #expect(abs((o.first?.date.timeIntervalSince(iso("2025-01-16T02:32:00Z"))) ?? 1e9) < 86_400)
    }

    @Test func innerPlanetsHaveNoOpposition() throws {
        #expect(try Phenomena.oppositions(of: .venus, from: iso("2025-01-01T00:00:00Z"), to: iso("2030-01-01T00:00:00Z")).isEmpty)
    }

    @Test func venusGreatestElongation() throws {
        let e = try Phenomena.greatestElongations(of: .venus, from: iso("2025-01-01T00:00:00Z"), to: iso("2025-02-01T00:00:00Z"))
        // Greatest evening elongation of 47.2° on 2025-01-10.
        #expect(e.count == 1)
        #expect(e.first?.isEvening == true)
        #expect(abs((e.first?.elongation ?? 0) - 47.2) < 0.3)
    }

    /// The Great Conjunction of 2020-12-21: 0.1° separation.
    @Test func greatConjunction() throws {
        let c = try Phenomena.conjunctions(of: .jupiter, and: .saturn, from: iso("2020-12-01T00:00:00Z"), to: iso("2021-01-15T00:00:00Z"), threshold: 1)
        #expect(c.count == 1)
        #expect(abs((c.first?.separation ?? 9) - 0.1) < 0.03)
        #expect(abs((c.first?.date.timeIntervalSince(iso("2020-12-21T18:00:00Z"))) ?? 1e9) < 86_400)
    }

    @Test func noFalseConjunctionsAboveThreshold() throws {
        let c = try Phenomena.conjunctions(of: .mars, and: .neptune, from: iso("2026-01-01T00:00:00Z"), to: iso("2026-02-01T00:00:00Z"), threshold: 0.01)
        #expect(c.isEmpty)
    }

    /// The Sun's longitude is 0° at the March equinox by definition.
    @Test func solarLongitudeSearch() throws {
        let d = try #require(try Phenomena.solarLongitudeCrossing(0, after: iso("2026-01-01T00:00:00Z")))
        let season = try Phenomena.seasons(year: 2026)[0].date
        #expect(abs(d.timeIntervalSince(season)) < 120)
    }

    @Test func constellationLookup() {
        #expect(Ephemeris.constellationAbbreviation(of: vega) == "Lyr")
        #expect(Ephemeris.constellationAbbreviation(of: polaris) == "UMi")
        #expect(Ephemeris.constellationAbbreviation(of: canopus) == "Car")
    }

    @Test func saturnHasRingTiltOthersDoNot() throws {
        let t = AstroTime(iso("2026-10-01T00:00:00Z"))
        #expect(try abs(Ephemeris.appearance(of: .saturn, at: t).ringTilt) > 0.1)
        #expect(try Ephemeris.appearance(of: .mars, at: t).ringTilt == 0)
    }

    @Test func angularDiameters() throws {
        let t = AstroTime(iso("2026-01-05T00:00:00Z"))
        #expect(abs(try Ephemeris.appearance(of: .sun, at: t).angularDiameter - 0.54) < 0.01)
        #expect(abs(try Ephemeris.appearance(of: .moon, at: t).angularDiameter - 0.52) < 0.05)
    }

    /// Simulated time changes positions: over six hours the Sun moves ~90° in hour
    /// angle, regardless of what the wall clock is doing.
    @Test func simulatedTimeMovesTheSky() throws {
        let t = AstroTime(iso("2026-06-01T12:00:00Z"))
        let a = try Ephemeris.position(of: .sun, at: t, for: greenwich)
        let b = try Ephemeris.position(of: .sun, at: t.adding(hours: 6), for: greenwich)
        #expect(abs(Angle.normalize180(b.apparent.azimuth - a.apparent.azimuth)) > 45)
    }
}
