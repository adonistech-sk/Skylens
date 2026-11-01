import AstronomyCore
import Foundation
import Observation
import ObservingKit
import Satellites
import SkyCatalog
import UserData

/// The dependencies Apple frameworks supply in the app and tests fake.
public struct AppDependencies: Sendable {
    public var http: HTTPClient?
    public var weather: WeatherProvider?
    public var storageDirectory: URL
    public var now: @Sendable () -> Date

    public init(
        http: HTTPClient?, weather: WeatherProvider?, storageDirectory: URL,
        now: @escaping @Sendable () -> Date = { Date() }
    ) {
        self.http = http
        self.weather = weather
        self.storageDirectory = storageDirectory
        self.now = now
    }
}

/// App state. Business logic lives here so it is testable without an iOS SDK, and
/// views only read it and call its methods.
@MainActor
@Observable
public final class AppModel {
    public enum LoadState: Equatable {
        case loading
        case ready
        case failed(String)
    }

    public private(set) var loadState = LoadState.loading
    public private(set) var catalog: Catalog?
    public private(set) var document = UserDocument()
    public private(set) var persistenceNotice: String?

    public var clock: SkyClock
    public var selection: ObjectID?
    public var searchQuery = "" { didSet { refreshSearch() } }
    public private(set) var searchResults: [SearchIndex.Result] = []

    public private(set) var subscription = SubscriptionStatus.unknown

    public private(set) var tonight: TonightPlan?
    public private(set) var weather = WeatherState.notConfigured
    public private(set) var events: [SkyEvent] = []
    public private(set) var eventsError: String?

    public private(set) var satellites: [OrbitalElements] = []
    public private(set) var satelliteError: String?
    @ObservationIgnored private var trackers: [Int: SatelliteTracker] = [:]
    @ObservationIgnored private var lastSatelliteFetch: Date?

    @ObservationIgnored private let dependencies: AppDependencies
    @ObservationIgnored private let store: JSONFileStore<UserDocument>
    @ObservationIgnored private let satelliteCache: JSONFileStore<SatelliteCache>

    private struct SatelliteCache: Codable, Sendable {
        let fetchedAt: Date
        let elements: [OrbitalElements]
    }

    public init(dependencies: AppDependencies) {
        self.dependencies = dependencies
        store = JSONFileStore(url: dependencies.storageDirectory.appendingPathComponent("user.json"))
        satelliteCache = JSONFileStore(url: dependencies.storageDirectory.appendingPathComponent("satellites.json"))
        clock = SkyClock(now: dependencies.now())
        weather = dependencies.weather == nil ? .notConfigured : .unavailable(reason: "Waiting for a forecast.")

        switch store.load() {
        case .missing:
            break
        case .loaded(let document):
            self.document = document
        case .recoveredFromCorruption:
            persistenceNotice = "Your saved data could not be read, so SkyLens started fresh. A backup was kept."
        }
    }

    /// Loads the catalog off the main actor, since it decodes over 100k stars.
    public func load() async {
        do {
            let loaded = try await Task.detached(priority: .userInitiated) { try Catalog.loadBundled() }.value
            catalog = loaded
            restoreSatelliteCache()
            loadState = .ready
        } catch {
            loadState = .failed("SkyLens couldn't read its star catalog. Reinstalling the app should fix this.")
        }
    }

    // MARK: Time

    public var now: Date { dependencies.now() }
    public var skyDate: Date { clock.date(at: now) }
    public var isLive: Bool { clock.isLive(at: now) }

    public func setSkyDate(_ date: Date) { clock.setDate(date, at: now) }
    public func setRate(_ rate: Double) { clock.setRate(rate, at: now) }
    public func stepSky(by seconds: TimeInterval) { clock.step(by: seconds, at: now) }
    public func resetToNow() { clock.resetToNow(now) }

    // MARK: Location

    public var location: SavedLocation? { document.preferences.location }
    public var observer: ObserverLocation? { location?.location }

    public func setLocation(_ saved: SavedLocation) {
        mutate { $0.preferences.location = saved }
        // Everything location dependent is now out of date.
        tonight = nil
        events = []
    }

