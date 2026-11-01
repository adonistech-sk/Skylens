// Hand-written declarations of the Apple APIs SkyLens uses, so the real Swift compiler
// can type-check the app on a machine without an iOS SDK.
//
// What this proves: the app's own code is well-typed and uses SkyLensKit correctly.
// What this cannot prove: that these signatures match Apple's. Both sides were written
// from the same memory of the SDK, so only a real Xcode build settles that.
//
// Nothing here runs. Every body is a trap.

@_exported import Foundation
@_exported import Observation

func stub<T>() -> T { fatalError("Apple API stub") }

// MARK: - Core views

@MainActor @preconcurrency public protocol View {
    associatedtype Body: View
    @ViewBuilder @MainActor var body: Body { get }
}

extension Never: View {
    public typealias Body = Never
    public var body: Never { fatalError() }
}

public protocol PrimitiveStubView: View where Body == Never {}
extension PrimitiveStubView { public var body: Never { fatalError() } }

public struct EmptyView: PrimitiveStubView { public init() {} }
public struct AnyView: PrimitiveStubView { public init<V: View>(_ v: V) {} }
public struct TupleView<T>: PrimitiveStubView { public init(_ t: T) {} }
public struct ConditionalView<A: View, B: View>: PrimitiveStubView {}
extension Optional: View where Wrapped: View {
    public typealias Body = Never
    public var body: Never { fatalError() }
}

@resultBuilder
public struct ViewBuilder {
    public static func buildExpression<C: View>(_ c: C) -> C { c }
    public static func buildBlock() -> EmptyView { EmptyView() }
    public static func buildBlock<C: View>(_ c: C) -> C { c }
    public static func buildBlock<each C: View>(_ c: repeat each C) -> TupleView<(repeat each C)> { TupleView((repeat each c)) }
    public static func buildIf<C: View>(_ c: C?) -> C? { c }
    public static func buildEither<A: View, B: View>(first: A) -> ConditionalView<A, B> { stub() }
    public static func buildEither<A: View, B: View>(second: B) -> ConditionalView<A, B> { stub() }
    public static func buildLimitedAvailability<C: View>(_ c: C) -> AnyView { AnyView(c) }
}

// MARK: - App and scenes

public protocol Scene {}
@MainActor @preconcurrency public protocol App {
    associatedtype SceneBody: Scene
    @SceneBuilder @MainActor var body: SceneBody { get }
    @MainActor init()
}
extension App { @MainActor public static func main() {} }
@resultBuilder public struct SceneBuilder {
    public static func buildBlock<S: Scene>(_ s: S) -> S { s }
}
public struct WindowGroup<C: View>: Scene {
    public init(@ViewBuilder content: () -> C) {}
}
public enum ScenePhase { case background, inactive, active }

// MARK: - State

@propertyWrapper public struct State<Value> {
    public init(wrappedValue: Value) { self.wrappedValue = wrappedValue }
    public var wrappedValue: Value { get { stub() } nonmutating set {} }
    public var projectedValue: Binding<Value> { stub() }
}

@propertyWrapper @dynamicMemberLookup public struct Binding<Value> {
    public init(get: @escaping () -> Value, set: @escaping (Value) -> Void) {}
    public var wrappedValue: Value { get { stub() } nonmutating set {} }
    public var projectedValue: Binding<Value> { self }
    public subscript<T>(dynamicMember key: WritableKeyPath<Value, T>) -> Binding<T> { stub() }
}

@propertyWrapper @dynamicMemberLookup public struct Bindable<Value> {
    public init(wrappedValue: Value) {}
    public init(_ value: Value) {}
    public var wrappedValue: Value { stub() }
    public var projectedValue: Bindable<Value> { self }
    public subscript<T>(dynamicMember key: ReferenceWritableKeyPath<Value, T>) -> Binding<T> where Value: AnyObject { stub() }
}

public protocol EnvironmentKey {
    associatedtype Value
    static var defaultValue: Value { get }
}

public struct EnvironmentValues {
    public subscript<K: EnvironmentKey>(key: K.Type) -> K.Value { get { stub() } set {} }
    public var scenePhase: ScenePhase { stub() }
    public var dismiss: DismissAction { stub() }
    public var accessibilityReduceMotion: Bool { stub() }
    public var timeZone: TimeZone { get { stub() } set {} }
}

public struct DismissAction { public func callAsFunction() {} }

@propertyWrapper public struct Environment<Value> {
    public init(_ key: KeyPath<EnvironmentValues, Value>) {}
    public init(_ type: Value.Type) where Value: AnyObject & Observable {}
    public var wrappedValue: Value { stub() }
}

// MARK: - Colors and styles

public protocol ShapeStyle {}
public protocol Shape: View { }
public struct Color: ShapeStyle, View, Equatable, Sendable {
    public typealias Body = Never
    public var body: Never { fatalError() }
    public enum RGBColorSpace: Sendable { case sRGB, displayP3 }
    public init(_ space: RGBColorSpace, red: Double, green: Double, blue: Double, opacity: Double = 1) {}
    public func opacity(_ o: Double) -> Color { self }
    public static let white = Color(.sRGB, red: 1, green: 1, blue: 1)
    public static let clear = Color(.sRGB, red: 0, green: 0, blue: 0)
    public static let black = Color(.sRGB, red: 0, green: 0, blue: 0)
    public init(red: Double, green: Double, blue: Double) { self.init(.sRGB, red: red, green: green, blue: blue) }
}
extension ShapeStyle where Self == Color {
    public static var white: Color { Color.white }
    public static var clear: Color { Color.clear }
}
public struct Material: ShapeStyle {}
extension ShapeStyle where Self == Material { public static var ultraThinMaterial: Material { Material() } }
public struct LinearGradient: ShapeStyle, PrimitiveStubView {
    public init(colors: [Color], startPoint: UnitPoint, endPoint: UnitPoint) {}
}
public struct UnitPoint: Sendable {
    public static let top = UnitPoint(), center = UnitPoint(), bottom = UnitPoint()
}

public struct Font: Sendable {
    public enum TextStyle: Sendable { case largeTitle, title, title2, title3, headline, subheadline, body, callout, footnote, caption, caption2 }
    public enum Design: Sendable { case `default`, serif, rounded, monospaced }
    public struct Weight: Sendable, Equatable {
        public static let regular = Weight(), medium = Weight(), semibold = Weight(), bold = Weight(), light = Weight()
    }
    public static func system(_ style: TextStyle, design: Design? = nil, weight: Weight? = nil) -> Font { Font() }
    public static func system(size: CGFloat, weight: Weight? = nil, design: Design? = nil) -> Font { Font() }
    public func weight(_ w: Weight) -> Font { self }
    public func monospacedDigit() -> Font { self }
    public func monospaced() -> Font { self }
    public static let largeTitle = Font(), title = Font(), title2 = Font(), title3 = Font(), headline = Font()
    public static let subheadline = Font(), body = Font(), footnote = Font(), caption = Font(), caption2 = Font()
}

