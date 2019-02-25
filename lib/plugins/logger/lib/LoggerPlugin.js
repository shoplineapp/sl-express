const Logger = require('./Logger.js')

class LoggerPlugin {
  didLoadFramework(app) {
    const {
      config,
    } = app

    app.logger = new Logger(config.logger)

    Object.assign(
      app.context,
      {
        log: app.logger.log.bind(app.logger),
        // for backward-compatibility
        Logger: {
          log: app.logger.log.bind(app.logger)
        }
      }
    )

  }
}

module.exports = LoggerPlugin
