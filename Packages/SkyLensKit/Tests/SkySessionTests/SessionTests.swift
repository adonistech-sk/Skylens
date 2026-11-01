import AstronomyCore
import Foundation
import ObservingKit
import Satellites
import SkyCatalog
import Testing
import UserData
@testable import SkySession

private func iso(_ s: String) -> Date {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f.date(from: s)!
}

private func temporaryDirectory(_ name: String = #function) -> URL {
    let base = ProcessInfo.processInfo.environment["SKYLENS_TMP"] ?? NSTemporaryDirectory()
    let url = URL(fileURLWithPath: base).appendingPathComponent("\(name.filter(\.isLetter))-\(UUID().uuidString)")
    try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    return url
}

private let t0 = iso("2026-11-01T20:00:00Z")
private let warsaw = SavedLocation(name: "Warsaw", location: ObserverLocation(latitude: 52.23, longitude: 21.01), timeZoneIdentifier: "Europe/Warsaw")

private enum Shared {
    static let catalog: Catalog = {
        do { return try Catalog.loadBundled() } catch { fatalError("\(error)") }
    }()
}

private struct FakeHTTP: HTTPClient {
    let status: Int
    let body: Data
    func get(_ url: String, headers: [String: String]) async throws -> HTTPResponse {
        HTTPResponse(status: status, body: body)
    }
}

private struct FakeWeather: WeatherProvider {
    let result: Result<WeatherForecast, WeatherError>
    func forecast(for location: ObserverLocation) async throws -> WeatherForecast { try result.get() }
}

@MainActor
private func makeModel(
    directory: URL? = nil, weather: WeatherProvider? = nil, http: HTTPClient? = nil, now: Date = t0, location: SavedLocation? = warsaw
) async -> AppModel {
    let model = AppModel(dependencies: AppDependencies(http: http, weather: weather, storageDirectory: directory ?? temporaryDirectory(), now: { now }))
    await model.load()
    if let location { model.setLocation(location) }
    return model
}

@Suite("Sky clock")
struct ClockTests {
    @Test func startsLive() {
        let c = SkyClock(now: t0)
        #expect(c.date(at: t0.addingTimeInterval(10)) == t0.addingTimeInterval(10))
        #expect(c.isLive(at: t0.addingTimeInterval(10)))
    }

    @Test func runsAtTheChosenRate() {
        var c = SkyClock(now: t0)
        c.setRate(3600, at: t0)
        #expect(c.date(at: t0.addingTimeInterval(2)) == t0.addingTimeInterval(7200))
        #expect(!c.isLive(at: t0.addingTimeInterval(2)))
    }

    @Test func changingRateDoesNotJump() {
        var c = SkyClock(now: t0)
        c.setRate(60, at: t0)
        let before = c.date(at: t0.addingTimeInterval(10))
        c.setRate(600, at: t0.addingTimeInterval(10))
        #expect(c.date(at: t0.addingTimeInterval(10)) == before)
    }

    @Test func pauseFreezesTime() {
        var c = SkyClock(now: t0)
        c.setRate(0, at: t0)
        #expect(c.date(at: t0.addingTimeInterval(1000)) == t0)
        #expect(c.isPaused())
    }

    @Test func runsBackward() {
        var c = SkyClock(now: t0)
        c.setRate(-3600, at: t0)
        #expect(c.date(at: t0.addingTimeInterval(1)) == t0.addingTimeInterval(-3600))
    }

    @Test func stepsAndResets() {
        var c = SkyClock(now: t0)
        c.step(by: 86_400, at: t0)
        #expect(c.date(at: t0) == t0.addingTimeInterval(86_400))
        c.resetToNow(t0)
        #expect(c.isLive(at: t0))
    }

    @Test func aRunawayTimeLapseStopsAtTheValidatedRange() {
        var c = SkyClock(now: t0)
        c.setRate(86_400 * 365 * 1000, at: t0)
        #expect(c.date(at: t0.addingTimeInterval(100)) == SkyClock.supportedRange.upperBound)
        c.setDate(iso("1200-01-01T00:00:00Z"), at: t0)
        #expect(c.date(at: t0) >= SkyClock.supportedRange.lowerBound)
    }
}

