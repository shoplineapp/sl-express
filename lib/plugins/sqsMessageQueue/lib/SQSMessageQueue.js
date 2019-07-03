/*
 * @class SQSMessageQueue
 *
 * @description the services for connecting rabbit message queue
 */
const AWS = require('aws-sdk')
const _ = require('lodash')

class SQSMessageQueue {
  constructor(obj) {
    Object.assign(this, {
      config: obj.config,
      log: obj.log || console.log // eslint-disable-line no-console
    })

    if (this.config) {
      const { queuePrefix = '', queueMap = {} } = this.config

      this.queuePrefix = queuePrefix
      this.queues = _.uniq(Object.values(queueMap))
    }
  }

  get sqs() {
    if (!this.singleSqs) {
      if (!this.config) return null

      const { accessKeyId, secretAccessKey, apiVersion, region } = this.config

      this.singleSqs = new AWS.SQS({
        accessKeyId,
        secretAccessKey,
        apiVersion,
        region
      })
    }

    return this.singleSqs
  }

  get sqsQueuesDict() {
    if (!this.singleSqsQueueDict) {
      if (!this.sqsQueues) return null

      this.singleSqsQueueDict = this.sqsQueues.reduce(
        (acc, queue) => ({
          ...acc,
          [queue.id]: queue
        }),
        {}
      )
    }

    return this.singleSqsQueueDict
  }

  async connect() {
    const validQueues = this.queues.filter(q => q.startsWith(this.queuePrefix))

    if (this.queuePrefix === '' || validQueues.length !== this.queues.length) {
      throw new Error(`All the queues should start with the queue prefix
        and the prefix cannot be an empty string`)
    }

    const params = {
      QueueNamePrefix: this.queuePrefix
    }

    const res = await this.sqs.listQueues(params).promise()
    const {
      // ResponseMetadata,
      QueueUrls
    } = res

    this.sqsQueues = QueueUrls.map(url => ({
      id: url.split('/').slice(-1)[0],
      queueUrl: url
    })).filter(obj => this.queues.includes(obj.id))

    // assuming the result return unique url
    const isAllQueueExist = this.sqsQueues.length === this.queues.length

    if (!isAllQueueExist) {
      throw new Error(`Queue not find in SQS.
        expected: ${this.queues}, got: ${queues}`) // eslint-disable-line no-undef
    }

    return this
  }

  async close() {
    return null
  }

  async queueMessage(queueId, message) {
    const queue = this.sqsQueuesDict[this.config.queueMap[queueId]]

    if (!queue) {
      throw new Error('queueUrl cannot be null')
    }

    const params = {
      DelaySeconds: 0,
      MessageAttributes: {},
      MessageBody: message,
      QueueUrl: queue.queueUrl
    }

    return this.sqs
      .sendMessage(params)
      .promise()
      .then(data => {
        this.log('SQS', 'trace', { MessageId: data.MessageId })

        return data
      })
      .catch(err => {
        this.log('SQS', 'error', { err })

        throw err
      })
  }

  async consumeMessage(queueId, handler) {
    const queue = this.sqsQueuesDict[this.config.queueMap[queueId]]

    const params = {
      AttributeNames: ['SentTimestamp'],
      MaxNumberOfMessages: 1,
      //  MessageAttributeNames: [
      //    "All"
      //  ],
      QueueUrl: queue.queueUrl,
      VisibilityTimeout: 20,
      WaitTimeSeconds: 10
    }

    return this.getMessage(queue, params, handler)
  }

  async getMessage(queue, params, handler) {
    let payload

    try {
      const data = await this.sqs.receiveMessage(params).promise()
      if (!data.Messages || data.Messages === 0) {
        return this.getMessage(queue, params, handler)
      }

      // as we are setting MaxNumberOfMessages: 1
      payload = data.Messages[0].Body

      this.log('SQS', 'trace', { message: 'read Message', payload })

      await handler(payload)

      const deleteParams = {
        QueueUrl: queue.queueUrl,
        ReceiptHandle: data.Messages[0].ReceiptHandle
      }

      await this.sqs.deleteMessage(deleteParams).promise()

      this.log('SQS', 'trace', { message: 'Message Deleted', payload })

      return this.getMessage(queue, params, handler)
    } catch (err) {
      this.log('SQS', 'error', { err, payload })

      return this.getMessage(queue, params, handler)
    }
  }
}

module.exports = SQSMessageQueue
