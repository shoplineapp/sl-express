/*
 * @class SQSMessageQueue
 *
 * @description the services for connecting rabbit message queue
 */
const fs = require('fs')
const _ = require('lodash')

class SQSMessageQueue {
  constructor(obj) {
    this.paused = false
    this.messageInProcessing = false
    this.isFetchingMessage = false
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
    this.log('SQS', 'trace', { message: 'close SQSMessageQueue' })

    if (!this.messageInProcessing && !this.isFetchingMessage) {
      return null
    } else {
      this.log('SQS', 'trace', { message: 'waiting processing message' })

      await new Promise(resolve => {
        setTimeout(() => {
          this.close().then(resolve);
        }, 5000);
      });
    }
  }

  stop() {
    this.log('SQS', 'trace', { message: 'stop polling messages' })
    this.paused = true
    return this
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

    const params = {
      ...this.consumeMessageParams,
      QueueUrl: queue.queueUrl,
    }

    return this.getMessage(queue, params, handler)
  }

  changeVisibilityTimeout(queueUrl, messages) {
    const promiseHandleMessage = messages.map(async(msg) => {

      this.log('SQS', 'trace', { message: 'Start changeVisibilityTimeout', queueUrl })

      const changeParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: msg.ReceiptHandle,
        VisibilityTimeout: 0
      }

      await this.sqs.changeMessageVisibility(changeParams).promise()

      this.log('SQS', 'trace', { message: 'Finish changeVisibilityTimeout', queueUrl })
    })

    return Promise.all(promiseHandleMessage);
  }

  async getMessage(queue, params, handler) {
    let data
    if (this.paused) {
      return
    }

    try {
      this.isFetchingMessage = true
      data = await this.sqs.receiveMessage(params).promise()
      if (!data.Messages || data.Messages.length === 0) {
        this.isFetchingMessage = false
        return this.getMessage(queue, params, handler)
      }

      // Handle Race Condition Case
      // (got message after 20s waiting time, but pod is shutting down, set message to visible)
      if (this.paused) {
        await this.changeVisibilityTimeout(queue.queueUrl, data.Messages)
        this.isFetchingMessage = false
        return
      }

      this.isFetchingMessage = false
      this.messageInProcessing = true

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

      this.messageInProcessing = false

      return this.getMessage(queue, params, handler)
    } catch (err) {
      this.log('SQS', 'error', { err, data })
      this.messageInProcessing = false
      this.isFetchingMessage = false
      return this.getMessage(queue, params, handler)
    }
  }
}

module.exports = SQSMessageQueue
