import CAstronomyEngine
import Foundation

/// Ephemeris-derived sky phenomena. Every result here comes from a numerical search
/// against the engine's models, so no date in this file is hand-entered.
public enum Phenomena {
    public enum LunarQuarter: Int, Sendable {
        case new = 0, firstQuarter, full, lastQuarter

        public var name: String {
            switch self {
            case .new: "New Moon"
            case .firstQuarter: "First Quarter"
            case .full: "Full Moon"
            case .lastQuarter: "Last Quarter"
            }
        }
    }

    public struct LunarQuarterEvent: Sendable, Hashable {
        public let quarter: LunarQuarter
        public let date: Date
    }

    /// Lunar quarters in order from `start` until `end`.
    public static func lunarQuarters(from start: Date, to end: Date) throws -> [LunarQuarterEvent] {
        var result: [LunarQuarterEvent] = []
        var q = Astronomy_SearchMoonQuarter(AstroTime(start).raw)
        try check(q.status)
        while true {
            let date = AstroTime(raw: q.time).date
            guard date <= end else { break }
            if let quarter = LunarQuarter(rawValue: Int(q.quarter)) {
                result.append(LunarQuarterEvent(quarter: quarter, date: date))
            }
            q = Astronomy_NextMoonQuarter(q)
            try check(q.status)
        }
        return result
    }

    public enum EclipseKind: String, Sendable {
        case penumbral = "Penumbral", partial = "Partial", annular = "Annular", total = "Total"

        init?(_ raw: astro_eclipse_kind_t) {
            switch raw {
            case ECLIPSE_PENUMBRAL: self = .penumbral
            case ECLIPSE_PARTIAL: self = .partial
            case ECLIPSE_ANNULAR: self = .annular
            case ECLIPSE_TOTAL: self = .total
            default: return nil
            }
        }
    }

    public struct LunarEclipse: Sendable, Hashable {
        public let kind: EclipseKind
        public let peak: Date
        /// Fraction of the disc inside the umbra at peak.
        public let obscuration: Double
        public let penumbralSemiDurationMinutes: Double
        public let partialSemiDurationMinutes: Double
        public let totalSemiDurationMinutes: Double
    }

    public static func lunarEclipses(from start: Date, to end: Date) throws -> [LunarEclipse] {
        var result: [LunarEclipse] = []
        var e = Astronomy_SearchLunarEclipse(AstroTime(start).raw)
        try check(e.status)
        while true {
            let peak = AstroTime(raw: e.peak)
            guard peak.date <= end else { break }
            if let kind = EclipseKind(e.kind) {
                result.append(LunarEclipse(
                    kind: kind, peak: peak.date, obscuration: e.obscuration,
                    penumbralSemiDurationMinutes: e.sd_penum,
                    partialSemiDurationMinutes: e.sd_partial,
                    totalSemiDurationMinutes: e.sd_total
                ))
            }
            e = Astronomy_NextLunarEclipse(e.peak)
            try check(e.status)
        }
        return result
    }

    public struct LocalSolarEclipse: Sendable, Hashable {
        public let kind: EclipseKind
        /// Fraction of the Sun's disc covered at peak for this observer.
        public let obscuration: Double
        public let partialBegin: Date
        public let peak: Date
        public let partialEnd: Date
        /// Solar altitude at peak in degrees. Below zero the peak cannot be seen.
        public let peakAltitude: Double
        public let beginAltitude: Double
        public let endAltitude: Double

        /// True if any part of the eclipse happens with the Sun up, which is not the
        /// same as the peak being visible: an eclipse can start before sunset and
        /// peak after it.
        public var isVisible: Bool { max(beginAltitude, peakAltitude, endAltitude) > 0 }
    }

