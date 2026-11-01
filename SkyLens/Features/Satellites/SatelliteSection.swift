import AstronomyCore
import Satellites
import SkyCatalog
import SkySession
import SwiftUI

/// Satellites and passes inside Explore. Everything shown here comes from published
/// orbital elements, so the empty and stale cases say so instead of showing anything.
struct SatelliteSection: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    let onUpgrade: (ProFeature?) -> Void

    private var model: AppModel { services.model }
    private var zone: TimeZone { model.location?.timeZone ?? .current }

    var body: some View {
        if model.satellites.isEmpty {
            StateMessage(
                systemImage: "satellite", title: "No Orbit Data",
                message: model.satelliteError ?? "Connect to the internet to load satellite orbits.",
                actionTitle: "Try Again", action: { Task { await model.refreshSatellites() } }
            )
            .skyRow(theme)
        } else {
            if let warning = worstFreshness.warning {
                Label(warning, systemImage: "exclamationmark.triangle")
                    .font(Typography.caption)
                    .foregroundStyle(theme.warning)
                    .skyRow(theme)
            }

            if model.hasAccess(to: .satellitePasses) {
                Section("Upcoming Passes") {
                    let passes = model.upcomingPasses(days: 3)
                    if passes.isEmpty {
                        Text(worstFreshness.canPredict ? "No passes above 10° in the next three days." : "Predictions are off until orbit data is refreshed.")
                            .font(Typography.caption)
                            .foregroundStyle(theme.secondary)
                            .skyRow(theme)
                    }
                    ForEach(passes, id: \.pass.id) { entry in
                        passRow(entry.name, entry.pass)
                    }
                }
            } else {
                Button("See predicted passes with Pro") { onUpgrade(.satellitePasses) }
                    .skyRow(theme)
            }

            Section("Tracked") {
                ForEach(model.satellites) { e in
                    NavigationLink(value: ObjectID.satellite(norad: e.noradID)) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(e.name).foregroundStyle(theme.primary)
                            Text("NORAD \(e.noradID)").font(Typography.data).foregroundStyle(theme.tertiary)
                        }
                    }
                    .skyRow(theme)
                }
            }
        }
    }

    /// The set is refreshed as one, so the oldest entry speaks for all of it.
    private var worstFreshness: ElementFreshness {
        let oldest = model.satellites.map(\.epoch).min() ?? model.now
        return ElementFreshness(epoch: oldest, now: model.now)
    }

    private func passRow(_ name: String, _ pass: SatellitePass) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(name).foregroundStyle(theme.primary)
                Spacer()
                Text(pass.isVisible ? "Visible" : "Not sunlit")
                    .font(Typography.caption)
                    .foregroundStyle(pass.isVisible ? theme.accent : theme.tertiary)
            }
            Text(pass.rise.formatted(Date.FormatStyle(date: .abbreviated, time: .shortened, timeZone: zone)))
                .font(Typography.data)
                .foregroundStyle(theme.secondary)
            Text("\(CompassPoint(azimuth: pass.riseAzimuth).rawValue) → \(CompassPoint(azimuth: pass.setAzimuth).rawValue), up to \(Int(pass.maxAltitude.rounded()))°")
                .font(Typography.caption)
                .foregroundStyle(theme.tertiary)
        }
        .skyRow(theme)
        .accessibilityElement(children: .combine)
    }
}
