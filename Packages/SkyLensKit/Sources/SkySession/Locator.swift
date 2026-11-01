import AstronomyCore
import Foundation
import Satellites
import SkyCatalog
import UserData

/// The answer to "where is this right now, and can I see it?".
public struct ObjectLocation: Sendable, Hashable {
    public enum Status: Sendable, Hashable {
        case visible
        /// Above the horizon, but the sky is too bright to see it by eye.
        case aboveHorizonInDaylight
        case belowHorizon
        /// Can never rise from this latitude.
        case neverRises
        /// Position cannot be stated, for example from stale orbital data.
        case unavailable
    }

    /// Direction in the horizon frame, including refraction for bodies.
    public let horizontal: Horizontal?
    public let status: Status
    /// A sentence explaining the status in plain words.
    public let explanation: String
    /// The next chance to see it, when one can be calculated.
    public let nextRise: Date?
}

public struct ObjectObservation: Sendable, Hashable {
    public let location: ObjectLocation
    public let j2000: Equatorial?
    public let ofDate: Equatorial?
    public let riseTransitSet: RiseTransitSet?
    public let magnitude: Double?
    public let distanceAU: Double?
    public let angularDiameter: Double?
    public let illuminatedFraction: Double?
    public let constellation: String?
}

public enum Locator {
    /// Horizon-frame direction at an instant, for placing the camera or a marker.
    public static func direction(
        of object: SkyObject, frame: SkyFrame, tracker: SatelliteTracker? = nil
    ) throws -> Vec3? {
        if let body = object.solarSystemBody {
            return try Ephemeris.position(of: body, at: frame.time, for: frame.observer).geometric.unitVector
        }
        if let position = object.position {
            return frame.j2000ToHorizon * position.unitVector
        }
        if let tracker {
            return try tracker.look(at: frame.time.date, from: frame.observer).horizontal.unitVector
        }
        return nil
    }

    public static func tagDirection(_ tag: SkyTag, frame: SkyFrame, catalog: Catalog) throws -> Vec3? {
        switch tag.anchor {
        case .object(let id):
            return try catalog.object(id).flatMap { try direction(of: $0, frame: frame) }
        case .celestial(let position):
            return frame.j2000ToHorizon * position.unitVector
        case .localDirection(let horizontal, _):
            return horizontal.unitVector
        }
    }

    public static func locate(
        _ object: SkyObject, at date: Date, observer: ObserverLocation, tracker: SatelliteTracker? = nil
    ) throws -> ObjectLocation {
        let time = AstroTime(date)
        let frame = SkyFrame(time: time, observer: observer)
        let sun = try Ephemeris.altitude(of: .sun, at: time, for: observer)

        if case .satellite = object.id.kind {
            return try locateSatellite(object, date: date, observer: observer, tracker: tracker)
        }

        let h: Horizontal
        if let body = object.solarSystemBody {
            h = try Ephemeris.position(of: body, at: time, for: observer).apparent
        } else if let position = object.position {
            h = frame.horizontal(j2000: position.unitVector)
        } else {
            return ObjectLocation(horizontal: nil, status: .unavailable, explanation: "No position is available.", nextRise: nil)
        }

        if h.altitude > 0 {
            let place = "\(Int(h.altitude.rounded()))° above the \(h.compassPoint.name)ern horizon"
                .replacingOccurrences(of: "northeastern", with: "northeast")
                .replacingOccurrences(of: "northwestern", with: "northwest")
                .replacingOccurrences(of: "southeastern", with: "southeast")
                .replacingOccurrences(of: "southwestern", with: "southwest")
            if object.solarSystemBody == .sun {
                return ObjectLocation(horizontal: h, status: .visible, explanation: "\(place.capitalizedFirst). Never look at it without certified protection.", nextRise: nil)
            }
            if sun > -6, !isBrightEnoughForDaylight(object) {
                let event = try RiseSet.events(for: .body(.sun), after: date, observer: observer)
                let suffix = event.set.map { _ in " It will be easier to see after dark." } ?? ""
                return ObjectLocation(horizontal: h, status: .aboveHorizonInDaylight, explanation: "\(place.capitalizedFirst), but the sky is too bright.\(suffix)", nextRise: nil)
            }
            return ObjectLocation(horizontal: h, status: .visible, explanation: "\(place.capitalizedFirst).", nextRise: nil)
        }

        // Below the horizon: can it ever rise from here?
        if let position = object.position,
           RiseSet.altitudeRange(declination: position.declination, latitude: observer.latitude).upperBound < -1 {
            let hemisphere = position.declination < 0 ? "south" : "north"
            return ObjectLocation(
                horizontal: h, status: .neverRises,
                explanation: "It never rises from your latitude. You would need to travel further \(hemisphere) to see it.",
                nextRise: nil
            )
        }
        let target = object.skyTarget
        let rise = try target.flatMap { try RiseSet.nextRise(of: $0, after: date, observer: observer) }
        let degrees = Int(abs(h.altitude).rounded())
        return ObjectLocation(
            horizontal: h, status: .belowHorizon,
            explanation: rise == nil
                ? "It is \(degrees)° below the horizon right now."
                : "It is \(degrees)° below the horizon right now, and rises again soon.",
            nextRise: rise
        )
    }