    /// Solar eclipses that are at least partial from this location.
    public static func localSolarEclipses(
        from start: Date, to end: Date, observer: ObserverLocation
    ) throws -> [LocalSolarEclipse] {
        var result: [LocalSolarEclipse] = []
        var e = Astronomy_SearchLocalSolarEclipse(AstroTime(start).raw, observer.raw)
        try check(e.status)
        while true {
            let peak = AstroTime(raw: e.peak.time)
            guard peak.date <= end else { break }
            if let kind = EclipseKind(e.kind) {
                result.append(LocalSolarEclipse(
                    kind: kind, obscuration: e.obscuration,
                    partialBegin: AstroTime(raw: e.partial_begin.time).date,
                    peak: peak.date,
                    partialEnd: AstroTime(raw: e.partial_end.time).date,
                    peakAltitude: e.peak.altitude,
                    beginAltitude: e.partial_begin.altitude,
                    endAltitude: e.partial_end.altitude
                ))
            }
            e = Astronomy_NextLocalSolarEclipse(e.peak.time, observer.raw)
            try check(e.status)
        }
        return result
    }

    public struct GlobalSolarEclipse: Sendable, Hashable {
        public let kind: EclipseKind
        public let peak: Date
        /// Point of greatest eclipse, available for total and annular eclipses.
        public let latitude: Double?
        public let longitude: Double?
    }

    public static func globalSolarEclipses(from start: Date, to end: Date) throws -> [GlobalSolarEclipse] {
        var result: [GlobalSolarEclipse] = []
        var e = Astronomy_SearchGlobalSolarEclipse(AstroTime(start).raw)
        try check(e.status)
        while true {
            let peak = AstroTime(raw: e.peak)
            guard peak.date <= end else { break }
            if let kind = EclipseKind(e.kind) {
                let hasPoint = kind == .total || kind == .annular
                result.append(GlobalSolarEclipse(
                    kind: kind, peak: peak.date,
                    latitude: hasPoint ? e.latitude : nil,
                    longitude: hasPoint ? e.longitude : nil
                ))
            }
            e = Astronomy_NextGlobalSolarEclipse(e.peak)
            try check(e.status)
        }
        return result
    }

    public struct Season: Sendable, Hashable {
        public enum Name: String, Sendable {
            case marchEquinox = "March Equinox", juneSolstice = "June Solstice"
            case septemberEquinox = "September Equinox", decemberSolstice = "December Solstice"
        }

        public let name: Name
        public let date: Date
    }

    public static func seasons(year: Int) throws -> [Season] {
        let s = Astronomy_Seasons(Int32(year))
        try check(s.status)
        return [
            Season(name: .marchEquinox, date: AstroTime(raw: s.mar_equinox).date),
            Season(name: .juneSolstice, date: AstroTime(raw: s.jun_solstice).date),
            Season(name: .septemberEquinox, date: AstroTime(raw: s.sep_equinox).date),
            Season(name: .decemberSolstice, date: AstroTime(raw: s.dec_solstice).date),
        ]
    }

    public struct Opposition: Sendable, Hashable {
        public let body: SolarSystemBody
        public let date: Date
        public let magnitude: Double
        public let distanceAU: Double
    }

    /// Oppositions of a superior planet between two dates.
    public static func oppositions(
        of body: SolarSystemBody, from start: Date, to end: Date
    ) throws -> [Opposition] {
        guard SolarSystemBody.planets.contains(body), !body.isInferior else { return [] }
        var result: [Opposition] = []
        var cursor = AstroTime(start)
        while true {
            // Relative longitude 0 means the planet and Earth share a heliocentric
            // longitude, which is opposition for a superior planet.
            let r = Astronomy_SearchRelativeLongitude(body.raw, 0, cursor.raw)
            try check(r.status)
            let time = AstroTime(raw: r.time)
            guard time.date <= end else { break }
            let appearance = try Ephemeris.appearance(of: body, at: time)
            let g = Astronomy_GeoVector(body.raw, time.raw, ABERRATION)
            result.append(Opposition(
                body: body, date: time.date, magnitude: appearance.magnitude,
                distanceAU: Vec3(g.x, g.y, g.z).length
            ))
            cursor = time.adding(days: 30)
        }
        return result
    }

