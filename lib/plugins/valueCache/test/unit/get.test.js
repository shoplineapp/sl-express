require('./bootstrap.js')
const ValueCache = require('../../lib/ValueCache.js')

class TestSuite extends TestCombo {
  get title() { return 'ValueCache.get' }

  get args() {
    return ['type', 'id']
  }

  get argTypes() {
    return {
      type: ['correct', 'notExist', 'null'],
      id: ['correct', 'notString', 'null'],
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() { return [] }

  beforeAll(test, combination) {

  }

  beforeEach(test, combination) {
    test.type = 'TYPE'
    test.id = 'ID'
    test.redisRes = 'redisRes'
    test.key = 'KEY'
    test.redis = {
      get: jest.fn().mockReturnValue(test.redisRes)
    }

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      type: {
        correct: test.type,
        notExist: 'notExist',
        null: null,
      },
      id: {
        correct: test.id,
        notString: 'notString',
        null: null,
      },
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [type, id] = argValues

    const valueCache = new ValueCache({
      redis: test.redis,
    })

    test.valueCache = valueCache

    valueCache.register(test.type, {
      expireSec: 60,
      keyPrefix: 'keyPrefix',
    })

    jest.spyOn(ValueCache, 'redisKey')
      .mockReturnValue(test.key)

    return valueCache.get(type, id)
  }

  shouldSuccess(combination) {
    const [type, id] = combination

    return type.match(/correct/)
  }

  successAssert(test, combination) {
    const [type, id] = combination

    it('should return what redis.get return', async () => {
      expect(test.res).toEqual(test.redisRes)
    })

    it('should call redis.get with correct arguments', async () => {
      expect(test.redis.get).toHaveBeenCalledWith(test.key)
    })
  }

  failureAssert(test, combination) {
    const [type, id] = combination

    if (type !== 'correct') {
      it('should throw ValueCacheRegistrationNotFoundError', function() {
        expect(test.res.constructor.name).toEqual('ValueCacheRegistrationNotFoundError')
        expect(test.res.message).toEqual('registration not found')
      })

      return
    }

  }
}

const testSuite = new TestSuite()
testSuite.run()