    public func addSavedLocation(_ saved: SavedLocation) {
        mutate { document in
            guard !document.preferences.savedLocations.contains(where: { $0.id == saved.id }) else { return }
            document.preferences.savedLocations.append(saved)
        }
    }

    public func removeSavedLocation(_ id: UUID) {
        mutate { $0.preferences.savedLocations.removeAll { $0.id == id } }
    }

    // MARK: Preferences

    public var preferences: UserPreferences { document.preferences }

    public func updatePreferences(_ change: (inout UserPreferences) -> Void) {
        mutate { change(&$0.preferences) }
    }

    public func completeOnboarding() {
        updatePreferences { $0.onboardingCompleted = true }
    }

    // MARK: Search

    private func refreshSearch() {
        guard let catalog else { return }
        var results = catalog.searchIndex.search(searchQuery)
        // Satellites live outside the catalog as they come from live data.
        let q = SearchIndex.normalize(searchQuery)
        if !q.isEmpty {
            let matches = satellites.filter {
                SearchIndex.normalize($0.name).contains(q) || String($0.noradID) == q
            }.prefix(10)
            let hits = matches.map {
                SearchIndex.Result(id: .satellite(norad: $0.noradID), name: $0.name, matchedAlias: nil, category: .satellites, score: 5)
            }
            results = (results + hits).sorted { $0.score > $1.score }
        }
        searchResults = results
    }

    public func recordRecentSearch(_ id: ObjectID) {
        mutate { $0.recents.record(id) }
    }

    public func clearRecentSearches() {
        mutate { $0.recents.clear() }
    }

    public func object(_ id: ObjectID) -> SkyObject? {
        if case .satellite(let norad) = id.kind {
            return satellites.first { $0.noradID == norad }.map {
                SkyObject(id: id, type: .satellite, name: $0.name, designations: ["NORAD \(norad)"])
            }
        }
        return catalog?.object(id)
    }

    // MARK: Favorites

    public func isFavorite(_ id: ObjectID) -> Bool {
        document.favorites.contains { $0.objectID == id }
    }

    public func toggleFavorite(_ id: ObjectID) {
        let added = now
        mutate { document in
            if let i = document.favorites.firstIndex(where: { $0.objectID == id }) {
                document.favorites.remove(at: i)
            } else {
                document.favorites.append(Favorite(objectID: id, addedAt: added))
            }
        }
    }

    // MARK: Sky Tags

    /// Where tag photos live. Unlike the temporary directory, iOS never purges this.
    public var tagImageDirectory: URL {
        dependencies.storageDirectory.appendingPathComponent("TagImages", isDirectory: true)
    }

    public var canAddTag: Bool {
        subscription.hasProAccess || document.tags.count < FeatureLimits.freeSkyTags
    }

    @discardableResult
    public func addTag(_ tag: SkyTag) -> Bool {
        guard canAddTag else { return false }
        mutate { $0.tags.append(tag) }
        return true
    }

    public func updateTag(_ tag: SkyTag) {
        mutate { document in
            guard let i = document.tags.firstIndex(where: { $0.id == tag.id }) else { return }
            document.tags[i] = tag
        }
    }

    public func deleteTag(_ id: UUID) {
        mutate { $0.tags.removeAll { $0.id == id } }
    }

    // MARK: Subscription

    public func setSubscription(_ status: SubscriptionStatus) {
        subscription = status
    }

    /// The faintest stars the current plan may show.
    public var starMagnitudeCeiling: Double {
        subscription.hasProAccess ? 12 : FeatureLimits.freeStarMagnitude
    }

    public func hasAccess(to feature: ProFeature) -> Bool {
        subscription.hasProAccess
    }

    /// Deep-sky objects the current plan may show. Everyone has Messier.
    public var visibleDeepSky: [SkyObject] {
        guard let catalog else { return [] }
        if subscription.hasProAccess { return catalog.deepSky }
        return catalog.deepSky.filter {
            $0.deepSky?.messier != nil || catalog.editorial(for: $0)?.name != nil
        }
    }

    // MARK: Tonight, weather, events

    public func refreshWeather() async {
        guard let provider = dependencies.weather else {
            weather = .notConfigured
            return
        }
        guard let observer else { return }
        do {
            weather = .available(try await provider.forecast(for: observer))
        } catch {
            weather = .unavailable(reason: "The forecast couldn't be loaded. Astronomy data is unaffected.")
        }
    }

