const Logger = require('./Logger.js')

class LoggerPlugin {
  didLoadFramework(app) {
    const {
      config,
    } = app

    app.logger = new Logger(config.logger)

    Object.assign(
      app.context,
      { log: app.logger.log.bind(app.logger) }
    )
  }

  prepare(app) {

  }

  async connectDependencies(app) {

  }

  async disconnectDependencies(app) {

  }

  async willStartService(app) {
  }

  async didStartService(app) {

  }
}

module.exports = LoggerPlugin
