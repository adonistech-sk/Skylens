import AstronomyCore
import Foundation

/// The app's single source of "what time is it in the sky". Every position, in the
/// sky, in search and on detail pages, reads from this, so they can never disagree.
///
/// It is a linear map from the real clock: simulated = anchor + rate × elapsed.
public struct SkyClock: Sendable, Hashable {
    private var realAnchor: Date
    private var skyAnchor: Date
    public private(set) var rate: Double

    /// Time-lapse speeds in sky seconds per real second.
    public static let presets: [(label: String, rate: Double)] = [
        ("Paused", 0), ("Real time", 1), ("1 min/s", 60), ("10 min/s", 600),
        ("1 hr/s", 3600), ("1 day/s", 86_400),
    ]

    public init(now: Date = Date()) {
        realAnchor = now
        skyAnchor = now
        rate = 1
    }

    public func date(at real: Date) -> Date {
        let simulated = skyAnchor.addingTimeInterval(real.timeIntervalSince(realAnchor) * rate)
        return Self.clamp(simulated)
    }

    public func isLive(at real: Date) -> Bool {
        rate == 1 && abs(date(at: real).timeIntervalSince(real)) < 1
    }

    public func isPaused() -> Bool { rate == 0 }

    public mutating func setDate(_ date: Date, at real: Date) {
        realAnchor = real
        skyAnchor = Self.clamp(date)
    }

    public mutating func setRate(_ newRate: Double, at real: Date) {
        skyAnchor = date(at: real)
        realAnchor = real
        rate = newRate
    }

    public mutating func step(by seconds: TimeInterval, at real: Date) {
        setDate(date(at: real).addingTimeInterval(seconds), at: real)
    }

    public mutating func resetToNow(_ real: Date) {
        realAnchor = real
        skyAnchor = real
        rate = 1
    }

    /// Holds the simulation inside the validated ephemeris span, so a runaway
    /// time-lapse stops at the edge instead of showing unvalidated positions.
    public static func clamp(_ date: Date) -> Date {
        min(max(date, supportedRange.lowerBound), supportedRange.upperBound)
    }

    public static let supportedRange: ClosedRange<Date> = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let lower = calendar.date(from: DateComponents(year: AstroTime.supportedYears.lowerBound, month: 1, day: 1))!
        let upper = calendar.date(from: DateComponents(year: AstroTime.supportedYears.upperBound, month: 12, day: 31))!
        return lower...upper
    }()
}
