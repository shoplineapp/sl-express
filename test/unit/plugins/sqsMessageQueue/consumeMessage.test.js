require(process.cwd() + '/test/bootstrap.js')
const SQSMessageQueue = require(`${process.cwd()}/lib/plugins/sqsMessageQueue/lib/SQSMessageQueue.js`)
const Promise = require('bluebird')

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
    jest.mock('aws-sdk')
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
          },
          maxNumberOfMessages: 10,
          visibilityTimeout: 40,
          waitTimeSeconds: 20
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

    const messages = [];

    for (let i = 0; i < 15; i++) {
      const message = messageQueue.queueMessage('default', `Msg_${i}`)
      messages.push(message)
    }

    await Promise.all(messages)

    jest.spyOn(messageQueue, 'getMessage').mockReturnValue({})

    test.handler = jest.fn()

    return messageQueue.consumeMessage('default', test.handler)
  }

  shouldSuccess(combination) {
    const [config] = combination

    return config.match(/correct/)
  }

  successAssert(test, combination) {
    it('should return a correct payload', () => {
      expect(test.res).toEqual({})
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
