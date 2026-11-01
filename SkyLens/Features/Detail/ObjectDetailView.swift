import AstronomyCore
import SkyCatalog
import SkySession
import SwiftUI

/// One reusable detail page. Sections adapt to the object's category, and rows appear
/// only for values that exist, so nothing is padded with blanks.
struct ObjectDetailView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let id: ObjectID
    let onFind: (ObjectID) -> Void

    private var model: AppModel { services.model }
    private var zone: TimeZone { model.location?.timeZone ?? .current }

    var body: some View {
        Group {
            if let object = model.object(id) {
                content(object)
            } else {
                StateMessage(systemImage: "questionmark.circle", title: "Not Available", message: "This object's data couldn't be found.")
            }
        }
        .background(theme.background)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Done") { dismiss() }
            }
        }
    }

    private func content(_ object: SkyObject) -> some View {
        ScrollView {
            // Positions refresh with the shared clock, including during time travel.
            TimelineView(.periodic(from: .now, by: 5)) { _ in
                let observation = observe(object)
                VStack(alignment: .leading, spacing: Space.xl) {
                    ObjectHero(object: object, illumination: observation?.illuminatedFraction)
                        .padding(.horizontal, -Space.l)
                        .padding(.bottom, -Space.m)
                    overview(object)
                    actions(object, observation: observation)
                    if let observation { visibility(observation) }
                    properties(object, observation: observation)
                    if object.type == .constellation, let c = constellation(object) {
                        constellationSection(c)
                    }
                    observing(object)
                    learn(object)
                }
                .padding(Space.l)
            }
        }
    }

    private func observe(_ object: SkyObject) -> ObjectObservation? {
        guard let observer = model.observer else { return nil }
        return try? Locator.observe(object, at: model.skyDate, observer: observer, tracker: services.sky.tracker(for: id))
    }

    private func constellation(_ object: SkyObject) -> Constellation? {
        if case .constellation(let abbreviation) = object.id.kind {
            return model.catalog?.constellation(abbreviation)
        }
        return nil
    }

    // MARK: Overview

    private func overview(_ object: SkyObject) -> some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text(object.type.displayName.uppercased())
                .font(Typography.eyebrow)
                .tracking(1.2)
                .foregroundStyle(theme.accent)
            Text(object.name)
                .font(Typography.objectTitle)
                .foregroundStyle(theme.primary)
                .accessibilityIdentifier("detailTitle")
            if !object.designations.isEmpty {
                Text(object.designations.prefix(4).joined(separator: "  ·  "))
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)
            }
            Text(summary(object))
                .font(.body)
                .foregroundStyle(theme.secondary)
                .padding(.top, Space.xs)
        }
    }

    private func summary(_ object: SkyObject) -> String {
        guard let catalog = model.catalog else { return "" }
        if let body = object.solarSystemBody, let text = catalog.editorial(for: body)?.summary { return text }
        if let c = constellation(object), let meaning = c.meaning { return "\(meaning)." }
        if let note = catalog.editorial(for: object)?.note { return note }
        if object.type == .satellite { return "An artificial satellite tracked from published orbital data." }
        return ObjectDescriber.describe(object, in: catalog)
    }

    // MARK: Actions

    private func actions(_ object: SkyObject, observation: ObjectObservation?) -> some View {
        HStack(spacing: Space.s) {
            Button {
                onFind(object.id)
            } label: {
                Label("Find in Sky", systemImage: "scope")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(theme.background)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(theme.accent, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("findInSkyButton")

            let isFavorite = model.isFavorite(object.id)
            Button {
                model.toggleFavorite(object.id)
            } label: {
                Image(systemName: isFavorite ? "star.fill" : "star")
                    .foregroundStyle(isFavorite ? theme.accent : theme.primary)
                    .frame(width: 44, height: 44)
                    .skyPanel(cornerRadius: 12)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isFavorite ? "Remove from Favorites" : "Add to Favorites")
            .accessibilityIdentifier("favoriteButton")
            .sensoryFeedback(.success, trigger: isFavorite)

            ShareLink(item: shareText(object, observation: observation)) {
                Image(systemName: "square.and.arrow.up")
                    .foregroundStyle(theme.primary)
                    .frame(width: 44, height: 44)
                    .skyPanel(cornerRadius: 12)
            }
            .accessibilityLabel("Share")
        }
    }

    private func shareText(_ object: SkyObject, observation: ObjectObservation?) -> String {
        var text = object.name
        if let e = observation?.location.explanation { text += ": \(e)" }
        return text + " Seen with SkyLens."
    }

    // MARK: Visibility

    private func visibility(_ o: ObjectObservation) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Right Now")
            Text(o.location.explanation)
                .font(.subheadline)
                .foregroundStyle(theme.secondary)
                .accessibilityIdentifier("visibilityExplanation")
            RuledGroup {
                if let h = o.location.horizontal {
                    DataRow(label: "Altitude", value: AstroFormat.altitude(h.altitude))
                    DataRow(label: "Azimuth", value: AstroFormat.azimuth(h.azimuth))
                }
                if let rise = o.location.nextRise {
                    DataRow(label: "Next rise", value: dateText(rise))
                }
                if let e = o.riseTransitSet {
                    switch e.circumstance {
                    case .alwaysUp:
                        DataRow(label: "Today", value: "Stays above the horizon")
                    case .alwaysDown:
                        DataRow(label: "Today", value: "Stays below the horizon")
                    case .normal:
                        if let t = e.rise { DataRow(label: "Rises", value: timeText(t)) }
                        if let t = e.transit { DataRow(label: "Highest", value: timeText(t)) }
                        if let t = e.set { DataRow(label: "Sets", value: timeText(t)) }
                    }
                }
            }
        }
    }

    private func timeText(_ date: Date) -> String {
        date.formatted(Date.FormatStyle(date: .omitted, time: .shortened, timeZone: zone))
    }

    private func dateText(_ date: Date) -> String {
        date.formatted(Date.FormatStyle(date: .abbreviated, time: .shortened, timeZone: zone))
    }

    // MARK: Properties

    private func properties(_ object: SkyObject, observation o: ObjectObservation?) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Properties")
            RuledGroup {
                if let c = o?.constellation ?? object.constellation, let name = model.catalog?.constellation(c)?.name {
                    DataRow(label: "Constellation", value: name)
                }
                if let m = o?.magnitude ?? object.magnitude {
                    DataRow(label: "Apparent magnitude", value: AstroFormat.magnitude(m))
                }
                if let au = o?.distanceAU {
                    DataRow(label: "Distance", value: AstroFormat.distance(au: au, imperial: model.preferences.units == .imperial))
                }
                if let ly = object.star?.distanceLightYears ?? object.deepSky?.distanceLightYears {
                    DataRow(label: "Distance", value: (object.deepSky != nil ? "≈ " : "") + AstroFormat.distance(lightYears: ly))
                }
                if let d = o?.angularDiameter {
                    DataRow(label: "Apparent size", value: AstroFormat.angularSize(degrees: d))
                }
                if let major = object.deepSky?.majorAxis {
                    DataRow(label: "Apparent size", value: AstroFormat.angularSize(degrees: major / 60))
                }
                if let f = o?.illuminatedFraction {
                    DataRow(label: "Illuminated", value: "\(Int((f * 100).rounded()))%")
                }
                if let sp = object.star?.spectralType {
                    DataRow(label: "Spectral type", value: sp)
                }
                if let bv = object.star?.colorIndex {
                    DataRow(label: "Temperature", value: "\(Int(StarColor.temperature(colorIndex: bv) / 100) * 100) K")
                }
                if let e = o?.j2000 {
                    DataRow(label: "Right ascension (J2000)", value: AstroFormat.rightAscension(e.rightAscension))
                    DataRow(label: "Declination (J2000)", value: AstroFormat.declination(e.declination))
                }
                if let body = object.solarSystemBody, let facts = model.catalog?.editorial(for: body)?.facts {
                    ForEach(facts, id: \.label) { DataRow(label: $0.label, value: $0.value) }
                }
            }
        }
    }

    private func constellationSection(_ c: Constellation) -> some View {
        VStack(alignment: .leading, spacing: Space.m) {
            SectionHeader(title: "Finding It")
            RuledGroup {
                DataRow(label: "Latin genitive", value: c.genitive)
                DataRow(label: "Best evenings", value: Calendar.current.monthSymbols[c.bestEveningMonth - 1])
                if let latitude = model.observer?.latitude {
                    DataRow(label: "From your latitude", value: c.isVisible(fromLatitude: latitude) ? "Visible" : "Stays too low")
                }
            }
        }
    }

    // MARK: Observing and Learn

    @ViewBuilder
    private func observing(_ object: SkyObject) -> some View {
        if let text = observingAdvice(object) {
            VStack(alignment: .leading, spacing: Space.s) {
                SectionHeader(title: "Observing")
                Text(text)
                    .font(.subheadline)
                    .foregroundStyle(theme.secondary)
            }
        }
    }

    private func observingAdvice(_ object: SkyObject) -> String? {
        if let body = object.solarSystemBody { return model.catalog?.editorial(for: body)?.observing }
        guard let m = object.magnitude else { return nil }
        if object.type == .star {
            return m <= 5.5 ? "Visible to the naked eye from a reasonably dark site." : "Too faint for the naked eye. Binoculars or a telescope will show it."
        }
        if object.type.isDeepSky {
            switch m {
            case ..<4.5: return "Visible to the naked eye from a dark site, and lovely in binoculars."
            case ..<8: return "A good binocular object, and better still in a small telescope."
            default: return "Best in a telescope, from somewhere dark, with the Moon out of the way."
            }
        }
        return nil
    }

    @ViewBuilder
    private func learn(_ object: SkyObject) -> some View {
        if let body = object.solarSystemBody, let text = model.catalog?.editorial(for: body)?.learn {
            VStack(alignment: .leading, spacing: Space.s) {
                SectionHeader(title: "Learn")
                Text(text)
                    .font(.body)
                    .foregroundStyle(theme.secondary)
            }
        }
    }
}
