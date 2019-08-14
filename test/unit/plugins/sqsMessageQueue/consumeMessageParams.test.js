const TestCombo = require(`${process.cwd()}/test/TestCombo.js`)
const SQSMessageQueue = require(`${process.cwd()}/lib/plugins/sqsMessageQueue/lib/SQSMessageQueue.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'SQSMessageQueue.consumeMessageParams'
  }

  get args() {
    return ['config']
  }

  get argTypes() {
    return {
      config: ['default', 'withConfig']
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() {
    return []
  }

  beforeAll(test, combination) {
    jest.mock('aws-sdk')
  }

  beforeEach(test, combination) {
    test.attributeNames = { AttributeNames: ['SentTimestamp'] }

    test.defaultMaxNumberOfMessages = 1
    test.defaultVisibilityTimeout = 20
    test.defaultWaitTimeSeconds = 10

    test.maxNumberOfMessages = 10
    test.visibilityTimeout = 40
    test.waitTimeSeconds = 20

    return this.runTest(test, combination)
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      config: {
        default: {
          accessKeyId: '',
          secretAccessKey: '',
          region: 'ap-southeast-1',
          queuePrefix: 'mc-',
          queueMap: {
            default: 'mc-sqs-stg'
          },
        },
        withConfig: {
          accessKeyId: '',
          secretAccessKey: '',
          region: 'ap-southeast-1',
          queuePrefix: 'mc-',
          queueMap: {
            default: 'mc-sqs-stg'
          },
          maxNumberOfMessages: test.maxNumberOfMessages,
          visibilityTimeout: test.visibilityTimeout,
          waitTimeSeconds: test.waitTimeSeconds,
        }
      }
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [config] = argValues

    const messageQueue = new SQSMessageQueue({ config })

    test.messageQueue = messageQueue

    return messageQueue.consumeMessageParams
  }

  shouldSuccess(combination) {
    const [config] = combination

    return true
  }

  successAssert(test, combination) {
    const [config] = combination

    it('should return a correct payload', () => {
      if (config === 'withConfig') {
        expect(test.res).toEqual({
          ...test.attributeNames,
          MaxNumberOfMessages: test.maxNumberOfMessages,
          VisibilityTimeout: test.visibilityTimeout,
          WaitTimeSeconds: test.waitTimeSeconds
        })
      }

      if (config === 'default') {
        expect(test.res).toEqual({
          ...test.attributeNames,
          MaxNumberOfMessages: test.defaultMaxNumberOfMessages,
          VisibilityTimeout: test.defaultVisibilityTimeout,
          WaitTimeSeconds: test.defaultWaitTimeSeconds
        })
      }
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
