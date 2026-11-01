import Combine
import SkySession
import SwiftUI
import UIKit
import UserData

struct RootView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.scenePhase) private var scenePhase

    private var theme: SkyTheme {
        services.model.preferences.display.nightVision ? .nightVision : .standard
    }

    var body: some View {
        Group {
            switch services.model.loadState {
            case .loading:
                ZStack {
                    theme.background.ignoresSafeArea()
                    ProgressView().tint(theme.tertiary)
                }
            case .failed(let message):
                ZStack {
                    theme.background.ignoresSafeArea()
                    StateMessage(systemImage: "exclamationmark.triangle", title: "Couldn't Open SkyLens", message: message)
                }
            case .ready:
                if services.model.preferences.onboardingCompleted, services.model.location != nil {
                    SkyScreen()
                        .transition(.opacity)
                } else {
                    OnboardingFlow()
                }
            }
        }
        .animation(.easeInOut(duration: 0.5), value: services.model.preferences.onboardingCompleted)
        .environment(\.theme, theme)
        .tint(theme.accent)
        .preferredColorScheme(.dark)
        // The system clock is white, which night vision exists to avoid.
        .statusBarHidden(theme.isNightVision)
        .task {
            await services.model.load()
            await services.store.start()
            await services.notifications.refreshAuthorization()
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                // The clock keeps its state, so a simulated time survives backgrounding.
                if services.sky.cameraMode == .compass {
                    services.motion.start(location: services.model.observer)
                }
            default:
                // Sensors must stop in the background: they serve no purpose there.
                services.motion.stop()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIDevice.orientationDidChangeNotification)) { _ in
            services.motion.interface = Self.interfaceRotation()
        }
    }

    private static func interfaceRotation() -> InterfaceRotationBridge.Value {
        InterfaceRotationBridge.current()
    }
}
