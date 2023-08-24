/*
 * @class SQSMessageQueue
 *
 * @description the services for connecting rabbit message queue
 */
const fs = require('fs')
const _ = require('lodash')
const Promise = require('bluebird')

class SQSMessageQueue {
  constructor(obj) {
    this.paused = false
    this.count = 0
    this.aws = require('aws-sdk')

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

  // Providers order
  // EnvironmentCredentials('SQS')
  // EnvironmentCredentials('AWS')
  // EnvironmentCredentials('AMAZON')
  // SharedIniFileCredentials()
  // ECSCredentials()
  // ProcessCredentials()
  // TokenFileWebIdentityCredentials()
  // EC2MetadataCredentials()
  get credentialProvider() {
    if (this.awsCredentialsProvider) {
      return awsCredentialsProvider;
    }
    const { EnvironmentCredentials, CredentialProviderChain } = this.aws
    this.awsCredentialsProvider = new CredentialProviderChain([
      () => new EnvironmentCredentials('SQS'),
      ...CredentialProviderChain.defaultProviders,
    ])
    return this.awsCredentialsProvider
  }

  get sqs() {
    if (!this.singleSqs) {
      if (!this.config) return null

      const { apiVersion, region } = this.config

      this.singleSqs = new this.aws.SQS({
        apiVersion,
        region,
        credentialProvider: this.credentialProvider,
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

  async stop() {
    this.log('SQS', 'trace', { message: 'stop polling messages' })
    this.paused = true
    this.log('SQS', 'trace', { message: 'stop consume count', count: this.count })
    if (this.count <= 0) {
      return this
    } else {
      // await new Promise(resolve => {
      //   setTimeout(() => {
      //     this.stop().then(resolve);
      //   }, 5000);
      // });
      this.log('SQS', 'trace', { message: 'without setTimeout', count: this.count })
    }
  }

  async queueMessage(queueId, message) {
    const queue = this.sqsQueuesDict[this.config.queueMap[queueId]]
    const timeBeforeSend = new Date()

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
        const timeAfterSend = new Date()
        const timeDiff = timeAfterSend - timeBeforeSend

        this.log('SQS', 'trace', { MessageId: data.MessageId, SqsConsumedTime: timeDiff })

        return data
      })
      .catch(err => {
        this.log('SQS', 'error', { err })

        throw err
      })
  }

  get consumeMessageParams() {
    const { maxNumberOfMessages, visibilityTimeout, waitTimeSeconds } = this.config

    return {
      AttributeNames: ['SentTimestamp'],
      MaxNumberOfMessages: maxNumberOfMessages || 1,
      //  MessageAttributeNames: [
      //    "All"
      //  ],
      VisibilityTimeout: visibilityTimeout || 20,
      WaitTimeSeconds: waitTimeSeconds || 10
    }
  }

  async consumeMessage(queueId, handler) {
    const queue = this.sqsQueuesDict[this.config.queueMap[queueId]]
    this.log('SQS', 'trace', { message: 'consumeMessage' })
    const params = {
      ...this.consumeMessageParams,
      QueueUrl: queue.queueUrl,
    }

    return this.getMessage(queue, params, handler)
  }

  async getMessage(queue, params, handler) {
    let data
    if (this.paused) {
      return
    }
    this.count += 1
    this.log('SQS', 'trace', { message: 'getMessage', paused: this.paused, count :this.count })
    try {
      data = await this.sqs.receiveMessage(params).promise()
      if (!data.Messages || data.Messages.length === 0) {
        return this.getMessage(queue, params, handler)
      }

      const promiseHandleMessage = data.Messages.map(async(msg) => {
        const payload = msg.Body

        this.log('SQS', 'trace', { message: 'read Message', payload })

        await handler(payload)

        const deleteParams = {
          QueueUrl: queue.queueUrl,
          ReceiptHandle: msg.ReceiptHandle
        }

        await this.sqs.deleteMessage(deleteParams).promise()

        this.log('SQS', 'trace', { message: 'Message Deleted', payload })
      })

      await Promise.all(promiseHandleMessage);

      return this.getMessage(queue, params, handler)
    } catch (err) {
      this.log('SQS', 'error', { err, data })

      return this.getMessage(queue, params, handler)
    } finally {
      this.count -= 1
      this.log('SQS', 'trace', { message: 'finally consume count', count: this.count })
    }
  }
}

module.exports = SQSMessageQueue
