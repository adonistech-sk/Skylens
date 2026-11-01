import Foundation

/// Double-precision 3-vector. `simd` is unavailable off Apple platforms, and the
/// sky mathematics needs doubles anyway. The renderer converts to `SIMD3<Float>`.
public struct Vec3: Sendable, Hashable, Codable {
    public var x: Double
    public var y: Double
    public var z: Double

    public init(_ x: Double, _ y: Double, _ z: Double) {
        self.x = x
        self.y = y
        self.z = z
    }

    public static let zero = Vec3(0, 0, 0)

    public var length: Double { (x * x + y * y + z * z).squareRoot() }

    public var normalized: Vec3 {
        let l = length
        return l > 0 ? Vec3(x / l, y / l, z / l) : self
    }

    public func dot(_ o: Vec3) -> Double { x * o.x + y * o.y + z * o.z }

    public func cross(_ o: Vec3) -> Vec3 {
        Vec3(y * o.z - z * o.y, z * o.x - x * o.z, x * o.y - y * o.x)
    }

    public static func + (a: Vec3, b: Vec3) -> Vec3 { Vec3(a.x + b.x, a.y + b.y, a.z + b.z) }
    public static func - (a: Vec3, b: Vec3) -> Vec3 { Vec3(a.x - b.x, a.y - b.y, a.z - b.z) }
    public static func * (a: Vec3, s: Double) -> Vec3 { Vec3(a.x * s, a.y * s, a.z * s) }
    public static prefix func - (a: Vec3) -> Vec3 { Vec3(-a.x, -a.y, -a.z) }

    /// Angle between two directions in degrees. Uses atan2, which stays accurate
    /// for the tiny separations that acos loses to rounding.
    public func angle(to o: Vec3) -> Double {
        let c = cross(o).length
        return atan2(c, dot(o)) * Angle.radToDeg
    }
}

/// Row-major 3×3 matrix: `m[r][c]` multiplies column vectors on the right.
public struct Mat3: Sendable, Hashable {
    public var r0: Vec3
    public var r1: Vec3
    public var r2: Vec3

    public init(_ r0: Vec3, _ r1: Vec3, _ r2: Vec3) {
        self.r0 = r0
        self.r1 = r1
        self.r2 = r2
    }

    public static let identity = Mat3(Vec3(1, 0, 0), Vec3(0, 1, 0), Vec3(0, 0, 1))

    public var transposed: Mat3 {
        Mat3(Vec3(r0.x, r1.x, r2.x), Vec3(r0.y, r1.y, r2.y), Vec3(r0.z, r1.z, r2.z))
    }

    public static func * (m: Mat3, v: Vec3) -> Vec3 {
        Vec3(m.r0.dot(v), m.r1.dot(v), m.r2.dot(v))
    }

    public static func * (a: Mat3, b: Mat3) -> Mat3 {
        let t = b.transposed
        return Mat3(
            Vec3(a.r0.dot(t.r0), a.r0.dot(t.r1), a.r0.dot(t.r2)),
            Vec3(a.r1.dot(t.r0), a.r1.dot(t.r1), a.r1.dot(t.r2)),
            Vec3(a.r2.dot(t.r0), a.r2.dot(t.r1), a.r2.dot(t.r2))
        )
    }

    /// Right-handed rotation about a unit axis.
    public static func rotation(axis a: Vec3, degrees: Double) -> Mat3 {
        let t = degrees * Angle.degToRad
        let c = cos(t), s = sin(t), k = 1 - c
        return Mat3(
            Vec3(c + a.x * a.x * k, a.x * a.y * k - a.z * s, a.x * a.z * k + a.y * s),
            Vec3(a.y * a.x * k + a.z * s, c + a.y * a.y * k, a.y * a.z * k - a.x * s),
            Vec3(a.z * a.x * k - a.y * s, a.z * a.y * k + a.x * s, c + a.z * a.z * k)
        )
    }
}

public enum Angle {
    public static let degToRad = Double.pi / 180
    public static let radToDeg = 180 / Double.pi

    /// Wraps to 0 ≤ a < 360.
    public static func normalize360(_ a: Double) -> Double {
        let r = a.truncatingRemainder(dividingBy: 360)
        return r < 0 ? r + 360 : r
    }

    /// Wraps to −180 < a ≤ 180.
    public static func normalize180(_ a: Double) -> Double {
        let r = normalize360(a)
        return r > 180 ? r - 360 : r
    }
}
