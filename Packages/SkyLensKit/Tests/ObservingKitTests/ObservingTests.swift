import AstronomyCore
import Foundation
@testable import Satellites
import SkyCatalog
import Testing
@testable import ObservingKit

private func iso(_ s: String) -> Date {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f.date(from: s)!
}

private enum Shared {
    static let catalog: Catalog = {
        do { return try Catalog.loadBundled() } catch { fatalError("\(error)") }
    }()
}

private let warsaw = ObserverLocation(latitude: 52.23, longitude: 21.01)
private let zone = TimeZone(secondsFromGMT: 3600)!

struct FakeHTTP: HTTPClient {
    let response: HTTPResponse
    func get(_ url: String, headers: [String: String]) async throws -> HTTPResponse { response }
}

@Suite("MET Norway")
struct WeatherTests {
    @Test func parsesARealResponse() throws {
        let f = try MetNorwayProvider.parse(Data(metNorwaySample.utf8), expires: "Sun, 01 Nov 2026 00:37:58 GMT")
        #expect(f.hours.count == 5)
        let h = try #require(f.hours.first)
        #expect(h.cloudCover == 100)
        #expect(h.lowCloud == 100)
        #expect(h.fog == 100)
        #expect(h.temperature == 6.9)
        #expect(f.expiresAt == iso("2026-11-01T00:37:58Z"))
        #expect(f.attribution.contains("MET Norway"))
    }

    @Test func toleratesRowsWithoutNextHourBlock() throws {
        let f = try MetNorwayProvider.parse(Data(metNorwaySample.utf8), expires: nil)
        #expect(f.hours.last?.precipitation == nil)
        #expect(f.hours.first?.precipitation == 0)
    }

    @Test func roundsCoordinatesAndSendsTheRequiredUserAgent() {
        let url = MetNorwayProvider.url(for: ObserverLocation(latitude: 52.2312345, longitude: 21.0123456))
        #expect(url.hasSuffix("lat=52.23&lon=21.01"))
    }

    @Test func surfacesServerErrors() async {
        let provider = MetNorwayProvider(client: FakeHTTP(response: HTTPResponse(status: 503, body: Data())), userAgent: "t")
        await #expect(throws: WeatherError.badResponse(status: 503)) { try await provider.forecast(for: warsaw) }
    }

    @Test func malformedBodyThrows() {
        #expect(throws: WeatherError.malformed) { try MetNorwayProvider.parse(Data("{}".utf8), expires: nil) }
    }

    @Test func refusesToAverageAForecastThatBarelyCoversTheNight() {
        let base = iso("2026-11-01T20:00:00Z")
        let f = WeatherForecast(hours: [WeatherHour(date: base, cloudCover: 10)], updatedAt: base, expiresAt: nil, attribution: "t")
        let night = DateInterval(start: base, duration: 10 * 3600)
        #expect(f.meanCloudCover(during: night) == nil)
        #expect(f.meanCloudCover(during: DateInterval(start: base, duration: 3600)) == 10)
    }

    @Test func noDataRatherThanANearbyGuess() {
        let base = iso("2026-11-01T20:00:00Z")
        let f = WeatherForecast(hours: [WeatherHour(date: base, cloudCover: 10)], updatedAt: base, expiresAt: nil, attribution: "t")
        #expect(f.hour(nearest: base.addingTimeInterval(5 * 3600)) == nil)
    }

    @Test func conditionWords() {
        #expect(SkyConditions.describe(cloudCover: 5) == "Clear")
        #expect(SkyConditions.describe(cloudCover: 95) == "Overcast")
    }
}

@Suite("Tonight")
struct TonightTests {
    private func plan(_ date: String, forecast: WeatherForecast? = nil, equipment: Set<Equipment> = [.nakedEye], observer: ObserverLocation = warsaw) throws -> TonightPlan {
        try TonightPlanner.plan(catalog: Shared.catalog, date: iso(date), observer: observer, timeZone: zone, equipment: equipment, experience: .beginner, forecast: forecast)
    }

