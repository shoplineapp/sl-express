class Logger {
  static get log4js() {
    if (!this.log4jsLib) {
      this.log4jsLib = require('log4js')
    }

    return this.log4jsLib
  }

  static get sharedLogger() {
    if (!this.sharedLoggerInstance) {
      this.sharedLoggerInstance = new Logger()
    }

    return this.sharedLoggerInstance
  }

  static log(category, level, message) {
    const sharedLogger = Logger.sharedLogger

    const timestamp = new Date

    message.serviceName = sharedLogger.serviceName.toLowerCase()
    message.logCategory = category.toLowerCase()
    message.timestamp = timestamp
    message.readableTime= timestamp.toUTCString()
    message.logLevel = level

    const logger = this.log4js.getLogger(category)

    logger[level](JSON.stringify(message))
  }

  init(config) {
    this.serviceName = config.serviceName
    Logger.log4js.configure({ appenders: config.appenders, categories: config.categories })
  }
}

module.exports = Logger
