import ObservingKit
import SkyCatalog
import SkySession
import SwiftUI

struct EventsView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let onFind: (ObjectID) -> Void

    @State private var filter: SkyEvent.Kind?

    private var model: AppModel { services.model }
    private var zone: TimeZone { model.location?.timeZone ?? .current }

    private var shown: [SkyEvent] {
        model.events.filter { filter == nil ? true : $0.kind == filter }
    }

    private var months: [(title: String, events: [SkyEvent])] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        let groups = Dictionary(grouping: shown) { event in
            calendar.dateComponents([.year, .month], from: event.date)
        }
        return groups.keys.sorted { ($0.year ?? 0, $0.month ?? 0) < ($1.year ?? 0, $1.month ?? 0) }.compactMap { key in
            guard let date = calendar.date(from: key), let events = groups[key] else { return nil }
            return (date.formatted(Date.FormatStyle(timeZone: zone).month(.wide).year()), events)
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Space.s) {
                        chip("All", kind: nil)
                        ForEach(SkyEvent.Kind.allCases, id: \.self) { chip($0.displayName, kind: $0) }
                    }
                    .padding(.horizontal, Space.l)
                    .padding(.vertical, Space.s)
                }

                if let error = model.eventsError {
                    StateMessage(systemImage: "exclamationmark.triangle", title: "Couldn't Calculate Events", message: error)
                } else if model.events.isEmpty {
                    ProgressView().frame(maxHeight: .infinity)
                } else if shown.isEmpty {
                    StateMessage(systemImage: "calendar", title: "Nothing to Show", message: "No events of this kind in the coming year.")
                    Spacer()
                } else {
                    List {
                        ForEach(months, id: \.title) { month in
                            Section(month.title) {
                                ForEach(month.events) { event in
                                    NavigationLink(value: event.id) {
                                        EventRow(event: event, zone: zone)
                                    }
                                    .skyRow(theme)
                                }
                            }
                        }
                    }
                    .skyList()
                }
            }
            .background(theme.background)
            .navigationTitle("Events")
            .navigationDestination(for: String.self) { id in
                if let event = model.events.first(where: { $0.id == id }) {
                    EventDetail(event: event, zone: zone, onFind: onFind)
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .task {
                if model.events.isEmpty { await model.refreshEvents() }
            }
        }
    }

    private func chip(_ title: String, kind: SkyEvent.Kind?) -> some View {
        Button {
            filter = kind
        } label: {
            Text(title)
                .font(Typography.caption)
                .foregroundStyle(filter == kind ? theme.background : theme.primary)
                .padding(.horizontal, Space.m)
                .frame(minHeight: 34)
                .background(filter == kind ? theme.accent : Color.clear, in: Capsule())
                .overlay(Capsule().strokeBorder(theme.stroke, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
    }
}

private struct EventRow: View {
    @Environment(\.theme) private var theme
    let event: SkyEvent
    let zone: TimeZone

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(event.title)
                .foregroundStyle(isHidden ? theme.secondary : theme.primary)
            Text(event.date.formatted(Date.FormatStyle(date: .abbreviated, time: .shortened, timeZone: zone)))
                .font(Typography.data)
                .foregroundStyle(theme.secondary)
            if isHidden {
                Text("Not visible from your location")
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)
            }
        }
        .padding(.vertical, Space.xs)
        .accessibilityElement(children: .combine)
    }

    private var isHidden: Bool {
        if case .notVisible = event.visibility { return true }
        return false
    }
}

private struct EventDetail: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    let event: SkyEvent
    let zone: TimeZone
    let onFind: (ObjectID) -> Void

    @State private var reminderSet = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.l) {
                Text(event.kind.displayName.uppercased())
                    .font(Typography.eyebrow)
                    .tracking(1.2)
                    .foregroundStyle(theme.accent)
                Text(event.title)
                    .font(Typography.objectTitle)
                    .foregroundStyle(theme.primary)
                Text(event.detail)
                    .foregroundStyle(theme.secondary)

                RuledGroup {
                    DataRow(label: "Date", value: event.date.formatted(Date.FormatStyle(date: .long, time: .shortened, timeZone: zone)))
                    if let end = event.endDate {
                        DataRow(label: "Ends", value: end.formatted(Date.FormatStyle(date: .omitted, time: .shortened, timeZone: zone)))
                    }
                }

                switch event.visibility {
                case .visible(let text):
                    Label(text, systemImage: "eye").foregroundStyle(theme.primary).font(.subheadline)
                case .notVisible(let text):
                    Label(text, systemImage: "eye.slash").foregroundStyle(theme.secondary).font(.subheadline)
                case .general:
                    EmptyView()
                }

                Text(event.source.label)
                    .font(Typography.caption)
                    .foregroundStyle(theme.tertiary)

                if let related = event.related.first {
                    SkyPrimaryButton(title: "Find in Sky") { onFind(related) }
                }

                if event.date > Date() {
                    Button(reminderSet ? "Reminder Set" : "Remind Me") {
                        Task { reminderSet = await services.notifications.remind(of: event) }
                    }
                    .disabled(reminderSet)
                    .frame(maxWidth: .infinity, minHeight: 44)
                }
            }
            .padding(Space.l)
        }
        .background(theme.background)
        .navigationBarTitleDisplayMode(.inline)
    }
}
