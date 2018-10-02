class Logger {
  constructor() {
    this.serviceName = `${new Date().getTime()}`
    this.eventHandler = {}
  }

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
    Logger.sharedLogger.log(category, level, message)
  }

  log(category, level, message) {
    const timestamp = new Date

    const msg = {
      ...message,
      serviceName: this.serviceName.toLowerCase(),
      logCategory: category.toLowerCase(),
      timestamp: timestamp,
      readableTime: timestamp.toUTCString(),
      logLevel: level,
    }

    const logger = Logger.log4js.getLogger(category)

    logger[level](JSON.stringify(msg))

    this.callEventHandler('didLog', category, level, msg)
  }

  init(config) {
    this.serviceName = config.serviceName
    Logger.log4js.configure({ appenders: config.appenders, categories: config.categories })
  }

  on(event, handler) {
    if (!handler || typeof handler !== 'function') {
      return
    }

    this.eventHandler[event] = handler
  }

  callEventHandler(event, ...args) {
    const handler = this.eventHandler[event]

    if (!handler || typeof handler !== 'function') {
      return
    }

    handler(this, ...args)
  }
}

module.exports = Logger
