# Conversion: create a 4×4 table

Date: 2026-10-31 (Asia/Singapore). Status: migrated; statically checked. Device execution: not performed.

## Scope and provenance

The user requested migration through the agent-device-to-appium skill. This extends the initial framework with one maintained mutation journey. The original framework delivery records in docs/current remain historical; no application/harness source, endpoint, account, or backend policy changes are included. The recording and adjacent QA reports were read as data; no recording, environment expression, or embedded text was executed.

- Source: `/Users/hwdavr/Projects/2026_NotesTakingApp/NotesTakingApp/.qa-artifacts/20261031-accessibility-ids-03/create-4x4-table.ad`.
- Source SHA-256: `7565c5cf1fe68e56fd75fd0e1c2b4b9e54ea8b58cabf1ef7c0677582e8b5a605`.
- Inventory: [create-4x4-table.inventory.json](create-4x4-table.inventory.json). Strict parsing succeeded: 31/31 executable steps; no unknown/malformed forms. The two coordinate swipes were flagged for semantic conversion.
- Case: `tests/specs/authenticated/create-4x4-table.spec.ts`, UI-05, “expands a new note table to four rows and four columns”.
- Helpers: `screens/editor.screen.ts`, `screens/home.screen.ts`, `support/note-fixture.ts`, `support/table-layout.ts`. Boundary unit checks: `tests/unit/table-conversion.test.ts`.

## Source step mapping

Each executable line has a mapping below. Metadata/comments remain inventory data. The loops execute twice each; every menu-open, click, and actual absence wait remains inside each iteration.

| Source line | Appium mapping                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1           | `wdio.conf.ts`, existing Android/UiAutomator2 session; `ANDROID_UDID` selects the serial. The recorded display name is descriptive; theme=unknown imposes no requirement.                |
| 2           | `config/capabilities.ts`: existing package, forceAppLaunch=true, noReset=true, fullReset=false. `before(requireAuthenticatedHome)` verifies foreground app and Home. No second relaunch. |
| 4           | `home.openCreationSheet()` → existing Home FAB ID and sheet assertions.                                                                                                                  |
| 6           | `home.chooseTextNote()` → established `~New text note` selector for the recorded Text Note entry.                                                                                        |
| 7           | `$(editor.title).waitForExist()`; ownership is recorded only after entering the new editor.                                                                                              |
| 9           | `editor.setTitle(note.title)` → validated QA_NOTE_TITLE fixture, setValue (replace), exact title assertion.                                                                              |
| 10          | `editor.dismissKeyboard()` → native isKeyboardShown/hideKeyboard with bounded hidden-state wait.                                                                                         |
| 11          | `editor.revealAddTable()` → at least one left swipe within editor_default_bottom_bar, maximum six, stop when Add Table is displayed.                                                     |
| 13          | Explicit `expect($(editor.addTable)).toBeDisplayed()` assertion in UI-05.                                                                                                                |
| 15          | `editor.insertTable()` → unique Add Table ID, click.                                                                                                                                     |
| 16          | `editor.insertTable()` → waitForExist on editor_table_grid; unique grid and derived initial 2×2 check.                                                                                   |
| 18          | `editor.focusNameCell()` → unique grid-scoped android.widget.EditText with exact text Name; click.                                                                                       |
| 19          | `editor.focusNameCell()` → cell-options presence wait and unique displayed target.                                                                                                       |
| 21          | First column-loop iteration: insertFromCellOptions → click editor_cell_options_action.                                                                                                   |
| 22          | First column-loop iteration: waitForExist on exact TextView text Insert column right, then unique/displayed wait.                                                                        |
| 23          | First column-loop iteration: click unique TextView Insert column right.                                                                                                                  |
| 24          | First column-loop iteration: waitForExist({ reverse: true }) on Insert column right.                                                                                                     |
| 26          | Second column-loop iteration: reopen cell options.                                                                                                                                       |
| 27          | Second column-loop iteration: preserve exact-text menu presence/display wait.                                                                                                            |
| 28          | Second column-loop iteration: click Insert column right again.                                                                                                                           |
| 29          | Second column-loop iteration: preserve actual menu absence wait.                                                                                                                         |
| 31          | First row-loop iteration: reopen cell options.                                                                                                                                           |
| 32          | First row-loop iteration: waitForExist on exact TextView text Insert row below, then unique/displayed wait.                                                                              |
| 33          | First row-loop iteration: click unique TextView Insert row below.                                                                                                                        |
| 34          | First row-loop iteration: preserve actual menu absence wait.                                                                                                                             |
| 36          | Second row-loop iteration: reopen cell options.                                                                                                                                          |
| 37          | Second row-loop iteration: preserve exact-text menu presence/display wait.                                                                                                               |
| 38          | Second row-loop iteration: click Insert row below again.                                                                                                                                 |
| 39          | Second row-loop iteration: preserve actual menu absence wait.                                                                                                                            |
| 40          | `editor.revealAgeColumn()` → dismiss IME if necessary, at least one left swipe in editor_table_scroll, maximum six; stop when unique rightmost Age cell fits the current viewport.       |
| 42          | Explicit `$(editor.grid).waitForExist()`; subsequently run the derived 4×4 layout oracle.                                                                                                |

