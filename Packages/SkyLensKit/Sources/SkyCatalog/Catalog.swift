import AstronomyCore
import Foundation

/// Immutable after loading, so it can be shared across actors freely.
public final class Catalog: Sendable {
    public let stars: StarCatalog
    public let constellations: [Constellation]
    public let deepSky: [SkyObject]
    public let provenance: Provenance
    public let searchIndex: SearchIndex

    private let starMeta: [Int: StarMeta]
    private let constellationByID: [String: Constellation]
    private let deepSkyByID: [String: SkyObject]
    private let bodyEditorial: [String: BodyEditorial]
    private let starEditorial: [Int: ObjectEditorial]
    private let deepSkyEditorial: [String: ObjectEditorial]
    private let namedStarsByBrightness: [Int]

    struct StarMeta: Sendable {
        let name: String?
        let bayer: String?
        let flamsteed: String?
        let hr: Int?
        let hd: Int?
        let spectralType: String?
    }

    public struct Provenance: Sendable, Decodable {
        public struct Source: Sendable, Decodable, Identifiable {
            public let name: String
            public let use: String
            public let url: String
            public var id: String { name }
        }

        public struct Counts: Sendable, Decodable {
            public let stars: Int
            public let constellations: Int
            public let deepSky: Int
            public let messier: Int
        }

        public let counts: Counts
        public let sources: [Source]
    }

    public enum LoadError: Error, Sendable {
        case missingResource(String)
        case malformed(String)
    }

    /// Loads from the package bundle, or from `SKYLENS_RESOURCES` when one is set
    /// (the Wasm test harness has no bundles).
    public static func loadBundled() throws -> Catalog {
        try Catalog(reader: Self.resourceData(named:))
    }

    static func resourceData(named name: String) throws -> Data {
        if let override = ProcessInfo.processInfo.environment["SKYLENS_RESOURCES"] {
            return try Data(contentsOf: URL(fileURLWithPath: "\(override)/\(name)"))
        }
        #if SWIFT_PACKAGE
        guard let url = Bundle.module.url(forResource: name, withExtension: nil, subdirectory: "Resources") else {
            throw LoadError.missingResource(name)
        }
        return try Data(contentsOf: url)
        #else
        throw LoadError.missingResource(name)
        #endif
    }

    init(reader: (String) throws -> Data) throws {
        let starTable = try StarCatalog(data: reader("stars.bin"))
        stars = starTable
        provenance = try JSONDecoder().decode(Provenance.self, from: reader("provenance.json"))

        let editorial = try JSONDecoder().decode(EditorialFile.self, from: reader("editorial.json"))
        bodyEditorial = editorial.bodies
        deepSkyEditorial = editorial.deepSky
        var byHip: [Int: ObjectEditorial] = [:]
        for (key, value) in editorial.stars {
            guard let hip = Int(key) else { throw LoadError.malformed("editorial star key \(key)") }
            byHip[hip] = value
        }
        starEditorial = byHip

        var meta: [Int: StarMeta] = [:]
        let tsv = String(decoding: try reader("stars-meta.tsv"), as: UTF8.self)
        for line in tsv.split(separator: "\n") {
            let f = line.split(separator: "\t", omittingEmptySubsequences: false)
            guard f.count >= 7, let hip = Int(f[0]) else { throw LoadError.malformed("stars-meta row") }
            func text(_ i: Int) -> String? { f[i].isEmpty ? nil : String(f[i]) }
            meta[hip] = StarMeta(
                name: text(1), bayer: text(2), flamsteed: text(3),
                hr: Int(f[4]), hd: Int(f[5]), spectralType: text(6)
            )
        }
        starMeta = meta

        struct RawConstellation: Decodable {
            let id: String, name: String, genitive: String
            let lines: [[Int]]
            let bounds: [[[Double]]]
            let center: [Double]
        }
        let rawConstellations = try JSONDecoder().decode([RawConstellation].self, from: reader("constellations.json"))
        constellations = rawConstellations.map { c in
            Constellation(
                id: c.id, name: c.name, genitive: c.genitive, lines: c.lines,
                boundaries: c.bounds.map { ring in
                    ring.map { Equatorial(rightAscension: $0[0] / 15, declination: $0[1]) }
                },
                center: Equatorial(rightAscension: c.center[0] / 15, declination: c.center[1]),
                meaning: editorial.constellations[c.id]
            )
        }
        constellationByID = Dictionary(uniqueKeysWithValues: constellations.map { ($0.id, $0) })

        var dso: [SkyObject] = []
        let deepTsv = String(decoding: try reader("deepsky.tsv"), as: UTF8.self)
        for line in deepTsv.split(separator: "\n") {
            let f = line.split(separator: "\t", omittingEmptySubsequences: false)
            guard f.count >= 9, let type = ObjectType(rawValue: String(f[3])),
                  let ra = Double(f[4]), let dec = Double(f[5]) else {
                throw LoadError.malformed("deepsky row \(line)")
            }
            let id = String(f[0])
            let note = editorial.deepSky[id]
            let position = Equatorial(rightAscension: ra / 15, declination: dec)
            let ngc = f[2].isEmpty ? nil : String(f[2])
            var designations: [String] = []
            if id.hasPrefix("M"), let ngc { designations.append(ngc) }
            if note?.name != nil { designations.append(id) }
            dso.append(SkyObject(
                id: .deepSky(id), type: type, name: note?.name ?? id, designations: designations,
                position: position, magnitude: Double(f[6]),
                constellation: Ephemeris.constellationAbbreviation(of: position),
                deepSky: DeepSkyProperties(
                    messier: Int(f[1]), ngc: ngc, majorAxis: Double(f[7]), minorAxis: Double(f[8]),
                    distanceLightYears: note?.distanceLy
                )
            ))
        }
        deepSky = dso
        deepSkyByID = Dictionary(uniqueKeysWithValues: dso.map { (String($0.id.rawValue.dropFirst(4)), $0) })

        let named = meta.filter { $0.value.name != nil }.keys
            .compactMap { hip in starTable.index(hip: hip).map { (hip, starTable.magnitude[$0]) } }
            .sorted { $0.1 < $1.1 }
            .map(\.0)
        namedStarsByBrightness = named

        searchIndex = SearchIndex(
            entries: Self.searchEntries(
                stars: starTable, meta: meta, constellations: constellations, deepSky: dso
            )
        )
    }

