import AstronomyCore
import SkyCatalog
import SkyProjection
import SkySession
import SwiftUI
import UserData

/// Everything that can open over the sky. A single enum keeps one sheet open at a
/// time and lets the sky itself stay mounted underneath.
enum SkySheet: Identifiable {
    case explore
    case tonight
    case events
    case favorites
    case settings
    case time
    case appearance
    case detail(ObjectID)
    case tag(Horizontal)
    case paywall(ProFeature?)

    var id: String {
        switch self {
        case .explore: "explore"
        case .tonight: "tonight"
        case .events: "events"
        case .favorites: "favorites"
        case .settings: "settings"
        case .time: "time"
        case .appearance: "appearance"
        case .detail(let id): "detail-\(id.rawValue)"
        case .tag: "tag"
        case .paywall: "paywall"
        }
    }
}

struct SkyScreen: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase

    @State private var sheet: SkySheet?
    @State private var showAR = false

    private var model: AppModel { services.model }
    private var sky: SkyViewModel { services.sky }

    var body: some View {
        ZStack {
            MetalSkyView(
                sky: sky,
                isPaused: scenePhase != .active || showAR,
                onSelect: { id in
                    model.selection = id
                    if id == nil { sky.stopGuidance() }
                },
                onOpenDetail: { sheet = .detail($0) },
                onLongPress: { sheet = .tag($0) }
            )
            .ignoresSafeArea()

            VStack(spacing: Space.m) {
                SkyStatusBar(onTime: { sheet = .time })
                if let notice = compassNotice {
                    Text(notice)
                        .font(Typography.caption)
                        .foregroundStyle(theme.warning)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Space.m)
                        .padding(.vertical, Space.s)
                        .skyPanel(cornerRadius: 12)
                        .transition(.opacity)
                }
                Spacer()
                GuidanceArrow()
                if let id = model.selection, let object = model.object(id) {
                    SelectionCard(object: object, onOpen: { sheet = .detail(id) }, onClose: {
                        model.selection = nil
                        sky.stopGuidance()
                    })
                    .transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
                }
                SkyToolbar(
                    onExplore: { sheet = .explore },
                    onTonight: { sheet = .tonight },
                    onAR: { showAR = true },
                    onMore: { sheet = $0 }
                )
            }
            .padding(.horizontal, Space.l)
            .padding(.bottom, Space.s)
            .animation(reduceMotion ? nil : .spring(duration: 0.35), value: model.selection)
        }
        .background(theme.background)
        .sheet(item: $sheet) { item in
            sheetContent(item)
                .themedSheet(theme)
                .environment(services)
        }
        .fullScreenCover(isPresented: $showAR) {
            ARCameraView()
                .themedSheet(theme)
                .environment(services)
        }
        .task(id: model.location?.id) {
            await refreshLiveData()
        }
    }

    private var compassNotice: String? {
        guard sky.cameraMode == .compass else { return nil }
        return services.motion.headingQuality.message
    }

    private func refreshLiveData() async {
        await model.refreshWeather()
        await model.refreshSatellites()
        await model.refreshTonight()
        await model.refreshEvents()
        await services.notifications.schedule(model.plannedAlerts)
    }

    @ViewBuilder
    private func sheetContent(_ item: SkySheet) -> some View {
        let open: (ObjectID) -> Void = { id in
            sheet = nil
            sky.find(id, reduceMotion: reduceMotion)
        }
        let upgrade: (ProFeature?) -> Void = { sheet = .paywall($0) }

        switch item {
        case .explore:
            ExploreView(onFind: open, onUpgrade: upgrade)
        case .tonight:
            TonightView(onFind: open, onUpgrade: upgrade)
        case .events:
            EventsView(onFind: open)
        case .favorites:
            FavoritesView(onFind: open, onUpgrade: upgrade)
        case .settings:
            SettingsView(onUpgrade: upgrade)
        case .time:
            TimeTravelPanel()
                .presentationDetents([.height(360), .large])
                .presentationBackgroundInteraction(.enabled(upThrough: .height(360)))
        case .appearance:
            AppearancePanel(onUpgrade: upgrade)
                .presentationDetents([.medium, .large])
                .presentationBackgroundInteraction(.enabled(upThrough: .medium))
        case .detail(let id):
            NavigationStack {
                ObjectDetailView(id: id, onFind: open)
            }
        case .tag(let direction):
            TagEditor(direction: direction, onUpgrade: upgrade)
                .presentationDetents([.medium, .large])
        case .paywall(let feature):
            PaywallView(highlighted: feature)
        }
    }
}

