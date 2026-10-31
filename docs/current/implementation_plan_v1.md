# Implementation Plan — Appium Automation Framework

**Status**: Approved by the user on 2026-10-31; implementation in progress.

## Feature / Bug

Create a TypeScript + WebdriverIO Appium framework for NotesTakingApp in AppiumTest.

## Requirement Summary

Deliver an independently installable Android test project using Mocha, Appium 3, UiAutomator2, reusable screen objects, and spec/JUnit/Allure reporting. Include one default launch smoke test and three separately selected authenticated UI examples, configuration checks, prerequisite diagnostics, and documentation. Preserve the Android app and its stored data.

## Rule Applicability Implementation

Canonical decisions: [spec_v1.md#rule-applicability](spec_v1.md#rule-applicability). User approved these decisions on 2026-10-31.

| Required Rule ID | Implementation work / verification evidence |
|---|---|
| ARCH | Keep config, support, screen objects, and specs separate; no Android changes. Review framework file boundaries and source repo status. |
| IMPL | Implement all npm scripts, screen actions, assertions, capture hooks, and teardown. No stubs, unconditional skips, or silent catch paths. Run check and real suites. |
| TEST | Node-based unit checks validate failure boundaries; WebdriverIO drives the production Activity through real UiAutomator2 instrumentation. Retain nonzero test counts and JUnit XML. |
| SEC | Validate configuration, device/APK identity, loopback service defaults, artifact paths, no-reset policy, and opt-in private captures. Execute SEC-01/02 and runtime smoke; review no insecure options/secrets. |

## Impact Summary

| Layer | Files Affected | Change Type |
|---|---|---|
| Android UI / Presentation / Domain / Data / Navigation | None | None |
| Test infrastructure | All framework files listed below, under AppiumTest | New |
| Tests | Framework unit tests and Appium specs below | New |
| Delivery documents | docs/current/spec_v1.md, implementation_plan_v1.md, test_plan_v1.md, summary_v1.md | New/update |

## API Changes

- **Classification**: none.
- **Force update required**: no.
- **Fields added / removed / changed**: none.
- **OpenAPI Status**: no endpoint/DTO/schema change; no sharedContracts/openapi.yaml update or new endpoint acceptance claim.

## Files to Create

All paths below are relative to `/Users/hwdavr/Projects/2026_NotesTakingApp/AppiumTest/`.

| File | Purpose |
|---|---|
| package.json, package-lock.json | Pin a compatible dependency set; expose install/setup/check/test/report commands. |
| tsconfig.json | Strict TypeScript configuration; explicit WDIO/Mocha types and noEmit type checking. |
| eslint.config.mjs, .prettierrc.json, .prettierignore | Lint/format checks scoped to this framework. |
| .gitignore, .env.example | Ignore dependencies, local Appium home, local settings, APKs, and reports; document non-secret configuration. |
| wdio.conf.ts | Mocha suites, single-device concurrency, local/external server selection, capability construction, reporters, lifecycle hooks. |
| config/environment.ts | Typed environment loading/validation, deterministic relative-path resolution, conservative defaults. |
| config/capabilities.ts | Android UiAutomator2 capabilities, noReset/fullReset policy, bare Compose resource-ID setting. |
| scripts/setup-driver.ts | Install/verify a pinned UiAutomator2 version using framework-local APPIUM_HOME; idempotent for the exact version. |
| scripts/doctor.ts | Diagnose Node/Java/SDK/ADB/driver, selected device/API, debug app or supplied APK, locale, and server mode. Missing prerequisites exit nonzero. |
| support/artifacts.ts | Per-run artifact naming, screenshots, opt-in hierarchy capture, redacted metadata, failure/teardown handling. |
| support/app-state.ts | Identify supported entry state and require authenticated home without token/storage shortcuts. |
| screens/base.screen.ts | Small shared wait/tap/visibility helpers using native WDIO waits and fresh elements. |
| screens/onboarding.screen.ts | Existing onboarding signup/login IDs and assertions; do not invoke external authentication. |
| screens/home.screen.ts | Home FAB, creation-sheet labels/dismissal, and scoped bottom navigation. |
| screens/settings.screen.ts, screens/folders.screen.ts | Existing screen roots and navigation assertions; no setting mutations. |
| tests/specs/smoke/app-launch.spec.ts | Launch/app identity and recognized entry-state controls. |
| tests/specs/authenticated/home.spec.ts | Open/dismiss creation sheet without creating a note. |
| tests/specs/authenticated/navigation.spec.ts | Home → Settings → Home and Home → Folders → Home assertions. |
| tests/unit/configuration.test.ts | Invalid configuration, paths, endpoint security, reset policy. |
| tests/unit/preflight.test.ts | Missing/offline/ambiguous device and unsupported-runtime failures. |
| tests/unit/artifacts.test.ts | Opt-in hierarchy behavior and evidence errors preserving original failures. |
| README.md | Setup, prerequisites/platform matrix, commands, suite selection, selectors, extension examples, auth/networking requirements, reporting and troubleshooting. |

## Files to Modify

Only the four new docs/current v1 planning files will be updated with approval and actual verification evidence. No existing application, harness, requirement, or user file is modified.

## Files to Delete

None.

## UiState Design

Not applicable: no app screen or ViewModel state is created/modified. Runner-observed entry states are onboarding or authenticated home; unknown states fail within a bounded timeout.

## Test Plan

See [test_plan_v1.md](test_plan_v1.md). Implementation sequence:

1. Reconfirm approval, source requirements fingerprint, target contents, compatible package versions, and runtime prerequisites. Resolve final versions from official package metadata and commit the lockfile.
2. Implement install/config/preflight commands and local Appium driver home. Keep the server on loopback, permissions/reset behavior conservative, and maxInstances=1.
3. Implement small screen objects and real assertions using bare tag IDs and accessible-label selectors where required.
4. Implement smoke/authenticated suites plus reporters and capture hooks. Keep non-selected suites distinct from executed/skipped tests.
5. Implement the planned meaningful configuration/preflight/artifact checks. Run npm run check, then real smoke on an isolated emulator, then the authenticated suite when its login precondition exists.
6. Exercise one intentional assertion failure to validate the report/capture path; retain its expected nonzero result separately from passing acceptance evidence. Remove the temporary failing spec.
7. Document actual commands, exact versions, build/device/API fingerprints, test counts, limitations, and artifact paths. Reconcile source capability unchanged; do not claim unexecuted API levels/suites.

Proposed commands: npm ci; npm run setup:driver; npm run doctor; npm run check; npm test; npm run test:authenticated; npm run report:generate. npm run check groups typecheck, lint, format:check, and framework unit tests. It does not pretend to execute device tests.

## Explicit Assumptions

1. User-selected TypeScript + WebdriverIO takes precedence over the earlier Python suggestion.
2. Current UiAutomator2 requires API 26+; API 24/25 remain outside the verified stack. Verify the actual emulator API before execution.
3. Initial authenticated examples need an existing authorized login. If unavailable, deliver their source but record runtime acceptance blocked.
4. APK install is optional; default to the existing debug app when present and compatible. Preserve data and authentication.
5. No UI design stage is needed because the app itself is unchanged.

## Risks

1. Bare Compose tags may be auto-prefixed by UiAutomator2 — set disableIdLocatorAutocompletion=true and prove a real ID lookup.
2. Modal and bottom-nav nodes lack IDs — use scoped existing English accessibility labels, validate locale, and assert destination/outcome.
3. Missing prerequisites could masquerade as success — doctor and suite setup fail explicitly; zero tests/skips do not count as acceptance.
4. App auth and startup networking are external preconditions — use a dedicated test emulator isolated from production networking, preserve authentication, and avoid backend correctness claims.
5. Diagnostics can expose private screen content — local ignored artifacts, failure-only screenshots, no automatic protocol steps, opt-in hierarchy, no tokens or full environment dumps.
6. Dependency releases may require different Node/API levels — use one compatible WDIO family and locked Appium/driver versions; record actual verified support.
7. Missing Skill invocation mechanism — do not claim stage completion; require an explicit user-approved read-file fallback before implementation.

## Migration / Compatibility Notes

No Room migration, Android dependency change, release configuration change, or application API migration. Framework-local dependencies/APPIUM_HOME avoid global Appium changes. Run one worker per selected UDID. TypeScript execution uses tsx; typecheck runs separately with tsc --noEmit.

## Out of Scope

iOS, Auth0 browser/login automation, credential injection, note CRUD, backend mocking/contract tests, analytics assertions, visual/pixel acceptance, AI/voice service verification, exhaustive feature coverage, cloud device farms, hosted CI/publication, and Android/harness source changes.
