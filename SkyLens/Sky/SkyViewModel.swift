import AstronomyCore
import Foundation
import Observation
import Satellites
import SkyCatalog
import SkyProjection
import SkySession
import UIKit

/// Screen state for the sky. The camera lives here so it survives sheets opening and
/// closing, which is what keeps search and selection from costing the user their view.
@MainActor
@Observable
final class SkyViewModel {
    enum CameraMode: Equatable {
        case touch
        case compass
    }

    let app: AppModel
    let motion: MotionService

    var cameraMode = CameraMode.touch
    var manualView = ManualView()
    var fieldOfView = 75.0
    var guidanceTarget: ObjectID?
    var pendingTagDirection: Horizontal?
    private(set) var guidance: DirectionHint?
    private(set) var currentHeading = ""

    /// Set by the renderer every frame. Not observed, because it changes at 60 Hz.
    @ObservationIgnored var screen = ScreenSize(width: 390, height: 844)
    @ObservationIgnored var lastCamera: SkyCamera?
    @ObservationIgnored private var animation: ViewAnimation?
    @ObservationIgnored private var animationStart = 0.0

    init(app: AppModel, motion: MotionService) {
        self.app = app
        self.motion = motion
    }

    // MARK: Camera

    /// The camera for this instant. Called once per frame.
    func camera(time: TimeInterval, screen: ScreenSize, projection: SkyCamera.Projection, arFieldOfView: Double?) -> SkyCamera {
        self.screen = screen
        if let a = animation {
            let value = a.value(at: time - animationStart)
            manualView = value.view
            fieldOfView = value.fov
            if time - animationStart >= a.duration { animation = nil }
        }

        var orientation = manualView.orientation
        if cameraMode == .compass || arFieldOfView != nil, let sensor = motion.orientation {
            orientation = CompassCorrection(degrees: app.preferences.compassCorrection).apply(to: sensor)
        }
        let camera = SkyCamera(
            orientation: orientation, fieldOfView: arFieldOfView ?? fieldOfView,
            screen: screen, projection: projection
        )
        lastCamera = camera
        return camera
    }

    var isAnimating: Bool { animation != nil }

    func toggleCompass() {
        if cameraMode == .compass {
            cameraMode = .touch
            motion.stop()
        } else if motion.isAvailable {
            cameraMode = .compass
            motion.start(location: app.observer)
        }
    }

    func drag(dx: Double, dy: Double) {
        animation = nil
        // Dragging means the user wants manual control. Take over from the same view
        // so the sky does not jump.
        if cameraMode == .compass {
            if let c = lastCamera {
                manualView = ManualView(centering: Horizontal(unitVector: c.viewDirection))
            }
            cameraMode = .touch
            motion.stop()
        }
        let perDegree = lastCamera?.pointsPerDegree ?? 10
        manualView.drag(dx: dx, dy: dy, pointsPerDegree: perDegree)
    }

    func zoom(by factor: Double) {
        animation = nil
        fieldOfView = min(SkyCamera.fieldOfViewRange.upperBound, max(SkyCamera.fieldOfViewRange.lowerBound, fieldOfView / factor))
    }

    /// Restores a level view at the current heading.
    func recenter(reduceMotion: Bool) {
        let target = ManualView(azimuth: manualView.azimuth, altitude: 35)
        fly(to: target, fieldOfView: 75, reduceMotion: reduceMotion)
    }

    private func fly(to target: ManualView, fieldOfView targetFOV: Double, reduceMotion: Bool) {
        let distance = Horizontal(azimuth: manualView.azimuth, altitude: manualView.altitude).unitVector
            .angle(to: Horizontal(azimuth: target.azimuth, altitude: target.altitude).unitVector)
        animation = ViewAnimation(
            from: manualView, to: target, fromFOV: fieldOfView, toFOV: targetFOV,
            duration: ViewAnimation.duration(angle: distance, reduceMotion: reduceMotion)
        )
        animationStart = CACurrentMediaTime()
    }

    // MARK: Find in Sky

    /// Selects an object and flies to it. Works for objects below the horizon, since
    /// showing where they are is more useful than refusing to.
    func find(_ id: ObjectID, reduceMotion: Bool) {
        app.selection = id
        guidanceTarget = id
        guard let observer = app.observer, let object = app.object(id) else { return }
        let frame = SkyFrame(time: AstroTime(app.skyDate), observer: observer)
        guard let direction = try? Locator.direction(of: object, frame: frame, tracker: tracker(for: id)) else { return }
        if cameraMode == .compass { return } // The arrow guides them instead.
        fly(to: ManualView(centering: Horizontal(unitVector: direction)), fieldOfView: min(fieldOfView, targetFOV(for: object)), reduceMotion: reduceMotion)
    }

    private func targetFOV(for object: SkyObject) -> Double {
        switch object.type {
        case .constellation: 60
        case .sun, .moon, .planet: 30
        default: 40
        }
    }

    func tracker(for id: ObjectID) -> SatelliteTracker? {
        if case .satellite(let norad) = id.kind { return app.tracker(norad: norad) }
        return nil
    }

    /// Refreshes the on-screen guidance. Called at label cadence, not per frame.
    func updateGuidance() {
        guard let id = guidanceTarget, let camera = lastCamera, let observer = app.observer,
              let object = app.object(id) else {
            guidance = nil
            return
        }
        let frame = SkyFrame(time: AstroTime(app.skyDate), observer: observer)
        guard let direction = try? Locator.direction(of: object, frame: frame, tracker: tracker(for: id)) else {
            guidance = nil
            return
        }
        guidance = DirectionHint.toward(direction, camera: camera)
    }

    func updateHeading() {
        guard let camera = lastCamera else { return }
        let h = Horizontal(unitVector: camera.viewDirection)
        currentHeading = "\(h.compassPoint.rawValue) \(Int(h.azimuth.rounded()))°  ·  \(Int(h.altitude.rounded()))°"
    }

    func stopGuidance() {
        guidanceTarget = nil
        guidance = nil
    }
}
