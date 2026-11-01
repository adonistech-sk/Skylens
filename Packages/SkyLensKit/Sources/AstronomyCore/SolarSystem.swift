import CAstronomyEngine
import Foundation

public enum SolarSystemBody: String, Sendable, CaseIterable, Codable, Hashable {
    case sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune

    public static let planets: [SolarSystemBody] = [.mercury, .venus, .mars, .jupiter, .saturn, .uranus, .neptune]

    public var name: String { rawValue.capitalized }

    var raw: astro_body_t {
        switch self {
        case .sun: BODY_SUN
        case .moon: BODY_MOON
        case .mercury: BODY_MERCURY
        case .venus: BODY_VENUS
        case .mars: BODY_MARS
        case .jupiter: BODY_JUPITER
        case .saturn: BODY_SATURN
        case .uranus: BODY_URANUS
        case .neptune: BODY_NEPTUNE
        }
    }

    /// Mean equatorial radius in kilometres (IAU WGCCRE values).
    public var radiusKm: Double {
        switch self {
        case .sun: 695_700
        case .moon: 1_737.4
        case .mercury: 2_440.5
        case .venus: 6_051.8
        case .mars: 3_396.2
        case .jupiter: 71_492
        case .saturn: 60_268
        case .uranus: 25_559
        case .neptune: 24_764
        }
    }

    /// True for the two planets that orbit inside Earth's, which never reach
    /// opposition and are best at greatest elongation.
    public var isInferior: Bool { self == .mercury || self == .venus }
}

public let kilometresPerAU = 149_597_870.7

/// A position for one observer and instant. Geometric and apparent values are kept
/// apart so callers must choose: refraction only exists on the `apparent` path.
public struct TopocentricPosition: Sendable, Hashable {
    /// Topocentric astrometric direction in the J2000 frame, corrected for light
    /// time and aberration. Use it to place a body among catalog stars.
    public let j2000: Equatorial
    /// Topocentric direction on the true equator and equinox of date.
    public let ofDate: Equatorial
    /// Airless local direction.
    public let geometric: Horizontal
    /// Local direction including standard atmospheric refraction.
    public let apparent: Horizontal
    /// Distance from the observer in astronomical units.
    public let distanceAU: Double

    public var distanceKm: Double { distanceAU * kilometresPerAU }
    public var isAboveHorizon: Bool { apparent.altitude > 0 }
}

/// Everything that depends on a body's illumination at one instant.
public struct BodyAppearance: Sendable, Hashable {
    /// Apparent visual magnitude, which Astronomy Engine models per body.
    public let magnitude: Double
    /// Sun–body–Earth angle in degrees.
    public let phaseAngle: Double
    /// Illuminated fraction of the disc, 0...1.
    public let illuminatedFraction: Double
    /// Distance from the Sun in AU.
    public let heliocentricDistanceAU: Double
    /// Saturn's ring tilt in degrees as seen from Earth, 0 for other bodies.
    public let ringTilt: Double
    /// Angular diameter in degrees at the given distance.
    public let angularDiameter: Double
}

public enum Ephemeris {
    /// Topocentric position of a body.
    public static func position(
        of body: SolarSystemBody, at time: AstroTime, for observer: ObserverLocation
    ) throws -> TopocentricPosition {
        var t = time.raw
        let o = observer.raw
        let j = Astronomy_Equator(body.raw, &t, o, EQUATOR_J2000, ABERRATION)
        try check(j.status)
        let d = Astronomy_Equator(body.raw, &t, o, EQUATOR_OF_DATE, ABERRATION)
        try check(d.status)
        let geometric = Astronomy_Horizon(&t, o, d.ra, d.dec, REFRACTION_NONE)
        let apparent = Astronomy_Horizon(&t, o, d.ra, d.dec, REFRACTION_NORMAL)
        return TopocentricPosition(
            j2000: Equatorial(rightAscension: j.ra, declination: j.dec),
            ofDate: Equatorial(rightAscension: d.ra, declination: d.dec),
            geometric: Horizontal(azimuth: geometric.azimuth, altitude: geometric.altitude),
            apparent: Horizontal(azimuth: apparent.azimuth, altitude: apparent.altitude),
            distanceAU: j.dist
        )
    }

