import AstronomyCore
import Foundation

/// How the interface is rotated relative to the device body. Screen axes depend on
/// this while the Core Motion attitude does not.
public enum InterfaceRotation: Sendable, Hashable {
    case portrait, portraitUpsideDown, landscapeLeft, landscapeRight

    /// Device frame → screen frame. Device +x is the right edge in portrait, +y the
    /// top edge, and +z points out of the display.
    var deviceToScreen: Mat3 {
        switch self {
        case .portrait:
            .identity
        case .portraitUpsideDown:
            Mat3(Vec3(-1, 0, 0), Vec3(0, -1, 0), Vec3(0, 0, 1))
        case .landscapeLeft:
            // Interface top is at the device's right edge.
            Mat3(Vec3(0, -1, 0), Vec3(1, 0, 0), Vec3(0, 0, 1))
        case .landscapeRight:
            Mat3(Vec3(0, 1, 0), Vec3(-1, 0, 0), Vec3(0, 0, 1))
        }
    }
}

/// Converts Core Motion's attitude into a sky camera.
///
/// With `xTrueNorthZVertical` the reference frame is +x north, +z up, +y west, which
/// is the same as the horizon frame in `AstronomyCore`. The rotation matrix relates
/// that frame to the device. Whether its rows or columns hold the device axes cannot
/// be confirmed without hardware, so `AttitudeSolver` measures it against gravity at
/// runtime rather than trusting an assumption. A wrong guess would be a mirrored sky.
public struct AttitudeSolver: Sendable {
    /// Unknown until the device has tilted enough for the two readings to differ.
    private var useTransposed = false
    private var isResolved = false

    public init() {}

    /// Resolves the reference-to-device rotation.
    /// - Parameters:
    ///   - matrix: `CMAttitude.rotationMatrix` with m11...m33 as rows.
    ///   - gravity: `CMDeviceMotion.gravity`, measured in the device frame.
    public mutating func referenceToDevice(matrix m: Mat3, gravity: Vec3) -> Mat3 {
        let g = gravity.normalized
        // The zenith in device coordinates is −gravity. Each candidate maps the
        // reference zenith differently, so comparing them identifies the convention.
        let zenith = Vec3(0, 0, 1)
        let asIs = (m * zenith + g).length
        let flipped = (m.transposed * zenith + g).length
        // A flat device gives both the same answer, so demand clear evidence.
        if abs(asIs - flipped) > 0.2 {
            useTransposed = flipped < asIs
            isResolved = true
        }
        return useTransposed ? m.transposed : m
    }

    public var hasResolvedConvention: Bool { isResolved }

    /// Horizon → camera for the back camera looking out of the device. The camera
    /// frame's −z must be the direction the back of the phone faces. Device −z
    /// already satisfies that, so the only step left is the interface rotation.
    public static func cameraOrientation(referenceToDevice r: Mat3, interface: InterfaceRotation) -> Mat3 {
        interface.deviceToScreen * r
    }
}

/// Smooths noisy orientation samples. Filtering in the rotation group would be purer,
/// but for small per-frame deltas a normalized lerp with re-orthogonalisation behaves
/// identically and costs far less.
public struct AttitudeFilter: Sendable {
    private var state: Mat3?
    /// Time constant in seconds. A larger value is steadier and laggier.
    public var timeConstant: Double

    public init(timeConstant: Double = 0.09) {
        self.timeConstant = timeConstant
    }

    public mutating func reset() { state = nil }

    public mutating func filter(_ sample: Mat3, dt: Double) -> Mat3 {
        guard let s = state else {
            state = sample
            return sample
        }
        // A large jump means the sensor re-referenced, so snap instead of swinging.
        let forwardNew = sample.transposed * Vec3(0, 0, -1)
        let forwardOld = s.transposed * Vec3(0, 0, -1)
        if forwardNew.angle(to: forwardOld) > 25 {
            state = sample
            return sample
        }
        let alpha = 1 - exp(-max(dt, 0) / timeConstant)
        var r0 = s.r0 + (sample.r0 - s.r0) * alpha
        var r1 = s.r1 + (sample.r1 - s.r1) * alpha
        r0 = r0.normalized
        r1 = (r1 - r0 * r0.dot(r1)).normalized
        let r2 = r0.cross(r1)
        let out = Mat3(r0, r1, r2)
        state = out
        return out
    }
}

/// A user-applied azimuth correction, for when the compass is visibly wrong. It turns
/// the sky around the zenith, which is the only axis a magnetometer gets wrong.
public struct CompassCorrection: Sendable, Hashable, Codable {
    public var degrees: Double

    public init(degrees: Double = 0) { self.degrees = degrees }

    /// Horizon-frame rotation applied before the device attitude.
    public var rotation: Mat3 {
        Mat3.rotation(axis: Vec3(0, 0, 1), degrees: degrees)
    }

    /// Applied to a camera orientation.
    public func apply(to orientation: Mat3) -> Mat3 {
        degrees == 0 ? orientation : orientation * rotation
    }
}

/// What the app may honestly claim about the compass right now.
public enum HeadingQuality: Sendable, Hashable {
    case good
    /// Usable, but expect a visible offset.
    case approximate(accuracyDegrees: Double)
    /// Interference, or the sensor is uncalibrated.
    case unreliable
    /// The sensor gives no heading, which happens near the magnetic poles and on
    /// devices with no magnetometer.
    case unavailable

    /// From `CLHeading.headingAccuracy`, where a negative value means invalid.
    public init(headingAccuracy degrees: Double?) {
        guard let degrees else {
            self = .unavailable
            return
        }
        switch degrees {
        case ..<0: self = .unavailable
        case ..<10: self = .good
        case ..<30: self = .approximate(accuracyDegrees: degrees)
        default: self = .unreliable
        }
    }

    /// Short copy for the HUD, or nil when there is nothing worth saying.
    public var message: String? {
        switch self {
        case .good: nil
        case .approximate(let a): "Compass accurate to about \(Int(a.rounded()))°"
        case .unreliable: "Compass is unreliable here. Move away from metal, or wave the phone in a figure eight."
        case .unavailable: "Compass unavailable. Drag to explore, or align manually."
        }
    }
}
