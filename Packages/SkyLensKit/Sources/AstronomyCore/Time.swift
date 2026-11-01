import CAstronomyEngine
import Foundation

/// Selects JPL's ΔT model before the first time value is created. The engine's
/// default extrapolates ΔT to 441 s by 2199 and gives 75.6 s for 2026, whereas the
/// measured value is near 69 s. JPL's model holds ΔT flat past the present, which
/// keeps the Moon within 25″ of Horizons from 1805 to 2199. The future value of ΔT
/// is unknowable, so far-future Moon and rise times carry that uncertainty.
private let configuredEngine: Void = {
    Astronomy_SetDeltaTFunction(Astronomy_DeltaT_JplHorizons)
}()

/// An instant on the UT1-like scale Astronomy Engine works in, stored as days
/// since 2000-01-01 12:00 UT. The difference from UTC never exceeds a second.
public struct AstroTime: Sendable, Hashable, Comparable {
    public let utDays: Double

    /// The range over which SkyLens presents calculated positions, matching the span
    /// its tests validate against JPL Horizons. Astronomy Engine states ±1′ accuracy,
    /// and the Time Travel controls refuse dates beyond this window rather than show
    /// extrapolated positions as trustworthy.
    public static let supportedYears: ClosedRange<Int> = 1800...2199

    public init(utDays: Double) { self.utDays = utDays }

    public init(_ date: Date) {
        utDays = date.timeIntervalSince1970 / 86_400 - 10_957.5
    }

    public var date: Date {
        Date(timeIntervalSince1970: (utDays + 10_957.5) * 86_400)
    }

    public var julianDate: Double { utDays + 2_451_545.0 }

    /// Julian centuries of Terrestrial Time since J2000.
    public var julianCenturiesTT: Double { raw.tt / 36_525 }

    public func adding(days: Double) -> AstroTime { AstroTime(utDays: utDays + days) }
    public func adding(hours: Double) -> AstroTime { adding(days: hours / 24) }

    /// Greenwich apparent sidereal time in hours, 0 ≤ h < 24.
    public var greenwichSiderealHours: Double {
        var t = raw
        return Astronomy_SiderealTime(&t)
    }

    /// Local apparent sidereal time in hours for a longitude in degrees east.
    public func localSiderealHours(longitude: Double) -> Double {
        let h = (greenwichSiderealHours + longitude / 15).truncatingRemainder(dividingBy: 24)
        return h < 0 ? h + 24 : h
    }

    /// Whether a date lies inside `supportedYears`.
    public static func isSupported(_ date: Date) -> Bool {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return supportedYears.contains(calendar.component(.year, from: date))
    }

    public static func < (a: AstroTime, b: AstroTime) -> Bool { a.utDays < b.utDays }

    /// Every C entry point needs the full struct, so it is created on demand.
    var raw: astro_time_t {
        _ = configuredEngine
        return Astronomy_TimeFromDays(utDays)
    }

    init(raw: astro_time_t) { utDays = raw.ut }
}

/// A geographic position on the WGS-84 ellipsoid.
public struct ObserverLocation: Sendable, Hashable, Codable {
    /// Degrees north, −90...90.
    public var latitude: Double
    /// Degrees east, −180...180.
    public var longitude: Double
    /// Metres above sea level.
    public var elevation: Double

    public init(latitude: Double, longitude: Double, elevation: Double = 0) {
        self.latitude = min(90, max(-90, latitude))
        self.longitude = Angle.normalize180(longitude)
        self.elevation = elevation
    }

    var raw: astro_observer_t {
        Astronomy_MakeObserver(latitude, longitude, elevation)
    }
}

/// Failures reported by the underlying engine, which are never papered over with
/// fabricated values.
public enum AstronomyError: Error, Sendable, Equatable {
    case engine(code: Int)
    case outOfSupportedRange

    init(_ status: astro_status_t) {
        self = .engine(code: Int(status.rawValue))
    }
}

func check(_ status: astro_status_t) throws {
    if status != ASTRO_SUCCESS { throw AstronomyError(status) }
}

/// Serialises engine calls that touch process-wide state: the user-defined star
/// table and the lazy constellation tables. Pure position calls never take it.
final class EngineLock: @unchecked Sendable {
    static let shared = EngineLock()
    private let lock = NSLock()

    func withLock<T>(_ body: () throws -> T) rethrows -> T {
        lock.lock()
        defer { lock.unlock() }
        return try body()
    }
}
