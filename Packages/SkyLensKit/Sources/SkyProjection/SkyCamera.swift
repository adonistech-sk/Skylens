import AstronomyCore
import Foundation

/// A point on screen, in points, with the origin at the top left.
public struct ScreenPoint: Sendable, Hashable {
    public var x: Double
    public var y: Double

    public init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }

    public func distance(to o: ScreenPoint) -> Double {
        ((x - o.x) * (x - o.x) + (y - o.y) * (y - o.y)).squareRoot()
    }
}

public struct ScreenSize: Sendable, Hashable {
    public var width: Double
    public var height: Double

    public init(width: Double, height: Double) {
        self.width = width
        self.height = height
    }

    public var minDimension: Double { min(width, height) }
    public var center: ScreenPoint { ScreenPoint(x: width / 2, y: height / 2) }
}

/// Stereographic view of the sky.
///
/// Stereographic projection is conformal, so constellations keep their shapes even
/// at the edge of a very wide field, which is why planetarium software favours it.
/// A point at angle θ from the view axis lands at radius tan(θ/2). Metal's vertex
/// shader implements the same formula, and that must stay in step with this file.
public struct SkyCamera: Sendable, Hashable {
    /// How directions map to the screen.
    public enum Projection: Int32, Sendable {
        /// Conformal and able to show very wide fields. Used for the planetarium view.
        case stereographic = 0
        /// A pinhole camera, where straight lines stay straight. AR must use this,
        /// because the overlay has to match a real lens or stars drift off their
        /// true positions toward the edge of the frame.
        case rectilinear = 1
    }

    /// Horizon frame → camera frame, where camera +x is screen right, +y is screen
    /// up, and the camera looks down −z.
    public var orientation: Mat3
    /// Field of view across the screen's shorter side, in degrees.
    public var fieldOfView: Double
    public var screen: ScreenSize
    public var projection: Projection

    public static let fieldOfViewRange: ClosedRange<Double> = 0.5...150

    public init(
        orientation: Mat3 = .identity, fieldOfView: Double = 75, screen: ScreenSize,
        projection: Projection = .stereographic
    ) {
        self.orientation = orientation
        self.fieldOfView = fieldOfView
        self.screen = screen
        self.projection = projection
    }

    /// Screen points per unit of projected radius. The short side's half-width
    /// corresponds to half the field of view.
    public var scale: Double {
        switch projection {
        case .stereographic: screen.minDimension / 2 / tan(fieldOfView * Angle.degToRad / 4)
        case .rectilinear: screen.minDimension / 2 / tan(fieldOfView * Angle.degToRad / 2)
        }
    }

    /// Projects a horizon-frame unit vector. In stereographic mode this returns nil
    /// only for the antipode of the view axis, which has no finite image: points
    /// behind the camera do project, usually off-screen, and `isVisible` is the
    /// on-screen test. Rectilinear mode cannot represent anything behind the camera.
    public func project(_ horizon: Vec3) -> ScreenPoint? {
        let c = orientation * horizon
        let k: Double // the view axis is −z, so −c.z is cos θ
        switch projection {
        case .stereographic: k = 1 - c.z
        case .rectilinear: k = -c.z
        }
        guard k > 1e-9 else { return nil }
        let s = scale / k
        return ScreenPoint(x: screen.width / 2 + c.x * s, y: screen.height / 2 - c.y * s)
    }

    /// Inverse of `project`: the horizon-frame direction under a screen point.
    public func unproject(_ point: ScreenPoint) -> Vec3 {
        let x = (point.x - screen.width / 2) / scale
        let y = (screen.height / 2 - point.y) / scale
        let c: Vec3
        switch projection {
        case .stereographic:
            let r2 = x * x + y * y
            let k = 2 / (1 + r2)
            c = Vec3(x * k, y * k, (r2 - 1) / (r2 + 1))
        case .rectilinear:
            c = Vec3(x, y, -1).normalized
        }
        return orientation.transposed * c
    }

    /// The field of view across the short side that a back camera shows when its feed
    /// fills the screen with aspect-fill, as the preview layer does.
    /// - Parameters:
    ///   - sensorFieldOfView: `AVCaptureDevice.Format.videoFieldOfView`, which Apple
    ///     defines across the long side of the sensor image.
    ///   - sensorAspect: long side ÷ short side of the capture format.
    public static func cameraFieldOfView(
        sensorFieldOfView: Double, sensorAspect: Double, screen: ScreenSize
    ) -> Double {
        let screenAspect = max(screen.width, screen.height) / max(screen.minDimension, 1)
        let halfLong = tan(sensorFieldOfView * Angle.degToRad / 2)
        // Aspect-fill: the image's short side always spans the screen's short side
        // unless the screen is narrower than the sensor, when the long sides match.
        let halfShort = screenAspect >= sensorAspect
            ? halfLong / screenAspect
            : halfLong / sensorAspect
        return 2 * atan(halfShort) * Angle.radToDeg
    }