@Suite("Subscription rules")
struct SubscriptionTests {
    private func facts(expires: Date?, renewal: EntitlementFacts.RenewalState?, revoked: Date? = nil, renews: Bool = true) -> EntitlementFacts {
        EntitlementFacts(productID: "pro", expirationDate: expires, revocationDate: revoked, renewalState: renewal, willAutoRenew: renews)
    }

    private let later = t0.addingTimeInterval(86_400)
    private let earlier = t0.addingTimeInterval(-86_400)

    @Test func noTransactionMeansFree() {
        #expect(SubscriptionStatus.resolve(nil, now: t0) == .free)
        #expect(!SubscriptionStatus.free.hasProAccess)
    }

    @Test func unknownNeverGrantsAccessAndNeverBlocksTheSky() {
        #expect(!SubscriptionStatus.unknown.hasProAccess)
    }

    @Test func activeGrantsAccess() {
        let s = SubscriptionStatus.resolve(facts(expires: later, renewal: .subscribed), now: t0)
        #expect(s == .active(productID: "pro", expires: later, willRenew: true))
        #expect(s.hasProAccess)
    }

    @Test func expiredLosesAccessEvenWithoutRenewalInfo() {
        #expect(SubscriptionStatus.resolve(facts(expires: earlier, renewal: nil), now: t0) == .expired)
        #expect(SubscriptionStatus.resolve(facts(expires: later, renewal: .expired), now: t0) == .expired)
    }

    @Test func gracePeriodKeepsAccessAndAsksForPayment() {
        let s = SubscriptionStatus.resolve(facts(expires: later, renewal: .inGracePeriod), now: t0)
        #expect(s.hasProAccess)
        #expect(s.notice != nil)
    }

    @Test func billingRetryEndsAccessButExplainsWhy() {
        let s = SubscriptionStatus.resolve(facts(expires: earlier, renewal: .inBillingRetry), now: t0)
        #expect(!s.hasProAccess)
        #expect(s.notice != nil)
    }

    /// A refund must end access even if the period hasn't expired yet.
    @Test func revocationBeatsEverything() {
        #expect(SubscriptionStatus.resolve(facts(expires: later, renewal: .subscribed, revoked: t0), now: t0) == .revoked)
        #expect(!SubscriptionStatus.revoked.hasProAccess)
    }

    @Test func cancelledButPaidStaysActive() {
        let s = SubscriptionStatus.resolve(facts(expires: later, renewal: .subscribed, renews: false), now: t0)
        #expect(s.hasProAccess)
    }
}

@Suite("Finding objects")
struct LocatorTests {
    let catalog = Shared.catalog
    let warsawLocation = warsaw.location
    let night = iso("2026-11-01T20:00:00Z")
    let noon = iso("2026-11-01T11:00:00Z")

    @Test func visibleObjectSaysWhereToLook() throws {
        let vega = try #require(catalog.star(hip: 91262))
        let l = try Locator.locate(vega, at: night, observer: warsawLocation)
        #expect(l.status == .visible)
        #expect(l.explanation.contains("above the"))
        #expect(l.nextRise == nil)
    }

    @Test func canopusIsReportedAsNeverRisingFromWarsaw() throws {
        let canopus = try #require(catalog.star(hip: 30438))
        let l = try Locator.locate(canopus, at: night, observer: warsawLocation)
        #expect(l.status == .neverRises)
        #expect(l.explanation.contains("further south"))
        #expect(l.nextRise == nil)
    }

    @Test func belowHorizonGivesTheNextRise() throws {
        // At 20 UT in November the Sun has set, so its next rise must be tomorrow.
        let sun = Catalog.object(for: .sun)
        let l = try Locator.locate(sun, at: night, observer: warsawLocation)
        #expect(l.status == .belowHorizon)
        let rise = try #require(l.nextRise)
        #expect(rise > night && rise < night.addingTimeInterval(86_400))
    }

