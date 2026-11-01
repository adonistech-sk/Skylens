import AstronomyCore
import Foundation

/// Stable identity for anything the app can select, favorite or link to. The raw
/// value is persisted, so its format must not change.
public struct ObjectID: Hashable, Sendable, Codable, RawRepresentable, CustomStringConvertible {
    public let rawValue: String
    public init(rawValue: String) { self.rawValue = rawValue }

    public static func star(hip: Int) -> ObjectID { ObjectID(rawValue: "star:\(hip)") }
    public static func body(_ body: SolarSystemBody) -> ObjectID { ObjectID(rawValue: "body:\(body.rawValue)") }
    public static func constellation(_ abbreviation: String) -> ObjectID { ObjectID(rawValue: "con:\(abbreviation)") }
    public static func deepSky(_ id: String) -> ObjectID { ObjectID(rawValue: "dso:\(id)") }
    public static func satellite(norad: Int) -> ObjectID { ObjectID(rawValue: "sat:\(norad)") }

    public enum Kind: Sendable, Hashable {
        case star(hip: Int)
        case body(SolarSystemBody)
        case constellation(String)
        case deepSky(String)
        case satellite(norad: Int)
    }

    public var kind: Kind? {
        guard let colon = rawValue.firstIndex(of: ":") else { return nil }
        let value = String(rawValue[rawValue.index(after: colon)...])
        switch rawValue[..<colon] {
        case "star": return Int(value).map { .star(hip: $0) }
        case "body": return SolarSystemBody(rawValue: value).map { .body($0) }
        case "con": return .constellation(value)
        case "dso": return .deepSky(value)
        case "sat": return Int(value).map { .satellite(norad: $0) }
        default: return nil
        }
    }

    public var description: String { rawValue }
}

public enum ObjectType: String, Sendable, Codable, CaseIterable {
    case star, planet, moon, sun, constellation, galaxy, nebula, openCluster, globularCluster
    case planetaryNebula, supernovaRemnant, clusterNebula, starCloud, asterism, doubleStar, satellite

    public var displayName: String {
        switch self {
        case .star: "Star"
        case .planet: "Planet"
        case .moon: "Moon"
        case .sun: "Star"
        case .constellation: "Constellation"
        case .galaxy: "Galaxy"
        case .nebula: "Nebula"
        case .openCluster: "Open cluster"
        case .globularCluster: "Globular cluster"
        case .planetaryNebula: "Planetary nebula"
        case .supernovaRemnant: "Supernova remnant"
        case .clusterNebula: "Cluster with nebula"
        case .starCloud: "Star cloud"
        case .asterism: "Asterism"
        case .doubleStar: "Double star"
        case .satellite: "Satellite"
        }
    }

    public var isDeepSky: Bool {
        switch self {
        case .galaxy, .nebula, .openCluster, .globularCluster, .planetaryNebula,
             .supernovaRemnant, .clusterNebula, .starCloud, .asterism, .doubleStar:
            true
        default:
            false
        }
    }
}

/// Grouping used by search results and Explore.
public enum ObjectCategory: String, Sendable, CaseIterable {
    case solarSystem = "Solar System"
    case stars = "Stars"
    case constellations = "Constellations"
    case deepSky = "Deep Sky"
    case satellites = "Satellites"
}

/// Measured stellar data, present only for stars.
public struct StarProperties: Sendable, Hashable {
    public let hip: Int
    /// Spectral classification such as "A0Va".
    public let spectralType: String?
    /// Johnson B−V color index.
    public let colorIndex: Double?
    /// Trigonometric parallax in milliarcseconds, nil when unmeasured.
    public let parallaxMas: Double?
    /// Proper motion in milliarcseconds per year, RA already scaled by cos δ.
    public let properMotionRA: Double
    public let properMotionDec: Double
    public let bayer: String?
    public let flamsteed: String?
    public let hr: Int?
    public let hd: Int?