    public func isVisible(_ point: ScreenPoint, margin: Double = 0) -> Bool {
        point.x >= -margin && point.y >= -margin
            && point.x <= screen.width + margin && point.y <= screen.height + margin
    }

    /// Whether a direction falls on screen. Rejects everything more than the
    /// diagonal half-field from the view axis before projecting.
    public func contains(_ horizon: Vec3, margin: Double = 0) -> Bool {
        guard let p = project(horizon) else { return false }
        return isVisible(p, margin: margin)
    }

    /// The horizon-frame direction at the centre of the screen.
    public var viewDirection: Vec3 {
        orientation.transposed * Vec3(0, 0, -1)
    }

    /// The horizon-frame direction of screen "up".
    public var upDirection: Vec3 {
        orientation.transposed * Vec3(0, 1, 0)
    }

    /// Screen points per degree at the centre of the view.
    public var pointsPerDegree: Double {
        scale / 2 * Angle.degToRad
    }

    // MARK: Building orientations

    /// A level camera aimed at an azimuth and altitude, with the zenith toward the
    /// top of the screen. Looking straight up or down, north becomes the reference.
    public static func orientation(azimuth: Double, altitude: Double, roll: Double = 0) -> Mat3 {
        let forward = Horizontal(azimuth: azimuth, altitude: altitude).unitVector
        let zenith = Vec3(0, 0, 1)
        var right = forward.cross(zenith)
        if right.length < 1e-6 {
            // Pointing at a pole of the horizon system, so azimuth defines "up".
            right = forward.cross(Horizontal(azimuth: azimuth, altitude: 0).unitVector * (altitude > 0 ? -1 : 1))
        }
        right = right.normalized
        let up = right.cross(forward).normalized
        // Rows are the camera axes expressed in the horizon frame.
        let base = Mat3(right, up, -forward)
        return roll == 0 ? base : Mat3.rotation(axis: Vec3(0, 0, 1), degrees: roll) * base
    }
}

/// Orientation state for touch exploration. Azimuth and altitude are the natural
/// parameters here: dragging should keep the horizon level.
public struct ManualView: Sendable, Hashable {
    public var azimuth: Double
    public var altitude: Double

    public init(azimuth: Double = 180, altitude: Double = 35) {
        self.azimuth = azimuth
        self.altitude = altitude
    }

    public var orientation: Mat3 {
        SkyCamera.orientation(azimuth: azimuth, altitude: altitude)
    }

    /// Applies a drag so the sky follows the finger. `dx` and `dy` are screen points
    /// and the sky moves with them, so dragging right looks further left. Only
    /// altitude clamps: looking past the zenith would flip the view upside down.
    public mutating func drag(dx: Double, dy: Double, pointsPerDegree: Double) {
        let perDegree = max(pointsPerDegree, 1e-6)
        let cosine = max(cos(altitude * Angle.degToRad), 0.05)
        azimuth = Angle.normalize360(azimuth - dx / perDegree / cosine)
        altitude = min(89.9, max(-89.9, altitude + dy / perDegree))
    }

    /// The view that centres a direction.
    public init(centering direction: Horizontal) {
        self.init(azimuth: direction.azimuth, altitude: min(89.9, max(-89.9, direction.altitude)))
    }
}

/// Great-circle slerp for "fly to object". The path is computed in the horizon
/// frame, and callers should re-evaluate targets during time-lapse.
public struct ViewAnimation: Sendable, Hashable {
    public let from: ManualView
    public let to: ManualView
    public let fromFOV: Double
    public let toFOV: Double
    public let duration: Double

    public init(from: ManualView, to: ManualView, fromFOV: Double, toFOV: Double, duration: Double) {
        self.from = from
        self.to = to
        self.fromFOV = fromFOV
        self.toFOV = toFOV
        self.duration = duration
    }

    /// Longer flights take longer, within limits that keep the sky feeling direct.
    public static func duration(angle: Double, reduceMotion: Bool) -> Double {
        reduceMotion ? 0 : min(1.4, 0.45 + angle / 180)
    }

    public func value(at elapsed: Double) -> (view: ManualView, fov: Double) {
        let t = duration <= 0 ? 1 : min(1, max(0, elapsed / duration))
        // Smootherstep: zero velocity and acceleration at both ends.
        let e = t * t * t * (t * (t * 6 - 15) + 10)
        let dAz = Angle.normalize180(to.azimuth - from.azimuth)
        let view = ManualView(
            azimuth: Angle.normalize360(from.azimuth + dAz * e),
            altitude: from.altitude + (to.altitude - from.altitude) * e
        )
        // Zoom is perceptually logarithmic.
        let fov = exp(log(fromFOV) + (log(toFOV) - log(fromFOV)) * e)
        return (view, fov)
    }
}
