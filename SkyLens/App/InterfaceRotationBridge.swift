import SkyProjection
import UIKit

/// Reads how the interface is rotated relative to the device.
enum InterfaceRotationBridge {
    typealias Value = InterfaceRotation

    @MainActor
    static func current() -> InterfaceRotation {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        switch scene?.interfaceOrientation {
        case .landscapeLeft: return .landscapeLeft
        case .landscapeRight: return .landscapeRight
        case .portraitUpsideDown: return .portraitUpsideDown
        default: return .portrait
        }
    }
}
