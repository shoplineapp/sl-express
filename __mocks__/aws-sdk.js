const SQS = require('./SQS.js')
const TokenFileWebIdentityCredentials = require('./TokenFileWebIdentityCredentials')

const AWS = jest.genMockFromModule()

AWS.SQS = SQS
AWS.TokenFileWebIdentityCredentials = TokenFileWebIdentityCredentials

module.exports = AWS