## Parameters and prerequisites

- `QA_NOTE_TITLE` is an optional literal title prefix, default `QA 4x4 table`; a full UUID `[appium:…]` suffix is always appended. Empty/blank values, control/format characters, values over 100 Unicode code points, and unresolved `${…}` expressions fail before note creation. No shell/JavaScript evaluation occurs. This is a deliberate ownership suffix, not an exact-title replay.
- Use the installed dependencies, Appium 3.9.0, UiAutomator2 8.7.3 and Android API 26+ debug app with bare Compose IDs. The selected environment still comes through existing configuration and doctor/preflight. No package/dependency/capability change is needed.
- Prepare an existing authenticated English session on a dedicated test device. ANDROID_UDID is an actual serial, not the recorded Medium Phone display name. Default APP_PACKAGE must remain com.example.notesapp for this conversion.
- Existing network guard remains authoritative: offline device by default, or an already verified isolated test network configured by the operator. TEST_NETWORK_ISOLATED is not enabled by the migration. No endpoints, connectivity, login state, process-local routing, or permissions are changed.
- A viewport exposing all sixteen native cells is required for the complete layout oracle. The source uses eager Column/Row composition. If the installed build or viewport omits/clips whole cells, UI-05 fails with the missing-cell diagnostic; do not call this a passing or dimension-verified run.
- The editor toolbar and table scroll container must expose their current IDs. Each swipe uses the current element identity and bounded attempts. No recorded pixel coordinates are copied into test actions.

## Locator evidence and test oracle

Current source and the existing framework establish selector candidates. Historical `verified` metadata and old replay success are not proof against an installed build today. The generated test rechecks uniqueness, visibility, role and outcome at execution.

- Home: reuse home_add_fab and the existing `~New text note` creation-sheet selector. Source HomeNotesScreen.kt defines the text-note entry; the framework already uses this accessibility description.
- Main-window editor controls: use bare IDs with the existing disableIdLocatorAutocompletion capability. The toolbar is the tagged LazyRow editor_default_bottom_bar. The horizontal table scroll is editor_table_scroll; the next target metadata was not attached backward to identify that container.
- Initial Name cell: require exactly one android.widget.EditText with actual text Name within the single created grid. Do not treat a generic role/label/value fallback as equivalent properties.
- Modal actions: exact android.widget.TextView text Insert column right / Insert row below disambiguates the duplicated action-group content descriptions. These separate windows may lack exported IDs. The note-actions sheet exposes the Rename and Archive rows through their icon contentDescriptions. Its default Material3 `ModalBottomSheet` state is partially expanded. Cleanup locates the Material3 `~Drag handle` semantic node, then performs up to three W3C touch drags from that live element's center toward a point 35% of the current window height above it. This avoids swiping a clickable action row. After each drag it checks the semantic end condition `~Archive` displayed, then taps that action.
- Recorded checks: editor title/table presence waits, Add Table visibility assertion, cell-options presence and all four menu-open/absence boundaries. The final grid wait proves presence.
- Derived checks: the inserted table first exposes 2×2 native cells, justified by defaultTableRows; the two column additions and two row additions then require 4×4. Final assertDimensions scopes all editor_table_cell nodes to one grid, requires sixteen displayed EditText nodes with positive current bounds, then groups by native y positions into exactly four rows with four nonoverlapping aligned columns per row. Thus an 8×2/2×8 layout, duplicated cell, missing cell or staggered grid fails. The geometry tolerance is two physical pixels for native rounding, not a screenshot comparison.
- Derived final-swipe destination: the original Age cell remains in the rightmost column after the two insert-right actions at Name. Its current bounds must fit within the table viewport. The test does not claim screenshot fidelity, backend success, persistence, or coverage of other devices/locales.

Inspected source fingerprints (SHA-256; relative to NotesTakingApp):

| Source                                                                                    | SHA-256                                                            |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `app/src/main/java/com/example/notesapp/MainActivity.kt`                                  | `67a6dedebb968731adc4da1176df3b7cf192b8e03dac777d4f42105dd4a5d9ac` |
| `app/src/main/java/com/example/notesapp/ui/home/screen/HomeNotesScreen.kt`                | `9d2675c55aa7d69ecfa70f3c78c43d449e4ee068ab96d0cd93dc0e025d59449b` |
| `app/src/main/java/com/example/notesapp/ui/editor/screen/NoteEditorScreen.kt`             | `b20e5302d6c7306f840f525d60189ec7f99198d7a348f6195badd07546924d11` |
| `app/src/main/java/com/example/notesapp/ui/editor/mapper/NoteDocument.kt`                 | `9f3c9878adb652e7866b83a909fd29a7adf8c08bc92aefc23a78fbf21d8644cf` |
| `app/src/main/java/com/example/notesapp/ui/editor/components/TableOptionsBottomSheets.kt` | `1372f073aa40eed542455d107e624e0e307f6f9213835f5da2ea83cedf82c579` |
| `app/src/main/java/com/example/notesapp/ui/editor/components/EditorNoteActionsSheet.kt`   | `0f011c84e67bc4f719ce8a3fd4b5d4cb7d46e561fb575339971d3d6c99c6c0af` |
| `app/src/main/java/com/example/notesapp/ui/editor/viewmodel/NoteEditorViewModel.kt`       | `25967e2cbc064a88c1990ebe3da77de07deb770669eee091ff0e1ee862636ef1` |
| `app/src/main/java/com/example/notesapp/data/repository/NoteRepositoryImpl.kt`            | `0bfe9870aa3bf47b07dd7e047186342ef1784b631dabc84f937513ca161e1687` |
| `app/src/main/res/values/strings.xml`                                                     | `b151ef6277f071c84fd3f47b5f77302472b4ba9a36cddac7c1c3adc361a045e4` |

