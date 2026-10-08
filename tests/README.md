# Testing Kazmas

## Tools and Commands

Use the Node.js and pnpm versions specified in `package.json`, stable Rust for compilation, and nightly Rust for formatting. Install test dependencies with `pnpm install`. Frontend tests use Vitest, Vue Test Utils, and jsdom; UI tests use Playwright Chromium; desktop tests use WebdriverIO and the embedded Tauri WebDriver.

| Command                                 | Scope                                                           |
| --------------------------------------- | --------------------------------------------------------------- |
| `pnpm test`                             | Run frontend tests in watch mode                                |
| `pnpm test:run`                         | Run frontend tests once                                         |
| `pnpm test:coverage`                    | Run frontend tests and generate coverage reports                |
| `pnpm test:types`                       | Check application, test, and configuration types                |
| `pnpm test:rust`                        | Run Rust tests with real SQLite databases and packages          |
| `pnpm exec playwright install chromium` | Install the test browser                                        |
| `pnpm test:ui`                          | Run UI interaction and screenshot comparison tests              |
| `pnpm test:ui --grep-invert visual`     | Run interaction tests on platforms without screenshot baselines |
| `pnpm test:desktop:build`               | Build Tauri with the `desktop-tests` feature                    |
| `pnpm test:desktop`                     | Run desktop workflows against the real backend                  |

## Organization and Data Isolation

Frontend tests live next to their modules as `*.test.ts`. Shared data fixtures live in `tests/support/`; Vitest setup and IPC mocks live in `tests/unit/`. The desktop automation bridge and its Vitest tests live in `tests/desktop/`. Tauri commands and events are mocked at module boundaries; store tests use real Pinia instances. Save queue tests control timers and Promises to verify debounce, write ordering, and retries.

Rust tests live inside the crate to access internal APIs. SQLite runs against real files with foreign keys and WAL enabled, matching the application. Each test creates a separate directory through `tempfile` under `.artifacts/rust` and removes only the directory it owns. Tests do not use user databases or worlds.

UI tests use their own HTML entry at `tests/ui/index.html`, which loads `tests/ui/main.ts`. Playwright opens that HTML file with the selected scenario in its query string. The test entry loads IPC mocks from `tests/ui/harness.ts` before importing `src/main.ts`, waits for application startup, and initializes the selected test scenario. The application's `index.html` and `src/main.ts` contain no test setup or test imports. Playwright uses the shared `vite.config.ts`; mode `test-ui` scans the test HTML for dependencies, warms up both entry modules, disables generated declaration writes, and excludes `temp` from file watching. All modes exclude `src-tauri` and `.artifacts` from file watching.

The desktop test build uses identifier `com.kazmas.desktop.tests`, WDIO permissions limited to the test configuration, and a separate workspace for each run. The test Tauri configuration runs `scripts/build-desktop-tests.js --frontend-only` before compilation. It builds `tests/desktop/index.html` through the shared `vite.config.ts` in mode `test-desktop`, with the repository root unchanged, and writes assets to `.artifacts/desktop/frontend`. The script copies the generated HTML to `index.html` at the output root for Tauri to load. The HTML loads `tests/desktop/main.ts`; that entry loads the automation plugin before importing `src/main.ts`, waits for application startup, and loads the frontend bridge. Backend automation and the test Save As command are enabled through the `desktop-tests` feature. The test Save As command calls the real backend and restricts its destination to the current test directory. This verifies persistence; interaction with the native Save As dialog requires manual verification.

Generated output lives under `.artifacts/`: coverage reports in `coverage/`, Playwright results and reports in `playwright/`, desktop packages and logs in `desktop/`, and isolated Rust data in `rust/`. Git, linting, formatting, and Vite file watching exclude this directory. Desktop tests retain generated packages and logs for investigation. Existing files in `temp` remain untouched.

