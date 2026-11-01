import AstronomyCore
import Metal
import simd
import SkyProjection
import Testing
@testable import SkyLens

/// Checks at the seam between the tested package and Apple frameworks. Almost all
/// logic is tested in SkyLensKit, so this suite covers what only exists in the app.
@Suite("App integration")
struct SkyLensAppTests {
    /// simd is column-major and Mat3 row-major, and getting that backwards would
    /// invert every rotation the renderer applies.
    @Test func matrixConversionPreservesRotation() {
        let m = SkyCamera.orientation(azimuth: 37, altitude: 22)
        let v = Vec3(0.3, -0.5, 0.81).normalized
        let expected = m * v
        let result = m.simd * v.simd
        #expect(abs(Double(result.x) - expected.x) < 1e-6)
        #expect(abs(Double(result.y) - expected.y) < 1e-6)
        #expect(abs(Double(result.z) - expected.z) < 1e-6)
    }

    /// Catches a renamed shader function or a broken pipeline before it reaches a user.
    @MainActor
    @Test func shadersCompileIntoAllPipelines() throws {
        let device = try #require(MTLCreateSystemDefaultDevice())
        let library = try #require(device.makeDefaultLibrary())
        for name in ["starVertex", "starFragment", "lineVertex", "lineFragment", "fullScreenVertex", "skyFragment", "groundFragment", "markerVertex", "markerFragment", "labelVertex", "labelFragment"] {
            #expect(library.makeFunction(name: name) != nil, "\(name)")
        }
    }
}
