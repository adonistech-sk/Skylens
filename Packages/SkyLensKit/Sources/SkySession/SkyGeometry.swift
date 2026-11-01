import AstronomyCore
import Foundation
import SkyCatalog

/// A great-circle line segment between two unit vectors.
public struct SkySegment: Sendable, Hashable {
    public let a: Vec3
    public let b: Vec3

    public init(a: Vec3, b: Vec3) {
        self.a = a
        self.b = b
    }
}

/// Builds line geometry for the renderer. Long segments are subdivided because the
/// shader projects only the endpoints, and a straight chord would visibly leave the
/// great circle at a wide field of view.
public enum SkyGeometry {
    public static func subdivide(_ a: Vec3, _ b: Vec3, maxDegrees: Double = 3) -> [SkySegment] {
        let angle = a.angle(to: b)
        let steps = max(1, Int((angle / maxDegrees).rounded(.up)))
        guard steps > 1 else { return [SkySegment(a: a, b: b)] }
        var out: [SkySegment] = []
        out.reserveCapacity(steps)
        var previous = a
        for i in 1...steps {
            let t = Double(i) / Double(steps)
            // Normalised lerp is a close enough great-circle arc for short steps.
            let next = i == steps ? b : (a * (1 - t) + b * t).normalized
            out.append(SkySegment(a: previous, b: next))
            previous = next
        }
        return out
    }

    /// Constellation figures in the J2000 frame.
    public static func constellationLines(_ catalog: Catalog) -> [SkySegment] {
        var out: [SkySegment] = []
        let stars = catalog.stars
        for c in catalog.constellations {
            for strip in c.lines {
                let directions = strip.compactMap { hip in stars.index(hip: hip).map { stars.direction(at: $0) } }
                for (a, b) in zip(directions, directions.dropFirst()) {
                    out += subdivide(a, b, maxDegrees: 6)
                }
            }
        }
        return out
    }

    /// IAU boundaries in the J2000 frame.
    public static func constellationBoundaries(_ catalog: Catalog) -> [SkySegment] {
        var out: [SkySegment] = []
        for c in catalog.constellations {
            for ring in c.boundaries {
                let directions = ring.map(\.unitVector)
                for (a, b) in zip(directions, directions.dropFirst()) {
                    out += subdivide(a, b)
                }
            }
        }
        return out
    }

    /// Altitude rings and azimuth meridians in the horizon frame.
    public static func horizonGrid() -> [SkySegment] {
        var out: [SkySegment] = []
        for altitude in stride(from: -60.0, through: 60, by: 30) where altitude != 0 {
            out += ring { Horizontal(azimuth: $0, altitude: altitude).unitVector }
        }
        for azimuth in stride(from: 0.0, to: 360, by: 30) {
            for altitude in stride(from: -80.0, to: 80, by: 5) {
                out.append(SkySegment(
                    a: Horizontal(azimuth: azimuth, altitude: altitude).unitVector,
                    b: Horizontal(azimuth: azimuth, altitude: altitude + 5).unitVector
                ))
            }
        }
        return out
    }

    public static func horizonLine() -> [SkySegment] {
        ring { Horizontal(azimuth: $0, altitude: 0).unitVector }
    }

    /// Declination rings, hour circles and the ecliptic in the J2000 frame.
    public static func equatorialGrid() -> [SkySegment] {
        var out: [SkySegment] = []
        for declination in stride(from: -60.0, through: 60, by: 30) {
            out += ring { Equatorial(rightAscension: $0 / 15, declination: declination).unitVector }
        }
        for hour in stride(from: 0.0, to: 24, by: 2) {
            for declination in stride(from: -80.0, to: 80, by: 5) {
                out.append(SkySegment(
                    a: Equatorial(rightAscension: hour, declination: declination).unitVector,
                    b: Equatorial(rightAscension: hour, declination: declination + 5).unitVector
                ))
            }
        }
        return out
    }

