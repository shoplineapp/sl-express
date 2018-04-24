module.exports = {

  serviceName: process.env.LOGGER_SERVICE_NAME || 'app',

  appenders: {
    console: { type: 'console', layout: { type: "pattern", pattern: "%m" } }
  },

  categories: {
    default: { appenders: ['console'], level: 'debug' }
  }

}