    @Test func daylightIsExplained() throws {
        let mars = Catalog.object(for: .jupiter)
        let l = try Locator.locate(mars, at: noon, observer: warsawLocation)
        if l.status != .belowHorizon { #expect(l.status == .aboveHorizonInDaylight) }
        let vega = try #require(catalog.star(hip: 91262))
        let v = try Locator.locate(vega, at: iso("2026-07-01T10:00:00Z"), observer: warsawLocation)
        if v.horizontal?.altitude ?? -1 > 0 {
            #expect(v.status == .aboveHorizonInDaylight)
            #expect(v.explanation.contains("too bright"))
        }
    }

    @Test func theSunCarriesASafetyWarning() throws {
        let l = try Locator.locate(Catalog.object(for: .sun), at: noon, observer: warsawLocation)
        #expect(l.explanation.contains("protection"))
    }

    @Test func compassPhrasesReadNaturally() throws {
        for hip in [91262, 32349, 24436, 7588, 69673, 97649] {
            let star = try #require(catalog.star(hip: hip))
            let l = try Locator.locate(star, at: night, observer: warsawLocation)
            #expect(!l.explanation.contains("ernern"))
            #expect(!l.explanation.contains("eastern horizon") || l.horizontal?.compassPoint == .east)
        }
    }

    @Test func satellitesNeedDataAndNeverInventIt() throws {
        let iss = SkyObject(id: .satellite(norad: 25544), type: .satellite, name: "ISS")
        let l = try Locator.locate(iss, at: night, observer: warsawLocation)
        #expect(l.status == .unavailable)
        #expect(l.horizontal == nil)
    }

    @Test func staleSatelliteDataIsRefused() throws {
        let line1 = "1 88888U          80275.98708465  .00073094  13844-3  66816-4 0    87"
        let line2 = "2 88888  72.8435 115.9689 0086731  52.6988 110.5714 16.05824518  1058"
        let e = try OrbitalElements(name: "OLD", line1: line1, line2: line2)
        let tracker = try SatelliteTracker(e)
        let object = SkyObject(id: .satellite(norad: 88888), type: .satellite, name: "OLD")
        let l = try Locator.locate(object, at: night, observer: warsawLocation, tracker: tracker)
        #expect(l.status == .unavailable)
        #expect(l.explanation.contains("days old"))
    }

    @Test func observationCarriesCategorySpecificData() throws {
        let mars = try Locator.observe(Catalog.object(for: .mars), at: night, observer: warsawLocation)
        #expect(mars.magnitude != nil && mars.distanceAU != nil && mars.angularDiameter != nil)
        #expect(mars.illuminatedFraction != nil)
        #expect(mars.constellation != nil)
        let sun = try Locator.observe(Catalog.object(for: .sun), at: night, observer: warsawLocation)
        #expect(sun.illuminatedFraction == nil, "a phase is meaningless for the Sun")
        let vega = try #require(catalog.star(hip: 91262))
        let star = try Locator.observe(vega, at: night, observer: warsawLocation)
        #expect(star.distanceAU == nil, "stars don't use AU")
    }

    /// The whole point of a shared clock: a different date means a different sky.
    @Test func timeTravelChangesPositions() throws {
        let jupiter = Catalog.object(for: .jupiter)
        let a = try Locator.observe(jupiter, at: iso("2026-11-01T20:00:00Z"), observer: warsawLocation)
        let b = try Locator.observe(jupiter, at: iso("2030-11-01T20:00:00Z"), observer: warsawLocation)
        #expect(try #require(a.j2000).unitVector.angle(to: try #require(b.j2000).unitVector) > 10)
    }

    @Test func tagKindsMoveDifferentlyThroughTheNight() throws {
        let start = SkyFrame(time: AstroTime(night), observer: warsawLocation)
        let later = SkyFrame(time: AstroTime(night).adding(hours: 4), observer: warsawLocation)
        let celestial = SkyTag(name: "c", anchor: .celestial(Equatorial(rightAscension: 18, declination: 30)))
        let local = SkyTag(name: "l", anchor: .localDirection(Horizontal(azimuth: 100, altitude: 30), warsawLocation))

        let c0 = try #require(try Locator.tagDirection(celestial, frame: start, catalog: catalog))
        let c1 = try #require(try Locator.tagDirection(celestial, frame: later, catalog: catalog))
        #expect(c0.angle(to: c1) > 20, "a star-fixed tag drifts across the local sky")

        let l0 = try #require(try Locator.tagDirection(local, frame: start, catalog: catalog))
        let l1 = try #require(try Locator.tagDirection(local, frame: later, catalog: catalog))
        #expect(l0.angle(to: l1) < 1e-9, "a horizon-fixed tag stays put")
    }
}

@MainActor
@Suite("App model")
struct AppModelTests {
    @Test func loadsAndReportsReady() async {
        let m = await makeModel()
        #expect(m.loadState == .ready)
        #expect(m.catalog != nil)
    }

