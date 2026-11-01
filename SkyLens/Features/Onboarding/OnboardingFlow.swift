import AstronomyCore
import ObservingKit
import SkyProjection
import SkySession
import SwiftUI
import UserData

/// First launch. Every permission is asked for at the moment its purpose is clear,
/// and each step can be skipped except choosing a place, which the sky can't do
/// without. Even that needs no permission, because a place can be typed in.
struct OnboardingFlow: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    private enum Step: Int, CaseIterable {
        case welcome, location, skyIntro, preferences, notifications, pro
    }

    @State private var step = Step.welcome
    @State private var showPicker = false

    private var model: AppModel { services.model }

    var body: some View {
        ZStack {
            // The real sky above the user is the backdrop once a location is chosen.
            if model.location != nil {
                MetalSkyView(sky: services.sky, onSelect: { _ in }, onOpenDetail: { _ in }, onLongPress: { _ in })
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                    .opacity(0.7)
            } else {
                theme.background.ignoresSafeArea()
                StarField().ignoresSafeArea().accessibilityHidden(true)
            }

            VStack(alignment: .leading, spacing: Space.l) {
                Spacer()
                content
            }
            .padding(Space.xl)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(alignment: .bottom) {
                LinearGradient(colors: [.clear, theme.background.opacity(0.92)], startPoint: .top, endPoint: .center)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
            }
        }
        .animation(.easeInOut(duration: 0.35), value: step)
        .sheet(isPresented: $showPicker) {
            NavigationStack {
                LocationPicker { saved in
                    model.setLocation(saved)
                    step = .skyIntro
                }
            }
            .themedSheet(theme)
            .environment(services)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch step {
        case .welcome: welcome
        case .location: location
        case .skyIntro: skyIntro
        case .preferences: preferences
        case .notifications: notifications
        case .pro: pro
        }
    }

    private func heading(_ title: String, _ message: String) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(title)
                .font(Typography.objectTitle)
                .foregroundStyle(theme.primary)
                .accessibilityAddTraits(.isHeader)
            Text(message)
                .font(.body)
                .foregroundStyle(theme.secondary)
        }
    }

    private var welcome: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            heading("SkyLens", "Every star, planet and constellation above you, right now.")
            SkyPrimaryButton(title: "Get Started") { step = .location }
                .accessibilityIdentifier("getStartedButton")
        }
    }

    private var location: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            heading("Where Are You?", "The sky depends on where you stand. SkyLens uses your location only to work out what's above you, on this device.")
            SkyPrimaryButton(title: "Use Current Location", isLoading: services.location.state == .requesting) {
                Task {
                    if let saved = await services.location.requestCurrentLocation() {
                        model.setLocation(saved)
                        model.addSavedLocation(saved)
                        step = .skyIntro
                    }
                }
            }
            .accessibilityIdentifier("useCurrentLocationButton")
            if services.location.state == .denied {
                Text("No problem. Choose a place by hand instead.")
                    .font(Typography.caption)
                    .foregroundStyle(theme.warning)
            }
            SkySecondaryButton(title: "Choose a Place") { showPicker = true }
                .accessibilityIdentifier("choosePlaceButton")
        }
    }

    private var skyIntro: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            heading("Move Your iPhone to Explore", "Hold it up to the sky and SkyLens follows. Or drag with a finger, and pinch to zoom. Tap anything to find out what it is.")
            SkyPrimaryButton(title: "Continue") { step = .preferences }
                .accessibilityIdentifier("continueButton")
        }
    }

    private var preferences: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            heading("How Do You Observe?", "This shapes what Tonight suggests. Nothing is locked away.")
            Picker("Experience", selection: Binding(
                get: { model.preferences.experience },
                set: { value in model.updatePreferences { $0.experience = value } }
            )) {
                Text("Beginner").tag(Experience.beginner)
                Text("Enthusiast").tag(Experience.enthusiast)
            }
            .pickerStyle(.segmented)
            VStack(spacing: Space.xs) {
                ForEach(Equipment.allCases, id: \.self) { item in
                    Toggle(item.displayName, isOn: Binding(
                        get: { model.preferences.equipment.contains(item) },
                        set: { on in
                            model.updatePreferences {
                                if on { $0.equipment.insert(item) } else { $0.equipment.remove(item) }
                            }
                        }
                    ))
                    .foregroundStyle(theme.primary)
                }
            }
            SkyPrimaryButton(title: "Continue") { step = .notifications }
                .accessibilityIdentifier("preferencesContinueButton")
        }
    }

    private var notifications: some View {
        VStack(alignment: .leading, spacing: Space.l) {
            heading("Never Miss an Eclipse", "Get a short alert before eclipses, meteor showers and planets at their best, when they're visible from where you are.")
            SkyPrimaryButton(title: "Turn On Alerts") {
                Task {
                    let granted = await services.notifications.requestAuthorization()
                    model.updatePreferences { $0.notifications.enabled = granted }
                    step = .pro
                }
            }
            SkySecondaryButton(title: "Not Now") { step = .pro }
                .accessibilityIdentifier("skipAlertsButton")
        }
    }

    private var pro: some View {
        PaywallView(closeTitle: "Continue with the Free Version") {
            model.completeOnboarding()
        }
        .skyPanel()
        .frame(maxHeight: 560)
    }
}

/// A faint decorative field for the first screens, before the real sky can be shown
/// because no location is known yet. It uses the actual brightest stars of the catalog
/// spread across the view, rather than random noise.
private struct StarField: View {
    @Environment(AppServices.self) private var services

    var body: some View {
        Canvas { context, size in
            guard let stars = services.model.catalog?.stars else { return }
            for i in 0..<min(2500, stars.count) {
                let x = Double(stars.rightAscension[i]) / 360 * size.width
                let y = (0.5 - Double(stars.declination[i]) / 180) * size.height
                let radius = StarAppearance.pointRadius(magnitude: Double(stars.magnitude[i]), limit: 6.5) * 0.6
                let rect = CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)
                context.opacity = StarAppearance.alpha(magnitude: Double(stars.magnitude[i]), limit: 6.5) * 0.7
                context.fill(Path(ellipseIn: rect), with: .color(.white))
            }
        }
    }
}
