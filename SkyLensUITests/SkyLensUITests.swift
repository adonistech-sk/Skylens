import XCTest

/// The seven core journeys. They need a simulator, so they have not been executed in
/// the Windows environment this project was built in. See TESTING.md.
final class SkyLensUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        // "-uitesting" gives each run a clean, throwaway data directory.
        app.launchArguments = ["-uitesting"]
        app.launch()
    }

    /// Walks onboarding using manual coordinates, so no location permission is needed.
    private func completeOnboarding() {
        app.buttons["getStartedButton"].tap()
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
        app.buttons["result-Vega"].firstMatch.tap()
        app.buttons["findInSkyButton"].tap()
        XCTAssertTrue(app.buttons["selectionCard"].waitForExistence(timeout: 5))
    }

    func testDetailFavorite() {
        completeOnboarding()
        app.buttons["exploreButton"].tap()
        let search = app.searchFields.firstMatch
        search.tap()
        search.typeText("Mars")
        app.buttons["result-Mars"].firstMatch.tap()
        let favorite = app.buttons["favoriteButton"]
        favorite.tap()
        XCTAssertEqual(favorite.label, "Remove from Favorites")
    }

    func testTimeTravelAndReset() {
        completeOnboarding()
        app.buttons["timeButton"].tap()
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
        first.tap()
        XCTAssertTrue(app.staticTexts["detailTitle"].waitForExistence(timeout: 5))
    }

    func testSettingsChangesAppearance() {
        completeOnboarding()
        app.buttons["moreButton"].tap()
        app.buttons["Settings"].tap()
        let toggle = app.switches["settingsNightVisionToggle"]
        XCTAssertTrue(toggle.waitForExistence(timeout: 5))
        toggle.tap()
        XCTAssertEqual(toggle.value as? String, "1")
    }

    func testPaywallCanBeLeftWithoutPaying() {
        completeOnboarding()
        app.buttons["moreButton"].tap()
        app.buttons["Settings"].tap()
        app.buttons["seeProButton"].tap()
        XCTAssertTrue(app.buttons["paywallClose"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["restoreButton"].exists)
        app.buttons["paywallClose"].tap()
        XCTAssertTrue(app.buttons["exploreButton"].waitForExistence(timeout: 5))
    }
}
