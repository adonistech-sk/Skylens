# Getting SkyLens onto your iPhone without a Mac

You need: an Apple Developer account, an iPhone, and a free GitHub account. GitHub lends you a Mac for each build, and TestFlight puts the result on your phone. Nothing about this is a workaround: it is the same route many small studios use.

The first build will probably fail with compile errors, because this app has never been through Xcode. That's expected. Each failure gives a log, and fixing those is the next piece of work.

## 1. Put the code on GitHub (about 5 minutes)

1. Install [GitHub Desktop](https://desktop.github.com) and sign in.
2. **File → Add local repository**, pick this folder, then **Publish repository**.
3. Make it **public** if you can. Public repos get unlimited free macOS build minutes. A private repo gets about 200 macOS minutes a month on the free plan, which is roughly ten builds.

## 2. Register the app with Apple (about 10 minutes)

1. Choose a bundle ID that is yours, such as `com.yourname.skylens`. Lowercase, no spaces.
2. Go to [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers/list), press **+**, choose **App IDs → App**, enter a description and your bundle ID (Explicit), and register it. No capabilities need ticking.
3. Go to [App Store Connect → Apps](https://appstoreconnect.apple.com/apps), press **+ → New App**. Platform iOS, name SkyLens (or any name, it can change), pick your bundle ID, and enter any SKU such as `skylens1`.
4. Note your **Team ID**: [developer.apple.com/account](https://developer.apple.com/account) → Membership details. It's ten characters.

## 3. Make an API key so GitHub can sign and upload (about 5 minutes)

1. [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api).
2. Press **+** under Team Keys. Name it `GitHub`, access **Admin**, which automatic cloud signing needs in order to create distribution certificates. Generate.
3. Write down the **Issuer ID** (top of the page) and the key's **Key ID**.
4. **Download the API key**. You get `AuthKey_XXXXXXXXXX.p8`. Apple lets you download it only once, so keep it.
5. Open the `.p8` file in Notepad. You'll need its whole text, including the BEGIN and END lines.

## 4. Give GitHub the secrets (about 5 minutes)

On your repository page: **Settings → Secrets and variables → Actions → New repository secret**. Add these five:

| Name | Value |
|---|---|
| `ASC_KEY_ID` | The Key ID |
| `ASC_ISSUER_ID` | The Issuer ID |
| `ASC_KEY_P8` | The entire text of the `.p8` file |
| `APPLE_TEAM_ID` | Your Team ID |
| `BUNDLE_ID` | Your bundle ID |

## 5. Build

1. On the repository page, open the **Actions** tab.
2. Choose **TestFlight** on the left, press **Run workflow**, then the green button.
3. Wait 10 to 20 minutes.

**If it goes red:** open the run, open the failed step, and copy the lines containing `error:`. Those are compiler errors to fix. The full log is also attached as an artifact at the bottom of the run page. Paste the errors back to me and I'll fix them, then you press Run workflow again.

**If it goes green:** Apple processes the build for 5 to 30 minutes, then emails you.

## 6. Install on your iPhone

1. Install **TestFlight** from the App Store on your iPhone.
2. In App Store Connect, open the app, then **TestFlight**. The build appears under iOS Builds. The first time, Apple asks a compliance question about encryption: SkyLens uses only standard HTTPS, so answer **No** to using non-standard encryption.
3. Under **Internal Testing**, press **+** to make a group, add yourself as a tester (your Apple ID email), and enable the build for it.
4. The TestFlight app on your phone now shows SkyLens. Press **Install**.

Internal testing needs no App Review. Each new build you run on GitHub shows up in TestFlight automatically.

## What to expect on the phone

- The compass, AR and everything else runs for real for the first time, so do the checks in `TESTING.md`.
- Subscriptions will show "Plans unavailable" until products are created in App Store Connect. That's the honest state, not a bug.
- Weather, satellites and the dark-sky map need an internet connection.

## If you'd rather see it in a Simulator first

The **CI** workflow in the Actions tab builds the app for the Simulator and runs the tests, without needing any of the secrets. It gives you compile results and test results, but you can't interact with the app that way. It runs automatically on every push.
