import AstronomyCore
import ObservingKit
import SkyCatalog
import SkySession
import SwiftUI

/// Search and browsing in one place. Typing shows results, and clearing returns to
/// the categories, without a separate screen to manage.
struct ExploreView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let onFind: (ObjectID) -> Void
    let onUpgrade: (ProFeature?) -> Void

    private var model: AppModel { services.model }

    var body: some View {
        @Bindable var bindable = model
        NavigationStack {
            Group {
                if model.searchQuery.trimmingCharacters(in: .whitespaces).isEmpty {
                    browse
                } else {
                    results
                }
            }
            .background(theme.background)
            .navigationTitle("Explore")
            .navigationDestination(for: ObjectID.self) { id in
                ObjectDetailView(id: id, onFind: find)
            }
            .navigationDestination(for: ExploreCategory.self) { category in
                CategoryList(category: category, onUpgrade: onUpgrade)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .searchable(text: $bindable.searchQuery, placement: .navigationBarDrawer(displayMode: .always), prompt: "Star, planet, M31, NGC 7000…")
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
        }
    }

    private func find(_ id: ObjectID) {
        model.recordRecentSearch(id)
        onFind(id)
    }

    private var results: some View {
        List {
            if model.searchResults.isEmpty {
                StateMessage(
                    systemImage: "magnifyingglass", title: "No Matches",
                    message: "Try a name such as Vega, or a catalog number such as M42, NGC 7000 or HIP 91262."
                )
                .skyRow(theme)
            }
            ForEach(ObjectCategory.allCases, id: \.self) { category in
                let hits = model.searchResults.filter { $0.category == category }
                if !hits.isEmpty {
                    Section(category.rawValue) {
                        ForEach(hits) { hit in
                            if let object = model.object(hit.id) {
                                NavigationLink(value: hit.id) {
                                    ObjectRow(object: object, subtitle: hit.matchedAlias ?? object.type.displayName)
                                }
                                .skyRow(theme)
                                .accessibilityIdentifier("result-\(hit.name)")
                            }
                        }
                    }
                }
            }
        }
        .skyList()
    }

    private var browse: some View {
        List {
            if !model.document.recents.items.isEmpty {
                Section {
                    ForEach(model.document.recents.items, id: \.self) { id in
                        if let object = model.object(id) {
                            NavigationLink(value: id) { ObjectRow(object: object) }
                                .skyRow(theme)
                        }
                    }
                } header: {
                    HStack {
                        Text("Recent")
                        Spacer()
                        Button("Clear") { model.clearRecentSearches() }
                            .font(.footnote)
                    }
                }
            }
            Section("Browse") {
                ForEach(ExploreCategory.allCases, id: \.self) { category in
                    NavigationLink(value: category) {
                        HStack(spacing: Space.m) {
                            Image(systemName: category.symbol)
                                .font(.system(size: 15, weight: .light))
                                .foregroundStyle(theme.accent)
                                .frame(width: 28)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(category.title).foregroundStyle(theme.primary)
                                Text(category.subtitle).font(Typography.caption).foregroundStyle(theme.secondary)
                            }
                        }
                        .padding(.vertical, Space.xs)
                    }
                    .skyRow(theme)
                }
            }
        }
        .skyList()
    }
}

enum ExploreCategory: String, CaseIterable, Hashable {
    case tonightsBest, planets, moon, constellations, brightStars, deepSky, satellites, upcoming, favorites

    var title: String {
        switch self {
        case .tonightsBest: "Tonight's Best"
        case .planets: "Planets"
        case .moon: "The Moon"
        case .constellations: "Constellations"
        case .brightStars: "Bright Stars"
        case .deepSky: "Deep Sky"
        case .satellites: "Satellites"
        case .upcoming: "Upcoming Events"
        case .favorites: "Favorites"
        }
    }

    var subtitle: String {
        switch self {
        case .tonightsBest: "Worth seeing from where you are"
        case .planets: "Where each one is now"
        case .moon: "Phase and position"
        case .constellations: "All 88"
        case .brightStars: "The named stars"
        case .deepSky: "Galaxies, nebulae and clusters"
        case .satellites: "ISS and other bright satellites"
        case .upcoming: "Eclipses, showers, conjunctions"
        case .favorites: "Your saved objects"
        }
    }