public struct Angle2 {}

// MARK: - Layout and basic views

public struct Alignment: Sendable {
    public static let center = Alignment(), leading = Alignment(), trailing = Alignment(), top = Alignment(), bottom = Alignment()
}
public enum HorizontalAlignment: Sendable { case leading, center, trailing }
public enum VerticalAlignment: Sendable { case top, center, bottom, firstTextBaseline }
public enum TextAlignment: Sendable { case leading, center, trailing }

public struct VStack<C: View>: PrimitiveStubView {
    public init(alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil, @ViewBuilder content: () -> C) {}
}
public struct HStack<C: View>: PrimitiveStubView {
    public init(alignment: VerticalAlignment = .center, spacing: CGFloat? = nil, @ViewBuilder content: () -> C) {}
}
public struct ZStack<C: View>: PrimitiveStubView {
    public init(alignment: Alignment = .center, @ViewBuilder content: () -> C) {}
}
public struct Spacer: PrimitiveStubView { public init(minLength: CGFloat? = nil) {} }
public struct Group<C: View>: PrimitiveStubView { public init(@ViewBuilder content: () -> C) {} }

public struct LocalizedStringKey: ExpressibleByStringInterpolation, Sendable {
    public struct StringInterpolation: StringInterpolationProtocol {
        public init(literalCapacity: Int, interpolationCount: Int) {}
        public mutating func appendLiteral(_ literal: String) {}
        public mutating func appendInterpolation<T>(_ value: T) {}
        public mutating func appendInterpolation<F: FormatStyle>(_ value: F.FormatInput, format: F) where F.FormatInput: Equatable, F.FormatOutput == String {}
    }
    public init(stringLiteral value: String) {}
    public init(stringInterpolation: StringInterpolation) {}
}

public struct Text: PrimitiveStubView {
    public init(_ key: LocalizedStringKey) {}
    @_disfavoredOverload public init<S: StringProtocol>(_ s: S) {}
    public func font(_ f: Font?) -> Text { self }
    public func tracking(_ t: CGFloat) -> Text { self }
}
public struct Image: PrimitiveStubView {
    public init(systemName: String) {}
    public func rotationEffectStub() {}
}
public struct Label<T: View, I: View>: PrimitiveStubView {}
extension Label where T == Text, I == Image {
    public init(_ title: LocalizedStringKey, systemImage: String) {}
    @_disfavoredOverload public init<S: StringProtocol>(_ title: S, systemImage: String) {}
}
public struct LabeledContent<L, C>: PrimitiveStubView {}
extension LabeledContent where L == Text, C == Text {
    public init<S: StringProtocol>(_ title: LocalizedStringKey, value: S) {}
}

public struct ButtonRole: Sendable { public static let destructive = ButtonRole(), cancel = ButtonRole() }
public struct Button<L: View>: PrimitiveStubView {
    public init(action: @escaping () -> Void, @ViewBuilder label: () -> L) {}
    public init(role: ButtonRole? = nil, action: @escaping () -> Void, @ViewBuilder label: () -> L) {}
}
extension Button where L == Text {
    public init(_ title: LocalizedStringKey, action: @escaping () -> Void) {}
    @_disfavoredOverload public init<S: StringProtocol>(_ title: S, action: @escaping () -> Void) {}
    public init(_ title: LocalizedStringKey, role: ButtonRole?, action: @escaping () -> Void) {}
}
extension Button where L == Label<Text, Image> {
    public init(_ title: LocalizedStringKey, systemImage: String, action: @escaping () -> Void) {}
}

public struct Link<L: View>: PrimitiveStubView {}
extension Link where L == Text { public init(_ title: LocalizedStringKey, destination: URL) {} }

public struct ShareLink<L: View>: PrimitiveStubView {
    public init<I>(item: I, @ViewBuilder label: () -> L) {}
}

public struct ProgressView: PrimitiveStubView { public init() {} }

public struct Toggle: PrimitiveStubView {
    public init(_ title: LocalizedStringKey, isOn: Binding<Bool>) {}
    @_disfavoredOverload public init<S: StringProtocol>(_ title: S, isOn: Binding<Bool>) {}
}

public struct Slider: PrimitiveStubView {
    public init<V: BinaryFloatingPoint>(value: Binding<V>, in range: ClosedRange<V>, onEditingChanged: @escaping (Bool) -> Void = { _ in }) where V.Stride: BinaryFloatingPoint {}
    public init<V: BinaryFloatingPoint>(value: Binding<V>, in range: ClosedRange<V>, step: V.Stride, onEditingChanged: @escaping (Bool) -> Void = { _ in }) where V.Stride: BinaryFloatingPoint {}
}

public struct Picker<S: Hashable, C: View>: PrimitiveStubView {
    public init(_ title: LocalizedStringKey, selection: Binding<S>, @ViewBuilder content: () -> C) {}
}

public struct DatePickerComponents: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let date = DatePickerComponents(rawValue: 1), hourAndMinute = DatePickerComponents(rawValue: 2)
}
public struct DatePicker: PrimitiveStubView {
    public init(_ title: LocalizedStringKey, selection: Binding<Date>, in range: ClosedRange<Date>, displayedComponents: DatePickerComponents) {}
}

public struct TextField: PrimitiveStubView {
    public init(_ title: LocalizedStringKey, text: Binding<String>) {}
    public init(_ title: LocalizedStringKey, text: Binding<String>, axis: Axis) {}
}
public enum Axis: Sendable { case horizontal, vertical
    public struct Set: OptionSet, Sendable {
        public let rawValue: Int
        public init(rawValue: Int) { self.rawValue = rawValue }
        public static let horizontal = Set(rawValue: 1), vertical = Set(rawValue: 2)
    }
}

public struct ScrollView<C: View>: PrimitiveStubView {
    public init(_ axes: Axis.Set = .vertical, showsIndicators: Bool = true, @ViewBuilder content: () -> C) {}
}
public struct GeometryProxy { public var size: CGSize { stub() } }
public struct GeometryReader<C: View>: PrimitiveStubView {
    public init(@ViewBuilder content: @escaping (GeometryProxy) -> C) {}
}

public struct List<C: View>: PrimitiveStubView { public init(@ViewBuilder content: () -> C) {} }
public struct Form<C: View>: PrimitiveStubView { public init(@ViewBuilder content: () -> C) {} }
public struct Section<H: View, C: View, F: View>: PrimitiveStubView {}
extension Section where H == EmptyView, F == EmptyView {
    public init(@ViewBuilder content: () -> C) {}
}
extension Section where H == Text, F == EmptyView {
    public init(_ title: LocalizedStringKey, @ViewBuilder content: () -> C) {}
    @_disfavoredOverload public init<S: StringProtocol>(_ title: S, @ViewBuilder content: () -> C) {}
}
extension Section where F == EmptyView {
    public init(@ViewBuilder content: () -> C, @ViewBuilder header: () -> H) {}
}
extension Section where H == EmptyView {
    public init(@ViewBuilder content: () -> C, @ViewBuilder footer: () -> F) {}
}
extension Section {
    public init(@ViewBuilder content: () -> C, @ViewBuilder header: () -> H, @ViewBuilder footer: () -> F) {}
}