    @Test func onboardingAndSettingsPersistAcrossLaunches() async {
        let dir = temporaryDirectory()
        let first = await makeModel(directory: dir)
        first.completeOnboarding()
        first.updatePreferences {
            $0.display.nightVision = true
            $0.equipment = [.telescope]
        }
        first.toggleFavorite(.body(.mars))
        first.recordRecentSearch(.star(hip: 91262))

        let second = await makeModel(directory: dir, location: nil)
        #expect(second.preferences.onboardingCompleted)
        #expect(second.preferences.display.nightVision)
        #expect(second.preferences.equipment == [.telescope])
        #expect(second.isFavorite(.body(.mars)))
        #expect(second.document.recents.items == [.star(hip: 91262)])
        #expect(second.location?.name == "Warsaw", "manual location must persist")
    }

    @Test func aFreshInstallHasNoAssumedLocation() async {
        let m = await makeModel(location: nil)
        #expect(m.location == nil)
        #expect(!m.preferences.onboardingCompleted)
    }

    @Test func corruptDataIsReportedNotHidden() async throws {
        let dir = temporaryDirectory()
        try Data("garbage".utf8).write(to: dir.appendingPathComponent("user.json"))
        let m = await makeModel(directory: dir, location: nil)
        #expect(m.persistenceNotice != nil)
    }

    @Test func searchUpdatesAsTheUserTypes() async {
        let m = await makeModel()
        m.searchQuery = "veg"
        #expect(m.searchResults.first?.name == "Vega")
        m.searchQuery = ""
        #expect(m.searchResults.isEmpty)
    }

    @Test func favoritesToggle() async {
        let m = await makeModel()
        #expect(!m.isFavorite(.body(.mars)))
        m.toggleFavorite(.body(.mars))
        #expect(m.isFavorite(.body(.mars)))
        m.toggleFavorite(.body(.mars))
        #expect(!m.isFavorite(.body(.mars)))
    }

    @Test func tagsCanBeEditedAndDeleted() async {
        let m = await makeModel()
        var tag = SkyTag(name: "First light", anchor: .object(.body(.moon)))
        #expect(m.addTag(tag))
        tag.note = "Clear and steady"
        m.updateTag(tag)
        #expect(m.document.tags.first?.note == "Clear and steady")
        m.deleteTag(tag.id)
        #expect(m.document.tags.isEmpty)
    }

    @Test func freeUsersGetACappedTagList() async {
        let m = await makeModel()
        m.setSubscription(.free)
        for i in 0..<FeatureLimits.freeSkyTags {
            #expect(m.addTag(SkyTag(name: "\(i)", anchor: .object(.body(.moon)))))
        }
        #expect(!m.canAddTag)
        #expect(!m.addTag(SkyTag(name: "over", anchor: .object(.body(.moon)))))
        m.setSubscription(.active(productID: "p", expires: nil, willRenew: true))
        #expect(m.addTag(SkyTag(name: "over", anchor: .object(.body(.moon)))))
    }

