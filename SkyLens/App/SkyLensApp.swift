import Foundation
import Observation
import ObservingKit
import SkySession
import SwiftUI

@main
struct SkyLensApp: App {
    @State private var services = AppServices()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(services)
        }
    }
}

/// Owns every long-lived service, so views receive one object from the environment.
@MainActor
@Observable
final class AppServices {
    let model: AppModel
    let sky: SkyViewModel
    let motion: MotionService
    let location: LocationService
    let store: StoreService
    let notifications: NotificationService

    init() {
        let client = URLSessionHTTPClient()
        let support = (try? FileManager.default.url(
            for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true
        )) ?? FileManager.default.temporaryDirectory
        let directory = support.appendingPathComponent("SkyLens", isDirectory: true)

        // UI tests launch with a throwaway directory so each run starts clean.
        let storage: URL = ProcessInfo.processInfo.arguments.contains("-uitesting")
            ? FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            : directory

        let model = AppModel(dependencies: AppDependencies(
            http: client,
            weather: MetNorwayProvider(client: client, userAgent: AppLinks.userAgent),
            storageDirectory: storage
        ))
        let motion = MotionService()
        self.model = model
        self.motion = motion
        sky = SkyViewModel(app: model, motion: motion)
        location = LocationService()
        store = StoreService(model: model)
        notifications = NotificationService()

        // UI tests pass a fixed moment so CI can photograph the night sky at any hour.
        let arguments = ProcessInfo.processInfo.arguments
        if let flag = arguments.firstIndex(of: "-skyDate"), arguments.indices.contains(flag + 1),
           let date = try? Date(arguments[flag + 1], strategy: .iso8601) {
            model.setSkyDate(date)
        }
    }
}

/// External addresses, gathered so a release checklist can review them in one place.
enum AppLinks {
    /// MET Norway requires an identifying User-Agent with contact details. Replace the
    /// address with a real support contact before release.
    static let userAgent = "SkyLens/1.0 support@skylens.example"
    /// Apple's standard EULA, valid until custom terms exist.
    static let termsOfUse = URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")
    /// Must be set to a hosted privacy policy before submission. The link stays hidden
    /// until then so that the app never points at a page that does not exist.
    static let privacyPolicy: URL? = nil
}

/// Bridges the kit's HTTP seam to URLSession.
struct URLSessionHTTPClient: HTTPClient {
    func get(_ url: String, headers: [String: String]) async throws -> HTTPResponse {
        guard let address = URL(string: url) else { throw URLError(.badURL) }
        var request = URLRequest(url: address)
        for (key, value) in headers { request.setValue(value, forHTTPHeaderField: key) }
        request.timeoutInterval = 20
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        var fields: [String: String] = [:]
        for (key, value) in http.allHeaderFields {
            if let k = key as? String, let v = value as? String { fields[k] = v }
        }
        return HTTPResponse(status: http.statusCode, body: data, headers: fields)
    }
}
