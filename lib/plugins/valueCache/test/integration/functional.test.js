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

    it('should works with expired time', async () => {
      const [type, id, value] = test.args

      const get1 = await test.valueCache.get(type, id)
      expect(get1).toEqual(value)

      await new Promise((r) => setTimeout(r, 2000));
      const get2 = await test.valueCache.get(type, id)
      expect(get2).toEqual(value)

      await new Promise((r) => setTimeout(r, 2000));
      const get3 = await test.valueCache.get(type, id)
      expect(get3).toEqual(null)
    })

    it('should works with deletion', async () => {
      const [type, id, value] = test.args

      const get1 = await test.valueCache.get(type, id)
      expect(get1).toEqual(value)

      await test.valueCache.del(type, id)

      const get2 = await test.valueCache.get(type, id)
      expect(get2).toEqual(null)
    })

  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
