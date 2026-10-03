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

Frontend tests live next to their modules as `*.test.ts`. Shared setup and fixtures live in `tests/unit/`. Tauri commands and events are mocked at module boundaries; store tests use real Pinia instances. Save queue tests control timers and Promises to verify debounce, write ordering, and retries.

Rust tests live inside the crate to access internal APIs. SQLite runs against real files with foreign keys and WAL enabled, matching the application. Each test creates a separate directory through `tempfile` under `.artifacts/rust` and removes only the directory it owns. Tests do not use user databases or worlds.

UI tests use the application's `index.html` and `src/main.ts`. In mode `test-ui`, the entry loads IPC mocks from `tests/ui/harness.ts` before importing application modules, then follows the shared startup flow and initializes the selected test scenario. Mock setup and scenario initialization are excluded from normal builds. Playwright uses the shared `vite.config.ts`; mode `test-ui` disables generated declaration writes and excludes `temp` from file watching. All modes exclude `src-tauri` and `.artifacts` from file watching.

The desktop test build uses identifier `com.kazmas.desktop.tests`, WDIO permissions limited to the test configuration, and a separate workspace for each run. Automation plugins, the frontend bridge, and the test Save As command are enabled through the `desktop-tests` feature and the `VITE_DESKTOP_TESTS` build variable. The test Save As command calls the real backend and restricts its destination to the current test directory. This verifies persistence; interaction with the native Save As dialog requires manual verification.

Generated output lives under `.artifacts/`: coverage reports in `coverage/`, Playwright results and reports in `playwright/`, desktop packages and logs in `desktop/`, and isolated Rust data in `rust/`. Git, linting, formatting, and Vite file watching exclude this directory. Desktop tests retain generated packages and logs for investigation. Existing files in `temp` remain untouched.

## Screenshot Baselines

Baselines live in `tests/ui/snapshots`, separated by operating system and browser project. Windows Chromium baselines cover the empty application, editor, long titles, and dialogs in light and dark themes. Locale, timezone, viewport, fonts, and animations are controlled. Screenshot comparisons allow a small difference threshold for rasterization.

For intentional UI changes, run `pnpm test:ui:update`, visually inspect the new screenshots, and review the differences before adding them to Git. Do not update baselines merely to make tests pass. When adding a platform, generate and review its baselines on that platform.

## Automated Coverage

Backend tests cover SQLite schema and metadata, data constraints, Unicode JSON, node trees, deletion and restoration, purging, transaction rollback, save-close-reopen workflows, assets, Save As, write failures, invalid manifests and archive paths, and window ownership of projects.

Frontend tests cover trees and breadcrumbs, stale load results, world transitions, concurrent listener initialization, save confirmation branches, command failures, dialog validation, the 700 ms debounce, edits during active writes, document switching, unmounting, and out-of-order load responses. The editor mounts only when valid content is available; reported load and write errors use an alert role.

UI tests cover mouse and keyboard interactions, the toolbar, find and replace, formatting reset, trailing paragraphs, focus restoration after dialogs, sidebar resizing and collapsing, small windows, and scrolling long content. Desktop tests verify persistence through the UI, IPC, real SQLite databases, and real packages, including Save As, Save/Discard/Cancel choices, corrupt packages, and opening a project that already has a window.

## CI and Manual Release Checks

The `quality-checks.yml` workflow runs frontend tests with coverage, Rust tests on Windows and macOS, UI tests and screenshot comparisons on Windows, and desktop tests on Windows and macOS. The existing PR and release workflows call this workflow. Artifact uploads explicitly include hidden files so reports under `.artifacts` are retained. There is no global coverage threshold; reports identify untested business logic branches.

On each release operating system, manually verify native file selection and Save As dialogs, the title bar, operating system menus, the clipboard, Vietnamese input through an input method, display scaling at 125%/150%/200%, and closing or quitting with unsaved changes. Browser UI tests do not establish correctness of these native behaviors. macOS results require verification on a runner or an actual macOS machine.
