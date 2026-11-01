import AstronomyCore
import Foundation

/// The Hipparcos star field in a struct-of-arrays layout, sorted brightest first.
/// Sorting lets the renderer draw a magnitude limit by drawing a prefix of the
/// buffer, so changing the limit needs no GPU upload.
public struct StarCatalog: Sendable {
    public let count: Int
    public let hip: [UInt32]
    /// J2000 degrees.
    public let rightAscension: [Float]
    public let declination: [Float]
    /// Milliarcseconds per year, RA already scaled by cos δ.
    public let properMotionRA: [Float]
    public let properMotionDec: [Float]
    public let parallax: [Float]
    public let magnitude: [Float]
    /// NaN where B−V was not measured.
    public let colorIndex: [Float]

    private let indexByHip: [UInt32: Int32]

    public enum LoadError: Error, Sendable { case badHeader, truncated }

    private static let recordSize = 28

    public init(data: Data) throws {
        guard data.count >= 8, String(decoding: data.prefix(4), as: UTF8.self) == "SKS1" else {
            throw LoadError.badHeader
        }
        let n = data.withUnsafeBytes { Int($0.loadUnaligned(fromByteOffset: 4, as: UInt32.self).littleEndian) }
        guard data.count >= 8 + n * Self.recordSize else { throw LoadError.truncated }

        var hip = [UInt32](repeating: 0, count: n)
        var ra = [Float](repeating: 0, count: n)
        var dec = ra, pmra = ra, pmdec = ra, plx = ra, mag = ra, bv = ra
        data.withUnsafeBytes { raw in
            for i in 0..<n {
                let o = 8 + i * Self.recordSize
                hip[i] = UInt32(littleEndian: raw.loadUnaligned(fromByteOffset: o, as: UInt32.self))
                func float(_ at: Int) -> Float {
                    Float(bitPattern: UInt32(littleEndian: raw.loadUnaligned(fromByteOffset: o + at, as: UInt32.self)))
                }
                ra[i] = float(4)
                dec[i] = float(8)
                pmra[i] = float(12)
                pmdec[i] = float(16)
                plx[i] = float(20)
                mag[i] = Float(Int16(littleEndian: raw.loadUnaligned(fromByteOffset: o + 24, as: Int16.self))) / 100
                let color = Int16(littleEndian: raw.loadUnaligned(fromByteOffset: o + 26, as: Int16.self))
                bv[i] = color == Int16.min ? .nan : Float(color) / 1000
            }
        }
        count = n
        self.hip = hip
        rightAscension = ra
        declination = dec
        properMotionRA = pmra
        properMotionDec = pmdec
        parallax = plx
        magnitude = mag
        colorIndex = bv
        var index = [UInt32: Int32](minimumCapacity: n)
        for i in 0..<n { index[hip[i]] = Int32(i) }
        indexByHip = index
    }

    public func index(hip value: Int) -> Int? {
        guard let v = UInt32(exactly: value), let i = indexByHip[v] else { return nil }
        return Int(i)
    }

    /// How many leading entries are at or brighter than `limit`.
    public func count(brighterThan limit: Float) -> Int {
        var low = 0, high = count
        while low < high {
            let mid = (low + high) / 2
            if magnitude[mid] <= limit { low = mid + 1 } else { high = mid }
        }
        return low
    }

    /// J2000-frame unit vector at a Julian epoch, with proper motion applied. This
    /// is a linear space motion, which stays good to a fraction of an arcsecond
    /// across the supported date range for all but the very fastest stars.
    public func direction(at index: Int, yearsSinceJ2000 years: Double = 0) -> Vec3 {
        let a = Double(rightAscension[index]) * Angle.degToRad
        let d = Double(declination[index]) * Angle.degToRad
        let sa = sin(a), ca = cos(a), sd = sin(d), cd = cos(d)
        let p = Vec3(cd * ca, cd * sa, sd)
        guard years != 0 else { return p }
        let scale = years / 3_600_000 * Angle.degToRad
        let east = Vec3(-sa, ca, 0)
        let north = Vec3(-sd * ca, -sd * sa, cd)
        return (p + east * (Double(properMotionRA[index]) * scale) + north * (Double(properMotionDec[index]) * scale)).normalized
    }

    /// Interleaved x, y, z, magnitude and B−V floats for every star, ready for a GPU
    /// buffer. Runs off the main thread and only again when the date moves by years.
    public func vertexData(yearsSinceJ2000 years: Double) -> [Float] {
        var out = [Float](repeating: 0, count: count * 5)
        for i in 0..<count {
            let v = direction(at: i, yearsSinceJ2000: years)
            out[i * 5] = Float(v.x)
            out[i * 5 + 1] = Float(v.y)
            out[i * 5 + 2] = Float(v.z)
            out[i * 5 + 3] = magnitude[i]
            out[i * 5 + 4] = colorIndex[i].isNaN ? 0.6 : colorIndex[i]
        }
        return out
    }
}

/// Maps B−V to a display color through blackbody temperature.
public enum StarColor {
    /// Effective temperature in kelvin (Ballesteros 2012).
    public static func temperature(colorIndex bv: Double) -> Double {
        4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62))
    }

    /// Linear-looking sRGB in 0...1. Real stars are pale, and these values reflect
    /// that rather than the saturated blues and reds of illustrations.
    public static func rgb(colorIndex bv: Double) -> (r: Double, g: Double, b: Double) {
        let t = temperature(colorIndex: max(-0.4, min(2.0, bv))) / 100
        // Tanner Helland's fit to the Planckian locus.
        let r = t <= 66 ? 255 : 329.698727446 * pow(t - 60, -0.1332047592)
        let g = t <= 66 ? 99.4708025861 * log(t) - 161.1195681661 : 288.1221695283 * pow(t - 60, -0.0755148492)
        let b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5177312231 * log(t - 10) - 305.0447927307)
        let clamp: (Double) -> Double = { max(0, min(255, $0)) / 255 }
        return (clamp(r), clamp(g), clamp(b))
    }

    /// Plain-language color for descriptions.
    public static func name(colorIndex bv: Double) -> String {
        switch bv {
        case ..<0: "blue-white"
        case ..<0.3: "white"
        case ..<0.6: "yellow-white"
        case ..<0.85: "yellow"
        case ..<1.3: "orange"
        default: "red-orange"
        }
    }
}
