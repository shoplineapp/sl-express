require(process.cwd() + '/test/bootstrap.js')
const App = require(`${libPath}/models/App.js`)

class TestSuite extends TestCombo {
  get title() { return 'app.loadServices' }

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

    return test.app.loadServices()
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    it('should load default config', () => {
      const properties = [
        'Logger',
        'MessageQueue',
        'Redis'
      ]

      properties.forEach( (prop) => {
        expect(test.app.services).toHaveProperty(prop)
      })
    })

    it('should do overriding', () => {
      expect(test.app.services.Logger.sampleMethod()).toEqual('sampleMethod')
    })

    it('should add new Field', () => {
      const properties = [
        'SampleService'
      ]

      properties.forEach( (prop) => {
        expect(test.app.services).toHaveProperty(prop)
      })

    })

    it('should export services to the context(global)', () => {
      const properties = [
        'Logger',
        'MessageQueue',
        'Redis',
        'SampleService'
      ]

      properties.forEach( (prop) => {
        expect(global).toHaveProperty(prop)
      })
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
