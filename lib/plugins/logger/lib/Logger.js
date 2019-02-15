class Logger {
  constructor(config) {
    this.serviceName = `${new Date().getTime()}`
    this.eventHandler = {}
    this.log4js = require('log4js')

    this.init(config)
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

    const logger = this.log4js.getLogger(category)

    logger[level](JSON.stringify(msg))

    this.callEventHandler('didLog', category, level, msg)
  }

  init(config) {
    if (!config) return

    this.serviceName = config.serviceName
    this.log4js.configure({
      appenders: config.appenders,
      categories: config.categories
    })
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

    handler(this, ...args) }
}

module.exports = Logger
