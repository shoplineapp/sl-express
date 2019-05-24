let cartesianProduct = require('cartesian-product')

class TestCombo {
  filter(combination) {
    return true
  }

  getCombinations() {
    const extractedTypeArrays = this.args.map(arg => this.argTypes[arg])

    const combinations = [
      ...cartesianProduct(extractedTypeArrays).filter(this.filter),
      ...this.extraCombinations()
    ]

    return combinations.length ? combinations : [[]]
  }

  async runTest(test, combination) {
    const argValues = this.args.map((arg, idx) => {
      return this.getArgValues(test, combination, arg, combination[idx])
    })

    test.args = argValues
    let res
    try {
      res = await this.testMethod(test, combination, argValues)
      //      res = res || res === false ? res : null
    } catch (e) {
      res = e
    }

    test.res = res

    return
  }

  run() {
    const combinations = this.getCombinations()

    describe(this.title, () => {
      const context = {}

      combinations.forEach(combination => {
        const shouldSuccess = this.shouldSuccess(combination)
        const testTitle = this.testTitle(shouldSuccess, combination)

        describe(testTitle, () => {
          const phaseHandler = key => () => this[key](context, combination)

          const phases = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach']

          phases.forEach(phase => {
            global[phase](phaseHandler(phase))
          })

          if (shouldSuccess) {
            this.successAssert(context, combination)
          } else {
            this.failureAssert(context, combination)
          }
        })
      })
    })
  }

  testTitle(shouldSuccess, combination) {
    const state = shouldSuccess ? 'success' : 'failure'
    const tmp = combination.map(str => `'${str}'`)
    const combinationStr = combination.join(', ')

    return `${state} - [${combinationStr}]`
  }
}

module.exports = TestCombo
