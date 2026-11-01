import Foundation

/// The facts StoreKit reports, in a form that needs no StoreKit to test.
public struct EntitlementFacts: Sendable, Hashable {
    public enum RenewalState: Sendable, Hashable {
        case subscribed, expired, inGracePeriod, inBillingRetry, revoked
    }

    public let productID: String
    public let expirationDate: Date?
    public let revocationDate: Date?
    public let renewalState: RenewalState?
    public let willAutoRenew: Bool

    public init(productID: String, expirationDate: Date?, revocationDate: Date?, renewalState: RenewalState?, willAutoRenew: Bool) {
        self.productID = productID
        self.expirationDate = expirationDate
        self.revocationDate = revocationDate
        self.renewalState = renewalState
        self.willAutoRenew = willAutoRenew
    }
}

public enum SubscriptionStatus: Sendable, Hashable {
    /// Not yet determined. Treated as free, so an offline launch never blocks the sky.
    case unknown
    case free
    case active(productID: String, expires: Date?, willRenew: Bool)
    /// Payment failed but Apple still grants access for a while.
    case gracePeriod(productID: String, expires: Date?)
    /// Payment failed and access has ended, while Apple retries the charge.
    case billingRetry(productID: String)
    case expired
    case revoked

    public var hasProAccess: Bool {
        switch self {
        case .active, .gracePeriod: true
        default: false
        }
    }

    /// A problem the user can act on, or nil.
    public var notice: String? {
        switch self {
        case .gracePeriod: "There's a problem with your payment. Update it to keep SkyLens Pro."
        case .billingRetry: "Your payment didn't go through, so Pro is paused. Update it in your Apple account settings."
        default: nil
        }
    }

    /// Applies Apple's rules, in the order that makes each state unambiguous.
    public static func resolve(_ facts: EntitlementFacts?, now: Date) -> SubscriptionStatus {
        guard let f = facts else { return .free }
        if f.revocationDate != nil || f.renewalState == .revoked { return .revoked }
        switch f.renewalState {
        case .inGracePeriod:
            return .gracePeriod(productID: f.productID, expires: f.expirationDate)
        case .inBillingRetry:
            return .billingRetry(productID: f.productID)
        case .expired:
            return .expired
        case .subscribed, .revoked, nil:
            // No renewal info arrives for a transaction checked offline, and its
            // expiration date is then the only evidence.
            if let e = f.expirationDate, e <= now { return .expired }
            return .active(productID: f.productID, expires: f.expirationDate, willRenew: f.willAutoRenew)
        }
    }
}

/// What Pro adds. The sky itself is always free: real positions, planets, the naked-eye
/// stars, all 88 constellations, the Messier catalog, search, AR and basic Tonight.
public enum ProFeature: String, Sendable, CaseIterable {
    case extendedStarField
    case fullDeepSkyCatalog
    case satellitePasses
    case fullTonightPlanner
    case lightPollutionMap
    case unlimitedSkyTags

    public var title: String {
        switch self {
        case .extendedStarField: "118,000 stars"
        case .fullDeepSkyCatalog: "The full deep-sky catalog"
        case .satellitePasses: "Satellite passes and alerts"
        case .fullTonightPlanner: "Full Tonight planner"
        case .lightPollutionMap: "Dark-sky map"
        case .unlimitedSkyTags: "Unlimited Sky Tags"
        }
    }

    public var detail: String {
        switch self {
        case .extendedStarField: "See past the naked-eye limit, down to magnitude 12."
        case .fullDeepSkyCatalog: "Over 1,500 NGC and IC galaxies, clusters and nebulae."
        case .satellitePasses: "Predicted ISS and bright-satellite passes for your location."
        case .fullTonightPlanner: "Every recommendation, with cloud-based observing windows."
        case .lightPollutionMap: "Compare locations using NASA's night-lights imagery."
        case .unlimitedSkyTags: "Mark as many observing notes as you like."
        }
    }
}

public enum FeatureLimits {
    public static let freeStarMagnitude = 6.5
    public static let freeTonightRecommendations = 3
    public static let freeSkyTags = 5
}