    public struct GreatestElongation: Sendable, Hashable {
        public let body: SolarSystemBody
        public let date: Date
        public let elongation: Double
        public let isEvening: Bool
    }

    /// Greatest elongations of Mercury or Venus.
    public static func greatestElongations(
        of body: SolarSystemBody, from start: Date, to end: Date
    ) throws -> [GreatestElongation] {
        guard body.isInferior else { return [] }
        var result: [GreatestElongation] = []
        var cursor = AstroTime(start)
        while true {
            let e = Astronomy_SearchMaxElongation(body.raw, cursor.raw)
            try check(e.status)
            let time = AstroTime(raw: e.time)
            guard time.date <= end else { break }
            result.append(GreatestElongation(
                body: body, date: time.date, elongation: e.elongation,
                isEvening: e.visibility == VISIBLE_EVENING
            ))
            cursor = time.adding(days: 5)
        }
        return result
    }

    public struct Conjunction: Sendable, Hashable {
        public let first: SolarSystemBody
        public let second: SolarSystemBody
        public let date: Date
        /// Geocentric separation at closest approach, in degrees.
        public let separation: Double
    }

    /// Local minima of geocentric separation below `threshold` degrees. The scan
    /// steps in hours when the Moon is involved because it moves 13° a day.
    public static func conjunctions(
        of first: SolarSystemBody, and second: SolarSystemBody,
        from start: Date, to end: Date, threshold: Double
    ) throws -> [Conjunction] {
        let separation: (AstroTime) throws -> Double = { t in
            try Ephemeris.geocentricDirection(of: first, at: t)
                .angle(to: Ephemeris.geocentricDirection(of: second, at: t))
        }
        let step = first == .moon || second == .moon ? 0.125 : 1.0
        var result: [Conjunction] = []
        var a = AstroTime(start)
        var b = a.adding(days: step)
        var c = b.adding(days: step)
        let limit = AstroTime(end)
        var sa = try separation(a), sb = try separation(b)
        while c <= limit {
            let sc = try separation(c)
            if sb <= sa && sb <= sc && sb < threshold + 2 {
                let (time, minimum) = try goldenMinimum(a, c, separation)
                if minimum < threshold {
                    result.append(Conjunction(first: first, second: second, date: time.date, separation: minimum))
                }
            }
            a = b; b = c; sa = sb; sb = sc
            c = c.adding(days: step)
        }
        return result
    }

    private static func goldenMinimum(
        _ low: AstroTime, _ high: AstroTime, _ f: (AstroTime) throws -> Double
    ) throws -> (AstroTime, Double) {
        let ratio = 0.618_033_988_75
        var a = low.utDays, b = high.utDays
        var c = b - ratio * (b - a), d = a + ratio * (b - a)
        var fc = try f(AstroTime(utDays: c)), fd = try f(AstroTime(utDays: d))
        // Stops within a minute, which is finer than any display precision used.
        while b - a > 1.0 / 1440 {
            if fc < fd {
                b = d; d = c; fd = fc
                c = b - ratio * (b - a)
                fc = try f(AstroTime(utDays: c))
            } else {
                a = c; c = d; fc = fd
                d = a + ratio * (b - a)
                fd = try f(AstroTime(utDays: d))
            }
        }
        let t = AstroTime(utDays: (a + b) / 2)
        return (t, try f(t))
    }

    /// First instant at or after `start` when the Sun reaches an ecliptic longitude
    /// of date. Meteor shower peaks are defined this way.
    public static func solarLongitudeCrossing(_ longitude: Double, after start: Date, limitDays: Double = 366) throws -> Date? {
        let r = Astronomy_SearchSunLongitude(longitude, AstroTime(start).raw, limitDays)
        guard r.status == ASTRO_SUCCESS else { return nil }
        return AstroTime(raw: r.time).date
    }
}
