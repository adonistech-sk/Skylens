import AstronomyCore
import Foundation

/// Where a satellite appears to an observer.
public struct SatelliteLook: Sendable, Hashable {
    public let horizontal: Horizontal
    public let rangeKm: Double
    /// Height above the ellipsoid.
    public let altitudeKm: Double
    public let isSunlit: Bool
}

/// How far the published elements can still be trusted.
public enum ElementFreshness: Sendable, Hashable {
    /// Under 3 days old.
    case fresh
    /// 3 to 7 days old: usable, but predicted times may slip by a minute or so.
    case aging(days: Int)
    /// Over 7 days old: drag and reboosts make predictions indefensible.
    case stale(days: Int)

    public init(epoch: Date, now: Date) {
        let age = abs(now.timeIntervalSince(epoch)) / 86_400
        switch age {
        case ..<3: self = .fresh
        case ..<7: self = .aging(days: Int(age))
        default: self = .stale(days: Int(age))
        }
    }

    public var canPredict: Bool {
        if case .stale = self { return false }
        return true
    }

    public var warning: String? {
        switch self {
        case .fresh: nil
        case .aging(let d): "Orbit data is \(d) days old, so times may be off by a minute or more."
        case .stale(let d): "Orbit data is \(d) days old. Predictions are switched off until it can be refreshed."
        }
    }
}

public struct SatellitePass: Sendable, Hashable, Identifiable {
    public let noradID: Int
    public let rise: Date
    public let culmination: Date
    public let set: Date
    public let maxAltitude: Double
    public let riseAzimuth: Double
    public let culminationAzimuth: Double
    public let setAzimuth: Double
    /// When the satellite is both sunlit and the observer's sky is dark, which is the
    /// only time it can be seen by eye. Nil means it passes unseen.
    public let visibleInterval: DateInterval?

    public var id: String { "\(noradID)-\(rise.timeIntervalSince1970)" }
    public var isVisible: Bool { visibleInterval != nil }
    public var duration: TimeInterval { self.set.timeIntervalSince(rise) }
}

public struct SatelliteTracker: Sendable {
    public let propagator: SGP4

    public init(_ elements: OrbitalElements) throws {
        propagator = try SGP4(elements)
    }

    public var elements: OrbitalElements { propagator.elements }

    public func freshness(now: Date) -> ElementFreshness {
        ElementFreshness(epoch: elements.epoch, now: now)
    }

    /// Topocentric look angles from a TEME state.
    public func look(at date: Date, from observer: ObserverLocation) throws -> SatelliteLook {
        let state = try propagator.propagate(to: date)
        let gmst = Self.greenwichMeanSiderealRadians(julianDate: AstroTime(date).julianDate)
        let satellite = Self.rotateZ(state.position, -gmst) // TEME → Earth-fixed
        let site = Self.ecef(observer)
        let range = satellite - site

        let lat = observer.latitude * Angle.degToRad
        let lon = observer.longitude * Angle.degToRad
        let sinLat = sin(lat), cosLat = cos(lat), sinLon = sin(lon), cosLon = cos(lon)
        let south = sinLat * cosLon * range.x + sinLat * sinLon * range.y - cosLat * range.z
        let east = -sinLon * range.x + cosLon * range.y
        let up = cosLat * cosLon * range.x + cosLat * sinLon * range.y + sinLat * range.z

        let distance = range.length
        let altitude = asin(max(-1, min(1, up / distance))) * Angle.radToDeg
        let azimuth = Angle.normalize360(atan2(east, -south) * Angle.radToDeg)

        return SatelliteLook(
            horizontal: Horizontal(azimuth: azimuth, altitude: altitude),
            rangeKm: distance,
            altitudeKm: state.position.length - 6371,
            isSunlit: try Self.isSunlit(state.position, at: date)
        )
    }

    /// Passes above `minimumAltitude` in the window. Throws `staleElements` rather
    /// than generate fictional times from outdated orbits.
    public func passes(
        from observer: ObserverLocation, start: Date, days: Double, minimumAltitude: Double = 10, now: Date? = nil
    ) throws -> [SatellitePass] {
        guard freshness(now: now ?? start).canPredict else { throw SatelliteError.staleElements }

        var result: [SatellitePass] = []
        let end = start.addingTimeInterval(days * 86_400)
        let step: TimeInterval = 30
        var t = start
        var previous = try look(at: t, from: observer).horizontal.altitude

        while t < end {
            let next = t.addingTimeInterval(step)
            let altitude = try look(at: next, from: observer).horizontal.altitude
            if previous < minimumAltitude, altitude >= minimumAltitude {
                let rise = try crossing(from: t, to: next, altitude: minimumAltitude, observer: observer)
                // Walk the pass until it sets, tracking the peak on the way.
                var cursor = next
                var peakTime = cursor, peak = altitude
                var last = altitude
                while last >= minimumAltitude, cursor < end.addingTimeInterval(1800) {
                    cursor = cursor.addingTimeInterval(step)
                    last = try look(at: cursor, from: observer).horizontal.altitude
                    if last > peak { peak = last; peakTime = cursor }
                }
                let set = try crossing(from: cursor.addingTimeInterval(-step), to: cursor, altitude: minimumAltitude, observer: observer)
                result.append(try makePass(rise: rise, peak: peakTime, set: set, observer: observer))
                t = cursor
                previous = last
                continue
            }
            previous = altitude
            t = next
        }
        return result
    }

    private func crossing(from a: Date, to b: Date, altitude target: Double, observer: ObserverLocation) throws -> Date {
        var low = a, high = b
        let rising = try look(at: a, from: observer).horizontal.altitude < target
        for _ in 0..<10 {
            let mid = low.addingTimeInterval(high.timeIntervalSince(low) / 2)
            let above = try look(at: mid, from: observer).horizontal.altitude >= target
            if above == rising { high = mid } else { low = mid }
        }
        return low.addingTimeInterval(high.timeIntervalSince(low) / 2)
    }

