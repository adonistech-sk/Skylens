import AstronomyCore
import SkySession
import SwiftUI

/// Time controls, on a partial sheet so the sky keeps moving above them.
struct TimeTravelPanel: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    @State private var scrub = 0.0

    private var model: AppModel { services.model }
    private var zone: TimeZone { model.location?.timeZone ?? .current }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.l) {
                SheetHeader(title: "Time Travel")

                TimelineView(.periodic(from: .now, by: 0.25)) { _ in
                    VStack(alignment: .leading, spacing: Space.xs) {
                        Text(model.skyDate.formatted(Date.FormatStyle(date: .complete, time: .omitted, timeZone: zone)))
                            .font(.subheadline)
                            .foregroundStyle(theme.secondary)
                        Text(model.skyDate.formatted(Date.FormatStyle(date: .omitted, time: .standard, timeZone: zone)))
                            .font(.system(.largeTitle, design: .serif).monospacedDigit())
                            .foregroundStyle(model.isLive ? theme.primary : theme.accent)
                            .accessibilityIdentifier("timeTravelClock")
                        moonLine
                    }
                }

                scrubber

                HStack(spacing: Space.s) {
                    stepButton("Back 1 day", "chevron.left.2") { model.stepSky(by: -86_400) }
                    stepButton("Back 1 hour", "chevron.left") { model.stepSky(by: -3600) }
                    Button {
                        model.setRate(model.clock.isPaused() ? 1 : 0)
                    } label: {
                        Image(systemName: model.clock.isPaused() ? "play.fill" : "pause.fill")
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .skyPanel(cornerRadius: 12)
                    }
                    .accessibilityLabel(model.clock.isPaused() ? "Resume" : "Pause")
                    .accessibilityIdentifier("pauseButton")
                    stepButton("Forward 1 hour", "chevron.right") { model.stepSky(by: 3600) }
                    stepButton("Forward 1 day", "chevron.right.2") { model.stepSky(by: 86_400) }
                }
                .buttonStyle(.plain)
                .foregroundStyle(theme.primary)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Space.s) {
                        ForEach(SkyClock.presets.dropFirst(), id: \.rate) { preset in
                            rateChip(preset.label, rate: preset.rate)
                        }
                        rateChip("−1 hr/s", rate: -3600)
                    }
                }

                DatePicker(
                    "Go to date",
                    selection: Binding(get: { model.skyDate }, set: { model.setSkyDate($0) }),
                    in: SkyClock.supportedRange,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .environment(\.timeZone, zone)
                .font(.subheadline)
                .foregroundStyle(theme.secondary)
                .accessibilityIdentifier("datePicker")

                Button {
                    model.resetToNow()
                    scrub = 0
                } label: {
                    Text("Return to Now")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .disabled(model.isLive)
                .accessibilityIdentifier("resetToNowButton")

                Text("Dates from \(AstroTime.supportedYears.lowerBound) to \(AstroTime.supportedYears.upperBound) are supported, the range checked against NASA JPL data.")
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)
            }
            .padding(Space.l)
        }
        .background(theme.background)
    }

    @ViewBuilder
    private var moonLine: some View {
        if let phase = try? MoonPhase.at(AstroTime(model.skyDate)) {
            Text("\(phase.name.rawValue), \(Int((phase.illuminatedFraction * 100).rounded()))% lit")
                .font(Typography.caption)
                .foregroundStyle(theme.tertiary)
        }
    }

    /// Drag to run the sky forward or back through a day around the current time.
    private var scrubber: some View {
        VStack(spacing: Space.xs) {
            // Steps go through the binding, so springing back to centre on release is
            // not itself treated as moving time.
            Slider(
                value: Binding(
                    get: { scrub },
                    set: { value in
                        model.stepSky(by: (value - scrub) * 3600)
                        scrub = value
                    }
                ),
                in: -12...12,
                onEditingChanged: { editing in
                    if !editing { scrub = 0 }
                }
            )
            .accessibilityLabel("Scrub time by hours")
            HStack {
                Text("−12 h"); Spacer(); Text("+12 h")
            }
            .font(Typography.data)
            .foregroundStyle(theme.tertiary)
        }
    }

    private func stepButton(_ label: String, _ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .frame(maxWidth: .infinity, minHeight: 44)
                .skyPanel(cornerRadius: 12)
        }
        .accessibilityLabel(label)
    }

    private func rateChip(_ title: String, rate: Double) -> some View {
        Button {
            model.setRate(rate)
        } label: {
            Text(title)
                .font(Typography.data)
                .foregroundStyle(model.clock.rate == rate ? theme.background : theme.primary)
                .padding(.horizontal, Space.m)
                .frame(minHeight: 36)
                .background(model.clock.rate == rate ? theme.accent : Color.clear, in: Capsule())
                .overlay(Capsule().strokeBorder(theme.stroke, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
    }
}
