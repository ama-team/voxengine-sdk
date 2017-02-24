# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- SLF4J-alike Logger .setThreshold() method and Factory class
- Deprecated `Level`, `toLevel`, `toThreshold` and `Threshold` in
`logger.slf4j`, `Method` in `http.rest`
- Added `logger.Level` and `http.Method` to replace deprecated symbols

## [0.1.0] - 2017-02-14
### Added
- HTTP REST client
- Logger common functionality
- SLF4J-alike Logger