const TestCombo = require(`${process.cwd()}/test/TestCombo.js`)
const SQSMessageQueue = require(`${process.cwd()}/lib/plugins/sqsMessageQueue/lib/SQSMessageQueue.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'SQSMessageQueue.connect'
  }

  get args() {
    return ['config']
  }

  get argTypes() {
    return {
      config: ['correct']
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

  testMethod(test, combination, argValues) {
    const [config] = argValues

    const messageQueue = new SQSMessageQueue({ config })

    test.messageQueue = messageQueue

    return messageQueue.connect()
  }

  shouldSuccess(combination) {
    const [config] = combination

    return config.match(/correct/)
  }

  successAssert(test, combination) {
    it('this.sqsQueues should be setup', () => {
      expect(test.messageQueue.sqsQueues).not.toEqual([])

      const queues = test.messageQueue.sqsQueues.map(q => q.id)

      test.messageQueue.queues.forEach(q => {
        expect(queues).toContain(q)
      })

      expect(test.messageQueue.sqsQueues.length).toEqual(queues.length)
    })

    it('this.sqsQueuesDict should be setup', () => {
      expect(test.messageQueue.sqsQueuesDict).not.toEqual(null)

      const keys = Object.keys(test.messageQueue.sqsQueuesDict)

      expect(keys.length).toEqual(test.messageQueue.queues.length)

      test.messageQueue.queues.forEach(q => {
        expect(keys).toContain(q)
      })
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
