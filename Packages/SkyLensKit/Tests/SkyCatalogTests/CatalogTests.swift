import AstronomyCore
import Foundation
import Testing
@testable import SkyCatalog

/// Loading is expensive, so all suites share one immutable instance.
enum Shared {
    static let catalog: Catalog = {
        do { return try Catalog.loadBundled() } catch { fatalError("catalog load failed: \(error)") }
    }()
}

@Suite("Catalog contents")
struct CatalogContentTests {
    let catalog = Shared.catalog

    @Test func starCountMatchesProvenance() {
        #expect(catalog.stars.count == catalog.provenance.counts.stars)
        #expect(catalog.stars.count > 118_000)
    }

    @Test func starsAreSortedBrightestFirst() {
        let m = catalog.stars.magnitude
        #expect(zip(m, m.dropFirst()).allSatisfy { $0 <= $1 })
    }

    /// Published Hipparcos values (ESA SP-1200).
    @Test func siriusIsTheBrightestStarAndCorrect() throws {
        #expect(catalog.stars.hip[0] == 32349)
        let s = try #require(catalog.star(hip: 32349))
        #expect(s.name == "Sirius")
        #expect(s.magnitude == -1.44)
        #expect(s.constellation == "CMa")
        #expect(abs((s.position?.declination ?? 0) - (-16.716)) < 0.01)
        #expect(abs((s.star?.distanceLightYears ?? 0) - 8.6) < 0.1)
    }

    @Test(arguments: [
        (91262, "Vega", "Lyr", 0.03), (27989, "Betelgeuse", "Ori", 0.45),
        (11767, "Polaris", "UMi", 1.97), (24436, "Rigel", "Ori", 0.18), (80763, "Antares", "Sco", 1.06),
    ])
    func knownStars(hip: Int, name: String, con: String, mag: Double) throws {
        let s = try #require(catalog.star(hip: hip))
        #expect(s.name == name)
        #expect(s.constellation == con)
        #expect(abs((s.magnitude ?? 99) - mag) < 0.02)
    }

    /// Stars without an astrometric solution must survive, or constellation figures
    /// get holes. ξ UMa is the case that exposed this.
    @Test func starsWithoutAstrometryArePresent() throws {
        let xi = try #require(catalog.star(hip: 55203))
        #expect(xi.star?.parallaxMas == nil)
        #expect(xi.star?.distanceLightYears == nil)
        #expect(xi.constellation == "UMa")
    }

    @Test func exactlyEightyEightConstellations() {
        #expect(catalog.constellations.count == 88)
        #expect(Set(catalog.constellations.map(\.id)).count == 88)
    }

    @Test func everyConstellationHasMeaningAndBoundary() {
        for c in catalog.constellations {
            #expect(c.meaning != nil, "\(c.id)")
            #expect(!c.boundaries.isEmpty, "\(c.id)")
        }
    }

    @Test func everyFigureStarExistsAndLiesInOrNearItsConstellation() {
        for c in catalog.constellations {
            #expect(!c.lines.isEmpty, "\(c.id) has no figure")
            for hip in c.lines.flatMap({ $0 }) {
                #expect(catalog.stars.index(hip: hip) != nil, "\(c.id) HIP \(hip)")
            }
        }
    }

    /// Cross-checks d3-celestial's figures against the IAU boundaries as computed
    /// independently by Astronomy Engine. A few classic figures borrow a star from
    /// a neighbour (Alpheratz in Pegasus, Elnath in Taurus), hence a tolerance.
    @Test func figureStarsMostlyFallInsideTheirConstellation() {
        var total = 0, inside = 0
        for c in catalog.constellations {
            for hip in Set(c.lines.flatMap({ $0 })) {
                total += 1
                if catalog.star(hip: hip)?.constellation == c.id { inside += 1 }
            }
        }
        #expect(Double(inside) / Double(total) > 0.93, "\(inside)/\(total)")
    }

    @Test func constellationLabelsFallInsideThemselvesForTheMajorFigures() {
        for id in ["Ori", "UMa", "Cas", "Cyg", "Leo", "Sco", "Cru"] {
            let c = catalog.constellation(id)
            #expect(c.map { Ephemeris.constellationAbbreviation(of: $0.center) == id } == true, "\(id)")
        }
    }

    @Test func everyMessierObjectIsPresent() {
        let numbers = catalog.messier.compactMap { $0.deepSky?.messier }
        #expect(numbers == Array(1...110))
    }

    @Test(arguments: [
        ("M31", "Andromeda Galaxy", ObjectType.galaxy, "And"), ("M42", "Orion Nebula", .nebula, "Ori"),
        ("M45", "Pleiades", .openCluster, "Tau"), ("M13", "Hercules Cluster", .globularCluster, "Her"),
        ("M57", "Ring Nebula", .planetaryNebula, "Lyr"), ("M1", "Crab Nebula", .supernovaRemnant, "Tau"),
    ])
    func notableDeepSky(id: String, name: String, type: ObjectType, con: String) throws {
        let o = try #require(catalog.object(.deepSky(id)))
        #expect(o.name == name)
        #expect(o.type == type)
        #expect(o.constellation == con)
    }