    public func refreshTonight() async {
        guard let catalog, let location else { return }
        let date = skyDate
        let preferences = document.preferences
        let forecast = weather.forecast
        let limit = hasAccess(to: .fullTonightPlanner) ? 12 : FeatureLimits.freeTonightRecommendations
        do {
            tonight = try await Task.detached(priority: .userInitiated) {
                try TonightPlanner.plan(
                    catalog: catalog, date: date, observer: location.location, timeZone: location.timeZone,
                    equipment: preferences.equipment, experience: preferences.experience, forecast: forecast, limit: limit
                )
            }.value
        } catch {
            tonight = nil
        }
    }

    public func refreshEvents(days: Int = 365) async {
        guard let observer else { return }
        let start = skyDate
        let passes = hasAccess(to: .satellitePasses) ? upcomingPasses(days: 3) : []
        do {
            events = try await Task.detached(priority: .utility) {
                try EventCalendar.events(
                    from: start, to: start.addingTimeInterval(Double(days) * 86_400),
                    observer: observer, satellitePasses: passes
                )
            }.value
            eventsError = nil
        } catch {
            eventsError = "Events couldn't be calculated for this date."
        }
    }

    public var plannedAlerts: [PlannedAlert] {
        let n = document.preferences.notifications
        guard n.enabled else { return [] }
        return AlertPlanner.plan(events: events, kinds: n.eventKinds, leadTime: Double(n.leadMinutes) * 60, now: now)
    }

    // MARK: Satellites

    public func tracker(norad: Int) -> SatelliteTracker? { trackers[norad] }

    private func restoreSatelliteCache() {
        if case .loaded(let cache) = satelliteCache.load() {
            apply(cache.elements)
            lastSatelliteFetch = cache.fetchedAt
        }
    }

    private func apply(_ elements: [OrbitalElements]) {
        var usable: [OrbitalElements] = []
        var map: [Int: SatelliteTracker] = [:]
        for e in elements {
            // Deep-space orbits are skipped since SGP4 alone can't propagate them.
            if let tracker = try? SatelliteTracker(e) {
                usable.append(e)
                map[e.noradID] = tracker
            }
        }
        satellites = usable
        trackers = map
    }

    /// Respects CelesTrak's fetch limit and keeps cached data if the network fails.
    public func refreshSatellites() async {
        guard let http = dependencies.http else {
            satelliteError = "Satellite updates aren't available."
            return
        }
        if let last = lastSatelliteFetch, now.timeIntervalSince(last) < OMMParser.minimumRefreshInterval { return }
        do {
            let r = try await http.get(OMMParser.brightestSatellitesURL, headers: ["User-Agent": "SkyLens/1.0"])
            guard r.status == 200 else {
                satelliteError = "Satellite data couldn't be refreshed."
                return
            }
            let elements = try OMMParser.parse(r.body)
            apply(elements)
            lastSatelliteFetch = now
            satelliteError = nil
            try? satelliteCache.save(SatelliteCache(fetchedAt: now, elements: elements))
        } catch {
            satelliteError = "Satellite data couldn't be refreshed."
        }
    }

    /// Passes for the brightest few, sorted by time. Stale sets contribute nothing.
    public func upcomingPasses(days: Double, limit: Int = 12) -> [(name: String, pass: SatellitePass)] {
        guard let observer else { return [] }
        let start = skyDate
        let wanted = [25544, 48274, 20580] // ISS, Tiangong, Hubble
        var out: [(String, SatellitePass)] = []
        for id in wanted {
            guard let tracker = trackers[id] else { continue }
            let passes = (try? tracker.passes(from: observer, start: start, days: days, now: now)) ?? []
            out += passes.map { (tracker.elements.name, $0) }
        }
        return Array(out.sorted { $0.1.rise < $1.1.rise }.prefix(limit)).map { (name: $0.0, pass: $0.1) }
    }

    // MARK: Persistence

    private func mutate(_ change: (inout UserDocument) -> Void) {
        change(&document)
        do {
            try store.save(document)
            persistenceNotice = nil
        } catch {
            persistenceNotice = "Your changes couldn't be saved. Check your device's free storage."
        }
    }
}
