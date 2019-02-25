const SuperAppError = require(process.cwd() + '/lib/services/AppError.js')

class AppError extends SuperAppError {

  static sampleMethod() { return 'sampleMethod' }

}

module.exports = AppError
