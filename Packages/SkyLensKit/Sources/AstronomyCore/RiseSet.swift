import CAstronomyEngine
import Foundation

/// Anything that rises and sets: a solar-system body, or a fixed J2000 point such
/// as a star or deep-sky object.
public enum SkyTarget: Sendable, Hashable {
    case body(SolarSystemBody)
    case fixed(Equatorial)
}

public struct RiseTransitSet: Sendable, Hashable {
    public enum Circumstance: Sendable, Hashable {
        /// Crosses the horizon during the window.
        case normal
        /// Stays above the horizon for the whole window.
        case alwaysUp
        /// Stays below the horizon for the whole window.
        case alwaysDown
    }

    public let rise: Date?
    public let transit: Date?
    public let set: Date?
    /// Altitude at transit in degrees, including refraction.
    public let transitAltitude: Double?
    public let circumstance: Circumstance
}

public enum RiseSet {
    /// Rise, transit and set in the 24 hours from `start`. Rise and set use the
    /// standard 34′ horizon refraction and the upper limb for the Sun and Moon.
    public static func events(
        for target: SkyTarget, after start: Date, observer: ObserverLocation
    ) throws -> RiseTransitSet {
        try withEngineBody(target) { body in
            let o = observer.raw
            let t = AstroTime(start).raw
            let rise = Astronomy_SearchRiseSetEx(body, o, DIRECTION_RISE, t, 1, 0)
            let set = Astronomy_SearchRiseSetEx(body, o, DIRECTION_SET, t, 1, 0)
            let transit = Astronomy_SearchHourAngleEx(body, o, 0, t, +1)
            let antitransit = Astronomy_SearchHourAngleEx(body, o, 12, t, +1)
            let riseOK = rise.status == ASTRO_SUCCESS
            let setOK = set.status == ASTRO_SUCCESS

            let circumstance: RiseTransitSet.Circumstance
            if riseOK || setOK {
                circumstance = .normal
            } else {
                // No crossing in the window, so transit and antitransit bracket
                // the altitude range and decide which case applies.
                let lowest = antitransit.status == ASTRO_SUCCESS ? antitransit.hor.altitude : -90
                let highest = transit.status == ASTRO_SUCCESS ? transit.hor.altitude : 90
                circumstance = lowest > 0 || highest > 0 ? .alwaysUp : .alwaysDown
            }

            let transitInWindow = transit.status == ASTRO_SUCCESS
                && transit.time.ut - t.ut <= 1
            return RiseTransitSet(
                rise: riseOK ? AstroTime(raw: rise.time).date : nil,
                transit: transitInWindow ? AstroTime(raw: transit.time).date : nil,
                set: setOK ? AstroTime(raw: set.time).date : nil,
                transitAltitude: transitInWindow ? transit.hor.altitude : nil,
                circumstance: circumstance
            )
        }
    }

    /// The next rise after `start`, searching up to `limitDays` ahead.
    public static func nextRise(
        of target: SkyTarget, after start: Date, observer: ObserverLocation, limitDays: Double = 366
    ) throws -> Date? {
        try withEngineBody(target) { body in
            let r = Astronomy_SearchRiseSetEx(body, observer.raw, DIRECTION_RISE, AstroTime(start).raw, limitDays, 0)
            return r.status == ASTRO_SUCCESS ? AstroTime(raw: r.time).date : nil
        }
    }

    /// The next time the Sun's centre crosses a twilight limit, rising or setting.
    public static func twilightCrossing(
        _ twilight: Twilight, rising: Bool, after start: Date, observer: ObserverLocation, limitDays: Double = 1
    ) -> Date? {
        let r = Astronomy_SearchAltitude(
            BODY_SUN, observer.raw, rising ? DIRECTION_RISE : DIRECTION_SET,
            AstroTime(start).raw, limitDays, twilight.rawValue
        )
        return r.status == ASTRO_SUCCESS ? AstroTime(raw: r.time).date : nil
    }

    /// Geometric altitude of a fixed J2000 point at one instant.
    public static func altitude(of position: Equatorial, frame: SkyFrame) -> Double {
        Horizontal(unitVector: frame.j2000ToHorizon * position.unitVector).altitude
    }

    /// Minimum and maximum geometric altitude a declination can reach at a
    /// latitude, ignoring refraction. Used to explain "never rises from here".
    public static func altitudeRange(declination: Double, latitude: Double) -> ClosedRange<Double> {
        let upper = 90 - abs(latitude - declination)
        let lower = -(90 - abs(latitude + declination))
        return min(lower, upper)...max(lower, upper)
    }