public struct ForEach<D: RandomAccessCollection, ID: Hashable, C: View>: PrimitiveStubView {
    public init(_ data: D, id: KeyPath<D.Element, ID>, @ViewBuilder content: @escaping (D.Element) -> C) {}
    public func onDelete(perform: ((IndexSet) -> Void)?) -> some View { self }
}
extension ForEach where D.Element: Identifiable, ID == D.Element.ID {
    public init(_ data: D, @ViewBuilder content: @escaping (D.Element) -> C) {}
}

public struct NavigationStack<C: View>: PrimitiveStubView { public init(@ViewBuilder root: () -> C) {} }
public struct NavigationLink<L: View, D: View>: PrimitiveStubView {}
extension NavigationLink where D == Never {
    public init<P: Hashable>(value: P?, @ViewBuilder label: () -> L) {}
}
extension NavigationLink {
    public init(@ViewBuilder destination: () -> D, @ViewBuilder label: () -> L) {}
}
extension NavigationLink where L == Text {
    public init(_ title: LocalizedStringKey, @ViewBuilder destination: () -> D) {}
}

public struct TimelineSchedule {
    public static func periodic(from: Date, by: TimeInterval) -> TimelineSchedule { TimelineSchedule() }
}
extension Date { public static var now2: Date { Date() } }
public struct TimelineView<C: View>: PrimitiveStubView {
    public struct Context { public var date: Date { stub() } }
    public init(_ schedule: TimelineSchedule, @ViewBuilder content: @escaping (Context) -> C) {}
}

public struct Canvas: PrimitiveStubView {
    public init(renderer: @escaping (inout GraphicsContext, CGSize) -> Void) {}
}
public struct GraphicsContext {
    public var opacity: Double = 1
    public struct Shading { public static func color(_ c: Color) -> Shading { Shading() } }
    public func fill(_ path: Path, with: Shading) {}
}
public struct Path: Sendable { public init(ellipseIn rect: CGRect) {} }

public struct RoundedCornerStyle: Sendable { public static let continuous = RoundedCornerStyle(), circular = RoundedCornerStyle() }
public protocol InsettableShapeStub: Shape {}
extension InsettableShapeStub {
    public func fill<S: ShapeStyle>(_ style: S) -> some View { self }
    public func strokeBorder<S: ShapeStyle>(_ style: S, lineWidth: CGFloat = 1) -> some View { self }
}
public struct RoundedRectangle: InsettableShapeStub {
    public typealias Body = Never
    public var body: Never { fatalError() }
    public init(cornerRadius: CGFloat, style: RoundedCornerStyle = .continuous) {}
}
public struct Rectangle: InsettableShapeStub {
    public typealias Body = Never
    public var body: Never { fatalError() }
    public init() {}
}
public struct Circle: InsettableShapeStub {
    public typealias Body = Never
    public var body: Never { fatalError() }
    public init() {}
}
public struct Capsule: InsettableShapeStub {
    public typealias Body = Never
    public var body: Never { fatalError() }
    public init() {}
}

// MARK: - View modifiers

@MainActor @preconcurrency public protocol ViewModifier {
    associatedtype Body: View
    typealias Content = ModifierContent
    @ViewBuilder @MainActor func body(content: Content) -> Body
}
public struct ModifierContent: PrimitiveStubView {}

public struct AccessibilityTraits: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let isHeader = AccessibilityTraits(rawValue: 1), isSelected = AccessibilityTraits(rawValue: 2)
}
public struct AccessibilityChildBehavior: Sendable { public static let combine = AccessibilityChildBehavior(), ignore = AccessibilityChildBehavior() }

public struct AnyTransition: Sendable {
    public static let opacity = AnyTransition()
    public static func move(edge: Edge) -> AnyTransition { AnyTransition() }
    public func combined(with: AnyTransition) -> AnyTransition { self }
}
public enum Edge: Sendable { case top, bottom, leading, trailing
    public struct Set: OptionSet, Sendable {
        public let rawValue: Int
        public init(rawValue: Int) { self.rawValue = rawValue }
        public static let top = Set(rawValue: 1), bottom = Set(rawValue: 2), leading = Set(rawValue: 4), trailing = Set(rawValue: 8)
        public static let horizontal: Set = [.leading, .trailing], vertical: Set = [.top, .bottom], all: Set = [.horizontal, .vertical]
    }
}
public struct Animation: Sendable {
    public static func easeInOut(duration: Double) -> Animation { Animation() }
    public static func spring(duration: Double) -> Animation { Animation() }
}
public struct SensoryFeedback: Sendable { public static let selection = SensoryFeedback(), success = SensoryFeedback() }
public enum ColorScheme: Sendable { case dark, light }
public enum NavigationBarTitleDisplayMode { case inline, large, automatic }
public struct PresentationDetent: Hashable, Sendable {
    public static let medium = PresentationDetent(), large = PresentationDetent()
    public static func height(_ h: CGFloat) -> PresentationDetent { PresentationDetent() }
}
public struct PresentationBackgroundInteraction: Sendable {
    public static func enabled(upThrough: PresentationDetent) -> PresentationBackgroundInteraction { PresentationBackgroundInteraction() }
}
public protocol ListStyle {}
public struct PlainListStyle: ListStyle {}
extension ListStyle where Self == PlainListStyle { public static var plain: PlainListStyle { PlainListStyle() } }
public protocol ButtonStyle {}
public struct PlainButtonStyle: ButtonStyle {}
extension ButtonStyle where Self == PlainButtonStyle { public static var plain: PlainButtonStyle { PlainButtonStyle() } }
public protocol PickerStyle {}
public struct SegmentedPickerStyle: PickerStyle {}
extension PickerStyle where Self == SegmentedPickerStyle { public static var segmented: SegmentedPickerStyle { SegmentedPickerStyle() } }
public struct Visibility: Sendable { public static let hidden = Visibility(), visible = Visibility() }
public struct SearchFieldPlacement: Sendable {
    public struct NavigationBarDrawerDisplayMode: Sendable { public static let always = Self(), automatic = Self() }
    public static func navigationBarDrawer(displayMode: NavigationBarDrawerDisplayMode) -> SearchFieldPlacement { SearchFieldPlacement() }
}
public struct TextInputAutocapitalization: Sendable { public static var never: TextInputAutocapitalization { TextInputAutocapitalization() } }
public struct ToolbarItemPlacement: Sendable { public static let cancellationAction = ToolbarItemPlacement(), confirmationAction = ToolbarItemPlacement() }
public protocol ToolbarContent {}
public struct ToolbarItem<C: View>: ToolbarContent {
    public init(placement: ToolbarItemPlacement, @ViewBuilder content: () -> C) {}
}
@resultBuilder public struct ToolbarContentBuilder {
    public static func buildBlock<T: ToolbarContent>(_ t: T) -> T { t }
    public static func buildBlock<each T: ToolbarContent>(_ t: repeat each T) -> some ToolbarContent { ToolbarItem(placement: .cancellationAction) { EmptyView() } }
}