/// Location and time at the top of the screen.
private struct SkyStatusBar: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    let onTime: () -> Void

    private var model: AppModel { services.model }

    var body: some View {
        HStack(spacing: Space.s) {
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                Button(action: onTime) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(model.location?.name ?? "No Location")
                            .font(Typography.caption.weight(.medium))
                            .foregroundStyle(theme.primary)
                            .lineLimit(1)
                        Text(timeText)
                            .font(Typography.data)
                            .foregroundStyle(model.isLive ? theme.primary.opacity(0.85) : theme.accent)
                    }
                    .frame(minHeight: 44, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Time and location")
                .accessibilityValue(timeText)
                .accessibilityIdentifier("timeButton")
            }
            Spacer()
            Text(services.sky.currentHeading)
                .font(Typography.data)
                .foregroundStyle(theme.primary.opacity(0.85))
                .accessibilityHidden(true)
        }
        // Plain text over the sky. The shadow keeps it readable on a daytime blue.
        .shadow(color: .black.opacity(0.5), radius: 5, y: 1)
    }

    private var timeText: String {
        let zone = model.location?.timeZone ?? .current
        let style = Date.FormatStyle(date: model.isLive ? .omitted : .abbreviated, time: .shortened, timeZone: zone)
        return model.skyDate.formatted(style)
    }
}

/// An arrow pointing toward the selected object while it is off the view centre.
private struct GuidanceArrow: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme

    var body: some View {
        if let hint = services.sky.guidance, !hint.isCentered, services.sky.guidanceTarget != nil,
           services.sky.cameraMode == .compass {
            HStack(spacing: Space.s) {
                Image(systemName: "location.north.fill")
                    .rotationEffect(.degrees(hint.bearing))
                    .foregroundStyle(theme.accent)
                Text("\(Int(hint.separation.rounded()))° away")
                    .font(Typography.data)
                    .foregroundStyle(theme.primary)
            }
            .padding(.horizontal, Space.m)
            .padding(.vertical, Space.s)
            .skyPanel(cornerRadius: 12)
            .accessibilityElement(children: .combine)
        }
    }
}

/// A compact summary of the selection. Tapping opens the full details.
private struct SelectionCard: View {
    @Environment(AppServices.self) private var services
    @Environment(\.theme) private var theme
    let object: SkyObject
    let onOpen: () -> Void
    let onClose: () -> Void

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { _ in
            HStack(spacing: Space.m) {
                Button(action: onOpen) {
                    HStack(spacing: Space.m) {
                        ObjectGlyph(type: object.type)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(object.name)
                                .font(.system(.title3, design: .serif))
                                .foregroundStyle(theme.primary)
                            Text(summary)
                                .font(Typography.caption)
                                .foregroundStyle(theme.secondary)
                                .lineLimit(3)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.up")
                            .font(.footnote)
                            .foregroundStyle(theme.tertiary)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("selectionCard")
                .accessibilityLabel("\(object.name). \(summary)")
                .accessibilityHint("Opens details")

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(theme.tertiary)
                        .frame(width: 32, height: 44)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear selection")
            }
            .padding(.horizontal, Space.m)
            .padding(.vertical, Space.s)
            .skyPanel()
        }
    }

    private var summary: String {
        guard let observer = services.model.observer,
              let location = try? Locator.locate(object, at: services.model.skyDate, observer: observer, tracker: services.sky.tracker(for: object.id)) else {
            return object.type.displayName
        }
        return location.explanation
    }
}

private struct SkyToolbar: View {
    @Environment(AppServices.self) private var services
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let onExplore: () -> Void
    let onTonight: () -> Void
    let onAR: () -> Void
    let onMore: (SkySheet) -> Void

    private var sky: SkyViewModel { services.sky }

    var body: some View {
        SkyToolbarBar {
            SkyIconButton(systemImage: "magnifyingglass", label: "Search and Explore", action: onExplore)
                .accessibilityIdentifier("exploreButton")
            SkyIconButton(systemImage: "moon.stars", label: "Tonight", action: onTonight)
                .accessibilityIdentifier("tonightButton")
            SkyIconButton(systemImage: "camera.viewfinder", label: "Augmented reality camera", action: onAR)
                .accessibilityIdentifier("arButton")
            SkyIconButton(
                systemImage: sky.cameraMode == .compass ? "location.north.circle.fill" : "location.north.circle",
                label: "Follow compass", isActive: sky.cameraMode == .compass
            ) {
                sky.toggleCompass()
            }
            .accessibilityIdentifier("compassButton")
            .disabled(!services.motion.isAvailable)
            SkyIconButton(systemImage: "scope", label: "Recenter") {
                sky.recenter(reduceMotion: reduceMotion)
            }
            .accessibilityIdentifier("recenterButton")
            Menu {
                Button("Events", systemImage: "calendar") { onMore(.events) }
                Button("Favorites", systemImage: "star") { onMore(.favorites) }
                Button("Time Travel", systemImage: "clock.arrow.2.circlepath") { onMore(.time) }
                Button("Sky Appearance", systemImage: "slider.horizontal.3") { onMore(.appearance) }
                Button("Settings", systemImage: "gearshape") { onMore(.settings) }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18, weight: .light))
                    .frame(width: 44, height: 44)
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
            }
            .accessibilityLabel("More")
            .accessibilityIdentifier("moreButton")
        }
        .frame(maxWidth: .infinity)
    }
}
