import SwiftUI

/// Color tokens. Every view reads color from here rather than naming one, which is
/// what lets night vision turn the whole interface red instead of one toolbar.
struct SkyTheme: Equatable {
    var background: Color
    var surface: Color
    var stroke: Color
    var primary: Color
    var secondary: Color
    var tertiary: Color
    var accent: Color
    var warning: Color
    var isNightVision: Bool

    static let standard = SkyTheme(
        background: Color(hex: 0x050910),
        surface: Color(hex: 0x0B1424),
        stroke: Color.white.opacity(0.1),
        primary: Color(hex: 0xF4F3EE),
        secondary: Color(hex: 0xA7B5C8),
        tertiary: Color(hex: 0x7D9AB7),
        accent: Color(hex: 0xD7BD92),
        warning: Color(hex: 0xE3A857),
        isNightVision: false
    )

    /// Long-wavelength light only, so dark adaptation survives a glance at the phone.
    static let nightVision = SkyTheme(
        background: Color(hex: 0x050000),
        surface: Color(hex: 0x140202),
        stroke: Color(hex: 0xFF2A1A).opacity(0.16),
        primary: Color(hex: 0xE5341F),
        secondary: Color(hex: 0xB32716),
        tertiary: Color(hex: 0x8A1E11),
        accent: Color(hex: 0xFF3B24),
        warning: Color(hex: 0xFF3B24),
        isNightVision: true
    )
}

extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

private struct ThemeKey: EnvironmentKey {
    static let defaultValue = SkyTheme.standard
}

extension EnvironmentValues {
    var theme: SkyTheme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

enum Space {
    static let xs: CGFloat = 4
    static let s: CGFloat = 8
    static let m: CGFloat = 12
    static let l: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

/// Type scale. These are semantic SwiftUI styles, so Dynamic Type works everywhere.
enum Typography {
    /// Editorial serif for object names, the one flourish in the system.
    static let objectTitle = Font.system(.largeTitle, design: .serif).weight(.regular)
    static let sectionTitle = Font.system(.title3, design: .serif)
    static let cardTitle = Font.headline
    static let body = Font.body
    static let caption = Font.footnote
    /// Tabular figures, so columns of astronomical data align.
    static let data = Font.footnote.monospacedDigit()
    static let eyebrow = Font.caption2.weight(.semibold)
}

/// The floating surface used by every panel over the sky. A translucent material when
/// the sky should show through, and solid in night vision, because blurred sky color
/// would leak non-red light.
struct PanelBackground: ViewModifier {
    @Environment(\.theme) private var theme
    var cornerRadius: CGFloat = 18

    func body(content: Content) -> some View {
        content.background {
            let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            if theme.isNightVision {
                shape.fill(theme.surface)
            } else {
                // Dark enough under the text to stay readable over a daytime sky.
                shape.fill(.ultraThinMaterial)
                shape.fill(theme.background.opacity(0.72))
            }
            shape.strokeBorder(theme.stroke, lineWidth: 0.5)
        }
    }
}

extension View {
    func skyPanel(cornerRadius: CGFloat = 18) -> some View {
        modifier(PanelBackground(cornerRadius: cornerRadius))
    }

    /// Applies the theme to a sheet's content, which sits outside the root hierarchy.
    func themedSheet(_ theme: SkyTheme) -> some View {
        environment(\.theme, theme)
            .tint(theme.accent)
            .preferredColorScheme(.dark)
            .overlay {
                // System lists and titles keep their own white text, so night vision
                // filters the finished sheet to red instead of restyling every control.
                if theme.isNightVision {
                    Color(red: 1, green: 0.07, blue: 0)
                        .blendMode(.multiply)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                }
            }
    }
}
