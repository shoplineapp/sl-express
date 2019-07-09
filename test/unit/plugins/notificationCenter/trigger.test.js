require(process.cwd() + '/test/bootstrap.js')
const NotificationCenter = require(`${libPath}/plugins/notificationCenter/lib/NotificationCenter.js`)

class TestSuite extends TestCombo {
  get title() { return 'Notification.trigger' }

  get args() {
    return [
      'eventType',
      'observerId',
      'eventObj',
    ]
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
      observerId: ['correct', 'emptyString', 'null'],
      eventObj: ['correct', 'null'],
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
    test.targetRes = 'res'
    test.handler = jest.fn( () => test.targetRes )

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      eventType: {
        correct: test.event,
        emptyString: '',
        null: null
      },
      observerId: {
        correct: test.observerId,
        emptyString: '',
        null: null
      },
      eventObj: {
        correct: {},
        null: null
      },
    }

    return argValues[arg][argType]
  }

  async testMethod(test, combination, argValues) {
    const [eventType, observerId, eventObj] = argValues

    const notificationCenter = new NotificationCenter
    test.notificationCenter = notificationCenter

    notificationCenter.register(
      test.event,
      test.observerId,
      test.handler
    )

    return notificationCenter.trigger(eventType, observerId, eventObj)
  }

  shouldSuccess(combination) {
    const [eventType, observerId, eventObj] = combination

    return eventType.match(/correct/)
      && observerId.match(/correct/)
  }

  successAssert(test, combination) {
    it ('should return what the handler return', () => {
      expect(test.res).toEqual(test.targetRes)
    })

    it ('should call the handler with proper arguments', () => {
      const [eventType, observerId, eventObj] = test.args

      expect(test.handler.mock.calls).toEqual([
        [eventObj]
      ])
    })
  }

  failureAssert(test, combination) {
    const [eventType, observerId, eventObj] = combination

    if (!eventType.match(/correct/)) {
      it('should throw NotificationCenterEventTypeNotFoundError', function()  {
        expect(test.res.constructor.name).toEqual('NotificationCenterEventTypeNotFoundError')
      })

      return
    }

    if (!observerId.match(/correct/)) {
      it('should throw NotificationCenterObserverNotFoundError', function()  {
        expect(test.res.constructor.name).toEqual('NotificationCenterObserverNotFoundError')
      })

      return
    }

    return
  }
}

const testSuite = new TestSuite()
testSuite.run()
