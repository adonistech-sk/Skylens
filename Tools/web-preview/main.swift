// Engine bridge for the browser preview. Reads one JSON request per line on stdin and
// writes one JSON response per line on stdout, using the same SkyLensKit code as the
// iOS app, so the preview never reimplements any astronomy.

import AstronomyCore
import Foundation
@testable import ObservingKit
@testable import Satellites
import SkyCatalog
import SkyProjection
import SkySession

struct Request: Decodable {
    let id: Int
    let op: String
    var lat: Double?
    var lon: Double?
    var elev: Double?
    var date: Double?
    var q: String?
    var oid: String?
    var tz: String?
    var equipment: [String]?
    var experience: String?
    var weather: String?
    var satellites: String?
    var days: Double?
    var category: String?
    var imperial: Bool?
}

enum BridgeError: Error { case badRequest(String) }

func vec(_ v: Vec3) -> [Double] { [v.x, v.y, v.z] }
func flat(_ segments: [SkySegment]) -> [Double] {
    var out: [Double] = []
    out.reserveCapacity(segments.count * 6)
    for s in segments { out += vec(s.a) + vec(s.b) }
    return out.map { ($0 * 100_000).rounded() / 100_000 }
}

let catalog: Catalog
do {
    catalog = try Catalog.loadBundled()
} catch {
    FileHandle.standardOutput.write(Data("{\"fatal\":\"catalog failed: \(error)\"}\n".utf8))
    exit(1)
}

var trackers: [Int: SatelliteTracker] = [:]
var satelliteElements: [OrbitalElements] = []
var weatherCache: (text: String, forecast: WeatherForecast)?

func observer(_ r: Request) throws -> ObserverLocation {
    guard let lat = r.lat, let lon = r.lon else { throw BridgeError.badRequest("location required") }
    return ObserverLocation(latitude: lat, longitude: lon, elevation: r.elev ?? 0)
}

func date(_ r: Request) -> Date {
    SkyClock.clamp(r.date.map { Date(timeIntervalSince1970: $0) } ?? Date())
}

func object(_ id: ObjectID) -> SkyObject? {
    if case .satellite(let norad) = id.kind {
        return satelliteElements.first { $0.noradID == norad }.map {
            SkyObject(id: id, type: .satellite, name: $0.name, designations: ["NORAD \(norad)"])
        }
    }
    return catalog.object(id)
}

func tracker(_ id: ObjectID) -> SatelliteTracker? {
    if case .satellite(let norad) = id.kind { return trackers[norad] }
    return nil
}

func rowJSON(_ o: SkyObject, subtitle: String? = nil) -> [String: Any] {
    var row: [String: Any] = ["id": o.id.rawValue, "name": o.name, "type": o.type.rawValue, "typeName": o.type.displayName]
    if let subtitle { row["subtitle"] = subtitle }
    if let m = o.magnitude { row["magnitude"] = m }
    return row
}

func describe(_ object: SkyObject) -> String {
    if let body = object.solarSystemBody, let text = catalog.editorial(for: body)?.summary { return text }
    if case .constellation(let id) = object.id.kind, let m = catalog.constellation(id)?.meaning { return "\(m)." }
    if let note = catalog.editorial(for: object)?.note { return note }
    if object.type == .satellite { return "An artificial satellite tracked from published orbital data." }
    return ObjectDescriber.describe(object, in: catalog)
}

func observingAdvice(_ object: SkyObject) -> String? {
    if let body = object.solarSystemBody { return catalog.editorial(for: body)?.observing }
    guard let m = object.magnitude else { return nil }
    if object.type == .star {
        return m <= 5.5 ? "Visible to the naked eye from a reasonably dark site." : "Too faint for the naked eye. Binoculars or a telescope will show it."
    }
    if object.type.isDeepSky {
        switch m {
        case ..<4.5: return "Visible to the naked eye from a dark site, and lovely in binoculars."
        case ..<8: return "A good binocular object, and better still in a small telescope."
        default: return "Best in a telescope, from somewhere dark, with the Moon out of the way."
        }
    }
    return nil
}

