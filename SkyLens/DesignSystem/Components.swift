import SkyCatalog
import SwiftUI

/// A floating control. Keeps a 44-point target even with a smaller glyph. Inside a
/// `SkyToolbarBar` it draws no panel of its own, so the bar reads as one surface.
struct SkyIconButton: View {
    @Environment(\.theme) private var theme
    @Environment(\.isInToolbar) private var isInToolbar
    let systemImage: String
    let label: String
    var isActive = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .light))
                .foregroundStyle(isActive ? theme.accent : theme.primary)
                .frame(width: 44, height: 44)
                .frame(maxWidth: isInToolbar ? .infinity : nil)
                .background {
                    if !isInToolbar {
                        Circle().fill(.ultraThinMaterial)
                        Circle().strokeBorder(theme.stroke, lineWidth: 0.5)
                    }
                }
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(isActive ? .isSelected : [])
        .sensoryFeedback(.selection, trigger: isActive)
    }
}

private struct ToolbarKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var isInToolbar: Bool {
        get { self[ToolbarKey.self] }
        set { self[ToolbarKey.self] = newValue }
    }
}

/// One translucent bar holding the sky controls: a single surface over the sky instead
/// of a row of separate discs.
struct SkyToolbarBar<Content: View>: View {
    @Environment(\.theme) private var theme
    @ViewBuilder let content: Content

    var body: some View {
        HStack(spacing: 0) { content }
            .environment(\.isInToolbar, true)
            .padding(.horizontal, Space.xs)
            .frame(height: 54)
            .frame(maxWidth: 400)
            .skyPanel(cornerRadius: 27)
    }
}

/// The primary filled action.
struct SkyPrimaryButton: View {
    @Environment(\.theme) private var theme
    let title: String
    var isLoading = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Text(title).opacity(isLoading ? 0 : 1)
                if isLoading { ProgressView().tint(theme.background) }
            }
            .font(.headline)
            .foregroundStyle(theme.background)
            .frame(maxWidth: .infinity, minHeight: 50)
            .background(theme.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isLoading)
    }
}

struct SkySecondaryButton: View {
    @Environment(\.theme) private var theme
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(theme.secondary)
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.plain)
    }
}

/// One labelled value in a data grid. Absent values are omitted by the caller, never
/// shown as a dash, so a page only lists what is known.
struct DataRow: View {
    @Environment(\.theme) private var theme
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(Typography.caption)
                .foregroundStyle(theme.secondary)
            Spacer(minLength: Space.l)
            Text(value)
                .font(Typography.data)
                .foregroundStyle(theme.primary)
                .multilineTextAlignment(.trailing)
        }
        .accessibilityElement(children: .combine)
    }
}

struct SectionHeader: View {
    @Environment(\.theme) private var theme
    let title: String

    var body: some View {
        Text(title)
            .font(Typography.sectionTitle)
            .foregroundStyle(theme.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader)
    }
}

/// The thin ruled group used for data sections, in place of heavy cards.
struct RuledGroup<Content: View>: View {
    @Environment(\.theme) private var theme
    @ViewBuilder let content: Content

    var body: some View {
        VStack(spacing: Space.m) { content }
            .padding(.vertical, Space.m)
            .overlay(alignment: .top) { Rectangle().fill(theme.stroke).frame(height: 0.5) }
            .overlay(alignment: .bottom) { Rectangle().fill(theme.stroke).frame(height: 0.5) }
    }
}

/// Designed empty, denied and failed states share this layout.
struct StateMessage: View {
    @Environment(\.theme) private var theme
    let systemImage: String
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: Space.m) {
            Image(systemName: systemImage)
                .font(.system(size: 28, weight: .light))
                .foregroundStyle(theme.tertiary)
                .accessibilityHidden(true)
            Text(title)
                .font(.headline)
                .foregroundStyle(theme.primary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(theme.secondary)
                .multilineTextAlignment(.center)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(theme.accent)
                    .padding(.top, Space.xs)
            }
        }
        .padding(Space.xl)
        .frame(maxWidth: .infinity)
    }
}

/// A single-line object row used by search, Explore and Favorites.
struct ObjectRow: View {
    @Environment(\.theme) private var theme
    let object: SkyObject
    var subtitle: String?
    var trailing: String?

    var body: some View {
        HStack(spacing: Space.m) {
            ObjectGlyph(type: object.type)
            VStack(alignment: .leading, spacing: 2) {
                Text(object.name)
                    .font(.body)
                    .foregroundStyle(theme.primary)
                Text(subtitle ?? object.type.displayName)
                    .font(Typography.caption)
                    .foregroundStyle(theme.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: Space.s)
            if let trailing {
                Text(trailing)
                    .font(Typography.data)
                    .foregroundStyle(theme.tertiary)
            }
        }
        .padding(.vertical, Space.s)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

struct ObjectGlyph: View {
    @Environment(\.theme) private var theme
    let type: ObjectType

    private var symbol: String {
        switch type {
        case .sun: "sun.max"
        case .moon: "moon"
        case .planet: "circle.circle"
        case .star: "sparkle"
        case .constellation: "point.3.connected.trianglepath.dotted"
        case .galaxy: "hurricane"
        case .satellite: "satellite"
        case .openCluster, .globularCluster, .starCloud, .asterism, .doubleStar: "sparkles"
        default: "cloud"
        }
    }

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: 15, weight: .light))
            .foregroundStyle(theme.accent)
            .frame(width: 28, height: 28)
            .accessibilityHidden(true)
    }
}

/// A sheet's top bar: a title with a close control, since sheets over the sky drop
/// the navigation bar's chrome.
struct SheetHeader: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    let title: String

    var body: some View {
        HStack {
            Text(title)
                .font(Typography.objectTitle)
                .foregroundStyle(theme.primary)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(theme.secondary)
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("Close")
        }
    }
}

/// Bridges the two ways this app styles system lists.
struct SkyListStyle: ViewModifier {
    @Environment(\.theme) private var theme

    func body(content: Content) -> some View {
        content
            .scrollContentBackground(.hidden)
            .background(theme.background)
            .listStyle(.plain)
    }
}

extension View {
    func skyList() -> some View { modifier(SkyListStyle()) }

    /// Keeps list rows on the theme instead of the system's grouped color.
    func skyRow(_ theme: SkyTheme) -> some View {
        listRowBackground(Color.clear)
            .listRowSeparatorTint(theme.stroke)
    }
}
