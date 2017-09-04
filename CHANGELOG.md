# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.4.0] - 2017-09-04
### Changed
- Concurrent.timeout function now accepts both error message and callback
- Slf4j now substitutes placeholders with everything, including errors.
Placeholders are filled with short representations, off-placeholder 
parameters are using long representations, so in most occasions 
behavior hasn't changed. See README.md for clarification.
- Slf4j now uses custom `.toString()` method for representations (if it 
is present)
- Slf4j now demands Logger only in the last moment, allowing to 
instantiate default context and Slf4j itself without `global.Logger`
being present.

No breaking changes should be introduced by this release, however, 
too much of internals have been altered for a patch release.

## [0.3.0] - 2017-08-21
### Added
- Timeouts for HTTP clients & integration for revamped Slf4j
- Added Promise-compatible .Concurrent.Future class
- .Concurrent.timeout functions
- Added .Concurrent.TaskQueue class, which allows sequential task execution
- Slf4j now provides static methods to create and manage loggers
### Changed
- Slf4j Factory has been substituted with Context class

## [0.2.0] - 2017-02-26
### Added
- Basic HTTP client
- Completely different REST client
### Changed
- Removed old REST client
- Refactored HTTP exceptions
- Dropped deprecated functionality

## [0.1.3] - 2017-02-24
### Changed
- Technical release, only Circle CI configuration is touched

## [0.1.2] - 2017-02-24
### Changed
- Technical release, only Circle CI configuration is touched

## [0.1.1] - 2017-02-24
### Added
- SLF4J-alike Logger `.setThreshold()` method and `Factory` class
- Deprecated `toLevel`, `toThreshold` and `Threshold` in
`logger.slf4j`, `Method` in `http.rest`
- Added `logger.Level` and `http.Method` to replace deprecated symbols

## [0.1.0] - 2017-02-14
### Added
- HTTP REST client
- Logger common functionality
- SLF4J-alike Logger
