import AstronomyCore
import MapKit
import ObservingKit
import SkySession
import SwiftUI
import UIKit
import UserData

/// A map of night-time lights for comparing observing sites. It shows light emitted
/// upward as seen from orbit, which indicates light pollution without measuring sky
/// brightness, so it never claims a Bortle class.
struct DarkSkyMapView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    let onUpgrade: (ProFeature?) -> Void

    @State private var comparisons: [UUID: String] = [:]

    private var model: AppModel { services.model }

    var body: some View {
        Group {
            if model.hasAccess(to: .lightPollutionMap) {
                VStack(spacing: 0) {
                    NightLightsMap(
                        center: model.observer,
                        sites: model.preferences.savedLocations,
                        onDrop: { coordinate in
                            let place = SavedLocation(
                                name: String(format: "%.2f°, %.2f°", coordinate.latitude, coordinate.longitude),
                                location: ObserverLocation(latitude: coordinate.latitude, longitude: coordinate.longitude),
                                timeZoneIdentifier: model.location?.timeZoneIdentifier ?? TimeZone.current.identifier
                            )
                            model.addSavedLocation(place)
                        }
                    )
                    siteList
                }
            } else {
                StateMessage(
                    systemImage: "map", title: "Find Darker Skies",
                    message: "Compare places on a map of night-time lights from NASA satellite imagery.",
                    actionTitle: "See What's in Pro", action: { onUpgrade(.lightPollutionMap) }
                )
                .frame(maxHeight: .infinity)
            }
        }
        .background(theme.background)
        .navigationTitle("Dark-Sky Map")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: model.preferences.savedLocations) {
            await refreshComparisons()
        }
    }

    private var siteList: some View {
        List {
            Section {
                ForEach(model.preferences.savedLocations) { site in
                    Button {
                        model.setLocation(site)
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(site.name).foregroundStyle(theme.primary)
                            if let text = comparisons[site.id] {
                                Text(text).font(Typography.caption).foregroundStyle(theme.secondary)
                            }
                        }
                    }
                    .skyRow(theme)
                }
            } header: {
                Text("Saved Places")
            } footer: {
                Text("Press and hold on the map to add a place. Brightness is a guide based on \(NightLights.attribution), not a measurement of your sky.")
            }
        }
        .skyList()
        .frame(maxHeight: 260)
    }

    private func refreshComparisons() async {
        guard let here = model.observer, let reference = await NightLightSampler.sample(here) else { return }
        for site in model.preferences.savedLocations {
            if let value = await NightLightSampler.sample(site.location) {
                comparisons[site.id] = NightLights.compare(value, to: reference)
            }
        }
    }
}

/// Reads the relative brightness of one location from the published tiles.
enum NightLightSampler {
    static func sample(_ location: ObserverLocation) async -> Double? {
        let t = NightLights.tile(for: location, zoom: NightLights.maxZoom)
        guard let url = URL(string: NightLights.tileURL(z: NightLights.maxZoom, x: t.x, y: t.y)),
              let (data, _) = try? await URLSession.shared.data(from: url),
              let image = UIImage(data: data)?.cgImage,
              let pixelData = image.dataProvider?.data,
              let bytes = CFDataGetBytePtr(pixelData),
              t.pixelX < image.width, t.pixelY < image.height else { return nil }
        let perPixel = image.bitsPerPixel / 8
        let offset = t.pixelY * image.bytesPerRow + t.pixelX * perPixel
        guard perPixel >= 3 else { return Double(bytes[offset]) / 255 }
        let sum = Double(bytes[offset]) + Double(bytes[offset + 1]) + Double(bytes[offset + 2])
        return sum / (3 * 255)
    }
}

private struct NightLightsMap: UIViewRepresentable {
    let center: ObserverLocation?
    let sites: [SavedLocation]
    let onDrop: (CLLocationCoordinate2D) -> Void

    final class Coordinator: NSObject, MKMapViewDelegate {
        var onDrop: (CLLocationCoordinate2D) -> Void

        init(onDrop: @escaping (CLLocationCoordinate2D) -> Void) {
            self.onDrop = onDrop
        }

        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let tiles = overlay as? MKTileOverlay {
                let r = MKTileOverlayRenderer(tileOverlay: tiles)
                r.alpha = 0.85
                return r
            }
            return MKOverlayRenderer(overlay: overlay)
        }

        @objc func handlePress(_ g: UILongPressGestureRecognizer) {
            guard g.state == .began, let map = g.view as? MKMapView else { return }
            onDrop(map.convert(g.location(in: map), toCoordinateFrom: map))
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(onDrop: onDrop) }

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.delegate = context.coordinator
        map.overrideUserInterfaceStyle = .dark
        let template = NightLights.tileURL(z: 0, x: 0, y: 0)
            .replacingOccurrences(of: "/0/0/0.png", with: "/{z}/{y}/{x}.png")
        let overlay = MKTileOverlay(urlTemplate: template)
        overlay.maximumZ = NightLights.maxZoom
        overlay.canReplaceMapContent = false
        map.addOverlay(overlay, level: .aboveLabels)
        map.addGestureRecognizer(UILongPressGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePress(_:))))
        if let center {
            let region = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: center.latitude, longitude: center.longitude),
                span: MKCoordinateSpan(latitudeDelta: 6, longitudeDelta: 6)
            )
            map.setRegion(region, animated: false)
        }
        return map
    }

    func updateUIView(_ map: MKMapView, context: Context) {
        context.coordinator.onDrop = onDrop
        map.removeAnnotations(map.annotations)
        for site in sites {
            let pin = MKPointAnnotation()
            pin.title = site.name
            pin.coordinate = CLLocationCoordinate2D(latitude: site.location.latitude, longitude: site.location.longitude)
            map.addAnnotation(pin)
        }
    }
}
