import AstronomyCore
import Foundation
import ObservingKit
import SkyCatalog

public struct SavedLocation: Sendable, Hashable, Codable, Identifiable {
    public var id: UUID
    public var name: String
    public var location: ObserverLocation
    /// IANA identifier, stored so local times stay right after travelling.
    public var timeZoneIdentifier: String

    public init(id: UUID = UUID(), name: String, location: ObserverLocation, timeZoneIdentifier: String) {
        self.id = id
        self.name = name
        self.location = location
        self.timeZoneIdentifier = timeZoneIdentifier
    }

    public var timeZone: TimeZone { TimeZone(identifier: timeZoneIdentifier) ?? .current }
}

public enum LabelDensity: String, Sendable, CaseIterable, Codable {
    case few, normal, many

    public var labelLimit: Int {
        switch self {
        case .few: 12
        case .normal: 24
        case .many: 45
        }
    }
}

/// Everything the Sky View draws. Decoding tolerates missing keys so that a new
/// option added in a later version never resets a user's settings.
public struct DisplayOptions: Sendable, Hashable, Codable {
    public var constellationLines = true
    public var constellationBoundaries = false
    public var constellationLabels = true
    public var starLabels = true
    public var planetLabels = true
    public var deepSkyObjects = true
    public var satellites = true
    public var horizon = true
    public var atmosphere = true
    public var azimuthalGrid = false
    public var equatorialGrid = false
    public var nightVision = false
    /// Multiplies star size, 0.6...1.6.
    public var starBrightness = 1.0
    /// Faintest stars drawn at wide zoom.
    public var magnitudeLimit = 6.5
    public var labelDensity = LabelDensity.normal

    public init() {}

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func value<T: Decodable>(_ key: CodingKeys, _ fallback: T) -> T {
            (try? c.decodeIfPresent(T.self, forKey: key)) ?? fallback
        }
        constellationLines = value(.constellationLines, true)
        constellationBoundaries = value(.constellationBoundaries, false)
        constellationLabels = value(.constellationLabels, true)
        starLabels = value(.starLabels, true)
        planetLabels = value(.planetLabels, true)
        deepSkyObjects = value(.deepSkyObjects, true)
        satellites = value(.satellites, true)
        horizon = value(.horizon, true)
        atmosphere = value(.atmosphere, true)
        azimuthalGrid = value(.azimuthalGrid, false)
        equatorialGrid = value(.equatorialGrid, false)
        nightVision = value(.nightVision, false)
        starBrightness = value(.starBrightness, 1.0)
        magnitudeLimit = value(.magnitudeLimit, 6.5)
        labelDensity = value(.labelDensity, LabelDensity.normal)
    }
}

public struct NotificationPreferences: Sendable, Hashable, Codable {
    public var enabled = false
    /// `SkyEvent.Kind` raw values.
    public var kinds: Set<String> = ["eclipse", "meteorShower", "opposition"]
    public var leadMinutes = 60

    public init() {}

    public var eventKinds: Set<SkyEvent.Kind> {
        Set(kinds.compactMap(SkyEvent.Kind.init(rawValue:)))
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        enabled = (try? c.decodeIfPresent(Bool.self, forKey: .enabled)) ?? false
        kinds = (try? c.decodeIfPresent(Set<String>.self, forKey: .kinds)) ?? ["eclipse", "meteorShower", "opposition"]
        leadMinutes = (try? c.decodeIfPresent(Int.self, forKey: .leadMinutes)) ?? 60
    }
}

public enum DistanceUnits: String, Sendable, CaseIterable, Codable {
    case metric, imperial
}

public struct UserPreferences: Sendable, Hashable, Codable {
    public var onboardingCompleted = false
    public var experience = Experience.beginner
    public var equipment: Set<Equipment> = [.nakedEye]
    public var location: SavedLocation?
    public var savedLocations: [SavedLocation] = []
    public var units = DistanceUnits.metric
    public var display = DisplayOptions()
    public var notifications = NotificationPreferences()
    /// Degrees of user compass correction, saved per device.
    public var compassCorrection = 0.0

    public init() {}

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func value<T: Decodable>(_ key: CodingKeys, _ fallback: T) -> T {
            (try? c.decodeIfPresent(T.self, forKey: key)) ?? fallback
        }
        onboardingCompleted = value(.onboardingCompleted, false)
        experience = value(.experience, Experience.beginner)
        equipment = value(.equipment, [.nakedEye])
        location = try? c.decodeIfPresent(SavedLocation.self, forKey: .location)
        savedLocations = value(.savedLocations, [])
        units = value(.units, DistanceUnits.metric)
        display = value(.display, DisplayOptions())
        notifications = value(.notifications, NotificationPreferences())
        compassCorrection = value(.compassCorrection, 0.0)
    }
}