    @Test func producesRecommendationsThatAreActuallyUp() throws {
        let p = try plan("2026-11-01T18:00:00Z")
        #expect(!p.recommendations.isEmpty)
        for r in p.recommendations {
            #expect(r.maxAltitude >= 15, "\(r.object.name)")
            #expect(!r.reasons.isEmpty)
            if let position = r.object.position {
                let frame = SkyFrame(time: AstroTime(r.bestTime), observer: warsaw)
                #expect(abs(RiseSet.altitude(of: position, frame: frame) - r.maxAltitude) < 1)
            }
        }
    }

    @Test func nothingThatStaysBelowTheHorizonIsListed() throws {
        let p = try plan("2026-11-01T18:00:00Z")
        let names = p.recommendations.map(\.object.name)
        #expect(!names.contains("Canopus"), "never rises from Warsaw")
        #expect(!names.contains("Omega Centauri"))
    }

    @Test func equipmentOpensUpFainterTargets() throws {
        let eye = try plan("2026-01-20T18:00:00Z").recommendations.compactMap(\.object.magnitude).max() ?? 0
        let scope = try plan("2026-01-20T18:00:00Z", equipment: [.telescope]).recommendations.compactMap(\.object.magnitude).max() ?? 0
        #expect(scope >= eye)
    }

    @Test func nakedEyeListStaysWithinReach() throws {
        for r in try plan("2026-11-01T18:00:00Z").recommendations {
            #expect((r.object.magnitude ?? -99) <= Equipment.nakedEye.limitingMagnitude + 1.2, "\(r.object.name)")
        }
    }

    @Test func cloudsLowerRankAndAreExplained() throws {
        let night = try plan("2026-11-01T18:00:00Z").night.darkInterval!
        let hours = stride(from: 0.0, to: night.duration + 3600, by: 3600).map {
            WeatherHour(date: night.start.addingTimeInterval($0), cloudCover: 90)
        }
        let cloudy = WeatherForecast(hours: hours, updatedAt: night.start, expiresAt: nil, attribution: "t")
        let p = try plan("2026-11-01T18:00:00Z", forecast: cloudy)
        #expect(p.recommendations.contains { !$0.cautions.isEmpty })
        #expect((p.meanCloudCover ?? 0) > 80)
        #expect(p.observingWindows.isEmpty)
    }

    @Test func clearStretchBecomesAnObservingWindow() throws {
        let night = try plan("2026-11-01T18:00:00Z").night.darkInterval!
        let hours = (0..<8).map { i in
            WeatherHour(date: night.start.addingTimeInterval(Double(i) * 3600), cloudCover: i < 4 ? 10 : 95)
        }
        let f = WeatherForecast(hours: hours, updatedAt: night.start, expiresAt: nil, attribution: "t")
        let p = try plan("2026-11-01T18:00:00Z", forecast: f)
        #expect(p.observingWindows.count == 1)
        #expect(abs((p.observingWindows.first?.duration ?? 0) - 4 * 3600) < 1)
    }

    @Test func noForecastMeansNoClaimAboutCloud() throws {
        let p = try plan("2026-11-01T18:00:00Z")
        #expect(p.meanCloudCover == nil)
        #expect(p.observingWindows.isEmpty)
    }

    @Test func polarDayProducesNoFalseRecommendations() throws {
        let tromso = ObserverLocation(latitude: 69.65, longitude: 18.96)
        let p = try plan("2026-06-21T12:00:00Z", observer: tromso)
        #expect(p.night.condition == .polarDay)
        #expect(p.recommendations.isEmpty)
    }

    /// Hemispheres must differ: Crux and Omega Centauri for Sydney in winter.
    @Test func southernSkyGetsSouthernTargets() throws {
        let sydney = ObserverLocation(latitude: -33.86, longitude: 151.21)
        let p = try plan("2026-06-15T10:00:00Z", equipment: [.binoculars, .telescope], observer: sydney)
        let all = p.recommendations.map(\.object.id)
        #expect(!all.contains(.star(hip: 11767)), "Polaris is not a southern target")
    }
}

@Suite("Event calendar")
struct EventTests {
    private func events(_ from: String, _ to: String, observer: ObserverLocation = warsaw) throws -> [SkyEvent] {
        try EventCalendar.events(from: iso(from), to: iso(to), observer: observer)
    }

