import AstronomyCore
import Foundation
import Satellites
import SkyCatalog

/// Where a date comes from, shown to the user so nothing passes as more certain than
/// it is.
public enum EventSource: Sendable, Hashable {
    /// Solved numerically from the ephemeris at runtime.
    case calculated
    /// Curated parameters, with the date derived from them, such as a shower's solar longitude.
    case curated(String)
    /// Depends on orbital data that must be refreshed from a live source.
    case liveData(String)

    public var label: String {
        switch self {
        case .calculated: "Calculated from the ephemeris"
        case .curated(let source): "From \(source)"
        case .liveData(let source): "Based on live data from \(source)"
        }
    }
}

public struct SkyEvent: Sendable, Hashable, Identifiable {
    public enum Kind: String, Sendable, CaseIterable, Codable {
        case moonPhase, eclipse, meteorShower, opposition, elongation, conjunction, season, satellitePass

        public var displayName: String {
            switch self {
            case .moonPhase: "Moon phases"
            case .eclipse: "Eclipses"
            case .meteorShower: "Meteor showers"
            case .opposition: "Oppositions"
            case .elongation: "Elongations"
            case .conjunction: "Conjunctions"
            case .season: "Seasons"
            case .satellitePass: "Satellite passes"
            }
        }
    }

    public enum Visibility: Sendable, Hashable {
        case visible(String)
        case notVisible(String)
        /// Applies to the whole sky or depends on no particular location.
        case general
    }

    public let id: String
    public let kind: Kind
    public let title: String
    public let date: Date
    public let endDate: Date?
    public let detail: String
    public let source: EventSource
    public let visibility: Visibility
    public let related: [ObjectID]
    /// Whether this is notable enough for the default alert set.
    public let isSignificant: Bool
}

/// The IMO Working List's major annual showers. Peaks are stated as solar longitude
/// (J2000), which moves the calendar date slightly each year, so the date is always
/// solved rather than stored.
public struct MeteorShower: Sendable, Hashable, Identifiable {
    public let code: String
    public let name: String
    public let solarLongitude: Double
    public let zenithalHourlyRate: Int
    public let radiant: Equatorial
    /// Parent comet or asteroid, when established.
    public let parent: String?

    public var id: String { code }

    public static let major: [MeteorShower] = [
        .init(code: "QUA", name: "Quadrantids", solarLongitude: 283.16, zenithalHourlyRate: 110, radiant: .init(rightAscension: 15.34, declination: 49.7), parent: "Asteroid 2003 EH1"),
        .init(code: "LYR", name: "Lyrids", solarLongitude: 32.32, zenithalHourlyRate: 18, radiant: .init(rightAscension: 18.10, declination: 33.3), parent: "Comet Thatcher"),
        .init(code: "ETA", name: "Eta Aquariids", solarLongitude: 45.5, zenithalHourlyRate: 50, radiant: .init(rightAscension: 22.53, declination: -1.1), parent: "Comet Halley"),
        .init(code: "SDA", name: "Southern Delta Aquariids", solarLongitude: 127, zenithalHourlyRate: 25, radiant: .init(rightAscension: 22.67, declination: -16.4), parent: nil),
        .init(code: "PER", name: "Perseids", solarLongitude: 140.0, zenithalHourlyRate: 100, radiant: .init(rightAscension: 3.22, declination: 58.1), parent: "Comet Swift–Tuttle"),
        .init(code: "ORI", name: "Orionids", solarLongitude: 208, zenithalHourlyRate: 20, radiant: .init(rightAscension: 6.37, declination: 15.9), parent: "Comet Halley"),
        .init(code: "LEO", name: "Leonids", solarLongitude: 235.27, zenithalHourlyRate: 15, radiant: .init(rightAscension: 10.15, declination: 21.8), parent: "Comet Tempel–Tuttle"),
        .init(code: "GEM", name: "Geminids", solarLongitude: 262.2, zenithalHourlyRate: 150, radiant: .init(rightAscension: 7.49, declination: 32.3), parent: "Asteroid 3200 Phaethon"),
        .init(code: "URS", name: "Ursids", solarLongitude: 270.7, zenithalHourlyRate: 10, radiant: .init(rightAscension: 14.47, declination: 75.3), parent: "Comet Tuttle"),
    ]
}

