require(process.cwd() + '/test/bootstrap.js')
const NotificationCenter = require(`${libPath}/plugins/notificationCenter/lib/NotificationCenter.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'Notification - whole flow'
  }

  get args() {
    return []
  }

  get argTypes() {
    return {}
  }

  filter(combination) {
    return true
  }

  extraCombinations() {
    return []
  }

  beforeAll(test, combination) {}

  beforeEach(test, combination) {
    test.targetRes = {}
    return this.runTest(test, combination)
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {}

  async testMethod(test, combination, argValues) {
    const notificationCenter = new NotificationCenter

    test.event = 'test'
    test.observerId = 'observerId'
    test.handler = jest.fn()
    test.eventObj = {}

    notificationCenter.register(test.event, test.observerId, test.handler)

    await notificationCenter.fire(test.event, test.eventObj)

    return
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    const [obj] = combination

    it('should call handler', function() {
      expect(test.handler).toBeCalledWith(test.eventObj)
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
