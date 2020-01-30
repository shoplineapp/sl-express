require('./bootstrap.js')
const ValueCache = require('../../lib/ValueCache.js')

class TestSuite extends TestCombo {
  get title() { return 'ValueCache.set' }

  get args() {
    return ['type', 'id', 'value']
  }

  get argTypes() {
    return {
      type: ['correct'],
      id: ['correct'],
      value: ['correct'],
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
      type: {
        correct: 'TEST',
      },
      id: {
        correct: 'id',
      },
      value: {
        correct: 'value',
      },
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [type, id, value] = argValues

    const valueCache = new ValueCache({
      redis: app.redis
    })

    valueCache.register(type, {
      expireSec: 3,
      keyPrefix: 'TEST',
    })

    test.valueCache = valueCache

    return valueCache.set(type, id, value)
  }

  shouldSuccess(combination) {
    return true
  }

  successAssert(test, combination) {
    const [obj] = combination

    it('should works', async () => {
      const [type, id, value] = test.args

      const get = await test.valueCache.get('TEST', 'id')

      expect(get).toEqual(value)

      await test.valueCache.del('TEST', 'id')

      const get2 = await test.valueCache.get('TEST', 'id')

      expect(get2).toEqual(null)
    })

  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
