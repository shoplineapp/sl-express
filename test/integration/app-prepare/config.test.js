require(process.cwd() + '/test/bootstrap.js')
const App = require(`${libPath}/models/App.js`)

class TestSuite extends TestCombo {
  get title() { return 'app.loadConfig' }

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
    test.app = new App

    test.spyProjectDir = jest.spyOn(test.app, 'projectDir')
      .mockReturnValue(`${process.cwd()}/test/exampleApp`)

    return test.app.loadConfig()
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    it('should load default config', () => {
      const properties = [
        'app.port',
        'app.moduleDelimiter',
        'logger.serviceName',
        'messageQueue.queuePrefix',
        'queueTasks',
        'redis.host',
      ]

      properties.forEach( (prop) => {
        expect(test.app.config).toHaveProperty(prop)
      })
    })

    it('should do overriding', () => {
      expect(test.app.config.app.port).toEqual(4000)
    })

    it('should add new Field', () => {
      expect(test.app.config.app).toHaveProperty('newField')
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
