import AstronomyCore
import Foundation

/// Mean orbital elements as published in an OMM or TLE.
public struct OrbitalElements: Sendable, Hashable, Codable, Identifiable {
    public let name: String
    public let noradID: Int
    public let epoch: Date
    /// Kozai mean motion in revolutions per day.
    public let meanMotion: Double
    public let eccentricity: Double
    public let inclination: Double
    public let rightAscensionOfNode: Double
    public let argumentOfPerigee: Double
    public let meanAnomaly: Double
    /// Drag term in inverse Earth radii.
    public let bstar: Double

    public var id: Int { noradID }

    public init(
        name: String, noradID: Int, epoch: Date, meanMotion: Double, eccentricity: Double,
        inclination: Double, rightAscensionOfNode: Double, argumentOfPerigee: Double,
        meanAnomaly: Double, bstar: Double
    ) {
        self.name = name
        self.noradID = noradID
        self.epoch = epoch
        self.meanMotion = meanMotion
        self.eccentricity = eccentricity
        self.inclination = inclination
        self.rightAscensionOfNode = rightAscensionOfNode
        self.argumentOfPerigee = argumentOfPerigee
        self.meanAnomaly = meanAnomaly
        self.bstar = bstar
    }

    /// Parses the two data lines of a TLE, verifying both checksums. TLEs are the
    /// exchange format of the published SGP4 test vectors.
    public init(name: String, line1: String, line2: String) throws {
        let a = Array(line1), b = Array(line2)
        guard a.count >= 68, b.count >= 68, Self.checksumIsValid(a), Self.checksumIsValid(b) else {
            throw SatelliteError.malformedElements
        }
        func field(_ s: [Character], _ r: Range<Int>) -> String {
            String(s[r]).trimmingCharacters(in: .whitespaces)
        }
        func decimalPoint(_ s: String) -> Double? {
            // "13844-3" means 0.13844e-3, with an implied leading decimal point.
            var t = s.trimmingCharacters(in: .whitespaces)
            guard !t.isEmpty else { return nil }
            var sign = 1.0
            if t.hasPrefix("-") { sign = -1; t.removeFirst() } else if t.hasPrefix("+") { t.removeFirst() }
            guard let split = t.lastIndex(where: { $0 == "-" || $0 == "+" }) else { return nil }
            guard let mantissa = Double("0.\(t[..<split])"), let exponent = Double(t[split...]) else { return nil }
            return sign * mantissa * pow(10, exponent)
        }
        guard let id = Int(field(a, 2..<7)),
              let yy = Int(field(a, 18..<20)), let day = Double(field(a, 20..<32)),
              let bstar = decimalPoint(String(a[53..<61])),
              let inc = Double(field(b, 8..<16)), let node = Double(field(b, 17..<25)),
              let ecc = Double("0." + field(b, 26..<33)),
              let arg = Double(field(b, 34..<42)), let anomaly = Double(field(b, 43..<51)),
              let motion = Double(field(b, 52..<63)) else {
            throw SatelliteError.malformedElements
        }
        // Two-digit years pivot at 1957, the year of the first satellite.
        let year = yy < 57 ? 2000 + yy : 1900 + yy
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let jan1 = calendar.date(from: DateComponents(year: year, month: 1, day: 1))!
        self.init(
            name: name, noradID: id, epoch: jan1.addingTimeInterval((day - 1) * 86_400),
            meanMotion: motion, eccentricity: ecc, inclination: inc, rightAscensionOfNode: node,
            argumentOfPerigee: arg, meanAnomaly: anomaly, bstar: bstar
        )
    }

    private static func checksumIsValid(_ line: [Character]) -> Bool {
        var sum = 0
        for c in line.prefix(68) {
            if let d = c.wholeNumberValue { sum += d } else if c == "-" { sum += 1 }
        }
        return line[68...].first?.wholeNumberValue == sum % 10
    }

    /// Minutes per orbit.
    public var periodMinutes: Double { 1440 / meanMotion }
}

public enum SatelliteError: Error, Sendable, Equatable {
    case malformedElements
    /// Orbits of 225 minutes or longer need SDP4, which SkyLens does not implement.
    case deepSpaceOrbitUnsupported
    case propagationFailed(code: Int)
    /// Elements are too old to produce a defensible prediction.
    case staleElements
}

