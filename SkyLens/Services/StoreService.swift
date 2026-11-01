import Foundation
import Observation
import SkySession
import StoreKit

/// StoreKit 2 purchases. Prices always come from StoreKit, never from the app. The
/// rules for what a transaction means live in `SubscriptionStatus.resolve`, which is
/// tested, so this class only translates between the two.
@MainActor
@Observable
final class StoreService {
    static let monthlyID = "com.skylens.pro.monthly"
    static let annualID = "com.skylens.pro.annual"

    enum ProductState: Equatable {
        case loading
        case loaded
        case failed(String)
    }

    private(set) var products: [Product] = []
    private(set) var productState = ProductState.loading
    private(set) var isPurchasing = false
    private(set) var message: String?

    @ObservationIgnored private let model: AppModel
    @ObservationIgnored private var updates: Task<Void, Never>?

    init(model: AppModel) {
        self.model = model
    }

    deinit { updates?.cancel() }

    func start() async {
        // Transactions can arrive at any time, including renewals and Ask to Buy.
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    await self?.refreshEntitlements()
                }
            }
        }
        await refreshEntitlements()
        await loadProducts()
    }

    func loadProducts() async {
        productState = .loading
        do {
            let loaded = try await Product.products(for: [Self.monthlyID, Self.annualID])
            products = loaded.sorted { $0.price < $1.price }
            productState = products.isEmpty
                ? .failed("Subscriptions aren't available right now.")
                : .loaded
        } catch {
            productState = .failed("Subscriptions couldn't be loaded. Check your connection and try again.")
        }
    }

    func purchase(_ product: Product) async {
        isPurchasing = true
        message = nil
        defer { isPurchasing = false }
        do {
            switch try await product.purchase() {
            case .success(let result):
                guard case .verified(let transaction) = result else {
                    message = "The purchase couldn't be verified."
                    return
                }
                await transaction.finish()
                await refreshEntitlements()
            case .pending:
                message = "Your purchase is waiting for approval."
            case .userCancelled:
                break
            @unknown default:
                break
            }
        } catch {
            message = "The purchase didn't complete. You haven't been charged."
        }
    }

    func restore() async {
        isPurchasing = true
        message = nil
        defer { isPurchasing = false }
        do {
            try await AppStore.sync()
            await refreshEntitlements()
            if !model.subscription.hasProAccess {
                message = "No active subscription was found for this Apple Account."
            }
        } catch {
            message = "Restore didn't complete. Please try again."
        }
    }

    /// Reads the current state from StoreKit, using only verified data.
    func refreshEntitlements() async {
        var best: EntitlementFacts?
        for await result in Transaction.currentEntitlements {
            guard case .verified(let t) = result, t.productType == .autoRenewable else { continue }
            var renewal: EntitlementFacts.RenewalState?
            var willRenew = false
            if let status = await t.subscriptionStatus {
                renewal = Self.translate(status.state)
                if case .verified(let info) = status.renewalInfo { willRenew = info.willAutoRenew }
            }
            let facts = EntitlementFacts(
                productID: t.productID, expirationDate: t.expirationDate, revocationDate: t.revocationDate,
                renewalState: renewal, willAutoRenew: willRenew
            )
            if best == nil || (t.expirationDate ?? .distantFuture) > (best?.expirationDate ?? .distantPast) {
                best = facts
            }
        }
        if let best {
            model.setSubscription(.resolve(best, now: Date()))
            return
        }
        // currentEntitlements omits subscriptions in billing retry, so that state has
        // to be read from the subscription group or the user would see only "free".
        model.setSubscription(await Self.lapsedStatus())
    }

    private static func lapsedStatus() async -> SkySession.SubscriptionStatus {
        guard let product = try? await Product.products(for: [monthlyID]).first,
              let statuses = try? await product.subscription?.status else { return .free }
        for status in statuses {
            guard case .verified(let t) = status.transaction else { continue }
            let facts = EntitlementFacts(
                productID: t.productID, expirationDate: t.expirationDate, revocationDate: t.revocationDate,
                renewalState: translate(status.state), willAutoRenew: false
            )
            return .resolve(facts, now: Date())
        }
        return .free
    }

    private static func translate(_ state: Product.SubscriptionInfo.RenewalState) -> EntitlementFacts.RenewalState? {
        switch state {
        case .subscribed: .subscribed
        case .expired: .expired
        case .inGracePeriod: .inGracePeriod
        case .inBillingRetryPeriod: .inBillingRetry
        case .revoked: .revoked
        default: nil
        }
    }
}
