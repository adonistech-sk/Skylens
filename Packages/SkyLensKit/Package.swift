// swift-tools-version: 6.0
import PackageDescription

// Everything here is platform neutral so it can be compiled and tested without
// an iOS SDK. Apple-only code lives in the SkyLens app target.
let package = Package(
    name: "SkyLensKit",
    platforms: [.iOS(.v18), .macOS(.v14), .watchOS(.v11)],
    products: [
        .library(name: "AstronomyCore", targets: ["AstronomyCore"]),
        .library(name: "SkyCatalog", targets: ["SkyCatalog"]),
        .library(name: "SkyProjection", targets: ["SkyProjection"]),
        .library(name: "Satellites", targets: ["Satellites"]),
        .library(name: "ObservingKit", targets: ["ObservingKit"]),
        .library(name: "UserData", targets: ["UserData"]),
        .library(name: "SkySession", targets: ["SkySession"]),
    ],
    targets: [
        .target(name: "CAstronomyEngine", exclude: ["LICENSE.txt"]),
        .target(name: "AstronomyCore", dependencies: ["CAstronomyEngine"]),
        .target(
            name: "SkyCatalog",
            dependencies: ["AstronomyCore"],
            resources: [.copy("Resources")]
        ),
        .target(name: "SkyProjection", dependencies: ["AstronomyCore"]),
        .target(name: "Satellites", dependencies: ["AstronomyCore"]),
        .target(name: "ObservingKit", dependencies: ["AstronomyCore", "SkyCatalog", "Satellites"]),
        .target(name: "UserData", dependencies: ["AstronomyCore", "SkyCatalog", "ObservingKit"]),
        .target(
            name: "SkySession",
            dependencies: ["AstronomyCore", "SkyCatalog", "SkyProjection", "Satellites", "ObservingKit", "UserData"]
        ),
        .testTarget(name: "AstronomyCoreTests", dependencies: ["AstronomyCore"]),
        .testTarget(name: "SkyCatalogTests", dependencies: ["SkyCatalog"]),
        .testTarget(name: "SkyProjectionTests", dependencies: ["SkyProjection"]),
        .testTarget(name: "SatellitesTests", dependencies: ["Satellites"]),
        .testTarget(name: "ObservingKitTests", dependencies: ["ObservingKit"]),
        .testTarget(name: "UserDataTests", dependencies: ["UserData"]),
        .testTarget(name: "SkySessionTests", dependencies: ["SkySession"]),
    ]
)