func scene() -> [String: Any] {
    let labels: [[String: Any]] = SkyLabels.all(catalog).map { l in
        var row: [String: Any] = [
            "id": l.id, "text": l.text, "style": Int(l.style.rawValue), "priority": l.priority, "maxFov": l.maxFieldOfView,
        ]
        if let d = l.direction { row["dir"] = vec(d) }
        return row
    }
    let deepSky: [[String: Any]] = catalog.deepSky.compactMap { o in
        guard let p = o.position else { return nil }
        return [
            "id": o.id.rawValue, "name": o.name, "type": o.type.rawValue, "dir": vec(p.unitVector),
            "mag": o.magnitude ?? 9, "size": o.deepSky?.majorAxis ?? 6,
        ]
    }
    let sources: [[String: Any]] = catalog.provenance.sources.map { ["name": $0.name, "use": $0.use] }
    return [
        "constellationLines": flat(SkyGeometry.constellationLines(catalog)),
        "boundaries": flat(SkyGeometry.constellationBoundaries(catalog)),
        "horizonGrid": flat(SkyGeometry.horizonGrid()),
        "equatorialGrid": flat(SkyGeometry.equatorialGrid()),
        "horizonLine": flat(SkyGeometry.horizonLine()),
        "labels": labels, "deepSky": deepSky, "sources": sources,
        "compass": SkyLabels.compass.map { ["text": $0.text, "dir": vec($0.direction)] as [String: Any] },
        "counts": ["stars": catalog.provenance.counts.stars, "deepSky": catalog.provenance.counts.deepSky],
    ]
}

func frame(_ r: Request) throws -> [String: Any] {
    let d = date(r), site = try observer(r)
    let f = SkyFrame(time: AstroTime(d), observer: site)
    let m = f.j2000ToHorizon
    var bodies: [[String: Any]] = []
    var sunAlt = -90.0, moonAlt: Double?, moonIllum = 0.0
    for body in SolarSystemBody.allCases {
        let p = try Ephemeris.position(of: body, at: f.time, for: site)
        let a = try Ephemeris.appearance(of: body, at: f.time)
        if body == .sun { sunAlt = p.apparent.altitude }
        if body == .moon { moonAlt = p.apparent.altitude; moonIllum = a.illuminatedFraction }
        bodies.append([
            "id": ObjectID.body(body).rawValue, "name": body.name, "dir": vec(p.geometric.unitVector),
            "mag": a.magnitude, "illum": a.illuminatedFraction, "phase": a.phaseAngle, "diameter": a.angularDiameter,
        ])
    }
    var satellites: [[String: Any]] = []
    for e in satelliteElements {
        guard let t = trackers[e.noradID], t.freshness(now: d).canPredict,
              let look = try? t.look(at: d, from: site), look.horizontal.altitude > 0 else { continue }
        satellites.append(["id": ObjectID.satellite(norad: e.noradID).rawValue, "name": e.name, "dir": vec(look.horizontal.unitVector)])
    }
    let brightness = SkyBrightness(sunAltitude: sunAlt, moonAltitude: moonAlt, moonIllumination: moonIllum)
    return [
        "matrix": [vec(m.r0), vec(m.r1), vec(m.r2)], "bodies": bodies, "satellites": satellites,
        "sunAltitude": sunAlt, "brightness": brightness.total,
    ]
}

func search(_ r: Request) -> [String: Any] {
    let q = r.q ?? ""
    var rows: [[String: Any]] = catalog.searchIndex.search(q).compactMap { hit in
        guard let o = object(hit.id) else { return nil }
        var row = rowJSON(o, subtitle: hit.matchedAlias ?? o.type.displayName)
        row["category"] = hit.category.rawValue
        return row
    }
    let n = SearchIndex.normalize(q)
    if !n.isEmpty {
        for e in satelliteElements where SearchIndex.normalize(e.name).contains(n) || String(e.noradID) == n {
            if let o = object(.satellite(norad: e.noradID)) {
                var row = rowJSON(o, subtitle: "NORAD \(e.noradID)")
                row["category"] = ObjectCategory.satellites.rawValue
                rows.append(row)
            }
        }
    }
    return ["results": rows]
}

func list(_ r: Request) throws -> [String: Any] {
    let site = try observer(r), d = date(r)
    var rows: [[String: Any]] = []
    switch r.category ?? "" {
    case "planets":
        for body in SolarSystemBody.planets {
            let o = Catalog.object(for: body)
            rows.append(rowJSON(o, subtitle: try Locator.locate(o, at: d, observer: site).explanation))
        }
    case "moon":
        let phase = try MoonPhase.at(AstroTime(d))
        rows.append(rowJSON(Catalog.object(for: .moon), subtitle: "\(phase.name.rawValue), \(Int((phase.illuminatedFraction * 100).rounded()))% lit"))
    case "constellations":
        for c in catalog.constellations.sorted(by: { $0.name < $1.name }) {
            rows.append(rowJSON(catalog.object(for: c), subtitle: c.meaning))
        }
    case "brightStars":
        for s in catalog.namedStars(limit: 150) {
            rows.append(rowJSON(s, subtitle: s.constellation.flatMap { catalog.constellation($0)?.name }))
        }
    case "deepSky":
        for o in catalog.deepSky.prefix(300) { rows.append(rowJSON(o, subtitle: o.type.displayName)) }
    case "satellites":
        for e in satelliteElements {
            if let o = object(.satellite(norad: e.noradID)) { rows.append(rowJSON(o, subtitle: "NORAD \(e.noradID)")) }
        }
    default:
        throw BridgeError.badRequest("unknown category")
    }
    return ["rows": rows]
}

