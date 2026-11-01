import AstronomyCore
import Foundation
import ObservingKit
import SkyCatalog
import Testing
@testable import UserData

func temporaryDirectory(_ name: String = #function) -> URL {
    let base = ProcessInfo.processInfo.environment["SKYLENS_TMP"] ?? NSTemporaryDirectory()
    let url = URL(fileURLWithPath: base).appendingPathComponent("\(name.filter(\.isLetter))-\(UUID().uuidString)")
    try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    return url
}

private func roundTrip<T: Codable>(_ value: T) throws -> T {
    try JSONDecoder().decode(T.self, from: JSONEncoder().encode(value))
}

@Suite("User preferences")
struct PreferenceTests {
    @Test func defaultsAreSensible() {
        let p = UserPreferences()
        #expect(!p.onboardingCompleted)
        #expect(p.location == nil, "location is never assumed")
        #expect(p.equipment == [.nakedEye])
        #expect(p.display.magnitudeLimit == 6.5)
        #expect(!p.notifications.enabled)
    }

    @Test func everyFieldRoundTrips() throws {
        var p = UserPreferences()
        p.onboardingCompleted = true
        p.experience = .enthusiast
        p.equipment = [.telescope, .binoculars]
        p.location = SavedLocation(name: "Home", location: ObserverLocation(latitude: 52, longitude: 21, elevation: 100), timeZoneIdentifier: "Europe/Warsaw")
        p.units = .imperial
        p.display.nightVision = true
        p.display.labelDensity = .many
        p.display.starBrightness = 1.4
        p.notifications.enabled = true
        p.notifications.kinds = ["eclipse"]
        p.compassCorrection = -4.5
        #expect(try roundTrip(p) == p)
    }

    /// An older file must never reset settings when a new option ships later.
    @Test func missingKeysFallBackWithoutLosingOthers() throws {
        let old = #"{"onboardingCompleted":true,"display":{"nightVision":true},"units":"imperial"}"#
        let p = try JSONDecoder().decode(UserPreferences.self, from: Data(old.utf8))
        #expect(p.onboardingCompleted)
        #expect(p.units == .imperial)
        #expect(p.display.nightVision)
        #expect(p.display.constellationLines, "absent option takes its default")
        #expect(p.equipment == [.nakedEye])
    }

    @Test func aBadValueInOneFieldDoesNotLoseTheRest() throws {
        let json = #"{"onboardingCompleted":true,"units":"parsecs"}"#
        let p = try JSONDecoder().decode(UserPreferences.self, from: Data(json.utf8))
        #expect(p.onboardingCompleted)
        #expect(p.units == .metric)
    }

    @Test func notificationKindsIgnoreUnknownValues() {
        var n = NotificationPreferences()
        n.kinds = ["eclipse", "somethingRemoved"]
        #expect(n.eventKinds == [.eclipse])
    }

    @Test func labelDensityControlsLimit() {
        #expect(LabelDensity.few.labelLimit < LabelDensity.normal.labelLimit)
        #expect(LabelDensity.normal.labelLimit < LabelDensity.many.labelLimit)
    }

    @Test func locationKnowsItsZone() {
        let s = SavedLocation(name: "x", location: ObserverLocation(latitude: 0, longitude: 0), timeZoneIdentifier: "Asia/Tokyo")
        #expect(s.timeZone.identifier == "Asia/Tokyo")
    }
}

@Suite("Sky tags")
struct TagTests {
    @Test func everyAnchorRoundTrips() throws {
        let anchors: [SkyTag.Anchor] = [
            .object(.body(.mars)),
            .celestial(Equatorial(rightAscension: 5.5, declination: -5.4)),
            .localDirection(Horizontal(azimuth: 120, altitude: 30), ObserverLocation(latitude: 52, longitude: 21)),
        ]
        for a in anchors {
            let tag = SkyTag(name: "t", anchor: a)
            #expect(try roundTrip(tag) == tag)
        }
    }

    @Test func eachAnchorExplainsItsOwnBehaviour() {
        let celestial = SkyTag(name: "a", anchor: .celestial(Equatorial(rightAscension: 1, declination: 1)))
        let local = SkyTag(name: "b", anchor: .localDirection(Horizontal(azimuth: 0, altitude: 0), ObserverLocation(latitude: 0, longitude: 0)))
        #expect(celestial.behaviour.contains("among the stars"))
        #expect(local.behaviour.contains("stars behind it change"))
        #expect(celestial.behaviour != local.behaviour)
    }
}

@Suite("Recent searches")
struct RecentTests {
    @Test func mostRecentComesFirstWithoutDuplicates() {
        var r = RecentSearches()
        r.record(.body(.mars))
        r.record(.body(.venus))
        r.record(.body(.mars))
        #expect(r.items == [.body(.mars), .body(.venus)])
    }

    @Test func staysBounded() {
        var r = RecentSearches()
        for i in 0..<50 { r.record(.star(hip: i)) }
        #expect(r.items.count == RecentSearches.limit)
        #expect(r.items.first == .star(hip: 49))
        r.clear()
        #expect(r.items.isEmpty)
    }
}

@Suite("File store")
struct StoreTests {
    @Test func missingFileIsNotAnError() {
        let store = JSONFileStore<UserDocument>(url: temporaryDirectory().appendingPathComponent("none.json"))
        guard case .missing = store.load() else {
            Issue.record("expected missing")
            return
        }
    }

    @Test func savesAndLoads() throws {
        let store = JSONFileStore<UserDocument>(url: temporaryDirectory().appendingPathComponent("a/b/user.json"))
        var d = UserDocument()
        d.favorites = [Favorite(objectID: .body(.mars), addedAt: Date(timeIntervalSince1970: 1000))]
        try store.save(d)
        guard case .loaded(let back) = store.load() else {
            Issue.record("expected loaded")
            return
        }
        #expect(back == d)
    }

    /// Losing user data silently is the worst failure here. The bad file must survive.
    @Test func corruptionIsMovedAsideNotDestroyed() throws {
        let url = temporaryDirectory().appendingPathComponent("user.json")
        try Data("{ not json".utf8).write(to: url)
        let store = JSONFileStore<UserDocument>(url: url)
        guard case .recoveredFromCorruption(let backup) = store.load() else {
            Issue.record("expected recovery")
            return
        }
        #expect(try String(contentsOf: backup, encoding: .utf8) == "{ not json")
        #expect(!FileManager.default.fileExists(atPath: url.path))
    }
}
