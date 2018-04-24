let _sharedLogger = null
let _log4js = null

class Logger {

  static get log4js() {

    if (!_log4js) {

      _log4js = require('log4js')

    }

    return _log4js

  }

  static get sharedLogger() {

    if (!_sharedLogger) {

      _sharedLogger = new Logger()

    }

    return _sharedLogger

  }

  static log(category, level, message) {

    let sharedLogger = Logger.sharedLogger

    let timestamp = new Date

    message.serviceName = sharedLogger.serviceName.toLowerCase()
    message.logCategory = category.toLowerCase()
    message.timestamp = timestamp
    message.readableTime= timestamp.toUTCString()

    let logger = this.log4js.getLogger(category)

    logger[level](JSON.stringify(message))

  }

  init(config) {

    this.serviceName = config.serviceName
    Logger.log4js.configure({ appenders: config.appenders, categories: config.categories })

  }

}

module.exports = Logger
