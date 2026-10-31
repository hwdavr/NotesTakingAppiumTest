# Test Plan — Appium Automation Framework

## Feature / Bug

Verify the external TypeScript/WebdriverIO framework and its initial Android UI examples.

## Rule Applicability Test Mapping

Canonical decisions: [spec_v1.md#rule-applicability](spec_v1.md#rule-applicability).

| Required Rule ID | Planned verification |
|---|---|
| ARCH | Review independent config/support/screens/spec structure and unchanged application source status. |
| IMPL | npm run check, actual commands/suites, intentional failure probe; verify real actions and assertions with teardown. |
| TEST | CFG-01/02, PRE-01/02, ART-01/02, UI-01..04; require nonzero executed counts and actual JUnit XML. |
| SEC | SEC-01/02, ART-01, device/debug identity, local Appium binding, preserved data, no secrets/insecure features. |

## Layer Selection

All items are maintained framework regression, not ephemeral exploratory QA.

| Layer | Included | Reason |
|---|---|---|
| Node/TypeScript framework unit tests | Yes | Configuration, prerequisite selection, security defaults, and artifact failure boundaries. |
| Application JVM unit/integration tests | No | No app business/data behavior changes. |
| Real UiAutomator2 instrumented Appium specs | Yes | Exercise shipped Activity and Android accessibility IDs on a real runtime. No substitute Activity/Compose content or fake platform proof. |
| Additional app/src/androidTest classes | No | Framework lives outside app; existing Activity instrumentation remains untouched. Appium's actual on-device UiAutomator2 server provides this framework's runtime boundary. |
| Ephemeral exploratory-qa / agent-device | No | User explicitly requested a maintained Appium framework. |

## Ephemeral Test Cases

Not applicable: no exploratory QA/WireMock run is planned.

## Production Journey Boundary

No production navigation implementation changes. External specs enter `com.example.notesapp.MainActivity` and use actual UI gestures; UI-03/04 return to Home and assert its visible FAB. No ViewModel/internal callback calls. This proves the external examples, without replacing existing Android application navigation regression gates.

## IME Production Boundary

Not applicable: initial examples edit no input and make no keyboard geometry/behavior claim.

## Test Cases

### Framework unit tests

| ID | Given | When | Then |
|---|---|---|---|
| CFG-01 | Documented defaults and a valid selected device | Resolve settings and capabilities | Correct app/activity, noReset=true/fullReset=false, numeric bounded timeouts, and bare-ID setting. |
| CFG-02 | Invalid booleans/ports/timeouts, malformed server URL, or nonexistent explicit APK | Validate config | Actionable nonzero error; no server/session is started. |
| PRE-01 | Zero, offline, unauthorized, or several online devices | Doctor selects a device | Missing/unusable devices fail; ambiguity requires explicit valid UDID. |
| PRE-02 | Missing SDK/driver, unsupported API, release app, or unsuitable locale | Doctor validates selected suite | Explicit prerequisite failure; no skip or pass. |
| ART-01 | A failed test with hierarchy capture disabled | Collect diagnostics | Failure screenshot/metadata stay within run artifacts; no hierarchy or protocol-input dump. |
| ART-02 | Capture fails while a test already failed | Execute capture/cleanup | Original failure remains; evidence error is reported and teardown still executes. |
| SEC-01 | Default local server configuration | Construct Appium service | Loopback binding, no relaxed-security/allow-insecure flags, project-local driver home. |
| SEC-02 | Configuration containing embedded URL credentials or unsafe artifact path | Validate | Reject sensitive/unsafe configuration without echoing credentials. |

#### CFG-01 — Detailed steps

1. Supply documented non-secret defaults and a selected device using test-local environment input.
2. Resolve typed config and Android capabilities.
3. Assert the public effective values and reset/ID policies above.

#### CFG-02 — Detailed steps

1. Parameterize malformed values and an explicit missing APK path.
2. Invoke validation without starting Appium.
3. Assert validation fails with the relevant field and no secret-bearing dump.

#### PRE-01 — Detailed steps

1. Supply parsed ADB inventories for absent/offline/unauthorized/multiple devices.
2. Select with missing, valid, and invalid UDID inputs.
3. Assert ambiguity and unusable devices fail; a valid unique explicit device is selected.

#### PRE-02 — Detailed steps

1. Supply missing tool/driver, API below 26, non-debug app, and unsupported label-dependent locale observations.
2. Run prerequisite validation for smoke/authenticated suites.
3. Assert exact unmet prerequisites are surfaced and are never treated as skipped/passing tests.

#### ART-01 — Detailed steps

1. Create a temporary run directory and failed-test context with hierarchy disabled.
2. Exercise diagnostic capture at the driver boundary using a test double.
3. Assert only permitted local artifacts are emitted and no hierarchy call occurs. Confirm real capture separately with FAIL-01.

#### ART-02 — Detailed steps

1. Arrange an existing assertion failure and a driver capture error.
2. Execute artifact handling and cleanup.
3. Assert original failure identity/result is preserved, capture failure is recorded, and teardown runs.

#### SEC-01 — Detailed steps

1. Resolve local-mode configuration with defaults.
2. Inspect the public service options/environment to be passed to Appium.
3. Assert loopback binding, no insecure features, and target-local Appium home.

#### SEC-02 — Detailed steps

1. Parameterize credential-bearing endpoint URLs and paths escaping the artifact root.
2. Validate configuration/path construction.
3. Assert rejection and absence of the sensitive values from diagnostics.

### Real Appium UI specs

| ID | Given | When | Then |
|---|---|---|---|
| UI-01 | Supported debug app on the selected device | Start/activate the production Activity | Correct foreground package and either real onboarding CTA IDs or Home FAB ID become visible. Unknown screens fail. |
| UI-02 | Existing authenticated Home; English locale | Open Home FAB sheet, inspect Text Note/Record Note controls, dismiss with Back | Sheet is visible then closed; Home FAB visible; no note created. |
| UI-03 | Existing authenticated Home; English locale | Tap Settings then Home | Settings root is visible before return; Home FAB visible afterward. |
| UI-04 | Existing authenticated Home; English locale | Tap Folders then Home | Folders root is visible before return; Home FAB visible afterward. |
| FAIL-01 | Working runtime and temporary intentionally failing spec | Fail an assertion after entry state appears | Runner exits nonzero; JUnit/Allure failure and screenshot are saved; service/session shut down. |

#### UI-01 — Detailed steps

1. Run doctor; record selected UDID, actual API/locale, debug app/build identity and dependency versions. Use an emulator isolated from production networking.
2. Start local Appium and its real UiAutomator2 server, preserving existing app data/authentication.
3. Activate the shipped Activity and wait with a bounded condition for the foreground package and recognized entry controls.
4. Assert all required controls of the detected state. Retain JUnit test identity/count and run metadata; quit the session/service.

#### UI-02 — Detailed steps

1. Select the authenticated suite and require actual Home; missing authentication fails setup explicitly.
2. Tap bare ID home_add_fab and wait for the real modal's New text note/record-note accessible controls.
3. Press Android Back to dismiss; assert modal disappears and home_add_fab is visible.
4. Quit without selecting a note-creation action or modifying existing content.

#### UI-03 — Detailed steps

1. Require authenticated Home on the isolated English test runtime.
2. Tap the Settings bottom-nav accessibility target and assert settings_screen.
3. Tap Home and assert home_add_fab; quit and retain results.

#### UI-04 — Detailed steps

1. Require authenticated Home on the isolated English test runtime.
2. Tap Folders and assert folders_screen.
3. Tap Home and assert home_add_fab; quit and retain results.

#### FAIL-01 — Detailed steps

1. Add a temporary probe spec outside committed maintained specs, targeting the same real runtime.
2. Reach a recognized entry state, then intentionally assert a missing visible control with a short bounded timeout.
3. Assert the command fails and its JUnit/Allure result records the expected assertion failure, with a local screenshot.
4. Check session/Appium cleanup; remove the probe. Keep this expected-negative result separate from acceptance results.

## Shared JSON Scenarios

Not applicable: no API endpoint assertion or contract change; no backend fixture is introduced. Unit fixtures model framework-boundary observations only and do not establish Android runtime correctness.

## Coverage Targets

Application Kover coverage is unaffected; no new ViewModel/use-case/Compose code. Framework acceptance requires the declared meaningful unit cases and genuine device specs, with nonzero execution counts. Skips, discovery/typecheck alone, or unavailable authentication/runtime do not prove the selected suite.

## Platform Capability Matrix

| Capability | Planned runtime | Required evidence / unavailable behavior |
|---|---|---|
| Native automation / bare Compose IDs | Selected API 26+ Android debug emulator | UI-01 through actual UiAutomator2 instrumentation; missing device/driver/debug tags fails. |
| Modal accessibility / tabs / return | English authenticated debug emulator | UI-02..04; missing auth/locale blocks that suite explicitly. |
| Android API 24/25 | Outside current UiAutomator2 stack | Unsupported/unverified; never claimed passing. |
| Other Android versions/locales/physical devices | Configurable, not automatically accepted | Record only actual executed matrices. |
| Backend/Auth0/AI/voice/permissions/visual pixels | Outside initial scope | No acceptance claim. |

## Verification Commands

Run from AppiumTest after implementation:

1. npm ci
2. npm run setup:driver
3. npm run doctor
4. npm run check
5. npm test
6. npm run test:authenticated — requires prepared login; fail explicitly if absent.
7. npm run report:generate
8. Run FAIL-01 separately and verify its expected nonzero failure.

Record commands, exit codes, counts, runtime/build fingerprints, artifact locations, and cleanup in summary_v1.md. No execution result is asserted by this plan.