    @Test func eventsAreOrderedAndUnique() throws {
        let e = try events("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z")
        #expect(e == e.sorted { $0.date < $1.date })
        #expect(Set(e.map(\.id)).count == e.count)
    }

    @Test func aYearContainsAllTheExpectedKinds() throws {
        let kinds = Set(try events("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z").map(\.kind))
        for k in [SkyEvent.Kind.moonPhase, .eclipse, .meteorShower, .opposition, .elongation, .season] {
            #expect(kinds.contains(k), "\(k)")
        }
    }

    /// 2026-08-12: total over Spain and Iceland. In Warsaw the partial phase starts
    /// before sunset and peaks after it. Judging by the peak alone wrongly reports
    /// this eclipse as invisible, so it stands as a regression test.
    @Test func eclipseThatPeaksAfterSunsetIsStillVisible() throws {
        let e = try events("2026-08-10T00:00:00Z", "2026-08-14T00:00:00Z")
        let solar = try #require(e.first { $0.kind == .eclipse && $0.title.contains("Solar") })
        guard case .visible(let text) = solar.visibility else {
            Issue.record("should be visible from Warsaw")
            return
        }
        #expect(text.contains("before sunset"))
        #expect(!text.contains("(Int"), "interpolation must be intact")
        #expect(solar.related.contains(.body(.sun)))
    }

    @Test func eclipseInvisibleFromFarSideIsNotOffered() throws {
        let tokyo = ObserverLocation(latitude: 35.68, longitude: 139.65)
        let e = try events("2026-08-10T00:00:00Z", "2026-08-14T00:00:00Z", observer: tokyo)
        let solar = try #require(e.first { $0.kind == .eclipse && $0.title.contains("Solar") })
        if case .visible = solar.visibility { Issue.record("no part of it reaches Tokyo") }
    }

    @Test func perseidsPeakInMidAugustEveryYear() throws {
        for year in [2026, 2027, 2030] {
            let e = try events("\(year)-08-01T00:00:00Z", "\(year)-08-31T00:00:00Z").first { $0.title == "Perseids Peak" }
            var c = Calendar(identifier: .gregorian)
            c.timeZone = TimeZone(secondsFromGMT: 0)!
            let d = try #require(e?.date)
            #expect(c.component(.month, from: d) == 8)
            #expect((12...13).contains(c.component(.day, from: d)))
        }
    }

    @Test(arguments: [
        ("Quadrantids Peak", 1, 3...4), ("Lyrids Peak", 4, 22...23), ("Geminids Peak", 12, 13...15), ("Orionids Peak", 10, 20...22),
    ])
    func showerDatesMatchTheirKnownMonth(title: String, month: Int, days: ClosedRange<Int>) throws {
        let all = try events("2026-01-01T00:00:00Z", "2026-12-31T23:00:00Z")
        let e = try #require(all.first { $0.title == title })
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(secondsFromGMT: 0)!
        #expect(c.component(.month, from: e.date) == month)
        #expect(days.contains(c.component(.day, from: e.date)), "\(e.date)")
    }

    @Test func curatedEventsDeclareTheirSource() throws {
        let e = try events("2026-08-01T00:00:00Z", "2026-08-31T00:00:00Z")
        let shower = try #require(e.first { $0.kind == .meteorShower })
        #expect(shower.source.label.contains("IMO"))
        let moon = try #require(e.first { $0.kind == .moonPhase })
        #expect(moon.source == .calculated)
    }

    /// The northernmost radiant does not clear the horizon from far south.
    @Test func ursidsAreNotOfferedToTheSouthernHemisphere() throws {
        let sydney = ObserverLocation(latitude: -33.86, longitude: 151.21)
        let e = try #require(try events("2026-12-01T00:00:00Z", "2026-12-31T00:00:00Z", observer: sydney).first { $0.title == "Ursids Peak" })
        if case .notVisible = e.visibility {} else { Issue.record("radiant never rises from Sydney") }
    }

    @Test func conjunctionsCloseToTheSunAreMarkedInvisible() throws {
        // Mercury and Venus often meet near the Sun, and such events must say so.
        let e = try events("2026-01-01T00:00:00Z", "2028-01-01T00:00:00Z").filter { $0.kind == .conjunction }
        #expect(!e.isEmpty)
        for c in e where c.title == "Mercury and Venus" {
            if case .general = c.visibility { Issue.record("needs a location verdict") }
        }
    }

