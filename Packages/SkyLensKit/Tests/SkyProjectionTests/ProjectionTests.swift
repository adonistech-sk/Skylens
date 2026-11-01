import AstronomyCore
import Foundation
import Testing
@testable import SkyProjection

private let phone = ScreenSize(width: 393, height: 852)

@Suite("Stereographic projection")
struct ProjectionTests {
    @Test func viewCentreProjectsToScreenCentre() throws {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 123, altitude: 40), screen: phone)
        let p = try #require(camera.project(Horizontal(azimuth: 123, altitude: 40).unitVector))
        #expect(abs(p.x - phone.width / 2) < 1e-6)
        #expect(abs(p.y - phone.height / 2) < 1e-6)
    }

    @Test func fieldOfViewSpansTheShortSide() throws {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 0, altitude: 0), fieldOfView: 60, screen: phone)
        // 30° to the right of due north, on the horizon, sits at the screen edge.
        let p = try #require(camera.project(Horizontal(azimuth: 30, altitude: 0).unitVector))
        #expect(abs(p.x - phone.width) < 1e-6)
    }

    /// The sky must not be mirrored. Facing south in the northern hemisphere, east
    /// is on the left and west on the right, the reverse of a map.
    @Test func skyIsNotMirrored() throws {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 180, altitude: 10), screen: phone)
        let east = try #require(camera.project(Horizontal(azimuth: 150, altitude: 10).unitVector))
        let west = try #require(camera.project(Horizontal(azimuth: 210, altitude: 10).unitVector))
        #expect(east.x < phone.width / 2, "east is left when facing south")
        #expect(west.x > phone.width / 2)
    }

    @Test func zenithIsUp() throws {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 45, altitude: 20), screen: phone)
        let higher = try #require(camera.project(Horizontal(azimuth: 45, altitude: 40).unitVector))
        let lower = try #require(camera.project(Horizontal(azimuth: 45, altitude: 0).unitVector))
        #expect(higher.y < phone.height / 2)
        #expect(lower.y > phone.height / 2)
    }

    @Test(arguments: [(0.0, 0.0), (90, 30), (200, 60), (359, -40), (10, 85)])
    func unprojectInvertsProject(az: Double, alt: Double) throws {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: az + 7, altitude: alt / 2), fieldOfView: 90, screen: phone)
        let v = Horizontal(azimuth: az, altitude: alt).unitVector
        let p = try #require(camera.project(v))
        #expect(camera.unproject(p).angle(to: v) < 1e-7)
    }

    /// Conformality is the reason for choosing this projection: a small circle far
    /// from the view axis must remain round, so Orion keeps its shape at the edge.
    @Test func shapesAreConformalAtTheEdgeOfTheField() throws {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 0, altitude: 0), fieldOfView: 120, screen: phone)
        let centre = Horizontal(azimuth: 50, altitude: 30)
        let east = Horizontal(azimuth: 50 + 0.5 / cos(30 * Angle.degToRad), altitude: 30)
        let north = Horizontal(azimuth: 50, altitude: 30.5)
        let c = try #require(camera.project(centre.unitVector))
        let a = try #require(camera.project(east.unitVector))
        let b = try #require(camera.project(north.unitVector))
        #expect(abs(c.distance(to: a) / c.distance(to: b) - 1) < 0.01)
    }

    @Test func antipodeHasNoImage() {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 0, altitude: 0), screen: phone)
        #expect(camera.project(Horizontal(azimuth: 180, altitude: 0).unitVector) == nil)
    }

    @Test func offScreenPointsAreRejected() {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 0, altitude: 0), fieldOfView: 40, screen: phone)
        #expect(camera.contains(Horizontal(azimuth: 5, altitude: 5).unitVector))
        #expect(!camera.contains(Horizontal(azimuth: 120, altitude: 5).unitVector))
    }

    @Test func viewAndUpDirections() {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 90, altitude: 0), screen: phone)
        #expect(camera.viewDirection.angle(to: Horizontal(azimuth: 90, altitude: 0).unitVector) < 1e-9)
        #expect(camera.upDirection.angle(to: Vec3(0, 0, 1)) < 1e-9)
    }

    @Test(arguments: [(0.0, 90.0), (120, 90), (0, -90)])
    func poleOrientationsStayValid(az: Double, alt: Double) {
        let m = SkyCamera.orientation(azimuth: az, altitude: alt)
        #expect(abs(m.r0.length - 1) < 1e-9 && abs(m.r1.length - 1) < 1e-9 && abs(m.r0.dot(m.r1)) < 1e-9)
        #expect(abs((m.r0.cross(m.r1)).dot(m.r2) - 1) < 1e-9, "must stay right-handed")
    }
}

