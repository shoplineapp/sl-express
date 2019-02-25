require(process.cwd() + '/test/bootstrap.js')
const App = require(`${libPath}/models/App.js`)

class TestSuite extends TestCombo {
  get title() { return 'app.loadPlugins' }

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

    test.app.loadFramework()

    return test.app.loadPlugins()
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    it('should load default config', () => {
      const properties = [
        'queueTask',
      ]

      properties.forEach( (prop) => {
        expect(test.app.plugins).toHaveProperty(prop)
      })
    })

    it('should do overriding', async () => {
      const result = await test.app.plugins.queueTask.willStartService()
      expect(result).toEqual('abc')
    })

    it('should add new Field', () => {
      const properties = [
        'sample'
      ]

      properties.forEach( (prop) => {
        expect(test.app.plugins).toHaveProperty(prop)
      })

    })

    it('should not export to the context(global)', () => {
      const properties = [
        'queueTask',
        'sample',
      ]

      properties.forEach( (prop) => {
        expect(global).not.toHaveProperty(prop)
      })
    })

    it('should not load plugin that is not in app.config.plugins', () => {
      const properties = [
        'dummy',
      ]

      properties.forEach( (prop) => {
        expect(test.app.plugins).not.toHaveProperty(prop)
      })
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
