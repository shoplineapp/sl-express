require(process.cwd() + '/test/bootstrap.js')
const NotificationCenter = require(`${libPath}/plugins/notificationCenter/lib/NotificationCenter.js`)

class TestSuite extends TestCombo {
  get title() { return 'Notification.register' }

  get args() {
    return [
      'eventType',
      'observerId',
      'handler',
    ]
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
      observerId: ['correct', 'emptyString', 'null'],
      handler: ['correct', 'notFunc', 'null'],
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
      handler: {
        correct: jest.fn(),
        notFunc: 'handler',
        null: null,
      },
    }

    return argValues[arg][argType]

  }

  async testMethod(test, combination, argValues) {
    const [eventType, observerId, handler] = argValues
    const notificationCenter = new NotificationCenter
    test.notificationCenter = notificationCenter

    return notificationCenter.register(
      eventType,
      observerId,
      handler
    )
  }

  shouldSuccess(combination) {
    const [eventType, observerId, handler] = combination

    return eventType.match(/correct/)
      && observerId.match(/correct/)
      && handler.match(/correct/)
  }

  successAssert(test, combination) {
    it ('should the notificationCenter itself', () => {
      expect(test.res).toEqual(test.notificationCenter)
    })

    it('should register to the data structure', () => {
      const [eventType, observerId, handler] = test.args

      expect(test.notificationCenter.registrations[eventType][observerId].handler).toEqual(handler)
    })
  }

  failureAssert(test, combination) {
    const [eventType, observerId, handler] = combination

    if (!eventType.match(/correct/)) {
      it('should throw NotificationCenterEventTypeInvalidError', () => {
        expect(test.res.constructor.name).toEqual('NotificationCenterEventTypeInvalidError')
      })

      return
    }

    if (!observerId.match(/correct/)) {
      it('should throw NotificationCenterObserverInvalidError', () => {
        expect(test.res.constructor.name).toEqual('NotificationCenterObserverInvalidError')
      })

      return
    }

    if (!handler.match(/correct/)) {
      it('should throw NotificationCenterHandlerInvalidError', () => {
        expect(test.res.constructor.name).toEqual('NotificationCenterHandlerInvalidError')
      })

      return
    }
  }
}

const testSuite = new TestSuite()
testSuite.run()
