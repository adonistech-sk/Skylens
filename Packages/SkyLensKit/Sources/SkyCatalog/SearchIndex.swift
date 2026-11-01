import Foundation

/// Offline object search: exact and prefix matching over names and designations,
/// with bounded edit-distance matching so "betelguese" finds Betelgeuse.
public struct SearchIndex: Sendable {
    public struct Entry: Sendable {
        public let id: ObjectID
        public let name: String
        public let aliases: [String]
        public let category: ObjectCategory
        /// A static prior for ties, higher for objects people actually look up.
        public let popularity: Double

        public init(id: ObjectID, name: String, aliases: [String], category: ObjectCategory, popularity: Double) {
            self.id = id
            self.name = name
            self.aliases = aliases
            self.category = category
            self.popularity = popularity
        }
    }

    public struct Result: Sendable, Identifiable, Hashable {
        public let id: ObjectID
        public let name: String
        public let matchedAlias: String?
        public let category: ObjectCategory
        public let score: Double

        public init(id: ObjectID, name: String, matchedAlias: String?, category: ObjectCategory, score: Double) {
            self.id = id
            self.name = name
            self.matchedAlias = matchedAlias
            self.category = category
            self.score = score
        }
    }

    private struct Term: Sendable {
        let text: String
        let words: [String]
        let isPrimary: Bool
        let display: String
        let entry: Int32
    }

    private let entries: [Entry]
    /// Sorted by text, so prefix queries binary-search instead of scanning.
    private let terms: [Term]

    public init(entries: [Entry]) {
        self.entries = entries
        var terms: [Term] = []
        terms.reserveCapacity(entries.count * 4)
        for (i, entry) in entries.enumerated() {
            let name = Self.normalize(entry.name)
            terms.append(Term(text: name, words: name.split(separator: " ").map(String.init), isPrimary: true, display: entry.name, entry: Int32(i)))
            for alias in entry.aliases {
                let text = Self.normalize(alias)
                guard text != name else { continue }
                terms.append(Term(text: text, words: text.split(separator: " ").map(String.init), isPrimary: false, display: alias, entry: Int32(i)))
            }
        }
        terms.sort { $0.text < $1.text }
        self.terms = terms
    }

