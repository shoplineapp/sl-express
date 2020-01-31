require('./bootstrap.js')
const ValueCache = require('../../lib/ValueCache.js')

class TestSuite extends TestCombo {
  get title() { return 'ValueCache.register' }

  get args() {
    return ['type', 'expireSec', 'keyPrefix']
  }

  get argTypes() {
    return {
      type: ['correct', 'notString', 'null'],
      expireSec: ['correct', 'string', 'null'],
      keyPrefix: ['correct', 'notString', 'null'],
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
        notString: {},
        null: null,
      },
      expireSec: {
        correct: 60,
        string: 'string',
        null: null,
      },
      keyPrefix: {
        correct: 'prefix',
        notString: {},
        null: null,
      },
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [type, expireSec, keyPrefix] = argValues

    test.defaultExpireSec = 10

    const valueCache = new ValueCache({
      defaultExpireSec: test.defaultExpireSec
    })

    test.valueCache = valueCache

    return valueCache.register(type, {
      expireSec,
      keyPrefix,
    })
  }

  shouldSuccess(combination) {
    const [type, expireSec, keyPrefix] = combination

    return type.match(/correct/)
      && keyPrefix.match(/correct/)
  }

  successAssert(test, combination) {
    const [type, expireSec, keyPrefix] = combination

    if (expireSec === 'correct') {
      it('should udpate registrationMap', async () => {
        const [type, expireSec, keyPrefix] = test.args

        expect(test.valueCache.registrationMap).toEqual({
          [type]: { expireSec, keyPrefix }
        })
      })

      return
    }else {
      it('should udpate registrationMap', async () => {
        const [type, expireSec, keyPrefix] = test.args

        expect(test.valueCache.registrationMap).toEqual({
          [type]: {
            expireSec: test.defaultExpireSec,
            keyPrefix
          }
        })
      })

      return
    }
  }

  failureAssert(test, combination) {
    const [type, expireSec, keyPrefix] = combination

    if (type !== 'correct') {
      it('should throw ValueCacheInvalidRegistrationError with correct message', function() {
        expect(test.res.constructor.name).toEqual('ValueCacheInvalidRegistrationError')
        expect(test.res.message).toEqual('`type` should be a valid string')
      })

      return
    }

    if (keyPrefix !== 'correct') {
      it('should throw ValueCacheInvalidRegistrationError with correct message', function() {
        expect(test.res.constructor.name).toEqual('ValueCacheInvalidRegistrationError')
        expect(test.res.message).toEqual('`keyPrefix` should be a valid string')
      })

      return
    }

    if (expireSec !== 'correct') {
      it('should throw ValueCacheInvalidRegistrationError with correct message', function() {
        expect(test.res.constructor.name).toEqual('ValueCacheInvalidRegistrationError')
        expect(test.res.message).toEqual('`keyPrefix` should be a valid string')
      })

      return
    }
  }
}

const testSuite = new TestSuite()
testSuite.run()
