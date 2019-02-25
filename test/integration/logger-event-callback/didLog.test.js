require(process.cwd() + '/test/bootstrap.js')
const Logger = require(`${libPath}/plugins/logger/lib/Logger.js`)

class TestSuite extends TestCombo {
  get title() { return 'Logger event - didLog' }

  get args() {
    return []
  }

  get argTypes() {
    return {
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() { return [] }

  beforeAll(test, combination) {
  }

  beforeEach(test, combination) {

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    test.logCategory = 'test'
    test.logLevel = 'trace'
    test.logPayload = {}

    test.logger = new Logger

    test.callback = jest.fn()

    test.logger.on('didLog', test.callback)

    return test.logger.log(test.logCategory, test.logLevel, test.logPayload)
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    it ('should call callback with corrent arguments', () => {
      expect(test.callback).toBeCalledWith(
        test.logger,
        test.logCategory,
        test.logLevel,
        expect.objectContaining(test.logPayload)
      )
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