/// A state vector in the TEME frame, the frame SGP4 works in.
public struct TEMEState: Sendable, Hashable {
    /// Kilometres from Earth's centre.
    public let position: Vec3
    /// Kilometres per second.
    public let velocity: Vec3
}

/// Near-Earth SGP4 (Hoots & Roehrich 1980), with the corrections and WGS-72 constants
/// of Vallado et al. 2006, "Revisiting Spacetrack Report #3". Verified against
/// satellite.js in SGP4Tests. Deep-space orbits throw instead of guessing, which is
/// acceptable because everything worth watching by eye is in low orbit.
public struct SGP4: Sendable {
    public let elements: OrbitalElements

    private static let earthRadius = 6378.135
    private static let mu = 398_600.8
    private static let xke = 60 / (earthRadius * earthRadius * earthRadius / mu).squareRoot()
    private static let j2 = 0.001082616
    private static let j3 = -0.00000253881
    private static let j4 = -0.00000165597
    private static let j3oj2 = j3 / j2
    private static let twoThirds = 2.0 / 3
    private static let twoPi = 2 * Double.pi

    private let no, ecco, inclo, nodeo, argpo, mo, bstar: Double
    private let isimp: Bool
    private let con41, cc1, cc4, cc5, d2, d3, d4, delmo, eta, argpdot, omgcof: Double
    private let sinmao, t2cof, t3cof, t4cof, t5cof, x1mth2, x7thm1, mdot, nodedot: Double
    private let xlcof, xmcof, nodecf, aycof: Double

