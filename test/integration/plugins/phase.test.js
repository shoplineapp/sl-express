require(process.cwd() + '/test/bootstrap.js')
const App = require(`${libPath}/models/App.js`)

class TestSuite extends TestCombo {
  get title() { return 'plugins phase' }

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

  async testMethod(test, combination, argValues) {
    test.app = new App

    test.spyProjectDir = jest.spyOn(test.app, 'projectDir')
      .mockReturnValue(`${process.cwd()}/test/exampleApp`)

    test.pluginMethods = [
      'prepare',
      'connectDependencies',
      'disconnectDependencies',
      'beforeStartService',
      'afterStartService',
    ]

    const fakePlugin = function() {
      return test.pluginMethods.reduce( (acc, method) => {
        return {
          ...acc,
          [method]: jest.fn()
        }
      }, {})
    }

    jest.spyOn(test.app, 'loadPlugins')
      .mockImplementation(() => {
        test.app.plugins = {
          sample: fakePlugin(),
          queueTask: fakePlugin(),
        }
      })

    jest.spyOn(test.app, 'startService')
      .mockReturnValue(test.app)

    jest.spyOn(test.app, 'stopService')
      .mockReturnValue(test.app)

    await test.app.start()
    await test.app.stop()

    return true
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    it('should call phases in plugins', () => {
      Object.keys(test.app.plugins).forEach( (key) => {
        const plugin = test.app.plugins[key]

        test.pluginMethods.forEach( (method) => {
          expect(plugin[method]).toBeCalledWith(test.app)
          expect(plugin[method]).toHaveBeenCalledTimes(1)
        })
      })
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
