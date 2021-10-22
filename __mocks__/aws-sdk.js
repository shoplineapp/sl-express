const SQS = require('./SQS.js')
const CredentialProviderChain = require('./CredentialProviderChain')
const TokenFileWebIdentityCredentials = require('./EnvironmentCredentials')

const AWS = jest.genMockFromModule()

AWS.SQS = SQS
AWS.CredentialProviderChain = CredentialProviderChain
AWS.EnvironmentCredentials = TokenFileWebIdentityCredentials

module.exports = AWS