public enum EventCalendar {
    /// Every supported event in a window, in date order, with visibility evaluated
    /// for `observer`. Passes come separately since they depend on live data.
    public static func events(
        from start: Date, to end: Date, observer: ObserverLocation, satellitePasses: [(name: String, pass: SatellitePass)] = []
    ) throws -> [SkyEvent] {
        var out: [SkyEvent] = []
        out += try moonPhases(start, end, observer)
        out += try eclipses(start, end, observer)
        out += try seasons(start, end)
        out += try oppositions(start, end, observer)
        out += try elongations(start, end, observer)
        out += try conjunctions(start, end, observer)
        out += try meteorShowers(start, end, observer)
        out += satellitePasses.map(passEvent)
        return out.sorted { $0.date < $1.date }
    }

    private static func moonPhases(_ start: Date, _ end: Date, _ observer: ObserverLocation) throws -> [SkyEvent] {
        try Phenomena.lunarQuarters(from: start, to: end).map { q -> SkyEvent in
            let describe: String = switch q.quarter {
            case .new: "The Moon is lost in the Sun's glare. Dark skies make this the best time for faint objects."
            case .firstQuarter: "Half lit and high at sunset. Crater detail is strong along the terminator."
            case .full: "Fully lit and up all night. It is beautiful, and it drowns out faint objects."
            case .lastQuarter: "Half lit, rising around midnight and leaving the evening sky dark."
            }
            let seconds = Int(q.date.timeIntervalSince1970)
            let isSignificant = q.quarter == .full || q.quarter == .new
            return SkyEvent(
                id: "moon-\(q.quarter.rawValue)-\(seconds)", kind: .moonPhase,
                title: q.quarter.name, date: q.date, endDate: nil, detail: describe, source: .calculated,
                visibility: .general, related: [.body(.moon)], isSignificant: isSignificant
            )
        }
    }

    private static func eclipses(_ start: Date, _ end: Date, _ observer: ObserverLocation) throws -> [SkyEvent] {
        var out: [SkyEvent] = []
        for e in try Phenomena.lunarEclipses(from: start, to: end) {
            let altitude = try Ephemeris.position(of: .moon, at: AstroTime(e.peak), for: observer).apparent.altitude
            let visibility: SkyEvent.Visibility = altitude > 0
                ? .visible("The Moon stands \(Int(altitude.rounded()))° high at the peak.")
                : .notVisible("The Moon is below your horizon at the peak.")
            let span = e.penumbralSemiDurationMinutes * 60
            out.append(SkyEvent(
                id: "lunar-\(Int(e.peak.timeIntervalSince1970))", kind: .eclipse,
                title: "\(e.kind.rawValue) Lunar Eclipse",
                date: e.peak.addingTimeInterval(-span), endDate: e.peak.addingTimeInterval(span),
                detail: lunarDetail(e), source: .calculated, visibility: visibility,
                related: [.body(.moon)], isSignificant: e.kind != .penumbral
            ))
        }

        let locals = try Phenomena.localSolarEclipses(from: start, to: end, observer: observer)
        for e in locals where e.isVisible {
            let percent = Int((e.obscuration * 100).rounded())
            let verdict: String
            if e.peakAltitude > 0 {
                verdict = "The Sun stands \(Int(e.peakAltitude.rounded()))° high at the peak."
            } else if e.beginAltitude > 0 {
                verdict = "It begins before sunset, but the Sun sets before the peak."
            } else {
                verdict = "The Sun rises while the eclipse is already under way, after the peak."
            }
            out.append(SkyEvent(
                id: "solar-local-\(Int(e.peak.timeIntervalSince1970))", kind: .eclipse,
                title: "\(e.kind.rawValue) Solar Eclipse", date: e.partialBegin, endDate: e.partialEnd,
                detail: "Up to \(percent)% of the Sun's disc is covered from your location. Use certified eye protection at all times unless you are inside the path of totality during totality.",
                source: .calculated, visibility: .visible(verdict),
                related: [.body(.sun), .body(.moon)], isSignificant: true
            ))
        }

        // Total and annular eclipses elsewhere are still worth knowing about.
        for e in try Phenomena.globalSolarEclipses(from: start, to: end) where e.kind == .total || e.kind == .annular {
            let alreadyListed = locals.contains { $0.isVisible && abs($0.peak.timeIntervalSince(e.peak)) < 6 * 3600 }
            guard !alreadyListed else { continue }
            out.append(SkyEvent(
                id: "solar-global-\(Int(e.peak.timeIntervalSince1970))", kind: .eclipse,
                title: "\(e.kind.rawValue) Solar Eclipse", date: e.peak, endDate: nil,
                detail: "Visible along a narrow path elsewhere on Earth.", source: .calculated,
                visibility: .notVisible("Not visible from your location."),
                related: [.body(.sun), .body(.moon)], isSignificant: false
            ))
        }
        return out
    }

