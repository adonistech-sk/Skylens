import ObservingKit
import SkySession
import SwiftUI
import UIKit
import UserData

struct SettingsView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let onUpgrade: (ProFeature?) -> Void

    private var model: AppModel { services.model }

    var body: some View {
        NavigationStack {
            List {
                Section("Location") {
                    NavigationLink {
                        LocationPicker { saved in
                            model.setLocation(saved)
                        }
                    } label: {
                        LabeledContent("Observing From", value: model.location?.name ?? "Not Set")
                    }
                    .accessibilityIdentifier("locationRow")
                    NavigationLink("Dark-Sky Map") {
                        DarkSkyMapView(onUpgrade: onUpgrade)
                    }
                }
                .skyRow(theme)

                Section("Observing") {
                    Picker("Experience", selection: Binding(
                        get: { model.preferences.experience },
                        set: { value in model.updatePreferences { $0.experience = value } }
                    )) {
                        Text("Beginner").tag(Experience.beginner)
                        Text("Enthusiast").tag(Experience.enthusiast)
                    }
                    ForEach(Equipment.allCases, id: \.self) { item in
                        Toggle(item.displayName, isOn: Binding(
                            get: { model.preferences.equipment.contains(item) },
                            set: { on in
                                model.updatePreferences {
                                    if on { $0.equipment.insert(item) } else { $0.equipment.remove(item) }
                                }
                            }
                        ))
                    }
                    Picker("Units", selection: Binding(
                        get: { model.preferences.units },
                        set: { value in model.updatePreferences { $0.units = value } }
                    )) {
                        Text("Metric").tag(DistanceUnits.metric)
                        Text("Imperial").tag(DistanceUnits.imperial)
                    }
                }
                .skyRow(theme)

                Section("Display") {
                    Toggle("Night Vision", isOn: model.display(\.nightVision))
                        .accessibilityIdentifier("settingsNightVisionToggle")
                    NavigationLink("Sky Appearance") {
                        AppearancePanel(onUpgrade: onUpgrade)
                    }
                }
                .skyRow(theme)

                NotificationSettings()
                    .skyRow(theme)

                Section("SkyLens Pro") {
                    subscriptionRow
                    Button("Restore Purchases") {
                        Task { await services.store.restore() }
                    }
                    if let message = services.store.message {
                        Text(message).font(Typography.caption).foregroundStyle(theme.warning)
                    }
                }
                .skyRow(theme)

                Section("About") {
                    NavigationLink("Data Sources and Credits") { DataSourcesView() }
                    NavigationLink("Open-Source Licenses") { LicensesView() }
                    if let notice = model.persistenceNotice {
                        Text(notice).font(Typography.caption).foregroundStyle(theme.warning)
                    }
                }
                .skyRow(theme)
            }
            .skyList()
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    @ViewBuilder
    private var subscriptionRow: some View {
        if model.subscription.hasProAccess {
            LabeledContent("Status", value: "Active")
            if let notice = model.subscription.notice {
                Text(notice).font(Typography.caption).foregroundStyle(theme.warning)
            }
        } else {
            Button("See What's in Pro") { onUpgrade(nil) }
                .accessibilityIdentifier("seeProButton")
            if let notice = model.subscription.notice {
                Text(notice).font(Typography.caption).foregroundStyle(theme.warning)
            }
        }
    }
}

/// Alerts are off until asked for, and asking is what triggers the system prompt.
private struct NotificationSettings: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    private var model: AppModel { services.model }
    private let kinds: [SkyEvent.Kind] = [.eclipse, .meteorShower, .opposition, .conjunction, .moonPhase]

    var body: some View {
        Section {
            Toggle("Sky Alerts", isOn: Binding(
                get: { model.preferences.notifications.enabled },
                set: { on in
                    model.updatePreferences { $0.notifications.enabled = on }
                    Task {
                        if on { await services.notifications.requestAuthorization() }
                        await services.notifications.schedule(model.plannedAlerts)
                    }
                }
            ))
            .accessibilityIdentifier("alertsToggle")

            if services.notifications.isDenied {
                Button("Allow Notifications in Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .font(.subheadline)
            }

            if model.preferences.notifications.enabled {
                ForEach(kinds, id: \.self) { kind in
                    Toggle(kind.displayName, isOn: Binding(
                        get: { model.preferences.notifications.kinds.contains(kind.rawValue) },
                        set: { on in
                            model.updatePreferences {
                                if on { $0.notifications.kinds.insert(kind.rawValue) } else { $0.notifications.kinds.remove(kind.rawValue) }
                            }
                            Task { await services.notifications.schedule(model.plannedAlerts) }
                        }
                    ))
                }
                Picker("Remind Me", selection: Binding(
                    get: { model.preferences.notifications.leadMinutes },
                    set: { value in
                        model.updatePreferences { $0.notifications.leadMinutes = value }
                        Task { await services.notifications.schedule(model.plannedAlerts) }
                    }
                )) {
                    Text("15 minutes before").tag(15)
                    Text("1 hour before").tag(60)
                    Text("1 day before").tag(1440)
                }
            }
        } header: {
            Text("Alerts")
        } footer: {
            Text("Alerts are worked out on your device from the times in the sky. They don't take clouds into account.")
        }
    }
}

/// Manual place entry is always available, and it needs no location permission.
struct LocationPicker: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let onPick: (SavedLocation) -> Void

    @State private var query = ""
    @State private var results: [SavedLocation] = []
    @State private var isSearching = false
    @State private var latitude = ""
    @State private var longitude = ""
    @State private var isNamingCoordinates = false

    private var saved: [SavedLocation] { services.model.preferences.savedLocations }

    var body: some View {
        List {
            Section {
                Button {
                    Task {
                        if let location = await services.location.requestCurrentLocation() { choose(location) }
                    }
                } label: {
                    Label("Use Current Location", systemImage: "location")
                }
                .accessibilityIdentifier("useCurrentLocation")
                if services.location.isDenied {
                    Text("Location access is off for SkyLens. You can search for a place below, or turn it on in Settings.")
                        .font(Typography.caption)
                        .foregroundStyle(theme.secondary)
                }
                if case .failed(let reason) = services.location.state {
                    Text(reason).font(Typography.caption).foregroundStyle(theme.warning)
                }
            }
            .skyRow(theme)

            if !results.isEmpty {
                Section("Results") {
                    ForEach(results) { result in
                        Button(result.name) { choose(result) }
                            .accessibilityIdentifier("place-\(result.name)")
                    }
                }
                .skyRow(theme)
            } else if isSearching {
                ProgressView().frame(maxWidth: .infinity).skyRow(theme)
            } else if !query.isEmpty {
                Text("No places found. You can also enter coordinates below.")
                    .font(Typography.caption)
                    .foregroundStyle(theme.secondary)
                    .skyRow(theme)
            }

            if !saved.isEmpty {
                Section("Saved") {
                    ForEach(saved) { place in
                        Button(place.name) { choose(place) }
                    }
                    .onDelete { offsets in
                        for place in offsets.map({ saved[$0] }) { services.model.removeSavedLocation(place.id) }
                    }
                }
                .skyRow(theme)
            }

            Section("Coordinates") {
                TextField("Latitude, such as 52.23", text: $latitude)
                    .keyboardType(.numbersAndPunctuation)
                    .accessibilityIdentifier("latitudeField")
                TextField("Longitude, such as 21.01", text: $longitude)
                    .keyboardType(.numbersAndPunctuation)
                    .accessibilityIdentifier("longitudeField")
                Button("Use These Coordinates", action: useCoordinates)
                    .disabled(coordinates == nil)
                    .accessibilityIdentifier("useCoordinates")
            }
            .skyRow(theme)
        }
        .skyList()
        .navigationTitle("Location")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $query, prompt: "City or place")
        .task(id: query) {
            guard !query.isEmpty else {
                results = []
                return
            }
            isSearching = true
            try? await Task.sleep(for: .milliseconds(350)) // Debounce keystrokes.
            guard !Task.isCancelled else { return }
            results = await services.location.search(query)
            isSearching = false
        }
    }

    private var coordinates: (Double, Double)? {
        guard let lat = Double(latitude.replacingOccurrences(of: ",", with: ".")),
              let lon = Double(longitude.replacingOccurrences(of: ",", with: ".")),
              (-90...90).contains(lat), (-180...180).contains(lon) else { return nil }
        return (lat, lon)
    }

    private func useCoordinates() {
        guard let (lat, lon) = coordinates, !isNamingCoordinates else { return }
        isNamingCoordinates = true
        Task {
            choose(await services.location.place(latitude: lat, longitude: lon))
            isNamingCoordinates = false
        }
    }

    private func choose(_ place: SavedLocation) {
        services.model.addSavedLocation(place)
        onPick(place)
        dismiss()
    }
}