public enum UIKeyboardTypeStub: Sendable { case numbersAndPunctuation, `default` }
public struct HierarchicalStyle: ShapeStyle {}
public struct Angle: Sendable {
    public static func degrees(_ d: Double) -> Angle { Angle() }
}

extension View {
    public func tag<V: Hashable>(_ v: V) -> some View { self }
    public func foregroundStyle<S: ShapeStyle>(_ s: S) -> some View { self }
    public func font(_ f: Font?) -> some View { self }
    public func tracking(_ t: CGFloat) -> some View { self }
    public func padding(_ edges: Edge.Set = .all, _ length: CGFloat? = nil) -> some View { self }
    public func padding(_ length: CGFloat) -> some View { self }
    public func frame(width: CGFloat? = nil, height: CGFloat? = nil, alignment: Alignment = .center) -> some View { self }
    public func frame(minWidth: CGFloat? = nil, maxWidth: CGFloat? = nil, minHeight: CGFloat? = nil, maxHeight: CGFloat? = nil, alignment: Alignment = .center) -> some View { self }
    public func background<S: ShapeStyle, T: InsettableShapeStub>(_ s: S, in shape: T) -> some View { self }
    public func background<S: ShapeStyle>(_ s: S) -> some View { self }
    public func background<V: View>(alignment: Alignment = .center, @ViewBuilder content: () -> V) -> some View { self }
    public func overlay<V: View>(alignment: Alignment = .center, @ViewBuilder content: () -> V) -> some View { self }
    public func overlay<V: View>(_ v: V) -> some View { self }
    public func modifier<M: ViewModifier>(_ m: M) -> some View { self }
    public func environment<V>(_ key: WritableKeyPath<EnvironmentValues, V>, _ value: V) -> some View { self }
    public func environment<T: AnyObject & Observable>(_ object: T) -> some View { self }
    public func tint(_ c: Color?) -> some View { self }
    public func preferredColorScheme(_ c: ColorScheme?) -> some View { self }
    public func statusBarHidden(_ h: Bool = true) -> some View { self }
    public func opacity(_ o: Double) -> some View { self }
    public func shadow(color: Color = .clear, radius: CGFloat, x: CGFloat = 0, y: CGFloat = 0) -> some View { self }
    public func blendMode(_ mode: BlendMode) -> some View { self }
    public func disabled(_ d: Bool) -> some View { self }
    public func accessibilityIdentifier(_ s: String) -> some View { self }
    public func accessibilityLabel(_ s: LocalizedStringKey) -> some View { self }
    @_disfavoredOverload public func accessibilityLabel<S: StringProtocol>(_ s: S) -> some View { self }
    public func accessibilityValue<S: StringProtocol>(_ s: S) -> some View { self }
    public func accessibilityHint(_ s: LocalizedStringKey) -> some View { self }
    public func accessibilityHidden(_ h: Bool) -> some View { self }
    public func accessibilityElement(children: AccessibilityChildBehavior = .ignore) -> some View { self }
    public func accessibilityAddTraits(_ t: AccessibilityTraits) -> some View { self }
    public func buttonStyle<S: ButtonStyle>(_ s: S) -> some View { self }
    public func pickerStyle<S: PickerStyle>(_ s: S) -> some View { self }
    public func listStyle<S: ListStyle>(_ s: S) -> some View { self }
    public func multilineTextAlignment(_ a: TextAlignment) -> some View { self }
    public func lineLimit(_ n: Int?) -> some View { self }
    public func lineLimit(_ r: ClosedRange<Int>) -> some View { self }
    public func fixedSize(horizontal: Bool = true, vertical: Bool = true) -> some View { self }
    public func ignoresSafeArea() -> some View { self }
    public func allowsHitTesting(_ b: Bool) -> some View { self }
    public func contentShape<S: Shape>(_ s: S) -> some View { self }
    public func rotationEffect(_ a: Angle) -> some View { self }
    public func transition(_ t: AnyTransition) -> some View { self }
    public func animation<V: Equatable>(_ a: Animation?, value: V) -> some View { self }
    public func sensoryFeedback<T: Equatable>(_ f: SensoryFeedback, trigger: T) -> some View { self }
    public func task(priority: TaskPriority = .userInitiated, _ action: @escaping @Sendable @MainActor () async -> Void) -> some View { self }
    public func task<T: Equatable>(id: T, priority: TaskPriority = .userInitiated, _ action: @escaping @Sendable @MainActor () async -> Void) -> some View { self }
    public func onAppear(perform: (() -> Void)? = nil) -> some View { self }
    public func onDisappear(perform: (() -> Void)? = nil) -> some View { self }
    public func onChange<V: Equatable>(of v: V, initial: Bool = false, _ action: @escaping (V, V) -> Void) -> some View { self }
    public func onReceive<P: StubPublisher>(_ p: P, perform: @escaping (P.Output) -> Void) -> some View { self }
    public func navigationTitle(_ t: LocalizedStringKey) -> some View { self }
    @_disfavoredOverload public func navigationTitle<S: StringProtocol>(_ t: S) -> some View { self }
    public func navigationBarTitleDisplayMode(_ m: NavigationBarTitleDisplayMode) -> some View { self }
    public func navigationDestination<D: Hashable, C: View>(for: D.Type, @ViewBuilder destination: @escaping (D) -> C) -> some View { self }
    public func toolbar<C: ToolbarContent>(@ToolbarContentBuilder content: () -> C) -> some View { self }
    public func searchable(text: Binding<String>, placement: SearchFieldPlacement = .navigationBarDrawer(displayMode: .automatic), prompt: LocalizedStringKey? = nil) -> some View { self }
    public func autocorrectionDisabled(_ d: Bool = true) -> some View { self }
    public func textInputAutocapitalization(_ a: TextInputAutocapitalization?) -> some View { self }
    public func keyboardType(_ t: UIKeyboardTypeStub) -> some View { self }
    public func sheet<Item: Identifiable, C: View>(item: Binding<Item?>, onDismiss: (() -> Void)? = nil, @ViewBuilder content: @escaping (Item) -> C) -> some View { self }
    public func sheet<C: View>(isPresented: Binding<Bool>, onDismiss: (() -> Void)? = nil, @ViewBuilder content: @escaping () -> C) -> some View { self }
    public func fullScreenCover<C: View>(isPresented: Binding<Bool>, onDismiss: (() -> Void)? = nil, @ViewBuilder content: @escaping () -> C) -> some View { self }
    public func presentationDetents(_ d: Set<PresentationDetent>) -> some View { self }
    public func presentationBackgroundInteraction(_ i: PresentationBackgroundInteraction) -> some View { self }
    public func scrollContentBackground(_ v: Visibility) -> some View { self }
    public func listRowBackground<V: View>(_ v: V?) -> some View { self }
    public func listRowSeparatorTint(_ c: Color?) -> some View { self }
}

