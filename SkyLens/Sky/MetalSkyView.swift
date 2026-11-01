import AstronomyCore
import MetalKit
import SkyCatalog
import SkyProjection
import SwiftUI
import UIKit

/// Hosts the renderer and its gestures. Gestures are UIKit recognizers because they
/// report raw translation and scale without going through SwiftUI's update cycle.
struct MetalSkyView: UIViewRepresentable {
    let sky: SkyViewModel
    var mode: SkyRenderer.Mode = .planetarium
    var isPaused = false
    var onSelect: (ObjectID?) -> Void
    var onOpenDetail: (ObjectID) -> Void
    var onLongPress: (Horizontal) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    func makeUIView(context: Context) -> UIView {
        guard let device = MTLCreateSystemDefaultDevice() else { return fallback("This device can't run the sky renderer.") }
        let view = MTKView(frame: .zero, device: device)
        view.colorPixelFormat = .bgra8Unorm_srgb
        view.preferredFramesPerSecond = 60
        view.isPaused = isPaused
        view.enableSetNeedsDisplay = false
        view.framebufferOnly = true
        view.autoResizeDrawable = true
        if case .augmentedReality = mode {
            view.isOpaque = false
            view.backgroundColor = .clear
            view.clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 0)
        } else {
            view.clearColor = MTLClearColor(red: 0.02, green: 0.035, blue: 0.063, alpha: 1)
        }

        guard let renderer = SkyRenderer(device: device, sky: sky, mode: mode) else {
            return fallback("The sky renderer failed to start.")
        }
        view.delegate = renderer
        context.coordinator.renderer = renderer
        context.coordinator.attachGestures(to: view)
        view.isAccessibilityElement = true
        view.accessibilityLabel = "Sky view"
        view.accessibilityHint = "Use the Search or Tonight buttons to explore objects."
        view.accessibilityIdentifier = "skyCanvas"
        return view
    }

    func updateUIView(_ view: UIView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.renderer?.update(mode: mode)
        (view as? MTKView)?.isPaused = isPaused
    }

    private func fallback(_ message: String) -> UIView {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.textAlignment = .center
        label.numberOfLines = 0
        return label
    }

    @MainActor
    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var parent: MetalSkyView
        var renderer: SkyRenderer?
        private var lastScale: CGFloat = 1
        private var lastTranslation = CGPoint.zero

        init(parent: MetalSkyView) {
            self.parent = parent
        }

        func attachGestures(to view: UIView) {
            let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
            pan.maximumNumberOfTouches = 1
            let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
            let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap(_:)))
            doubleTap.numberOfTapsRequired = 2
            let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
            tap.require(toFail: doubleTap)
            let press = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
            press.minimumPressDuration = 0.5
            for g in [pan, pinch, doubleTap, tap, press] as [UIGestureRecognizer] {
                g.delegate = self
                view.addGestureRecognizer(g)
            }
        }

        func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
            g is UIPinchGestureRecognizer || other is UIPinchGestureRecognizer
        }

        @objc private func handlePan(_ g: UIPanGestureRecognizer) {
            let t = g.translation(in: g.view)
            if g.state == .began { lastTranslation = .zero }
            parent.sky.drag(dx: t.x - lastTranslation.x, dy: t.y - lastTranslation.y)
            lastTranslation = t
        }

        @objc private func handlePinch(_ g: UIPinchGestureRecognizer) {
            if g.state == .began { lastScale = 1 }
            parent.sky.zoom(by: g.scale / lastScale)
            lastScale = g.scale
        }

        @objc private func handleTap(_ g: UITapGestureRecognizer) {
            guard let renderer else { return }
            let id = renderer.pick(at: g.location(in: g.view))
            // A second tap on the selected object opens it.
            if let id, id == parent.sky.app.selection {
                parent.onOpenDetail(id)
            } else {
                parent.onSelect(id)
            }
        }

        @objc private func handleDoubleTap(_ g: UITapGestureRecognizer) {
            guard let camera = parent.sky.lastCamera else { return }
            let target = camera.unproject(ScreenPoint(x: g.location(in: g.view).x, y: g.location(in: g.view).y))
            parent.sky.manualView = ManualView(centering: Horizontal(unitVector: target))
            parent.sky.zoom(by: 2)
        }

        @objc private func handleLongPress(_ g: UILongPressGestureRecognizer) {
            guard g.state == .began, let camera = parent.sky.lastCamera else { return }
            let point = g.location(in: g.view)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            parent.onLongPress(Horizontal(unitVector: camera.unproject(ScreenPoint(x: point.x, y: point.y))))
        }
    }
}
