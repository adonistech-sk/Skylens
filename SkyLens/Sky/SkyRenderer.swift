import AstronomyCore
import Metal
import MetalKit
import ObservingKit
import QuartzCore
import Satellites
import SkyCatalog
import SkyProjection
import SkySession
import simd
import UIKit
import UserData

// These layouts are mirrored in SkyShaders.metal.
private struct SkyUniforms {
    var j2000ToHorizon = matrix_identity_float3x3
    var horizonToView = matrix_identity_float3x3
    var viewToHorizon = matrix_identity_float3x3
    var screen = SIMD4<Float>.zero
    var stars = SIMD4<Float>.zero
    var sun = SIMD4<Float>.zero
    var mode = SIMD4<Float>.zero
}

private struct LineStyle {
    var color: SIMD4<Float>
    var width: Float
    var frame: Float
    var padding0: Float = 0
    var padding1: Float = 0
}

private struct Marker {
    var directionRadius: SIMD4<Float>
    var color: SIMD4<Float>
    var lightKind: SIMD4<Float>
}

private struct LabelInstance {
    var directionOffset: SIMD4<Float>
    var uvRect: SIMD4<Float>
    var sizeAlpha: SIMD4<Float>
    var color: SIMD4<Float>
}

extension Vec3 {
    var simd: SIMD3<Float> { SIMD3<Float>(Float(x), Float(y), Float(z)) }
}

extension Mat3 {
    /// `Mat3` is row-major and simd is column-major.
    var simd: simd_float3x3 {
        let c = transposed
        return simd_float3x3(c.r0.simd, c.r1.simd, c.r2.simd)
    }
}

/// Draws the sky. Everything that moves is a uniform, so a frame costs a handful of
/// draw calls no matter how many stars are on screen.
@MainActor
final class SkyRenderer: NSObject, MTKViewDelegate {
    enum Mode {
        case planetarium
        /// Transparent over the camera, using the lens's rectilinear projection.
        case augmentedReality(fieldOfView: Double)
    }

    private let device: MTLDevice
    private let queue: MTLCommandQueue
    private let sky: SkyViewModel
    private var mode: Mode

    private var starPipeline: MTLRenderPipelineState!
    private var linePipeline: MTLRenderPipelineState!
    private var skyPipeline: MTLRenderPipelineState!
    private var groundPipeline: MTLRenderPipelineState!
    private var markerPipeline: MTLRenderPipelineState!
    private var labelPipeline: MTLRenderPipelineState!

    private var starBuffer: MTLBuffer?
    private var starEpochYears = Double.nan
    private var isBuildingStars = false
    private var constellationBuffer: MTLBuffer?
    private var boundaryBuffer: MTLBuffer?
    private var horizonBuffer: MTLBuffer?
    private var horizonGridBuffer: MTLBuffer?
    private var equatorialGridBuffer: MTLBuffer?
    private var milkyWayTexture: MTLTexture?
    private var atlas: LabelAtlas?
    private var labels: [SkyLabel] = []
    private var deepSkyMarkers: [(object: SkyObject, direction: Vec3)] = []
    private var markersHavePro = false

    // Cached per-time state.
    private var bodyStates: [SolarSystemBody: BodyState] = [:]
    private var satelliteStates: [(id: Int, direction: Vec3)] = []
    private var lastBodyDate = Date.distantPast
    private var lastBodyWall = 0.0

    private struct BodyState {
        let direction: Vec3
        let radiusPoints: Double
        let magnitude: Double
        let illumination: Double
        let phaseAngle: Double
    }

    // Labels: placement happens at 8 Hz, while positions and fades run every frame.
    private var placed: [String: PlacedLabel] = [:]
    private var lastLabelUpdate = 0.0
    /// 1 under a dark sky and 0 in daylight, for what only shows against the dark.
    private var nightVisibility: Float = 1
    private var lastFrameTime = 0.0

    private struct PlacedLabel {
        var offset: Float
        var alpha: Float
        var target: Float
    }

    init?(device: MTLDevice, sky: SkyViewModel, mode: Mode) {
        guard let queue = device.makeCommandQueue() else { return nil }
        self.device = device
        self.queue = queue
        self.sky = sky
        self.mode = mode
        super.init()
        guard buildPipelines() else { return nil }
    }

    func update(mode: Mode) { self.mode = mode }

    // MARK: Setup

