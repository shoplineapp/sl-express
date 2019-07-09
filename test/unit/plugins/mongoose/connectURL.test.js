require(process.cwd() + '/test/bootstrap.js')
const MongoosePlugin = require(`${process.cwd()}/lib/plugins/mongoose/lib/MongoosePlugin.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'MongoosePlugin.connectURL'
  }

  get args() {
    return ['config']
  }

  get argTypes() {
    return {
      config: ['correct', 'correctWithoutPass']
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
    const [config] = combination

    return this.runTest(test, combination)
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      config: {
        correct: {
          host: 'localhost',
          port: 27017,
          database: 'myapp'
        },
        correctWithoutPass: {
          user: 'username',
          pass: 'password',
          host: 'localhost',
          port: 27017,
          database: 'myapp'
        }
      }
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [config] = argValues

    const mongoose = new MongoosePlugin()

    mongoose.didLoadFramework({ config: { mongoose: config } })

    test.mongoose = mongoose

    return mongoose.connectURL
  }

  shouldSuccess(combination) {
    const [config] = combination

    return config.match(/correct/) || config.match(/correctWithoutPass/)
  }

  successAssert(test, combination) {
    const [config] = combination

    it('should return correct connect url', () => {
      if (config === 'correct') {
        expect(test.res).toEqual('mongodb://localhost:27017/myapp')
      } else {
        expect(test.res).toEqual('mongodb://username:password@localhost:27017/myapp')
      }
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
