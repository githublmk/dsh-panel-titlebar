# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-11-03

### Fixed

- The periodic alignment pass no longer forces a style/layout flush in the middle
  of a view mount. It runs in a `requestIdleCallback` (2000 ms timeout) instead of
  synchronously from the interval; resize and mutation paths still measure at once.

  Measured on the 400-step session that reported the lag, from `selectPanel(null)`
  to the conversation being back:

  | build | cycle 1 | cycle 2 |
  | --- | --- | --- |
  | plugin disabled (baseline) | 566 ms | 658 ms |
  | 0.3.1 (interval forces layout) | 854 ms | 845 ms |
  | 0.3.2 (idle measurement) | 593 ms | 635 ms |

  Opening a panel stayed at ~50鈥?60 ms in every build, so the remaining wait is the
  harness remounting the conversation view, not the toggle.

## [0.3.1] - 2026-11-03

### Changed

- The entry toggle now cancels on `pointerdown` instead of waiting for `click`, so
  the switch back to the conversation starts on the press, up to a full click delay
  earlier. The pressed row dims at once (`data-dsh-pending`) while the panel tears
  down, and the follow-up click is swallowed so the shipped handler cannot
  re-select it. Keyboard activation keeps the click path.
- The chrome alignment poll runs once per second, and never while the document is
  hidden; both reads force a style/layout flush.

## [0.3.0] - 2026-11-03

### Added

- Move the session stats (turn/step counts, decode speed, token total, cache hit and
  the context meter) from the composer dock below the input into the View tab row,
  right after its More launcher. The dock keeps its own registration and its own
  dialogs; only its seat is measured into place (`--dsh-statbar-top`,
  `--dsh-statbar-left`), and the marker is dropped whenever the anchor is missing so
  the stats fall back to their shipped place.

## [0.2.0] - 2026-11-03

### Added

- Clicking the already selected panel entry returns to the conversation
  (`layout.selectPanel(null)`), so the caption entries work as a toggle instead of
  re-selecting the panel that is already open. The click is swallowed before the
  shipped handler re-selects the panel, and the More launcher still opens its menu.

## [0.1.0] - 2026-11-03

### Added

- Move the sidebar's global panel navigation (`sidebar.panellist`: Plugins, Market,
  Schedules, Context insight, Memory, More) into the Windows caption row, right after
  the Application and Edit menus, and reclaim its vertical space in the sidebar.
- Keep the shipped registration intact: icons, labels, active state, click routing,
  the More launcher and its pin/unpin menu are untouched.
- Scope every rule to `html[data-windows-titlebar]`, so the plain Web GUI keeps the
  shipped vertical list.
- Measure the caption menubar's right edge into `--dsh-panel-titlebar-left` and keep it
  current across sidebar collapse, locale change and window resize.
- Ship Plugin Manager display metadata (English and Chinese), an exported icon, a
  static contract test suite and a CI workflow.

[Unreleased]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/githublmk/dsh-panel-titlebar/releases/tag/v0.1.0