    private static func lunarDetail(_ e: Phenomena.LunarEclipse) -> String {
        switch e.kind {
        case .total:
            "The Moon passes fully into Earth's shadow and can turn copper-red. Totality lasts about \(Int((e.totalSemiDurationMinutes * 2).rounded())) minutes."
        case .partial:
            "Up to \(Int((e.obscuration * 100).rounded()))% of the Moon enters Earth's dark shadow."
        default:
            "The Moon crosses only Earth's faint outer shadow, so the dimming is subtle and easy to miss."
        }
    }

    private static func seasons(_ start: Date, _ end: Date) throws -> [SkyEvent] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let first = calendar.component(.year, from: start), last = calendar.component(.year, from: end)
        var out: [SkyEvent] = []
        for year in first...max(first, last) {
            for s in try Phenomena.seasons(year: year) where s.date >= start && s.date <= end {
                let isEquinox = s.name == .marchEquinox || s.name == .septemberEquinox
                let detail: String = isEquinox
                    ? "Day and night are nearly equal, as the Sun crosses the celestial equator."
                    : "The Sun reaches its farthest point from the celestial equator."
                let seconds = Int(s.date.timeIntervalSince1970)
                out.append(SkyEvent(
                    id: "season-\(seconds)", kind: .season, title: s.name.rawValue, date: s.date,
                    endDate: nil, detail: detail, source: .calculated, visibility: .general,
                    related: [.body(.sun)], isSignificant: false
                ))
            }
        }
        return out
    }

    private static func oppositions(_ start: Date, _ end: Date, _ observer: ObserverLocation) throws -> [SkyEvent] {
        var out: [SkyEvent] = []
        for body in SolarSystemBody.planets where !body.isInferior {
            for o in try Phenomena.oppositions(of: body, from: start, to: end) {
                let peak = try RiseSet.events(for: .body(body), after: o.date.addingTimeInterval(-43_200), observer: observer).transitAltitude
                let visibility: SkyEvent.Visibility = (peak ?? -90) > 0
                    ? .visible("Up all night, reaching about \(Int((peak ?? 0).rounded()))° high.")
                    : .notVisible("\(body.name) stays below your horizon.")
                out.append(SkyEvent(
                    id: "opp-\(body.rawValue)-\(Int(o.date.timeIntervalSince1970))", kind: .opposition,
                    title: "\(body.name) at Opposition", date: o.date, endDate: nil,
                    detail: "Earth passes between \(body.name) and the Sun, so the planet is at its brightest for the year, near magnitude \(String(format: "%.1f", o.magnitude)), rising at sunset.",
                    source: .calculated, visibility: visibility, related: [.body(body)],
                    isSignificant: body != .neptune && body != .uranus
                ))
            }
        }
        return out
    }

    private static func elongations(_ start: Date, _ end: Date, _ observer: ObserverLocation) throws -> [SkyEvent] {
        var out: [SkyEvent] = []
        for body in [SolarSystemBody.mercury, .venus] {
            for e in try Phenomena.greatestElongations(of: body, from: start, to: end) {
                let when = e.isEvening ? "evening" : "morning"
                out.append(SkyEvent(
                    id: "elong-\(body.rawValue)-\(Int(e.date.timeIntervalSince1970))", kind: .elongation,
                    title: "\(body.name) at Greatest \(e.isEvening ? "Evening" : "Morning") Elongation", date: e.date, endDate: nil,
                    detail: "\(body.name) stands \(String(format: "%.1f", e.elongation))° from the Sun, its best \(when) showing of this apparition.",
                    source: .calculated, visibility: .general, related: [.body(body)], isSignificant: body == .venus
                ))
            }
        }
        return out
    }

    private static func conjunctions(_ start: Date, _ end: Date, _ observer: ObserverLocation) throws -> [SkyEvent] {
        let bright: [SolarSystemBody] = [.mercury, .venus, .mars, .jupiter, .saturn]
        var out: [SkyEvent] = []

        func event(_ c: Phenomena.Conjunction, significant: Bool) throws -> SkyEvent {
            let elongation = try angleFromSun(c.first == .moon ? c.second : c.first, at: c.date)
            let visibility: SkyEvent.Visibility = elongation > 12
                ? try skyVisibility(of: c.first == .moon ? c.second : c.first, around: c.date, observer: observer)
                : .notVisible("Too close to the Sun to see.")
            return SkyEvent(
                id: "conj-\(c.first.rawValue)-\(c.second.rawValue)-\(Int(c.date.timeIntervalSince1970))", kind: .conjunction,
                title: "\(c.first.name) and \(c.second.name)", date: c.date, endDate: nil,
                detail: "The two appear \(String(format: "%.1f", c.separation))° apart. For scale, the full Moon is about half a degree wide.",
                source: .calculated, visibility: visibility, related: [.body(c.first), .body(c.second)],
                isSignificant: significant
            )
        }

        for (i, a) in bright.enumerated() {
            for b in bright[(i + 1)...] {
                for c in try Phenomena.conjunctions(of: a, and: b, from: start, to: end, threshold: 2.5) {
                    out.append(try event(c, significant: c.separation < 1))
                }
            }
        }
        for planet in [SolarSystemBody.venus, .mars, .jupiter, .saturn] {
            for c in try Phenomena.conjunctions(of: .moon, and: planet, from: start, to: end, threshold: 3) {
                out.append(try event(c, significant: false))
            }
        }
        return out
    }

    private static func angleFromSun(_ body: SolarSystemBody, at date: Date) throws -> Double {
        let t = AstroTime(date)
        return try Ephemeris.geocentricDirection(of: body, at: t).angle(to: Ephemeris.geocentricDirection(of: .sun, at: t))
    }

    /// Whether a body is above the horizon at some point while the Sun is down, in
    /// the 24 hours around an instant.
    private static func skyVisibility(of body: SolarSystemBody, around date: Date, observer: ObserverLocation) throws -> SkyEvent.Visibility {
        var best: Double?
        for hours in stride(from: -12.0, through: 12.0, by: 1) {
            let t = AstroTime(date).adding(hours: hours)
            let sun = try Ephemeris.altitude(of: .sun, at: t, for: observer)
            guard sun < -6 else { continue }
            let altitude = try Ephemeris.altitude(of: body, at: t, for: observer)
            if altitude > (best ?? 5) { best = altitude }
        }
        if let best { return .visible("Reaches about \(Int(best.rounded()))° high in the dark sky.") }
        return .notVisible("Below your horizon while the sky is dark.")
    }

    private static func meteorShowers(_ start: Date, _ end: Date, _ observer: ObserverLocation) throws -> [SkyEvent] {
        var out: [SkyEvent] = []
        let frameDate = { (d: Date) in SkyFrame(time: AstroTime(d), observer: observer) }
        for shower in MeteorShower.major {
            var cursor = start
            while let peak = try Phenomena.solarLongitudeCrossing(shower.solarLongitude, after: cursor), peak <= end {
                let moon = try MoonPhase.at(AstroTime(peak))
                let range = RiseSet.altitudeRange(declination: shower.radiant.declination, latitude: observer.latitude)
                let radiantBest = (0..<24).map { RiseSet.altitude(of: shower.radiant, frame: frameDate(peak.addingTimeInterval(Double($0) * 3600 - 43_200))) }.max() ?? range.upperBound
                let visibility: SkyEvent.Visibility = radiantBest > 10
                    ? .visible("The radiant reaches about \(Int(radiantBest.rounded()))° high. Best after midnight.")
                    : .notVisible("The radiant stays too low from your latitude.")
                let moonNote = moon.illuminatedFraction > 0.6
                    ? " A bright Moon (\(Int((moon.illuminatedFraction * 100).rounded()))% lit) will hide the fainter meteors."
                    : moon.illuminatedFraction < 0.25 ? " The Moon is out of the way, which is favourable." : ""
                let parent = shower.parent.map { " Its source is \($0)." } ?? ""
                out.append(SkyEvent(
                    id: "shower-\(shower.code)-\(Int(peak.timeIntervalSince1970))", kind: .meteorShower,
                    title: "\(shower.name) Peak", date: peak, endDate: nil,
                    detail: "Up to about \(shower.zenithalHourlyRate) meteors an hour under ideal dark skies.\(parent)\(moonNote) Real rates vary and are usually lower.",
                    source: .curated("the IMO Meteor Shower Working List"), visibility: visibility, related: [],
                    isSignificant: shower.zenithalHourlyRate >= 50
                ))
                cursor = peak.addingTimeInterval(300 * 86_400)
            }
        }
        return out
    }

    private static func passEvent(_ entry: (name: String, pass: SatellitePass)) -> SkyEvent {
        let p = entry.pass
        return SkyEvent(
            id: "pass-\(p.id)", kind: .satellitePass, title: "\(entry.name) Pass", date: p.rise, endDate: p.set,
            detail: "Rises in the \(CompassPoint(azimuth: p.riseAzimuth).name), climbs to \(Int(p.maxAltitude.rounded()))°, and sets in the \(CompassPoint(azimuth: p.setAzimuth).name).",
            source: .liveData("CelesTrak"),
            visibility: p.isVisible ? .visible("Sunlit against a dark sky.") : .notVisible("In Earth's shadow, or the sky is too bright."),
            related: [.satellite(norad: p.noradID)], isSignificant: p.isVisible && p.maxAltitude > 40
        )
    }
}