public struct Favorite: Sendable, Hashable, Codable, Identifiable {
    public let objectID: ObjectID
    public let addedAt: Date
    public var id: ObjectID { objectID }

    public init(objectID: ObjectID, addedAt: Date) {
        self.objectID = objectID
        self.addedAt = addedAt
    }
}

public struct SkyTag: Sendable, Hashable, Codable, Identifiable {
    public enum Color: String, Sendable, CaseIterable, Codable {
        case star, ember, aurora, ice, rose
    }

    /// What a tag is pinned to. These three behave very differently over time, which
    /// is why the app must never blur them:
    public enum Anchor: Sendable, Hashable, Codable {
        /// Follows a catalog object, however it moves.
        case object(ObjectID)
        /// A fixed point among the stars. It rises and sets with them, and its local
        /// direction changes constantly.
        case celestial(Equatorial)
        /// A fixed direction above one place on Earth, like "over the barn". The stars
        /// behind it change hour by hour.
        case localDirection(Horizontal, ObserverLocation)
    }

    public var id: UUID
    public var name: String
    public var note: String
    public var color: Color
    public var anchor: Anchor
    public var createdAt: Date
    /// File name within the app's tag image directory.
    public var imageFileName: String?

    public init(
        id: UUID = UUID(), name: String, note: String = "", color: Color = .star,
        anchor: Anchor, createdAt: Date = Date(), imageFileName: String? = nil
    ) {
        self.id = id
        self.name = name
        self.note = note
        self.color = color
        self.anchor = anchor
        self.createdAt = createdAt
        self.imageFileName = imageFileName
    }

    /// Plain statement of how the tag behaves, shown when creating and viewing it.
    public var behaviour: String {
        switch anchor {
        case .object: "Follows this object wherever it goes."
        case .celestial: "Fixed among the stars. It rises and sets with them, so its direction from you keeps changing."
        case .localDirection: "Fixed to this direction from this place. The stars behind it change through the night."
        }
    }
}

public struct RecentSearches: Sendable, Hashable, Codable {
    public private(set) var items: [ObjectID] = []
    public static let limit = 12

    public init() {}

    public mutating func record(_ id: ObjectID) {
        items.removeAll { $0 == id }
        items.insert(id, at: 0)
        if items.count > Self.limit { items.removeLast(items.count - Self.limit) }
    }

    public mutating func clear() { items = [] }
}

/// The document that is persisted. Sky data is reference data and lives in the
/// bundle, so this holds only what the user created.
public struct UserDocument: Sendable, Hashable, Codable {
    public var preferences = UserPreferences()
    public var favorites: [Favorite] = []
    public var tags: [SkyTag] = []
    public var recents = RecentSearches()

    public init() {}

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        preferences = (try? c.decodeIfPresent(UserPreferences.self, forKey: .preferences)) ?? UserPreferences()
        favorites = (try? c.decodeIfPresent([Favorite].self, forKey: .favorites)) ?? []
        tags = (try? c.decodeIfPresent([SkyTag].self, forKey: .tags)) ?? []
        recents = (try? c.decodeIfPresent(RecentSearches.self, forKey: .recents)) ?? RecentSearches()
    }
}

/// Atomic JSON persistence. A corrupt file is moved aside rather than overwritten,
/// so a bug can never destroy a user's favorites without any chance of recovery.
public struct JSONFileStore<Value: Codable & Sendable>: Sendable {
    public let url: URL

    public init(url: URL) { self.url = url }

    public enum LoadResult: Sendable {
        case missing
        case loaded(Value)
        case recoveredFromCorruption(backup: URL)
    }

    public func load() -> LoadResult {
        guard let data = try? Data(contentsOf: url) else { return .missing }
        do {
            return .loaded(try JSONDecoder().decode(Value.self, from: data))
        } catch {
            let backup = url.appendingPathExtension("corrupt")
            try? FileManager.default.removeItem(at: backup)
            try? FileManager.default.moveItem(at: url, to: backup)
            return .recoveredFromCorruption(backup: backup)
        }
    }

    public func save(_ value: Value) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let data = try encoder.encode(value)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        #if os(WASI)
        try data.write(to: url)
        #else
        try data.write(to: url, options: .atomic)
        #endif
    }
}
