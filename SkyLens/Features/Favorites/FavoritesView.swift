import AstronomyCore
import PhotosUI
import SkyCatalog
import SkySession
import SwiftUI
import UserData

struct FavoritesView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    let onFind: (ObjectID) -> Void
    let onUpgrade: (ProFeature?) -> Void

    @State private var query = ""
    @State private var editing: SkyTag?

    private var model: AppModel { services.model }

    private var favorites: [SkyObject] {
        let objects = model.document.favorites.compactMap { model.object($0.objectID) }
        guard !query.isEmpty else { return objects }
        return objects.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    private var tags: [SkyTag] {
        guard !query.isEmpty else { return model.document.tags }
        return model.document.tags.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        NavigationStack {
            List {
                if model.document.favorites.isEmpty, model.document.tags.isEmpty {
                    StateMessage(
                        systemImage: "star", title: "Nothing Saved Yet",
                        message: "Tap the star on any object to keep it here. Press and hold on the sky to leave a Sky Tag."
                    )
                    .skyRow(theme)
                }
                if !favorites.isEmpty {
                    Section("Objects") {
                        ForEach(favorites) { object in
                            NavigationLink(value: object.id) { ObjectRow(object: object) }
                                .skyRow(theme)
                                .accessibilityIdentifier("favorite-\(object.name)")
                        }
                        .onDelete { offsets in
                            for object in offsets.map({ favorites[$0] }) { model.toggleFavorite(object.id) }
                        }
                    }
                }
                if !tags.isEmpty {
                    Section("Sky Tags") {
                        ForEach(tags) { tag in
                            Button {
                                editing = tag
                            } label: {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(tag.name).foregroundStyle(theme.primary)
                                    Text(tag.behaviour).font(Typography.caption).foregroundStyle(theme.secondary)
                                    Text(tag.createdAt.formatted(date: .abbreviated, time: .shortened))
                                        .font(Typography.data)
                                        .foregroundStyle(theme.tertiary)
                                }
                                .padding(.vertical, Space.xs)
                            }
                            .skyRow(theme)
                        }
                        .onDelete { offsets in
                            for tag in offsets.map({ tags[$0] }) { model.deleteTag(tag.id) }
                        }
                    }
                }
            }
            .skyList()
            .navigationTitle("Favorites")
            .searchable(text: $query, prompt: "Search saved objects")
            .navigationDestination(for: ObjectID.self) { id in
                ObjectDetailView(id: id, onFind: onFind)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(item: $editing) { tag in
                TagEditor(existing: tag, onUpgrade: onUpgrade)
                    .themedSheet(theme)
                    .environment(services)
            }
        }
    }
}

/// Creates or edits a Sky Tag. The choice of what the tag is pinned to is explicit,
/// and explained, because the two behave completely differently over time.
struct TagEditor: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    private enum Pin: String, CaseIterable, Identifiable {
        case stars = "Among the stars"
        case horizon = "My horizon"
        var id: String { rawValue }
    }

    var direction: Horizontal?
    var existing: SkyTag?
    let onUpgrade: (ProFeature?) -> Void

    @State private var name = ""
    @State private var note = ""
    @State private var color = SkyTag.Color.star
    @State private var pin = Pin.stars
    @State private var photo: PhotosPickerItem?
    @State private var imageFileName: String?

    private var model: AppModel { services.model }

    init(direction: Horizontal? = nil, existing: SkyTag? = nil, onUpgrade: @escaping (ProFeature?) -> Void) {
        self.direction = direction
        self.existing = existing
        self.onUpgrade = onUpgrade
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name", text: $name)
                        .accessibilityIdentifier("tagNameField")
                    TextField("Note", text: $note, axis: .vertical)
                        .lineLimit(2...5)
                }
                if existing == nil {
                    Section {
                        Picker("Pinned to", selection: $pin) {
                            ForEach(Pin.allCases) { Text($0.rawValue).tag($0) }
                        }
                        .pickerStyle(.segmented)
                    } footer: {
                        Text(previewTag.behaviour)
                    }
                } else if let existing {
                    Section {
                        Text(existing.behaviour).font(Typography.caption).foregroundStyle(theme.secondary)
                    }
                }
                Section("Color") {
                    Picker("Color", selection: $color) {
                        ForEach(SkyTag.Color.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }
                Section {
                    PhotosPicker(imageFileName == nil ? "Add Photo" : "Replace Photo", selection: $photo, matching: .images)
                }
                if !model.canAddTag, existing == nil {
                    Section {
                        Button("Add unlimited tags with Pro") { onUpgrade(.unlimitedSkyTags) }
                    } footer: {
                        Text("The free plan keeps up to \(FeatureLimits.freeSkyTags) tags.")
                    }
                }
                if let existing {
                    Section {
                        Button("Delete Tag", role: .destructive) {
                            model.deleteTag(existing.id)
                            dismiss()
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(theme.background)
            .navigationTitle(existing == nil ? "New Sky Tag" : "Edit Sky Tag")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || (existing == nil && !model.canAddTag))
                }
            }
            .onAppear {
                guard let existing else { return }
                name = existing.name
                note = existing.note
                color = existing.color
                imageFileName = existing.imageFileName
            }
            .onChange(of: photo) { _, item in
                Task { await store(item) }
            }
        }
    }

    private var previewTag: SkyTag { SkyTag(name: name, anchor: anchor) }

    private var anchor: SkyTag.Anchor {
        if let existing { return existing.anchor }
        let h = direction ?? Horizontal(azimuth: 0, altitude: 45)
        guard let observer = model.observer else {
            return .celestial(Equatorial(rightAscension: 0, declination: 0))
        }
        switch pin {
        case .horizon:
            return .localDirection(h, observer)
        case .stars:
            let frame = SkyFrame(time: AstroTime(model.skyDate), observer: observer)
            return .celestial(Equatorial(unitVector: frame.j2000(horizontal: h.unitVector)))
        }
    }

    private func store(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self) else { return }
        let fileName = "\(UUID().uuidString).jpg"
        let directory = model.tagImageDirectory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        if (try? data.write(to: directory.appendingPathComponent(fileName))) != nil { imageFileName = fileName }
    }

    private func save() {
        if var tag = existing {
            tag.name = name
            tag.note = note
            tag.color = color
            tag.imageFileName = imageFileName
            model.updateTag(tag)
        } else {
            model.addTag(SkyTag(name: name, note: note, color: color, anchor: anchor, createdAt: model.now, imageFileName: imageFileName))
        }
        dismiss()
    }
}
