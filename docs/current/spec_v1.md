# Spec Adhoc — Appium Automation Framework

**Date**: 2026-10-31  
**Status**: Approved — user message “approved”, 2026-10-31

## Product Requirements

- Source capability: [Debug UI Automation](/Users/hwdavr/Projects/2026_NotesTakingApp/NotesTakingApp/docs/product/requirements/debug-ui-automation.md), DEV-AUTO-001.
- Delta: add a separate maintained automation framework consuming existing debug selectors. Application behavior and release configuration remain unchanged.
- Inspected requirements SHA-256: `265b2406c13f1db588922ea5cca173e961dfcf41a5da2bd4424ba506b9a7eea0`; confirmed unchanged at approval.
- The source product tracker records application delivery; this external framework creates no application feature lifecycle transition.

## Requirement Summary

Create an Android Appium framework under `/Users/hwdavr/Projects/2026_NotesTakingApp/AppiumTest/` for the existing NotesTakingApp. The user selected TypeScript + WebdriverIO. Provide runnable examples, reusable screen objects, configurable devices/APK paths, explicit waits, reports, diagnostics, and documented setup.

## Rule Applicability

| Rule ID | Rule document | Decision | Feature-specific evidence or reason |
|---|---|---|---|
| ARCH | android-architecture.md | Required | Preserve all application layers; separate runner config, screen interactions, specs, and support utilities in the external framework. Review file boundaries. |
| IMPL | implementation-rules.md | Required | All commands, helpers, assertions, and teardown paths must work; no placeholders. Verify checks and real device tests. |
| TEST | testing-strategy.md | Required | Maintained framework checks plus genuine UiAutomator2 instrumentation of the shipped Activity; require nonzero executed cases. |
| SUI | compose-rules.md | Not applicable — no Compose implementation, layout, accessibility, state, color, or input behavior changes | Consume existing semantics; no UI contract or design work. |
| L10N | localization-rules.md | Not applicable — no application copy or resource changes | Document English locale requirement for current accessible-label selectors and reject unsupported locale when selecting those suites. |
| NAV | navigation-rules.md | Not applicable — no route, argument, destination, deep-link, or back-stack change | Existing tab/return interactions are observed by external tests; no navigation behavior is implemented. |
| API | api-contract-rules.md | Not applicable — no endpoint, DTO, schema, or error contract changes or backend acceptance claims | Initial examples are UI smoke checks. No maintained endpoint assertions or WireMock fixtures are introduced. |
| OBS | observability.md | Not applicable — no application logging, recovery, persistence, or async boundary changes | Test-runner output is local test evidence, not application telemetry. |
| ANL | analytics-rules.md | Not applicable — analytics: none | No analytics requirements or app analytics changes. |
| SEC | android-security.md | Required | Local Appium transport, configuration, APK validation, and private diagnostic artifacts. Bind loopback, avoid insecure server options and secrets, preserve data, and validate on an actual debug runtime. |

## Functional Requirements

- **FR-001**: All framework files and generated artifacts MUST reside in AppiumTest. Do not modify Android application source, shared contracts, or harness instructions.
- **FR-002**: Use TypeScript, WebdriverIO, Mocha, Appium 3, and UiAutomator2 with a committed npm lockfile and a compatible, pinned dependency set.
- **FR-003**: Expose environment-driven device UDID, optional APK path, app package/activity, Appium endpoint/port, and timeouts. Use the known package `com.example.notesapp` and Activity `com.example.notesapp.MainActivity` by default. Reject malformed configuration early.
- **FR-004**: Use existing bare Compose test-tag IDs with `disableIdLocatorAutocompletion=true`; use scoped accessible labels for modal windows and bottom navigation where IDs are absent. Prefer current element lookup and bounded WebdriverIO waits; no coordinate taps or fixed sleeps.
- **FR-005**: `npm test` MUST run a maintained launch smoke case that verifies the foreground application and the actual onboarding or authenticated home controls. It MUST fail on unsupported/blank screens, missing debug IDs, missing driver, no device, or an unavailable runtime.
- **FR-006**: Provide a separately selected authenticated suite checking the Home creation sheet can open/dismiss, Settings can open/return Home, and Folders can open/return Home. If selected without a prepared authenticated session, fail explicitly rather than skip or fabricate credentials.
- **FR-007**: Preserve existing app data/authentication with `noReset=true`, `fullReset=false`; do not uninstall, clear data, grant all permissions, inject tokens, or alter existing notes. A supplied APK may be installed as an update when required and compatible.
- **FR-008**: Manage a local loopback Appium service by default and allow an explicitly configured existing server. Store UiAutomator2 in a project-local Appium home and avoid changing the global Appium installation.
- **FR-009**: Produce console results, JUnit XML, Allure results, and failure screenshots. Full hierarchy dumps require explicit opt-in. Keep reports/local configuration ignored by Git; disable automatic protocol-step attachments that expose input values. Capture/teardown errors MUST NOT hide the original failure or produce a passing result.
- **FR-010**: Provide setup, doctor/preflight, typecheck, lint, format-check, framework-unit-test, smoke, authenticated, and report commands. Document prerequisites, test extension, selectors, troubleshooting, and exact verified versions/runtime.

