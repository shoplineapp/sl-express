require(process.cwd() + '/test/bootstrap.js')
const NotificationCenter = require(`${libPath}/plugins/notificationCenter/lib/NotificationCenter.js`)

class TestSuite extends TestCombo {
  get title() { return 'Notification.fire' }

  get args() {
    return [
      'eventType',
      'eventObj',
    ]
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
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
        correct: test.event,
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
    const [eventType, eventObj] = argValues

    const notificationCenter = new NotificationCenter
    test.notificationCenter = notificationCenter

    jest.spyOn(notificationCenter, 'trigger')
      .mockReturnValue({})

    notificationCenter.register(
      test.event,
      test.observerId,
      test.handler
    )

    return notificationCenter.fire(eventType, eventObj)
  }

  shouldSuccess(combination) {
    const [eventType, eventObj] = combination

    return eventType.match(/correct/)
  }

  successAssert(test, combination) {
    it ('should the notificationCenter itself', () => {
      expect(test.res).toEqual(test.notificationCenter)
    })

    it('should call trigger with correct arguments', () => {
      const [eventType, eventObj] = test.args

      expect(test.notificationCenter.trigger.mock.calls).toEqual([
        [eventType, test.observerId, eventObj],
      ])
    })
  }

  failureAssert(test, combination) {
    const [eventType, eventObj] = combination

    if (!eventType.match(/correct/)) {
      it('should throw NotificationCenterEventTypeNotFoundError', function()  {
        expect(test.res.constructor.name).toEqual('NotificationCenterEventTypeNotFoundError')
      })

      return
    }

    return
  }
}

const testSuite = new TestSuite()
testSuite.run()