public struct Menu<L: View, C: View>: PrimitiveStubView {
    public init(@ViewBuilder content: () -> C, @ViewBuilder label: () -> L) {}
}

// MARK: - Combine

public protocol StubPublisher { associatedtype Output }
public struct NotificationPublisher: StubPublisher { public typealias Output = Notification }
extension NotificationCenter {
    public func publisher(for name: Notification.Name) -> NotificationPublisher { NotificationPublisher() }
}

// MARK: - UIKit

@MainActor @preconcurrency public protocol UIViewRepresentable: View where Body == Never {
    associatedtype UIViewType: UIView
    associatedtype Coordinator = Void
    typealias Context = UIViewRepresentableContext<Self>
    @MainActor func makeUIView(context: Context) -> UIViewType
    @MainActor func updateUIView(_ view: UIViewType, context: Context)
    @MainActor func makeCoordinator() -> Coordinator
}
extension UIViewRepresentable { public var body: Never { fatalError() } }
extension UIViewRepresentable where Coordinator == Void { public func makeCoordinator() {} }
public struct UIViewRepresentableContext<R: UIViewRepresentable> { public var coordinator: R.Coordinator { stub() } }

open class NSObject: Hashable {
    public init() {}
    public static func == (a: NSObject, b: NSObject) -> Bool { a === b }
    public func hash(into h: inout Hasher) {}
}

public struct Selector { public init(_ s: String) {} }

@MainActor open class UIView: NSObject {
    public override init() {}
    public init(frame: CGRect) {}
    open class var layerClass: AnyClass { UIView.self }
    public var layer: CALayer { stub() }
    public var bounds: CGRect { stub() }
    public var backgroundColor: UIColor? { get { nil } set {} }
    public var isOpaque = true
    public var contentScaleFactor: CGFloat = 1
    public var overrideUserInterfaceStyle = UIUserInterfaceStyle.dark
    public var isAccessibilityElement = false
    public var accessibilityLabel: String?
    public var accessibilityHint: String?
    public var accessibilityIdentifier: String?
    public func addGestureRecognizer(_ g: UIGestureRecognizer) {}
}
public enum UIUserInterfaceStyle { case dark, light }
open class CALayer: NSObject {}
public struct UIColor: Sendable {
    public static let white = UIColor(), clear = UIColor()
}
@MainActor public class UILabel: UIView {
    public var text: String?
    public var textColor: UIColor?
    public var textAlignment = NSTextAlignment.left
    public var numberOfLines = 1
}
public enum NSTextAlignment { case left, center, right }
@MainActor public class UIGestureRecognizer: NSObject {
    public enum State { case began, changed, ended, possible }
    public var state: State { stub() }
    public weak var delegate: UIGestureRecognizerDelegate?
    public weak var view: UIView?
    public init(target: Any?, action: Selector?) {}
    public func location(in v: UIView?) -> CGPoint { stub() }
}
@MainActor public protocol UIGestureRecognizerDelegate: AnyObject {}
@MainActor public class UIPanGestureRecognizer: UIGestureRecognizer {
    public var maximumNumberOfTouches = 1
    public func translation(in v: UIView?) -> CGPoint { stub() }
}
@MainActor public class UIPinchGestureRecognizer: UIGestureRecognizer { public var scale: CGFloat { stub() } }
@MainActor public class UITapGestureRecognizer: UIGestureRecognizer {
    public var numberOfTapsRequired = 1
    public func require(toFail other: UIGestureRecognizer) {}
}
@MainActor public class UILongPressGestureRecognizer: UIGestureRecognizer { public var minimumPressDuration = 0.5 }
public class UIImpactFeedbackGenerator {
    public enum Style { case light, medium }
    @MainActor public init(style: Style) {}
    @MainActor public func impactOccurred() {}
}
public enum UIInterfaceOrientation { case portrait, portraitUpsideDown, landscapeLeft, landscapeRight, unknown }
@MainActor public class UIScene: NSObject {
    public enum ActivationState { case foregroundActive, foregroundInactive, background, unattached }
    public var activationState: ActivationState { stub() }
}
@MainActor public class UIWindowScene: UIScene { public var interfaceOrientation: UIInterfaceOrientation { stub() } }
@MainActor public class UIApplication {
    public static let shared = UIApplication()
    public var connectedScenes: Set<UIScene> { stub() }
    public func open(_ url: URL) {}
    public static let openSettingsURLString = ""
}
@MainActor public class UIDevice {
    public static let current = UIDevice()
    public func beginGeneratingDeviceOrientationNotifications() {}
    public nonisolated static let orientationDidChangeNotification = Notification.Name("o")
}
public struct UIFont: @unchecked Sendable {
    public struct Weight { public static let regular = Weight(), medium = Weight(), semibold = Weight() }
    public static func systemFont(ofSize s: CGFloat, weight: Weight) -> UIFont { UIFont() }
}
public class UIImage {
    public init?(data: Data) {}
    public var cgImage: CGImage? { stub() }
}
extension NSAttributedString {
    public struct Key: Hashable, Sendable {
        public static let font = Key(), foregroundColor = Key(), kern = Key()
    }
}
public class NSAttributedString {
    public init(string: String, attributes: [Key: Any]?) {}
    public func size() -> CGSize { stub() }
    public func draw(at p: CGPoint) {}
}
public func UIGraphicsPushContext(_ c: CGContext) {}
public func UIGraphicsPopContext() {}

// MARK: - Core Graphics

public class CGColorSpace {}
public func CGColorSpaceCreateDeviceGray() -> CGColorSpace { stub() }
public enum CGImageAlphaInfo: UInt32 { case none = 0 }
public class CGContext {
    public init?(data: UnsafeMutableRawPointer?, width: Int, height: Int, bitsPerComponent: Int, bytesPerRow: Int, space: CGColorSpace, bitmapInfo: UInt32) {}
    public func translateBy(x: CGFloat, y: CGFloat) {}
    public func scaleBy(x: CGFloat, y: CGFloat) {}
    public var data: UnsafeMutableRawPointer? { stub() }
}
public class CGDataProvider { public var data: CFData? { stub() } }
public class CFData {}
public func CFDataGetBytePtr(_ d: CFData) -> UnsafePointer<UInt8>? { stub() }
public class CGImage {
    public var dataProvider: CGDataProvider? { stub() }
    public var width: Int { 0 }
    public var height: Int { 0 }
    public var bitsPerPixel: Int { 0 }
    public var bytesPerRow: Int { 0 }
}

