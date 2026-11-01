import AstronomyCore
import CoreLocation
import MapKit
import Observation
import UserData

/// One-shot location and place search. There is no continuous tracking, because the
/// sky over a person doesn't change noticeably within a walk.
@MainActor
@Observable
final class LocationService: NSObject {
    enum State: Equatable {
        case idle
        case requesting
        case denied
        case failed(String)
    }

    private(set) var state = State.idle
    @ObservationIgnored private let manager = CLLocationManager()
    @ObservationIgnored private var continuation: CheckedContinuation<SavedLocation?, Never>?

    override init() {
        super.init()
        manager.delegate = self
        // A kilometre is far more precise than sky positions can show, and asking for
        // less keeps the user's exact whereabouts out of the app altogether.
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    var isDenied: Bool {
        let status = manager.authorizationStatus
        return status == .denied || status == .restricted
    }

    /// Requests the current location. Returns nil if the user declines or it fails.
    func requestCurrentLocation() async -> SavedLocation? {
        guard continuation == nil else { return nil }
        state = .requesting
        return await withCheckedContinuation { continuation in
            self.continuation = continuation
            if manager.authorizationStatus == .notDetermined {
                manager.requestWhenInUseAuthorization()
            } else if isDenied {
                finish(nil, state: .denied)
            } else {
                manager.requestLocation()
            }
        }
    }

    private func finish(_ value: SavedLocation?, state: State) {
        self.state = state
        continuation?.resume(returning: value)
        continuation = nil
    }

    private func named(_ location: CLLocation) async {
        var name = "Current Location"
        var zone = TimeZone.current
        if let place = try? await CLGeocoder().reverseGeocodeLocation(location).first {
            name = place.locality ?? place.name ?? name
            zone = place.timeZone ?? zone
        }
        finish(SavedLocation(
            name: name,
            location: ObserverLocation(
                latitude: location.coordinate.latitude, longitude: location.coordinate.longitude,
                elevation: location.verticalAccuracy >= 0 ? location.altitude : 0
            ),
            timeZoneIdentifier: zone.identifier
        ), state: .idle)
    }

    /// Turns typed coordinates into a named place with its own time zone. Without a
    /// network it keeps the coordinates as the name.
    func place(latitude: Double, longitude: Double) async -> SavedLocation {
        var name = String(format: "%.2f°, %.2f°", latitude, longitude)
        var zone = TimeZone.current
        let location = CLLocation(latitude: latitude, longitude: longitude)
        if let place = try? await CLGeocoder().reverseGeocodeLocation(location).first {
            name = place.locality ?? place.name ?? name
            zone = place.timeZone ?? zone
        }
        return SavedLocation(
            name: name,
            location: ObserverLocation(latitude: latitude, longitude: longitude),
            timeZoneIdentifier: zone.identifier
        )
    }

    /// Manual place search, which works without any location permission.
    func search(_ query: String) async -> [SavedLocation] {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        request.resultTypes = .address
        guard let response = try? await MKLocalSearch(request: request).start() else { return [] }
        return response.mapItems.prefix(12).compactMap { item in
            let c = item.placemark.coordinate
            guard CLLocationCoordinate2DIsValid(c) else { return nil }
            let title = [item.placemark.locality ?? item.name, item.placemark.administrativeArea, item.placemark.country]
                .compactMap { $0 }.joined(separator: ", ")
            return SavedLocation(
                name: title.isEmpty ? (item.name ?? "Selected Place") : title,
                location: ObserverLocation(latitude: c.latitude, longitude: c.longitude),
                timeZoneIdentifier: (item.timeZone ?? .current).identifier
            )
        }
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            guard continuation != nil else { return }
            switch status {
            case .authorizedWhenInUse, .authorizedAlways:
                self.manager.requestLocation()
            case .denied, .restricted:
                finish(nil, state: .denied)
            default:
                break
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task { @MainActor in await named(location) }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            finish(nil, state: .failed("Your location couldn't be determined. Try again, or enter a place by hand."))
        }
    }
}