    /// Altitude only, for scans that evaluate many instants.
    public static func altitude(
        of body: SolarSystemBody, at time: AstroTime, for observer: ObserverLocation
    ) throws -> Double {
        var t = time.raw
        let o = observer.raw
        let d = Astronomy_Equator(body.raw, &t, o, EQUATOR_OF_DATE, ABERRATION)
        try check(d.status)
        return Astronomy_Horizon(&t, o, d.ra, d.dec, REFRACTION_NORMAL).altitude
    }

    /// Geocentric direction in the J2000 frame, used for event searches that are
    /// defined independently of the observer.
    public static func geocentricDirection(of body: SolarSystemBody, at time: AstroTime) throws -> Vec3 {
        let v = Astronomy_GeoVector(body.raw, time.raw, ABERRATION)
        try check(v.status)
        return Vec3(v.x, v.y, v.z).normalized
    }

    /// Geocentric ecliptic longitude of date of the Sun, in degrees.
    public static func solarLongitude(at time: AstroTime) throws -> Double {
        let s = Astronomy_SunPosition(time.raw)
        try check(s.status)
        return s.elon
    }

    /// Heliocentric position in AU in the J2000 equatorial frame.
    public static func heliocentricVector(of body: SolarSystemBody, at time: AstroTime) throws -> Vec3 {
        let v = Astronomy_HelioVector(body.raw, time.raw)
        try check(v.status)
        return Vec3(v.x, v.y, v.z)
    }

    public static func appearance(of body: SolarSystemBody, at time: AstroTime) throws -> BodyAppearance {
        let i = Astronomy_Illumination(body.raw, time.raw)
        try check(i.status)
        // Geocentric distance suffices here. The Moon's topocentric diameter
        // differs by about 1.5%, too little to matter for display.
        let g = Astronomy_GeoVector(body.raw, time.raw, ABERRATION)
        try check(g.status)
        let distanceKm = Vec3(g.x, g.y, g.z).length * kilometresPerAU
        let diameter = 2 * asin(min(1, body.radiusKm / distanceKm)) * Angle.radToDeg
        return BodyAppearance(
            magnitude: i.mag,
            phaseAngle: i.phase_angle,
            illuminatedFraction: i.phase_fraction,
            heliocentricDistanceAU: i.helio_dist,
            ringTilt: i.ring_tilt,
            angularDiameter: diameter
        )
    }

    /// The IAU constellation containing a J2000 direction.
    public static func constellationAbbreviation(of position: Equatorial) -> String? {
        EngineLock.shared.withLock {
            let c = Astronomy_Constellation(position.rightAscension, position.declination)
            guard c.status == ASTRO_SUCCESS, let symbol = c.symbol else { return nil }
            return String(cString: symbol)
        }
    }
}

/// Lunar phase by the geocentric ecliptic-longitude difference from the Sun.
public struct MoonPhase: Sendable, Hashable {
    public enum Name: String, Sendable, CaseIterable {
        case newMoon = "New Moon"
        case waxingCrescent = "Waxing Crescent"
        case firstQuarter = "First Quarter"
        case waxingGibbous = "Waxing Gibbous"
        case fullMoon = "Full Moon"
        case waningGibbous = "Waning Gibbous"
        case lastQuarter = "Last Quarter"
        case waningCrescent = "Waning Crescent"
    }

    /// 0° new, 90° first quarter, 180° full, 270° last quarter.
    public let phaseAngle: Double
    public let illuminatedFraction: Double

    /// The principal phases are instants, so the names cover a ±6° band (about
    /// half a day) around them and the remainder is crescent or gibbous.
    public var name: Name {
        switch phaseAngle {
        case ..<6, 354...: .newMoon
        case ..<84: .waxingCrescent
        case ..<96: .firstQuarter
        case ..<174: .waxingGibbous
        case ..<186: .fullMoon
        case ..<264: .waningGibbous
        case ..<276: .lastQuarter
        default: .waningCrescent
        }
    }

    public var isWaxing: Bool { phaseAngle < 180 }

    /// Days since the most recent new moon, by mean synodic motion.
    public var approximateAgeDays: Double { phaseAngle / 360 * 29.530_588 }

    public init(phaseAngle: Double, illuminatedFraction: Double) {
        self.phaseAngle = phaseAngle
        self.illuminatedFraction = illuminatedFraction
    }

    public static func at(_ time: AstroTime) throws -> MoonPhase {
        let p = Astronomy_MoonPhase(time.raw)
        try check(p.status)
        let i = Astronomy_Illumination(BODY_MOON, time.raw)
        try check(i.status)
        return MoonPhase(phaseAngle: p.angle, illuminatedFraction: i.phase_fraction)
    }
}