// MARK: - simd

public struct simd_float3x3: Sendable {
    public init(_ a: SIMD3<Float>, _ b: SIMD3<Float>, _ c: SIMD3<Float>) {}
    public static func * (m: simd_float3x3, v: SIMD3<Float>) -> SIMD3<Float> { stub() }
}
public let matrix_identity_float3x3 = simd_float3x3(.zero, .zero, .zero)

// MARK: - QuartzCore

public func CACurrentMediaTime() -> Double { 0 }

// MARK: - Metal

public protocol MTLResource: AnyObject {}
public protocol MTLBuffer: MTLResource { var length: Int { get } }
public protocol MTLTexture: MTLResource {
    func replace(region: MTLRegion, mipmapLevel: Int, withBytes: UnsafeRawPointer, bytesPerRow: Int)
}
public struct MTLRegion {}
public func MTLRegionMake2D(_ x: Int, _ y: Int, _ w: Int, _ h: Int) -> MTLRegion { MTLRegion() }
public protocol MTLFunction: AnyObject {}
public protocol MTLLibrary: AnyObject { func makeFunction(name: String) -> MTLFunction? }
public protocol MTLRenderPipelineState: AnyObject {}
public protocol MTLDrawable: AnyObject {}
public protocol MTLCommandQueue: AnyObject { func makeCommandBuffer() -> MTLCommandBuffer? }
public protocol MTLCommandBuffer: AnyObject {
    func makeRenderCommandEncoder(descriptor: MTLRenderPassDescriptor) -> MTLRenderCommandEncoder?
    func present(_ d: MTLDrawable)
    func commit()
}
public enum MTLPrimitiveType { case point, line, triangle, triangleStrip }
public protocol MTLRenderCommandEncoder: AnyObject {
    func setRenderPipelineState(_ s: MTLRenderPipelineState)
    func setVertexBuffer(_ b: MTLBuffer?, offset: Int, index: Int)
    func setVertexBytes(_ p: UnsafeRawPointer, length: Int, index: Int)
    func setFragmentBytes(_ p: UnsafeRawPointer, length: Int, index: Int)
    func setFragmentTexture(_ t: MTLTexture?, index: Int)
    func drawPrimitives(type: MTLPrimitiveType, vertexStart: Int, vertexCount: Int)
    func drawPrimitives(type: MTLPrimitiveType, vertexStart: Int, vertexCount: Int, instanceCount: Int)
    func endEncoding()
}
public struct MTLResourceOptions: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let storageModeShared = MTLResourceOptions(rawValue: 1)
}
public protocol MTLDevice: AnyObject, Sendable {
    func makeCommandQueue() -> MTLCommandQueue?
    func makeDefaultLibrary() -> MTLLibrary?
    func makeBuffer(bytes: UnsafeRawPointer, length: Int, options: MTLResourceOptions) -> MTLBuffer?
    func makeTexture(descriptor: MTLTextureDescriptor) -> MTLTexture?
    func makeRenderPipelineState(descriptor: MTLRenderPipelineDescriptor) throws -> MTLRenderPipelineState
}
public func MTLCreateSystemDefaultDevice() -> MTLDevice? { nil }
public enum MTLPixelFormat { case bgra8Unorm_srgb, r8Unorm, bgra8Unorm }
public enum MTLBlendOperation { case add }
public enum MTLBlendFactor { case one, oneMinusSourceAlpha, sourceAlpha, zero }
public class MTLRenderPipelineColorAttachmentDescriptor {
    public var pixelFormat = MTLPixelFormat.bgra8Unorm
    public var isBlendingEnabled = false
    public var rgbBlendOperation = MTLBlendOperation.add
    public var alphaBlendOperation = MTLBlendOperation.add
    public var sourceRGBBlendFactor = MTLBlendFactor.one
    public var sourceAlphaBlendFactor = MTLBlendFactor.one
    public var destinationRGBBlendFactor = MTLBlendFactor.one
    public var destinationAlphaBlendFactor = MTLBlendFactor.one
}
public class MTLRenderPipelineColorAttachmentDescriptorArray {
    public subscript(i: Int) -> MTLRenderPipelineColorAttachmentDescriptor! { stub() }
}
public class MTLRenderPipelineDescriptor {
    public init() {}
    public var vertexFunction: MTLFunction?
    public var fragmentFunction: MTLFunction?
    public var colorAttachments: MTLRenderPipelineColorAttachmentDescriptorArray { stub() }
}
public struct MTLTextureUsage: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let shaderRead = MTLTextureUsage(rawValue: 1)
}
public class MTLTextureDescriptor {
    public class func texture2DDescriptor(pixelFormat: MTLPixelFormat, width: Int, height: Int, mipmapped: Bool) -> MTLTextureDescriptor { stub() }
    public var usage = MTLTextureUsage.shaderRead
}
public class MTLRenderPassDescriptor {}
public struct MTLClearColor { public init(red: Double, green: Double, blue: Double, alpha: Double) {} }

@MainActor public protocol MTKViewDelegate: NSObject {
    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize)
    func draw(in view: MTKView)
}
@MainActor public class MTKView: UIView {
    public init(frame: CGRect, device: MTLDevice?) { super.init() }
    public var colorPixelFormat = MTLPixelFormat.bgra8Unorm
    public var preferredFramesPerSecond = 60
    public var isPaused = false
    public var enableSetNeedsDisplay = false
    public var framebufferOnly = true
    public var autoResizeDrawable = true
    public var clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 0)
    public weak var delegate: MTKViewDelegate?
    public var currentRenderPassDescriptor: MTLRenderPassDescriptor? { stub() }
    public var currentDrawable: MTLDrawable? { stub() }
}

// MARK: - Core Motion

public struct CMRotationMatrix: Sendable {
    public var m11 = 0.0, m12 = 0.0, m13 = 0.0, m21 = 0.0, m22 = 0.0, m23 = 0.0, m31 = 0.0, m32 = 0.0, m33 = 0.0
}
public struct CMAcceleration: Sendable { public var x = 0.0, y = 0.0, z = 0.0 }
public class CMAttitude { public var rotationMatrix: CMRotationMatrix { stub() } }
public class CMDeviceMotion {
    public var attitude: CMAttitude { stub() }
    public var gravity: CMAcceleration { stub() }
    public var timestamp: TimeInterval { 0 }
}
public struct CMAttitudeReferenceFrame: OptionSet, Sendable {
    public let rawValue: UInt
    public init(rawValue: UInt) { self.rawValue = rawValue }
    public static let xArbitraryCorrectedZVertical = Self(rawValue: 1), xMagneticNorthZVertical = Self(rawValue: 2), xTrueNorthZVertical = Self(rawValue: 4)
}
public class OperationQueue: @unchecked Sendable { public init() {}; public var maxConcurrentOperationCount = 1; public var qualityOfService = QualityOfServiceStub.userInteractive }
public enum QualityOfServiceStub: Sendable { case userInteractive, userInitiated }
public class CMMotionManager {
    public init() {}
    public var isDeviceMotionAvailable: Bool { false }
    public var deviceMotionUpdateInterval = 0.0
    public class func availableAttitudeReferenceFrames() -> CMAttitudeReferenceFrame { [] }
    public func startDeviceMotionUpdates(using: CMAttitudeReferenceFrame, to: OperationQueue, withHandler: @escaping @Sendable (CMDeviceMotion?, Error?) -> Void) {}
    public func stopDeviceMotionUpdates() {}
}