    private static func withEngineBody<T>(
        _ target: SkyTarget, _ work: (astro_body_t) throws -> T
    ) throws -> T {
        switch target {
        case .body(let body):
            return try work(body.raw)
        case .fixed(let position):
            // The engine has one global table of user stars, so definition and
            // use must happen atomically. The distance only feeds aberration
            // and parallax, which are negligible at 1000 ly.
            return try EngineLock.shared.withLock {
                try check(Astronomy_DefineStar(BODY_STAR1, position.rightAscension, position.declination, 1000))
                return try work(BODY_STAR1)
            }
        }
    }
}

/// The solar depression angles that define each twilight.
public enum Twilight: Double, Sendable, CaseIterable {
    case civil = -6
    case nautical = -12
    case astronomical = -18
}

/// The dark period that begins on the evening of a given local date.
public struct NightWindow: Sendable, Hashable {
    public enum SolarCondition: Sendable, Hashable {
        /// The Sun sets and rises, and full astronomical darkness is reached.
        case normal
        /// The Sun sets but the sky never gets astronomically dark.
        case noAstronomicalDarkness
        /// The Sun stays up, as in a polar summer.
        case polarDay
        /// The Sun stays down, as in a polar winter.
        case polarNight
    }

    public let sunset: Date?
    public let civilDusk: Date?
    public let nauticalDusk: Date?
    public let astronomicalDusk: Date?
    public let astronomicalDawn: Date?
    public let nauticalDawn: Date?
    public let civilDawn: Date?
    public let sunrise: Date?
    public let condition: SolarCondition

    /// The longest continuous dark interval tonight, preferring true darkness and
    /// falling back to the brightest twilight limit available.
    public var darkInterval: DateInterval? {
        if let s = astronomicalDusk, let e = astronomicalDawn, s < e { return DateInterval(start: s, end: e) }
        if let s = nauticalDusk, let e = nauticalDawn, s < e { return DateInterval(start: s, end: e) }
        if let s = civilDusk, let e = civilDawn, s < e { return DateInterval(start: s, end: e) }
        if let s = sunset, let e = sunrise, s < e { return DateInterval(start: s, end: e) }
        return nil
    }

    /// Calculates the night following local noon of the day containing `date`.
    public static func compute(
        containing date: Date, observer: ObserverLocation, timeZone: TimeZone
    ) throws -> NightWindow {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let midnight = calendar.startOfDay(for: date)
        // Before 04:00 local the user still means the night that began yesterday.
        let anchor = date < midnight.addingTimeInterval(4 * 3600) ? midnight.addingTimeInterval(-12 * 3600) : midnight.addingTimeInterval(12 * 3600)
        return try compute(fromNoon: anchor, observer: observer)
    }

    /// Searches forward from a local noon for a window of just over a day.
    public static func compute(fromNoon noon: Date, observer: ObserverLocation) throws -> NightWindow {
        let start = AstroTime(noon).raw
        let o = observer.raw

        func riseSet(_ direction: astro_direction_t, from t: astro_time_t) -> Date? {
            let r = Astronomy_SearchRiseSetEx(BODY_SUN, o, direction, t, 1.1, 0)
            return r.status == ASTRO_SUCCESS ? AstroTime(raw: r.time).date : nil
        }

        let sunset = riseSet(DIRECTION_SET, from: start)
        let dusk: (Twilight) -> Date? = {
            RiseSet.twilightCrossing($0, rising: false, after: noon, observer: observer, limitDays: 1.1)
        }
        // A dawn only counts if it follows this evening's darkening, otherwise a
        // polar twilight could pair a dawn with a dusk from the following day.
        let dawnSearchStart = sunset ?? noon
        let dawn: (Twilight) -> Date? = {
            RiseSet.twilightCrossing($0, rising: true, after: dawnSearchStart, observer: observer, limitDays: 1.1)
        }

        let sunrise = riseSet(DIRECTION_RISE, from: AstroTime(dawnSearchStart).raw)
        let astroDusk = dusk(.astronomical)
        let astroDawn = dawn(.astronomical)

        let condition: SolarCondition
        if sunset == nil && sunrise == nil {
            let noonAltitude = try Ephemeris.altitude(of: .sun, at: AstroTime(noon), for: observer)
            condition = noonAltitude > 0 ? .polarDay : .polarNight
        } else if astroDusk == nil || astroDawn == nil {
            condition = .noAstronomicalDarkness
        } else {
            condition = .normal
        }

        return NightWindow(
            sunset: sunset,
            civilDusk: dusk(.civil),
            nauticalDusk: dusk(.nautical),
            astronomicalDusk: astroDusk,
            astronomicalDawn: astroDawn,
            nauticalDawn: dawn(.nautical),
            civilDawn: dawn(.civil),
            sunrise: sunrise,
            condition: condition
        )
    }
}