/// Decides what to schedule. iOS holds at most 64 pending local notifications, and
/// spamming people is a defect, so this keeps only the most worthwhile ones.
public struct PlannedAlert: Sendable, Hashable, Identifiable {
    public let id: String
    public let title: String
    public let body: String
    public let fireDate: Date
    public let related: ObjectID?

    public init(id: String, title: String, body: String, fireDate: Date, related: ObjectID? = nil) {
        self.id = id
        self.title = title
        self.body = body
        self.fireDate = fireDate
        self.related = related
    }
}

public enum AlertPlanner {
    public static let systemLimit = 64

    /// Alerts for significant, locally visible events at their lead time, soonest
    /// first. Skips anything whose fire time has already passed.
    public static func plan(
        events: [SkyEvent], kinds: Set<SkyEvent.Kind>, leadTime: TimeInterval = 3600, now: Date, limit: Int = 32
    ) -> [PlannedAlert] {
        var seen = Set<String>()
        var out: [PlannedAlert] = []
        for e in events.sorted(by: { $0.date < $1.date }) where kinds.contains(e.kind) && e.isSignificant {
            if case .notVisible = e.visibility { continue }
            let fire = e.date.addingTimeInterval(-leadTime)
            guard fire > now, seen.insert(e.id).inserted else { continue }
            out.append(PlannedAlert(id: "event.\(e.id)", title: e.title, body: e.detail, fireDate: fire, related: e.related.first))
            if out.count == min(limit, systemLimit) { break }
        }
        return out
    }
}

