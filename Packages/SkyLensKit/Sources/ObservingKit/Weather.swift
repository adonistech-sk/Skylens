import AstronomyCore
import Foundation

/// Minimal HTTP seam. The app supplies a URLSession version, and tests a fake.
public protocol HTTPClient: Sendable {
    func get(_ url: String, headers: [String: String]) async throws -> HTTPResponse
}

public struct HTTPResponse: Sendable {
    public let status: Int
    public let body: Data
    public let headers: [String: String]

    public init(status: Int, body: Data, headers: [String: String] = [:]) {
        self.status = status
        self.body = body
        self.headers = headers
    }
}

public struct WeatherHour: Sendable, Hashable, Codable {
    public let date: Date
    /// Total cloud cover in percent, 0...100.
    public let cloudCover: Double
    /// By level, when the provider reports them.
    public let lowCloud: Double?
    public let midCloud: Double?
    public let highCloud: Double?
    public let fog: Double?
    public let temperature: Double?
    public let humidity: Double?
    public let windSpeed: Double?
    public let precipitation: Double?

    public init(
        date: Date, cloudCover: Double, lowCloud: Double? = nil, midCloud: Double? = nil, highCloud: Double? = nil,
        fog: Double? = nil, temperature: Double? = nil, humidity: Double? = nil, windSpeed: Double? = nil, precipitation: Double? = nil
    ) {
        self.date = date
        self.cloudCover = cloudCover
        self.lowCloud = lowCloud
        self.midCloud = midCloud
        self.highCloud = highCloud
        self.fog = fog
        self.temperature = temperature
        self.humidity = humidity
        self.windSpeed = windSpeed
        self.precipitation = precipitation
    }
}

public struct WeatherForecast: Sendable, Hashable, Codable {
    public let hours: [WeatherHour]
    public let updatedAt: Date
    public let expiresAt: Date?
    /// Required attribution, displayed wherever the data appears.
    public let attribution: String

    public init(hours: [WeatherHour], updatedAt: Date, expiresAt: Date?, attribution: String) {
        self.hours = hours
        self.updatedAt = updatedAt
        self.expiresAt = expiresAt
        self.attribution = attribution
    }

    /// Mean cloud cover across an interval, or nil if the forecast does not reach it.
    /// A partial answer would be a guess, so at least half the hours must be present.
    public func meanCloudCover(during interval: DateInterval) -> Double? {
        let inside = hours.filter { interval.contains($0.date) }
        let expected = max(1, Int((interval.duration / 3600).rounded()))
        guard !inside.isEmpty, inside.count * 2 >= expected else { return nil }
        return inside.map(\.cloudCover).reduce(0, +) / Double(inside.count)
    }

    public func hour(nearest date: Date, within tolerance: TimeInterval = 3600) -> WeatherHour? {
        hours.min { abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date)) }
            .flatMap { abs($0.date.timeIntervalSince(date)) <= tolerance ? $0 : nil }
    }
}

public enum WeatherError: Error, Sendable, Equatable {
    case notConfigured
    case badResponse(status: Int)
    case malformed
}

public protocol WeatherProvider: Sendable {
    func forecast(for location: ObserverLocation) async throws -> WeatherForecast
}

/// What Tonight shows. There is no "default weather": unavailable is a real state.
public enum WeatherState: Sendable, Hashable {
    case notConfigured
    case unavailable(reason: String)
    case available(WeatherForecast)

    public var forecast: WeatherForecast? {
        if case .available(let f) = self { return f }
        return nil
    }
}

/// MET Norway Locationforecast 2.0: global, free, CC BY 4.0, and usable commercially
/// with attribution. Their terms require an identifying User-Agent, honouring Expires,
/// and truncating coordinates to four decimals. Two decimals (about 1 km) is plenty for
/// weather, and sends the service less precise location than the app holds.
public struct MetNorwayProvider: WeatherProvider {
    public static let attribution = "Weather data: MET Norway (CC BY 4.0)"

    private let client: HTTPClient
    private let userAgent: String

    public init(client: HTTPClient, userAgent: String) {
        self.client = client
        self.userAgent = userAgent
    }

    public static func url(for location: ObserverLocation) -> String {
        let lat = String(format: "%.2f", location.latitude)
        let lon = String(format: "%.2f", location.longitude)
        return "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=\(lat)&lon=\(lon)"
    }

    public func forecast(for location: ObserverLocation) async throws -> WeatherForecast {
        let r = try await client.get(Self.url(for: location), headers: ["User-Agent": userAgent])
        guard r.status == 200 else { throw WeatherError.badResponse(status: r.status) }
        return try Self.parse(r.body, expires: r.headers["Expires"] ?? r.headers["expires"])
    }

    private struct Root: Decodable {
        struct Properties: Decodable {
            struct Meta: Decodable { let updated_at: String }
            struct Row: Decodable {
                struct RowData: Decodable {
                    struct Instant: Decodable {
                        struct Details: Decodable {
                            let cloud_area_fraction: Double?
                            let cloud_area_fraction_low: Double?
                            let cloud_area_fraction_medium: Double?
                            let cloud_area_fraction_high: Double?
                            let fog_area_fraction: Double?
                            let air_temperature: Double?
                            let relative_humidity: Double?
                            let wind_speed: Double?
                        }
                        let details: Details
                    }
                    struct Next: Decodable {
                        struct Details: Decodable { let precipitation_amount: Double? }
                        let details: Details?
                    }
                    let instant: Instant
                    let next_1_hours: Next?
                }
                let time: String
                let data: RowData
            }
            let meta: Meta
            let timeseries: [Row]
        }
        let properties: Properties
    }

    static func parse(_ data: Data, expires: String?) throws -> WeatherForecast {
        let root: Root
        do {
            root = try JSONDecoder().decode(Root.self, from: data)
        } catch {
            throw WeatherError.malformed
        }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime]
        guard let updated = iso.date(from: root.properties.meta.updated_at) else { throw WeatherError.malformed }

        var hours: [WeatherHour] = []
        for row in root.properties.timeseries {
            let d = row.data.instant.details
            // A row without cloud data is skipped, not filled in.
            guard let date = iso.date(from: row.time), let cloud = d.cloud_area_fraction else { continue }
            hours.append(WeatherHour(
                date: date, cloudCover: cloud, lowCloud: d.cloud_area_fraction_low,
                midCloud: d.cloud_area_fraction_medium, highCloud: d.cloud_area_fraction_high,
                fog: d.fog_area_fraction, temperature: d.air_temperature, humidity: d.relative_humidity,
                windSpeed: d.wind_speed, precipitation: row.data.next_1_hours?.details?.precipitation_amount
            ))
        }
        return WeatherForecast(hours: hours, updatedAt: updated, expiresAt: expires.flatMap(parseHTTPDate), attribution: attribution)
    }

    static func parseHTTPDate(_ s: String) -> Date? {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
        return f.date(from: s)
    }
}

/// Plain-language conditions. These describe the data and do not score the sky.
public enum SkyConditions {
    public static func describe(cloudCover c: Double) -> String {
        switch c {
        case ..<10: "Clear"
        case ..<30: "Mostly clear"
        case ..<60: "Partly cloudy"
        case ..<85: "Mostly cloudy"
        default: "Overcast"
        }
    }
}
