require(process.cwd() + '/test/bootstrap.js')
const NotificationCenter = require(`${libPath}/plugins/notificationCenter/lib/NotificationCenter.js`)

class TestSuite extends TestCombo {
  get title() { return 'Notification.deregister' }

  get args() {
    return [
      'eventType',
      'observerId',
    ]
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
      observerId: ['correct', 'emptyString', 'null'],
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() { return [] }

  beforeAll(test, combination) {

  }

  beforeEach(test, combination) {
    test.event = 'event'
    test.observerId = 'observerId'
    test.handler = jest.fn()

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      eventType: {
        correct: 'event',
        emptyString: '',
        null: null
      },
      observerId: {
        correct: 'observerId',
        emptyString: '',
        null: null
      },
    }

    return argValues[arg][argType]

  }

  async testMethod(test, combination, argValues) {
    const [eventType, observerId] = argValues
    const notificationCenter = new NotificationCenter
    test.notificationCenter = notificationCenter

    notificationCenter.register(
      test.event,
      test.observerId,
      test.handler
    )

    return notificationCenter.deregister(
      eventType,
      observerId,
    )
  }

  shouldSuccess(combination) {
    const [eventType, observerId] = combination

    return eventType.match(/correct/)
      && observerId.match(/correct/)
  }

  successAssert(test, combination) {
    it ('should the notificationCenter itself', () => {
      expect(test.res).toEqual(test.notificationCenter)
    })

    it('should remove from the data structure', () => {
      const [eventType, observerId, handler] = test.args

      expect(test.notificationCenter.registrations).toHaveProperty(eventType)
      expect(test.notificationCenter.registrations[eventType]).not.toHaveProperty(observerId)
    })
  }

  failureAssert(test, combination) {
    it ('should the notificationCenter itself', () => {
      expect(test.res).toEqual(test.notificationCenter)
    })
  }
}

const testSuite = new TestSuite()
testSuite.run()