/// Which NASA Black Marble tile holds a coordinate. This imagery shows night-time
/// lights as seen from orbit, a proxy for light pollution and not a Bortle class, and
/// the UI must keep that distinction.
public enum NightLights {
    public static let attribution = "Night lights: NASA Earth Observatory / NOAA, Black Marble"
    public static let maxZoom = 8

    public static func tileURL(z: Int, x: Int, y: Int) -> String {
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/\(z)/\(y)/\(x).png"
    }

    public struct TilePixel: Sendable, Hashable {
        public let x: Int
        public let y: Int
        public let pixelX: Int
        public let pixelY: Int
    }

    /// Web Mercator tile and pixel for a location.
    public static func tile(for location: ObserverLocation, zoom: Int) -> TilePixel {
        let n = pow(2.0, Double(zoom))
        let lat = min(85.05, max(-85.05, location.latitude)) * Angle.degToRad
        let px = (location.longitude + 180) / 360 * n
        let py = (1 - log(tan(lat) + 1 / cos(lat)) / .pi) / 2 * n
        let x = min(Int(n) - 1, Int(px)), y = min(Int(n) - 1, Int(py))
        return TilePixel(x: x, y: y, pixelX: min(255, Int((px - Double(x)) * 256)), pixelY: min(255, Int((py - Double(y)) * 256)))
    }

    /// Compares two relative radiance samples read from the imagery.
    public static func compare(_ a: Double, to b: Double) -> String {
        if abs(a - b) < 0.05 { return "About the same as your location" }
        return a < b ? "Darker than your location" : "Brighter than your location"
    }
}
