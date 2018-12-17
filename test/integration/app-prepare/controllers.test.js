require(process.cwd() + '/test/bootstrap.js')
const App = require(`${libPath}/models/App.js`)

class TestSuite extends TestCombo {
  get title() { return 'app.loadControllers' }

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

    return test.app.loadControllers()
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    it('should load controllers', () => {
      const properties = [
        'ControllerA',
        'ControllerB',
      ]

      properties.forEach( (prop) => {
        expect(test.app.controllers).toHaveProperty(prop)
      })
    })

    it('should make the controllers can reference the correct app', () => {
      const properties = [
        'ControllerA',
        'ControllerB',
      ]

      properties.forEach( (prop) => {
        expect(test.app.controllers[prop].app).toEqual(test.app)
      })

    })

  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