func detail(_ r: Request) throws -> [String: Any] {
    guard let raw = r.oid, let o = object(ObjectID(rawValue: raw)) else { throw BridgeError.badRequest("unknown object") }
    let site = try observer(r), d = date(r)
    let obs = try Locator.observe(o, at: d, observer: site, tracker: tracker(o.id))
    var out = rowJSON(o)
    out["designations"] = Array(o.designations.prefix(4))
    out["summary"] = describe(o)
    out["explanation"] = obs.location.explanation
    out["status"] = "\(obs.location.status)"
    if let h = obs.location.horizontal {
        out["altitude"] = AstroFormat.altitude(h.altitude)
        out["azimuth"] = AstroFormat.azimuth(h.azimuth)
    }
    if let t = obs.location.nextRise { out["nextRise"] = t.timeIntervalSince1970 }
    if let e = obs.riseTransitSet {
        var events: [String: Any] = ["circumstance": "\(e.circumstance)"]
        if let t = e.rise { events["rise"] = t.timeIntervalSince1970 }
        if let t = e.transit { events["transit"] = t.timeIntervalSince1970 }
        if let t = e.set { events["set"] = t.timeIntervalSince1970 }
        out["riseSet"] = events
    }
    var properties: [[String]] = []
    if let c = obs.constellation ?? o.constellation, let name = catalog.constellation(c)?.name {
        properties.append(["Constellation", name])
    }
    if let m = obs.magnitude { properties.append(["Apparent magnitude", AstroFormat.magnitude(m)]) }
    if let au = obs.distanceAU { properties.append(["Distance", AstroFormat.distance(au: au, imperial: r.imperial ?? false)]) }
    if let ly = o.star?.distanceLightYears ?? o.deepSky?.distanceLightYears {
        properties.append(["Distance", (o.deepSky != nil ? "≈ " : "") + AstroFormat.distance(lightYears: ly)])
    }
    if let s = obs.angularDiameter { properties.append(["Apparent size", AstroFormat.angularSize(degrees: s)]) }
    if let major = o.deepSky?.majorAxis { properties.append(["Apparent size", AstroFormat.angularSize(degrees: major / 60)]) }
    if let f = obs.illuminatedFraction { properties.append(["Illuminated", "\(Int((f * 100).rounded()))%"]) }
    if let sp = o.star?.spectralType { properties.append(["Spectral type", sp]) }
    if let bv = o.star?.colorIndex { properties.append(["Temperature", "\(Int(StarColor.temperature(colorIndex: bv) / 100) * 100) K"]) }
    if let e = obs.j2000 {
        properties.append(["Right ascension (J2000)", AstroFormat.rightAscension(e.rightAscension)])
        properties.append(["Declination (J2000)", AstroFormat.declination(e.declination)])
    }
    if let body = o.solarSystemBody, let facts = catalog.editorial(for: body)?.facts {
        properties += facts.map { [$0.label, $0.value] }
    }
    if case .constellation(let id) = o.id.kind, let c = catalog.constellation(id) {
        properties.append(["Latin genitive", c.genitive])
        properties.append(["Best evenings", Calendar(identifier: .gregorian).monthSymbols[c.bestEveningMonth - 1]])
        properties.append(["From your latitude", c.isVisible(fromLatitude: site.latitude) ? "Visible" : "Stays too low"])
    }
    out["properties"] = properties
    if let text = observingAdvice(o) { out["observing"] = text }
    if let body = o.solarSystemBody, let text = catalog.editorial(for: body)?.learn { out["learn"] = text }
    let f = SkyFrame(time: AstroTime(d), observer: site)
    if let direction = try Locator.direction(of: o, frame: f, tracker: tracker(o.id)) { out["dir"] = vec(direction) }
    return out
}