    private func buildPipelines() -> Bool {
        guard let library = device.makeDefaultLibrary() else { return false }

        func pipeline(_ vertex: String, _ fragment: String, additive: Bool) -> MTLRenderPipelineState? {
            let d = MTLRenderPipelineDescriptor()
            d.vertexFunction = library.makeFunction(name: vertex)
            d.fragmentFunction = library.makeFunction(name: fragment)
            let attachment = d.colorAttachments[0]!
            attachment.pixelFormat = .bgra8Unorm_srgb
            attachment.isBlendingEnabled = true
            attachment.rgbBlendOperation = .add
            attachment.alphaBlendOperation = .add
            // All fragments are premultiplied.
            attachment.sourceRGBBlendFactor = .one
            attachment.sourceAlphaBlendFactor = .one
            attachment.destinationRGBBlendFactor = additive ? .one : .oneMinusSourceAlpha
            attachment.destinationAlphaBlendFactor = additive ? .one : .oneMinusSourceAlpha
            return try? device.makeRenderPipelineState(descriptor: d)
        }

        guard let stars = pipeline("starVertex", "starFragment", additive: true),
              let lines = pipeline("lineVertex", "lineFragment", additive: false),
              let background = pipeline("fullScreenVertex", "skyFragment", additive: false),
              let ground = pipeline("fullScreenVertex", "groundFragment", additive: false),
              let markers = pipeline("markerVertex", "markerFragment", additive: false),
              let text = pipeline("labelVertex", "labelFragment", additive: false) else {
            return false
        }
        starPipeline = stars
        linePipeline = lines
        skyPipeline = background
        groundPipeline = ground
        markerPipeline = markers
        labelPipeline = text
        return true
    }

    private func prepareStaticGeometry(_ catalog: Catalog) {
        guard constellationBuffer == nil else { return }
        func buffer(_ segments: [SkySegment]) -> MTLBuffer? {
            let data = SkyGeometry.vertexData(segments)
            return data.withUnsafeBytes { raw in
                raw.baseAddress.flatMap { device.makeBuffer(bytes: $0, length: raw.count, options: .storageModeShared) }
            }
        }
        constellationBuffer = buffer(SkyGeometry.constellationLines(catalog))
        boundaryBuffer = buffer(SkyGeometry.constellationBoundaries(catalog))
        horizonBuffer = buffer(SkyGeometry.horizonLine())
        horizonGridBuffer = buffer(SkyGeometry.horizonGrid())
        equatorialGridBuffer = buffer(SkyGeometry.equatorialGrid())

        labels = SkyLabels.all(catalog)
        let compass = SkyLabels.compass.map { $0.text }
        atlas = LabelAtlas(device: device, labels: labels, extra: compass)
        milkyWayTexture = makeMilkyWayTexture(catalog)
    }

    /// The set depends on the plan, so it refreshes when the subscription changes.
    private func refreshDeepSkyMarkers() {
        let hasPro = sky.app.subscription.hasProAccess
        guard deepSkyMarkers.isEmpty || markersHavePro != hasPro else { return }
        markersHavePro = hasPro
        deepSkyMarkers = sky.app.visibleDeepSky.compactMap { o in
            o.position.map { (o, $0.unitVector) }
        }
    }