    private static func ring(_ point: (Double) -> Vec3) -> [SkySegment] {
        stride(from: 0.0, to: 360, by: 3).map { SkySegment(a: point($0), b: point($0 + 3)) }
    }

    /// Flattens segments into six vertices each, as two triangles, in the layout the
    /// line shader reads: this end, other end, side.
    public static func vertexData(_ segments: [SkySegment]) -> [Float] {
        var out: [Float] = []
        out.reserveCapacity(segments.count * 6 * 7)
        func emit(_ p: Vec3, _ q: Vec3, _ side: Float) {
            out += [Float(p.x), Float(p.y), Float(p.z), Float(q.x), Float(q.y), Float(q.z), side]
        }
        for s in segments {
            emit(s.a, s.b, -1)
            emit(s.a, s.b, 1)
            emit(s.b, s.a, 1)
            emit(s.a, s.b, 1)
            emit(s.b, s.a, 1)
            emit(s.b, s.a, -1)
        }
        return out
    }
}

/// One label the sky can show.
public struct SkyLabel: Sendable, Hashable, Identifiable {
    public enum Style: Int32, Sendable {
        case star = 0, planet, constellation, deepSky, compass
    }

    public let id: String
    public let text: String
    public let style: Style
    /// J2000 direction, or nil when it moves and the renderer supplies it each frame.
    public let direction: Vec3?
    /// Lower is more important.
    public let priority: Double
    /// Hidden at wider fields of view than this, in degrees.
    public let maxFieldOfView: Double
}

public enum SkyLabels {
    /// Every label that can appear, in order of importance.
    public static func all(_ catalog: Catalog) -> [SkyLabel] {
        var out: [SkyLabel] = []
        for body in SolarSystemBody.allCases {
            out.append(SkyLabel(id: ObjectID.body(body).rawValue, text: body.name, style: .planet, direction: nil, priority: 0, maxFieldOfView: 180))
        }
        for c in catalog.constellations {
            out.append(SkyLabel(id: ObjectID.constellation(c.id).rawValue, text: c.name.uppercased(), style: .constellation, direction: c.center.unitVector, priority: 20, maxFieldOfView: 130))
        }
        for s in catalog.namedStars() {
            guard let p = s.position, let m = s.magnitude, m < 5, case .star(let hip) = s.id.kind else { continue }
            // Only the brightest are labelled wide, and fainter names appear on zoom.
            let reveal = m < 1.5 ? 180.0 : m < 2.5 ? 90 : m < 3.5 ? 45 : 20
            out.append(SkyLabel(id: ObjectID.star(hip: hip).rawValue, text: s.name, style: .star, direction: p.unitVector, priority: 8 + (m + 2) * 4, maxFieldOfView: reveal))
        }
        for d in catalog.deepSky {
            guard let p = d.position, d.deepSky?.messier != nil || catalog.editorial(for: d)?.name != nil else { continue }
            let m = d.magnitude ?? 9
            let reveal = m < 5 ? 60.0 : m < 8 ? 30 : 12
            out.append(SkyLabel(id: d.id.rawValue, text: d.name, style: .deepSky, direction: p.unitVector, priority: 15 + m * 3, maxFieldOfView: reveal))
        }
        return out
    }

    /// The cardinal points, in the horizon frame.
    public static let compass: [(text: String, direction: Vec3)] = [
        ("N", Horizontal(azimuth: 0, altitude: 0).unitVector), ("NE", Horizontal(azimuth: 45, altitude: 0).unitVector),
        ("E", Horizontal(azimuth: 90, altitude: 0).unitVector), ("SE", Horizontal(azimuth: 135, altitude: 0).unitVector),
        ("S", Horizontal(azimuth: 180, altitude: 0).unitVector), ("SW", Horizontal(azimuth: 225, altitude: 0).unitVector),
        ("W", Horizontal(azimuth: 270, altitude: 0).unitVector), ("NW", Horizontal(azimuth: 315, altitude: 0).unitVector),
    ]
}