func tonight(_ r: Request) throws -> [String: Any] {
    let site = try observer(r), d = date(r)
    let zone = r.tz.flatMap(TimeZone.init(identifier:)) ?? TimeZone(secondsFromGMT: 0)!
    let equipment = Set((r.equipment ?? ["nakedEye"]).compactMap(Equipment.init(rawValue:)))
    let experience = Experience(rawValue: r.experience ?? "") ?? .beginner

    var forecast: WeatherForecast?
    if let text = r.weather, !text.isEmpty {
        if weatherCache?.text == text {
            forecast = weatherCache?.forecast
        } else if let parsed = try? MetNorwayProvider.parse(Data(text.utf8), expires: nil) {
            weatherCache = (text, parsed)
            forecast = parsed
        }
    }
    let plan = try TonightPlanner.plan(
        catalog: catalog, date: d, observer: site, timeZone: zone, equipment: equipment,
        experience: experience, forecast: forecast
    )
    func t(_ value: Date?) -> Any { value.map { $0.timeIntervalSince1970 } ?? NSNull() }
    var out: [String: Any] = [
        "condition": "\(plan.night.condition)", "sunset": t(plan.night.sunset), "civilDusk": t(plan.night.civilDusk),
        "nauticalDusk": t(plan.night.nauticalDusk), "astroDusk": t(plan.night.astronomicalDusk),
        "astroDawn": t(plan.night.astronomicalDawn), "sunrise": t(plan.night.sunrise),
        "moonPhase": plan.moon.name.rawValue, "moonIllumination": plan.moon.illuminatedFraction,
        "moonRise": t(plan.moonRise), "moonSet": t(plan.moonSet), "moonless": plan.moonlessFraction,
        "weatherAvailable": forecast != nil,
    ]
    if let cloud = plan.meanCloudCover {
        out["cloud"] = cloud
        out["cloudWords"] = SkyConditions.describe(cloudCover: cloud)
    }
    if let forecast { out["attribution"] = forecast.attribution }
    out["windows"] = plan.observingWindows.map { [$0.start.timeIntervalSince1970, $0.end.timeIntervalSince1970] }
    out["recommendations"] = plan.recommendations.map { rec -> [String: Any] in
        var row = rowJSON(rec.object)
        row["bestTime"] = rec.bestTime.timeIntervalSince1970
        row["maxAltitude"] = rec.maxAltitude
        row["direction"] = CompassPoint(azimuth: rec.azimuthAtBest).name
        row["reasons"] = rec.reasons
        row["cautions"] = rec.cautions
        return row
    }
    return out
}

func passes(_ r: Request) throws -> [(name: String, pass: SatellitePass)] {
    let site = try observer(r), d = date(r)
    var out: [(name: String, pass: SatellitePass)] = []
    for id in [25544, 48274, 20580] {
        guard let t = trackers[id] else { continue }
        let found = (try? t.passes(from: site, start: d, days: 3, now: d)) ?? []
        out += found.map { (t.elements.name, $0) }
    }
    return out
}

func events(_ r: Request) throws -> [String: Any] {
    let site = try observer(r), start = date(r)
    let end = start.addingTimeInterval((r.days ?? 365) * 86_400)
    let all = try EventCalendar.events(from: start, to: end, observer: site, satellitePasses: try passes(r))
    let rows: [[String: Any]] = all.map { e in
        var row: [String: Any] = [
            "id": e.id, "kind": e.kind.rawValue, "kindName": e.kind.displayName, "title": e.title,
            "date": e.date.timeIntervalSince1970, "detail": e.detail, "source": e.source.label,
            "significant": e.isSignificant, "related": e.related.map(\.rawValue),
        ]
        if let end = e.endDate { row["end"] = end.timeIntervalSince1970 }
        switch e.visibility {
        case .visible(let text): row["visible"] = text
        case .notVisible(let text): row["hidden"] = text
        case .general: break
        }
        return row
    }
    return ["events": rows]
}

func loadSatellites(_ r: Request) throws -> [String: Any] {
    guard let text = r.satellites else { throw BridgeError.badRequest("no data") }
    let elements = try OMMParser.parse(Data(text.utf8))
    var usable: [OrbitalElements] = []
    var map: [Int: SatelliteTracker] = [:]
    for e in elements {
        if let t = try? SatelliteTracker(e) {
            usable.append(e)
            map[e.noradID] = t
        }
    }
    satelliteElements = usable
    trackers = map
    return ["count": usable.count]
}

func handle(_ r: Request) throws -> [String: Any] {
    switch r.op {
    case "scene": return scene()
    case "frame": return try frame(r)
    case "search": return search(r)
    case "list": return try list(r)
    case "object": return try detail(r)
    case "tonight": return try tonight(r)
    case "events": return try events(r)
    case "satellites": return try loadSatellites(r)
    default: throw BridgeError.badRequest("unknown op \(r.op)")
    }
}

func reply(_ object: [String: Any]) {
    guard var data = try? JSONSerialization.data(withJSONObject: object) else { return }
    data.append(10)
    FileHandle.standardOutput.write(data)
}

reply(["ready": true])
while let line = readLine(strippingNewline: true) {
    guard !line.isEmpty, let request = try? JSONDecoder().decode(Request.self, from: Data(line.utf8)) else {
        reply(["id": -1, "error": "unreadable request"])
        continue
    }
    do {
        reply(["id": request.id, "result": try handle(request)])
    } catch {
        reply(["id": request.id, "error": "\(error)"])
    }
}
