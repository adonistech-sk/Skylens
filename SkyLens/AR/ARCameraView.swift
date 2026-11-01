@preconcurrency import AVFoundation
import SkyProjection
import SkySession
import SwiftUI
import UIKit

/// Sky overlay on the live camera. Objects are placed by direction alone, since the
/// sky is at infinity: there is no world anchoring and nothing to track but rotation.
struct ARCameraView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    @State private var camera = CameraModel()
    @State private var cameraOpacity = 1.0
    @State private var showCalibration = false

    private var model: AppModel { services.model }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            switch camera.state {
            case .requesting:
                ProgressView()
            case .denied:
                unavailable(
                    title: "Camera Access Is Off",
                    message: "AR needs the camera to show the sky behind the labels. Video stays on your device. Turn it on in Settings, or use the regular sky view with the compass.",
                    actionTitle: "Open Settings"
                ) {
                    if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                }
            case .unsupported:
                unavailable(
                    title: "AR Isn't Available",
                    message: "This device doesn't have the camera or sensors AR needs. The compass-following sky view shows the same sky.",
                    actionTitle: nil, action: nil
                )
            case .running:
                arContent
            }

            VStack {
                HStack {
                    Spacer()
                    SkyIconButton(systemImage: "xmark", label: "Close AR") { dismiss() }
                        .accessibilityIdentifier("closeARButton")
                }
                Spacer()
            }
            .padding(Space.l)
        }
        .statusBarHidden(true)
        .task {
            await camera.start()
            services.motion.start(location: model.observer)
        }
        .onDisappear {
            camera.stop()
            if services.sky.cameraMode != .compass { services.motion.stop() }
        }
    }

    @ViewBuilder
    private var arContent: some View {
        GeometryReader { proxy in
            ZStack {
                CameraPreview(session: camera.session)
                    .opacity(cameraOpacity)
                MetalSkyView(
                    sky: services.sky,
                    mode: .augmentedReality(fieldOfView: camera.fieldOfView(for: proxy.size)),
                    onSelect: { model.selection = $0 },
                    onOpenDetail: { _ in },
                    onLongPress: { _ in }
                )
            }
        }
        .ignoresSafeArea()

        VStack(spacing: Space.s) {
            Spacer()
            if let message = services.motion.headingQuality.message {
                banner(message)
            }
            // AR places labels using the compass, not by recognizing stars in the image.
            banner("Positions are estimated from your compass and may be a few degrees off. Confirm a star by its pattern.")
            if showCalibration {
                VStack(alignment: .leading, spacing: Space.xs) {
                    Text("Line up a bright star with its label")
                        .font(Typography.caption)
                        .foregroundStyle(theme.secondary)
                    Slider(
                        value: Binding(
                            get: { model.preferences.compassCorrection },
                            set: { value in model.updatePreferences { $0.compassCorrection = value } }
                        ),
                        in: -30...30
                    )
                    .accessibilityLabel("Compass offset")
                    Text("Camera").font(Typography.caption).foregroundStyle(theme.secondary)
                    Slider(value: $cameraOpacity, in: 0...1)
                        .accessibilityLabel("Camera and sky blend")
                }
                .padding(Space.m)
                .skyPanel(cornerRadius: 14)
            }
            HStack {
                Spacer()
                SkyIconButton(systemImage: "dial.low", label: "Calibrate", isActive: showCalibration) {
                    showCalibration.toggle()
                }
            }
        }
        .padding(Space.l)
    }

    private func banner(_ text: String) -> some View {
        Text(text)
            .font(Typography.caption)
            .foregroundStyle(theme.primary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, Space.m)
            .padding(.vertical, Space.s)
            .skyPanel(cornerRadius: 12)
    }

    private func unavailable(title: String, message: String, actionTitle: String?, action: (() -> Void)?) -> some View {
        StateMessage(systemImage: "camera", title: title, message: message, actionTitle: actionTitle, action: action)
    }
}

/// Owns the capture session and knows the lens's real field of view, which the overlay
/// must match or labels would drift off their stars.
@MainActor
@Observable
final class CameraModel {
    enum State { case requesting, running, denied, unsupported }

    private(set) var state = State.requesting
    @ObservationIgnored let session = AVCaptureSession()
    @ObservationIgnored private var sensorFieldOfView = 65.0
    @ObservationIgnored private var sensorAspect = 4.0 / 3

    func start() async {
        guard AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) != nil else {
            state = .unsupported
            return
        }
        if AVCaptureDevice.authorizationStatus(for: .video) == .notDetermined {
            _ = await AVCaptureDevice.requestAccess(for: .video)
        }
        guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
            state = .denied
            return
        }
        guard configure() else {
            state = .unsupported
            return
        }
        let session = session
        await Task.detached { session.startRunning() }.value
        state = .running
    }

    func stop() {
        let session = session
        Task.detached { session.stopRunning() }
    }

    private func configure() -> Bool {
        guard session.inputs.isEmpty else { return true }
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device), session.canAddInput(input) else { return false }
        session.beginConfiguration()
        session.sessionPreset = .high
        session.addInput(input)
        session.commitConfiguration()
        let format = device.activeFormat
        sensorFieldOfView = Double(format.videoFieldOfView)
        let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
        if dimensions.height > 0 { sensorAspect = Double(dimensions.width) / Double(dimensions.height) }
        return true
    }

    func fieldOfView(for size: CGSize) -> Double {
        SkyCamera.cameraFieldOfView(
            sensorFieldOfView: sensorFieldOfView, sensorAspect: sensorAspect,
            screen: ScreenSize(width: size.width, height: size.height)
        )
    }
}

private struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    final class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ view: PreviewView, context: Context) {}
}
