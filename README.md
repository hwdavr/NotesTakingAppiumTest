# NotesTakingApp Appium Tests

TypeScript + WebdriverIO + Mocha framework for the Android NotesTakingApp. Appium and its
UiAutomator2 driver run locally; application source and saved notes are not modified.

## Setup

Use Node **22.19+ within 22.x, or 24+**, npm 10+, JDK 17+, and an Android SDK with platform-tools.
Add `adb` to PATH and set `ANDROID_HOME` and `JAVA_HOME`. Start an Android API **26+** emulator
or authorize USB debugging on a dedicated test device.

```sh
cd /Users/hwdavr/Projects/2026_NotesTakingApp/AppiumTest
npm ci
npm run setup:driver
cp .env.example .env
```

Edit `.env` for your SDK/device. `setup:driver` pins UiAutomator2 8.7.3 in this project's
`.appium/`; it does not update global Appium or its drivers. Running it again checks the
same installation. Dependencies are pinned in `package-lock.json`.

By default the framework uses the installed **debug** app:
`com.example.notesapp/com.example.notesapp.MainActivity`. If it is absent, set `APP_PATH`
to the debug APK. Build that APK in the application repository with `./gradlew assembleDebug`.
An explicit APK is validated before use and may be installed as an update. No test uninstalls
or clears the app. `noReset=true`, `fullReset=false`, and permission auto-grant is disabled.
The process is relaunched at session start and stopped at session end; saved login/data remain.

## Test network and authentication

Use a dedicated emulator with Wi-Fi and mobile data disabled. `doctor` verifies this by default
so app startup cannot contact a production backend. The framework never changes connectivity.
For an isolated local test network you have verified, set `TEST_NETWORK_ISOLATED=true`.
This is an explicit network precondition, not a backend-mocking feature. Do not use that flag
to permit production traffic. Android's process-local developer API routing resets when a
session relaunches the app, so selecting that menu alone does not establish isolation.

For an emulator, inspect the original `wifi_on` and `mobile_data` settings, then use Android's
network settings to turn both off. Restore the original settings after testing. A physical
device must also have any other transports, including Ethernet/VPN, isolated.

The smoke suite accepts the real Onboarding or Home entry state. The authenticated suite
requires a previously prepared login and an English locale; missing authentication fails
explicitly. It does not automate Auth0, inject tokens, sign out, edit settings, or create notes.

## Commands

```sh
npm run doctor               # SDK/Java/driver/device/API/debug build/network diagnostics
npm run check                # typecheck + lint + formatting + framework unit tests
npm test                     # default launch smoke (one real device test)
npm run test:authenticated   # creation sheet + Settings/Home + Folders/Home (three tests)
npm run report:generate      # generate HTML from latest Allure results (requires Java)
npm run report:open          # open generated report
```

Select a device with `ANDROID_UDID=emulator-5554`. If several devices are online, an explicit
UDID is required. Run one worker per device; this project intentionally uses `maxInstances=1`.
`npm test -- --spec ./tests/specs/smoke/app-launch.spec.ts` forwards a WDIO spec filter.
Zero executed tests never count as a successful run.

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run format`, and
`npm run test:unit` are also available separately. TypeScript is executed by `tsx`; `tsc`
performs the separate strict type check.

## Configuration

Paths resolve from this project, even when commands are invoked from another directory.
The `.env` file is optional and ignored by Git; environment variables take precedence.

| Variable                 | Default / behavior                                                               |
| ------------------------ | -------------------------------------------------------------------------------- |
| ANDROID_HOME / JAVA_HOME | SDK/JDK locations; adb/java must be on PATH                                      |
| ANDROID_UDID             | Select the only online device; require explicit serial when ambiguous            |
| APP_PATH                 | Omitted: use installed app. Otherwise an existing debug `.apk`                   |
| APP_PACKAGE              | com.example.notesapp                                                             |
| APP_ACTIVITY             | com.example.notesapp.MainActivity                                                |
| APPIUM_PORT              | 4723, local service binds 127.0.0.1                                              |
| APPIUM_SERVER_URL        | Omitted: manage local Appium. Set to use an existing server                      |
| WAIT_TIMEOUT_MS          | 15000, bounded element/state waits                                               |
| CONNECTION_TIMEOUT_MS    | 120000, session/command connection timeout                                       |
| CAPTURE_PAGE_SOURCE      | false; opt in to private hierarchy XML on failures                               |
| TEST_NETWORK_ISOLATED    | false; otherwise explicitly attest an isolated test network                      |
| RUN_ID                   | Generated per test invocation; set only when selecting a report to generate/open |

An external server must use HTTPS unless it is on loopback. URLs with credentials/query
parameters are rejected. Install the pinned UiAutomator2 driver on an external server yourself;
that server needs access to the selected device and, if supplied, the APK path. Local `doctor`
still verifies this project's tools/device; remote device clouds are outside this framework's scope.
No Appium relaxed-security or allow-insecure features are enabled.

## Structure and selectors

```text
config/       validated settings and Android capabilities
scripts/      local driver setup, doctor, run, report generation
screens/      screen objects using existing selectors
support/      device preflight, entry state, cleanup, failure artifacts
tests/specs/  maintained real-device smoke and authenticated suites
tests/unit/   configuration and reliability boundary checks
docs/current/ approved scope, plans, and delivery evidence
```

Debug `MainActivity` exports Compose test tags as bare resource IDs. The capability
`appium:settings[disableIdLocatorAutocompletion]=true` prevents Appium prefixing these with
the package name. Example: `id=home_add_fab`. Release builds intentionally lack these IDs.
Separate Compose modal windows do not inherit the root mapping: the Home sheet uses
`~New text note` and `~New voice recording`. Bottom-nav visible text labels use UiSelector.text within
`id=app_bottom_navigation`. These label-dependent examples require English.

Add screen actions in `screens/`, use `waitForDisplayed`/WDIO retrying assertions, and add
independent `*.spec.ts` files to the appropriate suite. Avoid coordinates, fixed sleeps,
shared mutable test state, and backend or token shortcuts. Example:

```ts
import { describe, it } from 'mocha';
import { home } from '../../../screens/home.screen.js';
import { requireAuthenticatedHome } from '../../../support/app-state.js';