    @Test func everyEditorialDeepSkyKeyResolves() throws {
        // A typo in editorial.json would silently lose its copy.
        let data = try Catalog.resourceData(named: "editorial.json")
        let file = try JSONDecoder().decode(EditorialFile.self, from: data)
        for key in file.deepSky.keys {
            #expect(catalog.object(.deepSky(key)) != nil, "editorial entry \(key) has no object")
        }
        for key in file.stars.keys {
            #expect(catalog.star(hip: Int(key) ?? -1) != nil, "editorial star \(key)")
        }
        #expect(file.bodies.count == SolarSystemBody.allCases.count)
    }

    @Test func provenanceNamesEverySource() {
        #expect(catalog.provenance.sources.count >= 6)
        #expect(catalog.provenance.sources.allSatisfy { $0.url.hasPrefix("https://") })
    }
}

@Suite("Star catalog behaviour")
struct StarCatalogTests {
    let stars = Shared.catalog.stars

    @Test func magnitudeLimitIsAPrefix() {
        let n = stars.count(brighterThan: 6.5)
        #expect(stars.magnitude[n - 1] <= 6.5)
        #expect(stars.magnitude[n] > 6.5)
        #expect((8000...10000).contains(n))
        #expect(stars.count(brighterThan: -5) == 0)
        #expect(stars.count(brighterThan: 99) == stars.count)
    }

    @Test func rejectsCorruptFiles() {
        #expect(throws: StarCatalog.LoadError.self) { try StarCatalog(data: Data("nope".utf8)) }
        var truncated = Data("SKS1".utf8)
        truncated.append(contentsOf: [100, 0, 0, 0])
        #expect(throws: StarCatalog.LoadError.self) { try StarCatalog(data: truncated) }
    }

    /// Barnard's Star moves 10.3″ a year, the fastest of any star. Twenty-four years
    /// should shift it by 4.1 arcminutes. At the catalog epoch nothing moves.
    @Test func properMotionUsesTheRightScale() throws {
        let i = try #require(stars.index(hip: 87937))
        let moved = stars.direction(at: i, yearsSinceJ2000: 24).angle(to: stars.direction(at: i)) * 60
        #expect(abs(moved - 4.14) < 0.1)
    }

    @Test func vertexDataHasFiveFloatsPerStar() {
        let v = stars.vertexData(yearsSinceJ2000: 26)
        #expect(v.count == stars.count * 5)
        // Sirius is first: its direction must be a unit vector and its magnitude intact.
        #expect(abs((v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) - 1) < 1e-5)
        #expect(v[3] == -1.44)
        #expect(!v.contains { $0.isNaN })
    }

    @Test func starColors() {
        #expect(abs(StarColor.temperature(colorIndex: 0.65) - 5800) < 200, "the Sun")
        let blue = StarColor.rgb(colorIndex: -0.3)
        let red = StarColor.rgb(colorIndex: 1.8)
        #expect(blue.b > blue.r)
        #expect(red.r > red.b)
        #expect(StarColor.name(colorIndex: 1.85) == "red-orange")
    }
}

@Suite("Search")
struct SearchTests {
    let catalog = Shared.catalog

    private func top(_ q: String) -> ObjectID? { catalog.searchIndex.search(q).first?.id }

