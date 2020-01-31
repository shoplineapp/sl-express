global.TestCombo = require('../TestCombo.js')
const app = require(process.cwd() + '/app.js')

beforeAll(async () => {
  await app.prepare()
  // uncomment when running integration test
  await app.connectDependencies()
})

afterAll(async () => {
  // uncomment when running integration test
  await app.disconnectDependencies()
})