    private static func isBrightEnoughForDaylight(_ object: SkyObject) -> Bool {
        object.solarSystemBody == .moon || object.solarSystemBody == .venus
    }

    private static func locateSatellite(
        _ object: SkyObject, date: Date, observer: ObserverLocation, tracker: SatelliteTracker?
    ) throws -> ObjectLocation {
        guard let tracker else {
            return ObjectLocation(horizontal: nil, status: .unavailable, explanation: "Orbit data is not available.", nextRise: nil)
        }
        let freshness = tracker.freshness(now: date)
        guard freshness.canPredict else {
            return ObjectLocation(horizontal: nil, status: .unavailable, explanation: freshness.warning ?? "Orbit data is out of date.", nextRise: nil)
        }
        let look = try tracker.look(at: date, from: observer)
        let note = freshness.warning.map { " \($0)" } ?? ""
        if look.horizontal.altitude > 0 {
            let sunlit = look.isSunlit ? "" : " It is in Earth's shadow right now, so it can't be seen."
            return ObjectLocation(horizontal: look.horizontal, status: look.isSunlit ? .visible : .aboveHorizonInDaylight, explanation: "\(Int(look.horizontal.altitude.rounded()))° high in the \(look.horizontal.compassPoint.name).\(sunlit)\(note)", nextRise: nil)
        }
        let next = try tracker.passes(from: observer, start: date, days: 3, now: date).first?.rise
        return ObjectLocation(horizontal: look.horizontal, status: .belowHorizon, explanation: "Below the horizon right now.\(note)", nextRise: next)
    }

    /// Everything the detail page needs for an object at a simulated instant.
    public static func observe(
        _ object: SkyObject, at date: Date, observer: ObserverLocation, tracker: SatelliteTracker? = nil
    ) throws -> ObjectObservation {
        let location = try locate(object, at: date, observer: observer, tracker: tracker)
        let time = AstroTime(date)
        var j2000 = object.position, ofDate: Equatorial?
        var magnitude = object.magnitude
        var distance: Double?, diameter: Double?, illumination: Double?
        var constellation = object.constellation

        if let body = object.solarSystemBody {
            let p = try Ephemeris.position(of: body, at: time, for: observer)
            let a = try Ephemeris.appearance(of: body, at: time)
            j2000 = p.j2000
            ofDate = p.ofDate
            magnitude = a.magnitude
            distance = p.distanceAU
            diameter = a.angularDiameter
            if body != .sun { illumination = a.illuminatedFraction }
            constellation = Ephemeris.constellationAbbreviation(of: p.j2000)
        }

        let riseSet: RiseTransitSet?
        if case .satellite = object.id.kind {
            riseSet = nil
        } else {
            riseSet = try object.skyTarget.map { try RiseSet.events(for: $0, after: date, observer: observer) }
        }
        return ObjectObservation(
            location: location, j2000: j2000, ofDate: ofDate, riseTransitSet: riseSet, magnitude: magnitude,
            distanceAU: distance, angularDiameter: diameter, illuminatedFraction: illumination, constellation: constellation
        )
    }
}

extension String {
    var capitalizedFirst: String {
        prefix(1).uppercased() + dropFirst()
    }
}