    // MARK: Lookup

    public func object(_ id: ObjectID) -> SkyObject? {
        switch id.kind {
        case .star(let hip): star(hip: hip)
        case .body(let body): Self.object(for: body)
        case .constellation(let abbreviation): constellation(abbreviation).map(object(for:))
        case .deepSky(let key): deepSkyByID[key]
        default: nil
        }
    }

    public func constellation(_ abbreviation: String) -> Constellation? {
        constellationByID[abbreviation]
    }

    public func object(for c: Constellation) -> SkyObject {
        SkyObject(
            id: .constellation(c.id), type: .constellation, name: c.name,
            designations: [c.id, c.genitive], position: c.center
        )
    }

    public static func object(for body: SolarSystemBody) -> SkyObject {
        let type: ObjectType = switch body {
        case .sun: .sun
        case .moon: .moon
        default: .planet
        }
        return SkyObject(id: .body(body), type: type, name: body.name)
    }

    public func star(hip: Int) -> SkyObject? {
        guard let i = stars.index(hip: hip) else { return nil }
        let meta = starMeta[hip]
        let bv = stars.colorIndex[i]
        let plx = stars.parallax[i]
        let properties = StarProperties(
            hip: hip, spectralType: meta?.spectralType,
            colorIndex: bv.isNaN ? nil : Double(bv),
            parallaxMas: plx > 0 ? Double(plx) : nil,
            properMotionRA: Double(stars.properMotionRA[i]),
            properMotionDec: Double(stars.properMotionDec[i]),
            bayer: meta?.bayer, flamsteed: meta?.flamsteed, hr: meta?.hr, hd: meta?.hd
        )
        var labels: [String] = []
        if meta?.name != nil, let b = meta?.bayer { labels.append(b) }
        if let f = meta?.flamsteed { labels.append(f) }
        if let hr = meta?.hr { labels.append("HR \(hr)") }
        if let hd = meta?.hd { labels.append("HD \(hd)") }
        labels.append("HIP \(hip)")
        let primary = meta?.name ?? meta?.bayer ?? meta?.flamsteed ?? "HIP \(hip)"
        labels.removeAll { $0 == primary }
        let position = Equatorial(
            rightAscension: Double(stars.rightAscension[i]) / 15,
            declination: Double(stars.declination[i])
        )
        return SkyObject(
            id: .star(hip: hip), type: .star, name: primary, designations: labels,
            // Float storage would otherwise surface as −1.4400000572.
            position: position, magnitude: (Double(stars.magnitude[i]) * 100).rounded() / 100,
            constellation: Ephemeris.constellationAbbreviation(of: position), star: properties
        )
    }

    /// Stars with proper names, brightest first.
    public func namedStars(limit: Int = .max) -> [SkyObject] {
        namedStarsByBrightness.prefix(limit).compactMap { star(hip: $0) }
    }

    /// A star's label for the sky: its proper name, or nil if unnamed.
    public func properName(hip: Int) -> String? { starMeta[hip]?.name }

    public var messier: [SkyObject] {
        deepSky.filter { $0.deepSky?.messier != nil }
            .sorted { ($0.deepSky?.messier ?? 0) < ($1.deepSky?.messier ?? 0) }
    }

