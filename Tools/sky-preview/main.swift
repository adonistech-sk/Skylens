// Headless sky preview. Draws catalog stars, constellation figures and planets to a
// PPM using the same AstronomyCore and SkyProjection code the app uses, so the
// geometry can be inspected without a GPU or a device. It does not test the Metal
// renderer, whose shaders mirror this math.
//
// Output is written to stdout as a binary PPM by Tools/sky-preview/render.mjs.
import AstronomyCore
import Foundation
import SkyCatalog
import SkyProjection

struct Args {
    var lat = 52.23, lon = 21.01, az = 180.0, alt = 35.0, fov = 100.0
    var date = "2026-01-15T21:00:00Z", width = 780, height = 1100, output = "/out/sky.ppm"
    var grid = true
}

var a = Args()
var it = CommandLine.arguments.dropFirst().makeIterator()
while let k = it.next(), let v = it.next() {
    switch k {
    case "--lat": a.lat = Double(v)!
    case "--lon": a.lon = Double(v)!
    case "--az": a.az = Double(v)!
    case "--alt": a.alt = Double(v)!
    case "--fov": a.fov = Double(v)!
    case "--date": a.date = v
    case "--out": a.output = v
    case "--w": a.width = Int(v)!
    case "--h": a.height = Int(v)!
    default: break
    }
}

let iso = ISO8601DateFormatter()
iso.formatOptions = [.withInternetDateTime]
let time = AstroTime(iso.date(from: a.date)!)
let observer = ObserverLocation(latitude: a.lat, longitude: a.lon)
let frame = SkyFrame(time: time, observer: observer)
let catalog = try Catalog.loadBundled()
let screen = ScreenSize(width: Double(a.width), height: Double(a.height))
let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: a.az, altitude: a.alt), fieldOfView: a.fov, screen: screen)

var pixels = [Float](repeating: 0, count: a.width * a.height * 3)
for y in 0..<a.height {
    for x in 0..<a.width {
        let d = camera.unproject(ScreenPoint(x: Double(x), y: Double(y)))
        let below = d.z < 0
        let i = (y * a.width + x) * 3
        pixels[i] = below ? 0.03 : 0.012
        pixels[i + 1] = below ? 0.035 : 0.02
        pixels[i + 2] = below ? 0.03 : 0.04
    }
}

func splat(_ p: ScreenPoint, radius: Double, r: Double, g: Double, b: Double, gain: Double) {
    let reach = Int((radius * 2.2).rounded(.up))
    for dy in -reach...reach {
        for dx in -reach...reach {
            let px = Int(p.x) + dx, py = Int(p.y) + dy
            guard px >= 0, py >= 0, px < a.width, py < a.height else { continue }
            let d = ScreenPoint(x: Double(px), y: Double(py)).distance(to: p)
            let w = exp(-(d * d) / (radius * radius)) * gain
            let i = (py * a.width + px) * 3
            pixels[i] += Float(r * w)
            pixels[i + 1] += Float(g * w)
            pixels[i + 2] += Float(b * w)
        }
    }
}

func line(_ p: ScreenPoint, _ q: ScreenPoint, r: Double, g: Double, b: Double) {
    let steps = Int(max(abs(p.x - q.x), abs(p.y - q.y)))
    guard steps > 0, steps < 4000 else { return }
    for s in 0...steps {
        let t = Double(s) / Double(steps)
        let x = Int(p.x + (q.x - p.x) * t), y = Int(p.y + (q.y - p.y) * t)
        guard x >= 0, y >= 0, x < a.width, y < a.height else { continue }
        let i = (y * a.width + x) * 3
        pixels[i] += Float(r); pixels[i + 1] += Float(g); pixels[i + 2] += Float(b)
    }
}

let stars = catalog.stars
for c in catalog.constellations {
    for strip in c.lines {
        let points = strip.compactMap { hip -> ScreenPoint? in
            guard let i = stars.index(hip: hip) else { return nil }
            let v = frame.j2000ToHorizon * stars.direction(at: i)
            return camera.contains(v, margin: 400) ? camera.project(v) : nil
        }
        guard points.count == strip.count else { continue }
        for (p, q) in zip(points, points.dropFirst()) { line(p, q, r: 0.07, g: 0.11, b: 0.17) }
    }
}

let limit = 6.5
let shown = stars.count(brighterThan: Float(limit))
for i in 0..<shown {
    let v = frame.j2000ToHorizon * stars.direction(at: i)
    guard camera.contains(v, margin: 8), let p = camera.project(v) else { continue }
    let m = Double(stars.magnitude[i])
    let bv = stars.colorIndex[i].isNaN ? 0.6 : Double(stars.colorIndex[i])
    let c = StarColor.rgb(colorIndex: bv)
    let radius = StarAppearance.pointRadius(magnitude: m, limit: limit)
    splat(p, radius: radius, r: c.r, g: c.g, b: c.b, gain: StarAppearance.alpha(magnitude: m, limit: limit) * 1.2)
}

for body in SolarSystemBody.allCases {
    let pos = try Ephemeris.position(of: body, at: time, for: observer)
    let v = pos.geometric.unitVector
    guard camera.contains(v, margin: 8), let p = camera.project(v) else { continue }
    print(body.name, "alt", String(format: "%.1f", pos.apparent.altitude), "az", String(format: "%.1f", pos.apparent.azimuth), "at", Int(p.x), Int(p.y))
    let tint: (Double, Double, Double) = body == .moon ? (1, 1, 0.9) : (1, 0.75, 0.3)
    splat(p, radius: body == .moon ? 9 : 5, r: tint.0, g: tint.1, b: tint.2, gain: 2)
}

var bytes = [UInt8]("P6\n\(a.width) \(a.height)\n255\n".utf8)
bytes.reserveCapacity(bytes.count + pixels.count)
for v in pixels { bytes.append(UInt8(max(0, min(255, pow(Double(v), 1 / 2.2) * 255)))) }
try Data(bytes).write(to: URL(fileURLWithPath: a.output))
print("wrote", a.output, "stars drawn from", shown)
