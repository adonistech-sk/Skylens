import AstronomyCore
import Foundation

/// Display policy for stars and labels, kept free of GPU types so it can be tested.
/// The Metal shader implements `StarAppearance.pointRadius` too, and both must match.
public enum StarAppearance {
    /// Radius in points of a star sprite's core. Brightness scales with flux, which
    /// is 10^(−0.4 m), while sprite area carries that flux. A root taper keeps the
    /// range of sizes pleasant instead of physically accurate.
    public static func pointRadius(magnitude: Double, limit: Double, scale: Double = 1) -> Double {
        let delta = max(0, limit - magnitude)
        return max(0.45, 0.50 * pow(delta + 0.5, 0.95) * scale)
    }

    /// Faint stars are dimmed rather than cut off, so raising the limit never pops.
    public static func alpha(magnitude: Double, limit: Double) -> Double {
        min(1, max(0, (limit - magnitude + 0.15) / 1.1))
    }

    /// Faintest magnitude to draw. Zooming in reveals fainter stars, as a telescope
    /// does, and a brighter sky washes faint stars out.
    public static func limitingMagnitude(fieldOfView fov: Double, base: Double, skyBrightness: Double) -> Double {
        let zoomGain = max(0, 2.2 * log(60 / max(fov, 0.5)) / log(10))
        return base + zoomGain - 7 * max(0, min(1, skyBrightness))
    }
}

/// How bright the sky background is from the Sun's altitude, for dimming stars and
/// tinting the background. Values come from the conventional twilight stages, where
/// each roughly marks a stage of naked-eye star visibility.
public struct SkyBrightness: Sendable, Hashable {
    /// 0 is full night and 1 full daylight.
    public let level: Double
    public let moonContribution: Double

    public init(sunAltitude: Double, moonAltitude: Double? = nil, moonIllumination: Double = 0) {
        let t = (sunAltitude + 18) / 24 // −18° → 0, +6° → 1
        let clamped = min(1, max(0, t))
        level = clamped * clamped * (3 - 2 * clamped)
        if let moonAltitude, moonAltitude > 0 {
            moonContribution = 0.05 * moonIllumination * min(1, moonAltitude / 30)
        } else {
            moonContribution = 0
        }
    }

    public var total: Double { min(1, level + moonContribution) }
}

/// Decides which labels fit, in priority order, so that the sky stays readable.
public enum LabelLayout {
    public struct Candidate: Sendable {
        public let id: String
        public let anchor: ScreenPoint
        public let size: (width: Double, height: Double)
        /// Lower is more important.
        public let priority: Double
        public let offsetBelow: Double

        public init(id: String, anchor: ScreenPoint, size: (width: Double, height: Double), priority: Double, offsetBelow: Double = 8) {
            self.id = id
            self.anchor = anchor
            self.size = size
            self.priority = priority
            self.offsetBelow = offsetBelow
        }
    }

    public struct Placed: Sendable, Identifiable {
        public let id: String
        public let position: ScreenPoint
    }

    /// Greedy placement: each label goes below its anchor unless something more
    /// important already holds that space, in which case it tries above and then
    /// gives up. Grid buckets keep this linear for a frame's worth of labels.
    public static func place(_ candidates: [Candidate], screen: ScreenSize, limit: Int) -> [Placed] {
        struct Box { let minX, minY, maxX, maxY: Double }
        let cell = 80.0
        var grid: [Int: [Box]] = [:]
        let key: (Int, Int) -> Int = { $0 &* 4096 &+ $1 }

        func overlaps(_ b: Box) -> Bool {
            let x0 = Int(b.minX / cell), x1 = Int(b.maxX / cell)
            let y0 = Int(b.minY / cell), y1 = Int(b.maxY / cell)
            for x in x0...max(x0, x1) {
                for y in y0...max(y0, y1) {
                    for o in grid[key(x, y)] ?? []
                    where b.minX < o.maxX && o.minX < b.maxX && b.minY < o.maxY && o.minY < b.maxY {
                        return true
                    }
                }
            }
            return false
        }
        func insert(_ b: Box) {
            let x0 = Int(b.minX / cell), x1 = Int(b.maxX / cell)
            let y0 = Int(b.minY / cell), y1 = Int(b.maxY / cell)
            for x in x0...max(x0, x1) {
                for y in y0...max(y0, y1) { grid[key(x, y), default: []].append(b) }
            }
        }

        var out: [Placed] = []
        out.reserveCapacity(limit)
        for c in candidates.sorted(by: { $0.priority < $1.priority }) {
            guard out.count < limit else { break }
            let halfW = c.size.width / 2, h = c.size.height
            for y in [c.anchor.y + c.offsetBelow, c.anchor.y - c.offsetBelow - h] {
                let box = Box(minX: c.anchor.x - halfW, minY: y, maxX: c.anchor.x + halfW, maxY: y + h)
                guard box.minX >= 4, box.maxX <= screen.width - 4, box.minY >= 4, box.maxY <= screen.height - 4 else { continue }
                if !overlaps(box) {
                    insert(box)
                    out.append(Placed(id: c.id, position: ScreenPoint(x: c.anchor.x, y: y + h / 2)))
                    break
                }
            }
        }
        return out
    }
}

/// Screen-space picking across objects of different sizes.
public enum HitTest {
    public struct Target: Sendable {
        public let id: String
        public let point: ScreenPoint
        /// Extra reach for bright or disc-shaped objects.
        public let radius: Double
        public let magnitude: Double

        public init(id: String, point: ScreenPoint, radius: Double, magnitude: Double) {
            self.id = id
            self.point = point
            self.radius = radius
            self.magnitude = magnitude
        }
    }

    /// Prefers objects actually under the finger, then trades distance against
    /// brightness, so a tap near Vega does not select a faint neighbour.
    public static func pick(_ targets: [Target], at touch: ScreenPoint, tolerance: Double = 28) -> String? {
        var best: (id: String, score: Double)?
        for t in targets {
            let d = t.point.distance(to: touch)
            guard d <= tolerance + t.radius else { continue }
            let score = max(0, d - t.radius) + t.magnitude * 2.5
            if score < (best?.score ?? .infinity) { best = (t.id, score) }
        }
        return best?.id
    }
}

/// Turn-by-turn guidance toward an object that is off screen.
public struct DirectionHint: Sendable, Hashable {
    /// Screen angle in degrees toward the target, clockwise from up.
    public let bearing: Double
    /// Great-circle distance in degrees from the view centre.
    public let separation: Double

    public var isCentered: Bool { separation < 2 }

    public static func toward(_ target: Vec3, camera: SkyCamera) -> DirectionHint {
        let c = camera.orientation * target
        return DirectionHint(
            bearing: Angle.normalize360(atan2(c.x, c.y) * Angle.radToDeg),
            separation: camera.viewDirection.angle(to: target)
        )
    }
}
