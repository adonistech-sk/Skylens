import Foundation
import Testing
@testable import AstronomyCore

// These tests compare results with NASA JPL Horizons and the US Naval Observatory.
// Those values live in ReferenceFixtures.swift and were fetched from the services
// themselves, so nothing here checks the engine against its own output.

func iso(_ s: String) -> Date {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    guard let d = f.date(from: s) else { fatalError("bad date \(s)") }
    return d
}

private func equatorial(raDegrees: Double, dec: Double) -> Equatorial {
    Equatorial(rightAscension: raDegrees / 15, declination: dec)
}

@Suite("Reference: JPL Horizons")
struct HorizonsTests {
    /// Astronomy Engine claims ±1′. That bound includes the aberration our J2000
    /// path applies and the Horizons astrometric column omits.
    @Test func topocentricJ2000PositionsMatch() throws {
        var worst: [String: Double] = [:]
        for row in ReferenceFixtures.horizons {
            let body = try #require(SolarSystemBody(rawValue: row.body))
            let observer = ObserverLocation(latitude: row.lat, longitude: row.lon, elevation: row.km * 1000)
            let p = try Ephemeris.position(of: body, at: AstroTime(iso(row.utc)), for: observer)
            let reference = equatorial(raDegrees: row.raJ2000, dec: row.decJ2000)
            let arcseconds = angularSeparation(p.j2000, reference) * 3600
            worst[row.body] = max(worst[row.body] ?? 0, arcseconds)
            #expect(arcseconds < 60, "\(row.body) \(row.site) \(row.utc): \(arcseconds)″")
        }
        print("max J2000 error (arcsec):", worst.sorted { $0.key < $1.key }.map { "\($0.key)=\(String(format: "%.1f", $0.value))" }.joined(separator: " "))
    }

    /// Compares full directions so azimuth noise near the zenith cannot hide or
    /// exaggerate an error. Horizons' airless output matches our geometric path.
    @Test func geometricAltAzMatch() throws {
        var worst = 0.0
        for row in ReferenceFixtures.horizons {
            let body = try #require(SolarSystemBody(rawValue: row.body))
            let observer = ObserverLocation(latitude: row.lat, longitude: row.lon, elevation: row.km * 1000)
            let p = try Ephemeris.position(of: body, at: AstroTime(iso(row.utc)), for: observer)
            let reference = Horizontal(azimuth: row.azimuth, altitude: row.altitude)
            let arcseconds = p.geometric.unitVector.angle(to: reference.unitVector) * 3600
            worst = max(worst, arcseconds)
            #expect(arcseconds < 60, "\(row.body) \(row.site) \(row.utc): \(arcseconds)″")
        }
        print("max alt/az error (arcsec):", String(format: "%.1f", worst))
    }

    @Test func distancesMatch() throws {
        for row in ReferenceFixtures.horizons {
            let body = try #require(SolarSystemBody(rawValue: row.body))
            let observer = ObserverLocation(latitude: row.lat, longitude: row.lon, elevation: row.km * 1000)
            let p = try Ephemeris.position(of: body, at: AstroTime(iso(row.utc)), for: observer)
            #expect(abs(p.distanceAU - row.distanceAU) / row.distanceAU < 2e-4, "\(row.body) \(row.utc)")
        }
    }

    /// The renderer's single per-frame matrix must agree with the full position
    /// path, otherwise stars and planets would drift apart on screen. This test
    /// would also catch reading the engine's column-first matrix the wrong way
    /// round, which mirrors the sky.
    @Test func skyFrameMatchesPositionPipeline() throws {
        for row in ReferenceFixtures.horizons where row.body == "jupiter" {
            let observer = ObserverLocation(latitude: row.lat, longitude: row.lon, elevation: row.km * 1000)
            let time = AstroTime(iso(row.utc))
            let p = try Ephemeris.position(of: .jupiter, at: time, for: observer)
            let frame = SkyFrame(time: time, observer: observer)
            let viaMatrix = frame.horizontal(j2000: p.j2000.unitVector)
            #expect(viaMatrix.unitVector.angle(to: p.geometric.unitVector) * 3600 < 1.0)
        }
    }
}

@Suite("Reference: US Naval Observatory")
struct USNOTests {
    private func midnight(_ date: String) -> Date { iso("\(date)T00:00:00Z") }