/// Full license texts, which the BSD and MIT terms require to ship with the binary.
struct LicensesView: View {
    @Environment(\.theme) private var theme

    private var text: String {
        Bundle.main.url(forResource: "ThirdPartyNotices", withExtension: "txt")
            .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? "License text is unavailable."
    }

    var body: some View {
        ScrollView {
            Text(text)
                .font(.caption.monospaced())
                .foregroundStyle(theme.secondary)
                .padding(Space.l)
        }
        .background(theme.background)
        .navigationTitle("Licenses")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DataSourcesView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    var body: some View {
        List {
            if let provenance = services.model.catalog?.provenance {
                Section("Bundled Catalogs") {
                    ForEach(provenance.sources) { source in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(source.name).foregroundStyle(theme.primary)
                            Text(source.use).font(Typography.caption).foregroundStyle(theme.secondary)
                        }
                    }
                }
                .skyRow(theme)
            }
            Section("Calculations") {
                credit("Astronomy Engine by Don Cross", "Positions, rise and set, phases and eclipses. MIT License.")
                credit("SGP4", "Satellite orbits, after Vallado et al. 2006.")
            }
            .skyRow(theme)
            Section("Live Data") {
                credit("MET Norway", "Weather forecasts, CC BY 4.0.")
                credit("CelesTrak", "Satellite orbital elements.")
                credit("NASA Black Marble", "Night-lights imagery for the Dark-Sky Map.")
                credit("International Meteor Organization", "Meteor shower peak longitudes and rates.")
            }
            .skyRow(theme)
        }
        .skyList()
        .navigationTitle("Data Sources")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func credit(_ title: String, _ detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).foregroundStyle(theme.primary)
            Text(detail).font(Typography.caption).foregroundStyle(theme.secondary)
        }
    }
}
