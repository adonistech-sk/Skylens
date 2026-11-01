import AstronomyCore
import Foundation
import Testing
@testable import Satellites

/// Reference values come from satellite.js, an independent port of Vallado's code,
/// so agreement here is meaningful. Fixtures live in SGP4Fixtures.swift.
@Suite("SGP4 against satellite.js")
struct SGP4ReferenceTests {
    @Test(arguments: sgp4Fixtures.map(\.name))
    func positionsAndVelocitiesMatch(name: String) throws {
        let fixture = try #require(sgp4Fixtures.first { $0.name == name })
        let elements = try OrbitalElements(name: name, line1: fixture.line1, line2: fixture.line2)
        let propagator = try SGP4(elements)
        for s in fixture.samples {
            let state = try propagator.propagate(minutesSinceEpoch: s.t)
            let dr = (state.position - Vec3(s.x, s.y, s.z)).length
            let dv = (state.velocity - Vec3(s.vx, s.vy, s.vz)).length
            #expect(dr < 0.001, "\(name) t=\(s.t): \(dr) km")
            #expect(dv < 1e-5, "\(name) t=\(s.t): \(dv) km/s")
        }
    }

    @Test func spacetrackReportVector() throws {
        // Vallado et al. 2006, published result for satellite 88888 at epoch.
        let f = try #require(sgp4Fixtures.first { $0.name == "SPACETRACK88888" })
        let e = try OrbitalElements(name: f.name, line1: f.line1, line2: f.line2)
        let state = try SGP4(e).propagate(minutesSinceEpoch: 0)
        #expect(abs(state.position.x - 2328.97) < 0.01)
        #expect(abs(state.position.y - (-5995.22)) < 0.01)
        #expect(abs(state.position.z - 1719.97) < 0.01)
    }

    @Test func lookAnglesMatch() throws {
        let f = try #require(sgp4Fixtures.first { $0.name == "ISS" })
        let e = try OrbitalElements(name: "ISS", line1: f.line1, line2: f.line2)
        let tracker = try SatelliteTracker(e)
        let warsaw = ObserverLocation(latitude: 52.23, longitude: 21.01, elevation: 100)
        for s in sgp4LookFixtures {
            let date = e.epoch.addingTimeInterval(s.epochHours * 3600)
            let look = try tracker.look(at: date, from: warsaw)
            #expect(abs(look.horizontal.altitude - s.elevation) < 0.1, "elevation at +\(s.epochHours)h")
            #expect(abs(Angle.normalize180(look.horizontal.azimuth - s.azimuth)) < 0.2, "azimuth at +\(s.epochHours)h")
            #expect(abs(look.rangeKm - s.range) / s.range < 0.002, "range at +\(s.epochHours)h")
        }
    }
}

@Suite("Element handling")
struct ElementTests {
    @Test func parsesTLEFields() throws {
        let f = try #require(sgp4Fixtures.first { $0.name == "SPACETRACK88888" })
        let e = try OrbitalElements(name: "T", line1: f.line1, line2: f.line2)
        #expect(e.noradID == 88888)
        #expect(e.inclination == 72.8435)
        #expect(abs(e.eccentricity - 0.0086731) < 1e-12)
        #expect(abs(e.bstar - 0.66816e-4) < 1e-12)
        #expect(abs(e.periodMinutes - 89.67) < 0.01)
    }

