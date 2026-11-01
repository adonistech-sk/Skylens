// Types the Wasm Foundation lacks. Compiled inside the app module for type-checking
// only, because declarations there shadow the empty placeholders Foundation exports.
import Foundation

struct URLRequest {
    init(url: URL) {}
    var timeoutInterval = 60.0
    mutating func setValue(_ value: String?, forHTTPHeaderField: String) {}
}

class URLResponse {}

class HTTPURLResponse: URLResponse {
    var statusCode: Int { 0 }
    var allHeaderFields: [AnyHashable: Any] { [:] }
}

final class URLSession: @unchecked Sendable {
    static let shared = URLSession()
    func data(for request: URLRequest) async throws -> (Data, URLResponse) { fatalError() }
    func data(from url: URL) async throws -> (Data, URLResponse) { fatalError() }
}

struct URLError: Error {
    enum Code { case badURL, badServerResponse }
    init(_ code: Code) {}
}
