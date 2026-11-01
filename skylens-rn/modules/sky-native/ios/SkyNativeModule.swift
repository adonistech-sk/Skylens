import CoreLocation
import CoreMotion
import ExpoModulesCore

/// Reused from SkyLens/Sensors/MotionService.swift. Expo's generic motion API doesn't
/// expose the true-north reference frame, and the sky can't line up without it.
public class SkyNativeModule: Module {
  private let manager = CMMotionManager()
  private let headingManager = CLLocationManager()
  private let queue = OperationQueue()
  private var headingDelegate: HeadingDelegate?
  private var headingAccuracy: Double = -1
  private var frame = "none"

  public func definition() -> ModuleDefinition {
    Name("SkyNative")
    Events("onAttitude")

    Function("isAvailable") { () -> Bool in
      self.manager.isDeviceMotionAvailable
    }

    Function("start") { () -> String in
      guard self.manager.isDeviceMotionAvailable else { return "none" }
      if self.manager.isDeviceMotionActive { return self.frame }
      let frames = CMMotionManager.availableAttitudeReferenceFrames()
      let reference: CMAttitudeReferenceFrame
      if frames.contains(.xTrueNorthZVertical) {
        reference = .xTrueNorthZVertical
        self.frame = "trueNorth"
      } else if frames.contains(.xMagneticNorthZVertical) {
        reference = .xMagneticNorthZVertical
        self.frame = "magneticNorth"
      } else {
        // No compass at all: the horizon stays right, but north is arbitrary.
        reference = .xArbitraryCorrectedZVertical
        self.frame = "arbitrary"
      }
      let frameName = self.frame
      self.queue.maxConcurrentOperationCount = 1
      self.queue.qualityOfService = .userInteractive
      self.manager.deviceMotionUpdateInterval = 1.0 / 45
      self.manager.startDeviceMotionUpdates(using: reference, to: self.queue) { [weak self] motion, _ in
        guard let self, let motion else { return }
        let r = motion.attitude.rotationMatrix
        self.sendEvent("onAttitude", [
          "matrix": [r.m11, r.m12, r.m13, r.m21, r.m22, r.m23, r.m31, r.m32, r.m33],
          "gravity": [motion.gravity.x, motion.gravity.y, motion.gravity.z],
          "timestamp": motion.timestamp,
          "headingAccuracy": self.headingAccuracy,
          "frame": frameName,
        ])
      }
      if CLLocationManager.headingAvailable() {
        let delegate = HeadingDelegate { [weak self] accuracy in self?.headingAccuracy = accuracy }
        self.headingDelegate = delegate
        self.headingManager.delegate = delegate
        self.headingManager.headingFilter = 1
        self.headingManager.startUpdatingHeading()
      }
      return self.frame
    }

    Function("stop") {
      self.manager.stopDeviceMotionUpdates()
      self.headingManager.stopUpdatingHeading()
    }

    OnDestroy {
      self.manager.stopDeviceMotionUpdates()
      self.headingManager.stopUpdatingHeading()
    }
  }
}

private final class HeadingDelegate: NSObject, CLLocationManagerDelegate {
  private let onAccuracy: (Double) -> Void

  init(onAccuracy: @escaping (Double) -> Void) {
    self.onAccuracy = onAccuracy
  }

  func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
    onAccuracy(newHeading.headingAccuracy)
  }
}
