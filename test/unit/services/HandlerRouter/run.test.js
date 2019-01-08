require(process.cwd() + '/test/bootstrap.js')
const HandlerRouter = require(`${libPath}/services/HandlerRouter.js`)

class TestSuite extends TestCombo {
  get title() { return 'handlerRouter.run' }

  get args() {
    return ['key', 'klass', 'method', 'klassMethodFormat']
  }

  get argTypes() {
    return {
      key: ['correct', 'notExist', 'null'],
      klass: ['correct', 'notExist'],
      method: ['correct', 'notExist'],
      klassMethodFormat: ['correct', 'wrong'],
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() { return [] }

  beforeAll(test, combination) {
  }

  beforeEach(test, combination) {
    test.key = 'TaskType'
    test.klass = 'KlassA'
    test.method = 'test'
    test.extraArgs = [{}, 'dfdf']
    test.fnResult = {}
    test.fn = function() { return test.fnResult }

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      key: {
        correct: test.key,
        notExist: 'NotExist',
        null: null,
      },
      klass: {
        correct: test.klass,
        notExist: 'NotExist',
      },
      method: {
        correct: test.method,
        notExist: 'notExist',
      },
      klassMethodFormat: {
        correct: true,
        wrong: false,
      },
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [key, klass, method, klassMethodFormat] = argValues
    const handlerMap = {
      [test.key]: klassMethodFormat ? `${klass}.${method}` : `${klass}_${method}`
    }

    const modelMap = {
      KlassA: class KlassA {
        static test() {
          return test.fn()
        }
      },
    }

    const router = new HandlerRouter({
      handlerMap,
      modelMap,
    })

    return router.run(key, ...test.extraArgs)
  }

  shouldSuccess(combination) {
    const [key, klass, method, klassMethodFormat] = combination

    return key.match(/correct/)
      && klass.match(/correct/)
      && method.match(/correct/)
      && klassMethodFormat.match(/correct/)
  }

  successAssert(test, combination) {
    it('should return what the handler return', () => {
      expect(test.res).toEqual(test.fnResult)
    })
  }

  failureAssert(test, combination) {
    const [key, klass, method, klassMethodFormat] = combination

    if (key !== 'correct') {
      it('should throw error', () => {
        expect(test.res.message).toEqual('key_not_exist')
      })

      return
    }

    if (klassMethodFormat !== 'correct') {
      it('should throw error', () => {
        expect(test.res.message).toEqual('handler_invalid_format')
      })

      return
    }

    if (klass !== 'correct') {
      it('should throw error', () => {
        expect(test.res.message).toEqual('class_not_exist')
      })

      return
    }

    if (method !== 'correct') {
      it('should throw error', () => {
        expect(test.res.message).toEqual('method_not_exist')
      })

      return
    }

  }
}

const testSuite = new TestSuite()
testSuite.run()