@Suite("Touch exploration")
struct ManualViewTests {
    /// The star under the finger should follow the finger.
    @Test func dragKeepsTheSkyUnderTheFinger() throws {
        var view = ManualView(azimuth: 180, altitude: 20)
        let camera = SkyCamera(orientation: view.orientation, fieldOfView: 40, screen: phone)
        let direction = camera.unproject(ScreenPoint(x: 200, y: 400))
        view.drag(dx: 30, dy: 0, pointsPerDegree: camera.pointsPerDegree)
        let after = SkyCamera(orientation: view.orientation, fieldOfView: 40, screen: phone)
        let moved = try #require(after.project(direction))
        #expect(abs(moved.x - 230) < 3)
    }

    @Test func draggingDownLooksUp() {
        var view = ManualView(azimuth: 0, altitude: 20)
        view.drag(dx: 0, dy: 50, pointsPerDegree: 10)
        #expect(view.altitude == 25)
    }

    @Test func altitudeClampsAtTheZenithRatherThanFlipping() {
        var view = ManualView(azimuth: 0, altitude: 85)
        view.drag(dx: 0, dy: 500, pointsPerDegree: 1)
        #expect(view.altitude == 89.9)
        view.drag(dx: 0, dy: -5000, pointsPerDegree: 1)
        #expect(view.altitude == -89.9)
    }

    @Test func azimuthWraps() {
        var view = ManualView(azimuth: 359, altitude: 0)
        view.drag(dx: -20, dy: 0, pointsPerDegree: 10)
        #expect(abs(view.azimuth - 1) < 1e-9)
    }

    @Test func flightsTakeTheShortWayAround() {
        let a = ViewAnimation(from: ManualView(azimuth: 350, altitude: 0), to: ManualView(azimuth: 10, altitude: 0), fromFOV: 60, toFOV: 60, duration: 1)
        #expect(abs(a.value(at: 0.5).view.azimuth - 0) < 1e-6 || abs(a.value(at: 0.5).view.azimuth - 360) < 1e-6)
    }

    @Test func flightsEndExactlyOnTarget() {
        let a = ViewAnimation(from: ManualView(azimuth: 10, altitude: 5), to: ManualView(azimuth: 200, altitude: 70), fromFOV: 80, toFOV: 20, duration: 1)
        let end = a.value(at: 5)
        #expect(end.view.azimuth == 200 && end.view.altitude == 70)
        #expect(abs(end.fov - 20) < 1e-9)
        #expect(abs(a.value(at: 0).fov - 80) < 1e-9)
    }

    @Test func reduceMotionMakesFlightsInstant() {
        #expect(ViewAnimation.duration(angle: 90, reduceMotion: true) == 0)
        let a = ViewAnimation(from: ManualView(), to: ManualView(azimuth: 10, altitude: 10), fromFOV: 60, toFOV: 30, duration: 0)
        #expect(a.value(at: 0).view.azimuth == 10)
    }
}