    @Test func freeTierKeepsTheCoreSky() async {
        let m = await makeModel()
        m.setSubscription(.free)
        #expect(m.starMagnitudeCeiling == 6.5)
        let free = m.visibleDeepSky
        #expect(free.filter { $0.deepSky?.messier != nil }.count == 110, "all of Messier is free")
        m.setSubscription(.active(productID: "p", expires: nil, willRenew: true))
        #expect(m.starMagnitudeCeiling == 12)
        #expect(m.visibleDeepSky.count > free.count)
    }

    @Test func missingWeatherIsHonestlyUnavailable() async {
        let m = await makeModel(weather: nil)
        await m.refreshWeather()
        #expect(m.weather == .notConfigured)
        #expect(m.weather.forecast == nil)
    }

    @Test func weatherFailureKeepsAstronomyWorking() async {
        let m = await makeModel(weather: FakeWeather(result: .failure(.badResponse(status: 500))))
        await m.refreshWeather()
        if case .unavailable = m.weather {} else { Issue.record("should be unavailable") }
        await m.refreshTonight()
        #expect(m.tonight != nil)
        #expect(m.tonight?.meanCloudCover == nil)
    }

    @Test func tonightRespectsTheFreeLimitAndProExpandsIt() async {
        let m = await makeModel()
        m.setSubscription(.free)
        await m.refreshTonight()
        #expect((m.tonight?.recommendations.count ?? 0) == FeatureLimits.freeTonightRecommendations)
        m.setSubscription(.active(productID: "p", expires: nil, willRenew: true))
        await m.refreshTonight()
        #expect((m.tonight?.recommendations.count ?? 0) > FeatureLimits.freeTonightRecommendations)
    }

    @Test func changingLocationInvalidatesLocalResults() async {
        let m = await makeModel()
        await m.refreshTonight()
        #expect(m.tonight != nil)
        m.setLocation(SavedLocation(name: "Sydney", location: ObserverLocation(latitude: -33.86, longitude: 151.21), timeZoneIdentifier: "Australia/Sydney"))
        #expect(m.tonight == nil)
    }

    @Test func tonightFollowsSimulatedTime() async {
        let m = await makeModel()
        await m.refreshTonight()
        let moon = m.tonight?.moon.illuminatedFraction
        m.setSkyDate(iso("2026-11-10T20:00:00Z"))
        await m.refreshTonight()
        #expect(m.tonight?.moon.illuminatedFraction != moon)
    }

    @Test func eventsLoadAndAlertsAreOptIn() async {
        let m = await makeModel()
        await m.refreshEvents(days: 120)
        #expect(!m.events.isEmpty)
        #expect(m.plannedAlerts.isEmpty, "nothing is scheduled until the user opts in")
        m.updatePreferences { $0.notifications.enabled = true }
        #expect(!m.plannedAlerts.isEmpty)
    }

    @Test func noLocationMeansNoLocalCalculationsRatherThanWrongOnes() async {
        let m = await makeModel(location: nil)
        await m.refreshTonight()
        await m.refreshEvents()
        #expect(m.tonight == nil)
        #expect(m.events.isEmpty)
    }

    @Test func satellitesLoadFromTheNetworkAndCacheForOffline() async throws {
        let epoch = ISO8601DateFormatter().string(from: t0).replacingOccurrences(of: "Z", with: "")
        let json = """
        [{"OBJECT_NAME":"ISS (ZARYA)","NORAD_CAT_ID":25544,"EPOCH":"\(epoch).000000","MEAN_MOTION":15.49,"ECCENTRICITY":0.0007,"INCLINATION":51.63,"RA_OF_ASC_NODE":12.3,"ARG_OF_PERICENTER":45.6,"MEAN_ANOMALY":78.9,"BSTAR":0.00012},
         {"OBJECT_NAME":"GPS","NORAD_CAT_ID":1,"EPOCH":"\(epoch).000000","MEAN_MOTION":2.0,"ECCENTRICITY":0.01,"INCLINATION":55,"RA_OF_ASC_NODE":12.3,"ARG_OF_PERICENTER":45.6,"MEAN_ANOMALY":78.9,"BSTAR":0}]
        """
        let dir = temporaryDirectory()
        let online = await makeModel(directory: dir, http: FakeHTTP(status: 200, body: Data(json.utf8)))
        await online.refreshSatellites()
        #expect(online.satellites.map(\.noradID) == [25544], "deep-space entries are excluded")
        #expect(online.tracker(norad: 25544) != nil)
        #expect(online.object(.satellite(norad: 25544))?.type == .satellite)
        online.searchQuery = "ISS"
        #expect(online.searchResults.contains { $0.category == .satellites })

        let offline = await makeModel(directory: dir, http: FakeHTTP(status: 500, body: Data()), location: nil)
        #expect(offline.satellites.count == 1)
    }

