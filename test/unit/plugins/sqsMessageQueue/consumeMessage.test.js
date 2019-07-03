const TestCombo = require(`${process.cwd()}/test/TestCombo.js`)
const SQSMessageQueue = require(`${process.cwd()}/lib/plugins/sqsMessageQueue/lib/SQSMessageQueue.js`)

class TestSuite extends TestCombo {
  get title() { return 'SQSMessageQueue.consumeMessage' }

  get args() {
    return ['config']
  }

  get argTypes() {
    return {
      config: [
        'correct'
      ],
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() { return [] }

  beforeAll(test, combination) {

  }

  beforeEach(test, combination) {
    const [config] = combination

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      config: {
        correct: {
          accessKeyId: '',
          secretAccessKey: '',
          region: 'ap-southeast-1',
          queuePrefix: 'mc-',
          queueMap: {
            default: 'mc-sqs-stg'
          }
        }
      }
    }

    return argValues[arg][argType]
  }

  async testMethod(test, combination, argValues) {
    const [config] = argValues

    const messageQueue = new SQSMessageQueue({
      config,
    })

    test.messageQueue = messageQueue

    await messageQueue.connect()

    await messageQueue.queueMessage('default', "1111")

    test.handler = jest.fn()

    return messageQueue.consumeMessage('default', test.handler)
  }

  shouldSuccess(combination) {
    const [config] = combination

    return config.match(/correct/)
  }

  successAssert(test, combination) {
    it('should return a correct payload', () => {
      console.log(test.res)
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
