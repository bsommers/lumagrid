# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Role-based field props `valueField` and `idField` on `NativeChartProps`; `labelField` and `colorField` are now documented role props.
- `HorizontalBarChart` accepts `valueField` (bar length) and `labelField` (bar label).

### Changed

### Deprecated

- `NativeChartProps.xField` and `NativeChartProps.yField` are deprecated and will be removed in 2.0. On `HorizontalBarChart`, `xField` maps to `valueField` and `yField` maps to `labelField`. When both a role name and its alias are passed, the role name wins. No runtime warning is emitted.

### Fixed

## [0.1.0]

- Baseline: four layers (theme, transforms, registry/core, viz/plugins), seven native charts, D3/Recharts/Nivo adapters, a coverage-gated test suite, lint, and an `examples/` app.