    var symbol: String {
        switch self {
        case .tonightsBest: "sparkles"
        case .planets: "circle.circle"
        case .moon: "moon"
        case .constellations: "point.3.connected.trianglepath.dotted"
        case .brightStars: "sparkle"
        case .deepSky: "hurricane"
        case .satellites: "satellite"
        case .upcoming: "calendar"
        case .favorites: "star"
        }
    }
}

private struct CategoryList: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    let category: ExploreCategory
    let onUpgrade: (ProFeature?) -> Void

    private var model: AppModel { services.model }

    var body: some View {
        List {
            switch category {
            case .tonightsBest:
                if let plan = model.tonight, !plan.recommendations.isEmpty {
                    ForEach(plan.recommendations) { r in
                        row(r.object, subtitle: r.reasons.first)
                    }
                } else {
                    StateMessage(systemImage: "moon.stars", title: "Nothing Yet", message: "Recommendations appear once tonight has been calculated for your location.")
                        .skyRow(theme)
                }
            case .planets:
                ForEach(SolarSystemBody.planets, id: \.self) { body in
                    row(Catalog.object(for: body), subtitle: visibilityLine(Catalog.object(for: body)))
                }
            case .moon:
                row(Catalog.object(for: .moon), subtitle: moonLine)
            case .constellations:
                ForEach(model.catalog?.constellations.sorted { $0.name < $1.name } ?? []) { c in
                    if let object = model.catalog?.object(for: c) {
                        row(object, subtitle: c.meaning)
                    }
                }
            case .brightStars:
                ForEach(model.catalog?.namedStars(limit: 150) ?? []) { s in
                    row(s, subtitle: s.constellation.flatMap { model.catalog?.constellation($0)?.name }, trailing: s.magnitude.map(AstroFormat.magnitude))
                }
            case .deepSky:
                ForEach(model.visibleDeepSky.prefix(300)) { d in
                    row(d, subtitle: d.type.displayName, trailing: d.magnitude.map { String(format: "%.1f", $0) })
                }
                if !model.hasAccess(to: .fullDeepSkyCatalog) {
                    Button("Unlock the full NGC and IC catalog") { onUpgrade(.fullDeepSkyCatalog) }
                        .skyRow(theme)
                }
            case .satellites:
                SatelliteSection(onUpgrade: onUpgrade)
            case .upcoming:
                if model.events.isEmpty {
                    StateMessage(systemImage: "calendar", title: "Calculating", message: "Upcoming events appear here shortly.")
                        .skyRow(theme)
                }
                ForEach(model.events.filter(\.isSignificant).prefix(30)) { e in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(e.title).foregroundStyle(theme.primary)
                        Text(e.date.formatted(date: .abbreviated, time: .shortened))
                            .font(Typography.data)
                            .foregroundStyle(theme.secondary)
                    }
                    .skyRow(theme)
                }
            case .favorites:
                if model.document.favorites.isEmpty {
                    StateMessage(systemImage: "star", title: "No Favorites Yet", message: "Tap the star on any object to keep it here.")
                        .skyRow(theme)
                }
                ForEach(model.document.favorites) { f in
                    if let object = model.object(f.objectID) { row(object) }
                }
            }
        }
        .skyList()
        .navigationTitle(category.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func row(_ object: SkyObject, subtitle: String? = nil, trailing: String? = nil) -> some View {
        NavigationLink(value: object.id) {
            ObjectRow(object: object, subtitle: subtitle, trailing: trailing)
        }
        .skyRow(theme)
    }

    private func visibilityLine(_ object: SkyObject) -> String? {
        guard let observer = model.observer else { return nil }
        return (try? Locator.locate(object, at: model.skyDate, observer: observer))?.explanation
    }

    private var moonLine: String? {
        (try? MoonPhase.at(AstroTime(model.skyDate))).map {
            "\($0.name.rawValue), \(Int(($0.illuminatedFraction * 100).rounded()))% lit"
        }
    }
}