    /// A low-resolution map of real catalog star density, smoothed into a soft band.
    /// It traces where the Milky Way actually is, and needs no licensed imagery.
    private func makeMilkyWayTexture(_ catalog: Catalog) -> MTLTexture? {
        let width = 512, height = 256
        var grid = [Float](repeating: 0, count: width * height)
        let stars = catalog.stars
        for i in 0..<stars.count {
            let ra = Double(stars.rightAscension[i]) / 360
            let dec = 0.5 - Double(stars.declination[i]) / 180
            let x = min(width - 1, Int(ra * Double(width)))
            let y = min(height - 1, Int(dec * Double(height)))
            // Weighted by flux among the faint background, which is what forms the glow.
            if stars.magnitude[i] > 5 { grid[y * width + x] += 1 }
        }
        // Equal-area correction, then a separable box blur run twice.
        for y in 0..<height {
            let latitude = (Double(y) + 0.5) / Double(height) * .pi - .pi / 2
            let scale = Float(1 / max(cos(latitude), 0.05))
            for x in 0..<width { grid[y * width + x] *= scale }
        }
        grid = Self.boxBlur(grid, width: width, height: height, radius: 5)
        let sorted = grid.sorted()
        let floorLevel = sorted[sorted.count / 2], ceilingLevel = sorted[sorted.count * 995 / 1000]
        // Hipparcos is too shallow to trace the band alone, which reads as blotches. Real
        // star density supplies the texture, inside an envelope on the galactic plane.
        let pole = Equatorial(rightAscension: 192.859 / 15, declination: 27.128).unitVector
        let centre = Equatorial(rightAscension: 266.405 / 15, declination: -28.936).unitVector
        var scaled = [UInt8](repeating: 0, count: width * height)
        for y in 0..<height {
            for x in 0..<width {
                let direction = Equatorial(
                    rightAscension: (Double(x) + 0.5) / Double(width) * 24,
                    declination: 90 - (Double(y) + 0.5) / Double(height) * 180
                ).unitVector
                let b = asin(max(-1, min(1, direction.dot(pole)))) * Angle.radToDeg
                let c = direction.angle(to: centre)
                let envelope = exp(-(b / 11) * (b / 11)) * (0.55 + 1.1 * exp(-(c / 42) * (c / 42)))
                let t = max(0, min(1, (grid[y * width + x] - floorLevel) / max(ceilingLevel - floorLevel, 1e-3)))
                scaled[y * width + x] = UInt8(min(255, envelope * (0.45 + 0.75 * Double(t)) * 255))
            }
        }
        let d = MTLTextureDescriptor.texture2DDescriptor(pixelFormat: .r8Unorm, width: width, height: height, mipmapped: false)
        d.usage = .shaderRead
        guard let texture = device.makeTexture(descriptor: d) else { return nil }
        scaled.withUnsafeBytes { raw in
            guard let base = raw.baseAddress else { return }
            texture.replace(region: MTLRegionMake2D(0, 0, width, height), mipmapLevel: 0, withBytes: base, bytesPerRow: width)
        }
        return texture
    }

    private static func boxBlur(_ source: [Float], width: Int, height: Int, radius: Int) -> [Float] {
        var horizontal = [Float](repeating: 0, count: source.count)
        let span = Float(radius * 2 + 1)
        for y in 0..<height {
            var sum: Float = 0
            for k in -radius...radius { sum += source[y * width + (k + width) % width] }
            for x in 0..<width {
                horizontal[y * width + x] = sum / span
                sum += source[y * width + (x + radius + 1) % width] - source[y * width + (x - radius + width) % width]
            }
        }
        var out = [Float](repeating: 0, count: source.count)
        for x in 0..<width {
            var sum: Float = 0
            for k in -radius...radius { sum += horizontal[min(height - 1, max(0, k)) * width + x] }
            for y in 0..<height {
                out[y * width + x] = sum / span
                let leaving = max(0, y - radius), entering = min(height - 1, y + radius + 1)
                sum += horizontal[entering * width + x] - horizontal[leaving * width + x]
            }
        }
        return out
    }

    /// Star vertices depend on the date only through proper motion, so they rebuild
    /// off the main thread when the simulated date moves by more than a few years.
    private func refreshStars(_ catalog: Catalog, date: Date) {
        let years = (AstroTime(date).utDays) / 365.25
        guard !isBuildingStars, starBuffer == nil || abs(years - starEpochYears) > 5 else { return }
        isBuildingStars = true
        let device = device
        Task.detached(priority: .userInitiated) { [weak self] in
            let vertices = catalog.stars.vertexData(yearsSinceJ2000: years)
            let buffer = vertices.withUnsafeBytes { raw in
                raw.baseAddress.flatMap { device.makeBuffer(bytes: $0, length: raw.count, options: .storageModeShared) }
            }
            await MainActor.run {
                self?.starBuffer = buffer
                self?.starEpochYears = years
                self?.isBuildingStars = false
            }
        }
    }

    // MARK: Per-frame state