    @Test func satellitePassesFromLiveDataAreLabelled() throws {
        let date = iso("2026-11-02T18:00:00Z")
        let pass = SatellitePass(noradID: 25544, rise: date, culmination: date.addingTimeInterval(180), set: date.addingTimeInterval(360), maxAltitude: 60, riseAzimuth: 270, culminationAzimuth: 180, setAzimuth: 90, visibleInterval: DateInterval(start: date, duration: 200))
        let e = try EventCalendar.events(from: date, to: date.addingTimeInterval(3600), observer: warsaw, satellitePasses: [("ISS", pass)])
        let event = try #require(e.first { $0.kind == .satellitePass })
        #expect(event.title == "ISS Pass")
        #expect(event.detail.contains("west"))
        #expect(event.source == .liveData("CelesTrak"))
    }
}

@Suite("Alert planning")
struct AlertTests {
    private func event(_ id: String, _ date: Date, kind: SkyEvent.Kind = .eclipse, significant: Bool = true, visibility: SkyEvent.Visibility = .general) -> SkyEvent {
        SkyEvent(id: id, kind: kind, title: id, date: date, endDate: nil, detail: "", source: .calculated, visibility: visibility, related: [], isSignificant: significant)
    }

    private let now = Date(timeIntervalSince1970: 1_800_000_000)

    @Test func schedulesAtTheLeadTime() {
        let e = event("a", now.addingTimeInterval(7200))
        let plan = AlertPlanner.plan(events: [e], kinds: [.eclipse], leadTime: 3600, now: now)
        #expect(plan.first?.fireDate == now.addingTimeInterval(3600))
    }

    @Test func skipsPastInsignificantUnwantedAndInvisibleEvents() {
        let plan = AlertPlanner.plan(events: [
            event("past", now.addingTimeInterval(-10)),
            event("toosoon", now.addingTimeInterval(100)),
            event("minor", now.addingTimeInterval(9000), significant: false),
            event("otherkind", now.addingTimeInterval(9000), kind: .season),
            event("hidden", now.addingTimeInterval(9000), visibility: .notVisible("x")),
            event("good", now.addingTimeInterval(9000)),
        ], kinds: [.eclipse], now: now)
        #expect(plan.map(\.id) == ["event.good"])
    }

    @Test func neverExceedsTheSystemLimitAndKeepsTheSoonest() {
        let many = (1...200).map { event("e\($0)", now.addingTimeInterval(Double($0) * 86_400)) }
        let plan = AlertPlanner.plan(events: many.reversed(), kinds: [.eclipse], now: now, limit: 500)
        #expect(plan.count == AlertPlanner.systemLimit)
        #expect(plan.first?.id == "event.e1")
    }

    @Test func noDuplicates() {
        let e = event("a", now.addingTimeInterval(9000))
        #expect(AlertPlanner.plan(events: [e, e], kinds: [.eclipse], now: now).count == 1)
    }
}

@Suite("Night lights")
struct NightLightTests {
    @Test func tileForAKnownPoint() {
        let t = NightLights.tile(for: ObserverLocation(latitude: 0, longitude: 0), zoom: 8)
        #expect(t.x == 128 && t.y == 128 && t.pixelX == 0 && t.pixelY == 0)
    }

    @Test func tileStaysInRangeAtExtremes() {
        for location in [ObserverLocation(latitude: 89.9, longitude: 179.9), ObserverLocation(latitude: -89.9, longitude: -179.9)] {
            let t = NightLights.tile(for: location, zoom: 8)
            #expect((0..<256).contains(t.x) && (0..<256).contains(t.y))
        }
    }

    @Test func urlMatchesGIBSOrder() {
        #expect(NightLights.tileURL(z: 2, x: 3, y: 1).hasSuffix("/GoogleMapsCompatible_Level8/2/1/3.png"))
    }

    @Test func comparisonWordingAvoidsBortleClaims() {
        #expect(NightLights.compare(0.1, to: 0.5) == "Darker than your location")
        #expect(NightLights.compare(0.51, to: 0.5) == "About the same as your location")
        #expect(!NightLights.attribution.contains("Bortle"))
    }
}