    /// Distance from parallax. Below 2 mas the Hipparcos errors make the figure
    /// unreliable, so none is offered.
    public var distanceLightYears: Double? {
        guard let p = parallaxMas, p >= 2 else { return nil }
        return 3261.56 / p
    }
}

public struct DeepSkyProperties: Sendable, Hashable {
    public let messier: Int?
    public let ngc: String?
    /// Major and minor axes in arcminutes.
    public let majorAxis: Double?
    public let minorAxis: Double?
    /// Curated distance, always approximate.
    public let distanceLightYears: Double?
}

/// The one type every list, detail page and search result works with.
public struct SkyObject: Identifiable, Sendable, Hashable {
    public let id: ObjectID
    public let type: ObjectType
    public let name: String
    /// Every other label the object answers to, for display and search.
    public let designations: [String]
    /// J2000 position. Nil for moving objects, whose position depends on time.
    public let position: Equatorial?
    public let magnitude: Double?
    /// IAU constellation abbreviation.
    public let constellation: String?
    public let star: StarProperties?
    public let deepSky: DeepSkyProperties?

    public init(
        id: ObjectID, type: ObjectType, name: String, designations: [String] = [],
        position: Equatorial? = nil, magnitude: Double? = nil, constellation: String? = nil,
        star: StarProperties? = nil, deepSky: DeepSkyProperties? = nil
    ) {
        self.id = id
        self.type = type
        self.name = name
        self.designations = designations
        self.position = position
        self.magnitude = magnitude
        self.constellation = constellation
        self.star = star
        self.deepSky = deepSky
    }

    public var category: ObjectCategory {
        switch type {
        case .star: .stars
        case .planet, .moon, .sun: .solarSystem
        case .constellation: .constellations
        case .satellite: .satellites
        default: .deepSky
        }
    }

    public var solarSystemBody: SolarSystemBody? {
        if case .body(let body) = id.kind { return body }
        return nil
    }

    /// The target for rise and set searches. Satellites need pass prediction
    /// instead, and constellations use their centre.
    public var skyTarget: SkyTarget? {
        if let body = solarSystemBody { return .body(body) }
        return position.map { .fixed($0) }
    }
}

public struct Constellation: Sendable, Identifiable, Hashable {
    public let id: String
    public let name: String
    public let genitive: String
    /// Figure polylines as Hipparcos numbers.
    public let lines: [[Int]]
    /// Boundary rings in J2000 degrees, as (ra, dec).
    public let boundaries: [[Equatorial]]
    /// Label anchor in J2000.
    public let center: Equatorial
    public let meaning: String?

    /// The calendar month (1...12) when it stands highest at about 9 pm local time.
    /// It transits when local sidereal time equals its right ascension. At 21:00 the
    /// Sun has hour angle 9h, so the Sun's RA must be RA − 9h, and the Sun gains 2h of
    /// RA per month starting from 0h at the March equinox.
    public var bestEveningMonth: Int {
        var sunRA = (center.rightAscension - 9).truncatingRemainder(dividingBy: 24)
        if sunRA < 0 { sunRA += 24 }
        let monthsAfterEquinox = sunRA / 2
        // Month 3 + 20/31 is the equinox date, expressed in fractional months.
        let month = (2 + 21.0 / 30 + monthsAfterEquinox).truncatingRemainder(dividingBy: 12)
        return Int(month) + 1
    }

    /// Whether any of the figure clears the horizon well enough from a latitude.
    public func isVisible(fromLatitude latitude: Double) -> Bool {
        90 - abs(latitude - center.declination) > 10
    }
}

/// Curated text. Facts here were written by hand, and the app must show nothing
/// rather than invent copy when an entry is absent.
public struct BodyEditorial: Sendable, Hashable, Codable {
    public let summary: String
    public let learn: String
    public let facts: [Fact]
    public let observing: String

    public struct Fact: Sendable, Hashable, Codable {
        public let label: String
        public let value: String
    }
}

public struct ObjectEditorial: Sendable, Hashable, Codable {
    public let name: String?
    public let note: String?
    public let distanceLy: Double?
}
