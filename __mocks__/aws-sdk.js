const SQS = require('./SQS.js')
const Credentials = require('./Credentials')
const TokenFileWebIdentityCredentials = require('./TokenFileWebIdentityCredentials')

const AWS = jest.genMockFromModule()

AWS.SQS = SQS
AWS.Credentials = Credentials
AWS.TokenFileWebIdentityCredentials = TokenFileWebIdentityCredentials

module.exports = AWS
