import Foundation
import Observation
import ObservingKit
import UIKit
import UserNotifications

@MainActor
@Observable
final class NotificationService {
    private(set) var isAuthorized = false
    private(set) var isDenied = false

    @ObservationIgnored private let center = UNUserNotificationCenter.current()

    func refreshAuthorization() async {
        let settings = await center.notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
        isDenied = settings.authorizationStatus == .denied
    }

    @discardableResult
    func requestAuthorization() async -> Bool {
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        await refreshAuthorization()
        return granted
    }

    /// Replaces planned alerts so a changed location never leaves stale ones behind.
    /// Reminders the user asked for by hand have their own prefix and are left alone.
    func schedule(_ alerts: [PlannedAlert]) async {
        guard isAuthorized else { return }
        let pending = await center.pendingNotificationRequests()
        center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix("event.") })
        for alert in alerts {
            try? await add(id: alert.id, title: alert.title, body: alert.body, at: alert.fireDate)
        }
    }

    /// A one-off reminder an hour before an event, or at the event if that is sooner.
    func remind(of event: SkyEvent) async -> Bool {
        if !isAuthorized, await !requestAuthorization() { return false }
        let hourBefore = event.date.addingTimeInterval(-3600)
        let fire = hourBefore > Date() ? hourBefore : event.date
        guard fire > Date() else { return false }
        do {
            try await add(id: "reminder.\(event.id)", title: event.title, body: event.detail, at: fire)
            return true
        } catch {
            return false
        }
    }

    private func add(id: String, title: String, body: String, at date: Date) async throws {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        try await center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
    }
}

/// Finds the active scene for StoreKit's management sheet.
enum UIApplicationBridge {
    @MainActor
    static var activeScene: UIWindowScene? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
    }
}
