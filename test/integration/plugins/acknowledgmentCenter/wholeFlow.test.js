require(process.cwd() + '/test/bootstrap.js')
const AcknowledgmentCenter = require(`${libPath}/plugins/acknowledgmentCenter/lib/AcknowledgmentCenter.js`)
const request = require('request-promise')

class TestSuite extends TestCombo {
  get title() {
    return 'AcknowledgmentCenter - whole flow'
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
    
    test.event = 'testing'
    test.payload = {}
    test.observer = {
      id: 'observer',
      httpOpts: {
        uri: 'http://test.test'
      }
    }
    
    jest.spyOn(request, 'post').mockReturnValue(null)
    const acknowledgmentCenter = new AcknowledgmentCenter()
    acknowledgmentCenter.register(
      test.event,
      test.observer,
    )


    await acknowledgmentCenter.ack(test.event, test.payload)

    return
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    const [obj] = combination

    it('should call request.post with proper payload', function() {
      console.log('test: ', test);
      expect(request.post).toBeCalledWith(test.observer.httpOpts.uri, {
        ...test.observer.httpOpts,
        json: true,
        body: test.payload
      })
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
