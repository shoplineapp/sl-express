require(process.cwd() + '/test/bootstrap.js')
const AcknowledgmentCenter = require(`${libPath}/plugins/acknowledgmentCenter/lib/AcknowledgmentCenter.js`)
const request = require('request-promise')

class TestSuite extends TestCombo {
  get title() {
    return 'AcknowledgmentCenter.httpAck'
  }

  get args() {
    return ['eventType', 'observer', 'eventObj']
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
      observer: ['correct', 'noHttpOpts', 'null'],
      eventObj: ['correct', 'null']
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() {
    return []
  }

  beforeAll(test, combination) {}

  beforeEach(test, combination) {
    test.event = 'event'
    test.observer = {
      id: 'Ben',
      events: ['testing'],
      httpOpts: {
        uri: 'http://test.test'
      }
    }
    test.targetRes = {}

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
      observer: {
        correct: test.observer,
        noHttpOpts: {},
        null: null
      },
      eventObj: {
        correct: {},
        null: null
      }
    }

    return argValues[arg][argType]
  }

  async testMethod(test, combination, argValues) {
    const [eventType, observer, eventObj] = argValues

    const acknowledgmentCenter = new AcknowledgmentCenter()
    test.acknowledgmentCenter = acknowledgmentCenter

    jest.spyOn(request, 'post').mockReturnValue(test.targetRes)

    acknowledgmentCenter.register(test.event, test.observer)

    return acknowledgmentCenter.httpAck(eventType, observer, eventObj)
  }

  shouldSuccess(combination) {
    const [eventType, observer, eventObj] = combination

    return eventType.match(/correct/) && observer.match(/correct/)
  }

  successAssert(test, combination) {
    it('should return what the request.post response', () => {
      expect(test.res).toEqual(test.targetRes)
    })

    it('should call request.post with correct arguments', () => {
      const [eventType, observer, eventObj] = test.args

      expect(request.post.mock.calls).toEqual([
        [
          observer.httpOpts.uri,
          { ...observer.httpOpts, json: true, body: eventObj }
        ]
      ])
    })
  }

  failureAssert(test, combination) {
    const [eventType, observer, eventObj] = combination

    if (!eventType.match(/correct/)) {
      it('should throw AcknowledgmentCenterEventTypeNotFoundError', function() {
        expect(test.res.constructor.name).toEqual(
          'AcknowledgmentCenterEventTypeNotFoundError'
        )
      })

      return
    }

    if (observer.match(/null/)) {
      it('should throw AcknowledgmentCenterObserverNotFoundError', function() {
        expect(test.res.constructor.name).toEqual(
          'AcknowledgmentCenterObserverNotFoundError'
        )
      })

      return
    }

    if (observer.match(/noHttpOpts/)) {
      it('should throw AcknowledgmentCenterObserverInvalidError', function() {
        expect(test.res.constructor.name).toEqual(
          'AcknowledgmentCenterObserverInvalidError'
        )
      })

      return
    }

    return
  }
}

const testSuite = new TestSuite()
testSuite.run()
