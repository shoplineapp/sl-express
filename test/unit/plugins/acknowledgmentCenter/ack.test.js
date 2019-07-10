require(process.cwd() + '/test/bootstrap.js')
const AcknowledgmentCenter = require(`${libPath}/plugins/acknowledgmentCenter/lib/AcknowledgmentCenter.js`)
const QueueTask = require(`${libPath}/services/QueueTask.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'AcknowledgmentCenter.ack'
  }

  get args() {
    return ['eventType', 'eventObj']
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
      eventObj: ['correct', 'null']
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() {
    return []
  }

  beforeAll(test, combination) {
    QueueTask.queue = function() {
      return null
    }
  }

  beforeEach(test, combination) {
    test.event = 'event'
    test.observer = {
      id: 'Ben',
      events: ['testing'],
      httpOpts: {
        uri: 'http://test.test'
      }
    }

    return this.runTest(test, combination)
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
        correct: { id: '123' },
        null: { id: null }
      }
    }

    return argValues[arg][argType]
  }

  async testMethod(test, combination, argValues) {
    const [eventType, eventObj] = argValues

    const acknowledgmentCenter = new AcknowledgmentCenter()
    test.acknowledgmentCenter = acknowledgmentCenter

    acknowledgmentCenter.register(test.event, test.observer)

    jest.spyOn(acknowledgmentCenter, 'httpAck').mockReturnValue({})

    jest.spyOn(acknowledgmentCenter, 'enqueue').mockReturnValue(
      acknowledgmentCenter.dequeue({
        payload: {
          event: eventType,
          acknowledgmentObj: eventObj,
          observer: test.observer
        }
      })
    )

    return acknowledgmentCenter.ack(eventType, eventObj)
  }

  shouldSuccess(combination) {
    const [eventType, eventObj] = combination

    return eventType.match(/correct/)
  }

  successAssert(test, combination) {
    it('should the acknowledgmentCenter itself', () => {
      expect(test.res).toEqual(test.acknowledgmentCenter)
    })

    it('should call httpAck with correct arguments', () => {
      const [eventType, eventObj] = test.args

      expect(test.acknowledgmentCenter.httpAck.mock.calls).toEqual([
        [eventType, test.observer, eventObj]
      ])
    })
  }

  failureAssert(test, combination) {
    const [eventType, eventObj] = combination
    if (!eventType.match(/correct/)) {
      it('should throw AcknowledgmentCenterEventTypeNotFoundError', function() {
        expect(test.res.constructor.name).toEqual(
          'AcknowledgmentCenterEventTypeNotFoundError'
        )
      })
      return
    }
    return
  }
}

const testSuite = new TestSuite()
testSuite.run()