    @Test func aFailedRefreshKeepsExistingDataAndSaysSo() async {
        let m = await makeModel(http: FakeHTTP(status: 503, body: Data()))
        await m.refreshSatellites()
        #expect(m.satellites.isEmpty)
        #expect(m.satelliteError != nil)
    }

    @Test func noHTTPClientMeansNoSatelliteClaims() async {
        let m = await makeModel(http: nil)
        await m.refreshSatellites()
        #expect(m.satelliteError != nil)
        #expect(m.upcomingPasses(days: 1).isEmpty)
    }
}

@Suite("Sky geometry")
struct GeometryTests {
    let catalog = Shared.catalog

    @Test func subdivisionKeepsEndpointsAndLength() {
        let a = Horizontal(azimuth: 0, altitude: 0).unitVector
        let b = Horizontal(azimuth: 60, altitude: 0).unitVector
        let parts = SkyGeometry.subdivide(a, b, maxDegrees: 5)
        #expect(parts.count == 12)
        #expect(parts.first?.a == a)
        #expect(parts.last?.b == b)
        let total = parts.map { $0.a.angle(to: $0.b) }.reduce(0, +)
        #expect(abs(total - 60) < 0.05)
        #expect(parts.allSatisfy { abs($0.a.length - 1) < 1e-9 })
    }

    @Test func constellationLinesConnectRealStars() {
        let lines = SkyGeometry.constellationLines(catalog)
        #expect(lines.count > 800)
        #expect(lines.allSatisfy { $0.a.angle(to: $0.b) < 7 })
    }

    @Test func gridsCoverTheSky() {
        #expect(!SkyGeometry.horizonGrid().isEmpty)
        #expect(!SkyGeometry.equatorialGrid().isEmpty)
        let horizon = SkyGeometry.horizonLine()
        #expect(horizon.allSatisfy { abs($0.a.z) < 1e-9 })
        #expect(abs(horizon.map { $0.a.angle(to: $0.b) }.reduce(0, +) - 360) < 0.01)
    }

    @Test func boundariesExistForEveryConstellation() {
        #expect(SkyGeometry.constellationBoundaries(catalog).count > 500)
    }

    @Test func vertexDataHasTheShaderLayout() {
        let s = SkySegment(a: Vec3(1, 0, 0), b: Vec3(0, 1, 0))
        let v = SkyGeometry.vertexData([s])
        #expect(v.count == 6 * 7)
        #expect(Array(v[0..<7]) == [1, 0, 0, 0, 1, 0, -1])
        #expect(Array(v[35..<42]) == [0, 1, 0, 1, 0, 0, -1])
    }

    @Test func labelsCoverWhatPeopleExpect() {
        let labels = SkyLabels.all(catalog)
        let texts = Set(labels.map(\.text))
        for name in ["Mars", "Vega", "Sirius", "ORION", "URSA MAJOR", "Andromeda Galaxy", "Pleiades"] {
            #expect(texts.contains(name), "\(name)")
        }
        #expect(Set(labels.map(\.id)).count == labels.count, "ids must be unique")
        #expect(labels.filter { $0.style == .constellation }.count == 88)
        #expect(labels.filter { $0.direction == nil }.allSatisfy { $0.style == .planet })
    }

    @Test func planetsOutrankEverythingElse() {
        let labels = SkyLabels.all(catalog)
        let worstPlanet = labels.filter { $0.style == .planet }.map(\.priority).max() ?? 0
        #expect(labels.filter { $0.style != .planet }.allSatisfy { $0.priority > worstPlanet })
    }
}
