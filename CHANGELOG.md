# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]
- remove backward compatible code after plugin feature
- enchance the interface of Plugin
- do lazy loading on app.loadConfig
- app.config will use lazy loading pattern instead of checking in every function (mentioned by Jas)
- code refactoring for executePluginPhase and asyncExecutePluginPhase (mentioned by Philip)
- More powerful hooking for app phasing (mentioned By Philip)
- plugin appending properties to app is not appropriate (Ted)

## [2.1.1] - 2019-02-25
### Fixed
- Error when plugin doesn't provide connectDependencies or disconnectDependencies

## [2.1.0] - 2019-02-25
### Added
- New plugin feature (read README.md for HOW-TO-USE)

### Changed
- Logger exists as a plugin
- Mongo exists as a plugin
- Redis exists as a plugin
- MessageQueue exists as a plugin
- QueueTask exists as a plugin
- app.config.plugins as an array to enable the plugins, Please read the README.md for details
- Plugin-ized feature will still be exported by the sl-express

### Removed
- mongo connection in App.js, please setup plugin instead
- redis connection in App.js, please setup plugin instead
- messageQueue connection in App.js, please setup plugin instead