/// Simulates Core Motion from first principles: builds what the device would report
/// when held in a known pose, then checks the sky lands where a person expects.
@Suite("Device attitude")
struct AttitudeTests {
    /// Device axes in the reference (horizon) frame for a phone held upright in
    /// portrait with the screen facing the user and the back camera facing `azimuth`.
    private func uprightPose(facing azimuth: Double, tilt: Double = 0) -> (referenceToDevice: Mat3, gravity: Vec3) {
        let back = Horizontal(azimuth: azimuth, altitude: tilt).unitVector
        let zenith = Vec3(0, 0, 1)
        let right = back.cross(zenith).normalized
        let top = right.cross(back).normalized
        let out = -back
        let m = Mat3(right, top, out)
        return (m, -(m * zenith))
    }

    @Test(arguments: [0.0, 73, 180, 271])
    func backCameraLooksWhereThePhonePoints(azimuth: Double) {
        let pose = uprightPose(facing: azimuth, tilt: 25)
        var solver = AttitudeSolver()
        let r = solver.referenceToDevice(matrix: pose.referenceToDevice, gravity: pose.gravity)
        let o = AttitudeSolver.cameraOrientation(referenceToDevice: r, interface: .portrait)
        let camera = SkyCamera(orientation: o, screen: phone)
        let target = Horizontal(azimuth: azimuth, altitude: 25)
        #expect(camera.viewDirection.angle(to: target.unitVector) < 1e-6)
    }

    @Test func detectsThatTheMatrixConventionIsTheOtherWayRound() {
        let pose = uprightPose(facing: 20, tilt: 30)
        var solver = AttitudeSolver()
        let r = solver.referenceToDevice(matrix: pose.referenceToDevice.transposed, gravity: pose.gravity)
        #expect(solver.hasResolvedConvention)
        #expect(r == pose.referenceToDevice)
    }

    @Test func acceptsTheExpectedConventionUnchanged() {
        let pose = uprightPose(facing: 20, tilt: 30)
        var solver = AttitudeSolver()
        #expect(solver.referenceToDevice(matrix: pose.referenceToDevice, gravity: pose.gravity) == pose.referenceToDevice)
        #expect(solver.hasResolvedConvention)
    }

    /// Flat on a table the two candidates agree, so a decision there would be a guess.
    @Test func staysUndecidedWhileFlat() {
        var solver = AttitudeSolver()
        let yaw = Mat3.rotation(axis: Vec3(0, 0, 1), degrees: 40)
        _ = solver.referenceToDevice(matrix: yaw, gravity: Vec3(0, 0, -1))
        #expect(!solver.hasResolvedConvention)
    }

    /// Some poses are genuinely ambiguous: facing near due east with moderate tilt,
    /// both conventions predict almost the same gravity vector. The solver must wait
    /// for a pose that discriminates rather than decide from a coincidence.
    @Test func staysUndecidedInADegeneratePose() {
        let pose = uprightPose(facing: 100, tilt: 30)
        var solver = AttitudeSolver()
        _ = solver.referenceToDevice(matrix: pose.referenceToDevice, gravity: pose.gravity)
        #expect(!solver.hasResolvedConvention)
    }

    @Test func holdingTheResolvedConventionThroughAFlatPose() {
        let pose = uprightPose(facing: 20, tilt: 30)
        var solver = AttitudeSolver()
        _ = solver.referenceToDevice(matrix: pose.referenceToDevice.transposed, gravity: pose.gravity)
        let yaw = Mat3.rotation(axis: Vec3(0, 0, 1), degrees: 40)
        #expect(solver.referenceToDevice(matrix: yaw, gravity: Vec3(0, 0, -1)) == yaw.transposed)
    }

    /// Turning a landscape phone must keep the zenith toward the top of the interface.
    @Test(arguments: [InterfaceRotation.landscapeLeft, .landscapeRight, .portraitUpsideDown])
    func interfaceRotationKeepsTheViewDirection(rotation: InterfaceRotation) {
        let pose = uprightPose(facing: 45, tilt: 10)
        let o = AttitudeSolver.cameraOrientation(referenceToDevice: pose.referenceToDevice, interface: rotation)
        let camera = SkyCamera(orientation: o, screen: phone)
        #expect(camera.viewDirection.angle(to: Horizontal(azimuth: 45, altitude: 10).unitVector) < 1e-6)
    }

