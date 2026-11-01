import CAstronomyEngine
import Foundation

/// Equatorial coordinates. The reference frame is carried by the context in which
/// a value appears, as documented on each property that exposes one.
public struct Equatorial: Sendable, Hashable, Codable {
    /// Right ascension in sidereal hours, 0 ≤ ra < 24.
    public var rightAscension: Double
    /// Declination in degrees.
    public var declination: Double

    public init(rightAscension: Double, declination: Double) {
        self.rightAscension = rightAscension
        self.declination = declination
    }

    public var rightAscensionDegrees: Double { rightAscension * 15 }

    /// Unit vector in the matching Cartesian frame.
    public var unitVector: Vec3 {
        let a = rightAscension * 15 * Angle.degToRad
        let d = declination * Angle.degToRad
        return Vec3(cos(d) * cos(a), cos(d) * sin(a), sin(d))
    }

    public init(unitVector v: Vec3) {
        let n = v.normalized
        var hours = atan2(n.y, n.x) * Angle.radToDeg / 15
        if hours < 0 { hours += 24 }
        self.init(rightAscension: hours, declination: asin(max(-1, min(1, n.z))) * Angle.radToDeg)
    }
}

/// Horizontal coordinates for an observer.
public struct Horizontal: Sendable, Hashable, Codable {
    /// Degrees clockwise from true north: 0 N, 90 E, 180 S, 270 W.
    public var azimuth: Double
    /// Degrees above the horizon, negative below it.
    public var altitude: Double

    public init(azimuth: Double, altitude: Double) {
        self.azimuth = azimuth
        self.altitude = altitude
    }

    /// Unit vector in the horizon frame: +x north, +y west, +z zenith. Note that
    /// azimuth runs toward +east, which is −y. This frame matches Core Motion's
    /// `xTrueNorthZVertical` reference.
    public var unitVector: Vec3 {
        let a = azimuth * Angle.degToRad
        let h = altitude * Angle.degToRad
        return Vec3(cos(h) * cos(a), -cos(h) * sin(a), sin(h))
    }

    public init(unitVector v: Vec3) {
        let n = v.normalized
        self.init(
            azimuth: Angle.normalize360(atan2(-n.y, n.x) * Angle.radToDeg),
            altitude: asin(max(-1, min(1, n.z))) * Angle.radToDeg
        )
    }

    /// The eight-point compass name of the azimuth.
    public var compassPoint: CompassPoint {
        CompassPoint(azimuth: azimuth)
    }
}

public enum CompassPoint: String, Sendable, CaseIterable, Codable {
    case north = "N", northEast = "NE", east = "E", southEast = "SE"
    case south = "S", southWest = "SW", west = "W", northWest = "NW"

    public init(azimuth: Double) {
        let index = Int((Angle.normalize360(azimuth) + 22.5) / 45) % 8
        self = Self.allCases[index]
    }

    public var name: String {
        switch self {
        case .north: "north"
        case .northEast: "northeast"
        case .east: "east"
        case .southEast: "southeast"
        case .south: "south"
        case .southWest: "southwest"
        case .west: "west"
        case .northWest: "northwest"
        }
    }
}

/// Rotation from the J2000 equatorial frame to an observer's horizon frame for one
/// instant. It includes precession, nutation and Earth rotation, so applying it to
/// a J2000 catalog direction yields the geometric local direction. This is the one
/// matrix the renderer needs per frame.
public struct SkyFrame: Sendable, Hashable {
    public let time: AstroTime
    public let observer: ObserverLocation
    /// Horizon frame direction = `j2000ToHorizon` × J2000 direction.
    public let j2000ToHorizon: Mat3

    public init(time: AstroTime, observer: ObserverLocation) {
        self.time = time
        self.observer = observer
        var t = time.raw
        let rotation = Astronomy_Rotation_EQJ_HOR(&t, observer.raw)
        j2000ToHorizon = Mat3(engineRotation: rotation)
    }

    public func horizontal(j2000 direction: Vec3) -> Horizontal {
        Horizontal(unitVector: j2000ToHorizon * direction)
    }

    public func j2000(horizontal direction: Vec3) -> Vec3 {
        j2000ToHorizon.transposed * direction
    }
}

extension Mat3 {
    /// The engine stores `rot[column][row]`, the transpose of this type's layout.
    init(engineRotation r: astro_rotation_t) {
        let m = r.rot
        self.init(
            Vec3(m.0.0, m.1.0, m.2.0),
            Vec3(m.0.1, m.1.1, m.2.1),
            Vec3(m.0.2, m.1.2, m.2.2)
        )
    }
}

/// Saemundsson refraction, the model used by the engine, so stars and planets
/// shift identically near the horizon.
public enum Atmosphere {
    /// Refraction in degrees to add to a geometric altitude.
    public static func refraction(geometricAltitude altitude: Double) -> Double {
        Astronomy_Refraction(REFRACTION_NORMAL, altitude)
    }

    public static func apparentAltitude(geometric altitude: Double) -> Double {
        altitude + refraction(geometricAltitude: altitude)
    }

    /// Applied to a horizon-frame direction by lifting it toward the zenith.
    public static func refracted(_ direction: Vec3) -> Vec3 {
        let h = Horizontal(unitVector: direction)
        return Horizontal(azimuth: h.azimuth, altitude: apparentAltitude(geometric: h.altitude)).unitVector
    }

    /// Air mass by Kasten & Young (1989), valid to the horizon. Returns nil once
    /// the object is below it.
    public static func airMass(altitude: Double) -> Double? {
        guard altitude > 0 else { return nil }
        let z = 90 - altitude
        return 1 / (cos(z * Angle.degToRad) + 0.50572 * pow(96.07995 - z, -1.6364))
    }
}

/// Angular separation helpers for callers that hold equatorial coordinates.
public func angularSeparation(_ a: Equatorial, _ b: Equatorial) -> Double {
    a.unitVector.angle(to: b.unitVector)
}
