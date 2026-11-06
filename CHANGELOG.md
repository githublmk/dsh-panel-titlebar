# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.4] - 2026-11-06

### Fixed

- A code reload without a document reload keeps the previous instance's
  `<style>` tag in the head, and `apply` treated any existing tag as "already
  installed" and returned without writing. The page then ran the new module
  against the old sheet: 0.3.2's sheet has no seat rule, so the hoisted dock
  stayed captured by the composer seat and the landed-box check fell back to
  the shipped place below the composer. The tag is now rewritten on every load
  and claimed by the instance that wrote it, so a teardown drops only its own.
- The landed-box check no longer counts a dock that has no box yet as a miss,
  needs three consecutive misses instead of two, and records the outcome in
  `data-dsh-statbar-state` for a field diagnosis.

## [0.3.3] - 2026-11-06

### Fixed

- The session stats stay in the View tab row on Harness `0.2.2` again. That
  release promotes the sticky composer seat with `will-change: transform`,
  which also makes the seat the containing block for fixed descendants: the
  hoisted dock resolved its `top`/`left` against the seat instead of the
  viewport and dropped back onto the composer, half over the input card and
  unable to be read as a header readout. The stylesheet now withdraws that hint
  while `data-dsh-statbar` is set, and each measurement pass checks that the
  dock actually landed on the measured seat. Two consecutive misses (a build
  capturing the fixed box by a real `transform` or `contain`) drop the marker,
  so the stats fall back below the composer instead of overlapping it.

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
