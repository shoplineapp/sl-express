require(process.cwd() + '/test/bootstrap.js')
const AcknowledgmentCenter = require(`${libPath}/plugins/acknowledgmentCenter/lib/AcknowledgmentCenter.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'AcknowledgmentCenter.register'
  }

  get args() {
    return ['eventType', 'observer']
  }

  get argTypes() {
    return {
      eventType: ['correct', 'emptyString', 'null'],
      observer: ['correct', 'noHttpOpts', 'null']
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
    return this.runTest(test, combination)
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
      observer: {
        correct: {
          id: 'Ben',
          events: ['testing'],
          httpOpts: {
            uri: 'http://test.test'
          }
        },
        noHttpOpts: {},
        null: null
      }
    }

    return argValues[arg][argType]
  }

  async testMethod(test, combination, argValues) {
    const [eventType, observer] = argValues
    const acknowledgmentCenter = new AcknowledgmentCenter()
    test.acknowledgmentCenter = acknowledgmentCenter

    return acknowledgmentCenter.register(eventType, observer)
  }

  shouldSuccess(combination) {
    const [eventType, observer] = combination

    return eventType.match(/correct/) && observer.match(/correct/)
  }

  successAssert(test, combination) {
    it('should the acknowledgmentCenter itself', () => {
      expect(test.res).toEqual(test.acknowledgmentCenter)
    })

    it('should register to the data structure', () => {
      const [eventType, observer] = test.args

      expect(test.acknowledgmentCenter.eventObserversDict[eventType]).toContain(
        observer
      )
    })
  }

  failureAssert(test, combination) {
    const [eventType, observer] = combination

    if (!eventType.match(/correct/)) {
      it('should throw AcknowledgmentCenterEventTypeInvalidError', () => {
        expect(test.res.constructor.name).toEqual(
          'AcknowledgmentCenterEventTypeInvalidError'
        )
      })
      return
    }

    if (!observer.match(/correct/)) {
      it('should throw AcknowledgmentCenterObserverInvalidError', () => {
        expect(test.res.constructor.name).toEqual(
          'AcknowledgmentCenterObserverInvalidError'
        )
      })
      return
    }
  }
}

const testSuite = new TestSuite()
testSuite.run()