    /// Case, diacritics, spacing and common astronomical shorthand all fold to one
    /// form: "α Lyr" → "alpha lyr", "M 31" → "m31", "NGC224" → "ngc 224".
    public static func normalize(_ raw: String) -> String {
        var s = ""
        for scalar in raw.lowercased().unicodeScalars {
            if let name = greekNames[scalar] {
                s += name
            } else if let digit = superscripts[scalar] {
                s += digit
            } else {
                s.unicodeScalars.append(scalar)
            }
        }
        s = s.folding(options: [.diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        s = s.replacingOccurrences(of: "-", with: " ")
        s = s.filter { $0.isLetter || $0.isNumber || $0 == " " }
        var parts = s.split(separator: " ").map(String.init)

        // "messier 31" and "m 31" collapse to "m31".
        if parts.count == 2, parts[0] == "messier" || parts[0] == "m", Int(parts[1]) != nil {
            parts = ["m\(parts[1])"]
        }
        // "ngc224", "ic434", "hip91262", "hd172167", "hr7001" gain their space.
        if parts.count == 1 {
            for prefix in ["ngc", "ic", "hip", "hd", "hr"] where parts[0].hasPrefix(prefix) {
                let tail = parts[0].dropFirst(prefix.count)
                if !tail.isEmpty, tail.allSatisfy(\.isNumber) { parts = [prefix, String(tail)] }
            }
            // "messier31"
            if parts[0].hasPrefix("messier"), Int(parts[0].dropFirst(7)) != nil {
                parts = ["m\(parts[0].dropFirst(7))"]
            }
        }
        // Three-letter Bayer abbreviations: "alp lyr" → "alpha lyr".
        if parts.count >= 2, let full = bayerAbbreviations[parts[0]] {
            parts[0] = full
        }
        return parts.joined(separator: " ")
    }

    /// Up to `limit` results, best first. Empty for an empty query.
    public func search(_ query: String, limit: Int = 40) -> [Result] {
        let q = Self.normalize(query)
        guard !q.isEmpty else { return [] }
        var best: [Int32: (score: Double, alias: String?)] = [:]

        func consider(_ term: Term, base: Double) {
            let entry = entries[Int(term.entry)]
            let score = base + entry.popularity / 100 + (term.isPrimary ? 0.5 : 0)
            if score > (best[term.entry]?.score ?? -1) {
                best[term.entry] = (score, term.isPrimary ? nil : term.display)
            }
        }

        // Exact and prefix hits come from a binary-searched range.
        var i = lowerBound(q)
        while i < terms.count, terms[i].text.hasPrefix(q) {
            let term = terms[i]
            consider(term, base: term.text == q ? 10 : 7 - min(2, Double(term.text.count - q.count) / 10))
            i += 1
        }

        // A full scan handles word-prefix and typo matches, and is cheap at this size.
        let queryWords = q.split(separator: " ").map(String.init)
        for term in terms {
            if queryWords.count == 1 {
                if term.words.count > 1, term.words.dropFirst().contains(where: { $0.hasPrefix(q) }) {
                    consider(term, base: 5)
                } else if q.count >= 4, term.isPrimary || term.text.count < 16 {
                    let allowed = q.count >= 7 ? 2 : 1
                    for word in term.words where abs(word.count - q.count) <= allowed {
                        if let d = Self.editDistance(q, word, limit: allowed) {
                            consider(term, base: 4 - Double(d))
                            break
                        }
                    }
                }
            } else if queryWords.allSatisfy({ w in term.words.contains { $0.hasPrefix(w) } }) {
                consider(term, base: 6)
            }
        }

        let ordered = best.map { key, value -> Result in
            let entry = entries[Int(key)]
            return Result(id: entry.id, name: entry.name, matchedAlias: value.alias, category: entry.category, score: value.score)
        }
        .sorted { $0.score != $1.score ? $0.score > $1.score : $0.name < $1.name }
        return Array(ordered.prefix(limit))
    }

    private func lowerBound(_ text: String) -> Int {
        var low = 0, high = terms.count
        while low < high {
            let mid = (low + high) / 2
            if terms[mid].text < text { low = mid + 1 } else { high = mid }
        }
        return low
    }

    /// Damerau–Levenshtein distance, or nil once it must exceed `limit`.
    static func editDistance(_ a: String, _ b: String, limit: Int) -> Int? {
        let a = Array(a.utf8), b = Array(b.utf8)
        if abs(a.count - b.count) > limit { return nil }
        var previous2 = [Int](repeating: 0, count: b.count + 1)
        var previous = Array(0...b.count)
        var current = previous
        for i in 1...max(1, a.count) where !a.isEmpty {
            current[0] = i
            var rowBest = i
            if !b.isEmpty {
                for j in 1...b.count {
                    let cost = a[i - 1] == b[j - 1] ? 0 : 1
                    var value = min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
                    if i > 1, j > 1, a[i - 1] == b[j - 2], a[i - 2] == b[j - 1] {
                        value = min(value, previous2[j - 2] + 1)
                    }
                    current[j] = value
                    rowBest = min(rowBest, value)
                }
            }
            if rowBest > limit { return nil }
            swap(&previous2, &previous)
            swap(&previous, &current)
        }
        let d = previous[b.count]
        return d <= limit ? d : nil
    }

    private static let greekNames: [Unicode.Scalar: String] = [
        "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "epsilon", "ζ": "zeta",
        "η": "eta", "θ": "theta", "ι": "iota", "κ": "kappa", "λ": "lambda", "μ": "mu",
        "ν": "nu", "ξ": "xi", "ο": "omicron", "π": "pi", "ρ": "rho", "σ": "sigma",
        "τ": "tau", "υ": "upsilon", "φ": "phi", "χ": "chi", "ψ": "psi", "ω": "omega",
    ]

    private static let superscripts: [Unicode.Scalar: String] = [
        "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    ]

    private static let bayerAbbreviations: [String: String] = [
        "alp": "alpha", "alf": "alpha", "bet": "beta", "gam": "gamma", "del": "delta", "eps": "epsilon",
        "zet": "zeta", "the": "theta", "tet": "theta", "iot": "iota", "kap": "kappa", "lam": "lambda",
        "omi": "omicron", "sig": "sigma", "ups": "upsilon", "ome": "omega",
    ]
}