    @Test func rejectsABadChecksum() throws {
        let f = try #require(sgp4Fixtures.first { $0.name == "ISS" })
        let corrupted = String(f.line1.dropLast()) + "0"
        let intact = f.line1.last == "0" ? String(f.line1.dropLast()) + "1" : corrupted
        #expect(throws: SatelliteError.malformedElements) {
            try OrbitalElements(name: "x", line1: intact, line2: f.line2)
        }
    }

    @Test func refusesDeepSpaceOrbitsRatherThanGuessing() {
        // GPS-like orbit: about two revolutions a day.
        let e = OrbitalElements(name: "GPS", noradID: 1, epoch: Date(), meanMotion: 2, eccentricity: 0.01,
                                inclination: 55, rightAscensionOfNode: 0, argumentOfPerigee: 0, meanAnomaly: 0, bstar: 0)
        #expect(throws: SatelliteError.deepSpaceOrbitUnsupported) { try SGP4(e) }
    }

    @Test func parsesCelesTrakOMM() throws {
        let json = #"""
        [{"OBJECT_NAME":"ISS (ZARYA)","OBJECT_ID":"1998-067A","EPOCH":"2026-10-31T10:25:39.478176",
          "MEAN_MOTION":15.49,"ECCENTRICITY":0.0007,"INCLINATION":51.63,"RA_OF_ASC_NODE":12.3,
          "ARG_OF_PERICENTER":45.6,"MEAN_ANOMALY":78.9,"EPHEMERIS_TYPE":0,"CLASSIFICATION_TYPE":"U",
          "NORAD_CAT_ID":25544,"ELEMENT_SET_NO":999,"REV_AT_EPOCH":12345,"BSTAR":0.00012,
          "MEAN_MOTION_DOT":0.00006,"MEAN_MOTION_DDOT":0}]
        """#
        let e = try #require(try OMMParser.parse(Data(json.utf8)).first)
        #expect(e.noradID == 25544)
        #expect(e.name == "ISS (ZARYA)")
        let iso = ISO8601DateFormatter()
        let whole = try #require(iso.date(from: "2026-10-31T10:25:39Z"))
        #expect(abs(e.epoch.timeIntervalSince(whole) - 0.478176) < 1e-3, "fraction of a second must survive")
    }

    @Test func rejectsMalformedOMM() {
        #expect(throws: SatelliteError.malformedElements) { try OMMParser.parse(Data("[{}]".utf8)) }
        #expect(throws: SatelliteError.malformedElements) { try OMMParser.parse(Data("not json".utf8)) }
    }
}

@Suite("Freshness and honesty")
struct FreshnessTests {
    private let epoch = Date(timeIntervalSince1970: 1_800_000_000)
    private func at(days: Double) -> Date { epoch.addingTimeInterval(days * 86_400) }

    @Test func classifiesAge() {
        #expect(ElementFreshness(epoch: epoch, now: at(days: 1)) == .fresh)
        #expect(ElementFreshness(epoch: epoch, now: at(days: 4)) == .aging(days: 4))
        #expect(ElementFreshness(epoch: epoch, now: at(days: 10)) == .stale(days: 10))
    }

    @Test func ageIsSymmetricSoFutureDatesAreAlsoDistrusted() {
        #expect(!ElementFreshness(epoch: epoch, now: at(days: -30)).canPredict)
    }

    @Test func onlyFreshDataHasNoWarning() {
        #expect(ElementFreshness.fresh.warning == nil)
        #expect(ElementFreshness.aging(days: 4).warning != nil)
        #expect(ElementFreshness.stale(days: 9).warning != nil)
        #expect(!ElementFreshness.stale(days: 9).canPredict)
    }

    /// The core promise: stale elements yield no passes at all, never invented ones.
    @Test func staleElementsRefuseToPredict() throws {
        let f = try #require(sgp4Fixtures.first { $0.name == "ISS" })
        let e = try OrbitalElements(name: "ISS", line1: f.line1, line2: f.line2)
        let tracker = try SatelliteTracker(e)
        let london = ObserverLocation(latitude: 51.5, longitude: 0)
        #expect(throws: SatelliteError.staleElements) {
            try tracker.passes(from: london, start: e.epoch.addingTimeInterval(20 * 86_400), days: 1)
        }
    }
}

@Suite("Pass prediction")
struct PassTests {
    private func iss() throws -> SatelliteTracker {
        let f = try #require(sgp4Fixtures.first { $0.name == "ISS" })
        return try SatelliteTracker(OrbitalElements(name: "ISS", line1: f.line1, line2: f.line2))
    }

    @Test func passesAreWellFormed() throws {
        let tracker = try iss()
        let warsaw = ObserverLocation(latitude: 52.23, longitude: 21.01)
        let passes = try tracker.passes(from: warsaw, start: tracker.elements.epoch, days: 2)
        #expect(!passes.isEmpty)
        for p in passes {
            #expect(p.rise < p.culmination && p.culmination < p.set)
            #expect(p.maxAltitude >= 10 && p.maxAltitude <= 90)
            // An ISS pass above 10° lasts a few minutes, never tens of minutes.
            #expect(p.duration > 20 && p.duration < 700, "\(p.duration)")
            if let v = p.visibleInterval {
                #expect(v.start >= p.rise && v.end <= p.set)
            }
            let peak = try tracker.look(at: p.culmination, from: warsaw).horizontal.altitude
            #expect(abs(peak - p.maxAltitude) < 0.01)
        }
    }

    @Test func passesAreOrderedAndDistinct() throws {
        let tracker = try iss()
        let passes = try tracker.passes(from: ObserverLocation(latitude: 40, longitude: -75), start: tracker.elements.epoch, days: 2)
        for (a, b) in zip(passes, passes.dropFirst()) {
            #expect(a.set < b.rise)
        }
    }

    /// The ISS's 51.6° inclination plus its footprint limits what it can reach. From
    /// the Antarctic coast it stays well below the horizon, so no passes can appear.
    @Test func issNeverReachesTheFarSouth() throws {
        let tracker = try iss()
        let passes = try tracker.passes(from: ObserverLocation(latitude: -82, longitude: 0), start: tracker.elements.epoch, days: 2)
        #expect(passes.isEmpty)
    }

    @Test func lookAltitudeIsAboutOrbitHeight() throws {
        let tracker = try iss()
        let look = try tracker.look(at: tracker.elements.epoch, from: ObserverLocation(latitude: 0, longitude: 0))
        #expect((390...440).contains(look.altitudeKm))
    }

    /// A satellite directly between Sun and Earth is lit, and one directly behind
    /// Earth is in shadow.
    @Test func earthShadow() throws {
        let date = Date(timeIntervalSince1970: 1_800_000_000)
        let sun = try Ephemeris.geocentricDirection(of: .sun, at: AstroTime(date))
        #expect(try SatelliteTracker.isSunlit(sun * 6800, at: date))
        #expect(try !SatelliteTracker.isSunlit(sun * -6800, at: date))
        // Behind Earth but offset by more than Earth's radius, it clears the shadow.
        let offset = sun.cross(Vec3(0, 0, 1)).normalized * 7000
        #expect(try SatelliteTracker.isSunlit(sun * -2000 + offset, at: date))
    }

    @Test func gmstAtJ2000() {
        // USNO: GMST at 2000-01-01 12:00 UT is 18h 41m 50.5s.
        let radians = SatelliteTracker.greenwichMeanSiderealRadians(julianDate: 2_451_545)
        #expect(abs(radians * 12 / .pi - 18.6973) < 0.001)
    }
}