    public init(_ e: OrbitalElements) throws {
        elements = e
        let d2r = Double.pi / 180
        let j2 = Self.j2, j4 = Self.j4, xke = Self.xke, er = Self.earthRadius
        let x2o3 = Self.twoThirds

        ecco = e.eccentricity
        inclo = e.inclination * d2r
        nodeo = e.rightAscensionOfNode * d2r
        argpo = e.argumentOfPerigee * d2r
        mo = e.meanAnomaly * d2r
        bstar = e.bstar
        let noKozai = e.meanMotion * Self.twoPi / 1440
        guard noKozai > 0, ecco >= 0, ecco < 1 else { throw SatelliteError.malformedElements }

        // Un-Kozai the mean motion.
        let eccsq = ecco * ecco
        let omeosq = 1 - eccsq
        let rteosq = omeosq.squareRoot()
        let cosio = cos(inclo)
        let cosio2 = cosio * cosio
        let ak = pow(xke / noKozai, x2o3)
        let d1 = 0.75 * j2 * (3 * cosio2 - 1) / (rteosq * omeosq)
        var del = d1 / (ak * ak)
        let adel = ak * (1 - del * del - del * (1.0 / 3 + 134 * del * del / 81))
        del = d1 / (adel * adel)
        let no = noKozai / (1 + del)
        self.no = no

        guard Self.twoPi / no < 225 else { throw SatelliteError.deepSpaceOrbitUnsupported }

        let ao = pow(xke / no, x2o3)
        let sinio = sin(inclo)
        let po = ao * omeosq
        let con42 = 1 - 5 * cosio2
        let con41 = -con42 - cosio2 - cosio2
        self.con41 = con41
        let posq = po * po
        let rp = ao * (1 - ecco)

        // Atmospheric model.
        var sfour = 78 / er + 1
        var qzms24 = pow((120 - 78) / er, 4)
        let perigee = (rp - 1) * er
        if perigee < 156 {
            sfour = perigee - 78
            if perigee < 98 { sfour = 20 }
            qzms24 = pow((120 - sfour) / er, 4)
            sfour = sfour / er + 1
        }
        isimp = rp < 220 / er + 1

        let pinvsq = 1 / posq
        let tsi = 1 / (ao - sfour)
        let eta = ao * ecco * tsi
        self.eta = eta
        let etasq = eta * eta
        let eeta = ecco * eta
        let psisq = abs(1 - etasq)
        let coef = qzms24 * pow(tsi, 4)
        let coef1 = coef / pow(psisq, 3.5)
        let cc2 = coef1 * no * (ao * (1 + 1.5 * etasq + eeta * (4 + etasq))
            + 0.375 * j2 * tsi / psisq * con41 * (8 + 3 * etasq * (8 + etasq)))
        let cc1 = bstar * cc2
        self.cc1 = cc1
        let cc3 = ecco > 1e-4 ? -2 * coef * tsi * Self.j3oj2 * no * sinio / ecco : 0
        let x1mth2 = 1 - cosio2
        self.x1mth2 = x1mth2
        cc4 = 2 * no * coef1 * ao * omeosq * (eta * (2 + 0.5 * etasq) + ecco * (0.5 + 2 * etasq)
            - j2 * tsi / (ao * psisq) * (-3 * con41 * (1 - 2 * eeta + etasq * (1.5 - 0.5 * eeta))
                + 0.75 * x1mth2 * (2 * etasq - eeta * (1 + etasq)) * cos(2 * argpo)))
        cc5 = 2 * coef1 * ao * omeosq * (1 + 2.75 * (etasq + eeta) + eeta * etasq)

        let cosio4 = cosio2 * cosio2
        let temp1 = 1.5 * j2 * pinvsq * no
        let temp2 = 0.5 * temp1 * j2 * pinvsq
        let temp3 = -0.46875 * j4 * pinvsq * pinvsq * no
        mdot = no + 0.5 * temp1 * rteosq * con41 + 0.0625 * temp2 * rteosq * (13 - 78 * cosio2 + 137 * cosio4)
        argpdot = -0.5 * temp1 * con42 + 0.0625 * temp2 * (7 - 114 * cosio2 + 395 * cosio4)
            + temp3 * (3 - 36 * cosio2 + 49 * cosio4)
        let xhdot1 = -temp1 * cosio
        nodedot = xhdot1 + (0.5 * temp2 * (4 - 19 * cosio2) + 2 * temp3 * (3 - 7 * cosio2)) * cosio
        omgcof = bstar * cc3 * cos(argpo)
        xmcof = ecco > 1e-4 ? -x2o3 * coef * bstar / eeta : 0
        nodecf = 3.5 * omeosq * xhdot1 * cc1
        t2cof = 1.5 * cc1
        // Guards against a division by zero at exactly 180° inclination.
        let divisor = abs(cosio + 1) > 1.5e-12 ? 1 + cosio : 1.5e-12
        xlcof = -0.25 * Self.j3oj2 * sinio * (3 + 5 * cosio) / divisor
        aycof = -0.5 * Self.j3oj2 * sinio
        delmo = pow(1 + eta * cos(mo), 3)
        sinmao = sin(mo)
        x7thm1 = 7 * cosio2 - 1

        if isimp {
            d2 = 0; d3 = 0; d4 = 0; t3cof = 0; t4cof = 0; t5cof = 0
        } else {
            let cc1sq = cc1 * cc1
            let d2 = 4 * ao * tsi * cc1sq
            let temp = d2 * tsi * cc1 / 3
            let d3 = (17 * ao + sfour) * temp
            let d4 = 0.5 * temp * ao * tsi * (221 * ao + 31 * sfour) * cc1
            self.d2 = d2
            self.d3 = d3
            self.d4 = d4
            t3cof = d2 + 2 * cc1sq
            t4cof = 0.25 * (3 * d3 + cc1 * (12 * d2 + 10 * cc1sq))
            t5cof = 0.2 * (3 * d4 + 12 * cc1 * d3 + 6 * d2 * d2 + 15 * cc1sq * (2 * d2 + cc1sq))
        }
    }