    @Test func landscapeInterfaceIsRotatedAQuarterTurn() {
        let pose = uprightPose(facing: 45, tilt: 10)
        let p = AttitudeSolver.cameraOrientation(referenceToDevice: pose.referenceToDevice, interface: .portrait)
        let l = AttitudeSolver.cameraOrientation(referenceToDevice: pose.referenceToDevice, interface: .landscapeLeft)
        let up = SkyCamera(orientation: p, screen: phone).upDirection
        let side = SkyCamera(orientation: l, screen: phone).upDirection
        #expect(abs(up.angle(to: side) - 90) < 1e-6)
    }

    @Test func filterConvergesAndStaysOrthonormal() {
        var f = AttitudeFilter(timeConstant: 0.1)
        let target = SkyCamera.orientation(azimuth: 10, altitude: 10)
        _ = f.filter(SkyCamera.orientation(azimuth: 0, altitude: 10), dt: 0.016)
        var out = target
        for _ in 0..<120 { out = f.filter(target, dt: 0.016) }
        #expect(abs(out.r0.dot(target.r0) - 1) < 1e-6)
        #expect(abs(out.r0.dot(out.r1)) < 1e-9)
        #expect(abs(out.r2.length - 1) < 1e-9)
    }

    @Test func filterReducesJitter() {
        var f = AttitudeFilter(timeConstant: 0.15)
        let base = SkyCamera.orientation(azimuth: 100, altitude: 30)
        _ = f.filter(base, dt: 0.016)
        let noisy = SkyCamera.orientation(azimuth: 101, altitude: 30)
        let filtered = f.filter(noisy, dt: 0.016)
        let raw = base.r0.dot(noisy.r0)
        #expect(base.r0.dot(filtered.r0) > raw)
    }

    @Test func filterSnapsOnLargeJumps() {
        var f = AttitudeFilter()
        _ = f.filter(SkyCamera.orientation(azimuth: 0, altitude: 0), dt: 0.016)
        let far = SkyCamera.orientation(azimuth: 120, altitude: 0)
        #expect(f.filter(far, dt: 0.016) == far)
    }

    /// A compass reading 10° east of truth should be corrected by turning the sky.
    @Test func compassCorrectionTurnsAboutTheZenith() {
        let o = SkyCamera.orientation(azimuth: 100, altitude: 20)
        let corrected = CompassCorrection(degrees: 10).apply(to: o)
        let camera = SkyCamera(orientation: corrected, screen: phone)
        let h = Horizontal(unitVector: camera.viewDirection)
        #expect(abs(h.altitude - 20) < 1e-6, "must not change altitude")
        #expect(abs(abs(Angle.normalize180(h.azimuth - 100)) - 10) < 1e-6)
    }

    @Test func headingQualityNeverClaimsMoreThanTheSensorDoes() {
        #expect(HeadingQuality(headingAccuracy: 5) == .good)
        #expect(HeadingQuality(headingAccuracy: 15) == .approximate(accuracyDegrees: 15))
        #expect(HeadingQuality(headingAccuracy: 40) == .unreliable)
        #expect(HeadingQuality(headingAccuracy: -1) == .unavailable)
        #expect(HeadingQuality(headingAccuracy: nil) == .unavailable)
        #expect(HeadingQuality.good.message == nil)
        #expect(HeadingQuality.unavailable.message != nil)
    }
}

@Suite("Display policy")
struct DisplayTests {
    @Test func brighterStarsAreLarger() {
        let bright = StarAppearance.pointRadius(magnitude: -1, limit: 6)
        let faint = StarAppearance.pointRadius(magnitude: 5, limit: 6)
        #expect(bright > faint * 2)
    }

    @Test func faintStarsFadeInsteadOfPopping() {
        #expect(StarAppearance.alpha(magnitude: 0, limit: 6) == 1)
        #expect(StarAppearance.alpha(magnitude: 7, limit: 6) == 0)
        #expect((0.01..<1).contains(StarAppearance.alpha(magnitude: 5.8, limit: 6)))
    }

