import SkyCatalog
import SwiftUI

/// The illustration at the top of a detail page, drawn in code from the object's real
/// properties, so nothing depends on licensed imagery. It shows what kind of thing the
/// object is, not a photograph of it.
struct ObjectHero: View {
    let object: SkyObject
    /// Moon only: the current illuminated fraction, from the ephemeris.
    var illumination: Double?

    var body: some View {
        Canvas { context, size in
            var random = SeededRandom(seed: object.id.rawValue)
            drawStarfield(&context, size, &random)
            let centre = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.height * 0.34, 92)
            switch object.type {
            case .sun:
                glow(&context, centre, radius * 2.6, Color(hex: 0xFFD68C), 0.55)
                sphere(&context, centre, radius, [Color(hex: 0xFFFBE8), Color(hex: 0xFFE39A), Color(hex: 0xF6A53C)])
            case .moon:
                sphere(&context, centre, radius, [Color(hex: 0xECEBE3), Color(hex: 0xB9B7AD), Color(hex: 0x6F6D66)])
                drawMoonShadow(&context, centre, radius)
            case .planet:
                drawPlanet(&context, centre, radius)
            case .star:
                let tint = starTint
                glow(&context, centre, radius * 2.4, tint, 0.5)
                glow(&context, centre, radius * 0.9, tint, 0.9)
                glow(&context, centre, radius * 0.32, .white, 1)
            case .galaxy:
                drawGalaxy(&context, centre, radius, &random)
            case .openCluster, .globularCluster, .starCloud, .asterism, .doubleStar:
                drawCluster(&context, centre, radius, &random)
            case .nebula, .planetaryNebula, .supernovaRemnant, .clusterNebula:
                drawNebula(&context, centre, radius, &random)
            default:
                glow(&context, centre, radius * 1.5, Color(hex: 0xC8D6F0), 0.22)
            }
        }
        .frame(height: 220)
        .accessibilityHidden(true)
    }

    private var starTint: Color {
        let temperature = object.star?.colorIndex.map(StarColor.temperature(colorIndex:)) ?? 6000
        switch temperature {
        case 9000...: return Color(hex: 0xA5C3FF)
        case 6500...: return Color(hex: 0xE1E8FF)
        case 5000...: return Color(hex: 0xFFECC3)
        case 3900...: return Color(hex: 0xFFC482)
        default: return Color(hex: 0xFF965F)
        }
    }

    private func circle(_ c: CGPoint, _ r: CGFloat) -> Path {
        Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: r * 2, height: r * 2))
    }

    private func drawStarfield(_ context: inout GraphicsContext, _ size: CGSize, _ random: inout SeededRandom) {
        for _ in 0..<170 {
            let p = CGPoint(x: random.next() * size.width, y: random.next() * size.height)
            let opacity = 0.08 + random.next() * 0.5
            context.fill(circle(p, random.next() * 1.1 + 0.25), with: .color(Color(hex: 0xD6E0F0).opacity(opacity)))
        }
    }

    private func sphere(_ context: inout GraphicsContext, _ c: CGPoint, _ r: CGFloat, _ colors: [Color]) {
        let shading = GraphicsContext.Shading.radialGradient(
            Gradient(colors: colors), center: CGPoint(x: c.x - r * 0.38, y: c.y - r * 0.42),
            startRadius: r * 0.08, endRadius: r * 1.5
        )
        context.fill(circle(c, r), with: shading)
    }

    private func glow(_ context: inout GraphicsContext, _ c: CGPoint, _ r: CGFloat, _ color: Color, _ opacity: Double) {
        let shading = GraphicsContext.Shading.radialGradient(
            Gradient(colors: [color.opacity(opacity), color.opacity(0)]), center: c, startRadius: r * 0.2, endRadius: r
        )
        context.fill(circle(c, r), with: shading)
    }

    private func drawMoonShadow(_ context: inout GraphicsContext, _ c: CGPoint, _ r: CGFloat) {
        let lit = illumination ?? 1
        guard lit < 0.995 else { return }
        // Half disc plus a terminator ellipse whose width follows the illuminated fraction.
        var shadow = Path()
        shadow.addArc(center: c, radius: r + 0.5, startAngle: .degrees(90), endAngle: .degrees(270), clockwise: false)
        shadow.closeSubpath()
        let k = abs(1 - 2 * lit)
        let terminator = Path(ellipseIn: CGRect(x: c.x - k * r, y: c.y - r - 0.5, width: 2 * k * r, height: 2 * r + 1))
        let dark = GraphicsContext.Shading.color(Color(hex: 0x04070E).opacity(0.96))
        if lit < 0.5 {
            context.fill(shadow, with: dark)
            context.fill(terminator, with: dark)
        } else {
            context.drawLayer { layer in
                layer.clip(to: terminator, options: .inverse)
                layer.fill(shadow, with: dark)
            }
        }
    }

    private func drawPlanet(_ context: inout GraphicsContext, _ c: CGPoint, _ radius: CGFloat) {
        switch object.solarSystemBody {
        case .saturn:
            let r = radius * 0.72
            drawRing(&context, c, r, front: false)
            sphere(&context, c, r, [Color(hex: 0xF6E6BF), Color(hex: 0xD3B67F), Color(hex: 0x6D5A38)])
            drawRing(&context, c, r, front: true)
        case .jupiter:
            sphere(&context, c, radius, [Color(hex: 0xF4E3C6), Color(hex: 0xCFA97E), Color(hex: 0x6E5238)])
            context.drawLayer { layer in
                layer.clip(to: circle(c, radius))
                for (y, height) in [(-0.62, 0.12), (-0.26, 0.2), (0.14, 0.16), (0.5, 0.1)] as [(CGFloat, CGFloat)] {
                    let band = CGRect(x: c.x - radius, y: c.y + y * radius, width: radius * 2, height: height * radius)
                    layer.fill(Path(band), with: .color(Color(hex: 0x8A5A38).opacity(0.38)))
                }
            }
        case .mars:
            sphere(&context, c, radius, [Color(hex: 0xF0A070), Color(hex: 0xBD5A33), Color(hex: 0x5A2412)])
        case .venus:
            sphere(&context, c, radius, [Color(hex: 0xFFF1CF), Color(hex: 0xE0BD84), Color(hex: 0x7B5A30)])
        case .uranus:
            sphere(&context, c, radius, [Color(hex: 0xD6F6F6), Color(hex: 0x8FD0D6), Color(hex: 0x3B6D76)])
        case .neptune:
            sphere(&context, c, radius, [Color(hex: 0x9FC0FF), Color(hex: 0x3F6EE0), Color(hex: 0x142A70)])
        default:
            sphere(&context, c, radius, [Color(hex: 0xC9C2B8), Color(hex: 0x7D756C), Color(hex: 0x3A342E)])
        }
    }

    private func drawRing(_ context: inout GraphicsContext, _ c: CGPoint, _ r: CGFloat, front: Bool) {
        var layer = context
        layer.translateBy(x: c.x, y: c.y)
        layer.rotate(by: .degrees(-17))
        // Only the half nearest the viewer passes in front of the planet.
        layer.clip(to: Path(CGRect(x: -r * 3, y: front ? 0 : -r * 3, width: r * 6, height: r * 3)))
        let ring = Path(ellipseIn: CGRect(x: -r * 1.75, y: -r * 0.52, width: r * 3.5, height: r * 1.04))
        layer.stroke(ring, with: .color(Color(hex: 0xE8D4A5).opacity(front ? 0.8 : 0.6)), lineWidth: r * 0.26)
    }

    private func drawGalaxy(_ context: inout GraphicsContext, _ c: CGPoint, _ radius: CGFloat, _ random: inout SeededRandom) {
        for i in 0..<1800 {
            let arm = i.isMultiple(of: 2) ? Double.pi : 0
            let s = random.next()
            let angle = arm + s * 8.5 + (random.next() - 0.5) * 0.6
            let x = cos(angle) * s * radius * 1.5, y = sin(angle) * s * radius * 0.75
            // Tilts the disc on the page.
            let p = CGPoint(x: c.x + x * 0.88 + y * 0.48, y: c.y - x * 0.48 + y * 0.88)
            let color = s < 0.25 ? Color(hex: 0xFFE1B9) : Color(hex: 0xAAC3FF)
            context.fill(circle(p, random.next() * 1.3 + 0.3), with: .color(color.opacity(0.05 + random.next() * 0.22)))
        }
        glow(&context, c, radius * 0.7, Color(hex: 0xFFE4BE), 0.8)
    }

    private func drawCluster(_ context: inout GraphicsContext, _ c: CGPoint, _ radius: CGFloat, _ random: inout SeededRandom) {
        let isTight = object.type == .globularCluster
        for _ in 0..<(isTight ? 900 : 90) {
            let angle = random.next() * 6.3
            let r = pow(random.next(), isTight ? 2.2 : 1) * radius * 1.25
            let p = CGPoint(x: c.x + cos(angle) * r, y: c.y + sin(angle) * r)
            let color = random.next() > 0.7 ? Color(hex: 0xFFE2BE) : Color(hex: 0xBED4FF)
            context.fill(circle(p, random.next() * (isTight ? 1 : 2) + 0.4), with: .color(color.opacity(0.3 + random.next() * 0.6)))
        }
    }

    private func drawNebula(_ context: inout GraphicsContext, _ c: CGPoint, _ radius: CGFloat, _ random: inout SeededRandom) {
        let isRing = object.type == .planetaryNebula
        for _ in 0..<70 {
            let angle = random.next() * 6.3
            let r = isRing ? radius * (0.62 + random.next() * 0.22) : random.next() * radius * 1.15
            let p = CGPoint(x: c.x + cos(angle) * r, y: c.y + sin(angle) * r * 0.8)
            let color = random.next() > 0.5 ? Color(hex: 0xE25A78) : Color(hex: 0x54AABE)
            glow(&context, p, radius * (0.16 + random.next() * 0.34), color, 0.2)
        }
    }
}

/// Repeatable, so an object's illustration doesn't change between visits.
private struct SeededRandom {
    private var state: UInt64

    init(seed: String) {
        state = seed.utf8.reduce(1469598103934665603) { ($0 ^ UInt64($1)) &* 1099511628211 }
    }

    mutating func next() -> CGFloat {
        state = state &* 6364136223846793005 &+ 1442695040888963407
        return CGFloat((state >> 33) & 0xFFFFFF) / CGFloat(0xFFFFFF)
    }
}
