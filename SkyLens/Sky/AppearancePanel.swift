import SkySession
import SwiftUI
import UserData

extension AppModel {
    /// A binding into the persisted display options.
    func display<T>(_ key: WritableKeyPath<DisplayOptions, T>) -> Binding<T> {
        Binding(
            get: { self.preferences.display[keyPath: key] },
            set: { value in self.updatePreferences { $0.display[keyPath: key] = value } }
        )
    }
}

/// Layer controls. They persist immediately and the renderer reads them every frame,
/// so the sky updates live behind the partial sheet.
struct AppearancePanel: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    let onUpgrade: (ProFeature?) -> Void

    private var model: AppModel { services.model }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.l) {
                SheetHeader(title: "Sky Appearance")

                Toggle("Night Vision", isOn: model.display(\.nightVision))
                    .accessibilityIdentifier("nightVisionToggle")
                Text("Turns the whole app red to protect your dark adaptation.")
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)

                group("Constellations") {
                    Toggle("Figures", isOn: model.display(\.constellationLines))
                        .accessibilityIdentifier("constellationLinesToggle")
                    Toggle("Boundaries", isOn: model.display(\.constellationBoundaries))
                    Toggle("Names", isOn: model.display(\.constellationLabels))
                }

                group("Layers") {
                    Toggle("Star names", isOn: model.display(\.starLabels))
                    Toggle("Planet names", isOn: model.display(\.planetLabels))
                    Toggle("Deep-sky objects", isOn: model.display(\.deepSkyObjects))
                    Toggle("Satellites", isOn: model.display(\.satellites))
                    Toggle("Horizon and ground", isOn: model.display(\.horizon))
                    Toggle("Atmosphere", isOn: model.display(\.atmosphere))
                    Toggle("Altitude–azimuth grid", isOn: model.display(\.azimuthalGrid))
                    Toggle("Equatorial grid", isOn: model.display(\.equatorialGrid))
                }

                group("Stars") {
                    VStack(alignment: .leading) {
                        Text("Star size").font(.subheadline).foregroundStyle(theme.secondary)
                        Slider(value: model.display(\.starBrightness), in: 0.6...1.6)
                            .accessibilityLabel("Star size")
                    }
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Faintest stars").font(.subheadline).foregroundStyle(theme.secondary)
                            Spacer()
                            Text("magnitude \(model.preferences.display.magnitudeLimit, format: .number.precision(.fractionLength(1)))")
                                .font(Typography.data)
                                .foregroundStyle(theme.tertiary)
                        }
                        Slider(value: model.display(\.magnitudeLimit), in: 3...model.starMagnitudeCeiling)
                            .accessibilityLabel("Faintest stars shown")
                        if !model.hasAccess(to: .extendedStarField) {
                            Button("See fainter stars with Pro") { onUpgrade(.extendedStarField) }
                                .font(Typography.caption)
                        }
                    }
                    Picker("Labels", selection: model.display(\.labelDensity)) {
                        Text("Few").tag(LabelDensity.few)
                        Text("Normal").tag(LabelDensity.normal)
                        Text("Many").tag(LabelDensity.many)
                    }
                    .pickerStyle(.segmented)
                }

                group("Compass Alignment") {
                    VStack(alignment: .leading) {
                        HStack {
                            Text("Offset").font(.subheadline).foregroundStyle(theme.secondary)
                            Spacer()
                            Text("\(Int(model.preferences.compassCorrection))°")
                                .font(Typography.data)
                                .foregroundStyle(theme.tertiary)
                        }
                        Slider(
                            value: Binding(
                                get: { model.preferences.compassCorrection },
                                set: { value in model.updatePreferences { $0.compassCorrection = value } }
                            ),
                            in: -30...30, step: 1
                        )
                        .accessibilityLabel("Compass offset in degrees")
                        Text("If stars look shifted left or right of where the phone is pointing, line up a bright star with this control.")
                            .font(Typography.caption)
                            .foregroundStyle(theme.tertiary)
                    }
                }
            }
            .padding(Space.l)
        }
        .background(theme.background)
        .foregroundStyle(theme.primary)
    }

    private func group<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: title)
            content()
        }
    }
}
