import AstronomyCore
import ObservingKit
import SkyCatalog
import SkySession
import SwiftUI

/// "What is worth looking at tonight, where I am?"
struct TonightView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let onFind: (ObjectID) -> Void
    let onUpgrade: (ProFeature?) -> Void

    private var model: AppModel { services.model }
    private var zone: TimeZone { model.location?.timeZone ?? .current }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Space.xl) {
                    SheetHeader(title: "Tonight")
                    Text("\(model.location?.name ?? "") · \(model.skyDate.formatted(Date.FormatStyle(date: .complete, time: .omitted, timeZone: zone)))")
                        .font(Typography.caption)
                        .foregroundStyle(theme.secondary)
                        .padding(.top, -Space.l)

                    if let plan = model.tonight {
                        darkness(plan)
                        moon(plan)
                        weather(plan)
                        recommendations(plan)
                    } else {
                        ProgressView().frame(maxWidth: .infinity).padding(Space.xxl)
                    }
                }
                .padding(Space.l)
            }
            .background(theme.background)
            .navigationDestination(for: ObjectID.self) { id in
                ObjectDetailView(id: id, onFind: onFind)
            }
            .task(id: model.skyDate.formatted(date: .numeric, time: .omitted)) {
                await model.refreshWeather()
                await model.refreshTonight()
            }
        }
    }

    private func time(_ date: Date?) -> String? {
        date?.formatted(Date.FormatStyle(date: .omitted, time: .shortened, timeZone: zone))
    }

    private func darkness(_ plan: TonightPlan) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Darkness")
            switch plan.night.condition {
            case .polarDay:
                note("The Sun stays up all night at this time of year.")
            case .polarNight:
                note("The Sun stays down all day, so the sky is dark for a long stretch.")
            case .noAstronomicalDarkness:
                note("The sky never gets fully dark tonight. Faint objects will be hard to see.")
            case .normal:
                EmptyView()
            }
            RuledGroup {
                row("Sunset", time(plan.night.sunset))
                row("Civil twilight ends", time(plan.night.civilDusk))
                row("Nautical twilight ends", time(plan.night.nauticalDusk))
                row("Astronomical night begins", time(plan.night.astronomicalDusk))
                row("Astronomical night ends", time(plan.night.astronomicalDawn))
                row("Sunrise", time(plan.night.sunrise))
            }
        }
    }

    @ViewBuilder
    private func row(_ label: String, _ value: String?) -> some View {
        if let value { DataRow(label: label, value: value) }
    }

    private func note(_ text: String) -> some View {
        Text(text)
            .font(.subheadline)
            .foregroundStyle(theme.secondary)
    }

    private func moon(_ plan: TonightPlan) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Moon")
            RuledGroup {
                DataRow(label: "Phase", value: plan.moon.name.rawValue)
                DataRow(label: "Illuminated", value: "\(Int((plan.moon.illuminatedFraction * 100).rounded()))%")
                row("Rises", time(plan.moonRise))
                row("Sets", time(plan.moonSet))
                DataRow(label: "Moon-free darkness", value: "\(Int((plan.moonlessFraction * 100).rounded()))% of tonight")
            }
        }
    }

    /// Astronomy above stays correct whatever happens here, so a missing forecast only
    /// ever affects this section.
    @ViewBuilder
    private func weather(_ plan: TonightPlan) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Clouds")
            switch model.weather {
            case .notConfigured:
                note("No weather source is set up.")
            case .unavailable(let reason):
                note(reason)
            case .available(let forecast):
                if let cloud = plan.meanCloudCover {
                    RuledGroup {
                        DataRow(label: "Tonight", value: "\(SkyConditions.describe(cloudCover: cloud)), about \(Int(cloud.rounded()))% cloud")
                        if model.hasAccess(to: .fullTonightPlanner) {
                            ForEach(plan.observingWindows, id: \.start) { w in
                                DataRow(label: "Clearer window", value: "\(time(w.start) ?? "") – \(time(w.end) ?? "")")
                            }
                        }
                    }
                    Text("Forecasts change. Check again closer to the time.")
                        .font(Typography.caption)
                        .foregroundStyle(theme.tertiary)
                } else {
                    note("The forecast doesn't reach this date yet.")
                }
                Text(forecast.attribution)
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)
            }
        }
    }

    @ViewBuilder
    private func recommendations(_ plan: TonightPlan) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Worth Seeing")
            if plan.recommendations.isEmpty {
                note("Nothing suitable tonight, because the sky doesn't get dark enough.")
            }
            ForEach(plan.recommendations) { r in
                NavigationLink(value: r.object.id) {
                    recommendationCard(r)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("recommendation-\(r.object.name)")
            }
            if !model.hasAccess(to: .fullTonightPlanner) {
                Button("See every recommendation with Pro") { onUpgrade(.fullTonightPlanner) }
                    .font(.subheadline)
            }
        }
    }

    private func recommendationCard(_ r: Recommendation) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            HStack(spacing: Space.m) {
                ObjectGlyph(type: r.object.type)
                VStack(alignment: .leading, spacing: 2) {
                    Text(r.object.name)
                        .font(.headline)
                        .foregroundStyle(theme.primary)
                    Text("Best around \(time(r.bestTime) ?? ""), \(Int(r.maxAltitude.rounded()))° high in the \(CompassPoint(azimuth: r.azimuthAtBest).name)")
                        .font(Typography.caption)
                        .foregroundStyle(theme.secondary)
                }
                Spacer(minLength: 0)
            }
            ForEach(r.reasons.dropFirst(), id: \.self) { reason in
                Label(reason, systemImage: "checkmark")
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)
            }
            ForEach(r.cautions, id: \.self) { caution in
                Label(caution, systemImage: "exclamationmark.triangle")
                    .font(Typography.caption)
                    .foregroundStyle(theme.warning)
            }
        }
        .padding(Space.m)
        .frame(maxWidth: .infinity, alignment: .leading)
        .skyPanel(cornerRadius: 14)
        .accessibilityElement(children: .combine)
    }
}
