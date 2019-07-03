require(process.cwd() + '/test/bootstrap.js')
const MongooseAtlasPlugin = require(`${process.cwd()}/lib/plugins/mongooseAtlas/lib/MongooseAtlasPlugin.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'MongooseAtlasPlugin.connectURL'
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
          database: 'myapp'
        },
        correctWithoutPass: {
          user: 'username',
          pass: 'password',
          host: 'localhost',
          database: 'myapp'
        }
      }
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [config] = argValues

    const mongooseAltas = new MongooseAtlasPlugin()

    mongooseAltas.didLoadFramework({ config: { mongooseAltas: config } })

    test.mongooseAltas = mongooseAltas

    return mongooseAltas.connectURL
  }

  shouldSuccess(combination) {
    const [config] = combination

    return config.match(/correct/) || config.match(/correctWithoutPass/)
  }

  successAssert(test, combination) {
    const [config] = combination

    it('should return correct connect url', () => {
      if (config === 'correct') {
        expect(test.res).toEqual('mongodb+srv://localhost/myapp')
      } else {
        expect(test.res).toEqual(
          'mongodb+srv://username:password@localhost/myapp'
        )
      }
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
