import AstronomyCore
import Foundation
import SkyCatalog

public enum Equipment: String, Sendable, CaseIterable, Codable, Hashable {
    case nakedEye, binoculars, telescope, photography

    public var displayName: String {
        switch self {
        case .nakedEye: "Naked eye"
        case .binoculars: "Binoculars"
        case .telescope: "Telescope"
        case .photography: "Photography"
        }
    }

    /// Faintest point-source magnitude that is realistic from a reasonably dark site.
    public var limitingMagnitude: Double {
        switch self {
        case .nakedEye: 5.5
        case .binoculars: 9
        case .telescope: 12
        case .photography: 11
        }
    }
}

public enum Experience: String, Sendable, CaseIterable, Codable, Hashable {
    case beginner, enthusiast
}

/// Why an object was listed. Each factor is shown to the user in words, and there is
/// deliberately no single published number: a score would imply a precision that a
/// heuristic like this does not have.
public struct Recommendation: Sendable, Hashable, Identifiable {
    public let object: SkyObject
    /// When it stands highest within the dark window.
    public let bestTime: Date
    public let maxAltitude: Double
    /// The time it spends above 20° during the dark window.
    public let window: DateInterval
    public let azimuthAtBest: Double
    public let reasons: [String]
    public let cautions: [String]
    /// Internal ordering only. Never displayed.
    public let rank: Double

    public var id: ObjectID { object.id }
}

public struct TonightPlan: Sendable, Hashable {
    public let night: NightWindow
    public let moon: MoonPhase
    public let moonRise: Date?
    public let moonSet: Date?
    /// Fraction of the dark window with the Moon below the horizon, 0...1.
    public let moonlessFraction: Double
    public let recommendations: [Recommendation]
    /// Nil when there is no forecast for tonight, which is shown as unknown.
    public let meanCloudCover: Double?
    /// Clear stretches of at least an hour within the dark window.
    public let observingWindows: [DateInterval]
}

public enum TonightPlanner {
    private struct Candidate {
        let object: SkyObject
        let body: SolarSystemBody?
        let direction: Vec3?
    }

    /// Plans the night containing `date`.
    public static func plan(
        catalog: Catalog, date: Date, observer: ObserverLocation, timeZone: TimeZone,
        equipment: Set<Equipment>, experience: Experience, forecast: WeatherForecast?, limit: Int = 12
    ) throws -> TonightPlan {
        let night = try NightWindow.compute(containing: date, observer: observer, timeZone: timeZone)
        let reference = night.darkInterval?.start ?? date
        let moon = try MoonPhase.at(AstroTime(reference))
        let moonEvents = try RiseSet.events(for: .body(.moon), after: night.sunset ?? reference, observer: observer)

        guard let dark = night.darkInterval else {
            return TonightPlan(
                night: night, moon: moon, moonRise: moonEvents.rise, moonSet: moonEvents.set, moonlessFraction: 0,
                recommendations: [], meanCloudCover: nil, observingWindows: []
            )
        }

        // Sample every 15 minutes. One frame per sample makes it cheap to evaluate
        // hundreds of fixed objects, which only need a matrix multiply.
        let step: TimeInterval = 15 * 60
        let sampleCount = max(2, Int(dark.duration / step) + 1)
        let times = (0..<sampleCount).map { dark.start.addingTimeInterval(Double($0) * step) }
        let frames = times.map { SkyFrame(time: AstroTime($0), observer: observer) }
        let moonUp = try times.map { try Ephemeris.position(of: .moon, at: AstroTime($0), for: observer) }
        let moonless = Double(moonUp.filter { $0.geometric.altitude < 0 }.count) / Double(times.count)

        let bestEquipmentLimit = equipment.map(\.limitingMagnitude).max() ?? Equipment.nakedEye.limitingMagnitude
        var ranked: [Recommendation] = []
        for c in candidates(catalog: catalog, limit: bestEquipmentLimit) {
            if let r = try evaluate(
                c, times: times, frames: frames, moonUp: moonUp, moon: moon, night: dark, observer: observer,
                magnitudeLimit: bestEquipmentLimit, equipment: equipment, experience: experience,
                forecast: forecast, catalog: catalog
            ) {
                ranked.append(r)
            }
        }
        ranked.sort { $0.rank > $1.rank }

        return TonightPlan(
            night: night, moon: moon, moonRise: moonEvents.rise, moonSet: moonEvents.set, moonlessFraction: moonless,
            recommendations: Array(ranked.prefix(limit)),
            meanCloudCover: forecast?.meanCloudCover(during: dark),
            observingWindows: clearWindows(forecast: forecast, night: dark)
        )
    }

    private static func candidates(catalog: Catalog, limit: Double) -> [Candidate] {
        var out: [Candidate] = SolarSystemBody.planets.map {
            Candidate(object: Catalog.object(for: $0), body: $0, direction: nil)
        }
        out.append(Candidate(object: Catalog.object(for: .moon), body: .moon, direction: nil))
        for s in catalog.namedStars(limit: 30) {
            out.append(Candidate(object: s, body: nil, direction: s.position?.unitVector))
        }
        for d in catalog.deepSky where d.magnitude != nil && (d.magnitude ?? 99) <= limit && d.deepSky?.messier != nil || catalog.editorial(for: d)?.note != nil {
            out.append(Candidate(object: d, body: nil, direction: d.position?.unitVector))
        }
        return out
    }

