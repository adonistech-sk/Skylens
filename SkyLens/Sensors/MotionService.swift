import AstronomyCore
import CoreLocation
import CoreMotion
import Observation
import SkyProjection
import UIKit

/// Device attitude and compass quality. Stops itself in the background, since a
/// sensor left running there drains the battery for nothing.
@MainActor
@Observable
final class MotionService: NSObject {
    private(set) var headingQuality = HeadingQuality.unavailable
    private(set) var isRunning = false

    /// Horizon → screen-camera rotation. Read every frame, so not observed.
    @ObservationIgnored private(set) var orientation: Mat3?

    @ObservationIgnored private let manager = CMMotionManager()
    @ObservationIgnored private let headingManager = CLLocationManager()
    @ObservationIgnored private let queue = OperationQueue()
    @ObservationIgnored private var solver = AttitudeSolver()
    @ObservationIgnored private var filter = AttitudeFilter()
    @ObservationIgnored private var lastTimestamp: TimeInterval = 0
    @ObservationIgnored private var referenceFrame = CMAttitudeReferenceFrame.xTrueNorthZVertical
    /// Magnetic-to-true correction, needed only on the magnetic-north fallback.
    @ObservationIgnored private var declination = 0.0

    var interface = InterfaceRotation.portrait

    override init() {
        super.init()
        queue.maxConcurrentOperationCount = 1
        queue.qualityOfService = .userInteractive
        headingManager.delegate = self
        headingManager.headingFilter = 1
    }

    var isAvailable: Bool { manager.isDeviceMotionAvailable }

    func start(location: ObserverLocation?) {
        guard !isRunning, manager.isDeviceMotionAvailable else { return }
        let frames = CMMotionManager.availableAttitudeReferenceFrames()
        if frames.contains(.xTrueNorthZVertical) {
            referenceFrame = .xTrueNorthZVertical
        } else if frames.contains(.xMagneticNorthZVertical) {
            referenceFrame = .xMagneticNorthZVertical
        } else {
            // No compass at all: the horizon stays right, but north is arbitrary.
            referenceFrame = .xArbitraryCorrectedZVertical
        }

        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        filter.reset()
        solver = AttitudeSolver()
        isRunning = true
        manager.deviceMotionUpdateInterval = 1.0 / 60
        manager.startDeviceMotionUpdates(using: referenceFrame, to: queue) { [weak self] motion, _ in
            guard let motion else { return }
            let r = motion.attitude.rotationMatrix
            let matrix = Mat3(Vec3(r.m11, r.m12, r.m13), Vec3(r.m21, r.m22, r.m23), Vec3(r.m31, r.m32, r.m33))
            let gravity = Vec3(motion.gravity.x, motion.gravity.y, motion.gravity.z)
            let timestamp = motion.timestamp
            Task { @MainActor [weak self] in
                self?.ingest(matrix: matrix, gravity: gravity, timestamp: timestamp)
            }
        }
        if CLLocationManager.headingAvailable() {
            headingManager.startUpdatingHeading()
        }
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false
        manager.stopDeviceMotionUpdates()
        headingManager.stopUpdatingHeading()
        orientation = nil
    }

    private func ingest(matrix: Mat3, gravity: Vec3, timestamp: TimeInterval) {
        guard isRunning else { return }
        let dt = lastTimestamp == 0 ? 1.0 / 60 : timestamp - lastTimestamp
        lastTimestamp = timestamp
        let reference = solver.referenceToDevice(matrix: matrix, gravity: gravity)
        var camera = AttitudeSolver.cameraOrientation(referenceToDevice: reference, interface: interface)
        if referenceFrame == .xMagneticNorthZVertical, declination != 0 {
            camera = CompassCorrection(degrees: declination).apply(to: camera)
        }
        orientation = filter.filter(camera, dt: dt)
    }
}

extension MotionService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateHeading heading: CLHeading) {
        let accuracy = heading.headingAccuracy
        let magnetic = heading.magneticHeading
        let trueHeading = heading.trueHeading
        Task { @MainActor [weak self] in
            self?.headingQuality = HeadingQuality(headingAccuracy: accuracy)
            if trueHeading >= 0 {
                self?.declination = Angle.normalize180(trueHeading - magnetic)
            }
        }
    }
}