    /// Propagates to `minutes` after the element epoch.
    public func propagate(minutesSinceEpoch t: Double) throws -> TEMEState {
        let xke = Self.xke, twoPi = Self.twoPi
        let vkmpersec = Self.earthRadius * xke / 60

        let xmdf = mo + mdot * t
        let argpdf = argpo + argpdot * t
        let nodedf = nodeo + nodedot * t
        var argpm = argpdf
        var mm = xmdf
        let t2 = t * t
        var nodem = nodedf + nodecf * t2
        var tempa = 1 - cc1 * t
        var tempe = bstar * cc4 * t
        var templ = t2cof * t2

        if !isimp {
            let delomg = omgcof * t
            let delmtemp = 1 + eta * cos(xmdf)
            let delm = xmcof * (delmtemp * delmtemp * delmtemp - delmo)
            let temp = delomg + delm
            mm = xmdf + temp
            argpm = argpdf - temp
            let t3 = t2 * t
            let t4 = t3 * t
            tempa = tempa - d2 * t2 - d3 * t3 - d4 * t4
            tempe = tempe + bstar * cc5 * (sin(mm) - sinmao)
            templ = templ + t3cof * t3 + t4 * (t4cof + t * t5cof)
        }

        let am = pow(xke / no, Self.twoThirds) * tempa * tempa
        let nm = xke / pow(am, 1.5)
        var em = ecco - tempe
        guard em < 1, em >= -0.001 else { throw SatelliteError.propagationFailed(code: 1) }
        if em < 1e-6 { em = 1e-6 }
        mm += no * templ
        var xlm = mm + argpm + nodem
        nodem = nodem.truncatingRemainder(dividingBy: twoPi)
        argpm = argpm.truncatingRemainder(dividingBy: twoPi)
        xlm = xlm.truncatingRemainder(dividingBy: twoPi)
        mm = (xlm - argpm - nodem).truncatingRemainder(dividingBy: twoPi)

        let sinip = sin(inclo), cosip = cos(inclo)

        // Long-period periodics.
        let axnl = em * cos(argpm)
        let temp0 = 1 / (am * (1 - em * em))
        let aynl = em * sin(argpm) + temp0 * aycof
        let xl = mm + argpm + nodem + temp0 * xlcof * axnl

        // Kepler's equation.
        let u = (xl - nodem).truncatingRemainder(dividingBy: twoPi)
        var eo1 = u
        var tem5 = 9999.9
        var iteration = 1
        var sineo1 = 0.0, coseo1 = 0.0
        while abs(tem5) >= 1e-12, iteration <= 10 {
            sineo1 = sin(eo1)
            coseo1 = cos(eo1)
            tem5 = 1 - coseo1 * axnl - sineo1 * aynl
            tem5 = (u - aynl * coseo1 + axnl * sineo1 - eo1) / tem5
            if abs(tem5) >= 0.95 { tem5 = tem5 > 0 ? 0.95 : -0.95 }
            eo1 += tem5
            iteration += 1
        }

        // Short-period periodics.
        let ecose = axnl * coseo1 + aynl * sineo1
        let esine = axnl * sineo1 - aynl * coseo1
        let el2 = axnl * axnl + aynl * aynl
        let pl = am * (1 - el2)
        guard pl >= 0 else { throw SatelliteError.propagationFailed(code: 4) }
        let rl = am * (1 - ecose)
        let rdotl = am.squareRoot() * esine / rl
        let rvdotl = pl.squareRoot() / rl
        let betal = (1 - el2).squareRoot()
        let temp = esine / (1 + betal)
        let sinu = am / rl * (sineo1 - aynl - axnl * temp)
        let cosu = am / rl * (coseo1 - axnl + aynl * temp)
        var su = atan2(sinu, cosu)
        let sin2u = (cosu + cosu) * sinu
        let cos2u = 1 - 2 * sinu * sinu
        let temp1 = 0.5 * Self.j2 / pl
        let temp2 = temp1 / pl

        let mrt = rl * (1 - 1.5 * temp2 * betal * con41) + 0.5 * temp1 * x1mth2 * cos2u
        su -= 0.25 * temp2 * x7thm1 * sin2u
        let xnode = nodem + 1.5 * temp2 * cosip * sin2u
        let xinc = inclo + 1.5 * temp2 * cosip * sinip * cos2u
        let mvt = rdotl - nm * temp1 * x1mth2 * sin2u / xke
        let rvdot = rvdotl + nm * temp1 * (x1mth2 * cos2u + 1.5 * con41) / xke

        guard mrt >= 1 else { throw SatelliteError.propagationFailed(code: 6) }

        let sinsu = sin(su), cossu = cos(su)
        let snod = sin(xnode), cnod = cos(xnode)
        let sini = sin(xinc), cosi = cos(xinc)
        let xmx = -snod * cosi
        let xmy = cnod * cosi
        let ux = xmx * sinsu + cnod * cossu
        let uy = xmy * sinsu + snod * cossu
        let uz = sini * sinsu
        let vx = xmx * cossu - cnod * sinsu
        let vy = xmy * cossu - snod * sinsu
        let vz = sini * cossu

        let r = mrt * Self.earthRadius
        return TEMEState(
            position: Vec3(r * ux, r * uy, r * uz),
            velocity: Vec3(
                (mvt * ux + rvdot * vx) * vkmpersec,
                (mvt * uy + rvdot * vy) * vkmpersec,
                (mvt * uz + rvdot * vz) * vkmpersec
            )
        )
    }

    public func propagate(to date: Date) throws -> TEMEState {
        try propagate(minutesSinceEpoch: date.timeIntervalSince(elements.epoch) / 60)
    }
}
