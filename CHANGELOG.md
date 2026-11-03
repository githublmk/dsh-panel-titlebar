# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/githublmk/dsh-panel-titlebar/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/githublmk/dsh-panel-titlebar/releases/tag/v0.1.0