    private static func evaluate(
        _ c: Candidate, times: [Date], frames: [SkyFrame], moonUp: [TopocentricPosition], moon: MoonPhase,
        night: DateInterval, observer: ObserverLocation, magnitudeLimit: Double, equipment: Set<Equipment>,
        experience: Experience, forecast: WeatherForecast?, catalog: Catalog
    ) throws -> Recommendation? {
        var altitudes = [Double](repeating: 0, count: times.count)
        var azimuths = altitudes
        var magnitude = c.object.magnitude

        for i in times.indices {
            let h: Horizontal
            if let body = c.body {
                h = try Ephemeris.position(of: body, at: AstroTime(times[i]), for: observer).apparent
            } else if let direction = c.direction {
                h = frames[i].horizontal(j2000: direction)
            } else {
                return nil
            }
            altitudes[i] = h.altitude
            azimuths[i] = h.azimuth
        }
        if let body = c.body {
            magnitude = try Ephemeris.appearance(of: body, at: AstroTime(times[times.count / 2])).magnitude
        }

        guard let best = altitudes.indices.max(by: { altitudes[$0] < altitudes[$1] }) else { return nil }
        let maxAltitude = altitudes[best]
        guard maxAltitude >= 15 else { return nil } // Too low to recommend honestly.

        let aboveCount = altitudes.filter { $0 >= 20 }.count
        let hoursUp = Double(aboveCount) * 0.25
        let firstUp = altitudes.firstIndex { $0 >= 20 } ?? best
        let lastUp = altitudes.lastIndex { $0 >= 20 } ?? best
        guard let m = magnitude else { return nil }

        // Extended objects spread their light out, so the stated magnitude flatters
        // them. A size penalty keeps M33 from being promised to the naked eye.
        let extent = c.object.deepSky?.majorAxis ?? 0
        let effective = m + (extent > 10 ? 1.5 * log(extent / 10) / log(10) : 0)
        guard effective <= magnitudeLimit else { return nil }

        var reasons: [String] = []
        var cautions: [String] = []

        let altitudeScore = sin(min(maxAltitude, 70) * Angle.degToRad) / sin(70 * Angle.degToRad)
        reasons.append("Reaches \(Int(maxAltitude.rounded()))° high around its best")

        let windowScore = min(1, hoursUp / 4)
        if hoursUp >= 3 { reasons.append("Well placed for \(Int(hoursUp)) hours tonight") }

        let brightness = min(1, max(0, (magnitudeLimit - effective) / magnitudeLimit))
        if m < 1 { reasons.append("Bright and easy to find") }

        var moonPenalty = 1.0
        if c.object.type.isDeepSky {
            let moonAtBest = moonUp[best]
            if moonAtBest.geometric.altitude > 0, let p = c.object.position {
                let separation = angularSeparation(p, moonAtBest.j2000)
                let glare = moon.illuminatedFraction * (separation < 30 ? 1 : 0.6)
                moonPenalty = 1 - 0.75 * glare
                if moon.illuminatedFraction > 0.5 {
                    cautions.append("Moonlight will wash out faint detail")
                }
            } else if moon.illuminatedFraction < 0.3 || moonAtBest.geometric.altitude <= 0 {
                reasons.append("Dark sky, with the Moon out of the way")
            }
        }

        var weatherFactor = 1.0
        if let forecast, let hour = forecast.hour(nearest: times[best]) {
            weatherFactor = 1 - 0.8 * hour.cloudCover / 100
            if hour.cloudCover >= 60 { cautions.append("Clouds are forecast around its best time") }
        }

        let bonus = beginnerAffinity(c.object, experience: experience, equipment: equipment)
        let rank = (0.4 * altitudeScore + 0.2 * windowScore + 0.4 * brightness) * moonPenalty * weatherFactor + bonus

        return Recommendation(
            object: c.object, bestTime: times[best], maxAltitude: maxAltitude,
            window: DateInterval(start: times[firstUp], end: max(times[firstUp], times[lastUp])),
            azimuthAtBest: azimuths[best], reasons: reasons, cautions: cautions, rank: rank
        )
    }

    /// Favours showpieces for beginners and deep-sky targets for instrument users.
    private static func beginnerAffinity(_ o: SkyObject, experience: Experience, equipment: Set<Equipment>) -> Double {
        var bonus = 0.0
        switch o.type {
        case .planet, .moon:
            bonus += experience == .beginner ? 0.25 : 0.1
        case .star:
            bonus += experience == .beginner ? 0.05 : -0.1
        default:
            if !equipment.isDisjoint(with: [.telescope, .photography]) { bonus += 0.2 }
            if equipment.contains(.binoculars) { bonus += 0.1 }
        }
        return bonus
    }

    /// Contiguous hours under 40% cloud. Empty when there is no forecast, because no
    /// claim can be made rather than because the night is bad.
    private static func clearWindows(forecast: WeatherForecast?, night: DateInterval) -> [DateInterval] {
        guard let forecast else { return [] }
        var windows: [DateInterval] = []
        var start: Date?
        var end: Date?
        for hour in forecast.hours where night.contains(hour.date) {
            if hour.cloudCover < 40 {
                start = start ?? hour.date
                end = hour.date.addingTimeInterval(3600)
            } else {
                if let s = start, let e = end, e.timeIntervalSince(s) >= 3600 { windows.append(DateInterval(start: s, end: e)) }
                start = nil
                end = nil
            }
        }
        if let s = start, let e = end, e.timeIntervalSince(s) >= 3600 {
            windows.append(DateInterval(start: s, end: min(e, night.end)))
        }
        return windows
    }
}
