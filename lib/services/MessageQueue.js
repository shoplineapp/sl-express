/*
 * @class MessageQueue
 *
 * @description the services for connecting message queue
 */

let _sharedMessageQueue = null
let _messageQueueLib = null

class MessageQueue {

  static get messageQueueLib() {

    if (!_messageQueueLib) {

      _messageQueueLib = require('amqplib')

    }

    return _messageQueueLib

  }

  init(config) {

    this.host = config.host
    this.port = config.port
    this.url = `amqp://${this.host}:${this.port}`
    this.connection = null
    this.channel = null
    this.prefetchCount = config.prefetchCount
    this.queue = config.queue
    this.queuePrefix = config.queuePrefix

    return this

  }

  static get sharedMessageQueue() {

    if (!_sharedMessageQueue) {

      _sharedMessageQueue = new MessageQueue

    }

    return _sharedMessageQueue

  }

  /*
   * wrapper to turn the ture queueId working with the message queue. Basically, it just add a prefix to the queueId
   *
   * @method convertQueueIdToMessageQueueLevelId
   *
   * @return {String} the queueId with prefix
   */

  convertQueueIdToMessageQueueLevelId(queueId) {

    return `${this.queuePrefix}-${queueId}`

  }

  /*
   * handle the connection logic of RabbitMQ
   *
   * @method connect
   *
   * @return {MessageQueue} this returning itself should be a good practice
   */

  async connect() {

    try {

      this.connection = await MessageQueue.messageQueueLib.connect(this.url)
      this.channel = await this.connection.createChannel()

    }catch (e) {

      throw e
    }

    return this

  }

  /*
   * handle the disconnection logic of beanstalk
   *
   * @method close
   *
   * @return {MessageQueue} this returning itself should be a good practice
   */

  async close() {

    if (!this.connection) return this

    await this.connection.close()
    this.connection = null
    this.channel = null
    return this

  }

  /*
   * handle the queue logic of beanstalk
   *
   * @method queueMessage
   *
   * @param {String} queueId indicate the queue to use
   * @param {String} payload should be equal to { queueTaskId: __queueTaskId__ }
   * @param {String} priority Jobs with lower priority numbers are reserved before jobs with higher priority numbers.
   * @param {String} delay the delay of the job
   *
   * @return {MessageQueue} this returning itself should be a good practice
   */

  async queueMessage(queueId, payload) {

    queueId = this.convertQueueIdToMessageQueueLevelId(queueId)

    try {

      await this.channel.assertQueue(queueId, { durable: true })
      await this.channel.sendToQueue(queueId, payload, { persistent: true })

    } catch(e) {

      throw e

    }

  }

  consumeMessage(queueId, handler) {

    queueId = this.convertQueueIdToMessageQueueLevelId(queueId)

    this.channel.assertQueue(queueId, {durable: true})

    this.channel.prefetch(this.prefetchCount)
    this.channel.consume(queueId, async (payload) => {

      let res
      let error

      try { res = await handler(payload)}
      catch(e) { error = e }

      //TODO: update to a retry-able flow
      if (error) { return this.channel.ack(payload) }


      return this.channel.ack(payload)

    })

  }

}

module.exports = MessageQueue
