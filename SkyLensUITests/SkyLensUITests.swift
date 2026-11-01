import XCTest

/// The seven core journeys, run in the Simulator by CI. Each also saves screenshots.
final class SkyLensUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        // "-uitesting" gives each run a clean, throwaway data directory.
        app.launchArguments = ["-uitesting"]
        app.launch()
    }

    /// Saves what's on screen, so CI can publish real pictures of the running app. The
    /// Simulator shares the Mac's file system, which is how these reach the workflow.
    private func capture(_ name: String) {
        let folder = "/tmp/skylens-shots"
        try? FileManager.default.createDirectory(atPath: folder, withIntermediateDirectories: true)
        let png = XCUIScreen.main.screenshot().pngRepresentation
        try? png.write(to: URL(fileURLWithPath: "\(folder)/\(name).png"))
    }

    private func pause(_ seconds: TimeInterval) {
        RunLoop.current.run(until: Date().addingTimeInterval(seconds))
    }

    /// Walks onboarding using manual coordinates, so no location permission is needed.
    private func completeOnboarding() {
        capture("01-welcome")
        app.buttons["getStartedButton"].tap()
        pause(0.6)
        capture("02-location")
        app.buttons["choosePlaceButton"].tap()
        let latitude = app.textFields["latitudeField"]
        latitude.tap()
        latitude.typeText("52.23")
        let longitude = app.textFields["longitudeField"]
        longitude.tap()
        longitude.typeText("21.01")
        app.buttons["useCoordinates"].tap()
        app.buttons["continueButton"].tap()
        app.buttons["preferencesContinueButton"].tap()
        app.buttons["skipAlertsButton"].tap()
        app.buttons["paywallClose"].tap()
        XCTAssertTrue(app.buttons["exploreButton"].waitForExistence(timeout: 10))
    }

    func testFirstLaunchReachesSkyView() {
        completeOnboarding()
        XCTAssertTrue(app.otherElements["skyCanvas"].exists || app.buttons["tonightButton"].exists)
        pause(4)
        capture("03-sky")
    }

    func testOnboardingPersistsAcrossLaunches() {
        // A relaunch with the same directory would skip onboarding. The -uitesting
        // directory is new per launch, so this is covered by AppModelTests instead,
        // and this test checks only that the first screen is onboarding.
        XCTAssertTrue(app.buttons["getStartedButton"].exists)
    }

    func testSearchSelectFindInSky() {
        completeOnboarding()
        app.buttons["exploreButton"].tap()
        let search = app.searchFields.firstMatch
        search.tap()
        search.typeText("Vega")
        pause(1)
        capture("04-search")
        app.buttons["result-Vega"].firstMatch.tap()
        pause(1)
        capture("05-star-detail")
        app.buttons["findInSkyButton"].tap()
        XCTAssertTrue(app.buttons["selectionCard"].waitForExistence(timeout: 5))
        pause(3)
        capture("06-found-in-sky")
    }

    func testDetailFavorite() {
        completeOnboarding()
        app.buttons["exploreButton"].tap()
        let search = app.searchFields.firstMatch
        search.tap()
        search.typeText("Mars")
        app.buttons["result-Mars"].firstMatch.tap()
        pause(1)
        capture("07-planet-detail")
        let favorite = app.buttons["favoriteButton"]
        favorite.tap()
        XCTAssertEqual(favorite.label, "Remove from Favorites")
    }

    func testTimeTravelAndReset() {
        completeOnboarding()
        app.buttons["timeButton"].tap()
        pause(1)
        capture("08-time-travel")
        let reset = app.buttons["resetToNowButton"]
        XCTAssertFalse(reset.isEnabled)
        app.buttons["Forward 1 day"].tap()
        XCTAssertTrue(reset.isEnabled)
        reset.tap()
        XCTAssertFalse(reset.isEnabled)
    }

    func testTonightSelectRecommendation() {
        completeOnboarding()
        app.buttons["tonightButton"].tap()
        let first = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'recommendation-'")).firstMatch
        XCTAssertTrue(first.waitForExistence(timeout: 20))
        capture("09-tonight")
        first.tap()
        XCTAssertTrue(app.staticTexts["detailTitle"].waitForExistence(timeout: 5))
    }

    func testSettingsChangesAppearance() {
        completeOnboarding()
        app.buttons["moreButton"].tap()
        app.buttons["Settings"].tap()
        let toggle = app.switches["settingsNightVisionToggle"]
        XCTAssertTrue(toggle.waitForExistence(timeout: 5))
        capture("10-settings")
        // The middle of a row is its label, so the tap goes to the switch at the trailing edge.
        toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.93, dy: 0.5)).tap()
        XCTAssertEqual(toggle.value as? String, "1")
        pause(1)
        capture("11-night-vision-settings")
    }

    func testPaywallCanBeLeftWithoutPaying() {
        completeOnboarding()
        app.buttons["moreButton"].tap()
        app.buttons["Settings"].tap()
        // Lists load rows lazily, so the Pro row exists only once it's scrolled to.
        let pro = app.buttons["seeProButton"]
        var swipes = 0
        while !pro.exists && swipes < 6 {
            app.swipeUp()
            swipes += 1
        }
        pro.tap()
        XCTAssertTrue(app.buttons["paywallClose"].waitForExistence(timeout: 5))
        pause(1)
        capture("12-paywall")
        XCTAssertTrue(app.buttons["restoreButton"].exists)
        app.buttons["paywallClose"].tap()
        XCTAssertTrue(app.buttons["exploreButton"].waitForExistence(timeout: 5))
    }
}
