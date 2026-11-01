import Foundation

/// Astronomical number formats. They are locale independent on purpose: these
/// notations are conventions of the field, not of a language.
public enum AstroFormat {
    /// "18h 36m 56s"
    public static func rightAscension(_ hours: Double) -> String {
        var total = Int((Angle.normalize360(hours * 15) / 15 * 3600).rounded())
        if total >= 86_400 { total -= 86_400 }
        return "\(total / 3600)h \(pad(total % 3600 / 60))m \(pad(total % 60))s"
    }

    /// "+38° 47′ 01″"
    public static func declination(_ degrees: Double) -> String {
        let sign = degrees < 0 ? "−" : "+"
        let total = Int((abs(degrees) * 3600).rounded())
        return "\(sign)\(total / 3600)° \(pad(total % 3600 / 60))′ \(pad(total % 60))″"
    }

    /// "212.4° SW"
    public static func azimuth(_ degrees: Double) -> String {
        let a = Angle.normalize360(degrees)
        return String(format: "%.1f° ", a) + CompassPoint(azimuth: a).rawValue
    }

    /// "+47.3°", using a true minus sign.
    public static func altitude(_ degrees: Double) -> String {
        String(format: "%@%.1f°", degrees < 0 ? "−" : "+", abs(degrees))
    }

    /// "−1.46", or "+0.03": magnitudes conventionally show a sign.
    public static func magnitude(_ value: Double) -> String {
        String(format: "%@%.2f", value < 0 ? "−" : "+", abs(value))
    }

    /// Picks units a reader can picture. Solar-system distances read in kilometres
    /// or AU, with light-minutes omitted because AU is the convention.
    public static func distance(au: Double, imperial: Bool = false) -> String {
        let km = au * kilometresPerAU
        if km < 10_000_000 {
            return imperial ? grouped(km * 0.621_371) + " mi" : grouped(km) + " km"
        }
        return String(format: "%.2f AU", au)
    }

    /// "25.0 light-years"
    public static func distance(lightYears ly: Double) -> String {
        if ly < 100 { return String(format: "%.1f light-years", ly) }
        if ly < 10_000 { return grouped(ly) + " light-years" }
        if ly < 1_000_000 { return String(format: "%.0f thousand light-years", ly / 1000) }
        return String(format: "%.1f million light-years", ly / 1_000_000)
    }

    /// Angular sizes in the unit a field-of-view comparison would use.
    public static func angularSize(degrees: Double) -> String {
        let arcminutes = degrees * 60
        if arcminutes >= 120 { return String(format: "%.1f°", degrees) }
        if arcminutes >= 2 { return String(format: "%.1f′", arcminutes) }
        return String(format: "%.1f″", arcminutes * 60)
    }

    private static func pad(_ value: Int) -> String {
        value < 10 ? "0\(value)" : "\(value)"
    }

    private static func grouped(_ value: Double) -> String {
        var digits = String(Int(value.rounded()))
        var parts: [String] = []
        while digits.count > 3 {
            parts.insert(String(digits.suffix(3)), at: 0)
            digits.removeLast(3)
        }
        parts.insert(digits, at: 0)
        return parts.joined(separator: ",")
    }
}