    @Test(arguments: [
        ("vega", ObjectID.star(hip: 91262)), ("Sirius", .star(hip: 32349)), ("mars", .body(.mars)),
        ("orion", .constellation("Ori")), ("the moon", nil as ObjectID?),
    ])
    func commonNames(q: String, id: ObjectID?) {
        if let id { #expect(top(q) == id) }
    }

    @Test(arguments: ["M31", "m31", "M 31", "messier 31", "Messier31", "NGC 224", "ngc224", "andromeda gal"])
    func messierForms(q: String) {
        #expect(top(q) == .deepSky("M31"), "\(q)")
    }

    @Test(arguments: ["α Lyr", "alpha lyrae", "alp lyr", "alf lyr", "HIP 91262", "hip91262", "HR 7001", "HD 172167", "3 Lyr"])
    func designations(q: String) {
        #expect(top(q) == .star(hip: 91262), "\(q)")
    }

    @Test(arguments: [("betelguese", 27989), ("betelgeuze", 27989), ("aldebaren", 21421), ("arcturis", 69673), ("rigle", 24436)])
    func typoTolerance(q: String, hip: Int) {
        #expect(top(q) == .star(hip: hip), "\(q)")
    }

    @Test func prefixMatchesWhileTyping() {
        #expect(top("betel") == .star(hip: 27989))
        #expect(top("androm") != nil)
        #expect(catalog.searchIndex.search("ar").count > 5)
    }

    @Test func diacriticsAreIgnored() {
        #expect(SearchIndex.normalize("Sadalbarí") == "sadalbari")
    }

    @Test func messyInputIsSafe() {
        #expect(catalog.searchIndex.search("").isEmpty)
        #expect(catalog.searchIndex.search("   ").isEmpty)
        #expect(catalog.searchIndex.search("!!!").isEmpty)
        #expect(catalog.searchIndex.search("zzzzqqqq").isEmpty)
    }

    @Test func aliasIsReportedForDesignationMatches() {
        let r = catalog.searchIndex.search("HIP 91262").first
        #expect(r?.name == "Vega")
        #expect(r?.matchedAlias == "HIP 91262")
    }

    @Test func resultsCarryCategories() {
        #expect(catalog.searchIndex.search("jupiter").first?.category == .solarSystem)
        #expect(catalog.searchIndex.search("pleiades").first?.category == .deepSky)
    }

    @Test func editDistance() {
        #expect(SearchIndex.editDistance("vega", "vega", limit: 1) == 0)
        #expect(SearchIndex.editDistance("vega", "vgea", limit: 1) == 1, "transposition counts once")
        #expect(SearchIndex.editDistance("vega", "sirius", limit: 2) == nil)
    }
}

@Suite("Lookup and description")
struct LookupTests {
    let catalog = Shared.catalog

    @Test func idsRoundTripThroughEveryKind() {
        for id in [ObjectID.star(hip: 91262), .body(.mars), .constellation("Ori"), .deepSky("M31"), .deepSky("NGC 224")] {
            #expect(ObjectID(rawValue: id.rawValue).kind == id.kind)
        }
        #expect(ObjectID.satellite(norad: 25544).kind == .satellite(norad: 25544))
        #expect(ObjectID(rawValue: "junk").kind == nil)
        #expect(catalog.object(ObjectID(rawValue: "star:999999999")) == nil)
    }

    @Test func bodyEditorialIsComplete() {
        for body in SolarSystemBody.allCases {
            let e = catalog.editorial(for: body)
            #expect(e?.facts.count ?? 0 >= 5, "\(body)")
            #expect((e?.learn.count ?? 0) > 100, "\(body)")
        }
    }

    @Test func movingObjectsHaveNoFixedPosition() {
        #expect(catalog.object(.body(.mars))?.position == nil)
        #expect(catalog.object(.body(.mars))?.skyTarget == .body(.mars))
        #expect(catalog.object(.star(hip: 91262))?.skyTarget != nil)
    }

    @Test func unnamedStarDescriptionUsesMeasuredDataOnly() throws {
        // HIP 91971 is ζ¹ Lyr: described from its catalog values, with no curated copy.
        let s = try #require(catalog.star(hip: 91971))
        let text = ObjectDescriber.describe(s, in: catalog)
        #expect(text.contains("Lyra"))
        #expect(text.hasSuffix("."))
    }

    @Test func descriptionOmitsUnknownDistance() throws {
        let xi = try #require(catalog.star(hip: 55203))
        #expect(!ObjectDescriber.describe(xi, in: catalog).contains("light-years"))
    }

    @Test func luminosityClassesParseInTheRightOrder() {
        #expect(ObjectDescriber.luminosityDescription("K0III") == "giant")
        #expect(ObjectDescriber.luminosityDescription("F5IV") == "subgiant")
        #expect(ObjectDescriber.luminosityDescription("G2V") == "main-sequence star")
        #expect(ObjectDescriber.luminosityDescription("M1-2Ia-Iab") == "supergiant")
        #expect(ObjectDescriber.luminosityDescription("A0") == nil)
    }
}

@Suite("Constellation seasons")
struct SeasonTests {
    let catalog = Shared.catalog

    /// Well-known evening culminations, from any planisphere.
    @Test(arguments: [("Ori", 1...2), ("Leo", 4...5), ("Lyr", 8...9), ("Cyg", 9...10), ("Peg", 10...11), ("Sco", 7...8), ("Cru", 5...6)])
    func bestMonths(id: String, months: ClosedRange<Int>) throws {
        let c = try #require(catalog.constellation(id))
        #expect(months.contains(c.bestEveningMonth), "\(id) gave \(c.bestEveningMonth)")
    }

    @Test func monthsWrapIntoTheCalendar() {
        for c in catalog.constellations { #expect((1...12).contains(c.bestEveningMonth)) }
    }

    @Test func hemispheresDiffer() throws {
        let crux = try #require(catalog.constellation("Cru"))
        #expect(!crux.isVisible(fromLatitude: 52))
        #expect(crux.isVisible(fromLatitude: -33))
    }
}