    /// USNO publishes whole minutes, so ±1 min rounding plus model differences
    /// gives a 2 minute tolerance.
    private func expectClose(_ ours: Date?, _ theirs: String?, _ label: String) {
        switch (ours, theirs) {
        case (nil, nil):
            break
        case let (a?, b?):
            let minutes = abs(a.timeIntervalSince(iso(b))) / 60
            #expect(minutes <= 2.0, "\(label): off by \(minutes) min")
        default:
            Issue.record("\(label): ours \(String(describing: ours)) theirs \(String(describing: theirs))")
        }
    }

    @Test func sunRiseSetTransit() throws {
        for d in ReferenceFixtures.usnoDays {
            let observer = ObserverLocation(latitude: d.lat, longitude: d.lon)
            let e = try RiseSet.events(for: .body(.sun), after: midnight(d.date), observer: observer)
            expectClose(e.rise, d.sunRise, "\(d.site) \(d.date) sunrise")
            expectClose(e.set, d.sunSet, "\(d.site) \(d.date) sunset")
            if d.sunTransit != nil {
                expectClose(e.transit, d.sunTransit, "\(d.site) \(d.date) transit")
            }
        }
    }

    @Test func moonRiseSet() throws {
        for d in ReferenceFixtures.usnoDays {
            let observer = ObserverLocation(latitude: d.lat, longitude: d.lon)
            let e = try RiseSet.events(for: .body(.moon), after: midnight(d.date), observer: observer)
            expectClose(e.rise, d.moonRise, "\(d.site) \(d.date) moonrise")
            expectClose(e.set, d.moonSet, "\(d.site) \(d.date) moonset")
        }
    }

    @Test func civilTwilight() throws {
        for d in ReferenceFixtures.usnoDays {
            let observer = ObserverLocation(latitude: d.lat, longitude: d.lon)
            let begin = RiseSet.twilightCrossing(.civil, rising: true, after: midnight(d.date), observer: observer)
            let end = RiseSet.twilightCrossing(.civil, rising: false, after: midnight(d.date), observer: observer)
            expectClose(begin, d.civilBegin, "\(d.site) \(d.date) civil begin")
            expectClose(end, d.civilEnd, "\(d.site) \(d.date) civil end")
        }
    }

    @Test func moonIlluminationAndPhaseName() throws {
        for d in ReferenceFixtures.usnoDays {
            guard let frac = d.fracillum, let name = d.curphase else { continue }
            // USNO quotes illumination at 0h UT of the date, as a percentage.
            let phase = try MoonPhase.at(AstroTime(midnight(d.date)))
            #expect(abs(phase.illuminatedFraction * 100 - frac) < 7, "\(d.site) \(d.date)")
            // The two services name the same stage, allowing that USNO uses its own
            // band around the quarters.
            let same = name == phase.name.rawValue
                || name.contains(phase.isWaxing ? "Waxing" : "Waning")
                || ["Full Moon", "New Moon", "First Quarter", "Last Quarter"].contains(name)
            #expect(same, "\(d.date): \(name) vs \(phase.name.rawValue)")
        }
    }

    @Test func lunarQuartersWithinTwoMinutes() throws {
        let names = ["New Moon": Phenomena.LunarQuarter.new, "First Quarter": .firstQuarter,
                     "Full Moon": .full, "Last Quarter": .lastQuarter]
        var ours: [Phenomena.LunarQuarterEvent] = []
        for year in [1950, 2026, 2100] {
            ours += try Phenomena.lunarQuarters(from: iso("\(year)-01-01T00:00:00Z"), to: iso("\(year)-12-31T23:59:00Z"))
        }
        #expect(ours.count == ReferenceFixtures.moonPhases.count)
        for reference in ReferenceFixtures.moonPhases {
            let t = iso(reference.utc)
            let match = ours.first { abs($0.date.timeIntervalSince(t)) < 3600 * 6 }
            let event = try #require(match, "no event near \(reference.utc)")
            #expect(event.quarter == names[reference.phase])
            // ΔT is measured for 1950 and 2026 but predicted for 2100, where USNO
            // and JPL assume different values, so that year gets more room.
            let limit = reference.utc.hasPrefix("2100") ? 4.0 : 2.0
            #expect(abs(event.date.timeIntervalSince(t)) / 60 <= limit, "\(reference.utc)")
        }
    }

    @Test func seasonsWithinTwoMinutes() throws {
        var ours: [Date] = []
        for year in [1950, 2026, 2100] {
            ours += try Phenomena.seasons(year: year).map(\.date)
        }
        for reference in ReferenceFixtures.seasons {
            let t = iso(reference.utc)
            let nearest = ours.map { abs($0.timeIntervalSince(t)) }.min() ?? .infinity
            #expect(nearest / 60 <= 2, "\(reference.utc)")
        }
    }
}