    public func editorial(for body: SolarSystemBody) -> BodyEditorial? {
        bodyEditorial[body.rawValue]
    }

    public func editorial(for object: SkyObject) -> ObjectEditorial? {
        switch object.id.kind {
        case .star(let hip): starEditorial[hip]
        case .deepSky(let key): deepSkyEditorial[key]
        default: nil
        }
    }

    // MARK: Search index construction

    private static func searchEntries(
        stars: StarCatalog, meta: [Int: StarMeta], constellations: [Constellation], deepSky: [SkyObject]
    ) -> [SearchIndex.Entry] {
        var entries: [SearchIndex.Entry] = []
        entries.reserveCapacity(meta.count + deepSky.count + 110)

        for body in SolarSystemBody.allCases {
            let category: ObjectCategory = .solarSystem
            entries.append(.init(id: .body(body), name: body.name, aliases: [], category: category, popularity: 100))
        }
        for c in constellations {
            entries.append(.init(id: .constellation(c.id), name: c.name, aliases: [c.id, c.genitive], category: .constellations, popularity: 60))
        }
        let genitive = Dictionary(uniqueKeysWithValues: constellations.map { ($0.id, $0.genitive) })
        for (hip, m) in meta {
            guard let i = stars.index(hip: hip) else { continue }
            var aliases: [String] = []
            for designation in [m.bayer, m.flamsteed].compactMap({ $0 }) {
                aliases.append(designation)
                // "α Lyr" also answers to "alpha lyrae".
                if let space = designation.firstIndex(of: " "),
                   let g = genitive[String(designation[designation.index(after: space)...])] {
                    aliases.append("\(designation[..<space]) \(g)")
                }
            }
            if let hr = m.hr { aliases.append("HR \(hr)") }
            if let hd = m.hd { aliases.append("HD \(hd)") }
            aliases.append("HIP \(hip)")
            let name = m.name ?? m.bayer ?? m.flamsteed ?? "HIP \(hip)"
            // Named stars outrank designations, and brighter stars outrank fainter.
            let popularity = (m.name != nil ? 40.0 : 0) + max(0, 12 - Double(stars.magnitude[i]))
            entries.append(.init(id: .star(hip: hip), name: name, aliases: aliases, category: .stars, popularity: popularity))
        }
        for d in deepSky {
            var aliases = d.designations
            if let m = d.deepSky?.messier { aliases.append("Messier \(m)") }
            let curated = d.designations.isEmpty ? 0.0 : 20
            let popularity = curated + (d.deepSky?.messier != nil ? 30.0 : 0) + max(0, 12 - (d.magnitude ?? 12))
            entries.append(.init(id: d.id, name: d.name, aliases: aliases, category: .deepSky, popularity: popularity))
        }
        return entries
    }
}

struct EditorialFile: Decodable {
    let bodies: [String: BodyEditorial]
    let constellations: [String: String]
    let stars: [String: ObjectEditorial]
    let deepSky: [String: ObjectEditorial]
}

/// Sentences built only from measured catalog values, for objects that have no
/// curated note. Nothing is stated that the data does not support.
public enum ObjectDescriber {
    public static func describe(_ object: SkyObject, in catalog: Catalog) -> String {
        let place = object.constellation.flatMap { catalog.constellation($0)?.name }
        if let star = object.star {
            var parts: [String] = []
            let color = star.colorIndex.map(StarColor.name(colorIndex:))
            let kind = star.spectralType.flatMap(luminosityDescription) ?? "star"
            var opening = "A \(color.map { "\($0) " } ?? "")\(kind)"
            if let place { opening += " in \(place)" }
            parts.append(opening)
            if let ly = star.distanceLightYears {
                parts.append("about \(AstroFormat.distance(lightYears: ly)) away")
            }
            return parts.joined(separator: ", ") + "."
        }
        if object.type.isDeepSky {
            var text = "\(article(object.type.displayName)) \(object.type.displayName.lowercased())"
            if let place { text += " in \(place)" }
            if let m = object.magnitude { text += ", magnitude \(String(format: "%.1f", m))" }
            if let d = object.deepSky?.majorAxis { text += ", \(AstroFormat.angularSize(degrees: d / 60)) across" }
            return text + "."
        }
        return object.type.displayName
    }

    private static func article(_ word: String) -> String {
        "aeiou".contains(word.prefix(1).lowercased()) ? "An" : "A"
    }

    /// Reads the luminosity class from a spectral type such as "K0III".
    static func luminosityDescription(_ type: String) -> String? {
        let t = type.uppercased()
        // Order matters: "III" contains "II", and "IV" contains "V".
        if t.contains("IA") || t.contains("IB") { return "supergiant" }
        if t.contains("III") { return "giant" }
        if t.contains("IV") { return "subgiant" }
        if t.contains("II") { return "bright giant" }
        if t.contains("V") { return "main-sequence star" }
        return nil
    }
}