    private func makePass(rise: Date, peak: Date, set: Date, observer: ObserverLocation) throws -> SatellitePass {
        var low = peak.addingTimeInterval(-30), high = peak.addingTimeInterval(30)
        let f: (Date) throws -> Double = { try look(at: $0, from: observer).horizontal.altitude }
        for _ in 0..<12 {
            let third = high.timeIntervalSince(low) / 3
            let a = low.addingTimeInterval(third), b = high.addingTimeInterval(-third)
            if try f(a) < f(b) { low = a } else { high = b }
        }
        let culmination = low.addingTimeInterval(high.timeIntervalSince(low) / 2)

        // A satellite is visible when sunlit against a sky darker than about −6° Sun.
        var first: Date?, last: Date?
        var t = rise
        while t <= set {
            let sun = try Ephemeris.altitude(of: .sun, at: AstroTime(t), for: observer)
            if sun < -6, try look(at: t, from: observer).isSunlit {
                if first == nil { first = t }
                last = t
            }
            t = t.addingTimeInterval(10)
        }
        return SatellitePass(
            noradID: elements.noradID, rise: rise, culmination: culmination, set: set,
            maxAltitude: try f(culmination),
            riseAzimuth: try look(at: rise, from: observer).horizontal.azimuth,
            culminationAzimuth: try look(at: culmination, from: observer).horizontal.azimuth,
            setAzimuth: try look(at: set, from: observer).horizontal.azimuth,
            visibleInterval: first.flatMap { f in last.map { DateInterval(start: f, end: $0) } }
        )
    }

    // MARK: Geometry

    /// IAU-82 GMST, the sidereal time the TEME frame is defined against.
    static func greenwichMeanSiderealRadians(julianDate jd: Double) -> Double {
        let t = (jd - 2_451_545) / 36_525
        var seconds = -6.2e-6 * t * t * t + 0.093104 * t * t
        seconds += (876_600 * 3600 + 8_640_184.812866) * t + 67_310.54841
        let radians = (seconds * Angle.degToRad / 240).truncatingRemainder(dividingBy: 2 * .pi)
        return radians < 0 ? radians + 2 * .pi : radians
    }

    private static func rotateZ(_ v: Vec3, _ angle: Double) -> Vec3 {
        let c = cos(angle), s = sin(angle)
        return Vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z)
    }

    private static func ecef(_ o: ObserverLocation) -> Vec3 {
        let a = 6378.137, f = 1 / 298.257223563
        let e2 = f * (2 - f)
        let lat = o.latitude * Angle.degToRad, lon = o.longitude * Angle.degToRad
        let n = a / (1 - e2 * sin(lat) * sin(lat)).squareRoot()
        let h = o.elevation / 1000
        return Vec3((n + h) * cos(lat) * cos(lon), (n + h) * cos(lat) * sin(lon), (n * (1 - e2) + h) * sin(lat))
    }

    /// Cylindrical shadow test. Earth's penumbra spans a few seconds of a LEO pass,
    /// which is finer than any visibility claim made from the result.
    static func isSunlit(_ position: Vec3, at date: Date) throws -> Bool {
        let sun = try Ephemeris.geocentricDirection(of: .sun, at: AstroTime(date))
        let along = position.dot(sun)
        guard along < 0 else { return true }
        let perpendicular = (position - sun * along).length
        return perpendicular > 6371
    }
}

/// Parses the JSON OMM format that CelesTrak serves.
public enum OMMParser {
    private struct Row: Decodable {
        let OBJECT_NAME: String
        let NORAD_CAT_ID: Int
        let EPOCH: String
        let MEAN_MOTION: Double
        let ECCENTRICITY: Double
        let INCLINATION: Double
        let RA_OF_ASC_NODE: Double
        let ARG_OF_PERICENTER: Double
        let MEAN_ANOMALY: Double
        let BSTAR: Double
    }

    public static func parse(_ data: Data) throws -> [OrbitalElements] {
        let rows: [Row]
        do {
            rows = try JSONDecoder().decode([Row].self, from: data)
        } catch {
            throw SatelliteError.malformedElements
        }
        return try rows.map { r in
            guard let epoch = parseEpoch(r.EPOCH) else { throw SatelliteError.malformedElements }
            return OrbitalElements(
                name: r.OBJECT_NAME, noradID: r.NORAD_CAT_ID, epoch: epoch, meanMotion: r.MEAN_MOTION,
                eccentricity: r.ECCENTRICITY, inclination: r.INCLINATION,
                rightAscensionOfNode: r.RA_OF_ASC_NODE, argumentOfPerigee: r.ARG_OF_PERICENTER,
                meanAnomaly: r.MEAN_ANOMALY, bstar: r.BSTAR
            )
        }
    }

    /// CelesTrak epochs carry six fractional digits and no zone, and are UTC. The
    /// fraction matters: at 7.7 km/s, half a second is nearly 4 km along track.
    static func parseEpoch(_ s: String) -> Date? {
        let parts = s.split(separator: ".", maxSplits: 1)
        guard let head = parts.first else { return nil }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        guard let whole = f.date(from: String(head)) else { return nil }
        if parts.count == 2, let fraction = Double("0.\(parts[1])") {
            return whole.addingTimeInterval(fraction)
        }
        return whole
    }

    /// The CelesTrak endpoint for the brightest satellites. Refresh no more often
    /// than `minimumRefreshInterval`, as CelesTrak asks.
    public static let brightestSatellitesURL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json"
    public static let minimumRefreshInterval: TimeInterval = 2 * 3600
}