After a successful desktop test build, the build script copies the executable to `.artifacts/desktop/bin`. WebdriverIO uses that copy, so rebuilding the normal development executable cannot change which application the tests launch. Each desktop test closes additional windows, dismisses active dialogs, flushes pending writes, and closes its world through the test bridge. Cleanup failures are reported instead of silently ignored.

Playwright workspace fixtures open scenarios, wait for the test bridge, check platform controls, and wait for fonts. An automatic fixture records `pageerror` events, attaches diagnostics, and fails on unexpected JavaScript errors. The exact browser message `ResizeObserver loop completed with undelivered notifications.` is retained in diagnostics without failing the test; it occurs during the existing sidebar resize interaction. The IPC harness rejects unknown commands and uses structured backend errors for failed reads and writes. Delayed document reads are released explicitly by the test.

## Screenshot Baselines

Baselines live in `tests/ui/snapshots`, separated by operating system and browser project. Windows and macOS Chromium baselines cover the empty application, editor, long titles, and dialogs in light and dark themes. Locale, timezone, viewport, fonts, and animations are controlled. Screenshot comparisons allow a small difference threshold for rasterization. Playwright passes its host platform to the Vite test server through `VITE_UI_TEST_PLATFORM`; the harness maps it to Tauri's platform name and fails when it is missing or unsupported. macOS screenshots render the macOS frontend branch, without the in-window menu or custom window controls. Native menu-bar items and traffic-light controls are outside browser screenshots and require desktop verification.

Interaction tests assert that the in-window File menu and Close window control are absent on macOS and visible on Windows. The macOS dialog test dispatches a mocked `menu-command` event through the application's native-menu listener, validates the dialog, and checks focus restoration to the previously focused workspace control. This verifies the frontend response to a native menu event, not an actual click on the system menu bar.

For intentional UI changes, run `pnpm test:ui:update`, visually inspect the new screenshots, and review the differences before adding them to Git. Do not update baselines merely to make tests pass. When adding a platform, generate and review its baselines on that platform.

## Automated Coverage

Backend tests cover SQLite schema and metadata, data constraints, Unicode JSON, node trees, deletion and restoration, purging, transaction rollback, save-close-reopen workflows, assets, Save As, write failures, invalid manifests and archive paths, and window ownership of projects.

Frontend tests cover trees and breadcrumbs, stale load results, world transitions, concurrent listener initialization, save confirmation branches, command failures, dialog validation, the 700 ms debounce, edits during active writes, document switching, unmounting, and out-of-order load responses. The editor mounts only when valid content is available; reported load and write errors use an alert role.

UI tests cover mouse and keyboard interactions, the toolbar, find and replace, formatting reset, trailing paragraphs, focus restoration after dialogs, sidebar resizing and collapsing, small windows, scrolling long content, load failures, write retries, delayed responses, and code block language persistence. Desktop tests verify persistence through the UI, IPC, real SQLite databases, and real packages, including Save As, Save/Discard/Cancel choices, corrupt packages, and opening a project that already has a window. Formatted content is saved through the File menu on Windows and the unsaved-changes dialog on macOS. The duplicate-window test checks window ownership and window count; it does not assert operating-system focus.

## CI and Manual Release Checks

The `quality-checks.yml` workflow runs frontend tests with coverage, Rust tests on Windows and macOS, UI tests and screenshot comparisons on Windows and macOS, and desktop tests on Windows and macOS. UI and desktop artifacts include the matrix operating system in their names. The existing PR and release workflows call this workflow. Artifact uploads explicitly include hidden files so reports under `.artifacts` are retained. There is no global coverage threshold; reports identify untested business logic branches.

Coverage includes stores, actions, menus, dialogs, providers, features, Tiptap extensions, and the document save queue. Generated files and test infrastructure are outside the report. Browser and desktop test execution is not included in Vitest coverage. CI checks application, test, and configuration types together with `pnpm test:types`.

On each release operating system, manually verify native file selection and Save As dialogs, the title bar, operating system menus, the clipboard, input method composition, display scaling at 125%/150%/200%, and closing or quitting with unsaved changes. Browser UI tests do not establish correctness of these native behaviors.