    private func refreshBodies(frame: SkyFrame, date: Date, camera: SkyCamera, wall: Double, rate: Double) {
        // In real time a body moves imperceptibly within a second. During a time-lapse
        // positions must update every frame or the Moon would visibly stutter.
        guard abs(rate) > 1.5 || wall - lastBodyWall > 1 || lastBodyDate == .distantPast
            || date.timeIntervalSince(lastBodyDate) != 0 && abs(date.timeIntervalSince(lastBodyDate)) > 30 else { return }
        lastBodyWall = wall
        lastBodyDate = date

        let time = frame.time
        let observer = frame.observer
        var next: [SolarSystemBody: BodyState] = [:]
        for body in SolarSystemBody.allCases {
            guard let p = try? Ephemeris.position(of: body, at: time, for: observer),
                  let a = try? Ephemeris.appearance(of: body, at: time) else { continue }
            let pointRadius = max(a.angularDiameter / 2 * camera.pointsPerDegree, minimumRadius(of: body, magnitude: a.magnitude))
            next[body] = BodyState(
                direction: p.geometric.unitVector, radiusPoints: pointRadius, magnitude: a.magnitude,
                illumination: a.illuminatedFraction, phaseAngle: a.phaseAngle
            )
        }
        bodyStates = next

        var satellites: [(Int, Vec3)] = []
        if sky.app.preferences.display.satellites {
            for e in sky.app.satellites {
                guard let tracker = sky.app.tracker(norad: e.noradID), tracker.freshness(now: date).canPredict,
                      let look = try? tracker.look(at: date, from: observer), look.horizontal.altitude > 0 else { continue }
                satellites.append((e.noradID, look.horizontal.unitVector))
            }
        }
        satelliteStates = satellites.map { (id: $0.0, direction: $0.1) }
    }

    private func minimumRadius(of body: SolarSystemBody, magnitude: Double) -> Double {
        switch body {
        case .sun, .moon: 9
        default: max(2.2, 4.4 - magnitude * 0.45)
        }
    }

    /// How much of a name to show under the current sky. Stars and deep-sky objects can't
    /// be seen in daylight, so naming them would only label empty blue. Constellations
    /// stay faintly present as a way to navigate, and the selection always shows.
    private func labelVisibility(_ id: String) -> Float {
        if id == sky.app.selection?.rawValue { return 1 }
        switch ObjectID(rawValue: id).kind {
        case .body: return 1
        case .constellation: return 0.45 + 0.55 * nightVisibility
        default: return nightVisibility
        }
    }

    private func updateLabels(camera: SkyCamera, frame: SkyFrame, display: DisplayOptions) {
        guard let atlas else { return }
        var candidates: [LabelLayout.Candidate] = []
        candidates.reserveCapacity(200)
        let selected = sky.app.selection?.rawValue
        // The status line and toolbar sit over these bands, so names there would collide.
        let usableHeight = (top: 116.0, bottom: camera.screen.height - 104)

        for label in labels where camera.fieldOfView <= label.maxFieldOfView {
            switch label.style {
            case .star where !display.starLabels: continue
            case .planet where !display.planetLabels: continue
            case .constellation where !display.constellationLabels: continue
            case .deepSky where !display.deepSkyObjects: continue
            default: break
            }
            if labelVisibility(label.id) < 0.02 { continue }
            guard let size = atlas.size(for: label.id) else { continue }
            let direction: Vec3
            if let fixed = label.direction {
                direction = frame.j2000ToHorizon * fixed
            } else if case .body(let body)? = ObjectID(rawValue: label.id).kind, let state = bodyStates[body] {
                direction = state.direction
            } else {
                continue
            }
            // Names below the ground would only be clutter over a dark silhouette.
            if display.horizon, direction.z < 0.018, label.id != selected { continue }
            guard let point = camera.project(direction), camera.isVisible(point) else { continue }
            if label.id != selected, point.y < usableHeight.top || point.y > usableHeight.bottom { continue }
            let offset: Double
            if label.id == selected {
                offset = 24 // Clears the reticle.
            } else if label.style == .constellation {
                offset = -size.height / 2
            } else if case .body(let body)? = ObjectID(rawValue: label.id).kind, let state = bodyStates[body] {
                offset = max(7, state.radiusPoints + 4) // Clears the disc.
            } else {
                offset = 7
            }
            candidates.append(LabelLayout.Candidate(
                id: label.id, anchor: point, size: (size.width, size.height),
                priority: label.priority, offsetBelow: offset
            ))
        }

        let result = LabelLayout.place(candidates, screen: camera.screen, limit: display.labelDensity.labelLimit)
        let anchors = Dictionary(uniqueKeysWithValues: candidates.map { ($0.id, $0.anchor) })

        for key in placed.keys { placed[key]?.target = 0 }
        for p in result {
            // The offset is measured from the anchor, down the screen.
            let offset = Float(p.position.y - (anchors[p.id]?.y ?? p.position.y))
            if placed[p.id] != nil {
                placed[p.id]?.target = 1
                placed[p.id]?.offset = offset
            } else {
                placed[p.id] = PlacedLabel(offset: offset, alpha: 0, target: 1)
            }
        }
        sky.updateGuidance()
        sky.updateHeading()
    }

