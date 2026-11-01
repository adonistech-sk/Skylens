import SkySession
import StoreKit
import SwiftUI

/// The upgrade screen. Closing is always available and always obvious, and every
/// price shown is the localized one StoreKit provides.
struct PaywallView: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    var highlighted: ProFeature?
    var closeTitle = "Not Now"
    var onClose: (() -> Void)?

    @State private var selection: Product.ID?

    private var store: StoreService { services.store }
    private var status: SkySession.SubscriptionStatus { services.model.subscription }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Space.xl) {
                VStack(alignment: .leading, spacing: Space.s) {
                    Text("SkyLens Pro")
                        .font(Typography.objectTitle)
                        .foregroundStyle(theme.primary)
                    Text("The sky stays free. Pro takes you deeper into it.")
                        .font(.subheadline)
                        .foregroundStyle(theme.secondary)
                }

                VStack(alignment: .leading, spacing: Space.m) {
                    ForEach(ProFeature.allCases, id: \.self) { feature in
                        HStack(alignment: .firstTextBaseline, spacing: Space.m) {
                            Image(systemName: "checkmark")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(theme.accent)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(feature.title)
                                    .font(.subheadline.weight(feature == highlighted ? .semibold : .regular))
                                    .foregroundStyle(theme.primary)
                                Text(feature.detail)
                                    .font(Typography.caption)
                                    .foregroundStyle(theme.secondary)
                            }
                        }
                        .accessibilityElement(children: .combine)
                    }
                }

                if status.hasProAccess {
                    subscribed
                } else {
                    plans
                }

                if let notice = status.notice {
                    Text(notice)
                        .font(Typography.caption)
                        .foregroundStyle(theme.warning)
                }
                if let message = store.message {
                    Text(message)
                        .font(Typography.caption)
                        .foregroundStyle(theme.warning)
                        .accessibilityIdentifier("storeMessage")
                }
                footer
            }
            .padding(Space.l)
        }
        .background(theme.background)
        .accessibilityIdentifier("paywall")
    }

    private var subscribed: some View {
        VStack(alignment: .leading, spacing: Space.m) {
            Text("You're subscribed. Thank you.")
                .font(.headline)
                .foregroundStyle(theme.primary)
            Button("Manage Subscription") {
                Task {
                    if let scene = UIApplicationBridge.activeScene {
                        try? await AppStore.showManageSubscriptions(in: scene)
                    }
                }
            }
            SkySecondaryButton(title: "Done") { close() }
        }
    }

    @ViewBuilder
    private var plans: some View {
        switch store.productState {
        case .loading:
            ProgressView().frame(maxWidth: .infinity).padding(Space.l)
        case .failed(let reason):
            StateMessage(
                systemImage: "wifi.slash", title: "Plans Unavailable", message: reason,
                actionTitle: "Try Again", action: { Task { await store.loadProducts() } }
            )
        case .loaded:
            VStack(spacing: Space.s) {
                ForEach(store.products) { product in
                    planRow(product)
                }
            }
            if let chosen = chosenProduct {
                SkyPrimaryButton(title: "Subscribe for \(chosen.displayPrice)", isLoading: store.isPurchasing) {
                    Task {
                        await store.purchase(chosen)
                        if status.hasProAccess { close() }
                    }
                }
                .accessibilityIdentifier("subscribeButton")
            }
        }
    }

    private var chosenProduct: Product? {
        store.products.first { $0.id == selection } ?? store.products.last
    }

    private func planRow(_ product: Product) -> some View {
        let isSelected = chosenProduct?.id == product.id
        return Button {
            selection = product.id
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(product.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(theme.primary)
                    Text(periodText(product))
                        .font(Typography.caption)
                        .foregroundStyle(theme.secondary)
                }
                Spacer()
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(isSelected ? theme.accent : theme.tertiary)
            }
            .padding(Space.m)
            .skyPanel(cornerRadius: 12)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private func periodText(_ product: Product) -> String {
        guard let period = product.subscription?.subscriptionPeriod else { return product.displayPrice }
        let unit = switch period.unit {
        case .month: "month"
        case .year: "year"
        case .week: "week"
        default: "day"
        }
        return "\(product.displayPrice) per \(unit)"
    }

    private var footer: some View {
        VStack(spacing: Space.s) {
            if !status.hasProAccess {
                SkySecondaryButton(title: closeTitle) { close() }
                    .accessibilityIdentifier("paywallClose")
            }
            Button("Restore Purchases") {
                Task { await store.restore() }
            }
            .font(Typography.caption)
            .disabled(store.isPurchasing)
            .accessibilityIdentifier("restoreButton")

            Text("Subscriptions renew automatically until cancelled. Cancel at least 24 hours before the end of the period in your Apple Account settings to avoid being charged. Payment is taken from your Apple Account.")
                .font(.caption2)
                .foregroundStyle(theme.tertiary)
                .multilineTextAlignment(.center)

            HStack(spacing: Space.l) {
                if let terms = AppLinks.termsOfUse {
                    Link("Terms of Use", destination: terms)
                }
                if let privacy = AppLinks.privacyPolicy {
                    Link("Privacy Policy", destination: privacy)
                }
            }
            .font(.caption2)
        }
    }

    private func close() {
        if let onClose { onClose() } else { dismiss() }
    }
}