    @Test func zoomingRevealsFainterStars() {
        let wide = StarAppearance.limitingMagnitude(fieldOfView: 90, base: 6, skyBrightness: 0)
        let narrow = StarAppearance.limitingMagnitude(fieldOfView: 2, base: 6, skyBrightness: 0)
        #expect(narrow > wide + 2)
    }

    @Test func daylightWashesOutStars() {
        let night = StarAppearance.limitingMagnitude(fieldOfView: 60, base: 6, skyBrightness: 0)
        let day = StarAppearance.limitingMagnitude(fieldOfView: 60, base: 6, skyBrightness: 1)
        #expect(day < 0)
        #expect(night == 6)
    }

    @Test func skyBrightnessFollowsTwilight() {
        #expect(SkyBrightness(sunAltitude: -30).level == 0)
        #expect(SkyBrightness(sunAltitude: 30).level == 1)
        let civil = SkyBrightness(sunAltitude: -3).level
        let nautical = SkyBrightness(sunAltitude: -9).level
        #expect(civil > nautical && nautical > 0)
    }

    @Test func aFullMoonBrightensTheSkyOnlyWhenUp() {
        let up = SkyBrightness(sunAltitude: -30, moonAltitude: 40, moonIllumination: 1)
        let down = SkyBrightness(sunAltitude: -30, moonAltitude: -10, moonIllumination: 1)
        #expect(up.total > down.total)
        #expect(down.total == 0)
    }

    @Test func labelsNeverOverlapAndRespectPriority() {
        let a = LabelLayout.Candidate(id: "major", anchor: .init(x: 100, y: 100), size: (60, 14), priority: 1)
        let b = LabelLayout.Candidate(id: "minor", anchor: .init(x: 104, y: 100), size: (60, 14), priority: 2)
        let c = LabelLayout.Candidate(id: "third", anchor: .init(x: 102, y: 101), size: (60, 14), priority: 3)
        let placed = LabelLayout.place([c, b, a], screen: phone, limit: 10)
        #expect(placed.first?.id == "major")
        #expect(placed.count == 2, "third has nowhere left to go")
        #expect(abs(placed[0].position.y - placed[1].position.y) >= 14)
    }

    @Test func labelsStayOnScreenAndObeyTheLimit() {
        let edge = LabelLayout.Candidate(id: "edge", anchor: .init(x: 2, y: 100), size: (60, 14), priority: 1)
        #expect(LabelLayout.place([edge], screen: phone, limit: 5).isEmpty)
        let many = (0..<50).map { LabelLayout.Candidate(id: "\($0)", anchor: .init(x: 100, y: Double($0) * 30 + 20), size: (60, 14), priority: Double($0)) }
        #expect(LabelLayout.place(many, screen: phone, limit: 8).count == 8)
    }

    @Test func tapsPreferBrightObjectsNearby() {
        let vega = HitTest.Target(id: "vega", point: .init(x: 100, y: 100), radius: 6, magnitude: 0)
        let faint = HitTest.Target(id: "faint", point: .init(x: 108, y: 104), radius: 1, magnitude: 5.5)
        #expect(HitTest.pick([faint, vega], at: .init(x: 106, y: 103)) == "vega")
    }

    @Test func aTapExactlyOnAFaintStarStillWinsOverADistantBrightOne() {
        let bright = HitTest.Target(id: "bright", point: .init(x: 100, y: 100), radius: 2, magnitude: 1)
        let faint = HitTest.Target(id: "faint", point: .init(x: 125, y: 100), radius: 1, magnitude: 1.5)
        #expect(HitTest.pick([bright, faint], at: .init(x: 124, y: 100)) == "faint")
    }

    @Test func tapsOnEmptySkySelectNothing() {
        let t = HitTest.Target(id: "x", point: .init(x: 100, y: 100), radius: 2, magnitude: 1)
        #expect(HitTest.pick([t], at: .init(x: 300, y: 300)) == nil)
    }