// MARK: - Core Location and MapKit

public struct CLLocationCoordinate2D: Sendable {
    public var latitude = 0.0, longitude = 0.0
    public init(latitude: Double, longitude: Double) { self.latitude = latitude; self.longitude = longitude }
}
public func CLLocationCoordinate2DIsValid(_ c: CLLocationCoordinate2D) -> Bool { true }
public class CLLocation: @unchecked Sendable {
    public init(latitude: Double, longitude: Double) {}
    public var coordinate: CLLocationCoordinate2D { stub() }
    public var altitude: Double { 0 }
    public var verticalAccuracy: Double { 0 }
}
public class CLHeading {
    public var headingAccuracy: Double { 0 }
    public var magneticHeading: Double { 0 }
    public var trueHeading: Double { 0 }
}
public enum CLAuthorizationStatus { case notDetermined, restricted, denied, authorizedAlways, authorizedWhenInUse }
public let kCLLocationAccuracyKilometer = 1000.0
public protocol CLLocationManagerDelegate: AnyObject {
    func locationManagerDidChangeAuthorization(_ m: CLLocationManager)
    func locationManager(_ m: CLLocationManager, didUpdateLocations: [CLLocation])
    func locationManager(_ m: CLLocationManager, didFailWithError: Error)
    func locationManager(_ m: CLLocationManager, didUpdateHeading: CLHeading)
}
extension CLLocationManagerDelegate {
    public func locationManagerDidChangeAuthorization(_ m: CLLocationManager) {}
    public func locationManager(_ m: CLLocationManager, didUpdateLocations: [CLLocation]) {}
    public func locationManager(_ m: CLLocationManager, didFailWithError: Error) {}
    public func locationManager(_ m: CLLocationManager, didUpdateHeading: CLHeading) {}
}
public class CLLocationManager: @unchecked Sendable {
    public init() {}
    public weak var delegate: CLLocationManagerDelegate?
    public var desiredAccuracy = 0.0
    public var headingFilter = 0.0
    public var authorizationStatus: CLAuthorizationStatus { .notDetermined }
    public func requestWhenInUseAuthorization() {}
    public func requestLocation() {}
    public func startUpdatingHeading() {}
    public func stopUpdatingHeading() {}
    public class func headingAvailable() -> Bool { false }
}
public class CLPlacemark: @unchecked Sendable {
    public var locality: String? { nil }
    public var name: String? { nil }
    public var administrativeArea: String? { nil }
    public var country: String? { nil }
    public var timeZone: TimeZone? { nil }
    public var coordinate: CLLocationCoordinate2D { stub() }
}
public class CLGeocoder: @unchecked Sendable {
    public init() {}
    public func reverseGeocodeLocation(_ l: CLLocation) async throws -> [CLPlacemark] { [] }
}
public class MKMapItem {
    public var placemark: CLPlacemark { stub() }
    public var name: String? { nil }
    public var timeZone: TimeZone? { nil }
}
public class MKLocalSearch: @unchecked Sendable {
    public class Request: @unchecked Sendable {
        public init() {}
        public var naturalLanguageQuery: String?
        public var resultTypes = ResultType.address
    }
    public struct ResultType: OptionSet, Sendable {
        public let rawValue: Int
        public init(rawValue: Int) { self.rawValue = rawValue }
        public static let address = Self(rawValue: 1)
    }
    public class Response: @unchecked Sendable { public var mapItems: [MKMapItem] { [] } }
    public init(request: Request) {}
    public func start() async throws -> Response { stub() }
}
public protocol MKOverlay: AnyObject {}
public protocol MKAnnotation: AnyObject {}
open class MKOverlayRenderer: NSObject { public init(overlay: MKOverlay) {}; public var alpha: CGFloat = 1 }
public class MKTileOverlay: MKOverlay {
    public init(urlTemplate: String?) {}
    public var maximumZ = 0
    public var canReplaceMapContent = false
}
public class MKTileOverlayRenderer: MKOverlayRenderer { public init(tileOverlay: MKTileOverlay) { super.init(overlay: tileOverlay) } }
public class MKPointAnnotation: MKAnnotation {
    public init() {}
    public var title: String?
    public var coordinate = CLLocationCoordinate2D(latitude: 0, longitude: 0)
}
public struct MKCoordinateSpan { public init(latitudeDelta: Double, longitudeDelta: Double) {} }
public struct MKCoordinateRegion { public init(center: CLLocationCoordinate2D, span: MKCoordinateSpan) {} }
public enum MKOverlayLevel { case aboveRoads, aboveLabels }
@MainActor public protocol MKMapViewDelegate: AnyObject {
    func mapView(_ m: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer
}
@MainActor public class MKMapView: UIView {
    public weak var delegate: MKMapViewDelegate?
    public var annotations: [MKAnnotation] { [] }
    public func addOverlay(_ o: MKOverlay, level: MKOverlayLevel) {}
    public func setRegion(_ r: MKCoordinateRegion, animated: Bool) {}
    public func removeAnnotations(_ a: [MKAnnotation]) {}
    public func addAnnotation(_ a: MKAnnotation) {}
    public func convert(_ p: CGPoint, toCoordinateFrom: UIView?) -> CLLocationCoordinate2D { stub() }
}

// MARK: - AVFoundation

public struct CMVideoDimensions { public var width: Int32 = 0, height: Int32 = 0 }
public struct CMFormatDescription {}
public func CMVideoFormatDescriptionGetDimensions(_ d: CMFormatDescription) -> CMVideoDimensions { stub() }
public enum AVMediaType { case video }
public enum AVAuthorizationStatus { case notDetermined, restricted, denied, authorized }
public class AVCaptureDevice {
    public enum Position { case back, front }
    public struct DeviceType { public static let builtInWideAngleCamera = DeviceType() }
    public class Format {
        public var videoFieldOfView: Float { 0 }
        public var formatDescription: CMFormatDescription { stub() }
    }
    public class func `default`(_ t: DeviceType, for: AVMediaType?, position: Position) -> AVCaptureDevice? { nil }
    public class func authorizationStatus(for: AVMediaType) -> AVAuthorizationStatus { .denied }
    public class func requestAccess(for: AVMediaType) async -> Bool { false }
    public var activeFormat: Format { stub() }
}
public class AVCaptureInput {}
public class AVCaptureDeviceInput: AVCaptureInput { public init(device: AVCaptureDevice) throws {} }
public struct AVCaptureSessionPreset { public static let high = AVCaptureSessionPreset() }
public class AVCaptureSession: @unchecked Sendable {
    public init() {}
    public var inputs: [AVCaptureInput] { [] }
    public var sessionPreset = AVCaptureSessionPreset.high
    public func canAddInput(_ i: AVCaptureInput) -> Bool { true }
    public func addInput(_ i: AVCaptureInput) {}
    public func beginConfiguration() {}
    public func commitConfiguration() {}
    public func startRunning() {}
    public func stopRunning() {}
}
public enum AVLayerVideoGravity { case resizeAspectFill }
public class AVCaptureVideoPreviewLayer: CALayer {
    public var session: AVCaptureSession?
    public var videoGravity = AVLayerVideoGravity.resizeAspectFill
}

// MARK: - StoreKit

public enum VerificationResult<T: Sendable>: Sendable { case verified(T), unverified(T, Error) }
public struct RenewalInfo: Sendable { public var willAutoRenew: Bool { false } }
public struct AppStoreTransaction: Sendable {
    public enum ProductType: Sendable { case autoRenewable, consumable }
    public var productType: ProductType { .autoRenewable }
    public var productID: String { "" }
    public var expirationDate: Date? { nil }
    public var revocationDate: Date? { nil }
    public var subscriptionStatus: Product.SubscriptionInfo.Status? { get async { nil } }
    public func finish() async {}
}
public typealias Transaction = AppStoreTransaction
extension AppStoreTransaction {
    public static var updates: AsyncStream<VerificationResult<AppStoreTransaction>> { stub() }
    public static var currentEntitlements: AsyncStream<VerificationResult<AppStoreTransaction>> { stub() }
}
public struct Product: Identifiable, Sendable {
    public var id: String { "" }
    public var displayName: String { "" }
    public var displayPrice: String { "" }
    public var price: Decimal { 0 }
    public static func products(for ids: some Collection<String>) async throws -> [Product] { [] }
    public enum PurchaseResult: Sendable { case success(VerificationResult<AppStoreTransaction>), userCancelled, pending }
    public func purchase() async throws -> PurchaseResult { .userCancelled }
    public struct SubscriptionPeriod: Sendable {
        public enum Unit: Sendable { case day, week, month, year }
        public var unit: Unit { .month }
    }
    public struct SubscriptionInfo: Sendable {
        public struct RenewalState: Equatable, Sendable {
            public static let subscribed = Self(), expired = Self(), inGracePeriod = Self(), inBillingRetryPeriod = Self(), revoked = Self()
            public static func ~= (a: Self, b: Self) -> Bool { true }
        }
        public struct Status: Sendable {
            public var state: RenewalState { stub() }
            public var transaction: VerificationResult<AppStoreTransaction> { stub() }
            public var renewalInfo: VerificationResult<RenewalInfo> { stub() }
        }
        public var subscriptionPeriod: SubscriptionPeriod { stub() }
        public var status: [Status] { get async throws { [] } }
    }
    public var subscription: SubscriptionInfo? { nil }
}
public enum AppStore {
    public static func sync() async throws {}
    @MainActor public static func showManageSubscriptions(in s: UIWindowScene) async throws {}
}

// MARK: - UserNotifications

public enum UNAuthorizationStatus: Sendable { case notDetermined, denied, authorized }
public struct UNNotificationSettings: Sendable { public var authorizationStatus: UNAuthorizationStatus { .denied } }
public struct UNAuthorizationOptions: OptionSet, Sendable {
    public let rawValue: Int
    public init(rawValue: Int) { self.rawValue = rawValue }
    public static let alert = Self(rawValue: 1), sound = Self(rawValue: 2), badge = Self(rawValue: 4)
}
public class UNNotificationSound: @unchecked Sendable { public static let `default` = UNNotificationSound() }
public class UNNotificationContent: @unchecked Sendable {}
public class UNMutableNotificationContent: UNNotificationContent, @unchecked Sendable {
    public override init() {}
    public var title = "", body = ""
    public var sound: UNNotificationSound?
}
public class UNCalendarNotificationTrigger: @unchecked Sendable {
    public init(dateMatching: DateComponents, repeats: Bool) {}
}
public class UNNotificationRequest: @unchecked Sendable {
    public init(identifier: String, content: UNNotificationContent, trigger: UNCalendarNotificationTrigger?) {}
    public var identifier: String { "" }
}
public class UNUserNotificationCenter: @unchecked Sendable {
    public class func current() -> UNUserNotificationCenter { stub() }
    public func notificationSettings() async -> UNNotificationSettings { stub() }
    public func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool { false }
    public func pendingNotificationRequests() async -> [UNNotificationRequest] { [] }
    public func removePendingNotificationRequests(withIdentifiers: [String]) {}
    public func add(_ r: UNNotificationRequest) async throws {}
}

// MARK: - PhotosUI

public struct PHPickerFilter: Sendable { public static let images = PHPickerFilter() }
public struct PhotosPickerItem: Equatable, Sendable {
    public func loadTransferable<T>(type: T.Type) async throws -> T? { nil }
}
public struct PhotosPicker: PrimitiveStubView {
    public init(_ title: String, selection: Binding<PhotosPickerItem?>, matching: PHPickerFilter) {}
}

// MARK: - Canvas drawing used by ObjectHero
public struct Gradient: Sendable { public init(colors: [Color]) {} }
extension GraphicsContext.Shading {
    public static func radialGradient(_ g: Gradient, center: CGPoint, startRadius: CGFloat, endRadius: CGFloat) -> GraphicsContext.Shading { GraphicsContext.Shading() }
}
extension GraphicsContext {
    public struct ClipOptions: OptionSet, Sendable {
        public let rawValue: Int
        public init(rawValue: Int) { self.rawValue = rawValue }
        public static let inverse = ClipOptions(rawValue: 1)
    }
    public mutating func clip(to: Path, options: ClipOptions = []) {}
    public func drawLayer(content: (inout GraphicsContext) -> Void) {}
    public func stroke(_ p: Path, with: Shading, lineWidth: CGFloat) {}
    public mutating func translateBy(x: CGFloat, y: CGFloat) {}
    public mutating func rotate(by: Angle) {}
}
extension Path {
    public init(_ rect: CGRect) {}
    public init() {}
    public mutating func addArc(center: CGPoint, radius: CGFloat, startAngle: Angle, endAngle: Angle, clockwise: Bool) {}
    public mutating func closeSubpath() {}
}

public enum BlendMode: Sendable { case normal, multiply }