## Success Criteria

- **SC-001**: Clean installation from the lockfile, TypeScript typecheck, lint, formatting checks, and nonzero framework-unit tests pass.
- **SC-002**: On the declared Android debug runtime, at least one launch smoke case executes and passes through real Appium/UiAutomator2 instrumentation, with JUnit evidence and build/device/version fingerprints.
- **SC-003**: If an authenticated session is available, all three read-only authenticated cases execute and pass; otherwise report that suite blocked, not verified.
- **SC-004**: Missing/ambiguous devices, invalid settings, unavailable driver/server/APK, unsupported API/locale, and absent authentication produce actionable nonzero failures.
- **SC-005**: An intentionally failing test produces failure artifacts and a failed result; teardown completes. Private hierarchy capture remains off unless explicitly enabled.
- **SC-006**: Source application and existing notes/authentication remain unchanged by framework setup/tests; generated artifacts stay local.

## Edge Cases

- Several online devices: require an explicit UDID; never select arbitrarily. Offline/unauthorized devices are rejected.
- Current UiAutomator2 requires API 26+ although the app supports API 24; document API 24/25 as unverified/unsupported by this selected driver stack rather than silently claiming coverage.
- First launch and authenticated launch differ. The default smoke accepts only one recognized, fully visible entry state and verifies its controls; authenticated suite requires home.
- Modal windows do not inherit Activity-root tag export. Their selectors use documented English accessible labels and assert the sheet outcome.
- Resetting or restarting the process resets developer API routing; execution must use a dedicated emulator isolated from production networking, not rely on process-local routing remaining selected.
- Invalid remote endpoint, occupied local port, missing/invalid APK, release build without IDs, session creation failure, and screenshot failure must remain visible failures.

## Explicit Assumptions

1. Android only; no iOS app is supplied.
2. Initial examples deliberately avoid creating/updating/deleting notes or interacting with Auth0. Extending feature coverage is supported through screen objects and new specs.
3. English is the initial supported locale for label-dependent authenticated examples. ID-based launch checks remain locale-independent.
4. Existing emulator/app data are preserved. Device tests run on an authorized, isolated test emulator; connectivity changes, if needed for the verification run, are recorded and restored.
5. Use a compatible current WebdriverIO release family, with exact versions selected and locked during implementation. Do not mix package majors.
6. No hosted repository/CI provider is specified; document CI invocation and artifact paths without publishing a pipeline or repository.

## Open Questions

- Delta and plans approved by the user on 2026-10-31.
- User approved following the read skill files while the Skill invocation tool is unavailable (2026-10-31).

## Technical References

Primary documentation inspected on 2026-10-31:

- [WebdriverIO Appium service](https://webdriver.io/docs/appium-service): local service lifecycle and Appium 3 compatibility.
- [WebdriverIO TypeScript setup](https://webdriver.io/docs/typescript): tsx execution and separate tsc type checking.
- [WebdriverIO Allure reporter](https://webdriver.io/docs/allure-reporter): results and attachment configuration.
- [UiAutomator2 requirements](https://github.com/appium/appium-uiautomator2-driver#requirements): current driver Android API support.
- [UiAutomator2 ID troubleshooting](https://appium.github.io/appium-uiautomator2-driver/latest/troubleshooting/#id-locators): bare Compose tag matching and disableIdLocatorAutocompletion.