    @Test func directionHintPointsTowardTheTarget() {
        let camera = SkyCamera(orientation: SkyCamera.orientation(azimuth: 180, altitude: 10), screen: phone)
        // Facing south, higher in the sky is straight up the screen.
        let up = DirectionHint.toward(Horizontal(azimuth: 180, altitude: 70).unitVector, camera: camera)
        #expect(up.bearing < 1 || up.bearing > 359)
        #expect(abs(up.separation - 60) < 1e-6)
        // West is to the right when facing south.
        let right = DirectionHint.toward(Horizontal(azimuth: 240, altitude: 10).unitVector, camera: camera)
        #expect(right.bearing > 45 && right.bearing < 135)
        let onTarget = DirectionHint.toward(Horizontal(azimuth: 180, altitude: 10).unitVector, camera: camera)
        #expect(onTarget.isCentered)
    }
}

@Suite("Rectilinear AR projection")
struct RectilinearTests {
    private let screen = ScreenSize(width: 390, height: 844)

    private func camera(fov: Double = 40) -> SkyCamera {
        SkyCamera(orientation: SkyCamera.orientation(azimuth: 0, altitude: 0), fieldOfView: fov, screen: screen, projection: .rectilinear)
    }

    @Test func centreAndEdgeMatchTheFieldOfView() throws {
        let c = camera(fov: 40)
        let centre = try #require(c.project(Horizontal(azimuth: 0, altitude: 0).unitVector))
        #expect(abs(centre.x - screen.width / 2) < 1e-6)
        let edge = try #require(c.project(Horizontal(azimuth: 20, altitude: 0).unitVector))
        #expect(abs(edge.x - screen.width) < 1e-6)
    }

    /// The defining property of a real lens, and what makes overlays line up with it.
    @Test func straightLinesStayStraight() throws {
        let c = camera(fov: 60)
        let directions = [(-20.0, 10.0), (0, 14), (20, 18)].map { x, y in
            Vec3(1, -tan(x * Angle.degToRad), tan(y * Angle.degToRad)).normalized
        }
        let p = try directions.map { try #require(c.project($0)) }
        let slopeA = (p[1].y - p[0].y) / (p[1].x - p[0].x)
        let slopeB = (p[2].y - p[1].y) / (p[2].x - p[1].x)
        #expect(abs(slopeA - slopeB) < 0.05)
    }

    @Test func nothingBehindTheLensProjects() {
        #expect(camera().project(Horizontal(azimuth: 180, altitude: 0).unitVector) == nil)
    }

    @Test func unprojectInverts() throws {
        let c = camera()
        let v = Horizontal(azimuth: 8, altitude: 12).unitVector
        #expect(c.unproject(try #require(c.project(v))).angle(to: v) < 1e-7)
    }

    /// A 4:3 sensor at 70° across its long side, filling a tall phone screen: height
    /// matches the long side and the sides get cropped, so the short side sees less.
    @Test func cameraFieldOfViewAccountsForAspectFill() {
        let fov = SkyCamera.cameraFieldOfView(sensorFieldOfView: 70, sensorAspect: 4.0 / 3, screen: screen)
        let expected = 2 * atan(tan(35 * Angle.degToRad) * 390 / 844) * Angle.radToDeg
        #expect(abs(fov - expected) < 1e-6)
        #expect(fov < 70)
    }

    @Test func screenWiderThanSensorKeepsTheFullShortSide() {
        let wide = ScreenSize(width: 800, height: 700) // 8:7 is narrower than 4:3
        let fov = SkyCamera.cameraFieldOfView(sensorFieldOfView: 70, sensorAspect: 4.0 / 3, screen: wide)
        let expected = 2 * atan(tan(35 * Angle.degToRad) * 3 / 4) * Angle.radToDeg
        #expect(abs(fov - expected) < 1e-6)
    }
}