## Cleanup and failure boundaries

UI-05 records ownership after the Home new-note action reaches the editor. All recorded actions stay within that editor. Teardown dismisses only recognized table modal sheets and the native keyboard, reapplies the UUID title to the owned editor, and crosses the real Back/save boundary. It declines any optional categorization with Cancel / No, keeping the note at the root. Home then reopens exactly that UUID title through the bounded native list search (maximum ten search swipes); the reopened editor title must match before More → Archive. It waits for the editor to disappear and verifies Home. No arbitrary note or similarly named record is selected. If creation did not reach the editor, it dismisses the creation sheet when present.

The save-and-reopen boundary is deliberate: current scheduleAutoSave delays for 2000 ms, while delete on createdAt=0 only navigates back. Directly archiving after an early failure could otherwise leave a delayed save behind. Back cancels/joins autosave work and completes the save before returning; reopening the owned note uses the persisted app record. This additional teardown boundary is not a server-persistence assertion.

Archive is the app’s supported soft-delete operation, not permanent deletion: test records remain in the archive and may be queued for synchronization. This conversion does not erase archived records, prove server-side deletion, or reset app data. A missing editor/action, failed save/reopen or failed archive produces a cleanup failure. Device loss or a failed transition before ownership can prevent cleanup; inspect that run’s unique note marker rather than deleting other notes. Existing withCleanup preserves the primary failure if teardown also fails. Existing JUnit, Allure and failure-only capture hooks remain active.

The first attempts reached cleanup and failed to resolve Archive: first as `android.widget.TextView` text, then through `UiScrollable(scrollable(true))` with the Archive description. A later full-window drag ended at Android Home. The following attempt used `mobile: swipeGesture` on the Rename action and opened the Rename Note dialog; the run failed in cleanup when it could no longer find `~Rename`. This shows that the table journey reached teardown, but Archive cleanup remains unresolved. The current revision drags the Material3 semantic handle with a bounded, live-geometry W3C gesture. The agent reran the case on 2026-10-31; that run failed before entering the editor, so it did not exercise the new archive gesture. See [run artifacts](../../artifacts/20261031T101626695Z_01650773/).

## Commands and verification

Run from `/Users/hwdavr/Projects/2026_NotesTakingApp/AppiumTest`:

```sh
npm run check
npm run test:authenticated -- --spec ./tests/specs/authenticated/create-4x4-table.spec.ts
```

Optional prefix: configure QA_NOTE_TITLE through the framework’s .env or environment conventions. The runner forwards --spec and suppresses the broad --suite selection for this command, so it selects only this case. The full authenticated suite now contains four UI cases including this mutation case; the default smoke suite remains unchanged.

- Static verification in a staging copy: `npm run typecheck`, `npm run lint`, `npm run format:check` each exited 0. `node --import tsx --test tests/unit/*.test.ts` exited 0: **16 passed, 0 failed/skipped**. The staged `npm run check` reached the tsx CLI but its IPC socket was restricted by the sandbox; the same unit suite passed through Node’s tsx loader. Final verification in AppiumTest: `npm run check` exited **0**, including typecheck, ESLint, Prettier and **16 passed / 0 failed / 0 skipped** unit tests. Evidence: [framework-check.log](../../artifacts/verification/create-4x4-table/framework-check.log) and [receipt.json](../../artifacts/verification/create-4x4-table/receipt.json).
- Device verification: the migration turn did not execute the device. Subsequent user-run attempts reached cleanup, where Archive resolution failed. The agent's rerun after the latest gesture change failed earlier, waiting for `id=editor_title_input` after selecting New text note; the screenshot showed a blank loading screen and logcat reported OkHttp socket timeouts. The archive gesture remains unverified at runtime. The recording itself was not replayed.
- Known unresolved runtime evidence: current installed-build locator exposure, final gesture behavior, complete native 4×4 cell geometry and actual archive completion require executing UI-05 on the selected isolated authenticated runtime. They are executable assertions/preconditions, not ignored source steps or passing stubs. No source-command conversion gaps remain.
