const SuperLogger = require(process.cwd() + '/lib/services/Logger.js')

class Logger extends SuperLogger {

  static sampleMethod() { return 'sampleMethod' }

}

module.exports = Logger
