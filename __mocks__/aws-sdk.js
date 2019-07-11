const SQS = require('./SQS.js')

const AWS = jest.genMockFromModule()

AWS.SQS = SQS

module.exports = AWS
