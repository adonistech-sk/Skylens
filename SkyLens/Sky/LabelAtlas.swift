import Metal
import SkySession
import UIKit

/// All sky labels pre-rendered into one texture. Drawing text as GPU quads keeps
/// labels locked to their stars at 60 Hz, where a SwiftUI overlay would trail during
/// a drag, and costs no more once the atlas exists.
@MainActor
final class LabelAtlas {
    struct Glyph {
        let uv: SIMD4<Float>
        let width: Double
        let height: Double
    }

    let texture: MTLTexture
    private var glyphs: [String: Glyph] = [:]

    private static let size = 2048
    private static let scale: CGFloat = 3

    init?(device: MTLDevice, labels: [SkyLabel], extra: [String]) {
        let side = Self.size
        let pixelScale = Self.scale
        let colorSpace = CGColorSpaceCreateDeviceGray()
        guard let context = CGContext(
            data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side,
            space: colorSpace, bitmapInfo: CGImageAlphaInfo.none.rawValue
        ) else { return nil }

        // UIKit's text drawing expects a top-left origin.
        context.translateBy(x: 0, y: CGFloat(side))
        context.scaleBy(x: pixelScale, y: -pixelScale)
        UIGraphicsPushContext(context)
        defer { UIGraphicsPopContext() }

        var x: CGFloat = 2, y: CGFloat = 2, rowHeight: CGFloat = 0
        let limit = CGFloat(side) / pixelScale - 2

        func place(_ key: String, _ text: String, font: UIFont, tracking: CGFloat) -> Glyph? {
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font, .foregroundColor: UIColor.white, .kern: tracking,
            ]
            let string = NSAttributedString(string: text, attributes: attributes)
            let size = string.size()
            let w = ceil(size.width) + 2, h = ceil(size.height) + 1
            if x + w > limit {
                x = 2
                y += rowHeight + 2
                rowHeight = 0
            }
            guard y + h <= limit else { return nil }
            string.draw(at: CGPoint(x: x + 1, y: y))
            let uvScale = Float(pixelScale) / Float(side)
            let glyph = Glyph(
                uv: SIMD4(Float(x) * uvScale, Float(y) * uvScale, Float(w) * uvScale, Float(h) * uvScale),
                width: Double(w), height: Double(h)
            )
            x += w + 2
            rowHeight = max(rowHeight, h)
            return glyph
        }

        var entries: [(key: String, glyph: Glyph)] = []
        for label in labels {
            let font: UIFont
            var tracking: CGFloat = 0
            switch label.style {
            case .planet:
                font = .systemFont(ofSize: 13, weight: .medium)
            case .constellation:
                font = .systemFont(ofSize: 10.5, weight: .medium)
                tracking = 1.6
            case .deepSky:
                font = .systemFont(ofSize: 11, weight: .regular)
            default:
                font = .systemFont(ofSize: 12, weight: .regular)
            }
            if let g = place(label.id, label.text, font: font, tracking: tracking) {
                entries.append((label.id, g))
            }
        }
        for text in extra {
            if let g = place(text, text, font: .systemFont(ofSize: 13, weight: .semibold), tracking: 0.5) {
                entries.append((text, g))
            }
        }

        guard let bytes = context.data else { return nil }
        let descriptor = MTLTextureDescriptor.texture2DDescriptor(pixelFormat: .r8Unorm, width: side, height: side, mipmapped: false)
        descriptor.usage = .shaderRead
        guard let texture = device.makeTexture(descriptor: descriptor) else { return nil }
        texture.replace(region: MTLRegionMake2D(0, 0, side, side), mipmapLevel: 0, withBytes: bytes, bytesPerRow: side)
        self.texture = texture
        for entry in entries { glyphs[entry.key] = entry.glyph }
    }

    func glyph(for id: String) -> Glyph? { glyphs[id] }

    func size(for id: String) -> (width: Double, height: Double)? {
        glyphs[id].map { ($0.width, $0.height) }
    }
}