// Put the spec in tests/specs/authenticated/ to select it with that suite.
describe('Home controls', () => {
  it('shows the Home entry controls', async () => {
    await requireAuthenticatedHome();
    await home.assertVisible();
  });
});
```

## Reports and failure evidence

Each test invocation prints its `artifacts/<run-id>/` directory:

- `runtime.json`: selected device/API/locale, app identity and APK SHA-256, dependency versions.
- `junit/`: CI-compatible test XML; `allure-results/` and `allure-report/`: report data/HTML.
- `failures/`: failure-only screenshots, diagnostic status, opt-in hierarchy XML.
- `wdio/` and `appium/`: local runner/server logs.

Artifacts, APKs, dependencies, and local settings are ignored by Git. Screenshots/hierarchies
can contain private content; keep them on your test machine. Automatic protocol-step and
screenshot reporter attachments are disabled; failure screenshots are attached explicitly.
Capture/cleanup failures are surfaced without replacing the original assertion failure.
Tests do not retry automatically.

For CI, provision the dedicated emulator/debug APK and any authenticated test session, isolate
its network, then run `npm ci`, `npm run setup:driver`, `npm run check`, and `npm test`.
Publish selected JUnit/report artifacts only under your organization's private artifact policy.
No hosted CI repository or pipeline is created by this project.

## Platform coverage

| Boundary                                                   | Support                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| Android native debug UI                                    | API 26+ supported by selected UiAutomator2 driver          |
| API 24/25                                                  | App supports these; this driver stack does not verify them |
| Home sheet and tabs                                        | English, prepared authenticated session                    |
| iOS / backend correctness / AI / voice / pixel comparisons | Outside initial scope                                      |

Actual executed versions, device API, test counts, and evidence are recorded in
[the delivery summary](docs/current/summary_v1.md). Configurability does not establish
coverage of unexecuted devices, locales, or APIs.

## Troubleshooting

- Missing tools: set ANDROID_HOME/JAVA_HOME, put platform-tools on PATH, then run doctor.
- No driver: run setup:driver; it uses the project-local .appium directory.
- Competing instrumentation: close agent-device/other automation sessions on that device first.
  Doctor detects this conflict; the framework never kills another automation tool automatically.
- No device/ambiguous device: inspect `adb devices -l` and set ANDROID_UDID.
- Missing debug IDs: use the debug APK and ensure the app is at a recognized launch state.
- Authentication failure: prepare login manually on the isolated test device; do not clear data.
- Locale failure: select English for the authenticated examples.
- Local port occupied: stop the conflicting server or change APPIUM_PORT. To reuse an existing
  server, set APPIUM_SERVER_URL instead of starting a second service.
- Cannot reach remote server: check HTTPS, certificate trust, device and server-side APK access.
- HTML report fails: verify Java; JUnit and raw Allure results remain available.

Primary references: [Appium service](https://webdriver.io/docs/appium-service),
[TypeScript setup](https://webdriver.io/docs/typescript),
[UiAutomator2](https://github.com/appium/appium-uiautomator2-driver).