    private func labelDirection(_ id: String, frame: SkyFrame) -> Vec3? {
        switch ObjectID(rawValue: id).kind {
        case .body(let body):
            return bodyStates[body]?.direction
        default:
            return labelIndex[id].map { frame.j2000ToHorizon * $0 }
        }
    }

    private lazy var labelIndex: [String: Vec3] = {
        var out: [String: Vec3] = [:]
        for l in labels { if let d = l.direction { out[l.id] = d } }
        return out
    }()

    // MARK: Draw

    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}

    func draw(in view: MTKView) {
        guard let catalog = sky.app.catalog, let observer = sky.app.observer,
              let pass = view.currentRenderPassDescriptor, let drawable = view.currentDrawable,
              let commands = queue.makeCommandBuffer(),
              let encoder = commands.makeRenderCommandEncoder(descriptor: pass) else { return }

        prepareStaticGeometry(catalog)
        refreshDeepSkyMarkers()
        let wall = CACurrentMediaTime()
        let dt = lastFrameTime == 0 ? 1.0 / 60 : min(0.1, wall - lastFrameTime)
        lastFrameTime = wall

        let date = sky.app.skyDate
        refreshStars(catalog, date: date)
        let frame = SkyFrame(time: AstroTime(date), observer: observer)
        let display = sky.app.preferences.display

        let bounds = view.bounds.size
        let screen = ScreenSize(width: bounds.width, height: bounds.height)
        let isAR: Bool
        let arFOV: Double?
        if case .augmentedReality(let fov) = mode { isAR = true; arFOV = fov } else { isAR = false; arFOV = nil }
        let camera = sky.camera(time: wall, screen: screen, projection: isAR ? .rectilinear : .stereographic, arFieldOfView: arFOV)

        refreshBodies(frame: frame, date: date, camera: camera, wall: wall, rate: sky.app.clock.rate)
        if wall - lastLabelUpdate > 0.125 {
            lastLabelUpdate = wall
            updateLabels(camera: camera, frame: frame, display: display)
        }

        // Sky brightness dims stars and tints the background.
        let sunAltitude = bodyStates[.sun].map { Horizontal(unitVector: $0.direction).altitude } ?? -90
        let moon = bodyStates[.moon]
        let brightness = SkyBrightness(
            sunAltitude: sunAltitude, moonAltitude: moon.map { Horizontal(unitVector: $0.direction).altitude },
            moonIllumination: moon?.illumination ?? 0
        )
        // In AR the real sky is behind the overlay, so nothing dims. With the atmosphere
        // switched off the view shows the stars as they'd appear with no air at all.
        let skyLevel = isAR || !display.atmosphere ? 0 : brightness.total
        let daylight = max(0, min(1, (skyLevel - 0.3) / 0.3))
        nightVisibility = Float(1 - daylight * daylight * (3 - 2 * daylight))
        let ceiling = sky.app.starMagnitudeCeiling
        let magnitudeLimit = min(
            StarAppearance.limitingMagnitude(fieldOfView: camera.fieldOfView, base: display.magnitudeLimit, skyBrightness: skyLevel),
            ceiling + 0.3
        )

        var uniforms = SkyUniforms()
        uniforms.j2000ToHorizon = frame.j2000ToHorizon.simd
        uniforms.horizonToView = camera.orientation.simd
        uniforms.viewToHorizon = camera.orientation.transposed.simd
        uniforms.screen = SIMD4(Float(screen.width), Float(screen.height), Float(camera.scale), Float(camera.projection.rawValue))
        uniforms.stars = SIMD4(Float(magnitudeLimit), Float(display.starBrightness), Float(view.contentScaleFactor), display.atmosphere ? 1 : 0)
        let sunDirection = bodyStates[.sun]?.direction ?? Vec3(0, 0, -1)
        uniforms.sun = SIMD4(sunDirection.simd, Float(skyLevel))
        uniforms.mode = SIMD4(
            display.nightVision ? 1 : 0, isAR ? 1 : 0,
            0.99, display.atmosphere ? 1 : 0
        )

        encoder.setVertexBytes(&uniforms, length: MemoryLayout<SkyUniforms>.stride, index: 1)
        encoder.setFragmentBytes(&uniforms, length: MemoryLayout<SkyUniforms>.stride, index: 1)

        if !isAR, let texture = milkyWayTexture {
            encoder.setRenderPipelineState(skyPipeline)
            encoder.setFragmentTexture(texture, index: 0)
            encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
        }

        drawLines(encoder, display: display, isAR: isAR)

        if let stars = starBuffer {
            let count = catalog.stars.count(brighterThan: Float(magnitudeLimit))
            if count > 0 {
                encoder.setRenderPipelineState(starPipeline)
                encoder.setVertexBuffer(stars, offset: 0, index: 0)
                encoder.drawPrimitives(type: .point, vertexStart: 0, vertexCount: count)
            }
        }

        drawMarkers(encoder, frame: frame, camera: camera, display: display)

        if !isAR, display.horizon {
            encoder.setRenderPipelineState(groundPipeline)
            encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
        }

        // Over the ground, so a selection below the horizon can still be found.
        drawSelection(encoder, frame: frame)
        drawLabels(encoder, frame: frame, dt: dt, display: display)

        encoder.endEncoding()
        commands.present(drawable)
        commands.commit()

        // Spend frames only when something is moving. A still sky doesn't need 60 Hz.
        let isMoving = sky.cameraMode == .compass || isAR || sky.isAnimating || abs(sky.app.clock.rate) > 1
        let desired = isMoving ? 60 : 30
        if view.preferredFramesPerSecond != desired { view.preferredFramesPerSecond = desired }
    }

    private func drawLines(_ encoder: MTLRenderCommandEncoder, display: DisplayOptions, isAR: Bool) {
        encoder.setRenderPipelineState(linePipeline)

        func draw(_ buffer: MTLBuffer?, color: SIMD4<Float>, width: Float, frame: Float) {
            guard let buffer else { return }
            var style = LineStyle(color: color, width: width, frame: frame)
            encoder.setVertexBuffer(buffer, offset: 0, index: 0)
            encoder.setVertexBytes(&style, length: MemoryLayout<LineStyle>.stride, index: 2)
            encoder.setFragmentBytes(&style, length: MemoryLayout<LineStyle>.stride, index: 2)
            encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: buffer.length / (7 * MemoryLayout<Float>.stride))
        }

        if display.azimuthalGrid { draw(horizonGridBuffer, color: SIMD4(0.45, 0.55, 0.45, 0.28), width: 0.5, frame: 1) }
        if display.equatorialGrid { draw(equatorialGridBuffer, color: SIMD4(0.40, 0.55, 0.75, 0.28), width: 0.5, frame: 0) }
        if display.constellationBoundaries { draw(boundaryBuffer, color: SIMD4(0.45, 0.45, 0.60, 0.22), width: 0.5, frame: 0) }
        if display.constellationLines {
            draw(constellationBuffer, color: SIMD4(0.62, 0.72, 0.88, 0.05 + 0.05 * nightVisibility), width: 0.5, frame: 0)
        }
    }

    private func drawMarkers(_ encoder: MTLRenderCommandEncoder, frame: SkyFrame, camera: SkyCamera, display: DisplayOptions) {
        var markers: [Marker] = []
        markers.reserveCapacity(64)

        // Deep-sky rings appear once zoomed in enough to be a useful guide.
        if display.deepSkyObjects, camera.fieldOfView < 70, nightVisibility > 0.02 {
            for (object, direction) in deepSkyMarkers {
                let h = frame.j2000ToHorizon * direction
                guard camera.contains(h, margin: 20) else { continue }
                let size = (object.deepSky?.majorAxis ?? 6) / 60 * camera.pointsPerDegree
                var color = deepSkyColor(object.type)
                color.w *= nightVisibility
                markers.append(Marker(
                    directionRadius: SIMD4(h.simd, Float(max(4.5, min(size / 2, 90)))),
                    color: color, lightKind: SIMD4(0, 0, 0, 1)
                ))
            }
        }

        for body in SolarSystemBody.allCases {
            guard let s = bodyStates[body], camera.contains(s.direction, margin: 40) else { continue }
            // Light direction in the marker's screen space. The Sun's direction relative
            // to the body, seen by the camera, gives the correct limb for any roll. A phase
            // only means something on a disc big enough to show one: on a small planet
            // marker it would just paint a dark dot.
            var light = SIMD3<Float>(0, 0, 1)
            if body != .sun, s.radiusPoints >= 8, let sun = bodyStates[.sun] {
                let view = camera.orientation * sun.direction
                let centre = camera.orientation * s.direction
                let tangent = Vec3(view.x - centre.x, view.y - centre.y, 0)
                let length = max(tangent.length, 1e-6)
                let phase = s.phaseAngle * Angle.degToRad
                light = SIMD3(Float(tangent.x / length * sin(phase)), Float(tangent.y / length * sin(phase)), Float(cos(phase)))
            }
            markers.append(Marker(
                directionRadius: SIMD4(s.direction.simd, Float(s.radiusPoints * 2)),
                color: bodyColor(body), lightKind: SIMD4(light, 0)
            ))
        }

        for tag in sky.app.document.tags {
            guard let catalog = sky.app.catalog,
                  let direction = try? Locator.tagDirection(tag, frame: frame, catalog: catalog),
                  camera.contains(direction, margin: 10) else { continue }
            markers.append(Marker(directionRadius: SIMD4(direction.simd, 6), color: tagColor(tag.color), lightKind: SIMD4(0, 0, 0, 3)))
        }

        // Satellites shine by reflected sunlight against a dark sky, so none show by day.
        for s in satelliteStates where nightVisibility > 0.02 && camera.contains(s.direction, margin: 10) {
            markers.append(Marker(directionRadius: SIMD4(s.direction.simd, 4), color: SIMD4(0.75, 0.95, 0.85, nightVisibility), lightKind: SIMD4(0, 0, 0, 3)))
        }

        guard !markers.isEmpty else { return }
        encoder.setRenderPipelineState(markerPipeline)
        setInstances(markers, on: encoder)
        encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 6, instanceCount: markers.count)
    }

    private func drawSelection(_ encoder: MTLRenderCommandEncoder, frame: SkyFrame) {
        guard let id = sky.app.selection, let object = sky.app.object(id),
              let direction = try? Locator.direction(of: object, frame: frame, tracker: sky.tracker(for: id)) else { return }
        let reticle = Marker(directionRadius: SIMD4(direction.simd, 24), color: SIMD4(0.84, 0.74, 0.57, 1), lightKind: SIMD4(0, 0, 0, 2))
        encoder.setRenderPipelineState(markerPipeline)
        setInstances([reticle], on: encoder)
        encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 6, instanceCount: 1)
    }

    /// Metal caps inline bytes at 4 KB, so larger per-frame sets get a real buffer.
    private func setInstances<T>(_ instances: [T], on encoder: MTLRenderCommandEncoder) {
        instances.withUnsafeBytes { raw in
            guard let base = raw.baseAddress else { return }
            if raw.count <= 4096 {
                encoder.setVertexBytes(base, length: raw.count, index: 0)
            } else if let buffer = device.makeBuffer(bytes: base, length: raw.count, options: .storageModeShared) {
                encoder.setVertexBuffer(buffer, offset: 0, index: 0)
            }
        }
    }

    private func drawLabels(_ encoder: MTLRenderCommandEncoder, frame: SkyFrame, dt: Double, display: DisplayOptions) {
        guard let atlas else { return }
        var instances: [LabelInstance] = []
        instances.reserveCapacity(placed.count + 8)
        let fade = Float(min(1, dt / 0.18))

        for (id, label) in placed {
            let alpha = label.alpha + (label.target - label.alpha) * fade
            if alpha < 0.01, label.target == 0 {
                placed[id] = nil
                continue
            }
            placed[id]?.alpha = alpha
            guard let direction = labelDirection(id, frame: frame),
                  let glyph = atlas.glyph(for: id) else { continue }
            instances.append(LabelInstance(
                directionOffset: SIMD4(direction.simd, label.offset),
                uvRect: glyph.uv, sizeAlpha: SIMD4(Float(glyph.width), Float(glyph.height), alpha * labelVisibility(id), 0),
                color: labelColor(id)
            ))
        }

        if display.horizon {
            for point in SkyLabels.compass {
                guard let glyph = atlas.glyph(for: point.text) else { continue }
                instances.append(LabelInstance(
                    directionOffset: SIMD4(point.direction.simd, 12),
                    uvRect: glyph.uv, sizeAlpha: SIMD4(Float(glyph.width), Float(glyph.height), 0.9, 0),
                    color: SIMD4(0.84, 0.74, 0.57, 1)
                ))
            }
        }

        guard !instances.isEmpty else { return }
        encoder.setRenderPipelineState(labelPipeline)
        encoder.setFragmentTexture(atlas.texture, index: 0)
        setInstances(instances, on: encoder)
        encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 6, instanceCount: instances.count)
    }

    // MARK: Hit testing

    /// Selects by screen distance across objects drawn at this zoom.
    func pick(at point: CGPoint) -> ObjectID? {
        guard let camera = sky.lastCamera, let observer = sky.app.observer, let catalog = sky.app.catalog else { return nil }
        let frame = SkyFrame(time: AstroTime(sky.app.skyDate), observer: observer)
        let touch = ScreenPoint(x: point.x, y: point.y)
        var targets: [HitTest.Target] = []

        for (body, state) in bodyStates {
            guard let p = camera.project(state.direction), camera.isVisible(p, margin: 30) else { continue }
            targets.append(HitTest.Target(id: ObjectID.body(body).rawValue, point: p, radius: state.radiusPoints, magnitude: state.magnitude))
        }
        for s in satelliteStates {
            guard let p = camera.project(s.direction), camera.isVisible(p, margin: 30) else { continue }
            targets.append(HitTest.Target(id: ObjectID.satellite(norad: s.id).rawValue, point: p, radius: 4, magnitude: 2))
        }
        if sky.app.preferences.display.deepSkyObjects {
            for (object, direction) in deepSkyMarkers {
                let h = frame.j2000ToHorizon * direction
                guard let p = camera.project(h), p.distance(to: touch) < 60 else { continue }
                targets.append(HitTest.Target(id: object.id.rawValue, point: p, radius: 6, magnitude: object.magnitude ?? 9))
            }
        }
        let stars = catalog.stars
        let limit = min(stars.count, stars.count(brighterThan: Float(StarAppearance.limitingMagnitude(fieldOfView: camera.fieldOfView, base: 6, skyBrightness: 0))))
        for i in 0..<limit {
            let h = frame.j2000ToHorizon * stars.direction(at: i)
            guard h.dot(camera.viewDirection) > -0.2, let p = camera.project(h), p.distance(to: touch) < 40 else { continue }
            targets.append(HitTest.Target(id: ObjectID.star(hip: Int(stars.hip[i])).rawValue, point: p, radius: 1, magnitude: Double(stars.magnitude[i])))
        }
        return HitTest.pick(targets, at: touch).map(ObjectID.init(rawValue:))
    }

    // MARK: Colors

    private func bodyColor(_ body: SolarSystemBody) -> SIMD4<Float> {
        switch body {
        case .sun: SIMD4(1.00, 0.95, 0.82, 1)
        case .moon: SIMD4(0.93, 0.92, 0.88, 1)
        case .mercury: SIMD4(0.78, 0.74, 0.70, 1)
        case .venus: SIMD4(0.98, 0.93, 0.80, 1)
        case .mars: SIMD4(0.95, 0.52, 0.32, 1)
        case .jupiter: SIMD4(0.94, 0.86, 0.72, 1)
        case .saturn: SIMD4(0.92, 0.82, 0.60, 1)
        case .uranus: SIMD4(0.65, 0.88, 0.90, 1)
        case .neptune: SIMD4(0.45, 0.60, 0.95, 1)
        }
    }

    private func deepSkyColor(_ type: ObjectType) -> SIMD4<Float> {
        switch type {
        case .galaxy: SIMD4(0.85, 0.70, 0.55, 0.65)
        case .nebula, .planetaryNebula, .supernovaRemnant, .clusterNebula: SIMD4(0.55, 0.82, 0.75, 0.65)
        default: SIMD4(0.60, 0.72, 0.92, 0.65)
        }
    }

    private func tagColor(_ color: SkyTag.Color) -> SIMD4<Float> {
        switch color {
        case .star: SIMD4(0.84, 0.74, 0.57, 1)
        case .ember: SIMD4(0.95, 0.50, 0.30, 1)
        case .aurora: SIMD4(0.45, 0.90, 0.65, 1)
        case .ice: SIMD4(0.60, 0.80, 1.00, 1)
        case .rose: SIMD4(0.95, 0.60, 0.72, 1)
        }
    }

    private func labelColor(_ id: String) -> SIMD4<Float> {
        switch ObjectID(rawValue: id).kind {
        case .constellation: nightVisibility < 0.5 ? SIMD4(0.90, 0.94, 1.00, 0.8) : SIMD4(0.56, 0.68, 0.84, 0.5)
        // Pale text can't read against the Sun's own glare.
        case .body(.sun): nightVisibility < 0.5 ? SIMD4(0.03, 0.07, 0.14, 1) : SIMD4(0.96, 0.92, 0.82, 1)
        case .body: SIMD4(0.96, 0.92, 0.82, 1)
        case .deepSky: SIMD4(0.70, 0.85, 0.80, 0.85)
        default: SIMD4(0.82, 0.86, 0.92, 0.9)
        }
    }
}
