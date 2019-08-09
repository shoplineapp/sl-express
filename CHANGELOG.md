# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]
- remove backward compatible code after plugin feature
- enchance the interface of Plugin
- do lazy loading on app.loadConfig
- app.config will use lazy loading pattern instead of checking in every function (mentioned by Jas)
- More powerful hooking for app phasing (mentioned By Philip)
- plugin appending properties to app is not appropriate (Ted)

## [ToBeReleased]
- code refactoring for executePluginPhase and asyncExecutePluginPhase (mentioned by Philip)

## [2.2.3] - 2019-08-09
### Fixed
- Fix SQS MessageQueue consume message issue 

## [2.2.2] - 2019-07-10
### Fixed
- Fix sl-express console async/await issue

### Added
- Add sl-express console with async/await mode

## [2.2.1] - 2019-07-09
### Fixed
- App Start prepare without async/await

## [2.2.0] - 2019-07-09
### Added
- SQS MessageQueue plugin
- Mongo Atlas plugin
- AcknowledgementCenter Plugin
- NotificationCenter Plugin
- bind center Plugin (hooking AcknowledgementCenter and NotificationCenter)
### Changed
- prepare become async function
- QueueTask plugin refactor
  - provide `register` for hooking event and handler
  - QueueTaskPlugin read config and regisster event and handler
  - TODO: move QueueTask from /service to plugin

## [2.1.2] - 2019-02-26
### Fixed
- plugin - queuetask - should init during prepare phase

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
